export interface BookingEmailPartItem {
  part_no: string;
  part_name: string;
  quantity: number;
  het: number;
}

export interface SendBookingEmailDTO {
  ticket_no: string;
  nama_customer: string;
  email: string;
  plat_kendaraan?: string;
  tanggal_booking: string;
  jam_booking: string;
  jenis_servis: string;
  tipe_booking?: 'SERVIS' | 'SPAREPART';
  items?: BookingEmailPartItem[];
  total_harga?: number;
  metode_layanan?: 'AMBIL' | 'PASANG';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class EmailService {
  /**
   * Sends booking confirmation email to customer.
   * Uses native fetch to Resend REST API if RESEND_API_KEY is defined,
   * otherwise logs booking ticket confirmation safely.
   */
  public static async sendBookingTicketEmail(dto: SendBookingEmailDTO): Promise<boolean> {
    const resendApiKey = process.env.RESEND_API_KEY;

    const isSparepart = dto.tipe_booking === 'SPAREPART';
    const safeCustomer = escapeHtml(dto.nama_customer);
    const safeTicket = escapeHtml(dto.ticket_no);
    const safeTanggal = escapeHtml(dto.tanggal_booking);
    const safeJam = escapeHtml(dto.jam_booking);
    const safeServis = escapeHtml(dto.jenis_servis);
    const safePlat = escapeHtml(dto.plat_kendaraan || '-');
    const safeMetode = dto.metode_layanan === 'PASANG' ? 'Sekalian Pasang di Bengkel' : 'Ambil di Toko / Bengkel';

    let detailSectionHtml = '';

    if (isSparepart && dto.items && dto.items.length > 0) {
      const itemsRows = dto.items
        .map(
          (item) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #1e293b;">
                <strong>${escapeHtml(item.part_name)}</strong><br/>
                <span style="font-size: 11px; font-family: monospace; color: #64748b;">${escapeHtml(item.part_no)}</span>
              </td>
              <td style="padding: 8px 0; text-align: center; color: #475569;">${item.quantity} pcs</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #047857;">Rp ${(item.het * item.quantity).toLocaleString('id-ID')}</td>
            </tr>
          `
        )
        .join('');

      detailSectionHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 6px 0; text-align: left;">Suku Cadang</th>
              <th style="padding: 6px 0; text-align: center;">Jumlah</th>
              <th style="padding: 6px 0; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #e2e8f0;">
              <td colspan="2" style="padding: 10px 0; font-weight: bold; color: #1e293b;">Estimasi Total:</td>
              <td style="padding: 10px 0; text-align: right; font-size: 15px; font-weight: bold; color: #E4002B;">
                Rp ${(dto.total_harga || 0).toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Metode Layanan</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${safeMetode}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Jadwal Kedatangan / Ambil</td>
            <td style="padding: 8px 0; font-weight: bold; text-align: right;">${safeTanggal} — Pukul ${safeJam} WIB</td>
          </tr>
        </table>
      `;
    } else {
      detailSectionHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Plat Kendaraan</td>
            <td style="padding: 10px 0; font-weight: bold; text-align: right;">${safePlat}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Jadwal Servis</td>
            <td style="padding: 10px 0; font-weight: bold; text-align: right;">${safeTanggal} — Pukul ${safeJam} WIB</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">Layanan / Servis</td>
            <td style="padding: 10px 0; font-weight: bold; text-align: right;">${safeServis}</td>
          </tr>
        </table>
      `;
    }

    const titleText = isSparepart ? 'RESERVASI SUKU CADANG' : 'RESERVASI SERVIS MOTOR';
    const introText = isSparepart
      ? 'Terima kasih telah melakukan pemesanan suku cadang asli Honda di Bengkel AS Putra Rahmat.'
      : 'Terima kasih telah melakukan reservasi servis online di Bengkel AS Putra Rahmat.';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #E4002B; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; text-transform: uppercase;">AS PUTRA RAHMAT</h1>
          <p style="margin: 4px 0 0; font-size: 12px;">Dealer &amp; Bengkel Resmi Honda</p>
        </div>
        <div style="padding: 24px; background-color: #ffffff; color: #1e293b;">
          <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Halo, ${safeCustomer}!</p>
          <p style="font-size: 14px; color: #475569;">${introText}</p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">NOMOR TIKET ${titleText}</p>
            <p style="margin: 0; font-size: 22px; font-weight: bold; color: #E4002B; font-family: monospace;">${safeTicket}</p>
          </div>

          ${detailSectionHtml}

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Tunjukkan nomor tiket ini ke petugas kasir / bengkel saat Anda tiba di lokasi AHASS AS Putra Rahmat.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
          &copy; 2026 Bengkel AS Putra Rahmat — Dealer Resmi &amp; AHASS Honda Kuningan
        </div>
      </div>
    `;

    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'AS Putra Rahmat <booking@asputramotor.com>',
            to: [dto.email],
            subject: `[TIKET RESERVASI] ${dto.ticket_no} - AS Putra Rahmat`,
            html: htmlContent,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[EmailService] Email notification dispatch error: ${errText}`);
          return false;
        }

        return true;
      } catch (err) {
        console.error('[EmailService] Error dispatching email:', err);
        return false;
      }
    } else {
      console.log(`[EmailService] Ticket confirmation recorded for ${dto.email} (Ticket: ${dto.ticket_no})`);
      return true;
    }
  }
}
