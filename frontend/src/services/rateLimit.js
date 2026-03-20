const RATE_LIMIT_KEY = 'propertymax_searches';
const MAX_SEARCHES_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

function getSearchTimestamps() {
  try {
    return JSON.parse(localStorage.getItem(RATE_LIMIT_KEY) || '[]');
  } catch {
    return [];
  }
}

function getRecentSearches() {
  const now = Date.now();
  return getSearchTimestamps().filter(ts => now - ts < HOUR_MS);
}

export function checkRateLimit() {
  const recent = getRecentSearches();

  if (recent.length >= MAX_SEARCHES_PER_HOUR) {
    const oldestInWindow = Math.min(...recent);
    const resetTime = oldestInWindow + HOUR_MS;
    const minutesLeft = Math.ceil((resetTime - Date.now()) / 60000);

    return {
      allowed: false,
      remaining: 0,
      resetInMinutes: minutesLeft,
    };
  }

  return {
    allowed: true,
    remaining: MAX_SEARCHES_PER_HOUR - recent.length,
    resetInMinutes: 0,
  };
}

export function recordSearch() {
  const recent = getRecentSearches();
  recent.push(Date.now());
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
}

export function getRemainingSearches() {
  return MAX_SEARCHES_PER_HOUR - getRecentSearches().length;
}

export { MAX_SEARCHES_PER_HOUR };
