import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useUser } from '../../store/UserContext';
import {
  createStockAlert,
  deleteStockAlert,
  fetchCompanyProfile,
  fetchStockAlerts,
  fetchStockFundamentals,
  fetchStockHistory,
  fetchStockInfo,
  fetchStockNews,
  mapAlerts,
  mapCompanyProfile,
  mapHistory,
  mapNews,
  mapStockInfo,
  updateStockAlert,
} from './api';
import { normalizeStockSymbol } from './navigation';
import {
  addSimpleWatchlistTicker,
  getSimpleWatchlistTickers,
  normalizeSymbol,
  removeSimpleWatchlistTicker,
} from '../../services/watchlistApi';

const useStableResource = <T,>(
  key: string,
  enabled: boolean,
  load: (signal: AbortSignal) => Promise<T>,
) => {
  const mountedRef = useRef(true);
  const loadRef = useRef(load);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setLoading(true);
    setError('');

    loadRef.current(controller.signal)
      .then((next) => {
        if (!mountedRef.current || controller.signal.aborted) return;
        setData(next);
      })
      .catch((err) => {
        if (!mountedRef.current || controller.signal.aborted) return;
        setError(err?.message || 'Failed to load.');
      })
      .finally(() => {
        if (!mountedRef.current || controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [enabled, key, reloadTick]);

  const reload = useCallback(() => {
    setReloadTick((value) => value + 1);
  }, []);

  return { data, loading, error, reload };
};

export const useStockInfo = (symbol: string) => {
  const { authFetch } = useUser() as any;
  const normalizedSymbol = useMemo(() => normalizeStockSymbol(symbol), [symbol]);

  const infoState = useStableResource(
    `info:${normalizedSymbol}`,
    Boolean(normalizedSymbol),
    useCallback(
      async (signal: AbortSignal) => {
        const payload = await fetchStockInfo(authFetch as any, normalizedSymbol, signal);
        return mapStockInfo(payload, normalizedSymbol);
      },
      [authFetch, normalizedSymbol],
    ),
  );

  const companyState = useStableResource(
    `company:${normalizedSymbol}`,
    Boolean(normalizedSymbol),
    useCallback(
      async (signal: AbortSignal) => {
        try {
          const payload = await fetchCompanyProfile(authFetch as any, normalizedSymbol, signal);
          return mapCompanyProfile(payload);
        } catch {
          return null;
        }
      },
      [authFetch, normalizedSymbol],
    ),
  );

  return {
    info: infoState.data,
    company: companyState.data,
    loading: infoState.loading && !infoState.data,
    refreshing: infoState.loading,
    error: infoState.error,
    reload: infoState.reload,
  };
};

export const useStockHistory = (symbol: string, timeframe: string, enabled = true) => {
  const { authFetch } = useUser() as any;
  const normalizedSymbol = useMemo(() => normalizeStockSymbol(symbol), [symbol]);

  return useStableResource(
    `history:${normalizedSymbol}:${timeframe}`,
    Boolean(normalizedSymbol) && enabled,
    useCallback(
      async (signal: AbortSignal) => {
        const payload = await fetchStockHistory(authFetch as any, normalizedSymbol, timeframe, signal);
        return mapHistory(payload);
      },
      [authFetch, normalizedSymbol, timeframe],
    ),
  );
};

export const useStockFundamentals = (symbol: string, enabled = true) => {
  const { authFetch } = useUser() as any;
  const normalizedSymbol = useMemo(() => normalizeStockSymbol(symbol), [symbol]);

  return useStableResource(
    `fundamentals:${normalizedSymbol}`,
    Boolean(normalizedSymbol) && enabled,
    useCallback(
      async (signal: AbortSignal) => fetchStockFundamentals(authFetch as any, normalizedSymbol, signal),
      [authFetch, normalizedSymbol],
    ),
  );
};

export const useStockNews = (symbol: string, enabled = true) => {
  const { authFetch } = useUser() as any;
  const normalizedSymbol = useMemo(() => normalizeStockSymbol(symbol), [symbol]);

  return useStableResource(
    `news:${normalizedSymbol}`,
    Boolean(normalizedSymbol) && enabled,
    useCallback(
      async (signal: AbortSignal) => {
        const payload = await fetchStockNews(authFetch as any, normalizedSymbol, signal);
        return mapNews(payload);
      },
      [authFetch, normalizedSymbol],
    ),
  );
};

export const useTickerAlerts = (symbol: string, enabled = true) => {
  const { authFetch, user } = useUser() as any;
  const normalizedSymbol = useMemo(() => normalizeStockSymbol(symbol), [symbol]);
  const email = user?.email || '';

  const state = useStableResource(
    `alerts:${email}:${normalizedSymbol}`,
    Boolean(email) && Boolean(normalizedSymbol) && enabled,
    useCallback(
      async (signal: AbortSignal) => {
        const payload = await fetchStockAlerts(authFetch as any, email, signal);
        return mapAlerts(payload).filter((item) => item.symbol === normalizedSymbol);
      },
      [authFetch, email, normalizedSymbol],
    ),
  );

  const createAlert = useCallback(
    async (condition: string, targetPrice: number) => {
      await createStockAlert(authFetch as any, { email, symbol: normalizedSymbol, condition, targetPrice });
      state.reload();
    },
    [authFetch, email, normalizedSymbol, state],
  );

  const removeAlert = useCallback(
    async (id: string) => {
      await deleteStockAlert(authFetch as any, id);
      state.reload();
    },
    [authFetch, state],
  );

  const toggleAlert = useCallback(
    async (id: string, enabledValue: boolean) => {
      await updateStockAlert(authFetch as any, id, { enabled: enabledValue });
      state.reload();
    },
    [authFetch, state],
  );

  return {
    ...state,
    email,
    createAlert,
    removeAlert,
    toggleAlert,
  };
};

export const useTickerWatchlist = (symbol: string, enabled = true) => {
  const { authFetch, token } = useUser() as any;
  const normalizedSymbol = useMemo(() => normalizeSymbol(symbol), [symbol]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(Boolean(enabled && token && normalizedSymbol));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!enabled || !token || !normalizedSymbol) {
      setInWatchlist(false);
      setLoading(false);
      setError('');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      const tickers = await getSimpleWatchlistTickers(authFetch as any, signal);
      const exists = tickers.includes(normalizedSymbol);
      setInWatchlist(exists);
      return exists;
    } catch (err: any) {
      if (String(err?.message || '').toLowerCase().includes('abort')) {
        throw err;
      }
      setError(err?.message || 'Unable to load watchlist.');
      setInWatchlist(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [authFetch, enabled, normalizedSymbol, token]);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal).catch((err) => {
      if (!String(err?.message || '').toLowerCase().includes('abort')) {
        setError(err?.message || 'Unable to load watchlist.');
      }
    });
    return () => controller.abort();
  }, [refresh]);

  const add = useCallback(async () => {
    if (!token) {
      throw new Error('Sign in to save stocks to your watchlist.');
    }
    if (!normalizedSymbol) {
      throw new Error('Invalid symbol');
    }

    setSaving(true);
    setError('');
    try {
      const tickers = await addSimpleWatchlistTicker(authFetch as any, normalizedSymbol);
      const exists = tickers.includes(normalizedSymbol);
      setInWatchlist(exists);
      return exists;
    } catch (err: any) {
      setError(err?.message || 'Unable to add to watchlist.');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [authFetch, normalizedSymbol, token]);

  const remove = useCallback(async () => {
    if (!token) {
      throw new Error('Sign in to manage your watchlist.');
    }
    if (!normalizedSymbol) {
      throw new Error('Invalid symbol');
    }

    setSaving(true);
    setError('');
    try {
      const tickers = await removeSimpleWatchlistTicker(authFetch as any, normalizedSymbol);
      const exists = tickers.includes(normalizedSymbol);
      setInWatchlist(exists);
      return exists;
    } catch (err: any) {
      setError(err?.message || 'Unable to remove from watchlist.');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [authFetch, normalizedSymbol, token]);

  const toggle = useCallback(async () => {
    if (inWatchlist) {
      return remove();
    }
    return add();
  }, [add, inWatchlist, remove]);

  return {
    inWatchlist,
    loading,
    saving,
    error,
    refresh,
    add,
    remove,
    toggle,
  };
};
