import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useUser } from '../store/UserContext';
import {
  addPosition,
  deletePosition,
  getPortfolio,
  patchPosition,
  PortfolioDoc,
  PortfolioPosition,
  sellPosition,
} from '../services/portfolioApi';
import { fetchTagxQuotes } from '../services/quoteApi';
import { normalizeSymbol } from '../services/watchlistApi';

type JsonMap = Record<string, unknown>;
type AnyRow = Record<string, any>;

type PortfolioRow = {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  prevClose: number;
  value: number;
  cost: number;
  gain: number;
  gainPct: number;
  dayAbs: number;
  dayPct: number;
  realizedPnl: number;
};

type Summary = {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
};

type AllocationRow = {
  symbol: string;
  value: number;
  sharePct: number;
};

type Suggestion = { symbol: string; name: string };

type SortDir = 'asc' | 'desc';

type SortKey = 'symbol' | 'quantity' | 'buyPrice' | 'currentPrice' | 'value' | 'gain' | 'gainPct' | 'dayAbs' | 'dayPct';

const TICKERS = require('../../assets/us-tickers.json');
const TICKER_INDEX: Suggestion[] = (Array.isArray(TICKERS?.tickers) ? TICKERS.tickers : [])
  .map((item: JsonMap) => ({
    symbol: normalizeSymbol(String(item?.symbol || '')),
    name: String(item?.name || ''),
  }))
  .filter((item: Suggestion) => item.symbol);

const SYMBOL_REGEX = /^[A-Z0-9.-]+$/;

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const compareRows = (a: AnyRow, b: AnyRow, key: SortKey, dir: SortDir): number => {
  const sign = dir === 'asc' ? 1 : -1;
  if (key === 'symbol') return String(a.symbol || '').localeCompare(String(b.symbol || '')) * sign;
  return (toNumber(a[key]) - toNumber(b[key])) * sign;
};

