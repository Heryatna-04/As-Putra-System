import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { supabase } from '../config/supabase';

export interface ExcelRow {
  part_no: string;
  part_name: string;
  category_detail?: string;
  het?: number;
  stok?: number;
  hpp?: number;
  uom?: string;
  status?: string;
  gambar_path?: string | null;
  detail?: Record<string, unknown>;
}

export interface PreviewResult {
  batch_id: string;
  file_format: 'AHASS_DEALER_MONTHLY' | 'STANDARD_CATALOG';
  periode?: string;
  total_rows: number;
  valid_rows: ExcelRow[];
  error_rows: { row: number; reason: string }[];
}

function getCategoryDetail(partName: string): string {
  const n = (partName || '').toUpperCase();
  if (n.includes('CHAIN') || n.includes('GIR') || n.includes('SPROCKET') || n.includes('DRIVE CHAIN')) return 'Rantai & Gir';
  if (n.includes('PAD') || n.includes('BRAKE') || n.includes('REM') || n.includes('CALIPER') || n.includes('DISC')) return 'Pengereman';
  if (n.includes('BELT') || n.includes('ROLLER') || n.includes('PULLEY') || n.includes('WEIGHT') || n.includes('CVT') || n.includes('CLUTCH') || n.includes('KOPLING')) return 'CVT & Transmisi';
  if (n.includes('OIL') && (n.includes('ENGINE') || n.includes('GEAR') || n.includes('PELUMAS') || n.includes('MPX') || n.includes('SPX'))) return 'Oli & Pelumas';
  if (n.includes('FILTER') || n.includes('SARINGAN') || n.includes('ELEMENT')) return 'Filter Udara & Oli';
  if (n.includes('SPARK') || n.includes('BUSI') || n.includes('PLUG')) return 'Sistem Pengapian';
  if (n.includes('TIRE') || n.includes('BAN') || n.includes('TUBE') || n.includes('WHEEL') || n.includes('VELG') || n.includes('SPOKE') || n.includes('TROMOL')) return 'Ban & Roda';
  if (n.includes('SEAL') || n.includes('GASKET') || n.includes('O-RING') || n.includes('PACKING')) return 'Seal & Gasket';
  if (n.includes('STEERING') || n.includes('RACE') || n.includes('HANDLE') || n.includes('FORK') || n.includes('SHOCK') || n.includes('CUSHION')) return 'Kemudi & Suspensi';
  if (n.includes('LAMP') || n.includes('BULB') || n.includes('LIGHT') || n.includes('BATTERY') || n.includes('AKI') || n.includes('COIL') || n.includes('STATOR') || n.includes('SWITCH') || n.includes('RELAY')) return 'Lampu & Kelistrikan';
  if (n.includes('SMART KEY') || n.includes('REMOTE') || n.includes('COVER') || n.includes('GARNISH') || n.includes('STRIPE') || n.includes('MARK') || n.includes('ACC')) return 'Aksesoris & Bodi';
  if (n.includes('PISTON') || n.includes('SEHER') || n.includes('CYLINDER') || n.includes('VALVE') || n.includes('CAMSHAFT') || n.includes('CRANKSHAFT') || n.includes('CRANK')) return 'Komponen Mesin';
  if (n.includes('BOLT') || n.includes('NUT') || n.includes('SCREW') || n.includes('WASHER') || n.includes('CLIP') || n.includes('PIN')) return 'Baut & Fastener';
  if (n.includes('CABLE') || n.includes('KABEL')) return 'Kabel & Selang';
  return 'Suku Cadang Honda';
}

/**
 * Scan local image directory once to map part_no -> filename for newly added parts
 */
