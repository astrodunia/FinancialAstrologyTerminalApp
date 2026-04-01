import { API_BASE_URL } from '../../store/UserContext';

export type IndexTimeframe = '1D' | '5D' | '1M' | '2M' | '3M' | '6M' | '1Y' | '5Y';

export type IndexSnapshot = {
  symbol: string;
  name?: string | null;
  price?: number | null;
  regularMarketPreviousClose?: number | null;
  previousClose?: number | null;
  change?: number | null;
  changePercent?: number | null;
  marketState?: string | null;
};

export type IndexCandle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type IndexSnapshotResponse = {
  ok?: boolean;
  data?: IndexSnapshot[];
};

type IndexCandlesResponse = {
  ok?: boolean;
  data?: IndexCandle[];
};

export const INDEX_TIMEFRAMES: IndexTimeframe[] = ['1D', '5D', '1M', '2M', '3M', '6M', '1Y', '5Y'];

export const INDEX_NAME_MAP: Record<string, string> = {
  GSPC: 'S&P 500',
  IXIC: 'NASDAQ',
  DJI: 'Dow Jones',
  RUT: 'Russell 2000',
};

export const normalizeIndexSymbol = (value?: string | null) => String(value || '').trim().toUpperCase();

export const normalizeIndexTimeframe = (value?: string | null): IndexTimeframe => {
  const normalized = String(value || '').trim().toUpperCase() as IndexTimeframe;
  return INDEX_TIMEFRAMES.includes(normalized) ? normalized : '1M';
};

export const resolveIndexName = (symbol: string, fallbackName?: string | null) =>
  fallbackName?.trim() || INDEX_NAME_MAP[normalizeIndexSymbol(symbol)] || normalizeIndexSymbol(symbol);

export const getSnapshotPreviousClose = (snapshot?: IndexSnapshot | null) =>
  snapshot?.regularMarketPreviousClose ?? snapshot?.previousClose ?? null;

export const classifyIndexMood = (pct?: number | null): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
  if (pct == null || !Number.isFinite(pct)) return 'NEUTRAL';
  if (Math.abs(pct) < 0.15) return 'NEUTRAL';
  return pct > 0 ? 'BULLISH' : 'BEARISH';
};

const buildApiUrl = (path: string) => `${String(API_BASE_URL).replace(/\/+$/, '')}${path}`;

const requestJson = async <T,>(path: string, signal?: AbortSignal) => {
  const response = await fetch(buildApiUrl(path), {
    signal,
    headers: { Accept: 'application/json' },
  });

  let payload: T | null = null;
  try {
    payload = (await response.json()) as T;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = (payload as any)?.error || (payload as any)?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

export const fetchIndexSnapshots = async (symbols: string[], signal?: AbortSignal) => {
  const normalizedSymbols = Array.from(
    new Set(symbols.map((symbol) => normalizeIndexSymbol(symbol)).filter(Boolean)),
  );

  if (!normalizedSymbols.length) return [];

  const payload = await requestJson<IndexSnapshotResponse>(
    `/api/market/indices?symbols=${encodeURIComponent(normalizedSymbols.join(','))}`,
    signal,
  );

  if (!payload?.ok || !Array.isArray(payload.data)) {
    throw new Error('Bad payload');
  }

  return payload.data;
};

export const fetchIndexCandles = async (symbol: string, tf: IndexTimeframe, signal?: AbortSignal) => {
  const normalizedSymbol = normalizeIndexSymbol(symbol);
  const normalizedTf = normalizeIndexTimeframe(tf);
  const apiTf = normalizedTf === '2M' ? '3M' : normalizedTf;

  if (!normalizedSymbol) {
    throw new Error('Missing index symbol');
  }

  const payload = await requestJson<IndexCandlesResponse>(
    `/api/market/index/${encodeURIComponent(normalizedSymbol)}/candles?tf=${encodeURIComponent(apiTf)}`,
    signal,
  );

  if (!payload?.ok || !Array.isArray(payload.data)) {
    throw new Error('Bad payload');
  }

  return payload.data;
};

export const sliceCandlesForTimeframe = (candles: IndexCandle[], tf: IndexTimeframe) => {
  if (tf !== '2M' || !candles.length) return candles;

  const endTs = candles[candles.length - 1]?.t ?? 0;
  const startTs = endTs - 60 * 24 * 60 * 60 * 1000;
  const sliced = candles.filter((item) => item.t >= startTs);
  return sliced.length ? sliced : candles;
};
