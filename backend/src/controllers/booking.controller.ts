import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';

export class BookingController {
  /**
   * POST /api/v1/bookings
   * Public booking submission
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Security: public submission must always start as PENDING without admin notes
      const data = await BookingService.createBooking({
        ...req.body,
        status: 'PENDING',
        catatan_admin: undefined,
      });
      res.status(201).json({
        success: true,
        message: 'Booking servis berhasil didaftarkan!',
        data: {
          id: data.id,
          ticket_no: data.ticket_no,
          nama_customer: data.nama_customer,
          tanggal_booking: data.tanggal_booking,
          status: data.status,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/admin/bookings
   * Admin / Kepala Bengkel manual service booking creation (walk-in, phone, or WhatsApp)
   */
  public static async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        nama_customer,
        email,
        no_hp,
        no_mesin,
        plat_kendaraan,
        tipe_motor,
        tanggal_booking,
        jam_booking,
        jenis_servis,
        detail_lainnya,
        status,
        catatan_admin,
      } = req.body;

      const data = await BookingService.createBooking({
        nama_customer,
        email,
        no_hp,
        no_mesin,
        plat_kendaraan,
        tipe_motor,
        tanggal_booking,
        jam_booking,
        jenis_servis,
        detail_lainnya,
        tipe_booking: 'SERVIS',
        status: status || 'CONFIRMED',
        catatan_admin,
      });

      res.status(201).json({
        success: true,
        message: 'Booking servis pelanggan berhasil dibuat!',
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/bookings/track/:ticketNo
   * Public customer ticket tracking
   */
  public static async track(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketNo } = req.params;
      const data = await BookingService.trackBooking(String(ticketNo));
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      if (err.message?.includes('tidak ditemukan')) {
        res.status(404).json({
          success: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: err.message,
          },
        });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/bookings
   */
  public static async getListAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status, q, tanggal_from, tanggal_to, tipe_booking } = req.query;
      const result = await BookingService.getBookings(
        {
          page: page ? parseInt(String(page), 10) : undefined,
          limit: limit ? parseInt(String(limit), 10) : undefined,
          status: status ? String(status) : undefined,
          q: q ? String(q) : undefined,
          tanggal_from: tanggal_from ? String(tanggal_from) : undefined,
          tanggal_to: tanggal_to ? String(tanggal_to) : undefined,
          tipe_booking: tipe_booking ? String(tipe_booking) : undefined,
        },
        false // Full data for admin
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/admin/bookings/:id/status
   */
  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, catatan_admin } = req.body;
      const updated = await BookingService.updateStatus(String(id), status, catatan_admin);

      res.status(200).json({
        success: true,
        message: 'Status booking berhasil diubah',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/crm/bookings
   * Dedicated CRM list with phone masking
   */
  public static async getListCrm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status, q, tanggal_from, tanggal_to, tipe_booking } = req.query;
      const result = await BookingService.getBookings(
        {
          page: page ? parseInt(String(page), 10) : undefined,
          limit: limit ? parseInt(String(limit), 10) : undefined,
          status: status ? String(status) : undefined,
          q: q ? String(q) : undefined,
          tanggal_from: tanggal_from ? String(tanggal_from) : undefined,
          tanggal_to: tanggal_to ? String(tanggal_to) : undefined,
          tipe_booking: tipe_booking ? String(tipe_booking) : undefined,
        },
        true // Mask phone for CRM
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/crm/bookings/:id
   */
  public static async getDetailCrm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await BookingService.getBookingById(String(id), true);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/admin/bookings/export
   */
  public static async exportExcelAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, q, tanggal_from, tanggal_to, tipe_booking } = req.query;
      const buffer = await BookingService.exportExcel(
        {
          status: status ? String(status) : undefined,
          q: q ? String(q) : undefined,
          tanggal_from: tanggal_from ? String(tanggal_from) : undefined,
          tanggal_to: tanggal_to ? String(tanggal_to) : undefined,
          tipe_booking: tipe_booking ? String(tipe_booking) : undefined,
        },
        false
      );

      const timestamp = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Data_Booking_AS_Putra_${timestamp}.xlsx"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/crm/bookings/export
   */
  public static async exportExcelCrm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, q, tanggal_from, tanggal_to, tipe_booking } = req.query;
      const buffer = await BookingService.exportExcel(
        {
          status: status ? String(status) : undefined,
          q: q ? String(q) : undefined,
          tanggal_from: tanggal_from ? String(tanggal_from) : undefined,
          tanggal_to: tanggal_to ? String(tanggal_to) : undefined,
          tipe_booking: tipe_booking ? String(tipe_booking) : undefined,
        },
        true
      );

      const timestamp = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Data_Booking_CRM_AS_Putra_${timestamp}.xlsx"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }
}
