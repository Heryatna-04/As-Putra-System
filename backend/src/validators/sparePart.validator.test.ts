import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SparePartCreateSchema,
  StockUpdateSchema,
  CatalogQuerySchema,
} from './sparePart.validator';

describe('SparePart Validator Tests', () => {
  describe('SparePartCreateSchema', () => {
    it('should parse valid spare part data', () => {
      const validPart = {
        part_no: '23100-KZL-931',
        part_name: 'Drive Belt V-Belt BeAT FI',
        nama_umum: 'Vanbelt BeAT',
        category_detail: 'DRIVE BELT',
        het: 85000,
        stok: 10,
        status: 'ACTIVE' as const,
      };
      const parsed = SparePartCreateSchema.safeParse(validPart);
      assert.strictEqual(parsed.success, true);
    });

    it('should reject empty part_no', () => {
      const invalidPart = {
        part_no: '',
        part_name: 'Drive Belt',
      };
      const parsed = SparePartCreateSchema.safeParse(invalidPart);
      assert.strictEqual(parsed.success, false);
    });

    it('should reject negative stock', () => {
      const invalidPart = {
        part_no: '23100-KZL-931',
        part_name: 'Drive Belt',
        stok: -5,
      };
      const parsed = SparePartCreateSchema.safeParse(invalidPart);
      assert.strictEqual(parsed.success, false);
    });
  });

  describe('StockUpdateSchema', () => {
    it('should accept valid stock number', () => {
      const parsed = StockUpdateSchema.safeParse({ stok: 25 });
      assert.strictEqual(parsed.success, true);
    });

    it('should reject negative stock number', () => {
      const parsed = StockUpdateSchema.safeParse({ stok: -1 });
      assert.strictEqual(parsed.success, false);
    });
  });

  describe('CatalogQuerySchema', () => {
    it('should apply default values when query params are empty', () => {
      const parsed = CatalogQuerySchema.safeParse({});
      assert.strictEqual(parsed.success, true);
      if (parsed.success) {
        assert.strictEqual(parsed.data.page, 1);
        assert.strictEqual(parsed.data.limit, 20);
        assert.strictEqual(parsed.data.sort, 'relevance');
      }
    });

    it('should coerce string numbers for page and limit', () => {
      const parsed = CatalogQuerySchema.safeParse({
        page: '3',
        limit: '15',
      });
      assert.strictEqual(parsed.success, true);
      if (parsed.success) {
        assert.strictEqual(parsed.data.page, 3);
        assert.strictEqual(parsed.data.limit, 15);
      }
    });
  });
});
