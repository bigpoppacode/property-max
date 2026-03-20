import { describe, it, expect } from 'vitest';
import { generateMapConfig, getZoningColorScheme } from '../src/services/mapService.js';

describe('generateMapConfig', () => {
  it('generates config with correct center coordinates', () => {
    const coords = { lat: 32.7767, lng: -96.7970 };
    const zoning = { district: 'R-7.5' };

    const config = generateMapConfig(coords, zoning);

    expect(config.center).toEqual([-96.7970, 32.7767]);
    expect(config.zoom).toBe(16);
  });

  it('creates a property marker', () => {
    const coords = { lat: 32.78, lng: -96.80 };
    const config = generateMapConfig(coords, null);

    expect(config.markers).toHaveLength(1);
    expect(config.markers[0].type).toBe('property');
    expect(config.markers[0].coordinates).toEqual([-96.80, 32.78]);
  });

  it('includes zoning info in marker popup', () => {
    const coords = { lat: 32.78, lng: -96.80 };
    const zoning = { district: 'MF-2' };

    const config = generateMapConfig(coords, zoning);

    expect(config.markers[0].popup.description).toContain('MF-2');
  });

  it('adds zoning overlay layer when zoning data provided', () => {
    const coords = { lat: 32.78, lng: -96.80 };
    const zoning = { district: 'R-10' };

    const config = generateMapConfig(coords, zoning);

    expect(config.layers).toHaveLength(1);
    expect(config.layers[0].id).toBe('zoning-overlay');
  });

  it('uses empty layers when no zoning data', () => {
    const coords = { lat: 32.78, lng: -96.80 };
    const config = generateMapConfig(coords, null);

    expect(config.layers).toEqual([]);
  });
});

describe('getZoningColorScheme', () => {
  it('returns green for residential zones', () => {
    const scheme = getZoningColorScheme('R-7.5');
    expect(scheme.primary).toBe('#22c55e');
  });

  it('returns blue for multi-family zones', () => {
    const scheme = getZoningColorScheme('MF-2');
    expect(scheme.primary).toBe('#3b82f6');
  });

  it('returns purple for mixed-use zones', () => {
    const scheme = getZoningColorScheme('MU-1');
    expect(scheme.primary).toBe('#a855f7');
  });

  it('returns amber for commercial zones', () => {
    const scheme = getZoningColorScheme('CR');
    expect(scheme.primary).toBe('#f59e0b');
  });

  it('returns red for industrial zones', () => {
    const scheme = getZoningColorScheme('IM');
    expect(scheme.primary).toBe('#ef4444');
  });

  it('returns cyan for planned development', () => {
    const scheme = getZoningColorScheme('PD-123');
    expect(scheme.primary).toBe('#06b6d4');
  });

  it('returns default for unknown zones', () => {
    const scheme = getZoningColorScheme('XYZ');
    expect(scheme.primary).toBe('#6366f1');
  });

  it('includes fill and stroke values', () => {
    const scheme = getZoningColorScheme('R-5');
    expect(scheme.fill).toBeTruthy();
    expect(scheme.stroke).toBeTruthy();
  });
});
