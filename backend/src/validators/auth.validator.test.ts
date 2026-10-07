import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LoginSchema } from './auth.validator';

describe('Auth Validator Tests', () => {
  it('should parse valid login credentials', () => {
    const validData = {
      email: 'admin@asputramotor.com',
      password: 'supersecretpassword',
    };
    const parsed = LoginSchema.safeParse(validData);
    assert.strictEqual(parsed.success, true);
  });

  it('should fail on invalid email format', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'password123',
    };
    const parsed = LoginSchema.safeParse(invalidData);
    assert.strictEqual(parsed.success, false);
    if (!parsed.success) {
      assert.ok(parsed.error.issues.some((i) => i.message.includes('Format email tidak valid')));
    }
  });

  it('should fail on password shorter than 6 characters', () => {
    const invalidData = {
      email: 'admin@asputramotor.com',
      password: '123',
    };
    const parsed = LoginSchema.safeParse(invalidData);
    assert.strictEqual(parsed.success, false);
    if (!parsed.success) {
      assert.ok(parsed.error.issues.some((i) => i.message.includes('Password minimal 6 karakter')));
    }
  });
});
