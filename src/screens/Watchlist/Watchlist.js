import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { ArrowLeft, CirclePlus, Pencil, Plus, Radio, Trash2, UserCircle } from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { API_BASE_URL, useUser } from '../../store/UserContext';
import { navigateToStockDetail } from '../../features/stocks/navigation';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';
import { useWatchlist } from '../../hooks/useWatchlist';
import { LIVE_API_BASE } from '../../utils/apiBaseUrl';

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
  const styles = useMemo(() => createStyles(themeColors, theme === 'light'), [themeColors, theme]);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Watchlist', (route) => navigation.navigate(route));

  const [activePreset, setActivePreset] = useState(null);
  const [presetRows, setPresetRows] = useState([]);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetError, setPresetError] = useState('');
  const [livePresetCache, setLivePresetCache] = useState({});
  const presetAbortRef = useRef(null);

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
    phase,
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
  const confirmDeleteWatchlist = () => {
    if (!selectedList) return;
    Alert.alert(
      'Delete watchlist?',
      `Are you sure you want to delete "${selectedList.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSelectedWatchlist() },
      ],
    );
  };

  const addPresetToCurrentList = (symbols) => {
    if (!selectedList) {
      Alert.alert('No watchlist', 'Create a watchlist first.');
      return;
    }
    symbols.forEach((sym) => onAddTicker(sym));
  };

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
    if (!activePreset?.symbols?.length) return undefined;
    const timer = setInterval(() => {
      loadPresetRows(activePreset);
    }, 20000);
    return () => clearInterval(timer);
  }, [activePreset, loadPresetRows]);

  const renderPresetAndPlan = () => (
    <>
      <AppText style={styles.sectionTitle}>Browse Preset Sections</AppText>
      <View style={styles.presetGrid}>
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
                <AppText style={styles.presetTitle} numberOfLines={2}>{section.title}</AppText>
                <View style={styles.countPill}>
                  <AppText style={styles.countText}>{`${section.symbols.length} symbols`}</AppText>
                </View>
              </View>
              <AppText style={styles.presetPreview} numberOfLines={2}>{preview}</AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.planCard}>
        <View style={styles.liveOverlineRow}>
          <View style={styles.liveIconWrap}>
            <Radio size={14} color="#16c784" />
          </View>
          <AppText style={styles.liveOverline}>PLAN</AppText>
        </View>
        <AppText style={styles.planTitle}>Plan the Year. Not Just the Trade.</AppText>
        <AppText style={styles.liveBody}>
          Daily updates keep you sharp. Live broadcasts keep you fast. But strategy is built on foresight.
        </AppText>
        <View style={styles.liveActions}>
          <Pressable style={styles.livePrimary} onPress={() => Linking.openURL('https://finance.rajeevprakash.com/products/annual-letter-2026/').catch(() => {})}>
            <AppText style={styles.livePrimaryText}>Order Annual Letter 2026</AppText>
            <AppText style={styles.livePrimaryText}>-</AppText>
          </Pressable>
          <Pressable style={styles.liveGhost} onPress={() => Linking.openURL('https://finance.rajeevprakash.com/products/live-signals/').catch(() => {})}>
            <AppText style={styles.liveGhostText}>Bundle with Live Signals</AppText>
            <AppText style={styles.liveGhostText}>⚡</AppText>
          </Pressable>
        </View>
      </View>
    </>
  );

  if (activePreset) {
    return (
      <View style={styles.safeArea}>
        <GradientBackground>
          <View style={styles.header}>
            <View>
              <AppText style={styles.title}>{activePreset.title}</AppText>
              <AppText style={styles.subtitle}>{`${activePreset.symbols.length} symbols`}</AppText>
            </View>
            <Pressable style={styles.sectionBtn} onPress={() => setActivePreset(null)}>
              <ArrowLeft size={14} color={themeColors.textPrimary} />
              <AppText style={styles.sectionBtnText}>Custom Watchlist</AppText>
            </Pressable>
          </View>

          <View style={styles.tableHead}>
            <AppText style={[styles.th, styles.thSym]}>SYMBOL</AppText>
            <AppText style={[styles.th, styles.thName]}>NAME</AppText>
            <AppText style={[styles.th, styles.thNum]}>PRICE</AppText>
            <AppText style={[styles.th, styles.thNum]}>% CHANGE</AppText>
            <AppText style={[styles.th, styles.thNum]}>CHANGE</AppText>
            <AppText style={[styles.th, styles.thNum]}>VOLUME</AppText>
          </View>

          <ScrollView contentContainerStyle={styles.sectionRows} showsVerticalScrollIndicator={false}>
            {presetLoading && <ActivityIndicator size="small" color={themeColors.textPrimary} />}
            {!!presetError && <AppText style={styles.errorText}>{presetError}</AppText>}
            {!presetLoading &&
              presetRows.map((row) => {
                const up = (row.pct || 0) >= 0;
                return (
                  <Pressable key={row.symbol} style={styles.rowCard} onPress={() => navigateToStockDetail(navigation, row.symbol)}>
                    <AppText style={[styles.cell, styles.cellSym]}>{row.symbol}</AppText>
                    <AppText style={[styles.cell, styles.cellName]} numberOfLines={1}>{row.name}</AppText>
                    <AppText style={[styles.cell, styles.cellNum, up ? styles.up : styles.down]}>{fmtPrice(row.price)}</AppText>
                    <AppText style={[styles.cell, styles.cellNum, up ? styles.up : styles.down]}>{fmtPct(row.pct)}</AppText>
                    <AppText style={[styles.cell, styles.cellNum, up ? styles.up : styles.down]}>{fmtChange(row.change)}</AppText>
                    <AppText style={[styles.cell, styles.cellNum]}>{fmtVol(row.volume)}</AppText>
                  </Pressable>
                );
              })}
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
        <View style={styles.header}>
          <View>
            <AppText style={styles.title}>My Watchlists</AppText>
            <AppText style={styles.subtitle}>{`Welcome, ${displayName} • ${String(phase || '').toUpperCase()}`}</AppText>
          </View>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <UserCircle size={18} color={themeColors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.createRow, isCompact && styles.createRowCompact]}>
            <View style={styles.inputShell}>
              <CirclePlus size={15} color={themeColors.textMuted} />
              <AppTextInput
                value={newListTitle}
                onChangeText={setNewListTitle}
                placeholder="New watchlist title (e.g. Tech Momentum)"
                placeholderTextColor={themeColors.textMuted}
                style={styles.input}
              />
            </View>
            <Pressable
              style={[styles.createBtn, isCompact && styles.createBtnCompact, creatingList && styles.createBtnLoading]}
              onPress={createWatchlist}
              disabled={creatingList}
            >
              {creatingList ? (
                <ActivityIndicator size="small" color={styles.createBtnText.color} />
              ) : (
                <Plus size={14} color={styles.createBtnText.color} />
              )}
              <AppText style={styles.createBtnText}>{creatingList ? 'Creating...' : 'Create'}</AppText>
            </Pressable>
          </View>

          <View style={styles.listTabs}>
            {watchlists.map((list) => {
              const active = list.id === selectedListId;
              return (
                <Pressable key={list.id} style={[styles.listChip, active && styles.listChipActive]} onPress={() => setSelectedListId(list.id)}>
                  <AppText style={[styles.listChipText, active && styles.listChipTextActive]}>{list.title}</AppText>
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
                  value={newSymbol}
                  onChangeText={setNewSymbol}
                  placeholder="Add symbol (e.g. NVDA)"
                  placeholderTextColor={themeColors.textMuted}
                  style={styles.input}
                  autoCapitalize="characters"
                />
              </View>
              <Pressable style={styles.plusBtn} onPress={() => onAddTicker()}>
                <Plus size={16} color={themeColors.textPrimary} />
              </Pressable>
            </View>

            {!!suggestions.length && (
              <View style={styles.suggestionBox}>
                {suggestions.map((item) => (
                  <Pressable key={item.symbol} style={styles.suggestionRow} onPress={() => onAddTicker(item.symbol)}>
                    <AppText style={styles.suggestionSym}>{item.symbol}</AppText>
                    <AppText style={styles.suggestionName} numberOfLines={1}>{item.name}</AppText>
                  </Pressable>
                ))}
              </View>
            )}
            {loadingList && !customRows.length ? (
              <ActivityIndicator size="small" color={themeColors.textPrimary} />
            ) : customRows.length ? (
              <FlatList
                data={customRows}
                keyExtractor={(item) => item.symbol}
                scrollEnabled={false}
                contentContainerStyle={styles.symbolWrap}
                renderItem={({ item: row }) => {
                  const up = (row.pct || 0) >= 0;
                  return (
                    <Pressable style={styles.rowCard} onPress={() => navigateToStockDetail(navigation, row.symbol)}>
                      <AppText style={[styles.cell, styles.cellSym]}>{row.symbol}</AppText>
                      <AppText style={[styles.cell, styles.cellName]} numberOfLines={1}>{toShortName(row.name, row.symbol)}</AppText>
                      <AppText style={[styles.cell, styles.cellNum, up ? styles.up : styles.down]}>{fmtPrice(row.price)}</AppText>
                      <AppText style={[styles.cell, styles.cellNum, up ? styles.up : styles.down]}>{fmtPct(row.pct)}</AppText>
                      <AppText style={[styles.cell, styles.cellNum, up ? styles.up : styles.down]}>{fmtChange(row.change)}</AppText>
                      <AppText style={[styles.cell, styles.cellNum]}>{fmtVol(row.volume)}</AppText>
                      <Pressable onPress={() => removeSymbol(row.symbol)} hitSlop={8}>
                        <Trash2 size={14} color={themeColors.negative} />
                      </Pressable>
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

        <BottomTabs activeRoute="Watchlist" navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, isLight) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 6 : 12,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: colors.textPrimary, fontSize: 26 },
    subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
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
    sectionBtnText: { color: colors.textPrimary, fontSize: 12 },
    tableHead: {
      paddingHorizontal: 14,
      paddingBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    th: { color: colors.textMuted, fontSize: 10 },
    thSym: { width: 58 },
    thName: { flex: 1, paddingRight: 6 },
    thNum: { width: 56, textAlign: 'right' },
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
    cell: { color: colors.textPrimary, fontSize: 12 },
    cellSym: { width: 58, fontSize: 12 },
    cellName: { flex: 1, color: colors.textPrimary, fontSize: 12, paddingRight: 6 },
    cellNum: { width: 56, textAlign: 'right', fontSize: 11 },
    up: { color: '#34d399' },
    down: { color: '#fb7185' },
    errorText: { color: colors.negative, fontSize: 12, paddingHorizontal: 4 },
    content: { paddingHorizontal: 12, paddingBottom: 110, gap: 14 },
    createRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    createRowCompact: { flexDirection: 'column', alignItems: 'stretch' },
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
    input: { flex: 1, color: colors.textPrimary, paddingVertical: 8, fontSize: 14 },
    createBtn: {
      minHeight: 40,
      borderRadius: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#8b93a1' : 'rgba(148,163,184,0.25)',
    },
    createBtnCompact: { width: '100%' },
    createBtnLoading: { opacity: 0.8 },
    createBtnText: { color: '#ffffff', fontSize: 14 },
    workspace: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 10,
      gap: 10,
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
    renameActionText: { color: colors.textPrimary, fontSize: 11 },
    listTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    listChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    listChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    listChipText: { color: colors.textMuted, fontSize: 12 },
    listChipTextActive: { color: isLight ? '#ffffff' : '#0b0f1f' },
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
    suggestionSym: { color: colors.textPrimary, fontSize: 12, width: 56 },
    suggestionName: { color: colors.textMuted, fontSize: 12, flex: 1 },
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
    symbolWrap: { gap: 8, minHeight: 36 },
    symbolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    symbolRowLeft: {
      flex: 1,
    },
    symbolActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    symbolText: { color: colors.textPrimary, fontSize: 13 },
    removeText: { color: colors.textMuted, fontSize: 12 },
    emptyText: { color: colors.textMuted, fontSize: 12, paddingVertical: 8 },
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
    sectionTitle: { color: colors.textPrimary, fontSize: 26, textAlign: 'center', marginTop: 2 },
    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    presetCard: {
      minWidth: 160,
      flexGrow: 1,
      flexBasis: 160,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 10,
    },
    presetHead: { gap: 8 },
    presetTitle: { color: colors.textPrimary, fontSize: 22, minHeight: 56 },
    countPill: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? 'rgba(255,255,255,0.45)' : 'rgba(10,15,26,0.35)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: 'flex-end',
    },
    countText: { color: colors.textPrimary, fontSize: 11 },
    presetPreview: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
    liveCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#eef8ec' : 'rgba(9, 45, 33, 0.45)',
      padding: 14,
      gap: 10,
      marginBottom: 6,
    },
    liveOverlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    liveIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isLight ? 'rgba(22,199,132,0.12)' : 'rgba(22,199,132,0.18)',
    },
    liveOverline: { color: isLight ? '#1f8a63' : '#67e6b5', fontSize: 12 },
    liveTitle: { color: colors.textPrimary, fontSize: 30 },
    liveBody: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
    liveActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    livePrimary: {
      flex: 1,
      minWidth: 220,
      minHeight: 42,
      borderRadius: 9,
      backgroundColor: '#22a559',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
    },
    livePrimaryText: { color: '#ffffff', fontSize: 13 },
    liveGhost: {
      flex: 1,
      minWidth: 220,
      minHeight: 42,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 12,
    },
    liveGhostText: { color: colors.textPrimary, fontSize: 13 },
  });

export default Watchlist;





