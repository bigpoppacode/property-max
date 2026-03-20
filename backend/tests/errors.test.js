import { describe, it, expect, vi } from 'vitest';
import { AppError, ErrorCode, errorResponse } from '../src/lib/errors.js';

describe('AppError', () => {
  it('creates an error with code, message, statusCode, and helpText', () => {
    const err = new AppError(
      ErrorCode.ADDRESS_NOT_FOUND,
      'Not found',
      404,
      'Try a different address'
    );

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AppError');
    expect(err.code).toBe('ADDRESS_NOT_FOUND');
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.helpText).toBe('Try a different address');
  });

  it('defaults to statusCode 500', () => {
    const err = new AppError(ErrorCode.INTERNAL_ERROR, 'boom');
    expect(err.statusCode).toBe(500);
  });
});

describe('errorResponse', () => {
  function mockRes() {
    const res = {
      statusCode: null,
      body: null,
      status(code) { res.statusCode = code; return res; },
      json(data) { res.body = data; return res; },
    };
    return res;
  }

  it('handles AppError with structured response', () => {
    const res = mockRes();
    const err = new AppError(ErrorCode.API_KEY_INVALID, 'Bad key', 401, 'Check your key');

    errorResponse(res, err);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Bad key');
    expect(res.body.code).toBe('API_KEY_INVALID');
    expect(res.body.help).toBe('Check your key');
  });

  it('classifies generic API key error', () => {
    const res = mockRes();
    const err = new Error('authentication failed: invalid x-api-key');

    errorResponse(res, err);

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('API_KEY_INVALID');
    expect(res.body.help).toBeTruthy();
  });

  it('classifies rate limit error', () => {
    const res = mockRes();
    const err = new Error('429 too many requests');

    errorResponse(res, err);

    expect(res.statusCode).toBe(429);
    expect(res.body.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('classifies network error', () => {
    const res = mockRes();
    const err = new Error('fetch failed: ECONNREFUSED');

    errorResponse(res, err);

    expect(res.statusCode).toBe(503);
    expect(res.body.code).toBe('NETWORK_ERROR');
  });

  it('classifies geocode error as ADDRESS_NOT_FOUND', () => {
    const res = mockRes();
    const err = new Error('Could not geocode address');

    errorResponse(res, err);

    expect(res.statusCode).toBe(404);
    expect(res.body.code).toBe('ADDRESS_NOT_FOUND');
  });

  it('returns INTERNAL_ERROR for unknown errors', () => {
    const res = mockRes();
    const err = new Error('something unexpected');

    errorResponse(res, err);

    expect(res.statusCode).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });
});

describe('ErrorCode', () => {
  it('has all expected error codes', () => {
    const expectedCodes = [
      'API_KEY_INVALID', 'API_KEY_MISSING', 'ADDRESS_NOT_FOUND',
      'ZONING_UNAVAILABLE', 'NETWORK_ERROR', 'RATE_LIMIT_EXCEEDED',
      'ANALYSIS_FAILED', 'INVALID_REQUEST', 'MAPBOX_ERROR',
      'DALLAS_API_ERROR', 'INTERNAL_ERROR',
    ];

    for (const code of expectedCodes) {
      expect(ErrorCode[code]).toBe(code);
    }
  });
});
