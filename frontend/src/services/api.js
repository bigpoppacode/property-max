import { checkRateLimit, recordSearch } from './rateLimit.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export class PropertyMaxError extends Error {
  constructor(message, code, help) {
    super(message);
    this.name = 'PropertyMaxError';
    this.code = code || 'UNKNOWN_ERROR';
    this.help = help || '';
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  } catch (err) {
    throw new PropertyMaxError(
      'Could not connect to the server',
      'NETWORK_ERROR',
      'Check that the backend is running and your internet connection is active. If running locally, make sure `npm run dev` is started.'
    );
  }

  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
      body = {};
    }

    throw new PropertyMaxError(
      body.error || `Request failed (HTTP ${response.status})`,
      body.code || `HTTP_${response.status}`,
      body.help || getDefaultHelp(response.status)
    );
  }

  return response.json();
}

function getDefaultHelp(status) {
  switch (status) {
    case 400: return 'Check that the address is valid and try again.';
    case 401: return 'An API key is invalid. Contact the site administrator.';
    case 404: return 'The requested data was not found. Try a different address.';
    case 429: return 'Too many requests. Wait a few minutes and try again.';
    case 500: return 'Server error. Try again in a moment.';
    case 502: return 'An external service is unavailable. Try again shortly.';
    case 503: return 'The service is temporarily unavailable. Try again in a few minutes.';
    default: return 'An unexpected error occurred. Try again.';
  }
}

export async function searchAddresses(query) {
  if (!query || query.length < 3) return [];
  const data = await request(`/api/property/search?q=${encodeURIComponent(query)}`);
  return data.results || [];
}

export async function lookupProperty(address) {
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    throw new PropertyMaxError(
      `Search limit reached (${20} per hour)`,
      'RATE_LIMIT_EXCEEDED',
      `You've used all your searches for this hour. Try again in ~${rateCheck.resetInMinutes} minute${rateCheck.resetInMinutes === 1 ? '' : 's'}.`
    );
  }

  const data = await request(`/api/property/lookup?address=${encodeURIComponent(address)}`);
  return data;
}

export async function lookupPropertyByCoords(lat, lng) {
  const rateCheck = checkRateLimit();
  if (!rateCheck.allowed) {
    throw new PropertyMaxError(
      `Search limit reached (${20} per hour)`,
      'RATE_LIMIT_EXCEEDED',
      `You've used all your searches for this hour. Try again in ~${rateCheck.resetInMinutes} minute${rateCheck.resetInMinutes === 1 ? '' : 's'}.`
    );
  }

  const data = await request(`/api/property/lookup?lat=${lat}&lng=${lng}`);
  return data;
}

export async function analyzeProperty({ address, zoning, coordinates, lotSize }) {
  recordSearch();

  const data = await request('/api/analysis/full', {
    method: 'POST',
    body: JSON.stringify({ address, zoning, coordinates, lotSize }),
  });
  return data;
}

export async function getQuickInsight(zoningCode, question) {
  const data = await request(
    `/api/analysis/insight?zoning=${encodeURIComponent(zoningCode)}&question=${encodeURIComponent(question)}`
  );
  return data.insight;
}
