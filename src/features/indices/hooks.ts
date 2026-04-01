import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchIndexCandles,
  fetchIndexSnapshots,
  getSnapshotPreviousClose,
  normalizeIndexSymbol,
  normalizeIndexTimeframe,
  resolveIndexName,
  sliceCandlesForTimeframe,
  type IndexCandle,
  type IndexSnapshot,
  type IndexTimeframe,
} from './api';

const useStableResource = <T,>(
  key: string,
  enabled: boolean,
  load: (signal: AbortSignal) => Promise<T>,
) => {
  const mountedRef = useRef(true);
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
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError('');

    load(controller.signal)
      .then((next) => {
        if (!mountedRef.current || controller.signal.aborted) return;
        setData(next);
      })
      .catch((err) => {
        if (!mountedRef.current || controller.signal.aborted) return;
        setError(err?.message || 'Failed to load.');
        setData(null);
      })
      .finally(() => {
        if (!mountedRef.current || controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [enabled, key, load, reloadTick]);

  const reload = useCallback(() => {
    setReloadTick((value) => value + 1);
  }, []);

  return { data, loading, error, reload };
};

export const useIndexSnapshots = (symbols: string[]) => {
  const normalizedSymbols = useMemo(
    () => Array.from(new Set(symbols.map((symbol) => normalizeIndexSymbol(symbol)).filter(Boolean))),
    [symbols],
  );

  return useStableResource(
    `indices:${normalizedSymbols.join(',')}`,
    normalizedSymbols.length > 0,
    useCallback((signal: AbortSignal) => fetchIndexSnapshots(normalizedSymbols, signal), [normalizedSymbols]),
  );
};

export const useIndexInfo = (symbol: string) => {
  const normalizedSymbol = useMemo(() => normalizeIndexSymbol(symbol), [symbol]);
  const state = useIndexSnapshots(normalizedSymbol ? [normalizedSymbol] : []);

  return useMemo(() => {
    const snapshot =
      state.data?.find((item) => normalizeIndexSymbol(item.symbol) === normalizedSymbol) || null;

    return {
      info: snapshot,
      loading: state.loading,
      error: state.error,
      reload: state.reload,
    };
  }, [normalizedSymbol, state.data, state.error, state.loading, state.reload]);
};

export const useIndexCandles = (symbol: string, timeframe: string) => {
  const normalizedSymbol = useMemo(() => normalizeIndexSymbol(symbol), [symbol]);
  const normalizedTimeframe = useMemo(() => normalizeIndexTimeframe(timeframe), [timeframe]);

  const state = useStableResource(
    `index-candles:${normalizedSymbol}:${normalizedTimeframe}`,
    Boolean(normalizedSymbol),
    useCallback(
      async (signal: AbortSignal) => {
        const payload = await fetchIndexCandles(normalizedSymbol, normalizedTimeframe, signal);
        return sliceCandlesForTimeframe(payload, normalizedTimeframe);
      },
      [normalizedSymbol, normalizedTimeframe],
    ),
  );

  const candles = state.data || [];
  const latest = candles.length ? candles[candles.length - 1] : null;
  const rangeHigh = candles.length ? Math.max(...candles.map((item) => item.h || item.c)) : null;
  const rangeLow = candles.length ? Math.min(...candles.map((item) => item.l || item.c)) : null;
  const rangeChangePercent =
    candles.length >= 2 && candles[0].c
      ? ((candles[candles.length - 1].c - candles[0].c) / candles[0].c) * 100
      : null;

  return {
    candles,
    latest,
    rangeHigh,
    rangeLow,
    rangeChangePercent,
    loading: state.loading,
    error: state.error,
    reload: state.reload,
  };
};

export const buildIndexDetailModel = (
  symbol: string,
  snapshot: IndexSnapshot | null,
  candles: IndexCandle[],
  timeframe: IndexTimeframe,
) => {
  const normalizedSymbol = normalizeIndexSymbol(symbol);
  const latest = candles.length ? candles[candles.length - 1] : null;
  const previousClose = getSnapshotPreviousClose(snapshot);
  const displayPrice = snapshot?.price ?? latest?.c ?? previousClose ?? null;

  return {
    symbol: normalizedSymbol,
    name: resolveIndexName(normalizedSymbol, snapshot?.name),
    timeframe,
    snapshot,
    candles,
    latest,
    previousClose,
    displayPrice,
  };
};
