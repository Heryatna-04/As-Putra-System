import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response } from 'express';
import { validateCreateBooking, validateCreateAdminBooking, validateUpdateBookingStatus } from './booking.validator';

// Helper to create mock Express req, res, next
function createMockReqRes(body: Record<string, unknown> = {}) {
  const req = { body } as Request;
  let statusCode = 200;
  let responseData: unknown = null;
  let nextCalled = false;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: unknown) {
      responseData = data;
      return this;
    },
  } as unknown as Response;

  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    getStatus: () => statusCode,
    getData: () => responseData as { success?: boolean; errors?: string[]; message?: string },
    isNextCalled: () => nextCalled,
  };
}

describe('Booking Validator Tests', () => {
  describe('validateCreateBooking', () => {
    const validPayload = {
      nama_customer: 'Budi Santoso',
      email: 'budi@gmail.com',
      no_hp: '081234567890',
      no_mesin: 'JBK123456',
      plat_kendaraan: 'B 1234 CD',
      tanggal_booking: '2026-10-15',
      jam_booking: '09:00',
      jenis_servis: 'Servis & Bongkar CVT',
    };

    it('should call next() for completely valid booking payload', () => {
      const { req, res, next, isNextCalled } = createMockReqRes({ ...validPayload });
      validateCreateBooking(req, res, next);
      assert.strictEqual(isNextCalled(), true);
    });

    it('should reject invalid or short customer name', () => {
      const { req, res, next, getStatus, getData, isNextCalled } = createMockReqRes({
        ...validPayload,
        nama_customer: 'A',
      });
      validateCreateBooking(req, res, next);
      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.ok(getData().errors?.some((e) => e.includes('Nama customer')));
    });

    it('should reject invalid email format', () => {
      const { req, res, next, getStatus, getData, isNextCalled } = createMockReqRes({
        ...validPayload,
        email: 'budi-bukan-email',
      });
      validateCreateBooking(req, res, next);
      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.ok(getData().errors?.some((e) => e.includes('Email')));
    });

    it('should reject invalid phone number', () => {
      const { req, res, next, getStatus, getData, isNextCalled } = createMockReqRes({
        ...validPayload,
        no_hp: '12345',
      });
      validateCreateBooking(req, res, next);
      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.ok(getData().errors?.some((e) => e.includes('Nomor WhatsApp')));
    });

    it('should reject invalid or short machine number', () => {
      const { req, res, next, getStatus, getData, isNextCalled } = createMockReqRes({
        ...validPayload,
        no_mesin: 'JB',
      });
      validateCreateBooking(req, res, next);
      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.ok(getData().errors?.some((e) => e.includes('Nomor mesin')));
    });

    it('should reject unrecognized service type', () => {
      const { req, res, next, getStatus, getData, isNextCalled } = createMockReqRes({
        ...validPayload,
        jenis_servis: 'Modifikasi Knalpot Brong',
      });
      validateCreateBooking(req, res, next);
      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.ok(getData().errors?.some((e) => e.includes('Jenis servis tidak valid')));
    });

    it('should require detail_lainnya when jenis_servis is Lainnya', () => {
      const { req, res, next, getStatus, getData, isNextCalled } = createMockReqRes({
        ...validPayload,
        jenis_servis: 'Lainnya',
        detail_lainnya: '',
      });
      validateCreateBooking(req, res, next);
      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.ok(getData().errors?.some((e) => e.includes('Lainnya')));
    });

    it('should accept valid spare part booking payload without requiring no_mesin', () => {
      const sparePartPayload = {
        tipe_booking: 'SPAREPART',
        nama_customer: 'Ahmad Dahlan',
        email: 'ahmad@gmail.com',
        no_hp: '085712345678',
        tanggal_booking: '2026-10-20',
        jam_booking: '10:00',
        items: [
          {
            part_no: '06455-KVB-T01',
            part_name: 'Kampas Rem Depan',
            quantity: 2,
            het: 55000,
          },
        ],
      };
      const { req, res, next, isNextCalled } = createMockReqRes(sparePartPayload);
      validateCreateBooking(req, res, next);
      assert.strictEqual(isNextCalled(), true);
    });

    it('should reject spare part booking with empty items', () => {
      const emptyItemsPayload = {
        tipe_booking: 'SPAREPART',
        nama_customer: 'Ahmad Dahlan',
        email: 'ahmad@gmail.com',
        no_hp: '085712345678',
        tanggal_booking: '2026-10-20',
        jam_booking: '10:00',
        items: [],
      };
      const { req, res, next, getStatus, getData, isNextCalled } = createMockReqRes(emptyItemsPayload);
      validateCreateBooking(req, res, next);
      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.ok(getData().errors?.some((e) => e.includes('minimal satu suku cadang')));
    });
  });

  describe('validateUpdateBookingStatus', () => {
    it('should accept valid statuses', () => {
      const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
      for (const status of validStatuses) {
        const { req, res, next, isNextCalled } = createMockReqRes({ status });
        validateUpdateBookingStatus(req, res, next);
        assert.strictEqual(isNextCalled(), true, `Failed on status: ${status}`);
      }
    });

    it('should reject invalid status', () => {
      const { req, res, next, getStatus, getData, isNextCalled } = createMockReqRes({
        status: 'UNKNOWN_STATUS',
      });
      validateUpdateBookingStatus(req, res, next);
      assert.strictEqual(isNextCalled(), false);
      assert.strictEqual(getStatus(), 400);
      assert.strictEqual(getData().success, false);
    });
  });

  describe('validateCreateAdminBooking', () => {
    const minimalAdminPayload = {
      nama_customer: 'Dedi Kurniawan',
      no_hp: '081298765432',
      tanggal_booking: '2026-11-16',
      jam_booking: '10:00',
      jenis_servis: 'Paket Servis Ringan',
    };

    it('should accept minimal admin booking without email, plat_kendaraan, or no_mesin', () => {
      const { req, res, next, isNextCalled } = createMockReqRes({ ...minimalAdminPayload });
      validateCreateAdminBooking(req, res, next);
      assert.strictEqual(isNextCalled(), true);
    });

    it('should accept custom service label, optional email, and CONFIRMED/IN_PROGRESS status', () => {
      const { req, res, next, isNextCalled } = createMockReqRes({
        ...minimalAdminPayload,
        email: 'dedi@example.com',
        plat_kendaraan: 'E 4321 AB',
        no_mesin: 'JM12345',
        jenis_servis: ['Ganti Oli Mesin Saja', 'Servis & Bongkar CVT'],
        status: 'IN_PROGRESS',
      });
      validateCreateAdminBooking(req, res, next);
      assert.strictEqual(isNextCalled(), true);
    });

    it('should reject malformed optional email or invalid initial status', () => {
      const badEmail = createMockReqRes({
        ...minimalAdminPayload,
        email: 'bukan-email',
      });
      validateCreateAdminBooking(badEmail.req, badEmail.res, badEmail.next);
      assert.strictEqual(badEmail.isNextCalled(), false);
      assert.strictEqual(badEmail.getStatus(), 400);

      const badStatus = createMockReqRes({
        ...minimalAdminPayload,
        status: 'DONE',
      });
      validateCreateAdminBooking(badStatus.req, badStatus.res, badStatus.next);
      assert.strictEqual(badStatus.isNextCalled(), false);
      assert.strictEqual(badStatus.getStatus(), 400);
    });

    it('should require detail_lainnya when only Lainnya is selected', () => {
      const missingDetail = createMockReqRes({
        ...minimalAdminPayload,
        jenis_servis: 'Lainnya',
        detail_lainnya: '',
      });
      validateCreateAdminBooking(missingDetail.req, missingDetail.res, missingDetail.next);
      assert.strictEqual(missingDetail.isNextCalled(), false);
      assert.strictEqual(missingDetail.getStatus(), 400);
    });
  });
});
