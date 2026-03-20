import { describe, it, expect, beforeEach, vi } from 'vitest';

const RATE_LIMIT_KEY = 'propertymax_searches';
const MAX_SEARCHES_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

function createMockStorage() {
  const store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
}

function getRecentSearches(storage) {
  try {
    const timestamps = JSON.parse(storage.getItem(RATE_LIMIT_KEY) || '[]');
    const now = Date.now();
    return timestamps.filter(ts => now - ts < HOUR_MS);
  } catch {
    return [];
  }
}

function checkRateLimit(storage) {
  const recent = getRecentSearches(storage);

  if (recent.length >= MAX_SEARCHES_PER_HOUR) {
    const oldest = Math.min(...recent);
    const resetTime = oldest + HOUR_MS;
    const minutesLeft = Math.ceil((resetTime - Date.now()) / 60000);
    return { allowed: false, remaining: 0, resetInMinutes: minutesLeft };
  }

  return {
    allowed: true,
    remaining: MAX_SEARCHES_PER_HOUR - recent.length,
    resetInMinutes: 0,
  };
}

function recordSearch(storage) {
  const recent = getRecentSearches(storage);
  recent.push(Date.now());
  storage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
}

describe('Rate Limiting Logic', () => {
  let storage;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('allows searches when under limit', () => {
    const result = checkRateLimit(storage);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(20);
  });

  it('decrements remaining after each search', () => {
    recordSearch(storage);
    recordSearch(storage);
    recordSearch(storage);

    const result = checkRateLimit(storage);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(17);
  });

  it('blocks when limit is reached', () => {
    for (let i = 0; i < 20; i++) {
      recordSearch(storage);
    }

    const result = checkRateLimit(storage);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('provides reset time when blocked', () => {
    for (let i = 0; i < 20; i++) {
      recordSearch(storage);
    }

    const result = checkRateLimit(storage);
    expect(result.resetInMinutes).toBeGreaterThan(0);
    expect(result.resetInMinutes).toBeLessThanOrEqual(60);
  });

  it('expired timestamps are ignored', () => {
    const old = Date.now() - HOUR_MS - 1000;
    storage.setItem(RATE_LIMIT_KEY, JSON.stringify([old, old, old]));

    const result = checkRateLimit(storage);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(20);
  });

  it('handles corrupted storage gracefully', () => {
    storage.setItem(RATE_LIMIT_KEY, 'not-json');

    const result = checkRateLimit(storage);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(20);
  });

  it('handles empty storage gracefully', () => {
    const result = checkRateLimit(storage);
    expect(result.allowed).toBe(true);
  });

  it('allows exactly 20 searches', () => {
    for (let i = 0; i < 19; i++) {
      recordSearch(storage);
    }

    const beforeLast = checkRateLimit(storage);
    expect(beforeLast.allowed).toBe(true);
    expect(beforeLast.remaining).toBe(1);

    recordSearch(storage);

    const afterLast = checkRateLimit(storage);
    expect(afterLast.allowed).toBe(false);
    expect(afterLast.remaining).toBe(0);
  });

  it('mixes old and new timestamps correctly', () => {
    const old = Date.now() - HOUR_MS - 1000;
    const recent = Date.now() - 1000;
    storage.setItem(RATE_LIMIT_KEY, JSON.stringify([old, old, recent, recent, recent]));

    const result = checkRateLimit(storage);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(17);
  });
});
