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

const normalizeSymbols = (symbols: any[] = []) =>
  [...new Set((Array.isArray(symbols) ? symbols : []).map((item: any) => normalizeSymbol(String(item || ''))).filter(Boolean))];

const hasExplicitSymbolPayload = (list: any) =>
  Boolean(
    Array.isArray(list?.symbols) ||
    Array.isArray(list?.symbolsList) ||
    Array.isArray(list?.stocks) ||
    Array.isArray(list?.watchlistSymbols) ||
    Array.isArray(list?.tickers) ||
    Array.isArray(list?.items) ||
    Array.isArray(list?.data?.symbols) ||
    Array.isArray(list?.data?.stocks) ||
    Array.isArray(list?.data?.tickers),
  );

const normalizeListMeta = (list: any, fallback: any = {}) => {
  const sameListFallback = String(fallback?.id || '') && String(list?.id || fallback?.id || '') === String(fallback?.id || '');
  const fallbackSymbols = sameListFallback ? normalizeSymbols(fallback?.symbols ?? []) : [];
  const incomingSymbolsRaw = hasExplicitSymbolPayload(list)
    ? normalizeSymbols(
        list?.symbols ||
        list?.symbolsList ||
        list?.stocks ||
        list?.watchlistSymbols ||
        list?.tickers ||
        list?.items ||
        list?.data?.symbols ||
        list?.data?.stocks ||
        list?.data?.tickers ||
        [],
      )
    : null;
  const incomingCount = Number(list?.count);
  const hasUsableIncomingSymbols = Array.isArray(incomingSymbolsRaw) && (incomingSymbolsRaw.length > 0 || fallbackSymbols.length === 0);
  const symbols = hasUsableIncomingSymbols ? incomingSymbolsRaw || [] : fallbackSymbols;

  const rawTitle = String(list?.title || '').trim();
  const fallbackTitle = sameListFallback ? String(fallback?.title || '').trim() : '';
  const title =
    rawTitle && rawTitle !== 'Untitled'
      ? rawTitle
      : fallbackTitle || rawTitle || 'Untitled';
  const countRaw = Number(list?.count);
  const count =
    Number.isFinite(countRaw) && (hasUsableIncomingSymbols || fallbackSymbols.length === 0)
      ? countRaw
      : symbols.length;

  return {
    ...fallback,
    ...list,
    id: String(list?.id || fallback?.id || ''),
    title,
    symbols,
    count,
  };
};

const buildPlaceholderRows = (symbols: string[], nameMap: Record<string, string>, existingRows: AnyRow[] = []) => {
  const rowMap = new Map(existingRows.map((row: AnyRow) => [normalizeSymbol(row?.symbol || ''), row]));
  return symbols.map((symbol: string) => {
    const normalized = normalizeSymbol(symbol);
    const existing = rowMap.get(normalized);
    return existing || {
      symbol: normalized,
      name: nameMap[normalized] || normalized,
      price: null,
      pct: null,
      change: null,
      volume: null,
    };
  });
};

