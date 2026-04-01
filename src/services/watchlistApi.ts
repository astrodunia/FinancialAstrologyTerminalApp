type JsonMap = Record<string, unknown>;
type FetchLike = (path: string, init?: RequestInit & Record<string, unknown>) => Promise<Response>;

type ApiError = Error & { status?: number; path?: string };

type WatchlistMeta = {
  id: string;
  title: string;
  symbols: string[];
  count: number;
};

const WATCHLIST_BASE = '/api/watchlists';

const normalizeSymbol = (value: string = ''): string => String(value || '').toUpperCase().replace(/[^A-Z0-9.-]/g, '');

const toArray = (payload: unknown): JsonMap[] => {
  const data = payload as JsonMap;
  if (Array.isArray(payload)) return payload as JsonMap[];
  if (Array.isArray(data?.data)) return data.data as JsonMap[];
  if (Array.isArray((data?.data as JsonMap)?.items)) return (data.data as JsonMap).items as JsonMap[];
  if (Array.isArray((data?.data as JsonMap)?.watchlists)) return (data.data as JsonMap).watchlists as JsonMap[];
  if (Array.isArray((data?.result as JsonMap)?.items)) return (data.result as JsonMap).items as JsonMap[];
  if (Array.isArray(data?.items)) return data.items as JsonMap[];
  if (Array.isArray(data?.result)) return data.result as JsonMap[];
  if (Array.isArray(data?.watchlists)) return data.watchlists as JsonMap[];

  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    const vals = Object.values(data.data as JsonMap);
    if (vals.length && vals.every((item) => item && typeof item === 'object')) return vals as JsonMap[];
  }
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const vals = Object.values(payload as JsonMap);
    if (vals.length && vals.every((item) => item && typeof item === 'object')) return vals as JsonMap[];
  }
  return [];
};

const mapSymbols = (listLike: unknown): string[] => {
  const row = (listLike || {}) as JsonMap;
  const nested = (row.data || {}) as JsonMap;
  const raw =
    row.symbols ||
    row.symbolsList ||
    row.stocks ||
    row.watchlistSymbols ||
    row.tickers ||
    row.items ||
    nested.symbols ||
    nested.stocks ||
    nested.tickers ||
    [];

  if (!Array.isArray(raw)) return [];

  return [
    ...new Set(
      raw
        .map((item: unknown) => {
          if (typeof item === 'string') return normalizeSymbol(item);
          const obj = (item || {}) as JsonMap;
          return normalizeSymbol(String(obj.symbol || obj.ticker || obj.code || obj.instrument || obj.s || obj.stockSymbol || obj.tickerSymbol || ''));
        })
        .filter(Boolean),
    ),
  ];
};

const mapMeta = (item: unknown): WatchlistMeta => {
  const row = (item || {}) as JsonMap;
  const symbols = mapSymbols(item);
  const countRaw = Number(row?.count);

  return {
    id: String(row?.id || row?._id || row?.watchlistId || row?.watchlist_id || row?.uuid || ''),
    title: String(row?.title || row?.name || row?.watchlistTitle || row?.watchlist_title || 'Untitled'),
    symbols,
    count: Number.isFinite(countRaw) ? countRaw : symbols.length,
  };
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

const requestJson = async (
  authFetch: FetchLike,
  path: string,
  init: RequestInit & Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<JsonMap | null> => {
  const response = await authFetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...((init.headers as Record<string, string> | undefined) || {}),
    },
    signal,
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

const unwrapWatchlist = (payload: JsonMap | null): unknown => payload?.data || payload?.item || payload?.watchlist || payload?.result || payload;

export const getLists = async (authFetch: FetchLike, signal?: AbortSignal): Promise<WatchlistMeta[]> => {
  const payload = await requestJson(authFetch, WATCHLIST_BASE, {}, signal);
  return toArray(payload).map(mapMeta).filter((item) => item.id);
};

export const getListById = async (authFetch: FetchLike, id: string, signal?: AbortSignal): Promise<WatchlistMeta> => {
  const encoded = encodeURIComponent(id);
  const payload = await requestJson(authFetch, `${WATCHLIST_BASE}/${encoded}`, {}, signal);
  const mapped = mapMeta(unwrapWatchlist(payload));
  if (!mapped.id) mapped.id = String(id);
  return mapped;
};

export const createList = async (authFetch: FetchLike, title: string): Promise<WatchlistMeta> => {
  const value = String(title || '').trim();
  if (!value) throw new Error('title is required');

  const payload = await requestJson(authFetch, WATCHLIST_BASE, {
    method: 'POST',
    body: JSON.stringify({ title: value }),
  });

  return mapMeta(unwrapWatchlist(payload));
};

export const renameList = async (authFetch: FetchLike, id: string, title: string): Promise<WatchlistMeta> => {
  const value = String(title || '').trim();
  if (!value) throw new Error('title is required');

  const encoded = encodeURIComponent(id);
  const payload = await requestJson(authFetch, `${WATCHLIST_BASE}/${encoded}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: value }),
  });

  return mapMeta(unwrapWatchlist(payload));
};

export const deleteList = async (authFetch: FetchLike, id: string): Promise<boolean> => {
  const encoded = encodeURIComponent(id);
  await requestJson(authFetch, `${WATCHLIST_BASE}/${encoded}`, { method: 'DELETE' });
  return true;
};

export const addSymbol = async (authFetch: FetchLike, id: string, ticker: string): Promise<WatchlistMeta> => {
  const symbol = normalizeSymbol(ticker);
  if (!symbol) throw new Error('Invalid symbol');

  const encoded = encodeURIComponent(id);
  const payload = await requestJson(authFetch, `${WATCHLIST_BASE}/${encoded}/symbols`, {
    method: 'POST',
    body: JSON.stringify({ symbol }),
  });

  return mapMeta(unwrapWatchlist(payload));
};

export const removeSymbol = async (authFetch: FetchLike, id: string, ticker: string): Promise<WatchlistMeta> => {
  const symbol = normalizeSymbol(ticker);
  if (!symbol) throw new Error('Invalid symbol');

  const encoded = encodeURIComponent(id);
  const payload = await requestJson(authFetch, `${WATCHLIST_BASE}/${encoded}/symbols`, {
    method: 'DELETE',
    body: JSON.stringify({ symbol }),
  });

  return mapMeta(unwrapWatchlist(payload));
};

export { normalizeSymbol };
