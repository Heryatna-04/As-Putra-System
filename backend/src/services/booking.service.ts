import xlsx from 'xlsx';
import { supabase } from '../config/supabase';
import { EmailService } from './email.service';

export interface BookingSparePartItem {
  part_no: string;
  part_name: string;
  nama_umum?: string | null;
  quantity: number;
  het: number;
  gambar_url?: string | null;
}

export interface CreateBookingDTO {
  nama_customer: string;
  email: string;
  no_hp: string;
  no_mesin?: string;
  plat_kendaraan?: string;
  tipe_motor?: string;
  tanggal_booking: string;
  jam_booking: string;
  jenis_servis?: string | string[];
  detail_lainnya?: string;
  tipe_booking?: 'SERVIS' | 'SPAREPART';
  items?: BookingSparePartItem[];
  total_harga?: number;
  metode_layanan?: 'AMBIL' | 'PASANG';
}

export interface BookingQueryFilters {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
  tanggal_from?: string;
  tanggal_to?: string;
  tipe_booking?: string;
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
   * Helper mask customer name for public tracking privacy (e.g., "Budi Santoso" -> "Budi S***")
   */
  public static maskName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return 'Pelanggan';
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      const single = parts[0];
      if (single.length <= 3) return single;
      return single.slice(0, 3) + '***';
    }
    return parts[0] + ' ' + parts.slice(1).map(p => p.charAt(0) + '***').join(' ');
  }

  /**
   * Generate ticket number:
   * SRV-YYYYMMDD-XXXX (Servis Motor) or PRT-YYYYMMDD-XXXX (Suku Cadang)
   */
  private static async generateTicketNo(dateStr: string, tipeBooking: string = 'SERVIS', attempt: number = 0): Promise<string> {
    const rawDate = new Date(dateStr);
    const yyyy = rawDate.getFullYear();
    const mm = String(rawDate.getMonth() + 1).padStart(2, '0');
    const dd = String(rawDate.getDate()).padStart(2, '0');
    const prefix = tipeBooking === 'SPAREPART' ? `PRT-${yyyy}${mm}${dd}-` : `SRV-${yyyy}${mm}${dd}-`;

    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .like('ticket_no', `${prefix}%`);

    const nextVal = (count ?? 0) + 1 + attempt;
    const seq = String(nextVal).padStart(4, '0');

    if (attempt > 0) {
      const rand = Math.random().toString(36).substring(2, 4).toUpperCase();
      return `${prefix}${seq}-${rand}`;
    }

    return `${prefix}${seq}`;
  }

  /**
   * Public Customer Booking creation (Servis & Spare Part)
   */
  public static async createBooking(dto: CreateBookingDTO) {
    const isSparepart = dto.tipe_booking === 'SPAREPART';

    let calculatedTotal = dto.total_harga ?? 0;
    if (isSparepart && (!calculatedTotal || calculatedTotal <= 0) && dto.items && dto.items.length > 0) {
      calculatedTotal = dto.items.reduce((acc, it) => acc + (it.het || 0) * (it.quantity || 1), 0);
    }

    const defaultServiceTitle = isSparepart
      ? `Pemesanan Suku Cadang (${dto.items?.length || 0} Item)`
      : 'Servis Kendaraan';

    const jenisServisString = dto.jenis_servis
      ? (Array.isArray(dto.jenis_servis) ? dto.jenis_servis.join(', ') : String(dto.jenis_servis))
      : defaultServiceTitle;

    const bookingPayload = {
      nama_customer: dto.nama_customer.trim(),
      email: dto.email.trim().toLowerCase(),
      no_hp: dto.no_hp.trim(),
      no_mesin: dto.no_mesin?.trim() ? dto.no_mesin.trim().toUpperCase() : '-',
      plat_kendaraan: dto.plat_kendaraan?.trim() ? dto.plat_kendaraan.trim().toUpperCase() : '-',
      tipe_motor: dto.tipe_motor?.trim() || null,
      tanggal_booking: dto.tanggal_booking,
      jam_booking: dto.jam_booking,
      jenis_servis: jenisServisString,
      detail_lainnya: dto.detail_lainnya?.trim() || null,
      status: 'PENDING' as const,
      tipe_booking: isSparepart ? 'SPAREPART' : 'SERVIS',
      items_json: isSparepart && dto.items ? dto.items : null,
      total_harga: calculatedTotal,
      metode_layanan: dto.metode_layanan || 'AMBIL',
    };

    let data: any = null;
    let insertError: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const ticketNo = await this.generateTicketNo(dto.tanggal_booking, bookingPayload.tipe_booking, attempt);
      const res = await supabase
        .from('bookings')
        .insert({ ...bookingPayload, ticket_no: ticketNo })
        .select()
        .single();

      if (!res.error) {
        data = res.data;
        insertError = null;
        break;
      }

      insertError = res.error;
      const isDuplicate = res.error.message?.includes('duplicate key') || res.error.message?.includes('ticket_no');
      if (!isDuplicate) {
        break;
      }
    }

    if (insertError || !data) {
      throw new Error(`Gagal menyimpan booking: ${insertError?.message || 'Terjadi kesalahan sistem'}`);
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
      tipe_booking: data.tipe_booking,
      items: data.items_json || undefined,
      total_harga: data.total_harga || undefined,
      metode_layanan: data.metode_layanan || undefined,
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

    if (filters.tipe_booking && filters.tipe_booking !== 'ALL') {
      query = query.eq('tipe_booking', filters.tipe_booking);
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
        query = query.or(`nama_customer.ilike.%${q}%,ticket_no.ilike.%${q}%,plat_kendaraan.ilike.%${q}%,email.ilike.%${q}%`);
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
   * Public Ticket Status Tracking (Self-service by Customer)
   */
  public static async trackBooking(ticketNo: string) {
    const cleanTicket = ticketNo.trim().toUpperCase();
    if (!cleanTicket) {
      throw new Error('Nomor tiket wajib diisi');
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('id, ticket_no, tipe_booking, status, nama_customer, no_hp, plat_kendaraan, tipe_motor, tanggal_booking, jam_booking, jenis_servis, metode_layanan, items_json, total_harga, created_at')
      .ilike('ticket_no', cleanTicket)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Tiket tidak ditemukan. Pastikan nomor tiket yang Anda masukkan sudah benar.');
    }

    return {
      ticket_no: data.ticket_no,
      tipe_booking: data.tipe_booking || 'SERVIS',
      status: data.status,
      nama_customer: this.maskName(data.nama_customer),
      no_hp: this.maskPhone(data.no_hp),
      plat_kendaraan: data.plat_kendaraan || '-',
      tipe_motor: data.tipe_motor || '-',
      tanggal_booking: data.tanggal_booking,
      jam_booking: data.jam_booking,
      jenis_servis: data.jenis_servis,
      metode_layanan: data.metode_layanan || 'AMBIL',
      items: data.items_json,
      total_harga: data.total_harga,
      created_at: data.created_at,
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

    if (filters.tipe_booking && filters.tipe_booking !== 'ALL') {
      query = query.eq('tipe_booking', filters.tipe_booking);
    }

    if (filters.tanggal_from) {
      query = query.gte('tanggal_booking', filters.tanggal_from);
    }

    if (filters.tanggal_to) {
      query = query.lte('tanggal_booking', filters.tanggal_to);
    }

    if (filters.q) {
      const q = filters.q.replace(/[,():;"'%_\\]/g, '').trim();
      if (q) {
        query = query.or(`nama_customer.ilike.%${q}%,ticket_no.ilike.%${q}%,plat_kendaraan.ilike.%${q}%,email.ilike.%${q}%`);
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      throw new Error(`Gagal mengambil data untuk export: ${error.message}`);
    }

    const rows = (data || []).map((b: any) => {
      const formattedDate = b.created_at ? new Date(b.created_at).toLocaleString('id-ID') : '-';
      const isPart = b.tipe_booking === 'SPAREPART';
      const itemsSummary = Array.isArray(b.items_json)
        ? b.items_json.map((it: any) => `${it.part_name} (${it.part_no}) x${it.quantity}`).join('; ')
        : (b.jenis_servis || '-');

      if (isCrm) {
        return {
          'No. Tiket': b.ticket_no,
          'Tipe Booking': isPart ? 'Suku Cadang' : 'Servis Motor',
          'Nama Customer': b.nama_customer,
          'Email / Gmail': b.email || '-',
          'No. Telepon / WA': b.no_hp,
          'Tipe Motor': b.tipe_motor || '-',
          'Plat Kendaraan': b.plat_kendaraan || '-',
          'No. Mesin': b.no_mesin || '-',
          'Jadwal Booking': `${b.tanggal_booking} (${b.jam_booking} WIB)`,
          'Layanan / Suku Cadang': isPart ? itemsSummary : b.jenis_servis,
          'Metode Layanan': isPart ? (b.metode_layanan === 'PASANG' ? 'Pasang di Bengkel' : 'Ambil di Toko') : 'Servis di Bengkel',
          'Total Biaya': isPart && b.total_harga ? `Rp ${Number(b.total_harga).toLocaleString('id-ID')}` : '-',
          'Keterangan Tambahan': b.detail_lainnya || '-',
          'Status': b.status,
          'Tanggal Reservasi': formattedDate,
        };
      }

      return {
        'No. Tiket': b.ticket_no,
        'Tipe Booking': isPart ? 'Suku Cadang' : 'Servis Motor',
        'Nama Customer': b.nama_customer,
        'Email / Gmail': b.email || '-',
        'No. Telepon / WA': b.no_hp,
        'Tipe Motor': b.tipe_motor || '-',
        'Plat Kendaraan': b.plat_kendaraan || '-',
        'No. Mesin': b.no_mesin || '-',
        'Jadwal Booking': `${b.tanggal_booking} (${b.jam_booking} WIB)`,
        'Layanan / Suku Cadang': isPart ? itemsSummary : b.jenis_servis,
        'Metode Layanan': isPart ? (b.metode_layanan === 'PASANG' ? 'Pasang di Bengkel' : 'Ambil di Toko') : 'Servis di Bengkel',
        'Total Biaya': isPart && b.total_harga ? `Rp ${Number(b.total_harga).toLocaleString('id-ID')}` : '-',
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