export const useWatchlist = () => {
  const { authFetch, currentPlan } = useUser() as any;

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
  const [feedbackDialog, setFeedbackDialog] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const listAbortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);
  const quoteAbortRef = useRef<AbortController | null>(null);
  const activeSymbolsRef = useRef<string[]>([]);
  const quoteRequestRef = useRef(0);
  const activeRef = useRef<any>(null);
  const symInputRef = useRef('');

  const openFeedbackDialog = useCallback((title: string, message: string) => {
    setFeedbackDialog({
      visible: true,
      title,
      message,
    });
  }, []);

  const closeFeedbackDialog = useCallback(() => {
    setFeedbackDialog((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    activeSymbolsRef.current = active?.symbols || [];
  }, [active?.symbols]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    symInputRef.current = symInput;
  }, [symInput]);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => compareRows(a, b, sortKey, sortDir)),
    [rows, sortDir, sortKey],
  );

  const priceHeaderLabel = phase === 'open' || phase === 'extended' ? 'LIVE PRICE' : 'CLOSE';

  const syncSuggestions = useCallback(
    (value: string, symbolPool: string[] = activeSymbolsRef.current) => {
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
    [],
  );

  const refreshQuotes = useCallback(
    async (symbols: string[] = activeSymbolsRef.current) => {
      quoteAbortRef.current?.abort();
      const ac = new AbortController();
      quoteAbortRef.current = ac;
      const requestId = quoteRequestRef.current + 1;
      quoteRequestRef.current = requestId;

      const normalized = symbols.map((item: string) => normalizeSymbol(item)).filter(Boolean);
      if (!normalized.length) {
        setRows([]);
        return;
      }

      try {
        const nameMap = Object.fromEntries(TICKER_INDEX.map((item: any) => [item.symbol, item.name]));
        setRows((prev: AnyRow[]) => buildPlaceholderRows(normalized, nameMap, prev));
        const nextRows = await fetchTagxQuotes(normalized, { signal: ac.signal, nameMap });
        if (quoteRequestRef.current !== requestId) return;
        const nextRowMap = new Map((Array.isArray(nextRows) ? nextRows : []).map((row: AnyRow) => [normalizeSymbol(row?.symbol || ''), row]));
        setRows((prev: AnyRow[]) =>
          buildPlaceholderRows(normalized, nameMap, prev).map((row: AnyRow) => nextRowMap.get(normalizeSymbol(row?.symbol || '')) || row),
        );
      } catch (error: any) {
        if (String(error?.message || '').toLowerCase().includes('abort')) return;
      }
    },
    [],
  );

  const applyListUpdate = useCallback((nextList: any, options: { updateRows?: boolean } = {}) => {
    const normalized = normalizeListMeta(nextList, activeRef.current);
    if (!normalized?.id) return normalized;

    setActive(normalized);
    setEditTitle(normalized.title || '');
    setLists((prevLists: any[]) => {
      const exists = prevLists.some((list: any) => list.id === normalized.id);
      if (!exists) return [normalized, ...prevLists];
      return prevLists.map((list: any) => (list.id === normalized.id ? { ...list, ...normalized } : list));
    });
    syncSuggestions(symInputRef.current, normalized.symbols);

    if (options.updateRows !== false) {
      const nameMap = Object.fromEntries(TICKER_INDEX.map((item: any) => [item.symbol, item.name]));
      setRows((prev: AnyRow[]) => buildPlaceholderRows(normalized.symbols || [], nameMap, prev));
    }

    return normalized;
  }, [syncSuggestions]);

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
      return next;
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('abort')) {
        Alert.alert('Watchlists', error?.message || 'Unable to load watchlists.');
      }
      return [];
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
      const currentActive = activeRef.current;
      const merged = applyListUpdate({
        ...detail,
        title:
          detail?.title && detail.title !== 'Untitled'
            ? detail.title
            : (currentActive?.id === id && currentActive?.title ? currentActive.title : detail?.title || ''),
      });
      await refreshQuotes(merged?.symbols || detail?.symbols || []);
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('abort')) {
        Alert.alert('Watchlist', error?.message || 'Unable to load watchlist details.');
      }
    } finally {
      setLoadingList(false);
    }
  }, [applyListUpdate, authFetch, refreshQuotes]);

  const reconcileList = useCallback(async (id: string, fallback?: any) => {
    if (!id) return fallback || null;

    try {
      const detail = await getListById(authFetch, id);
      const merged = applyListUpdate(detail);
      await refreshQuotes(merged?.symbols || detail?.symbols || []);
      return merged;
    } catch {
      if (fallback?.id) {
        const merged = applyListUpdate(fallback);
        await refreshQuotes(merged?.symbols || fallback?.symbols || []);
        return merged;
      }
      return null;
    }
  }, [applyListUpdate, authFetch, refreshQuotes]);

  const onCreate = useCallback(async () => {
    const title = String(newTitle || '').trim();
    if (!title) {
      Alert.alert('Missing title', 'Please enter a watchlist title.');
      return;
    }

    const maxWatchlists = currentPlan?.limits?.watchlists;
    if (typeof maxWatchlists === 'number' && maxWatchlists > 0 && lists.length >= maxWatchlists) {
      openFeedbackDialog('Watchlist limit reached', `Your ${currentPlan?.title || 'current'} plan allows up to ${maxWatchlists} watchlists.`);
      return;
    }

    setCreatingList(true);
    try {
      const created = await createList(authFetch, title);
      const optimisticCreated = {
        ...created,
        id: String(created?.id || ''),
        title: String(created?.title || title),
        symbols: Array.isArray(created?.symbols) ? created.symbols : [],
        count: Number.isFinite(created?.count) ? created.count : Array.isArray(created?.symbols) ? created.symbols.length : 0,
      };
      setNewTitle('');

      if (optimisticCreated?.id) {
        applyListUpdate(optimisticCreated);
        setRows([]);
        setActiveId(optimisticCreated.id);
        await loadDetail(optimisticCreated.id);
      }

      await loadLists();
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
        openFeedbackDialog('Watchlist limit reached', message);
      } else {
        Alert.alert('Create failed', detail);
      }
    } finally {
      setCreatingList(false);
    }
  }, [applyListUpdate, authFetch, currentPlan?.limits?.watchlists, currentPlan?.title, lists.length, loadDetail, loadLists, newTitle, openFeedbackDialog]);

  const onRename = useCallback(async () => {
    if (!activeId) return;
    const title = String(editTitle || '').trim();
    if (!title) return;

    try {
      const updated = await renameList(authFetch, activeId, title);
      setIsEditingTitle(false);
      applyListUpdate({ ...activeRef.current, ...updated, title });
      await loadLists();
      await reconcileList(activeId, { ...activeRef.current, ...updated, title });
    } catch (error: any) {
      Alert.alert('Rename failed', error?.message || 'Unable to rename watchlist.');
    }
  }, [activeId, applyListUpdate, authFetch, editTitle, loadLists, reconcileList]);

  const onDeleteList = useCallback(async () => {
    if (!activeId) return;

    try {
      await deleteList(authFetch, activeId);
      const next = await loadLists();
      const nextId = next.find((row: any) => row.id !== activeId)?.id || next[0]?.id || '';
      setActiveId(nextId);
      if (!nextId) {
        setActive(null);
        setRows([]);
      }
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

    const maxSymbols = currentPlan?.limits?.watchlistSymbols;
    if (typeof maxSymbols === 'number' && maxSymbols > 0 && active.symbols.length >= maxSymbols) {
      openFeedbackDialog('Ticker limit reached', `Your ${currentPlan?.title || 'current'} plan allows up to ${maxSymbols} tickers in each watchlist.`);
      return false;
    }

    const prev = active;
    const optimistic = normalizeListMeta({ ...active, symbols: [...active.symbols, symbol], count: active.symbols.length + 1 }, active);
    applyListUpdate(optimistic);
    setSymInput('');
    setSuggestions([]);
    refreshQuotes(optimistic.symbols);

    try {
      const updated = await addSymbol(authFetch, activeId, symbol);
      const merged = normalizeListMeta(updated, optimistic);
      applyListUpdate(merged);
      await reconcileList(activeId, merged);
      return true;
    } catch (error: any) {
      applyListUpdate(prev);
      await refreshQuotes(prev.symbols || []);
      Alert.alert('Add failed', error?.message || 'Unable to add symbol.');
      return false;
    }
  }, [active, activeId, applyListUpdate, authFetch, currentPlan?.limits?.watchlistSymbols, currentPlan?.title, openFeedbackDialog, reconcileList, refreshQuotes, symInput]);

  const onRemoveTicker = useCallback(async (symbol: string) => {
    if (!activeId || !active) return;

    const target = normalizeSymbol(symbol);
    const prev = active;
    const optimisticSymbols = active.symbols.filter((item: string) => item !== target);
    const optimistic = normalizeListMeta({ ...active, symbols: optimisticSymbols, count: optimisticSymbols.length }, active);
    applyListUpdate(optimistic);
    refreshQuotes(optimisticSymbols);

    try {
      const updated = await removeSymbol(authFetch, activeId, target);
      const merged = normalizeListMeta(updated, optimistic);
      applyListUpdate(merged);
      await reconcileList(activeId, merged);
    } catch (error: any) {
      applyListUpdate(prev);
      await refreshQuotes(prev.symbols || []);
      Alert.alert('Remove failed', error?.message || 'Unable to remove symbol.');
    }
  }, [active, activeId, applyListUpdate, authFetch, reconcileList, refreshQuotes]);

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
  }, [activeId]);

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
    feedbackDialog,
    closeFeedbackDialog,
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
