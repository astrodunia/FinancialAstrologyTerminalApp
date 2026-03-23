const US_MARKET_TIME_ZONE = 'America/New_York';
const PREMARKET_OPEN_MINUTES = 4 * 60;
const MARKET_OPEN_MINUTES = 9 * 60 + 30;
const MARKET_CLOSE_MINUTES = 16 * 60;
const AFTER_HOURS_CLOSE_MINUTES = 20 * 60;

const marketPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: US_MARKET_TIME_ZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const caches = {
  homeStocks: {
    data: null,
    fetchedAt: 0,
    session: 'closed',
  },
  liveIndices: {
    data: null,
    fetchedAt: 0,
    session: 'closed',
  },
};

const getSessionSnapshot = () => {
  const now = new Date();
  const parts = marketPartsFormatter.formatToParts(now);
  const valueOf = (type) => parts.find((part) => part.type === type)?.value || '';
  const weekday = valueOf('weekday');
  const hour = Number(valueOf('hour') || 0);
  const minute = Number(valueOf('minute') || 0);
  const totalMinutes = hour * 60 + minute;
  const isWeekday = weekday !== 'Sat' && weekday !== 'Sun';
  const isPremarket = isWeekday && totalMinutes >= PREMARKET_OPEN_MINUTES && totalMinutes < MARKET_OPEN_MINUTES;
  const isOpen = isWeekday && totalMinutes >= MARKET_OPEN_MINUTES && totalMinutes < MARKET_CLOSE_MINUTES;
  const isAfterHours = isWeekday && totalMinutes >= MARKET_CLOSE_MINUTES && totalMinutes < AFTER_HOURS_CLOSE_MINUTES;
  const session = isOpen ? 'open' : isPremarket ? 'premarket' : isAfterHours ? 'afterhours' : 'closed';

  return {
    session,
    isOpen,
    isActive: isPremarket || isOpen || isAfterHours,
  };
};

export const getUsMarketSession = () => getSessionSnapshot();

export const getMarketDataCache = (key) => caches[key] || null;

export const setMarketDataCache = (key, data, session = getSessionSnapshot().session) => {
  if (!caches[key]) return;
  caches[key] = {
    data,
    fetchedAt: Date.now(),
    session,
  };
};

export const shouldRefreshMarketData = (key, ttlMs) => {
  const entry = caches[key];
  const market = getSessionSnapshot();

  if (!entry?.data) return true;
  if (!market.isActive) return false;
  if (entry.session !== market.session) return true;
  return Date.now() - entry.fetchedAt > ttlMs;
};
