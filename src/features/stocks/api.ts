import { API_BASE_URL } from '../../store/UserContext';
import {
  type CompanyProfile,
  type FundamentalsBundle,
  type StockAlert,
  type StockHistoryPoint,
  type StockInfo,
  type StockNewsItem,
  type StockOfficer,
} from './types';
import { getChartTimeframeConfig, normalizeChartTimeframe, normalizeStockSymbol, TF_INTERVAL_FALLBACKS } from './navigation';

type Fetcher = (input: string, init?: RequestInit & Record<string, unknown>) => Promise<Response>;

const BASE_URL = API_BASE_URL.replace(/\/+$/, '');

const getApiPath = (path: string) => `${BASE_URL}${path}`;

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toString = (value: unknown): string => (typeof value === 'string' ? value : '');

const toArray = <T = Record<string, unknown>>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray((payload as any)?.data)) return (payload as any).data as T[];
  if (Array.isArray((payload as any)?.items)) return (payload as any).items as T[];
  if (Array.isArray((payload as any)?.result)) return (payload as any).result as T[];
  return [];
};

const toObjectArray = (payload: unknown): Record<string, unknown>[] => {
  const direct = toArray<Record<string, unknown>>(payload);
  if (direct.length) return direct;

  const record = (payload as any)?.data || (payload as any)?.result || payload;
  if (record && typeof record === 'object' && !Array.isArray(record)) {
    const values = Object.values(record as Record<string, unknown>);
    if (values.every((item) => item && typeof item === 'object')) {
      return values as Record<string, unknown>[];
    }
  }

  return [];
};

