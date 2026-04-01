import { API_BASE_URL } from '../store/UserContext';
import { LIVE_API_BASE } from '../utils/apiBaseUrl';
import { normalizeSymbol } from './watchlistApi';

type JsonMap = Record<string, unknown>;

type QuoteRow = {
  symbol: string;
  name: string;
  price: number | null;
  pct: number | null;
  change: number | null;
  volume: number | null;
};

type QuoteSnapshot = {
  price: number;
  change: number | null;
  pct: number | null;
  volume: number;
};

type InfoSnapshot = QuoteSnapshot & { name: string };

type FetchQuoteOptions = {
  signal?: AbortSignal;
  nameFallback?: string;
  nameMap?: Record<string, string>;
};

const symbolKey = (value: unknown): string => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const symbolCandidates = (symbol: string): string[] => {
  const base = normalizeSymbol(symbol);
  if (!base) return [];
  const variants = [base];
  if (base.includes('.')) variants.push(base.replace(/\./g, '-'));
  if (base.includes('-')) variants.push(base.replace(/-/g, '.'));
  return [...new Set(variants)];
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const mapObjectRowsWithSymbol = (record: unknown): JsonMap[] => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return [];

  return Object.entries(record as JsonMap)
    .map(([key, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const row = value as JsonMap;
      const hasSymbol = Boolean(row.symbol || row.ticker || row.code || row.index || row.instrument || row.s);
      if (hasSymbol) return row;
      return { ...row, symbol: key, ticker: key } as JsonMap;
    })
    .filter(Boolean) as JsonMap[];
};

const toArray = (payload: unknown): JsonMap[] => {
  const row = (payload || {}) as JsonMap;
  if (Array.isArray(payload)) return payload as JsonMap[];
  if (Array.isArray(row.data)) return row.data as JsonMap[];
  if (Array.isArray(row.items)) return row.items as JsonMap[];
  if (Array.isArray(row.result)) return row.result as JsonMap[];
  if (row.data && typeof row.data === 'object') return mapObjectRowsWithSymbol(row.data);

  if (payload && typeof payload === 'object') {
    const values = Object.values(payload as JsonMap);
    if (values.length && values.every((item) => item && typeof item === 'object')) {
      return mapObjectRowsWithSymbol(payload);
    }
  }
  return [];
};

const findBySymbol = (rows: JsonMap[], symbol: string): JsonMap | null => {
  const target = symbolKey(symbol);
  return (
    rows.find((item) => {
      const id = symbolKey(item?.symbol || item?.ticker || item?.code || item?.index || item?.instrument || item?.s);
      return id === target || id.endsWith(target);
    }) || null
  );
};

const pickNumber = (obj: JsonMap | null | undefined, keys: string[]): number | null => {
  for (const key of keys) {
    const n = toNumber(obj?.[key]);
    if (n != null) return n;
  }
  return null;
};

const cleanName = (raw: unknown, symbol: string): string => {
  if (typeof raw !== 'string') return '';
  const value = raw.trim();
  if (!value) return '';
  const lowered = value.toLowerCase();
  if (lowered === 'n/a' || lowered === 'na' || lowered === '--' || lowered === '..' || lowered === '.') return '';
  if (normalizeSymbol(value) === normalizeSymbol(symbol)) return '';
  return value;
};

const pickDisplayName = (source: unknown, symbol: string): string => {
  if (!source || typeof source !== 'object') return '';
  const row = source as JsonMap;

  const candidates: unknown[] = [
    row.longName,
    row.shortName,
    row.displayName,
    row.companyName,
    row.instrumentName,
    row.securityName,
    row.description,
    row.name,
    row.title,
  ];

  for (const raw of candidates) {
    const cleaned = cleanName(raw, symbol);
    if (cleaned) return cleaned;
  }
  return '';
};

const normalizeRowSnapshot = (row: unknown): QuoteSnapshot | null => {
  if (!row || typeof row !== 'object') return null;
  const source = row as JsonMap;

  const price = pickNumber(source, ['price', 'value', 'lastPrice', 'last', 'ltp', 'close', 'regularMarketPrice', 'bid', 'ask']);
  const change = pickNumber(source, ['priceChange', 'change', 'delta', 'regularMarketChange', 'netChange']);
  const pct = pickNumber(source, ['changePercent', 'percentChange', 'change_percentage', 'change_percent', 'pChange', 'regularMarketChangePercent', 'pct', 'percent']);
  const volume = pickNumber(source, ['volume', 'vol', 'totalVolume', 'avgVolume', 'regularMarketVolume', 'regularMarketVolume3Month', 'averageDailyVolume3Month']);

  if (price == null || price <= 0) return null;

  let finalChange = change;
  let finalPct = pct;

  if ((finalChange == null || !Number.isFinite(finalChange)) && finalPct != null) finalChange = (price * finalPct) / 100;
  if ((finalPct == null || !Number.isFinite(finalPct)) && finalChange != null) {
    const prev = price - finalChange;
    if (prev > 0) finalPct = (finalChange / prev) * 100;
  }

  return {
    price,
    change: finalChange,
    pct: finalPct,
    volume: volume != null && Number.isFinite(volume) && volume >= 0 ? volume : 0,
  };
};

const normalizeInfoSnapshot = (payload: unknown): InfoSnapshot | null => {
  const source = ((payload as JsonMap)?.data || payload || {}) as JsonMap;
  const price = toNumber(source?.regularMarketPrice ?? source?.currentPrice ?? source?.regularMarketClose ?? source?.regularMarketPreviousClose);
  const change = toNumber(source?.regularMarketChange ?? source?.priceChange);
  const pct = toNumber(source?.regularMarketChangePercent ?? source?.priceChangePercent);
  const volume = toNumber(source?.regularMarketVolume ?? source?.volume ?? source?.averageDailyVolume3Month);
  if (price == null || price <= 0) return null;

  let finalChange = change;
  let finalPct = pct;

  if (finalChange == null && finalPct != null) finalChange = (price * finalPct) / 100;
  if (finalPct == null && finalChange != null) {
    const prev = price - finalChange;
    if (prev > 0) finalPct = (finalChange / prev) * 100;
  }

  return {
    name: pickDisplayName(source, String(source?.symbol || source?.ticker || '')),
    price,
    change: finalChange,
    pct: finalPct,
    volume: volume != null && volume >= 0 ? volume : 0,
  };
};

const normalizeHistorySnapshot = (payload: unknown): QuoteSnapshot | null => {
  const data = ((payload as JsonMap)?.data || payload || {}) as JsonMap;
  const closeMap = (data?.Close || data?.close) as JsonMap | undefined;
  const volumeMap = ((data?.Volume || data?.volume || {}) as JsonMap) || {};
  if (!closeMap || typeof closeMap !== 'object') return null;

  const points: Array<{ t: number; close: number }> = [];
  for (const [ts, v] of Object.entries(closeMap)) {
    const t = Number(ts);
    const close = toNumber(v);
    if (!Number.isFinite(t) || close == null || close <= 0) continue;
    points.push({ t, close });
  }
  points.sort((a, b) => a.t - b.t);

  if (!points.length) return null;

  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  const change = prev ? last.close - prev.close : null;
  const pct = prev && prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : null;
  const vol = toNumber(volumeMap?.[String(last.t)]);

  return {
    price: last.close,
    change,
    pct,
    volume: vol != null && vol >= 0 ? vol : 0,
  };
};

export const fetchTagxQuote = async (symbol: string, options: FetchQuoteOptions = {}): Promise<QuoteRow> => {
  const { signal, nameFallback } = options;
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return { symbol: '', name: '', price: null, pct: null, change: null, volume: null };

  const fetchJson = async (url: string): Promise<JsonMap | null> => {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as JsonMap | null;
  };

  const candidates = symbolCandidates(normalized);

  const [rowsList, infoSnaps, historySnaps] = await Promise.all([
    Promise.all(
      candidates.map(async (candidate) => {
        const json = await fetchJson(`${LIVE_API_BASE}/api/market/indices?symbols=${encodeURIComponent(candidate)}`);
        return toArray((json as JsonMap | null)?.data || json);
      }),
    ),
    Promise.all(
      candidates.map(async (candidate) => {
        const json = await fetchJson(`${API_BASE_URL}/api/tagx/stocks/${encodeURIComponent(candidate)}/info`);
        return normalizeInfoSnapshot(json);
      }),
    ),
    Promise.all(
      candidates.map(async (candidate) => {
        const json = await fetchJson(`${API_BASE_URL}/api/tagx/stocks/${encodeURIComponent(candidate)}/history?period=5d&interval=1d`);
        return normalizeHistorySnapshot(json);
      }),
    ),
  ]);

  const match = findBySymbol(rowsList.flat(), normalized);
  const rowSnap = normalizeRowSnapshot(match);
  const infoSnap = infoSnaps.find((item) => item && item.price != null && item.price > 0) || null;
  const historySnap = historySnaps.find((item) => item && item.price != null && item.price > 0) || null;
  const final = infoSnap || rowSnap || historySnap;

  return {
    symbol: normalized,
    name: pickDisplayName(match, normalized) || infoSnap?.name || nameFallback || normalized,
    price: final?.price ?? null,
    pct: final?.pct ?? null,
    change: final?.change ?? null,
    volume: final?.volume ?? null,
  };
};

export const fetchTagxQuotes = async (symbols: string[], options: FetchQuoteOptions = {}): Promise<QuoteRow[]> => {
  const rows = await Promise.all(
    (Array.isArray(symbols) ? symbols : []).map((symbol) =>
      fetchTagxQuote(symbol, options).catch(() => ({
        symbol: normalizeSymbol(symbol),
        name: options?.nameMap?.[normalizeSymbol(symbol)] || normalizeSymbol(symbol),
        price: null,
        pct: null,
        change: null,
        volume: null,
      })),
    ),
  );
  return rows.filter((row) => row.symbol);
};



