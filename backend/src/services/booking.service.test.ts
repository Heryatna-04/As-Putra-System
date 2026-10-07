import 'dotenv/config';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BookingService } from './booking.service';

describe('BookingService Tests', () => {
  describe('maskPhone', () => {
    it('should mask standard 12-digit Indonesian phone number', () => {
      const masked = BookingService.maskPhone('081234567890');
      assert.strictEqual(masked, '0812****7890');
    });

    it('should mask 10-digit phone number', () => {
      const masked = BookingService.maskPhone('0812345678');
      assert.strictEqual(masked, '0812****5678');
    });

    it('should handle short strings (<= 6 chars) safely', () => {
      const masked = BookingService.maskPhone('12345');
      assert.strictEqual(masked, '****');
    });

    it('should trim whitespace around phone numbers', () => {
      const masked = BookingService.maskPhone('  081234567890  ');
      assert.strictEqual(masked, '0812****7890');
    });

    it('should handle exactly 6 characters', () => {
      const masked = BookingService.maskPhone('123456');
      assert.strictEqual(masked, '****');
    });

    it('should handle 7 characters', () => {
      const masked = BookingService.maskPhone('1234567');
      assert.strictEqual(masked, '1234****4567');
    });
  });
});
