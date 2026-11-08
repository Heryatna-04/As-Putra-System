/**
 * Official AHASS AS Putra Motor Monthly Inventory Sync Tool
 * Usage: node sync_dealer_inventory.js [path/to/PERSEDIAAN.xlsx]
 */

const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function getCategoryDetail(partName) {
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

async function syncInventory() {
  const filePath = process.argv[2] || path.resolve(__dirname, '../PERSEDIAAN OKTOBER.xlsx');
  console.log('=====================================================');
  console.log('  AHASS AS PUTRA MOTOR - INVENTORY SYNC ENGINE');
  console.log('=====================================================');
  console.log(`Loading file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const range = xlsx.utils.decode_range(sheet['!ref']);

  let headerRow = -1;
  let periode = 'OKTOBER 2026';

  for (let R = range.s.r; R <= Math.min(range.e.r, 15); ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = sheet[xlsx.utils.encode_cell({ r: R, c: C })];
      if (cell && cell.v) {
        const val = String(cell.v).trim();
        if (/periode\s*:\s*(.+)/i.test(val)) {
          const m = val.match(/periode\s*:\s*(.+)/i);
          if (m) periode = m[1].trim();
        }
        if (/kode\s*item|part\s*no/i.test(val)) {
          headerRow = R;
          break;
        }
      }
    }
    if (headerRow !== -1) break;
  }

  if (headerRow === -1) {
    console.error('Failed to locate header row (Kode Item / Part No). Aborting.');
    process.exit(1);
  }

  console.log(`Detected Report Periode: "${periode}" (Header at row ${headerRow + 1})`);

  // Scan local image directory
  const imagesDir = path.resolve(__dirname, '../frontend/public/images/parts');
  const localImageMap = new Map();
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    for (const f of files) {
      const match = f.match(/^([A-Z0-9]+)_/i);
      if (match && match[1]) {
        const pNo = match[1].toUpperCase();
        if (!localImageMap.has(pNo) || f.endsWith('-1.jpg')) {
          localImageMap.set(pNo, f);
        }
      }
    }
  }
  console.log(`Local image library: ${localImageMap.size} unique part numbers indexed.`);

  // Parse items
  const validItems = [];
  for (let r = headerRow + 1; r <= range.e.r; ++r) {
    const cellPartNo = sheet[xlsx.utils.encode_cell({ r, c: 2 })];
    const cellPartName = sheet[xlsx.utils.encode_cell({ r, c: 3 })];
    const cellUom = sheet[xlsx.utils.encode_cell({ r, c: 4 })];
    const cellType = sheet[xlsx.utils.encode_cell({ r, c: 5 })];
    const cellQtyAwal = sheet[xlsx.utils.encode_cell({ r, c: 6 })];
    const cellHppAwal = sheet[xlsx.utils.encode_cell({ r, c: 7 })];
    const cellQtyIn = sheet[xlsx.utils.encode_cell({ r, c: 9 })];
    const cellQtyOut = sheet[xlsx.utils.encode_cell({ r, c: 12 })];
    const cellQtyAkhir = sheet[xlsx.utils.encode_cell({ r, c: 15 })];
    const cellHppAkhir = sheet[xlsx.utils.encode_cell({ r, c: 16 })];
    const cellSaldoAkhir = sheet[xlsx.utils.encode_cell({ r, c: 17 })];

    if (!cellPartNo || !cellPartNo.v) continue;
    const partNo = String(cellPartNo.v).trim();
    if (!partNo || partNo.toLowerCase() === 'total' || partNo.toLowerCase() === 'jumlah') continue;

    const partName = cellPartName && cellPartName.v ? String(cellPartName.v).trim() : '';
    if (!partName) continue;

    const qtyAkhir = cellQtyAkhir && cellQtyAkhir.v ? Number(cellQtyAkhir.v) || 0 : 0;
    const hppAkhir = cellHppAkhir && cellHppAkhir.v ? Number(cellHppAkhir.v) || 0 : 0;
    const saldoAkhir = cellSaldoAkhir && cellSaldoAkhir.v ? Number(cellSaldoAkhir.v) || 0 : 0;
    const suggestedHet = hppAkhir > 0 ? Math.round((hppAkhir * 1.25) / 500) * 500 : 0;

    validItems.push({
      part_no: partNo,
      part_name: partName,
      category_detail: getCategoryDetail(partName),
      stok: qtyAkhir,
      hpp: hppAkhir,
      het: suggestedHet,
      saldo_akhir: saldoAkhir,
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

  console.log(`Parsed ${validItems.length} official inventory items from sheet.`);

  // Upsert in batches of 100 to Supabase
  const BATCH_SIZE = 100;
  let totalUpdated = 0;
  let totalInserted = 0;
  let totalPhotosPreserved = 0;
  let totalNewPhotosLinked = 0;

  for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
    const chunk = validItems.slice(i, i + BATCH_SIZE);
    const partNos = chunk.map(c => c.part_no.toUpperCase().trim());

    // Fetch existing records in chunk
    const { data: existing, error: fetchErr } = await supabase
      .from('spare_parts')
      .select('part_no, het, stok, gambar_path, category_detail')
      .in('part_no', partNos);

    if (fetchErr) throw fetchErr;

    const existingMap = new Map((existing || []).map(p => [p.part_no.toUpperCase().trim(), p]));

    const payload = chunk.map(item => {
      const pKey = item.part_no.toUpperCase().trim();
      const exist = existingMap.get(pKey);

      let finalPhoto = null;
      if (exist && exist.gambar_path) {
        finalPhoto = exist.gambar_path; // 100% PRESERVE EXISTING PHOTO
        totalPhotosPreserved++;
      } else if (localImageMap.has(pKey)) {
        finalPhoto = localImageMap.get(pKey);
        totalNewPhotosLinked++;
      }

      // Preserve existing established HET if available
      const finalHet = (exist && exist.het && exist.het > 0) ? exist.het : item.het;

      return {
        part_no: item.part_no,
        part_name: item.part_name,
        category_detail: item.category_detail,
        het: finalHet,
        stok: Math.max(0, Math.round(Number(item.stok) || 0)),
        gambar_path: finalPhoto,
        detail: item.detail,
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      };
    });

    const { error: upsertErr } = await supabase
      .from('spare_parts')
      .upsert(payload, { onConflict: 'part_no' });

    if (upsertErr) throw upsertErr;

    for (const item of chunk) {
      if (existingMap.has(item.part_no.toUpperCase().trim())) totalUpdated++;
      else totalInserted++;
    }

    const progress = Math.min(i + BATCH_SIZE, validItems.length);
    console.log(`[Sync Progress] ${progress}/${validItems.length} (${((progress / validItems.length) * 100).toFixed(0)}%) items committed to DB.`);
  }

  // Create an import_batches record for audit tracking
  await supabase.from('import_batches').insert({
    file_name: path.basename(filePath),
    uploaded_by: '00000000-0000-0000-0000-000000000000', // System / Automated Sync
    status: 'COMPLETED',
    total_rows: validItems.length,
    processed_rows: validItems.length,
    inserted_rows: totalInserted,
    updated_rows: totalUpdated,
    skipped_rows: 0,
    error_rows: 0,
    finished_at: new Date().toISOString(),
    notes: JSON.stringify({
      format: 'AHASS_DEALER_MONTHLY',
      periode,
      summary: `Sinkronisasi persediaan resmi AHASS periode ${periode} sukses: ${totalUpdated} diperbarui, ${totalInserted} baru. ${totalPhotosPreserved} foto lama aman dipertahankan, ${totalNewPhotosLinked} foto baru terhubung.`,
    }),
  });

  console.log('\n=====================================================');
  console.log('  SYNC COMPLETED SUCCESSFULLY!');
  console.log('=====================================================');
  console.log(`Total Items Processed     : ${validItems.length}`);
  console.log(`Existing Items Updated    : ${totalUpdated}`);
  console.log(`New Items Added           : ${totalInserted}`);
  console.log(`Existing Photos Preserved : ${totalPhotosPreserved} (100% AMAN, TIDAK DIHAPUS)`);
  console.log(`New Photos Linked         : ${totalNewPhotosLinked}`);
  console.log(`Target Periode            : ${periode}`);
  console.log('=====================================================\n');
}

syncInventory().catch(err => {
  console.error('Fatal Sync Error:', err);
  process.exit(1);
});
