import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseZoningData } from '../src/services/zoningService.js';

describe('parseZoningData', () => {
  it('returns unknown for null input', () => {
    const result = parseZoningData(null);
    expect(result.district).toBe('Unknown');
    expect(result.description).toContain('No zoning data');
  });

  it('returns unknown for empty array', () => {
    const result = parseZoningData([]);
    expect(result.district).toBe('Unknown');
  });

  it('parses zone_dist field correctly', () => {
    const result = parseZoningData([{
      zone_dist: 'R-7.5',
      zone_desc: 'Single Family Residential',
    }]);

    expect(result.district).toBe('R-7.5');
    expect(result.description).toBe('Single Family Residential');
  });

  it('falls back to zone_code when zone_dist is missing', () => {
    const result = parseZoningData([{
      zone_code: 'MF-2',
    }]);

    expect(result.district).toBe('MF-2');
  });

  it('formats known zoning codes', () => {
    const result = parseZoningData([{
      zone_dist: 'R-10',
    }]);

    expect(result.district).toBe('R-10');
    expect(result.description).toContain('Residential');
  });

  it('handles PD (Planned Development) codes', () => {
    const result = parseZoningData([{
      zone_dist: 'PD-123',
    }]);

    expect(result.district).toBe('PD-123');
    expect(result.description).toContain('Planned Development');
  });

  it('handles MF (Multi-Family) codes', () => {
    const result = parseZoningData([{
      zone_dist: 'MF-2',
    }]);

    expect(result.description).toContain('Multi-Family');
  });

  it('preserves overlay district', () => {
    const result = parseZoningData([{
      zone_dist: 'R-7.5',
      overlay_dist: 'CA-1',
    }]);

    expect(result.overlay).toBe('CA-1');
  });

  it('includes raw zone data', () => {
    const raw = { zone_dist: 'R-5', some_field: 'value' };
    const result = parseZoningData([raw]);

    expect(result.raw).toEqual(raw);
  });
});
