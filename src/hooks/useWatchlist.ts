import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useUser } from '../store/UserContext';
import {
  addSymbol,
  createList,
  deleteList,
  getListById,
  getLists,
  normalizeSymbol,
  removeSymbol,
  renameList,
} from '../services/watchlistApi';
import { fetchTagxQuotes } from '../services/quoteApi';

type AnyRow = Record<string, any>;

const LOCAL_TICKERS = require('../../assets/us-tickers.json');
const TICKER_ROWS = Array.isArray(LOCAL_TICKERS?.tickers) ? LOCAL_TICKERS.tickers : [];

const normalizeTickerRow = (item: any) => ({
  symbol: normalizeSymbol(item?.symbol || ''),
  name: String(item?.name || ''),
});

const TICKER_INDEX = TICKER_ROWS.map(normalizeTickerRow).filter((item: any) => item.symbol);

const getMarketPhase = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const val = (type: string) => parts.find((part: any) => part.type === type)?.value || '';
  const weekday = val('weekday');
  const hour = Number(val('hour') || 0);
  const minute = Number(val('minute') || 0);
  const total = hour * 60 + minute;
  const weekend = weekday === 'Sat' || weekday === 'Sun';
  if (weekend) return 'closed';
  if (total >= 240 && total < 570) return 'extended';
  if (total >= 570 && total < 960) return 'open';
  if (total >= 960 && total < 1200) return 'extended';
  return 'closed';
};

const numericKeys = new Set(['price', 'pct', 'change', 'volume']);

const compareRows = (a: AnyRow, b: AnyRow, key: string, dir: 'asc' | 'desc') => {
  const sign = dir === 'asc' ? 1 : -1;
  if (numericKeys.has(key)) {
    const av = Number.isFinite(a?.[key]) ? a[key] : -Infinity;
    const bv = Number.isFinite(b?.[key]) ? b[key] : -Infinity;
    return (av - bv) * sign;
  }
  return String(a?.[key] || '').localeCompare(String(b?.[key] || '')) * sign;
};

