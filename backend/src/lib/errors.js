export const ErrorCode = {
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_KEY_MISSING: 'API_KEY_MISSING',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  ZONING_UNAVAILABLE: 'ZONING_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MAPBOX_ERROR: 'MAPBOX_ERROR',
  DALLAS_API_ERROR: 'DALLAS_API_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export class AppError extends Error {
  constructor(code, message, statusCode = 500, helpText = '') {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.helpText = helpText;
  }
}

export function errorResponse(res, error) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      help: error.helpText || undefined,
    });
  }

  const message = error.message || 'An unexpected error occurred';
  const code = classifyError(error);

  return res.status(code.statusCode).json({
    error: code.message,
    code: code.code,
    help: code.help,
  });
}

function classifyError(error) {
  const msg = (error.message || '').toLowerCase();

  if (msg.includes('api key') || msg.includes('authentication') || msg.includes('401') || msg.includes('invalid x-api-key')) {
    return {
      code: ErrorCode.API_KEY_INVALID,
      statusCode: 401,
      message: 'Claude API key is invalid or expired',
      help: 'Check that ANTHROPIC_API_KEY in backend/.env is correct. Get a key at https://console.anthropic.com/',
    };
  }

  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      statusCode: 429,
      message: 'API rate limit exceeded',
      help: 'Too many requests to the AI service. Please wait a few minutes and try again.',
    };
  }

  if (msg.includes('could not geocode') || msg.includes('address not found')) {
    return {
      code: ErrorCode.ADDRESS_NOT_FOUND,
      statusCode: 404,
      message: 'Address not found in the Dallas area',
      help: 'Make sure the address is a valid Dallas, TX property. Try including the full street address (e.g., "4511 Swiss Ave, Dallas, TX").',
    };
  }

  if (msg.includes('fetch') || msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('network')) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      statusCode: 503,
      message: 'Network connection error',
      help: 'Could not reach an external service. Check your internet connection and try again.',
    };
  }

  return {
    code: ErrorCode.INTERNAL_ERROR,
    statusCode: 500,
    message: msg || 'An unexpected error occurred',
    help: 'If this persists, try a different address or contact support.',
  };
}
