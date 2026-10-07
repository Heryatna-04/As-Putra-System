import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';

export class BookingController {
  /**
   * POST /api/v1/bookings
   * Public booking submission
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await BookingService.createBooking(req.body);
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
   * GET /api/v1/admin/bookings
   */
  public static async getListAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status, q, tanggal_from, tanggal_to } = req.query;
      const result = await BookingService.getBookings(
        {
          page: page ? parseInt(String(page), 10) : undefined,
          limit: limit ? parseInt(String(limit), 10) : undefined,
          status: status ? String(status) : undefined,
          q: q ? String(q) : undefined,
          tanggal_from: tanggal_from ? String(tanggal_from) : undefined,
          tanggal_to: tanggal_to ? String(tanggal_to) : undefined,
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
      const { page, limit, status, q, tanggal_from, tanggal_to } = req.query;
      const result = await BookingService.getBookings(
        {
          page: page ? parseInt(String(page), 10) : undefined,
          limit: limit ? parseInt(String(limit), 10) : undefined,
          status: status ? String(status) : undefined,
          q: q ? String(q) : undefined,
          tanggal_from: tanggal_from ? String(tanggal_from) : undefined,
          tanggal_to: tanggal_to ? String(tanggal_to) : undefined,
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
      const { status, q, tanggal_from, tanggal_to } = req.query;
      const buffer = await BookingService.exportExcel(
        {
          status: status ? String(status) : undefined,
          q: q ? String(q) : undefined,
          tanggal_from: tanggal_from ? String(tanggal_from) : undefined,
          tanggal_to: tanggal_to ? String(tanggal_to) : undefined,
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
      const { status, q, tanggal_from, tanggal_to } = req.query;
      const buffer = await BookingService.exportExcel(
        {
          status: status ? String(status) : undefined,
          q: q ? String(q) : undefined,
          tanggal_from: tanggal_from ? String(tanggal_from) : undefined,
          tanggal_to: tanggal_to ? String(tanggal_to) : undefined,
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
