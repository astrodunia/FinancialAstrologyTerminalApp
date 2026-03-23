import { API_BASE_URL } from '../../store/UserContext';
import { HEATMAP_META, HEATMAP_META_BY_SYMBOL } from './heatmapMeta';
import type { DashboardInfoEnvelope, HeatmapQuote } from './types';

const BACKEND_BASE_URL =
  ((globalThis as any)?.process?.env?.EXPO_PUBLIC_RAJEEVPRAKASH_BACKEND_URL as string | undefined) ||
  API_BASE_URL;

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const sanitizePositiveSize = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 1;
  return value;
};

export const buildHeatmapUrl = (tickersCsv: string) =>
  `${String(BACKEND_BASE_URL).replace(/\/+$/, '')}/api/tagx/dashboard/info?tickers=${encodeURIComponent(
    tickersCsv,
  )}`;

export const fetchHeatmapEnvelope = async (tickersCsv: string, signal?: AbortSignal): Promise<DashboardInfoEnvelope> => {
  const response = await fetch(buildHeatmapUrl(tickersCsv), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  const payload = (await response.json().catch(() => null)) as DashboardInfoEnvelope | null;

  if (!response.ok || !payload?.ok) {
    throw new Error((payload as any)?.message || `Heatmap request failed (${response.status})`);
  }

  return payload;
};

export const transformHeatmapEnvelope = (payload: DashboardInfoEnvelope): HeatmapQuote[] => {
  return HEATMAP_META.map((meta) => {
    const row = payload?.data?.[meta.symbol];
    const source = row?.data;
    const price = toNumber(source?.price);
    const prevClose = toNumber(source?.prevClose);
    const sessionClose = toNumber(source?.sessionClose);
    const volume = toNumber(source?.volume);
    const refPrice = prevClose ?? sessionClose ?? null;
    const change = refPrice && price && refPrice > 0 ? ((price - refPrice) / refPrice) * 100 : 0;
    const size = sanitizePositiveSize(volume && volume > 0 ? volume : price && price > 0 ? Math.abs(price) : 1);

    return {
      symbol: meta.symbol,
      name: source?.name || meta.symbol,
      sector: meta.sector,
      astroStrength: meta.astroStrength,
      logoUrl: meta.logoUrl,
      price,
      prevClose,
      sessionClose,
      volume,
      change,
      size,
    };
  });
};

export const createMockHeatmapData = (): HeatmapQuote[] => {
  return HEATMAP_META.map((meta, index) => {
    const price = 90 + index * 17.35;
    const prevClose = price * (1 - ((index % 7) - 3) * 0.0125);
    const refPrice = prevClose ?? price;
    const change = refPrice && price && refPrice > 0 ? ((price - refPrice) / refPrice) * 100 : 0;

    return {
      symbol: meta.symbol,
      name: meta.symbol,
      sector: meta.sector,
      astroStrength: meta.astroStrength,
      logoUrl: meta.logoUrl,
      price,
      prevClose,
      sessionClose: prevClose,
      volume: 1_000_000 * (index + 1),
      change,
      size: 1_000_000 * (index + 1),
    };
  });
};

export const getHeatmapMetaForSymbol = (symbol: string) => HEATMAP_META_BY_SYMBOL[symbol];