const parseTagxRawObject = (payload: unknown): Record<string, unknown> | null => {
  const raw = typeof (payload as any)?.raw === 'string' ? (payload as any).raw : '';
  if (!raw) return null;

  try {
    return JSON.parse(raw.replace(/\bNaN\b/g, 'null')) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const mapObjectMapToRows = (payload: unknown): Record<string, unknown>[] => {
  const parsed = parseTagxRawObject(payload);
  if (!parsed || Array.isArray(parsed)) return [];

  return Object.entries(parsed)
    .map(([period, row]) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
      return {
        period,
        ...(row as Record<string, unknown>),
      };
    })
    .filter(Boolean) as Record<string, unknown>[];
};

const parseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const requestJson = async (
  fetcher: Fetcher,
  path: string,
  init: RequestInit & Record<string, unknown> = {},
) => {
  const response = await fetcher(getApiPath(path), init);
  const payload = await parseJson(response);

  if (!response.ok) {
    const message =
      (payload as any)?.error ||
      (payload as any)?.message ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

export const mapStockInfo = (payload: unknown, symbolFallback = ''): StockInfo => {
  const source = (payload as any)?.data || payload || {};
  const officers = Array.isArray((source as any)?.companyOfficers)
    ? (source as any).companyOfficers
        .map((item: any): StockOfficer | null => {
          const name = toString(item?.name);
          if (!name) return null;
          return {
            name,
            title: toString(item?.title),
            age: toNumber(item?.age ?? item?.yearBorn),
            totalPay: toNumber(item?.totalPay),
          };
        })
        .filter(Boolean)
    : [];

  return {
    symbol: normalizeStockSymbol(toString((source as any)?.symbol || symbolFallback)),
    shortName: toString((source as any)?.shortName),
    longName: toString((source as any)?.longName || (source as any)?.companyName),
    exchange: toString((source as any)?.exchange || (source as any)?.fullExchangeName),
    marketState: toString((source as any)?.marketState),
    sector: toString((source as any)?.sector),
    industry: toString((source as any)?.industry),
    currency: toString((source as any)?.currency),
    regularMarketPrice: toNumber((source as any)?.regularMarketPrice ?? (source as any)?.currentPrice),
    regularMarketChange: toNumber((source as any)?.regularMarketChange ?? (source as any)?.priceChange),
    regularMarketChangePercent: toNumber(
      (source as any)?.regularMarketChangePercent ?? (source as any)?.priceChangePercent,
    ),
    regularMarketOpen: toNumber((source as any)?.regularMarketOpen ?? (source as any)?.open),
    regularMarketPreviousClose: toNumber((source as any)?.regularMarketPreviousClose ?? (source as any)?.previousClose),
    regularMarketDayHigh: toNumber((source as any)?.regularMarketDayHigh ?? (source as any)?.dayHigh),
    regularMarketDayLow: toNumber((source as any)?.regularMarketDayLow ?? (source as any)?.dayLow),
    regularMarketClose: toNumber((source as any)?.regularMarketClose ?? (source as any)?.close),
    fiftyTwoWeekHigh: toNumber((source as any)?.fiftyTwoWeekHigh ?? (source as any)?.fiftyTwoWeekHighPrice),
    fiftyTwoWeekLow: toNumber((source as any)?.fiftyTwoWeekLow ?? (source as any)?.fiftyTwoWeekLowPrice),
    marketCap: toNumber((source as any)?.marketCap),
    beta: toNumber((source as any)?.beta),
    averageDailyVolume3Month: toNumber((source as any)?.averageDailyVolume3Month ?? (source as any)?.averageVolume),
    averageDailyVolume10Day: toNumber((source as any)?.averageDailyVolume10Day ?? (source as any)?.averageVolume10days),
    regularMarketVolume: toNumber((source as any)?.regularMarketVolume ?? (source as any)?.volume),
    trailingPE: toNumber((source as any)?.trailingPE ?? (source as any)?.peRatio),
    forwardPE: toNumber((source as any)?.forwardPE),
    dividendYield: toNumber((source as any)?.dividendYield),
    grossMargins: toNumber((source as any)?.grossMargins),
    operatingMargins: toNumber((source as any)?.operatingMargins),
    profitMargins: toNumber((source as any)?.profitMargins),
    returnOnEquity: toNumber((source as any)?.returnOnEquity),
    returnOnAssets: toNumber((source as any)?.returnOnAssets),
    revenueGrowth: toNumber((source as any)?.revenueGrowth),
    dividendRate: toNumber((source as any)?.dividendRate),
    trailingAnnualDividendRate: toNumber((source as any)?.trailingAnnualDividendRate),
    trailingAnnualDividendYield: toNumber((source as any)?.trailingAnnualDividendYield),
    targetMeanPrice: toNumber((source as any)?.targetMeanPrice),
    targetHighPrice: toNumber((source as any)?.targetHighPrice),
    targetLowPrice: toNumber((source as any)?.targetLowPrice),
    numberOfAnalystOpinions: toNumber((source as any)?.numberOfAnalystOpinions),
    averageAnalystRating: toString((source as any)?.averageAnalystRating),
    recommendationKey: toString((source as any)?.recommendationKey),
    fullTimeEmployees: toNumber((source as any)?.fullTimeEmployees),
    address1: toString((source as any)?.address1),
    city: toString((source as any)?.city),
    state: toString((source as any)?.state),
    zip: toString((source as any)?.zip),
    country: toString((source as any)?.country),
    longBusinessSummary: toString((source as any)?.longBusinessSummary ?? (source as any)?.description),
    website: toString((source as any)?.website),
    companyOfficers: officers as StockOfficer[],
  };
};

export const mapCompanyProfile = (payload: unknown): CompanyProfile => {
  const source = (payload as any)?.data || payload || {};
  return {
    name: toString((source as any)?.name || (source as any)?.companyName),
    sector: toString((source as any)?.sector),
    industry: toString((source as any)?.industry),
    description: toString((source as any)?.description || (source as any)?.about),
    ceo: toString((source as any)?.ceo || (source as any)?.md || (source as any)?.managingDirector),
    founded: toString((source as any)?.founded || (source as any)?.foundedIn),
    exchange: toString((source as any)?.exchange),
    website: toString((source as any)?.website),
  };
};

const historyPointFromObject = (entry: Record<string, unknown>): StockHistoryPoint | null => {
  const timestamp =
    toNumber(entry.timestamp) ??
    toNumber(entry.date) ??
    toNumber(entry.datetime) ??
    (typeof entry.date === 'string' ? new Date(entry.date).getTime() : null) ??
    (typeof entry.datetime === 'string' ? new Date(entry.datetime).getTime() : null);

  const close = toNumber(entry.close ?? entry.adjclose ?? entry.value ?? entry.price);
  const open = toNumber(entry.open);
  const high = toNumber(entry.high);
  const low = toNumber(entry.low);
  const volume = toNumber(entry.volume);
  const value = close ?? high ?? low ?? open;

  if (!timestamp || value == null) return null;

  return {
    timestamp,
    value,
    open,
    high,
    low,
    close,
    volume,
  };
};

export const mapHistory = (payload: unknown): StockHistoryPoint[] => {
  const aggs = buildAggsFromTagx((payload as any)?.data || payload);
  if (aggs.length) {
    return aggs;
  }

  const items = toObjectArray(payload)
    .map(historyPointFromObject)
    .filter(Boolean) as StockHistoryPoint[];

  if (items.length) {
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }

  const source = (payload as any)?.data || payload || {};
  const timestamps = Array.isArray((source as any)?.timestamp) ? (source as any).timestamp : [];
  const quote = Array.isArray((source as any)?.indicators?.quote)
    ? (source as any).indicators.quote[0]
    : (source as any)?.quote || {};
  const closes = Array.isArray(quote?.close) ? quote.close : [];
  const opens = Array.isArray(quote?.open) ? quote.open : [];
  const highs = Array.isArray(quote?.high) ? quote.high : [];
  const lows = Array.isArray(quote?.low) ? quote.low : [];
  const volumes = Array.isArray(quote?.volume) ? quote.volume : [];

  return timestamps
    .map((ts: unknown, index: number) => {
      const timestamp = typeof ts === 'number' ? ts * 1000 : new Date(String(ts)).getTime();
      const value = toNumber(closes[index]);
      if (!Number.isFinite(timestamp) || value == null) return null;

      return {
        timestamp,
        value,
        open: toNumber(opens[index]),
        high: toNumber(highs[index]),
        low: toNumber(lows[index]),
        close: value,
        volume: toNumber(volumes[index]),
      };
    })
    .filter(Boolean) as StockHistoryPoint[];
};

export const buildAggsFromTagx = (data?: any): StockHistoryPoint[] => {
  if (!data) return [];

  const closeMap = data.Close || data.close;
  const openMap = data.Open || data.open;
  const highMap = data.High || data.high;
  const lowMap = data.Low || data.low;
  const volumeMap = data.Volume || data.volume;

  const keys = Object.keys(closeMap || openMap || {});
  const aggs: StockHistoryPoint[] = [];

  keys.forEach((ts) => {
    let t = Number(ts);
    if (!Number.isFinite(t)) return;
    if (t < 1e12) t *= 1000;

    const c = Number(closeMap?.[ts] ?? openMap?.[ts] ?? 0);
    const h = Number(highMap?.[ts] ?? c);
    const l = Number(lowMap?.[ts] ?? c);
    const v = Number(volumeMap?.[ts] ?? 0);

    if (!Number.isFinite(c) || !Number.isFinite(h) || !Number.isFinite(l)) return;

    aggs.push({
      timestamp: t,
      value: c,
      close: c,
      open: Number.isFinite(Number(openMap?.[ts])) ? Number(openMap?.[ts]) : c,
      high: h,
      low: l,
      volume: Number.isFinite(v) ? v : 0,
    });
  });

  return aggs.sort((a, b) => a.timestamp - b.timestamp);
};

export const mapNews = (payload: unknown): StockNewsItem[] => {
  const direct = toObjectArray(payload);
  const raw = parseTagxRawObject(payload);
  const fallback = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : Array.isArray((raw as any)?.data)
      ? ((raw as any).data as Record<string, unknown>[])
      : [];
  const sourceItems = direct.length ? direct : fallback;

  return sourceItems.map((item, index) => {
    const content = (item as any)?.content || item;
    const thumbnail =
      toString(content?.thumbnail?.resolutions?.find?.((entry: any) => entry?.tag === '170x128')?.url) ||
      toString(content?.thumbnail?.originalUrl) ||
      toString(content?.thumbnail) ||
      toString(content?.image) ||
      toString(content?.imageUrl);

    return {
      id: toString(item.id || item.uuid || `${content?.canonicalUrl?.url || content?.clickThroughUrl?.url || 'news'}-${index}`),
      title: toString(content?.title || content?.headline),
      summary: toString(content?.summary || content?.description || content?.snippet),
      provider: toString(content?.provider?.displayName || content?.provider || content?.publisher || content?.source),
      publishedAt: toString(content?.pubDate || content?.displayTime || content?.publishedAt || content?.providerPublishTime || content?.date),
      thumbnail,
      url: toString(content?.canonicalUrl?.url || content?.clickThroughUrl?.url || content?.previewUrl || content?.link || content?.url),
    };
  });
};

export const mapAlerts = (payload: unknown): StockAlert[] => {
  return toObjectArray(payload).map((item, index) => ({
    id: toString(item.id || item._id || item.alertId || `${item.symbol || item.ticker || 'alert'}-${index}`),
    symbol: normalizeStockSymbol(toString(item.symbol || item.ticker)),
    email: toString(item.email || item.userEmail),
    condition: toString(item.condition || item.direction || item.operator || 'above').toLowerCase(),
    targetPrice: toNumber(item.targetPrice ?? item.target_price ?? item.price ?? item.threshold),
    enabled: item.enabled == null ? item.is_active !== false : Boolean(item.enabled),
    raw: item,
  }));
};

export const fetchStockInfo = (fetcher: Fetcher, symbol: string, signal?: AbortSignal) =>
  requestJson(fetcher, `/api/tagx/stocks/${encodeURIComponent(normalizeStockSymbol(symbol))}/info`, { signal });

export const fetchStockHistory = (
  fetcher: Fetcher,
  symbol: string,
  timeframe: string,
  signal?: AbortSignal,
) => {
  const config = getChartTimeframeConfig(timeframe);
  const normalizedTimeframe = normalizeChartTimeframe(timeframe);
  const fallbacks =
    TF_INTERVAL_FALLBACKS[normalizedTimeframe as keyof typeof TF_INTERVAL_FALLBACKS] || [config.interval];
  const tried = new Set();

  const load = async () => {
    for (const interval of fallbacks) {
      if (tried.has(interval)) continue;
      tried.add(interval);

      const payload = await requestJson(
        fetcher,
        `/api/tagx/stocks/${encodeURIComponent(normalizeStockSymbol(symbol))}/history?period=${encodeURIComponent(
          config.period,
        )}&interval=${encodeURIComponent(interval)}`,
        { signal },
      );

      const aggs = buildAggsFromTagx((payload as any)?.data || payload);
      if (aggs.length) {
        return payload;
      }
    }

    return requestJson(
      fetcher,
      `/api/tagx/stocks/${encodeURIComponent(normalizeStockSymbol(symbol))}/history?period=${encodeURIComponent(
        config.period,
      )}&interval=${encodeURIComponent(config.interval)}`,
      { signal },
    );
  };

  return load();
};

export const fetchCompanyProfile = (fetcher: Fetcher, symbol: string, signal?: AbortSignal) =>
  requestJson(fetcher, `/api/market/company?ticker=${encodeURIComponent(normalizeStockSymbol(symbol))}`, { signal });

export const fetchStockNews = (fetcher: Fetcher, symbol: string, signal?: AbortSignal) =>
  requestJson(fetcher, `/api/tagx/stocks/${encodeURIComponent(normalizeStockSymbol(symbol))}/news`, { signal });

export const fetchStockFundamentals = async (
  fetcher: Fetcher,
  symbol: string,
  signal?: AbortSignal,
): Promise<FundamentalsBundle> => {
  const normalized = encodeURIComponent(normalizeStockSymbol(symbol));

  const [info, balanceSheet, incomeStatement, earningsEstimate, earningsHistory, recommendations, revenueEstimate] =
    await Promise.all([
      requestJson(fetcher, `/api/tagx/stocks/${normalized}/info`, { signal }),
      requestJson(fetcher, `/api/tagx/stocks/${normalized}/balancesheet`, { signal }),
      requestJson(fetcher, `/api/tagx/stocks/${normalized}/incomestatement`, { signal }),
      requestJson(fetcher, `/api/tagx/stocks/${normalized}/earnings_estimate`, { signal }),
      requestJson(fetcher, `/api/tagx/stocks/${normalized}/earnings_history`, { signal }),
      requestJson(fetcher, `/api/tagx/stocks/${normalized}/recommendations`, { signal }),
      requestJson(fetcher, `/api/tagx/stocks/${normalized}/revenue_estimate`, { signal }),
    ]);

  return {
    info: mapStockInfo(info, symbol),
    balanceSheet: toObjectArray(balanceSheet).length ? toObjectArray(balanceSheet) : mapObjectMapToRows(balanceSheet),
    incomeStatement: toObjectArray(incomeStatement).length ? toObjectArray(incomeStatement) : mapObjectMapToRows(incomeStatement),
    earningsEstimate: toObjectArray(earningsEstimate).length ? toObjectArray(earningsEstimate) : mapObjectMapToRows(earningsEstimate),
    earningsHistory: toObjectArray(earningsHistory).length ? toObjectArray(earningsHistory) : mapObjectMapToRows(earningsHistory),
    recommendations: toObjectArray(recommendations).length ? toObjectArray(recommendations) : mapObjectMapToRows(recommendations),
    revenueEstimate: toObjectArray(revenueEstimate).length ? toObjectArray(revenueEstimate) : mapObjectMapToRows(revenueEstimate),
  };
};

export const fetchStockAlerts = (fetcher: Fetcher, email: string, signal?: AbortSignal) =>
  requestJson(fetcher, `/api/alerts?email=${encodeURIComponent(email)}`, { signal });

export const createStockAlert = (
  fetcher: Fetcher,
  payload: { email: string; symbol: string; condition: string; targetPrice: number },
) =>
  requestJson(fetcher, '/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.email,
      symbol: normalizeStockSymbol(payload.symbol),
      ticker: normalizeStockSymbol(payload.symbol),
      condition: payload.condition,
      direction: payload.condition,
      targetPrice: payload.targetPrice,
      target_price: payload.targetPrice,
      price: payload.targetPrice,
      threshold: payload.targetPrice,
      enabled: true,
      is_active: true,
    }),
  });

export const updateStockAlert = (
  fetcher: Fetcher,
  id: string,
  payload: Partial<{ condition: string; targetPrice: number; enabled: boolean }>,
) =>
  requestJson(fetcher, '/api/alerts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      condition: payload.condition,
      direction: payload.condition,
      targetPrice: payload.targetPrice,
      target_price: payload.targetPrice,
      price: payload.targetPrice,
      threshold: payload.targetPrice,
      enabled: payload.enabled,
      is_active: payload.enabled,
    }),
  });

export const deleteStockAlert = (fetcher: Fetcher, id: string) =>
  requestJson(fetcher, '/api/alerts', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
