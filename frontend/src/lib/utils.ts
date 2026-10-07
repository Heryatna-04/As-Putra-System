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

/** Clamp string with ellipsis */
export function clamp(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/** Calculate total pages */
export function totalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit));
}