let cachedLocalImageMap: Map<string, string> | null = null;
function getLocalImageMap(): Map<string, string> {
  if (cachedLocalImageMap) return cachedLocalImageMap;
  cachedLocalImageMap = new Map();
  try {
    const imagesDir = path.resolve(process.cwd(), '../frontend/public/images/parts');
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      for (const f of files) {
        const match = f.match(/^([A-Z0-9]+)_/i);
        if (match && match[1]) {
          const pNo = match[1].toUpperCase();
          if (!cachedLocalImageMap.has(pNo) || f.endsWith('-1.jpg')) {
            cachedLocalImageMap.set(pNo, f);
          }
        }
      }
    }
  } catch {
    // Graceful fallback if directory not accessible
  }
  return cachedLocalImageMap;
}

export const ImportService = {
  async previewExcel(fileBuffer: Buffer, fileName: string, uploadedBy: string): Promise<PreviewResult> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');

    // 1. Detect if this is the official AHASS Dealer Monthly Inventory Report
    let isDealerFormat = false;
    let headerRow = -1;
    let colKode = 2; // Default to index 2 (col C)
    let periode = 'BULANAN';

    for (let R = range.s.r; R <= Math.min(range.e.r, 15); ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.v) {
          const val = String(cell.v).trim();
          if (/periode\s*:\s*(.+)/i.test(val)) {
            const m = val.match(/periode\s*:\s*(.+)/i);
            if (m) periode = m[1].trim();
          }
          if (/kode\s*item|part\s*no/i.test(val)) {
            headerRow = R;
            colKode = C;
            isDealerFormat = true;
            break;
          }
        }
      }
      if (headerRow !== -1) break;
    }

    const validRows: ExcelRow[] = [];
    const errorRows: { row: number; reason: string }[] = [];

    if (isDealerFormat && headerRow !== -1) {
      // ── AHASS DEALER REPORT FORMAT (supports both clean row 1 and raw row 7) ──
      for (let r = headerRow + 1; r <= range.e.r; ++r) {
        const cellPartNo = sheet[XLSX.utils.encode_cell({ r, c: colKode })];
        const cellPartName = sheet[XLSX.utils.encode_cell({ r, c: colKode + 1 })];
        const cellUom = sheet[XLSX.utils.encode_cell({ r, c: colKode + 2 })];
        const cellType = sheet[XLSX.utils.encode_cell({ r, c: colKode + 3 })];
        const cellQtyAwal = sheet[XLSX.utils.encode_cell({ r, c: colKode + 4 })];
        const cellHppAwal = sheet[XLSX.utils.encode_cell({ r, c: colKode + 5 })];
        const cellQtyIn = sheet[XLSX.utils.encode_cell({ r, c: colKode + 7 })];
        const cellQtyOut = sheet[XLSX.utils.encode_cell({ r, c: colKode + 10 })];
        const cellQtyAkhir = sheet[XLSX.utils.encode_cell({ r, c: colKode + 13 })];
        const cellHppAkhir = sheet[XLSX.utils.encode_cell({ r, c: colKode + 14 })];
        const cellSaldoAkhir = sheet[XLSX.utils.encode_cell({ r, c: colKode + 15 })];

        if (!cellPartNo || !cellPartNo.v) continue;
        const partNo = String(cellPartNo.v).trim();
        if (!partNo || partNo.toLowerCase() === 'total' || partNo.toLowerCase() === 'jumlah') continue;

        const partName = cellPartName && cellPartName.v ? String(cellPartName.v).trim() : '';
        if (!partName) {
          errorRows.push({ row: r + 1, reason: `Baris ${r + 1}: Nama produk kosong untuk part ${partNo}` });
          continue;
        }

        const qtyAkhir = cellQtyAkhir && cellQtyAkhir.v ? Number(cellQtyAkhir.v) || 0 : 0;
        const hppAkhir = cellHppAkhir && cellHppAkhir.v ? Number(cellHppAkhir.v) || 0 : 0;
        const saldoAkhir = cellSaldoAkhir && cellSaldoAkhir.v ? Number(cellSaldoAkhir.v) || 0 : 0;

        // Suggested HET with AHASS markup (rounded to nearest 500 IDR)
        const suggestedHet = hppAkhir > 0 ? Math.round((hppAkhir * 1.25) / 500) * 500 : 0;

        validRows.push({
          part_no: partNo,
          part_name: partName,
          category_detail: getCategoryDetail(partName),
          het: suggestedHet,
          stok: qtyAkhir,
          hpp: hppAkhir,
          uom: cellUom && cellUom.v ? String(cellUom.v).trim() : 'Pcs',
          status: 'ACTIVE',
          detail: {
            periode,
            uom: cellUom && cellUom.v ? String(cellUom.v).trim() : 'Pcs',
            type: cellType && cellType.v ? String(cellType.v).trim() : 'Sparepart',
            qty_awal: cellQtyAwal && cellQtyAwal.v ? Number(cellQtyAwal.v) || 0 : 0,
            hpp_awal: cellHppAwal && cellHppAwal.v ? Number(cellHppAwal.v) || 0 : 0,
            qty_in: cellQtyIn && cellQtyIn.v ? Number(cellQtyIn.v) || 0 : 0,
            qty_out: cellQtyOut && cellQtyOut.v ? Number(cellQtyOut.v) || 0 : 0,
            qty_akhir: qtyAkhir,
            hpp_akhir: hppAkhir,
            saldo_akhir: saldoAkhir,
          },
        });
      }
    } else {
      // ── STANDARD CSV/XLSX FORMAT (Header on row 1) ──
      const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
      rawRows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const normalized: Record<string, unknown> = {};
        Object.keys(row).forEach((key) => {
          normalized[key.toLowerCase().replace(/\s+/g, '_')] = row[key];
        });

        const partNo = String(normalized['part_no'] ?? normalized['part no'] ?? normalized['kode_item'] ?? '').trim();
        const partName = String(normalized['part_name'] ?? normalized['part name'] ?? normalized['nama_produk'] ?? normalized['description'] ?? '').trim();

        if (!partNo) {
          errorRows.push({ row: rowNum, reason: 'part_no kosong' });
          return;
        }
        if (!partName) {
          errorRows.push({ row: rowNum, reason: 'part_name kosong' });
          return;
        }

        const het = parseFloat(String(normalized['het'] ?? normalized['harga'] ?? normalized['price'] ?? '0'));
        const stok = parseInt(String(normalized['stok'] ?? normalized['stock'] ?? normalized['qty'] ?? '0'), 10);

        validRows.push({
          part_no: partNo,
          part_name: partName,
          category_detail: String(normalized['category_detail'] ?? normalized['category'] ?? '').trim() || getCategoryDetail(partName),
          het: isNaN(het) ? undefined : het,
          stok: isNaN(stok) ? 0 : stok,
          status: 'ACTIVE',
        });
      });
    }

    // Save batch record in Supabase with PREVIEW status
    const totalRowsCount = validRows.length + errorRows.length;
    const { data: batch, error } = await supabase
      .from('import_batches')
      .insert({
        file_name: fileName,
        uploaded_by: uploadedBy,
        status: 'PREVIEW',
        total_rows: totalRowsCount,
        processed_rows: 0,
        inserted_rows: 0,
        updated_rows: 0,
        skipped_rows: errorRows.length,
        error_rows: errorRows.length,
        notes: JSON.stringify({
          format: isDealerFormat ? 'AHASS_DEALER_MONTHLY' : 'STANDARD_CATALOG',
          periode,
          valid_rows: validRows,
          error_rows: errorRows,
        }),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      batch_id: batch.id,
      file_format: isDealerFormat ? 'AHASS_DEALER_MONTHLY' : 'STANDARD_CATALOG',
      periode,
      total_rows: totalRowsCount,
      valid_rows: validRows,
      error_rows: errorRows,
    };
  },

  async confirmImport(batchId: string) {
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .select('*')
      .eq('id', batchId)
      .eq('status', 'PREVIEW')
      .single();

    if (batchError || !batch) {
      throw new Error('Batch tidak ditemukan atau sudah diproses');
    }

    await supabase
      .from('import_batches')
      .update({ status: 'PROCESSING' })
      .eq('id', batchId);

    const notes = JSON.parse(batch.notes ?? '{}');
    const validRows: ExcelRow[] = notes.valid_rows ?? [];
    const localImages = getLocalImageMap();

    let insertedRows = 0;
    let updatedRows = 0;
    let photosPreserved = 0;
    let newPhotosLinked = 0;

    // Process in batches of 200 items
    const BATCH_SIZE = 200;
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batchChunk = validRows.slice(i, i + BATCH_SIZE);
      const partNos = batchChunk.map((r) => r.part_no.toUpperCase().trim());

      // Fetch existing parts to strictly preserve existing photos and existing HET
      const { data: existingParts, error: fetchErr } = await supabase
        .from('spare_parts')
        .select('part_no, part_name, het, stok, gambar_path')
        .in('part_no', partNos);

      if (fetchErr) throw fetchErr;

      const existingMap = new Map((existingParts ?? []).map((p) => [p.part_no.toUpperCase().trim(), p]));

      const upsertPayload = batchChunk.map((row) => {
        const pKey = row.part_no.toUpperCase().trim();
        const existing = existingMap.get(pKey);

        let finalPhoto: string | null = null;
        if (existing && existing.gambar_path) {
          finalPhoto = existing.gambar_path; // 100% PRESERVE EXISTING PHOTO
          photosPreserved++;
        } else if (localImages.has(pKey)) {
          finalPhoto = localImages.get(pKey) || null;
          if (finalPhoto) newPhotosLinked++;
        }

        // Preserve established HET if available
        const finalHet = existing && existing.het && existing.het > 0 ? existing.het : (row.het ?? null);

        return {
          part_no: row.part_no,
          part_name: row.part_name,
          category_detail: row.category_detail ?? (existing ? (existing as Record<string, unknown>).category_detail : 'Suku Cadang Honda'),
          het: finalHet,
          stok: row.stok !== undefined ? Math.max(0, Math.round(Number(row.stok) || 0)) : (existing ? Math.max(0, Number((existing as Record<string, unknown>).stok) || 0) : 0),
          gambar_path: finalPhoto,
          detail: row.detail ?? null,
          status: 'ACTIVE',
        };
      });

      const { error: upsertErr } = await supabase
        .from('spare_parts')
        .upsert(upsertPayload, { onConflict: 'part_no' });

      if (upsertErr) throw upsertErr;

      for (const row of batchChunk) {
        if (existingMap.has(row.part_no.toUpperCase().trim())) {
          updatedRows++;
        } else {
          insertedRows++;
        }
      }
    }

    // Complete batch
    await supabase
      .from('import_batches')
      .update({
        status: 'COMPLETED',
        processed_rows: validRows.length,
        inserted_rows: insertedRows,
        updated_rows: updatedRows,
        finished_at: new Date().toISOString(),
        notes: JSON.stringify({
          summary: `Selesai: ${insertedRows} part baru, ${updatedRows} part terupdate stok & HPP. ${photosPreserved} foto lama dipertahankan, ${newPhotosLinked} foto baru terhubung.`,
          completed_at: new Date().toISOString(),
        }),
      })
      .eq('id', batchId);

    return {
      batch_id: batchId,
      inserted_rows: insertedRows,
      updated_rows: updatedRows,
      photos_preserved: photosPreserved,
      new_photos_linked: newPhotosLinked,
      total_processed: validRows.length,
    };
  },

  async getImportHistory() {
    const { data, error } = await supabase
      .from('import_batches')
      .select('id, file_name, uploaded_at, status, total_rows, inserted_rows, updated_rows, skipped_rows, error_rows, finished_at, notes')
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
