import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, FlatList, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AlertTriangle, ArrowLeft, ChevronRight, CirclePlus, Pencil, Plus, Trash2 } from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import HomeHeader from '../../components/HomeHeader';
import { API_BASE_URL, useUser } from '../../store/UserContext';
import { useTickerSearch } from '../../features/stocks/useTickerSearch';
import { navigateToStockDetail, normalizeStockSymbol } from '../../features/stocks/navigation';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';
import { useWatchlist } from '../../hooks/useWatchlist';
import { LIVE_API_BASE } from '../../utils/apiBaseUrl';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const PRESET_SECTIONS = [
  {
    title: 'Top Stocks',
    tintLight: '#efe3ff',
    tintDark: 'rgba(123, 71, 255, 0.17)',
    symbols: ['AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'META', 'TSLA', 'BRK.B', 'JPM', 'JNJ'],
  },
  {
    title: 'Sector ETFs',
    tintLight: '#ddf4f2',
    tintDark: 'rgba(24, 156, 140, 0.16)',
    symbols: ['SPY', 'QQQ', 'DIA', 'IWM', 'XLF', 'XLK', 'XLE', 'XLV', 'XLY', 'XLP', 'XLB', 'XLU', 'XLI', 'XLRE', 'ARKK'],
  },
  {
    title: 'Commodities ETF',
    tintLight: '#fff2df',
    tintDark: 'rgba(199, 133, 66, 0.17)',
    symbols: ['GLD', 'SLV', 'GDX', 'GDXJ', 'USO', 'UNG', 'DBA', 'DBC', 'PALL', 'PPLT'],
  },
  {
    title: 'Thematic ETFs',
    tintLight: '#dff2ff',
    tintDark: 'rgba(53, 148, 215, 0.16)',
    symbols: ['ARKG', 'ARKQ', 'ARKW', 'ICLN', 'TAN', 'BOTZ', 'FINX', 'HACK', 'LIT', 'MJ'],
  },
  {
    title: 'Bonds',
    tintLight: '#fbe8f2',
    tintDark: 'rgba(188, 76, 126, 0.16)',
    symbols: ['TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'BND'],
  },
  {
    title: 'International',
    tintLight: '#e4ebff',
    tintDark: 'rgba(89, 125, 236, 0.15)',
    symbols: ['EEM', 'FXI', 'EWZ', 'INDA', 'EWJ', 'VGK'],
  },
  {
    title: 'Alternatives',
    tintLight: '#e6f6e9',
    tintDark: 'rgba(70, 170, 104, 0.15)',
    symbols: ['BITO', 'GBTC', 'ETHE', 'BAR', 'SARK', 'SH', 'SDS'],
  },
];
const COMPANY_NAME_FALLBACK = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corporation',
  AMZN: 'Amazon.com, Inc.',
  NVDA: 'NVIDIA Corporation',
  GOOGL: 'Alphabet Inc.',
  GOOG: 'Alphabet Inc.',
  META: 'Meta Platforms, Inc.',
  TSLA: 'Tesla, Inc.',
  'BRK.B': 'Berkshire Hathaway Inc.',
  JPM: 'JPMorgan Chase & Co.',
  JNJ: 'Johnson & Johnson',
};
const COMPANY_SHORT_FALLBACK = {
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  AMZN: 'Amazon',
  NVDA: 'NVIDIA',
  GOOGL: 'Alphabet',
  GOOG: 'Alphabet',
  META: 'Meta',
  TSLA: 'Tesla',
  'BRK.B': 'Berkshire',
  JPM: 'JPMorgan',
  JNJ: 'J&J',
};

const normalizeSymbol = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9.-]/g, '');
const looksLikeTicker = (value) => /^[A-Z][A-Z0-9.-]{0,9}$/.test(normalizeStockSymbol(value));
const symbolKey = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const symbolCandidates = (symbol) => {
  const base = normalizeSymbol(symbol);
  if (!base) return [];
  const variants = [base];
  if (base.includes('.')) variants.push(base.replace(/\./g, '-'));
  if (base.includes('-')) variants.push(base.replace(/-/g, '.'));
  return [...new Set(variants)];
};
const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};
const mapObjectRowsWithSymbol = (record) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return [];
  return Object.entries(record)
    .map(([key, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const hasSymbol = Boolean(value?.symbol || value?.ticker || value?.code || value?.index || value?.instrument || value?.s);
      if (hasSymbol) return value;
      return { ...value, symbol: key, ticker: key };
    })
    .filter(Boolean);
};
const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (payload?.data && typeof payload.data === 'object') return mapObjectRowsWithSymbol(payload.data);
  if (payload && typeof payload === 'object') {
    const values = Object.values(payload);
    if (values.length && values.every((item) => item && typeof item === 'object')) return mapObjectRowsWithSymbol(payload);
  }
  return [];
};
const findBySymbol = (rows, symbol) => {
  const target = symbolKey(symbol);
  return (
    rows.find((item) => {
      const id = symbolKey(item?.symbol || item?.ticker || item?.code || item?.index || item?.instrument || item?.s);
      return id === target || id.endsWith(target);
    }) || null
  );
};
const pickNumber = (obj, keys) => {
  for (const key of keys) {
    const n = toNumber(obj?.[key]);
    if (n != null) return n;
  }
  return null;
};
const rowQualityScore = (item) => {
  if (!item) return 0;
  const cp = pickNumber(item, ['changePercent', 'percentChange', 'change_percentage', 'change_percent', 'pChange', 'regularMarketChangePercent', 'pct', 'percent']);
  const price = pickNumber(item, ['price', 'value', 'lastPrice', 'last', 'ltp', 'close', 'regularMarketPrice']);
  const change = pickNumber(item, ['priceChange', 'change', 'delta', 'regularMarketChange', 'netChange']);
  const volume = pickNumber(item, ['volume', 'vol', 'totalVolume', 'avgVolume', 'regularMarketVolume']);
  let score = 0;
  if (price != null && price > 0) score += 5;
  if (cp != null) score += 3;
  if (change != null) score += 2;
  if (volume != null && volume > 0) score += 1;
  return score;
};
const dedupRows = (allRows) => {
  const best = new Map();
  for (const item of allRows) {
    const id = symbolKey(item?.symbol || item?.ticker || item?.code || item?.index || item?.instrument || item?.s);
    if (!id) continue;
    const prev = best.get(id);
    if (!prev || rowQualityScore(item) >= rowQualityScore(prev)) {
      best.set(id, item);
    }
  }
  return [...best.values()];
};
const fmtPrice = (value) => (value == null ? '--' : value.toFixed(2));
const fmtPct = (value) => (value == null ? '--' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`);
const fmtChange = (value) => (value == null ? '--' : `${value >= 0 ? '+' : ''}${value.toFixed(3)}`);
const fmtVol = (value) => {
  if (value == null) return '--';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${Math.round(value)}`;
};
const cleanName = (raw, symbol) => {
  if (typeof raw !== 'string') return '';
  const value = raw.trim();
  if (!value) return '';
  const lowered = value.toLowerCase();
  if (lowered === 'n/a' || lowered === 'na' || lowered === '--' || lowered === '..' || lowered === '.') return '';
  if (normalizeSymbol(value) === normalizeSymbol(symbol)) return '';
  return value;
};
const pickDisplayName = (source, symbol) => {
  if (!source || typeof source !== 'object') return '';
  const candidates = [
    source.longName,
    source.shortName,
    source.displayName,
    source.companyName,
    source.instrumentName,
    source.securityName,
    source.description,
    source.name,
    source.title,
  ];
  for (const raw of candidates) {
    const cleaned = cleanName(raw, symbol);
    if (cleaned) return cleaned;
  }
  return '';
};
const toShortName = (name, symbol) => {
  const fallback = COMPANY_SHORT_FALLBACK[symbol];
  if (fallback) return fallback;
  if (typeof name !== 'string') return symbol;
  let short = name.trim();
  if (!short) return symbol;
  short = short.replace(/,?\s*(incorporated|inc\.?|corporation|corp\.?|company|co\.?|limited|ltd\.?)$/i, '');
  short = short.replace(/,.*$/, '').trim();
  if (!short) return symbol;
  return short;
};
const normalizeRowSnapshot = (row) => {
  if (!row) return null;
  const priceRaw = pickNumber(row, ['price', 'value', 'lastPrice', 'last', 'ltp', 'close', 'regularMarketPrice', 'bid', 'ask']);
  const changeRaw = pickNumber(row, ['priceChange', 'change', 'delta', 'regularMarketChange', 'netChange']);
  const pctRaw = pickNumber(row, ['changePercent', 'percentChange', 'change_percentage', 'change_percent', 'pChange', 'regularMarketChangePercent', 'pct', 'percent']);
  const volumeRaw = pickNumber(row, ['volume', 'vol', 'totalVolume', 'avgVolume', 'regularMarketVolume', 'regularMarketVolume3Month', 'averageDailyVolume3Month']);

  const price = priceRaw != null && priceRaw > 0 ? priceRaw : null;
  let change = changeRaw;
  let pct = pctRaw;

  if ((change == null || !Number.isFinite(change)) && price != null && pct != null) {
    change = (price * pct) / 100;
  }
  if ((pct == null || !Number.isFinite(pct)) && price != null && change != null) {
    const prev = price - change;
    if (prev > 0) pct = (change / prev) * 100;
  }

  const volume = volumeRaw != null && Number.isFinite(volumeRaw) && volumeRaw >= 0 ? volumeRaw : 0;
  return { price, change, pct, volume };
};
const normalizeInfoSnapshot = (payload) => {
  const source = payload?.data || payload || {};
  const price = toNumber(source?.regularMarketPrice ?? source?.currentPrice ?? source?.regularMarketClose ?? source?.regularMarketPreviousClose);
  const change = toNumber(source?.regularMarketChange ?? source?.priceChange);
  const pct = toNumber(source?.regularMarketChangePercent ?? source?.priceChangePercent);
  const volume = toNumber(source?.regularMarketVolume ?? source?.volume ?? source?.averageDailyVolume3Month);
  if (price == null || price <= 0) return null;
  let normalizedChange = change;
  let normalizedPct = pct;
  if (normalizedChange == null && normalizedPct != null) {
    normalizedChange = (price * normalizedPct) / 100;
  }
  if (normalizedPct == null && normalizedChange != null) {
    const prev = price - normalizedChange;
    if (prev > 0) normalizedPct = (normalizedChange / prev) * 100;
  }
  return {
    name: pickDisplayName(source, source?.symbol || source?.ticker || ''),
    price,
    change: normalizedChange,
    pct: normalizedPct,
    volume: volume != null && volume >= 0 ? volume : 0,
  };
};
const normalizeHistorySnapshot = (payload) => {
  const data = payload?.data || payload || {};
  const closeMap = data?.Close || data?.close;
  const volumeMap = data?.Volume || data?.volume || {};
  if (!closeMap || typeof closeMap !== 'object') return null;
  const points = Object.entries(closeMap)
    .map(([ts, v]) => {
      const t = Number(ts);
      const close = toNumber(v);
      if (!Number.isFinite(t) || close == null || close <= 0) return null;
      return { t, close };
    })
    .filter(Boolean)
    .sort((a, b) => a.t - b.t);
  if (!points.length) return null;
  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  const change = prev ? last.close - prev.close : null;
  const pct = prev && prev.close > 0 ? (change / prev.close) * 100 : null;
  const vol = toNumber(volumeMap?.[String(last.t)]);
  return {
    price: last.close,
    change,
    pct,
    volume: vol != null && vol >= 0 ? vol : 0,
  };
};

