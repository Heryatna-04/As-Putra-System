import xlsx from 'xlsx';
import { supabase } from '../config/supabase';
import { EmailService } from './email.service';

export interface CreateBookingDTO {
  nama_customer: string;
  email: string;
  no_hp: string;
  no_mesin: string;
  plat_kendaraan: string;
  tipe_motor?: string;
  tanggal_booking: string;
  jam_booking: string;
  jenis_servis: string;
  detail_lainnya?: string;
}

export interface BookingQueryFilters {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  tanggal_from?: string;
  tanggal_to?: string;
}

export class BookingService {
  /**
   * Helper mask phone number for CRM role
   */
  public static maskPhone(phone: string): string {
    const clean = phone.trim();
    if (clean.length <= 6) return '****';
    return clean.slice(0, 4) + '****' + clean.slice(-4);
  }

  /**
   * Generate ticket number: ASP-YYYYMMDD-XXXX
   */
  private static async generateTicketNo(dateStr: string): Promise<string> {
    const rawDate = new Date(dateStr);
    const yyyy = rawDate.getFullYear();
    const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
    const dd = String(rawDate.getDate()).padStart(2, '0');
    const prefix = `ASP-${yyyy}${mm}${dd}-`;

    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .like('ticket_no', `${prefix}%`);

    const seq = String((count ?? 0) + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  /**
   * Public Customer Booking creation
   */
  public static async createBooking(dto: CreateBookingDTO) {
    const ticketNo = await this.generateTicketNo(dto.tanggal_booking);

    const jenisServisString = Array.isArray(dto.jenis_servis)
      ? dto.jenis_servis.join(', ')
      : String(dto.jenis_servis);

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ticket_no: ticketNo,
        nama_customer: dto.nama_customer.trim(),
        email: dto.email.trim().toLowerCase(),
        no_hp: dto.no_hp.trim(),
        no_mesin: dto.no_mesin.trim().toUpperCase(),
        plat_kendaraan: dto.plat_kendaraan.trim().toUpperCase(),
        tipe_motor: dto.tipe_motor?.trim() || null,
        tanggal_booking: dto.tanggal_booking,
        jam_booking: dto.jam_booking,
        jenis_servis: jenisServisString,
        detail_lainnya: dto.detail_lainnya?.trim() || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal menyimpan booking: ${error.message}`);
    }

    // Dispatch automated confirmation email
    EmailService.sendBookingTicketEmail({
      ticket_no: data.ticket_no,
      nama_customer: data.nama_customer,
      email: data.email,
      plat_kendaraan: data.plat_kendaraan,
      tanggal_booking: data.tanggal_booking,
      jam_booking: data.jam_booking,
      jenis_servis: data.jenis_servis,
    }).catch((err) => console.error('[BookingService] Failed sending confirmation email:', err));

    return data;
  }

  /**
   * List bookings for Admin / CRM
   */
  public static async getBookings(filters: BookingQueryFilters, isCrm: boolean = false) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 15;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' });

    if (filters.status && filters.status !== 'ALL') {
      query = query.eq('status', filters.status);
    }

    if (filters.tanggal_from) {
      query = query.gte('tanggal_booking', filters.tanggal_from);
    }

    if (filters.tanggal_to) {
      query = query.lte('tanggal_booking', filters.tanggal_to);
    }

    if (filters.q) {
      const q = filters.q.replace(/[,()]/g, '').trim();
      if (q) {
        query = query.or(`nama_customer.ilike.%${q}%,ticket_no.ilike.%${q}%,plat_kendaraan.ilike.%${q}%`);
      }
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Gagal memuat booking: ${error.message}`);
    }

    // Return full data for CRM/Admin role
    const sanitizedData = (data || []).map((row: any) => ({
      ...row,
      no_hp: row.no_hp,
    }));

    return {
      bookings: sanitizedData,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * Get single booking detail
   */
  public static async getBookingById(id: string, isCrm: boolean = false) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error('Data booking tidak ditemukan');
    }

    return {
      ...data,
      no_hp: data.no_hp,
    };
  }

  /**
   * Update booking status (Admin only)
   */
  public static async updateStatus(id: string, status: string, catatan_admin?: string) {
    const updatePayload: Record<string, any> = { status };
    if (catatan_admin !== undefined) {
      updatePayload.catatan_admin = catatan_admin;
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal memperbarui status booking: ${error.message}`);
    }

    return data;
  }

  /**
   * Export bookings to Excel
   */
  public static async exportExcel(filters: BookingQueryFilters, isCrm: boolean = false): Promise<Buffer> {
    let query = supabase.from('bookings').select('*');

    if (filters.status && filters.status !== 'ALL') {
      query = query.eq('status', filters.status);
    }

    if (filters.tanggal_from) {
      query = query.gte('tanggal_booking', filters.tanggal_from);
    }

    if (filters.tanggal_to) {
      query = query.lte('tanggal_booking', filters.tanggal_to);
    }

    if (filters.q) {
      const q = filters.q.trim();
      query = query.or(`nama_customer.ilike.%${q}%,ticket_no.ilike.%${q}%,plat_kendaraan.ilike.%${q}%,email.ilike.%${q}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      throw new Error(`Gagal mengambil data untuk export: ${error.message}`);
    }

    const rows = (data || []).map((b: any) => {
      const formattedDate = b.created_at ? new Date(b.created_at).toLocaleString('id-ID') : '-';
      if (isCrm) {
        return {
          'No. Tiket': b.ticket_no,
          'Nama Customer': b.nama_customer,
          'Email / Gmail': b.email || '-',
          'No. Telepon / WA': b.no_hp,
          'No. Mesin': b.no_mesin,
          'Plat Kendaraan': b.plat_kendaraan,
          'Tanggal Servis': b.tanggal_booking,
          'Jam Servis': `${b.jam_booking} WIB`,
          'Jenis Servis': b.jenis_servis,
          'Keterangan Tambahan': b.detail_lainnya || '-',
          'Status': b.status,
          'Tanggal Reservasi': formattedDate,
        };
      }

      return {
        'No. Tiket': b.ticket_no,
        'Nama Customer': b.nama_customer,
        'Email / Gmail': b.email || '-',
        'No. Telepon / WA': b.no_hp,
        'No. Mesin': b.no_mesin,
        'Plat Kendaraan': b.plat_kendaraan,
        'Tanggal Servis': b.tanggal_booking,
        'Jam Servis': `${b.jam_booking} WIB`,
        'Jenis Servis': b.jenis_servis,
        'Keterangan Tambahan': b.detail_lainnya || '-',
        'Status': b.status,
        'Catatan Admin': b.catatan_admin || '-',
        'Tanggal Reservasi': formattedDate,
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, isCrm ? 'Data Booking CRM' : 'Data Booking');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer as Buffer;
  }
}

