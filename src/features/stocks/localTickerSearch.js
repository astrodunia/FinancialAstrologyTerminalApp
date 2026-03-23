import rawUniverse from '../../../us-tickers.json';

const DEFAULT_LIMIT = 8;

const TICKER_UNIVERSE = Array.isArray(rawUniverse?.tickers) ? rawUniverse.tickers : [];

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const looksLikeTicker = (value) => /^[A-Z]{1,8}([.-][A-Z0-9]{1,3})?$/.test(String(value || '').trim().toUpperCase());

export const rankLocalTickerResults = (query, limit = DEFAULT_LIMIT) => {
  const trimmed = String(query || '').trim();
  if (!trimmed) return [];

  const upper = trimmed.toUpperCase();
  const symbolPrefix = new RegExp(`^${escapeRegex(upper)}`);
  const nameLike = new RegExp(escapeRegex(trimmed), 'i');
  const matches = [];

  for (const item of TICKER_UNIVERSE) {
    if (!item?.symbol) continue;

    if (symbolPrefix.test(item.symbol)) {
      matches.push(item);
      continue;
    }

    if (nameLike.test(item.name || '')) {
      matches.push(item);
    }
  }

  matches.sort((left, right) => {
    const leftSymbol = String(left?.symbol || '');
    const rightSymbol = String(right?.symbol || '');

    const leftExact = leftSymbol === upper ? 0 : 1;
    const rightExact = rightSymbol === upper ? 0 : 1;
    if (leftExact !== rightExact) return leftExact - rightExact;

    const leftPrefix = leftSymbol.startsWith(upper) ? 0 : 1;
    const rightPrefix = rightSymbol.startsWith(upper) ? 0 : 1;
    if (leftPrefix !== rightPrefix) return leftPrefix - rightPrefix;

    if (leftPrefix === 0 && rightPrefix === 0) {
      const byLength = leftSymbol.length - rightSymbol.length;
      if (byLength !== 0) return byLength;
      return leftSymbol.localeCompare(rightSymbol);
    }

    return String(left?.name || '').localeCompare(String(right?.name || ''));
  });

  return matches.slice(0, limit).map((item) => ({
    symbol: String(item.symbol || '').toUpperCase(),
    name: String(item.name || ''),
    exchange: String(item.exchange || ''),
    type: String(item.type || ''),
  }));
};

export const getTickerUniverseCount = () => TICKER_UNIVERSE.length;
