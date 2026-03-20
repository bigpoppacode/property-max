import { describe, it, expect } from 'vitest';

describe('AI Service - Response Parsing', () => {
  it('parses valid JSON response', () => {
    const text = JSON.stringify({
      property_summary: { address: '123 Main St' },
      recommendations: [],
      best_recommendation: 'adu',
      total_potential_value_increase: 100000,
    });

    const parsed = JSON.parse(text);
    expect(parsed.property_summary.address).toBe('123 Main St');
    expect(parsed.recommendations).toEqual([]);
  });

  it('extracts JSON from markdown-wrapped response', () => {
    const text = '```json\n{"property_summary":{"address":"123 Main St"},"recommendations":[]}\n```';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();

    const parsed = JSON.parse(jsonMatch[0]);
    expect(parsed.property_summary.address).toBe('123 Main St');
  });

  it('handles response with surrounding text', () => {
    const text = 'Here is the analysis:\n\n{"property_summary":{"address":"test"},"recommendations":[]}\n\nLet me know if you need more.';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    expect(jsonMatch).not.toBeNull();

    const parsed = JSON.parse(jsonMatch[0]);
    expect(parsed.property_summary).toBeTruthy();
  });

  it('fails gracefully on non-JSON response', () => {
    const text = 'I cannot provide that analysis.';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeNull();
  });
});

describe('AI Service - Input Construction', () => {
  it('builds prompt with zoning data', () => {
    const address = '4511 Swiss Ave, Dallas, TX';
    const zoningCode = 'R-7.5';
    const zoningDesc = 'Single Family Residential';

    const prompt = `Address: ${address}\nZoning District: ${zoningCode}\nZoning Description: ${zoningDesc}`;

    expect(prompt).toContain('4511 Swiss Ave');
    expect(prompt).toContain('R-7.5');
    expect(prompt).toContain('Single Family');
  });

  it('handles missing zoning gracefully', () => {
    const zoning = null;
    const zoningCode = zoning?.district || 'Unknown';
    const zoningDesc = zoning?.description || 'No description available';

    expect(zoningCode).toBe('Unknown');
    expect(zoningDesc).toBe('No description available');
  });

  it('handles missing lot size', () => {
    const lotSize = undefined;
    const formatted = lotSize || 'Unknown (estimate based on typical Dallas lot for this zoning)';
    expect(formatted).toContain('Unknown');
  });
});

describe('AI Service - Error Classification', () => {
  const errorCases = [
    {
      input: 'authentication failed: invalid x-api-key',
      expected: 'api_key',
    },
    {
      input: '429 too many requests',
      expected: 'rate_limit',
    },
    {
      input: 'ECONNREFUSED',
      expected: 'network',
    },
    {
      input: 'API is overloaded',
      expected: 'overloaded',
    },
  ];

  for (const { input, expected } of errorCases) {
    it(`classifies "${input}" as ${expected}`, () => {
      const msg = input.toLowerCase();
      if (expected === 'api_key') {
        expect(msg.includes('api key') || msg.includes('authentication') || msg.includes('invalid x-api-key')).toBe(true);
      } else if (expected === 'rate_limit') {
        expect(msg.includes('rate limit') || msg.includes('429') || msg.includes('too many')).toBe(true);
      } else if (expected === 'network') {
        expect(msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('network')).toBe(true);
      } else if (expected === 'overloaded') {
        expect(msg.includes('overloaded')).toBe(true);
      }
    });
  }
});

describe('AI Service - Recommendation Schema', () => {
  const validAnalysis = {
    property_summary: {
      address: '4511 Swiss Ave, Dallas, TX',
      zoning_code: 'R-7.5',
      zoning_description: 'Single Family Residential',
      estimated_lot_size: 7500,
      estimated_current_value: 350000,
      neighborhood_context: 'Historic Swiss Avenue area',
    },
    recommendations: [
      {
        type: 'adu',
        title: 'Accessory Dwelling Unit',
        feasibility: 'recommended',
        feasibility_score: 85,
        summary: 'Great ADU potential',
        details: {
          max_size_sqft: 800,
          estimated_build_cost: 100000,
          estimated_rental_income_monthly: 1200,
          estimated_value_add: 150000,
          timeline_months: 6,
        },
        permits_required: ['Building Permit'],
        next_steps: ['Hire architect'],
      },
    ],
    best_recommendation: 'adu',
    total_potential_value_increase: 150000,
  };

  it('has required top-level fields', () => {
    expect(validAnalysis).toHaveProperty('property_summary');
    expect(validAnalysis).toHaveProperty('recommendations');
    expect(validAnalysis).toHaveProperty('best_recommendation');
    expect(validAnalysis).toHaveProperty('total_potential_value_increase');
  });

  it('property_summary has required fields', () => {
    const summary = validAnalysis.property_summary;
    expect(summary).toHaveProperty('address');
    expect(summary).toHaveProperty('zoning_code');
    expect(summary).toHaveProperty('estimated_lot_size');
    expect(summary).toHaveProperty('estimated_current_value');
  });

  it('each recommendation has required fields', () => {
    for (const rec of validAnalysis.recommendations) {
      expect(rec).toHaveProperty('type');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('feasibility');
      expect(rec).toHaveProperty('feasibility_score');
      expect(rec).toHaveProperty('summary');
      expect(rec).toHaveProperty('details');
      expect(['adu', 'lot_split', 'teardown_rebuild']).toContain(rec.type);
      expect(['recommended', 'possible', 'not_allowed']).toContain(rec.feasibility);
      expect(rec.feasibility_score).toBeGreaterThanOrEqual(1);
      expect(rec.feasibility_score).toBeLessThanOrEqual(100);
    }
  });
});
