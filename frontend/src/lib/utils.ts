/** Format number to IDR currency string */
export function formatIDR(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

/** Build a WhatsApp deep-link URL with pre-filled message */
export function buildWaUrl(partNo: string, partName: string): string {
  const waNumber =
    process.env.NEXT_PUBLIC_WA_NUMBER ?? '6281111116408';
  const msg = `Halo AS Putra Rahmat, saya ingin menanyakan ketersediaan spare part:\n\n*${partName}*\nPart No: ${partNo}\n\nApakah masih tersedia?`;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
}

/** Build WhatsApp URL for booking confirmation */
export function buildBookingWaUrl(data: {
  nama: string;
  noHp: string;
  tipeMotor?: string;
  plat?: string;
  noMesin?: string;
  paketServis?: string;
  tanggal?: string;
  jam?: string;
  catatan?: string;
  ticketNo?: string;
}): string {
  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER ?? '6281111116408';
  
  const lines: string[] = [
    "RESERVASI BOOKING SERVIS AHASS AS PUTRA",
    "====================================",
  ];

  if (data.ticketNo) lines.push(`No. Tiket: ${data.ticketNo}`);
  if (data.nama) lines.push(`Nama Pemilik: ${data.nama}`);
  if (data.noHp) lines.push(`No. WhatsApp: ${data.noHp}`);
  if (data.tipeMotor || data.plat) {
    lines.push(`Kendaraan: ${data.tipeMotor || '-'} (${data.plat ? data.plat.toUpperCase() : '-'})`);
  }
  if (data.noMesin) lines.push(`No. Mesin: ${data.noMesin.toUpperCase()}`);
  if (data.paketServis) lines.push(`Paket Servis: ${data.paketServis}`);
  if (data.tanggal || data.jam) {
    lines.push(`Jadwal: ${data.tanggal || '-'} jam ${data.jam || '-'}`);
  }
  if (data.catatan) lines.push(`Catatan: ${data.catatan}`);

  lines.push("====================================");
  lines.push("Halo Admin AHASS AS Putra, mohon konfirmasi jadwal & ketersediaannya. Terima kasih!");

  const msg = lines.join("\n");
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
}

/** Clamp string with ellipsis */
export function clamp(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/** Calculate total pages */
export function totalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit));
}

