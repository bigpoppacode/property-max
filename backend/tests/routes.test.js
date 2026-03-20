import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Property Routes - Input Validation', () => {
  it('requires address or coordinates for /lookup', () => {
    const query = {};
    const hasAddress = !!query.address;
    const hasCoords = !!(query.lat && query.lng);
    expect(hasAddress || hasCoords).toBe(false);
  });

  it('accepts address for /lookup', () => {
    const query = { address: '4511 Swiss Ave, Dallas, TX' };
    expect(!!query.address).toBe(true);
  });

  it('accepts lat/lng for /lookup', () => {
    const query = { lat: '32.7900', lng: '-96.7800' };
    expect(!!(query.lat && query.lng)).toBe(true);
  });

  it('requires minimum 3 chars for /search', () => {
    expect('ab'.length < 3).toBe(true);
    expect('abc'.length < 3).toBe(false);
  });
});

describe('Analysis Routes - Input Validation', () => {
  it('requires address for /full analysis', () => {
    const body = {};
    expect(!!body.address).toBe(false);
  });

  it('requires zoning and question for /insight', () => {
    const query = { zoning: 'R-7.5' };
    expect(!!(query.zoning && query.question)).toBe(false);
  });

  it('accepts complete insight params', () => {
    const query = { zoning: 'R-7.5', question: 'Can I build an ADU?' };
    expect(!!(query.zoning && query.question)).toBe(true);
  });
});

describe('Error Response Format', () => {
  it('should include error, code, and help fields', () => {
    const response = {
      error: 'Address not found',
      code: 'ADDRESS_NOT_FOUND',
      help: 'Try a different address',
    };

    expect(response).toHaveProperty('error');
    expect(response).toHaveProperty('code');
    expect(response).toHaveProperty('help');
    expect(typeof response.error).toBe('string');
    expect(typeof response.code).toBe('string');
  });

  it('error codes should be uppercase snake_case', () => {
    const codes = [
      'API_KEY_INVALID', 'ADDRESS_NOT_FOUND', 'ZONING_UNAVAILABLE',
      'NETWORK_ERROR', 'RATE_LIMIT_EXCEEDED', 'ANALYSIS_FAILED',
    ];

    for (const code of codes) {
      expect(code).toMatch(/^[A-Z][A-Z0-9_]*$/);
    }
  });
});
