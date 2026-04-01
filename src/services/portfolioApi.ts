import { normalizeSymbol } from './watchlistApi';

type JsonMap = Record<string, unknown>;
type FetchLike = (path: string, init?: RequestInit & Record<string, unknown>) => Promise<Response>;

type ApiError = Error & { status?: number; path?: string };

export type PortfolioPosition = {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  sellPrice?: number | null;
  realizedPnl?: number | null;
};

export type PortfolioDoc = {
  id: string;
  email: string;
  positions: PortfolioPosition[];
};

const PORTFOLIO_BASE = '/api/portfolio/position';

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readJson = async (response: Response): Promise<JsonMap | null> => {
  try {
    return (await response.json()) as JsonMap;
  } catch {
    return null;
  }
};

const apiErrorMessage = (payload: JsonMap | null, fallback: string): string =>
  String(payload?.error || payload?.message || payload?.detail || ((payload?.errors as JsonMap[] | undefined)?.[0]?.msg as string | undefined) || fallback);

const requestJson = async (authFetch: FetchLike, path: string, init: RequestInit & Record<string, unknown> = {}): Promise<JsonMap | null> => {
  const response = await authFetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...((init.headers as Record<string, string> | undefined) || {}),
    },
  });

  const payload = await readJson(response);
  if (!response.ok) {
    const error: ApiError = new Error(apiErrorMessage(payload, `Request failed (${response.status})`));
    error.status = response.status;
    error.path = path;
    throw error;
  }

  return payload;
};

const mapPosition = (item: unknown): PortfolioPosition | null => {
  if (!item || typeof item !== 'object') return null;
  const row = item as JsonMap;
  const symbol = normalizeSymbol(String(row.symbol || row.ticker || ''));
  if (!symbol) return null;

  return {
    id: String(row.id || row._id || row.positionId || ''),
    symbol,
    quantity: toNumber(row.quantity),
    buyPrice: toNumber(row.buyPrice ?? row.avgPrice ?? row.price),
    sellPrice: row.sellPrice == null ? null : toNumber(row.sellPrice),
    realizedPnl: row.realizedPnl == null ? null : toNumber(row.realizedPnl),
  };
};

const mapPortfolioDoc = (payload: JsonMap | null): PortfolioDoc => {
  const root = (payload?.data || payload || {}) as JsonMap;
  const positionsRaw: unknown[] =
    (Array.isArray(root.positions) ? (root.positions as unknown[]) : null) ||
    (Array.isArray((root.data as JsonMap | undefined)?.positions) ? ((root.data as JsonMap).positions as unknown[]) : null) ||
    [];

  const positions = positionsRaw
    .map((item) => mapPosition(item))
    .filter((item): item is PortfolioPosition => Boolean(item));

  return {
    id: String(root._id || root.id || ''),
    email: String(root.email || ''),
    positions,
  };
};

export const getPortfolio = async (authFetch: FetchLike): Promise<PortfolioDoc> => {
  const payload = await requestJson(authFetch, PORTFOLIO_BASE, { method: 'GET' });
  return mapPortfolioDoc(payload);
};

export const addPosition = async (
  authFetch: FetchLike,
  params: { symbol: string; buyPrice: number; quantity: number },
): Promise<PortfolioDoc> => {
  const payload = await requestJson(authFetch, PORTFOLIO_BASE, {
    method: 'POST',
    body: JSON.stringify({
      symbol: normalizeSymbol(params.symbol),
      buyPrice: params.buyPrice,
      quantity: params.quantity,
    }),
  });
  return mapPortfolioDoc(payload);
};

export const patchPosition = async (
  authFetch: FetchLike,
  body: { id: string; addQty?: number; addPrice?: number; email?: string; quantity?: number; buyPrice?: number },
): Promise<PortfolioDoc> => {
  const payload = await requestJson(authFetch, PORTFOLIO_BASE, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return mapPortfolioDoc(payload);
};

export const sellPosition = async (
  authFetch: FetchLike,
  body: { email: string; id: string; sellQty: number; sellPrice: number; removeIfZero: boolean },
): Promise<PortfolioDoc> => {
  const payload = await requestJson(authFetch, `${PORTFOLIO_BASE}/sell`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return mapPortfolioDoc(payload);
};

export const deletePosition = async (authFetch: FetchLike, id: string): Promise<PortfolioDoc> => {
  const payload = await requestJson(authFetch, PORTFOLIO_BASE, {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
  return mapPortfolioDoc(payload);
};