export const usePortfolio = () => {
  const { authFetch, user } = useUser() as any;

  const [doc, setDoc] = useState<PortfolioDoc | null>(null);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [quoteMap, setQuoteMap] = useState<Record<string, AnyRow>>({});

  const [listLoading, setListLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');

  const [sortKey, setSortKey] = useState<SortKey>('value');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [addDraft, setAddDraft] = useState({ symbol: '', buyPrice: '', quantity: '' });
  const [editDraft, setEditDraft] = useState({ id: '', quantity: '', buyPrice: '' });
  const [sellDraft, setSellDraft] = useState({ id: '', sellQty: '', sellPrice: '' });
  const [editingId, setEditingId] = useState('');
  const [sellingId, setSellingId] = useState('');

  const quoteAbortRef = useRef<AbortController | null>(null);

  const refreshPortfolio = useCallback(async () => {
    setListLoading(true);
    try {
      const next = await getPortfolio(authFetch);
      setDoc(next);
      setPositions(next.positions || []);
    } catch (error: any) {
      const msg = String(error?.message || 'Unable to load portfolio.');
      if (error?.status === 401) Alert.alert('Session expired', 'Please sign in again.');
      else Alert.alert('Portfolio', msg);
    } finally {
      setListLoading(false);
    }
  }, [authFetch]);

  const refreshQuotes = useCallback(async (symbols: string[]) => {
    quoteAbortRef.current?.abort();
    const ac = new AbortController();
    quoteAbortRef.current = ac;

    if (!symbols.length) {
      setQuoteMap({});
      return;
    }

    try {
      const nameMap = Object.fromEntries(TICKER_INDEX.map((item) => [item.symbol, item.name]));
      const quotes = await fetchTagxQuotes(symbols, { signal: ac.signal, nameMap });
      setQuoteMap(Object.fromEntries(quotes.map((q) => [q.symbol, q])));
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('abort')) {
        setQuoteMap({});
      }
    }
  }, []);

  useEffect(() => {
    refreshPortfolio();
    return () => quoteAbortRef.current?.abort();
  }, [refreshPortfolio]);

  useEffect(() => {
    const symbols = [...new Set(positions.map((p) => normalizeSymbol(p.symbol)).filter(Boolean))];
    refreshQuotes(symbols);

    const timer = setInterval(() => refreshQuotes(symbols), 15000);
    return () => clearInterval(timer);
  }, [positions, refreshQuotes]);

  useEffect(() => {
    const query = normalizeSymbol(searchText);
    if (!query) {
      setSuggestions([]);
      return;
    }

    const used = new Set(positions.map((p) => normalizeSymbol(p.symbol)));
    const next = TICKER_INDEX
      .filter((item) => !used.has(item.symbol))
      .filter((item) => item.symbol.includes(query) || item.name.toUpperCase().includes(query))
      .slice(0, 8);
    setSuggestions(next);
  }, [positions, searchText]);

  const rows: PortfolioRow[] = useMemo(() => {
    return positions
      .map((pos) => {
        const symbol = normalizeSymbol(pos.symbol);
        const q = quoteMap[symbol] || {};

        const buyPrice = toNumber(pos.buyPrice);
        const quantity = toNumber(pos.quantity);
        const currentPrice = toNumber(q.price) || buyPrice;
        const pct = Number.isFinite(Number(q.pct)) ? Number(q.pct) : 0;
        const prevClose = currentPrice > 0 ? currentPrice / (1 + pct / 100) : currentPrice;

        const value = currentPrice * quantity;
        const cost = buyPrice * quantity;
        const gain = value - cost;
        const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
        const dayAbs = (currentPrice - prevClose) * quantity;
        const dayPct = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;

        return {
          id: pos.id,
          symbol,
          name: String((q?.name || TICKER_INDEX.find((t) => t.symbol === symbol)?.name || symbol) as string),
          quantity,
          buyPrice,
          currentPrice,
          prevClose,
          value,
          cost,
          gain,
          gainPct,
          dayAbs,
          dayPct,
          realizedPnl: toNumber(pos.realizedPnl),
        };
      })
      .sort((a, b) => compareRows(a, b, sortKey, sortDir));
  }, [positions, quoteMap, sortDir, sortKey]);

  const summary: Summary = useMemo(() => {
    const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
    const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    const dayChange = rows.reduce((sum, r) => sum + r.dayAbs, 0);
    const prevTotal = rows.reduce((sum, r) => sum + r.prevClose * r.quantity, 0);
    const dayChangePercent = prevTotal > 0 ? (dayChange / prevTotal) * 100 : 0;

    return { totalValue, totalCost, totalGain, totalGainPercent, dayChange, dayChangePercent };
  }, [rows]);

  const allocation: AllocationRow[] = useMemo(() => {
    const total = summary.totalValue;
    return rows.map((row) => ({
      symbol: row.symbol,
      value: row.value,
      sharePct: total > 0 ? (row.value / total) * 100 : 0,
    }));
  }, [rows, summary.totalValue]);

  const onSelectSuggestion = useCallback((item: Suggestion) => {
    setSelectedSymbol(item.symbol);
    setSearchText(item.symbol);
    setAddDraft((prev) => ({ ...prev, symbol: item.symbol }));
    setSuggestions([]);
  }, []);

  const onCreateOrAddPosition = useCallback(async () => {
    const symbol = normalizeSymbol(addDraft.symbol || selectedSymbol || searchText);
    const buyPrice = toNumber(addDraft.buyPrice);
    const quantity = toNumber(addDraft.quantity);

    if (!SYMBOL_REGEX.test(symbol)) {
      Alert.alert('Invalid symbol', 'Use valid ticker format like NVDA or BRK.B.');
      return;
    }
    if (quantity <= 0 || buyPrice <= 0) {
      Alert.alert('Invalid input', 'Quantity and buy price must be greater than 0.');
      return;
    }

    setAddLoading(true);
    try {
      const existing = positions.find((p) => normalizeSymbol(p.symbol) === symbol);
      const next = existing
        ? await patchPosition(authFetch, { id: existing.id, addQty: quantity, addPrice: buyPrice })
        : await addPosition(authFetch, { symbol, buyPrice, quantity });

      setDoc(next);
      setPositions(next.positions || []);
      setAddDraft({ symbol: '', buyPrice: '', quantity: '' });
      setSelectedSymbol('');
      setSearchText('');
    } catch (error: any) {
      const message = String(error?.message || 'Unable to add position.');
      const lower = message.toLowerCase();
      if (error?.status === 401) Alert.alert('Session expired', 'Please sign in again.');
      else if (lower.includes('quota') || lower.includes('limit') || lower.includes('upgrade')) Alert.alert('Limit reached', message);
      else Alert.alert('Add failed', message);
    } finally {
      setAddLoading(false);
    }
  }, [addDraft.buyPrice, addDraft.quantity, addDraft.symbol, authFetch, positions, searchText, selectedSymbol]);

  const startEdit = useCallback((row: PortfolioRow) => {
    setSellingId('');
    setEditingId(row.id);
    setEditDraft({ id: row.id, quantity: String(row.quantity), buyPrice: String(row.buyPrice) });
  }, []);

  const startSell = useCallback((row: PortfolioRow) => {
    setEditingId('');
    setSellingId(row.id);
    setSellDraft({ id: row.id, sellQty: String(row.quantity), sellPrice: String(row.currentPrice || row.buyPrice) });
  }, []);

  const estimateSellPnl = useCallback((row: PortfolioRow | undefined): number => {
    if (!row) return 0;
    const sellQty = toNumber(sellDraft.sellQty);
    const sellPrice = toNumber(sellDraft.sellPrice);
    if (sellQty <= 0 || sellPrice <= 0) return 0;
    return (sellPrice - row.buyPrice) * sellQty;
  }, [sellDraft.sellPrice, sellDraft.sellQty]);

  const onSavePosition = useCallback(async () => {
    const id = editDraft.id;
    const quantity = toNumber(editDraft.quantity);
    const buyPrice = toNumber(editDraft.buyPrice);
    if (!id || quantity <= 0 || buyPrice <= 0) {
      Alert.alert('Invalid input', 'Quantity and buy price must be greater than 0.');
      return;
    }

    setSaveLoading(true);
    try {
      const next = await patchPosition(authFetch, {
        email: String(doc?.email || user?.email || ''),
        id,
        quantity,
        buyPrice,
      });
      setDoc(next);
      setPositions(next.positions || []);
      setEditingId('');
      setEditDraft({ id: '', quantity: '', buyPrice: '' });
    } catch (error: any) {
      const message = String(error?.message || 'Unable to save position.');
      if (error?.status === 401) Alert.alert('Session expired', 'Please sign in again.');
      else Alert.alert('Save failed', message);
    } finally {
      setSaveLoading(false);
    }
  }, [authFetch, doc?.email, editDraft.buyPrice, editDraft.id, editDraft.quantity, user?.email]);

  const onSellPosition = useCallback(async () => {
    const id = sellDraft.id;
    const sellQty = toNumber(sellDraft.sellQty);
    const sellPrice = toNumber(sellDraft.sellPrice);
    const row = rows.find((r) => r.id === id);

    if (!id || !row) return;
    if (sellQty <= 0 || sellPrice <= 0) {
      Alert.alert('Invalid input', 'Sell quantity and price must be greater than 0.');
      return;
    }
    if (sellQty > row.quantity) {
      Alert.alert('Invalid quantity', 'Sell quantity cannot exceed current holding quantity.');
      return;
    }

    setSellLoading(true);
    try {
      const next = await sellPosition(authFetch, {
        email: String(doc?.email || user?.email || ''),
        id,
        sellQty,
        sellPrice,
        removeIfZero: true,
      });
      setDoc(next);
      setPositions(next.positions || []);
      setSellingId('');
      setSellDraft({ id: '', sellQty: '', sellPrice: '' });
    } catch (error: any) {
      const message = String(error?.message || 'Unable to sell position.');
      if (error?.status === 401) Alert.alert('Session expired', 'Please sign in again.');
      else Alert.alert('Sell failed', message);
    } finally {
      setSellLoading(false);
    }
  }, [authFetch, doc?.email, rows, sellDraft.id, sellDraft.sellPrice, sellDraft.sellQty, user?.email]);

  const onDeletePosition = useCallback(async (id: string) => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      const next = await deletePosition(authFetch, id);
      setDoc(next);
      setPositions(next.positions || []);
      if (editingId === id) setEditingId('');
      if (sellingId === id) setSellingId('');
    } catch (error: any) {
      const message = String(error?.message || 'Unable to delete position.');
      if (error?.status === 401) Alert.alert('Session expired', 'Please sign in again.');
      else Alert.alert('Delete failed', message);
    } finally {
      setDeleteLoading(false);
    }
  }, [authFetch, editingId, sellingId]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('desc');
      return key;
    });
  }, []);

  return {
    doc,
    positions,
    rows,
    summary,
    allocation,
    listLoading,
    addLoading,
    saveLoading,
    deleteLoading,
    sellLoading,
    searchText,
    suggestions,
    selectedSymbol,
    sortKey,
    sortDir,
    addDraft,
    editDraft,
    sellDraft,
    editingId,
    sellingId,
    setSearchText,
    setSelectedSymbol,
    setAddDraft,
    setEditDraft,
    setSellDraft,
    setEditingId,
    setSellingId,
    onCreateOrAddPosition,
    onSavePosition,
    onSellPosition,
    onDeletePosition,
    onSelectSuggestion,
    toggleSort,
    startEdit,
    startSell,
    estimateSellPnl,
    refreshPortfolio,
  };
};