const Watchlist = ({ navigation }) => {
  const { theme, themeColors, user } = useUser();
  const { width } = useWindowDimensions();
  const isWide = width >= 920;
  const isCompact = width < 430;
  const styles = useMemo(() => createStyles(themeColors, theme === 'light', isWide, isCompact), [themeColors, theme, isWide, isCompact]);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Watchlist', (route) => navigation.navigate(route));
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [createInFlight, setCreateInFlight] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteInFlight, setDeleteInFlight] = useState(false);

  const [activePreset, setActivePreset] = useState(null);
  const [presetRows, setPresetRows] = useState([]);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetError, setPresetError] = useState('');
  const [livePresetCache, setLivePresetCache] = useState({});
  const presetAbortRef = useRef(null);
  const addSymbolInputRef = useRef(null);

  const {
    lists: watchlists,
    activeId: selectedListId,
    active: selectedList,
    rows: customRows,
    loadingList,
    creatingList,
    newTitle: newListTitle,
    editTitle,
    isEditingTitle,
    symInput: newSymbol,
    suggestions,
    setNewTitle: setNewListTitle,
    setEditTitle,
    setIsEditingTitle,
    setSymInput: setNewSymbol,
    selectList: setSelectedListId,
    onCreate: createWatchlist,
    onRename,
    onDeleteList: deleteSelectedWatchlist,
    onAddTicker,
    onRemoveTicker: removeSymbol,
  } = useWatchlist();

  const displayName = user?.displayName || user?.name || 'Trader';
  const symbolCount = customRows.length;
  const createButtonColor = theme === 'light' ? '#ffffff' : '#0b1220';
  const { results: tickerResults, loading: tickerSearchLoading, error: tickerSearchError } = useTickerSearch(searchQuery);

  const submitTickerSearch = useCallback(() => {
    const normalized = normalizeStockSymbol(searchQuery);
    if (looksLikeTicker(normalized)) {
      navigateToStockDetail(navigation, normalized);
      return;
    }

    if (tickerResults[0]?.symbol) {
      navigateToStockDetail(navigation, tickerResults[0].symbol);
    }
  }, [navigation, searchQuery, tickerResults]);

  const selectTickerSearchResult = useCallback((item) => {
    if (!item?.symbol) return;
    setSearchQuery(item.symbol);
    navigateToStockDetail(navigation, item.symbol);
  }, [navigation]);

  const confirmDeleteWatchlist = () => {
    if (!selectedList) return;
    setDeleteDialogVisible(true);
  };

  const closeCreateDialog = () => {
    if (creatingList) return;
    setCreateDialogVisible(false);
    setCreateInFlight(false);
    if (newListTitle) setNewListTitle('');
  };

  const closeDeleteDialog = () => {
    if (deleteInFlight) return;
    setDeleteDialogVisible(false);
  };

  const handleCreateWatchlist = async () => {
    if (!String(newListTitle || '').trim()) {
      Alert.alert('Missing title', 'Please enter a watchlist title.');
      return;
    }
    setCreateInFlight(true);
    try {
      await Promise.resolve(createWatchlist());
    } catch {
      setCreateInFlight(false);
    }
  };

  const handleDeleteWatchlist = async () => {
    if (!selectedList) {
      setDeleteDialogVisible(false);
      return;
    }

    setDeleteInFlight(true);
    try {
      await Promise.resolve(deleteSelectedWatchlist());
      setDeleteDialogVisible(false);
    } finally {
      setDeleteInFlight(false);
    }
  };

  const addPresetToCurrentList = (symbols) => {
    if (!selectedList) {
      Alert.alert('No watchlist', 'Create a watchlist first.');
      return;
    }
    addSymbolInputRef.current?.blur?.();
    symbols.forEach((sym) => onAddTicker(sym));
  };

  const handleAddSymbol = useCallback(async (value) => {
    addSymbolInputRef.current?.blur?.();
    await onAddTicker(value);
  }, [onAddTicker]);

  const loadPresetRows = useCallback(async (section) => {
    if (!section?.symbols?.length) return;
    presetAbortRef.current?.abort();
    const ac = new AbortController();
    presetAbortRef.current = ac;
    setPresetLoading(true);
    setPresetError('');
    try {
      const parseRows = async (url) => {
        const res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) return [];
        const payload = await res.json().catch(() => null);
        return toArray(payload?.data || payload);
      };
      const parseInfoSnap = async (symbol) => {
        const url = `${API_BASE_URL}/api/tagx/stocks/${encodeURIComponent(symbol)}/info`;
        const res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) return null;
        const payload = await res.json().catch(() => null);
        return normalizeInfoSnapshot(payload);
      };
      const parseHistorySnap = async (symbol) => {
        const url = `${API_BASE_URL}/api/tagx/stocks/${encodeURIComponent(symbol)}/history?period=5d&interval=1d`;
        const res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) return null;
        const payload = await res.json().catch(() => null);
        return normalizeHistorySnapshot(payload);
      };
      const parseYahooRows = async (symbol) => {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
        const res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) return [];
        const json = await res.json().catch(() => null);
        return toArray(json?.quoteResponse?.result || json?.result || []);
      };
      const perSymbolRows = await Promise.all(
        section.symbols.map(async (symbol) => {
          const candidates = symbolCandidates(symbol);
          const infoSnaps = await Promise.all(candidates.map((candidate) => parseInfoSnap(candidate)));
          const historySnaps = await Promise.all(candidates.map((candidate) => parseHistorySnap(candidate)));
          const primaryRowsList = await Promise.all(
            candidates.map((candidate) => parseRows(`${LIVE_API_BASE}/api/market/indices?symbols=${encodeURIComponent(candidate)}`)),
          );
          const yahooRowsList = await Promise.all(candidates.map((candidate) => parseYahooRows(candidate)));

          const merged = dedupRows([...primaryRowsList.flat(), ...yahooRowsList.flat()]);
          const picked = findBySymbol(merged, symbol) || null;
          const infoSnap = infoSnaps.find((item) => item && item.price != null && item.price > 0) || null;
          const historySnap = historySnaps.find((item) => item && item.price != null && item.price > 0) || null;
          return { symbol, picked, infoSnap, historySnap };
        }),
      );

      const mapped = perSymbolRows.map(({ symbol, picked, infoSnap, historySnap }) => {
        const match = picked;
        const snap = normalizeRowSnapshot(match);
        const key = symbolKey(symbol);
        const cached = livePresetCache[key] || null;
        const finalSnap =
          infoSnap && infoSnap.price != null && infoSnap.price > 0
            ? infoSnap
            : (
          snap && snap.price != null && snap.price > 0
            ? snap
            : (
          historySnap && historySnap.price != null && historySnap.price > 0
            ? historySnap
            : cached
            )
            );
        return {
          symbol,
          name: toShortName(pickDisplayName(match, symbol) || infoSnap?.name || COMPANY_NAME_FALLBACK[symbol] || symbol, symbol),
          price: finalSnap?.price ?? null,
          pct: finalSnap?.pct ?? null,
          change: finalSnap?.change ?? null,
          volume: finalSnap?.volume ?? null,
        };
      });
      setPresetRows(mapped);
      setLivePresetCache((prev) => {
        const next = { ...prev };
        mapped.forEach((row) => {
          if (row.price != null && row.price > 0) {
            next[symbolKey(row.symbol)] = { price: row.price, pct: row.pct, change: row.change, volume: row.volume };
          }
        });
        return next;
      });
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('abort')) return;
      setPresetError('Unable to load section symbols right now.');
      setPresetRows(
        section.symbols.map((symbol) => {
          const cached = livePresetCache[symbolKey(symbol)] || null;
          return {
            symbol,
            name: symbol,
            price: cached?.price ?? null,
            pct: cached?.pct ?? null,
            change: cached?.change ?? null,
            volume: cached?.volume ?? null,
          };
        }),
      );
    } finally {
      setPresetLoading(false);
    }
  }, [livePresetCache]);

  useEffect(() => () => presetAbortRef.current?.abort(), []);
  useEffect(() => {
    if (creatingList) return;
    if (createInFlight && !newListTitle.trim()) {
      setCreateDialogVisible(false);
      setCreateInFlight(false);
    }
  }, [createInFlight, creatingList, newListTitle]);
  useEffect(() => {
    if (!activePreset?.symbols?.length) return undefined;
    const timer = setInterval(() => {
      loadPresetRows(activePreset);
    }, 20000);
    return () => clearInterval(timer);
  }, [activePreset, loadPresetRows]);

  useEffect(() => {
    if (!activePreset) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActivePreset(null);
      return true;
    });
    return () => subscription.remove();
  }, [activePreset]);

  const renderPresetAndPlan = () => (
    <>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderCopy}>
          <View style={styles.sectionEyebrow}>
            <AppText style={styles.sectionEyebrowText}>Preset Baskets</AppText>
          </View>
          <AppText style={styles.sectionTitle}>Browse Preset Sections</AppText>
          <AppText style={styles.sectionSubTitle}>Quick-build themed lists and long-press to add the full basket.</AppText>
        </View>
        {isWide ? (
          <View style={styles.sectionMetaPill}>
            <AppText style={styles.sectionMetaText}>{PRESET_SECTIONS.length} sections</AppText>
          </View>
        ) : null}
      </View>
      {isWide ? (
        <View style={styles.presetGrid}>
          {PRESET_SECTIONS.map((section) => {
            const tint = theme === 'light' ? section.tintLight : section.tintDark;
            const preview = section.symbols.slice(0, 8).join(' · ');
            return (
              <Pressable
                key={section.title}
                style={[styles.presetCard, styles.presetCardWide, { backgroundColor: tint }]}
                onPress={() => {
                  setActivePreset(section);
                  loadPresetRows(section);
                }}
                onLongPress={() => addPresetToCurrentList(section.symbols)}
              >
                <View style={styles.presetHead}>
                  <View style={styles.presetTag}>
                    <AppText style={styles.presetTagText}>Curated</AppText>
                  </View>
                  <View style={styles.countPill}>
                    <AppText style={styles.countText}>{section.symbols.length} symbols</AppText>
                  </View>
                </View>
                <AppText style={styles.presetTitle} numberOfLines={2}>{section.title}</AppText>
                <AppText style={styles.presetPreview} numberOfLines={2}>{preview}</AppText>
                <View style={styles.presetFooter}>
                  <View style={styles.presetActionPill}>
                    <AppText style={styles.presetFooterText}>Open Basket</AppText>
                    <ChevronRight size={15} color={themeColors.textPrimary} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRail}>
          {PRESET_SECTIONS.map((section) => {
            const tint = theme === 'light' ? section.tintLight : section.tintDark;
            const preview = section.symbols.slice(0, isWide ? 8 : 6).join(' · ');
            return (
              <Pressable
                key={section.title}
                style={[styles.presetCard, { backgroundColor: tint }]}
                onPress={() => {
                  setActivePreset(section);
                  loadPresetRows(section);
                }}
                onLongPress={() => addPresetToCurrentList(section.symbols)}
              >
                <View style={styles.presetHead}>
                  <View style={styles.presetTag}>
                    <AppText style={styles.presetTagText}>Curated</AppText>
                  </View>
                  <View style={styles.countPill}>
                    <AppText style={styles.countText}>{section.symbols.length} symbols</AppText>
                  </View>
                </View>
                <AppText style={styles.presetTitle} numberOfLines={2}>{section.title}</AppText>
                <AppText style={styles.presetPreview} numberOfLines={2}>{preview}</AppText>
                <View style={styles.presetFooter}>
                  <View style={styles.presetActionPill}>
                    <AppText style={styles.presetFooterText}>Open Basket</AppText>
                    <ChevronRight size={15} color={themeColors.textPrimary} />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </>
  );

  if (activePreset) {
    return (
      <View style={styles.safeArea}>
        <GradientBackground>
          <HomeHeader
            themeColors={themeColors}
            profileName={displayName}
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            searchResults={tickerResults}
            searchLoading={tickerSearchLoading}
            searchError={tickerSearchError}
            showSearchResults={Boolean(searchQuery.trim())}
            onPressSearchResult={selectTickerSearchResult}
            onSubmitSearch={submitTickerSearch}
            onPressProfile={() => navigation.navigate('Profile')}
            onPressGlobalIndices={() => navigation.navigate('GlobalIndices')}
          />

          <ScrollView contentContainerStyle={styles.presetPageContent} showsVerticalScrollIndicator={false}>
            {presetLoading && <ActivityIndicator size="small" color={themeColors.textPrimary} />}
            {!!presetError && <AppText style={styles.errorText}>{presetError}</AppText>}
            {!presetLoading && !!presetRows.length ? (
              <View style={styles.presetTableCard}>
                <View style={styles.tableHead}>
                  <AppText style={[styles.th, styles.thSym]}>SYMBOL</AppText>
                  <AppText style={[styles.th, styles.thNum]}>PRICE</AppText>
                  <AppText style={[styles.th, styles.thNum]}>% CHANGE</AppText>
                  <AppText style={[styles.th, styles.thNum]}>CHANGE</AppText>
                  <AppText style={[styles.th, styles.thNum]}>VOLUME</AppText>
                </View>
                <View style={styles.presetTableBody}>
                  {presetRows.map((row, index) => {
                    const up = (row.pct || 0) >= 0;
                    const isLast = index === presetRows.length - 1;
                    return (
                      <Pressable
                        key={row.symbol}
                        style={[styles.presetTableRow, isLast ? styles.presetTableRowLast : null]}
                        onPress={() => navigateToStockDetail(navigation, row.symbol)}
                      >
                        <AppText style={[styles.cell, styles.cellSym]}>{row.symbol}</AppText>
                        <AppText style={[styles.cell, styles.cellNum, up ? styles.up : styles.down]}>{fmtPrice(row.price)}</AppText>
                        <AppText style={[styles.cell, styles.cellNum, up ? styles.up : styles.down]}>{fmtPct(row.pct)}</AppText>
                        <AppText style={[styles.cell, styles.cellNum, up ? styles.up : styles.down]}>{fmtChange(row.change)}</AppText>
                        <AppText style={[styles.cell, styles.cellNum]}>{fmtVol(row.volume)}</AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
            {!presetLoading && renderPresetAndPlan()}
          </ScrollView>

          <BottomTabs activeRoute="Watchlist" navigation={navigation} />
        </GradientBackground>
      </View>
    );
  }

  return (
    <View style={styles.safeArea} {...swipeHandlers}>
      <GradientBackground>
        <HomeHeader
          themeColors={themeColors}
          profileName={displayName}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          searchResults={tickerResults}
          searchLoading={tickerSearchLoading}
          searchError={tickerSearchError}
          showSearchResults={Boolean(searchQuery.trim())}
          onPressSearchResult={selectTickerSearchResult}
          onSubmitSearch={submitTickerSearch}
          onPressProfile={() => navigation.navigate('Profile')}
          onPressGlobalIndices={() => navigation.navigate('GlobalIndices')}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topActionRow}>
            <View style={styles.topActionCopy}>
              <AppText style={styles.sectionTitle}>My Lists</AppText>
            </View>
            <Pressable
              style={[styles.createBtn, creatingList && styles.createBtnLoading]}
              onPressIn={() => setCreateDialogVisible(true)}
              onPress={() => setCreateDialogVisible(true)}
              hitSlop={8}
              disabled={creatingList}
            >
              <Plus size={14} color={createButtonColor} />
              <AppText style={styles.createBtnText}>New Watchlist</AppText>
            </Pressable>
          </View>

          <View style={styles.listTabs}>
            {watchlists.map((list) => {
              const active = list.id === selectedListId;
              return (
                <Pressable key={list.id} style={[styles.listChip, active && styles.listChipActive]} onPress={() => setSelectedListId(list.id)}>
                  <AppText style={[styles.listChipText, active && styles.listChipTextActive]}>{list.title}</AppText>
                  <View style={[styles.listChipCount, active && styles.listChipCountActive]}>
                    <AppText style={[styles.listChipCountText, active && styles.listChipCountTextActive]}>
                      {Number.isFinite(Number(list?.count)) ? Number(list.count) : Array.isArray(list?.symbols) ? list.symbols.length : 0}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.workspace}>
            <View style={styles.workspaceHead}>
              <View style={styles.workspaceTitleRow}>
                {isEditingTitle ? (
                  <AppTextInput
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Rename watchlist"
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.input, styles.renameInput]}
                  />
                ) : (
                  <AppText style={styles.workspaceTitle}>{selectedList?.title || 'No Watchlist'}</AppText>
                )}
              </View>
              <View style={styles.symbolActions}>
                {!!selectedList && (
                  <>
                    {isEditingTitle ? (
                      <>
                        <Pressable style={styles.renameActionBtn} onPress={onRename} hitSlop={8}>
                          <AppText style={styles.renameActionText}>Save</AppText>
                        </Pressable>
                        <Pressable style={styles.renameActionBtn} onPress={() => setIsEditingTitle(false)} hitSlop={8}>
                          <AppText style={styles.renameActionText}>Cancel</AppText>
                        </Pressable>
                      </>
                    ) : (
                      <Pressable onPress={() => setIsEditingTitle(true)} hitSlop={8}>
                        <Pencil size={14} color={themeColors.textPrimary} />
                      </Pressable>
                    )}
                    <Pressable style={styles.workspaceDeleteBtn} onPress={confirmDeleteWatchlist}>
                      <Trash2 size={14} color={themeColors.negative} />
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            <View style={styles.addSymbolRow}>
              <View style={styles.inputShell}>
                <AppTextInput
                  ref={addSymbolInputRef}
                  value={newSymbol}
                  onChangeText={setNewSymbol}
                  placeholder="Add symbol (e.g. NVDA)"
                  placeholderTextColor={themeColors.textMuted}
                  style={styles.input}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  blurOnSubmit
                  onSubmitEditing={() => handleAddSymbol()}
                />
              </View>
              <Pressable style={styles.plusBtn} onPress={() => handleAddSymbol()}>
                <Plus size={16} color={themeColors.textPrimary} />
              </Pressable>
            </View>

            {!!suggestions.length && (
              <View style={styles.suggestionBox}>
                {suggestions.map((item) => (
                  <Pressable key={item.symbol} style={styles.suggestionRow} onPress={() => handleAddSymbol(item.symbol)}>
                    <AppText style={styles.suggestionSym}>{item.symbol}</AppText>
                    <AppText style={styles.suggestionName} numberOfLines={1}>{item.name}</AppText>
                  </Pressable>
                ))}
              </View>
            )}
            {loadingList ? (
              <View style={styles.workspaceLoadingState}>
                <ActivityIndicator size="small" color={themeColors.textPrimary} />
                <AppText style={styles.emptyText}>Loading watchlist...</AppText>
              </View>
            ) : customRows.length ? (
              <FlatList
                data={customRows}
                keyExtractor={(item) => item.symbol}
                scrollEnabled={false}
                contentContainerStyle={styles.symbolWrap}
                renderItem={({ item: row }) => {
                  const up = (row.pct || 0) >= 0;
                  return (
                    <Pressable style={styles.symbolCard} onPress={() => navigateToStockDetail(navigation, row.symbol)}>
                      <View style={styles.symbolCardMain}>
                        <View style={styles.symbolIdentity}>
                          <AppText style={styles.symbolNameInline} numberOfLines={1}>{row.symbol}</AppText>
                        </View>

                        <View style={styles.symbolInlineMetrics}>
                          <AppText style={[styles.symbolChange, up ? styles.up : styles.down]}>{fmtPct(row.pct)}</AppText>
                          <AppText style={styles.symbolPrice}>{fmtPrice(row.price)}</AppText>
                          <AppText style={styles.symbolMeta}>{fmtChange(row.change)}</AppText>
                          <Pressable style={styles.removeChip} onPress={() => removeSymbol(row.symbol)} hitSlop={8}>
                            <Trash2 size={13} color={themeColors.negative} />
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>
                  );
                }}
              />
            ) : selectedList ? (
              <AppText style={styles.emptyText}>No symbols yet. Add one or use presets below.</AppText>
            ) : (
              <AppText style={styles.emptyText}>Create a watchlist title first, then add symbols.</AppText>
            )}
          </View>

          {renderPresetAndPlan()}
        </ScrollView>

        {createDialogVisible ? (
          <View style={styles.dialogOverlay} pointerEvents="box-none">
            <Pressable style={styles.dialogScrim} onPress={closeCreateDialog} />
            <View style={styles.dialogCard}>
              <View style={styles.dialogBadge}>
                <CirclePlus size={16} color={themeColors.textPrimary} />
                <AppText style={styles.dialogBadgeText}>Create Watchlist</AppText>
              </View>
              <AppText style={styles.dialogTitle}>Name your next watchlist</AppText>
              <AppText style={styles.dialogBody}>
                Create a focused list for a theme, sector, strategy, or short-term setup.
              </AppText>
              <View style={styles.dialogInputShell}>
                <AppTextInput
                  value={newListTitle}
                  onChangeText={setNewListTitle}
                  placeholder="Tech Momentum"
                  placeholderTextColor={themeColors.textMuted}
                  style={styles.dialogInput}
                  autoFocus
                />
              </View>
              <View style={styles.dialogActions}>
                <Pressable style={styles.dialogGhost} onPress={closeCreateDialog} disabled={creatingList}>
                  <AppText style={styles.dialogGhostText}>Cancel</AppText>
                </Pressable>
                <Pressable style={[styles.dialogPrimary, creatingList ? styles.createBtnLoading : null]} onPress={handleCreateWatchlist} disabled={creatingList}>
                  {creatingList ? <ActivityIndicator size="small" color="#ffffff" /> : <Plus size={14} color="#ffffff" />}
                  <AppText style={styles.dialogPrimaryText}>{creatingList ? 'Creating...' : 'Create'}</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        {deleteDialogVisible ? (
          <View style={styles.dialogOverlay} pointerEvents="box-none">
            <Pressable style={styles.dialogScrim} onPress={closeDeleteDialog} />
            <View style={styles.dialogCard}>
              <View style={[styles.dialogBadge, styles.dialogBadgeDanger]}>
                <AlertTriangle size={16} color={themeColors.negative} />
                <AppText style={styles.dialogBadgeText}>Delete Watchlist</AppText>
              </View>
              <AppText style={styles.dialogTitle}>Delete this watchlist?</AppText>
              <AppText style={styles.dialogBody}>
                {selectedList
                  ? `This will permanently remove "${selectedList.title}" and its saved symbols from your account.`
                  : 'This will permanently remove the selected watchlist and its saved symbols from your account.'}
              </AppText>
              <View style={styles.dialogActions}>
                <Pressable style={styles.dialogGhost} onPress={closeDeleteDialog} disabled={deleteInFlight}>
                  <AppText style={styles.dialogGhostText}>Cancel</AppText>
                </Pressable>
                <Pressable
                  style={[styles.dialogDanger, deleteInFlight ? styles.createBtnLoading : null]}
                  onPress={handleDeleteWatchlist}
                  disabled={deleteInFlight}
                >
                  {deleteInFlight ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Trash2 size={14} color="#ffffff" />
                  )}
                  <AppText style={styles.dialogPrimaryText}>{deleteInFlight ? 'Deleting...' : 'Delete'}</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <BottomTabs activeRoute="Watchlist" navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, isLight, isWide, isCompact) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    title: { color: colors.textPrimary, fontSize: 30, fontFamily: FONT.extraBold },
    subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 0, fontFamily: FONT.regular },
    sectionActions: {
      paddingHorizontal: 12,
      paddingBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    sectionBtn: {
      minHeight: 34,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 10,
    },
    sectionBtnText: { color: colors.textPrimary, fontSize: 12, fontFamily: FONT.medium },
    tableHead: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: isLight ? 'rgba(255,255,255,0.44)' : 'rgba(10,15,26,0.24)',
    },
    th: { color: colors.textPrimary, fontSize: 10, fontFamily: FONT.semiBold },
    thSym: { flex: 1.1 },
    thNum: { flex: 1, textAlign: 'right' },
    sectionRows: { paddingHorizontal: 10, paddingVertical: 10, gap: 8, paddingBottom: 110 },
    rowCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      paddingHorizontal: 10,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cell: { color: colors.textPrimary, fontSize: 12, fontFamily: FONT.medium },
    cellSym: { flex: 1.1, fontSize: 12, fontFamily: FONT.semiBold },
    cellNum: { flex: 1, textAlign: 'right', fontSize: 11, fontFamily: FONT.medium },
    up: { color: '#34d399' },
    down: { color: '#fb7185' },
    errorText: { color: colors.negative, fontSize: 12, paddingHorizontal: 4, fontFamily: FONT.medium },
    content: {
      width: '100%',
      alignSelf: 'center',
      maxWidth: isWide ? 1320 : 760,
      paddingHorizontal: isWide ? 20 : 12,
      paddingTop: 12,
      paddingBottom: 110,
      gap: 12,
    },
    presetPageContent: {
      width: '100%',
      alignSelf: 'center',
      maxWidth: isWide ? 1320 : 760,
      paddingHorizontal: isWide ? 20 : 12,
      paddingTop: 14,
      paddingBottom: 110,
      gap: 14,
    },
    presetTableCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOpacity: isLight ? 0.06 : 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    presetTableBody: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    presetTableRow: {
      paddingHorizontal: 6,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    presetTableRowLast: {
      borderBottomWidth: 0,
    },
    topActionRow: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-between', minHeight: isWide ? 46 : undefined },
    topActionCopy: { flex: 1, minWidth: 0 },
    createRowCompact: { width: '100%' },
    inputShell: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
    },
    input: { flex: 1, color: colors.textPrimary, paddingVertical: 8, fontSize: 14, fontFamily: FONT.medium },
    createBtn: {
      height: 38,
      borderRadius: 999,
      minWidth: 150,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      flexShrink: 0,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#111827' : '#f8fafc',
    },
    createBtnCompact: { width: '100%' },
    createBtnLoading: { opacity: 0.8 },
    createBtnText: { color: isLight ? '#ffffff' : '#0b1220', fontSize: 13, fontFamily: FONT.semiBold },
    workspace: {
      width: '100%',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: isWide ? 18 : 14,
      gap: 12,
      overflow: 'hidden',
    },
    workspaceHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    workspaceTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    workspaceTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      fontFamily: FONT.extraBold,
    },
    renameInput: {
      minHeight: 36,
      paddingVertical: 6,
    },
    workspaceDeleteBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    renameActionBtn: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    renameActionText: { color: colors.textPrimary, fontSize: 11, fontFamily: FONT.medium },
    listTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: isWide ? 10 : 6, marginTop: -2, alignItems: 'center' },
    listChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingLeft: 11,
      paddingRight: 8,
      paddingVertical: 6,
    },
    listChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    listChipText: { color: colors.textMuted, fontSize: 12, fontFamily: FONT.medium },
    listChipTextActive: { color: isLight ? '#ffffff' : '#0b0f1f', fontFamily: FONT.semiBold },
    listChipCount: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.12)',
    },
    listChipCountActive: {
      backgroundColor: isLight ? 'rgba(255,255,255,0.22)' : 'rgba(10,15,26,0.18)',
    },
    listChipCountText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: FONT.semiBold,
    },
    listChipCountTextActive: {
      color: isLight ? '#ffffff' : '#0b0f1f',
    },
    addSymbolRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    suggestionBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
    },
    suggestionRow: {
      minHeight: 34,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionSym: { color: colors.textPrimary, fontSize: 12, width: 56, fontFamily: FONT.semiBold },
    suggestionName: { color: colors.textMuted, fontSize: 12, flex: 1, fontFamily: FONT.regular },
    workspaceLoadingState: {
      minHeight: 180,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
    sortChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sortChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    sortChipText: { color: colors.textMuted, fontSize: 11 },
    sortChipTextActive: { color: isLight ? '#ffffff' : '#0b0f1f' },
    sortArrow: { fontSize: 11, color: colors.textMuted },
    plusBtn: {
      width: 42,
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editingHint: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: -2,
    },
    symbolWrap: { gap: isWide ? 10 : 8, minHeight: 36 },
    symbolCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      paddingHorizontal: isWide ? 16 : 12,
      paddingVertical: isWide ? 14 : 12,
    },
    symbolCardMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    symbolIdentity: {
      minWidth: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    symbolNameInline: { color: colors.textPrimary, fontSize: 15, fontFamily: FONT.medium },
    symbolInlineMetrics: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
      flex: 1,
      minWidth: 0,
    },
    symbolPrice: {
      color: colors.textPrimary,
      fontSize: 16,
      fontFamily: FONT.semiBold,
      minWidth: 72,
      textAlign: 'right',
    },
    symbolChange: {
      fontSize: 12,
      fontFamily: FONT.medium,
      minWidth: 58,
      textAlign: 'right',
    },
    symbolMeta: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.medium,
      minWidth: 56,
      textAlign: 'right',
    },
    removeChip: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(207,63,88,0.18)',
      backgroundColor: 'rgba(207,63,88,0.08)',
      marginLeft: 2,
    },
    symbolActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    emptyText: { color: colors.textMuted, fontSize: 12, paddingVertical: 8, fontFamily: FONT.regular },
    cancelEditBtn: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.surfaceAlt,
    },
    cancelEditText: {
      color: colors.textMuted,
      fontSize: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 5,
      marginTop: isWide ? 12 : 8,
      marginBottom: isWide ? 6 : 2,
    },
    sectionHeaderCopy: {
      flex: 1,
      minWidth: 0,
      gap: 5,
    },
    sectionEyebrow: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: isLight ? 'rgba(17,24,39,0.06)' : 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionEyebrowText: {
      color: colors.textPrimary,
      fontSize: 10,
      fontFamily: FONT.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sectionMetaPill: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 12,
    },
    sectionMetaText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: FONT.medium,
    },
    sectionTitle: { color: colors.textPrimary, fontSize: 24, lineHeight: 28, marginTop: 0, fontFamily: FONT.extraBold },
    sectionSubTitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18, fontFamily: FONT.regular },
    presetRail: {
      gap: 14,
      paddingTop: 8,
      paddingRight: 12,
      paddingBottom: 14,
    },
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 18,
      paddingTop: 8,
      paddingBottom: 14,
    },
    presetCard: {
      width: 212,
      minHeight: 196,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 18,
      paddingVertical: 18,
      gap: 16,
      backgroundColor: colors.surfaceGlass,
      shadowColor: '#000000',
      shadowOpacity: isLight ? 0.1 : 0.24,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 7,
      marginBottom: 2,
    },
    presetCardWide: {
      width: '31.9%',
      minWidth: isCompact ? 212 : 280,
      flexGrow: 1,
    },
    presetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    presetTag: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: isLight ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetTagText: {
      color: colors.textPrimary,
      fontSize: 10,
      fontFamily: FONT.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    presetTitle: { color: colors.textPrimary, fontSize: 23, minHeight: 56, fontFamily: FONT.extraBold, lineHeight: 28 },
    countPill: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? 'rgba(255,255,255,0.62)' : 'rgba(10,15,26,0.28)',
      minWidth: 38,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: { color: colors.textPrimary, fontSize: 11, fontFamily: FONT.semiBold },
    presetPreview: { color: colors.textMuted, fontSize: 12, lineHeight: 20, fontFamily: FONT.regular, minHeight: 42 },
    presetFooter: {
      marginTop: 'auto',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 4,
    },
    presetActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isLight ? 'rgba(255,255,255,0.54)' : 'rgba(10,15,26,0.22)',
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetFooterText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: FONT.semiBold,
    },
    dialogOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 24,
      zIndex: 20,
      elevation: 20,
    },
    dialogScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isLight ? 'rgba(15,23,42,0.28)' : 'rgba(3,6,12,0.7)',
    },
    dialogCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 16,
      gap: 14,
    },
    dialogBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    dialogBadgeText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontFamily: FONT.semiBold,
    },
    dialogBadgeDanger: {
      borderColor: isLight ? 'rgba(220, 38, 38, 0.18)' : 'rgba(248, 113, 113, 0.22)',
      backgroundColor: isLight ? 'rgba(254, 242, 242, 0.98)' : 'rgba(127, 29, 29, 0.24)',
    },
    dialogTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontFamily: FONT.extraBold,
    },
    dialogBody: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: FONT.regular,
    },
    dialogInputShell: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      justifyContent: 'center',
    },
    dialogInput: {
      color: colors.textPrimary,
      fontSize: 15,
      fontFamily: FONT.medium,
      paddingVertical: 8,
    },
    dialogActions: {
      flexDirection: 'row',
      gap: 10,
    },
    dialogGhost: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dialogGhostText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: FONT.semiBold,
    },
    dialogPrimary: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      backgroundColor: '#111827',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    dialogDanger: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      backgroundColor: isLight ? '#B42318' : '#DC2626',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    dialogPrimaryText: {
      color: '#ffffff',
      fontSize: 14,
      fontFamily: FONT.semiBold,
    },
  });

export default Watchlist;
