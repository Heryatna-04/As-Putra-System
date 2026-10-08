import * as XLSX from 'xlsx';
import { supabase } from '../config/supabase';

interface ExcelRow {
  part_no: string;
  part_name: string;
  category_detail?: string;
  het?: number;
  status?: string;
}

interface PreviewResult {
  batch_id: string;
  total_rows: number;
  valid_rows: ExcelRow[];
  error_rows: { row: number; reason: string }[];
}



export const ImportService = {
  async previewExcel(fileBuffer: Buffer, fileName: string, uploadedBy: string): Promise<PreviewResult> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const validRows: ExcelRow[] = [];
    const errorRows: { row: number; reason: string }[] = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // row 1 = header

      // Normalize keys to lowercase
      const normalized: Record<string, any> = {};
      Object.keys(row).forEach((key) => {
        normalized[key.toLowerCase().replace(/\s+/g, '_')] = row[key];
      });

      const partNo = String(normalized['part_no'] ?? normalized['part no'] ?? '').trim();
      const partName = String(normalized['part_name'] ?? normalized['part name'] ?? normalized['description'] ?? '').trim();

      if (!partNo) {
        errorRows.push({ row: rowNum, reason: 'part_no kosong' });
        return;
      }
      if (!partName) {
        errorRows.push({ row: rowNum, reason: 'part_name kosong' });
        return;
      }

      const het = parseFloat(normalized['het'] ?? normalized['harga'] ?? normalized['price'] ?? '0');

      validRows.push({
        part_no: partNo,
        part_name: partName,
        category_detail: String(normalized['category_detail'] ?? normalized['category'] ?? normalized['new_matgroup'] ?? '').trim() || undefined,
        het: isNaN(het) ? undefined : het,
        status: 'ACTIVE',
      });
    });

    // Create import_batch record with PREVIEW status
    const { data: batch, error } = await supabase
      .from('import_batches')
      .insert({
        file_name: fileName,
        uploaded_by: uploadedBy,
        status: 'PREVIEW',
        total_rows: rawRows.length,
        processed_rows: 0,
        inserted_rows: 0,
        updated_rows: 0,
        skipped_rows: errorRows.length,
        error_rows: errorRows.length,
        notes: JSON.stringify({ valid_rows: validRows, error_rows: errorRows }),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      batch_id: batch.id,
      total_rows: rawRows.length,
      valid_rows: validRows,
      error_rows: errorRows,
    };
  },

  async confirmImport(batchId: string) {
    // Get batch data
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .select('*')
      .eq('id', batchId)
      .eq('status', 'PREVIEW')
      .single();

    if (batchError || !batch) {
      throw new Error('Batch tidak ditemukan atau sudah diproses');
    }

    // Update status to PROCESSING
    await supabase
      .from('import_batches')
      .update({ status: 'PROCESSING' })
      .eq('id', batchId);

    const notes = JSON.parse(batch.notes ?? '{}');
    const validRows: ExcelRow[] = notes.valid_rows ?? [];

    let insertedRows = 0;
    let updatedRows = 0;

    // Process in batch chunks (200 items per batch) to prevent memory overload & timeout
    const BATCH_SIZE = 200;
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batchChunk = validRows.slice(i, i + BATCH_SIZE);
      const partNos = batchChunk.map(r => r.part_no);

      const { data: existingParts } = await supabase
        .from('spare_parts')
        .select('part_no')
        .in('part_no', partNos);

      const existingSet = new Set((existingParts ?? []).map(p => p.part_no));

      const toInsert: any[] = [];
      for (const row of batchChunk) {
        if (existingSet.has(row.part_no)) {
          await supabase
            .from('spare_parts')
            .update({
              part_name: row.part_name,
              category_detail: row.category_detail ?? null,
              het: row.het ?? null,
              status: 'ACTIVE',
            })
            .eq('part_no', row.part_no);
          updatedRows++;
        } else {
          toInsert.push({
            part_no: row.part_no,
            part_name: row.part_name,
            category_detail: row.category_detail ?? null,
            het: row.het ?? null,
            stok: 0,
            status: 'ACTIVE',
          });
        }
      }

      if (toInsert.length > 0) {
        await supabase.from('spare_parts').insert(toInsert);
        insertedRows += toInsert.length;
      }
    }

    // Update batch to COMPLETED
    const { data: updatedBatch, error: updateError } = await supabase
      .from('import_batches')
      .update({
        status: 'COMPLETED',
        processed_rows: validRows.length,
        inserted_rows: insertedRows,
        updated_rows: updatedRows,
        finished_at: new Date().toISOString(),
      })
      .eq('id', batchId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      batch_id: batchId,
      inserted_rows: insertedRows,
      updated_rows: updatedRows,
      total_processed: validRows.length,
    };
  },

  async getImportHistory() {
    const { data, error } = await supabase
      .from('import_batches')
      .select('id, file_name, uploaded_at, status, total_rows, inserted_rows, updated_rows, skipped_rows, error_rows, finished_at')
      .order('uploaded_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data ?? [];
  },

  async getImportDetail(id: string) {
    const { data, error } = await supabase
      .from('import_batches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};
