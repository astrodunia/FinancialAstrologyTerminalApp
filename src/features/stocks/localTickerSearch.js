import rawUniverse from '../../../us-tickers.json';

const DEFAULT_LIMIT = 8;

const TICKER_UNIVERSE = Array.isArray(rawUniverse?.tickers) ? rawUniverse.tickers : [];

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeText = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

export const looksLikeTicker = (value) => /^[A-Z]{1,8}([.-][A-Z0-9]{1,3})?$/.test(String(value || '').trim().toUpperCase());

export const rankLocalTickerResults = (query, limit = DEFAULT_LIMIT) => {
  const trimmed = String(query || '').trim();
  if (!trimmed) return [];

  const upper = trimmed.toUpperCase();
  const normalizedQuery = normalizeText(trimmed);
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const symbolPrefix = new RegExp(`^${escapeRegex(upper)}`);
  const matches = [];

  for (const item of TICKER_UNIVERSE) {
    if (!item?.symbol) continue;
    const symbol = String(item.symbol || '').toUpperCase();
    const name = String(item.name || '');
    const normalizedName = normalizeText(name);
    let score = -1;

    if (symbol === upper) {
      score = 1000;
    } else if (symbolPrefix.test(symbol)) {
      score = 800 - symbol.length;
    } else if (normalizedQuery && normalizedName.startsWith(normalizedQuery)) {
      score = 700;
    } else if (normalizedQuery && normalizedName.includes(normalizedQuery)) {
      score = 600;
    } else if (
      queryTokens.length &&
      queryTokens.every((token) => normalizedName.includes(token))
    ) {
      score = 500 - queryTokens.length;
    }

    if (score < 0) continue;

    matches.push({
      ...item,
      __score: score,
      symbol,
      name,
    });
  }

  matches.sort((left, right) => {
    const byScore = Number(right?.__score || 0) - Number(left?.__score || 0);
    if (byScore !== 0) return byScore;

    const leftSymbol = String(left?.symbol || '').toUpperCase();
    const rightSymbol = String(right?.symbol || '').toUpperCase();

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

  const normalizedMatches = matches.slice(0, limit).map((item) => ({
    symbol: String(item.symbol || '').toUpperCase(),
    name: String(item.name || ''),
    exchange: String(item.exchange || ''),
    type: String(item.type || ''),
  }));

  if (!normalizedMatches.length && looksLikeTicker(upper)) {
    return [
      {
        symbol: upper,
        name: 'Open ticker',
        exchange: '',
        type: 'SYMBOL',
      },
    ];
  }

  return normalizedMatches;
};

export const getTickerUniverseCount = () => TICKER_UNIVERSE.length;