export const useWatchlist = () => {
  const { authFetch } = useUser() as any;

  const [lists, setLists] = useState<any[]>([]);
  const [activeId, setActiveId] = useState('');
  const [active, setActive] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [creatingList, setCreatingList] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [symInput, setSymInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [sortKey, setSortKey] = useState('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [phase, setPhase] = useState(getMarketPhase());

  const listAbortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);
  const quoteAbortRef = useRef<AbortController | null>(null);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => compareRows(a, b, sortKey, sortDir)),
    [rows, sortDir, sortKey],
  );

  const priceHeaderLabel = phase === 'open' || phase === 'extended' ? 'LIVE PRICE' : 'CLOSE';

  const syncSuggestions = useCallback(
    (value: string, symbolPool: string[] = active?.symbols || []) => {
      const query = normalizeSymbol(value || '');
      if (!query) {
        setSuggestions([]);
        return;
      }

      const used = new Set(symbolPool.map((item: string) => normalizeSymbol(item)));
      const next = TICKER_INDEX.filter((item: any) => !used.has(item.symbol))
        .filter((item: any) => item.symbol.includes(query) || item.name.toUpperCase().includes(query))
        .slice(0, 8);
      setSuggestions(next);
    },
    [active?.symbols],
  );

  const refreshQuotes = useCallback(
    async (symbols: string[] = active?.symbols || []) => {
      quoteAbortRef.current?.abort();
      const ac = new AbortController();
      quoteAbortRef.current = ac;

      const normalized = symbols.map((item: string) => normalizeSymbol(item)).filter(Boolean);
      if (!normalized.length) {
        setRows([]);
        return;
      }

      try {
        const nameMap = Object.fromEntries(TICKER_INDEX.map((item: any) => [item.symbol, item.name]));
        const nextRows = await fetchTagxQuotes(normalized, { signal: ac.signal, nameMap });
        setRows(nextRows);
      } catch (error: any) {
        if (String(error?.message || '').toLowerCase().includes('abort')) return;
      }
    },
    [active?.symbols],
  );

  const loadLists = useCallback(async () => {
    listAbortRef.current?.abort();
    const ac = new AbortController();
    listAbortRef.current = ac;

    setLoadingList(true);
    try {
      const next = await getLists(authFetch, ac.signal);
      setLists(next);
      setActiveId((prev: string) => {
        if (prev && next.some((row: any) => row.id === prev)) return prev;
        return next[0]?.id || '';
      });
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('abort')) {
        Alert.alert('Watchlists', error?.message || 'Unable to load watchlists.');
      }
    } finally {
      setLoadingList(false);
    }
  }, [authFetch]);

  const selectList = useCallback((id: string) => setActiveId(id), []);

  const loadDetail = useCallback(async (id: string) => {
    if (!id) {
      setActive(null);
      setRows([]);
      return;
    }

    detailAbortRef.current?.abort();
    const ac = new AbortController();
    detailAbortRef.current = ac;

    setLoadingList(true);
    try {
      const detail = await getListById(authFetch, id, ac.signal);
      setActive(detail);
      setEditTitle(detail?.title || '');
      await refreshQuotes(detail?.symbols || []);
      syncSuggestions(symInput, detail?.symbols || []);
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('abort')) {
        Alert.alert('Watchlist', error?.message || 'Unable to load watchlist details.');
      }
    } finally {
      setLoadingList(false);
    }
  }, [authFetch, refreshQuotes, symInput, syncSuggestions]);

  const onCreate = useCallback(async () => {
    const title = String(newTitle || '').trim();
    if (!title) {
      Alert.alert('Missing title', 'Please enter a watchlist title.');
      return;
    }

    setCreatingList(true);
    try {
      const created = await createList(authFetch, title);
      setNewTitle('');

      if (created?.id) {
        setLists((prev: any[]) => (prev.some((row: any) => row.id === created.id) ? prev : [created, ...prev]));
        setActiveId(created.id);
      }

      loadLists().catch(() => {});
    } catch (error: any) {
      const message = String(error?.message || 'Unable to create watchlist.');
      const detail = error?.path ? `${message}\n(${String(error.path)})` : message;
      const lower = message.toLowerCase();
      const quotaHit =
        lower.includes('quota') ||
        lower.includes('limit') ||
        lower.includes('upgrade') ||
        (lower.includes('up to') && lower.includes('watchlist')) ||
        lower.includes('on your plan');

      if (quotaHit) {
        Alert.alert('Watchlist limit reached', message);
      } else {
        Alert.alert('Create failed', detail);
      }
    } finally {
      setCreatingList(false);
    }
  }, [authFetch, loadLists, newTitle]);

  const onRename = useCallback(async () => {
    if (!activeId) return;
    const title = String(editTitle || '').trim();
    if (!title) return;

    try {
      await renameList(authFetch, activeId, title);
      setIsEditingTitle(false);
      await loadLists();
      await loadDetail(activeId);
    } catch (error: any) {
      Alert.alert('Rename failed', error?.message || 'Unable to rename watchlist.');
    }
  }, [activeId, authFetch, editTitle, loadDetail, loadLists]);

  const onDeleteList = useCallback(async () => {
    if (!activeId) return;

    try {
      await deleteList(authFetch, activeId);
      await loadLists();
    } catch (error: any) {
      Alert.alert('Delete failed', error?.message || 'Unable to delete watchlist.');
    }
  }, [activeId, authFetch, loadLists]);

  const onAddTicker = useCallback(async (value?: string) => {
    if (!activeId || !active) {
      Alert.alert('No watchlist', 'Create or select a watchlist first.');
      return false;
    }

    const symbol = normalizeSymbol(value ?? symInput);
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) {
      Alert.alert('Invalid symbol', 'Enter a valid ticker symbol.');
      return false;
    }

    if (active.symbols.includes(symbol)) {
      Alert.alert('Duplicate symbol', `${symbol} already exists in this watchlist.`);
      return false;
    }

    const prev = active;
    const optimistic = { ...active, symbols: [...active.symbols, symbol], count: active.symbols.length + 1 };
    setActive(optimistic);
    setSymInput('');
    setSuggestions([]);
    refreshQuotes(optimistic.symbols);

    try {
      const updated = await addSymbol(authFetch, activeId, symbol);
      setActive(updated);
      await loadLists();
      await refreshQuotes(updated.symbols || []);
      return true;
    } catch (error: any) {
      setActive(prev);
      await refreshQuotes(prev.symbols || []);
      Alert.alert('Add failed', error?.message || 'Unable to add symbol.');
      return false;
    }
  }, [active, activeId, authFetch, loadLists, refreshQuotes, symInput]);

  const onRemoveTicker = useCallback(async (symbol: string) => {
    if (!activeId || !active) return;

    const target = normalizeSymbol(symbol);
    const prev = active;
    const optimisticSymbols = active.symbols.filter((item: string) => item !== target);
    const optimistic = { ...active, symbols: optimisticSymbols, count: optimisticSymbols.length };

    setActive(optimistic);
    refreshQuotes(optimisticSymbols);

    try {
      const updated = await removeSymbol(authFetch, activeId, target);
      setActive(updated);
      await loadLists();
      await refreshQuotes(updated.symbols || []);
    } catch (error: any) {
      setActive(prev);
      await refreshQuotes(prev.symbols || []);
      Alert.alert('Remove failed', error?.message || 'Unable to remove symbol.');
    }
  }, [active, activeId, authFetch, loadLists, refreshQuotes]);

  useEffect(() => {
    loadLists();
    return () => {
      listAbortRef.current?.abort();
      detailAbortRef.current?.abort();
      quoteAbortRef.current?.abort();
    };
  }, [loadLists]);

  useEffect(() => {
    loadDetail(activeId);
  }, [activeId, loadDetail]);

  useEffect(() => {
    syncSuggestions(symInput);
  }, [symInput, syncSuggestions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase(getMarketPhase());
      refreshQuotes();
    }, 20000);
    return () => clearInterval(timer);
  }, [refreshQuotes]);

  return {
    lists,
    activeId,
    active,
    rows: sortedRows,
    loadingList,
    creatingList,
    newTitle,
    editTitle,
    isEditingTitle,
    symInput,
    suggestions,
    sortKey,
    sortDir,
    phase,
    priceHeaderLabel,
    setNewTitle,
    setEditTitle,
    setIsEditingTitle,
    setSymInput,
    setSortKey,
    setSortDir,
    loadLists,
    selectList,
    onCreate,
    onRename,
    onDeleteList,
    onAddTicker,
    onRemoveTicker,
    refreshQuotes,
  };
};



