import Anthropic from '@anthropic-ai/sdk';
import { AppError, ErrorCode } from '../lib/errors.js';

let client;
try {
  client = new Anthropic();
} catch {
  // Will be caught when actually making a request
  client = null;
}

const SYSTEM_PROMPT = `You are an expert real estate analyst specializing in Dallas/DFW property zoning, ADU regulations, lot splits, and teardown/rebuild analysis. You provide accurate, actionable recommendations based on Dallas zoning codes.

Key Dallas zoning knowledge:
- Dallas passed ADU regulations allowing accessory dwelling units in most single-family zones (R-5, R-7.5, R-10, R-13, etc.)
- ADUs can be up to 800 sq ft or 30% of main dwelling, whichever is less
- Minimum lot size for ADU: 6,000 sq ft
- Lot splits require minimum lot width of 50ft and depth of 100ft for most residential zones
- FAR (Floor Area Ratio) varies by district: R-7.5 is 0.45, R-10 is 0.40, R-5 is 0.50
- Height limit is typically 36ft for residential
- Front setback: 25ft, Side: 5ft, Rear: 5ft for most residential

Always provide specific numbers, realistic estimates, and cite Dallas zoning code where relevant.
Format your analysis as structured JSON.`;

function ensureClient() {
  if (!client) {
    try {
      client = new Anthropic();
    } catch {
      throw new AppError(
        ErrorCode.API_KEY_MISSING,
        'Claude API key is not configured',
        500,
        'Set ANTHROPIC_API_KEY in backend/.env. Get a key at https://console.anthropic.com/'
      );
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AppError(
      ErrorCode.API_KEY_MISSING,
      'Claude API key is not configured',
      500,
      'Set ANTHROPIC_API_KEY in backend/.env. Get a key at https://console.anthropic.com/'
    );
  }
}

async function callClaude(messages, maxTokens = 4096) {
  ensureClient();

  try {
    return await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages,
    });
  } catch (err) {
    const msg = (err.message || '').toLowerCase();
    const status = err.status || err.statusCode;

    if (status === 401 || msg.includes('api key') || msg.includes('authentication') || msg.includes('invalid x-api-key')) {
      throw new AppError(
        ErrorCode.API_KEY_INVALID,
        'Claude API key is invalid or expired',
        401,
        'Check that ANTHROPIC_API_KEY in backend/.env is a valid key. Get one at https://console.anthropic.com/'
      );
    }

    if (status === 429 || msg.includes('rate limit') || msg.includes('too many')) {
      throw new AppError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Claude API rate limit exceeded',
        429,
        'The AI service is temporarily throttled. Wait a minute and try again.'
      );
    }

    if (status === 529 || msg.includes('overloaded')) {
      throw new AppError(
        ErrorCode.NETWORK_ERROR,
        'Claude API is temporarily overloaded',
        503,
        'The AI service is experiencing high traffic. Try again in a few minutes.'
      );
    }

    if (msg.includes('fetch') || msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('network')) {
      throw new AppError(
        ErrorCode.NETWORK_ERROR,
        'Could not connect to Claude API',
        503,
        'Check your internet connection and try again.'
      );
    }

    throw new AppError(
      ErrorCode.ANALYSIS_FAILED,
      `AI analysis failed: ${err.message}`,
      500,
      'The AI service returned an unexpected error. Try again or use a different address.'
    );
  }
}

export async function analyzeProperty({ address, zoning, coordinates, lotSize }) {
  const zoningCode = zoning?.district || 'Unknown';
  const zoningDesc = zoning?.description || 'No description available';

  const prompt = `Analyze this Dallas property for value maximization opportunities:

Address: ${address}
Zoning District: ${zoningCode}
Zoning Description: ${zoningDesc}
Lot Size: ${lotSize || 'Unknown (estimate based on typical Dallas lot for this zoning)'} sq ft
Coordinates: ${coordinates?.lat}, ${coordinates?.lng}

Provide a comprehensive analysis in this exact JSON format:
{
  "property_summary": {
    "address": "${address}",
    "zoning_code": "${zoningCode}",
    "zoning_description": "human-readable zoning description",
    "estimated_lot_size": number_in_sqft,
    "estimated_current_value": number_in_dollars,
    "neighborhood_context": "brief description of the area"
  },
  "recommendations": [
    {
      "type": "adu",
      "title": "Accessory Dwelling Unit (ADU)",
      "feasibility": "recommended" | "possible" | "not_allowed",
      "feasibility_score": 1-100,
      "summary": "one sentence summary",
      "details": {
        "max_size_sqft": number,
        "setback_requirements": "description",
        "parking_requirements": "description",
        "estimated_build_cost": number,
        "estimated_rental_income_monthly": number,
        "estimated_value_add": number,
        "key_requirements": ["list", "of", "requirements"],
        "timeline_months": number
      },
      "permits_required": ["list of permits"],
      "next_steps": ["ordered list of action items"]
    },
    {
      "type": "lot_split",
      "title": "Lot Split / Subdivision",
      "feasibility": "recommended" | "possible" | "not_allowed",
      "feasibility_score": 1-100,
      "summary": "one sentence summary",
      "details": {
        "minimum_lot_size": number,
        "current_lot_qualifies": true|false,
        "resulting_lot_sizes": [number, number],
        "estimated_new_lot_value": number,
        "estimated_total_value_increase": number,
        "subdivision_requirements": "description",
        "timeline_months": number
      },
      "permits_required": ["list of permits"],
      "next_steps": ["ordered list of action items"]
    },
    {
      "type": "teardown_rebuild",
      "title": "Teardown & Rebuild",
      "feasibility": "recommended" | "possible" | "not_allowed",
      "feasibility_score": 1-100,
      "summary": "one sentence summary",
      "details": {
        "max_building_size_sqft": number,
        "far_ratio": number,
        "height_limit_ft": number,
        "estimated_demolition_cost": number,
        "estimated_rebuild_cost": number,
        "estimated_new_value": number,
        "estimated_profit": number,
        "timeline_months": number
      },
      "permits_required": ["list of permits"],
      "next_steps": ["ordered list of action items"]
    }
  ],
  "best_recommendation": "adu" | "lot_split" | "teardown_rebuild",
  "total_potential_value_increase": number,
  "market_context": "Brief Dallas/DFW market context relevant to this property"
}

Be realistic with all estimates. Use current Dallas construction costs ($150-250/sqft for standard builds, $100-150/sqft for ADUs). Use current Dallas market values for the area. Respond ONLY with the JSON object, no markdown formatting or code blocks.`;

  const response = await callClaude([{ role: 'user', content: prompt }], 4096);

  const text = response.content[0].text;

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        throw new AppError(
          ErrorCode.ANALYSIS_FAILED,
          'AI returned an invalid response format',
          500,
          'The AI analysis could not be parsed. Try again — results may vary between attempts.'
        );
      }
    }
    throw new AppError(
      ErrorCode.ANALYSIS_FAILED,
      'AI returned an invalid response format',
      500,
      'The AI analysis could not be parsed. Try again — results may vary between attempts.'
    );
  }
}

export async function getQuickInsight(zoningCode, question) {
  const response = await callClaude([{
    role: 'user',
    content: `Quick question about Dallas zoning code ${zoningCode}: ${question}\n\nAnswer concisely in 2-3 sentences.`,
  }], 1024);

  return response.content[0].text;
}
