import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  ArrowDownRight,
  ArrowUpRight,
  MoonStar,
  RefreshCcw,
  UserCircle,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { API_BASE_URL, useUser } from '../../store/UserContext';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';

const LIVE_API_BASE = 'https://finance.rajeevprakash.com';
const TICKER_SYMBOLS = ['MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA'];
const MOVER_SYMBOLS = ['NVDA', 'META', 'TSLA', 'AVGO', 'PLTR', 'AMZN', 'MA', 'GOOGL'];

const SECTOR_META = [
  { name: 'Energy', ticker: 'XLE', color: '#f59e0b' },
  { name: 'Technology', ticker: 'XLK', color: '#14b8a6' },
  { name: 'Industrials', ticker: 'XLI', color: '#3b82f6' },
  { name: 'Utilities', ticker: 'XLU', color: '#64748b' },
  { name: 'Communication', ticker: 'XLC', color: '#8b5cf6' },
  { name: 'Materials', ticker: 'XLB', color: '#22c55e' },
  { name: 'Consumer Disc.', ticker: 'XLY', color: '#f97316' },
  { name: 'Real Estate', ticker: 'XLRE', color: '#06b6d4' },
  { name: 'Consumer Staples', ticker: 'XLP', color: '#0ea5e9' },
  { name: 'Financials', ticker: 'XLF', color: '#38bdf8' },
  { name: 'Health Care', ticker: 'XLV', color: '#a855f7' },
];

const COMPANY_FALLBACK = {
  NVDA: 'NVIDIA Corporation',
  META: 'Meta Platforms, Inc.',
  TSLA: 'Tesla, Inc.',
  AVGO: 'Broadcom Inc.',
  PLTR: 'Palantir Technologies Inc.',
  AMZN: 'Amazon.com, Inc.',
  MA: 'Mastercard Incorporated',
  GOOGL: 'Alphabet Inc.',
};



const PLANETARY_EVENTS = [
  {
    title: 'Mercury Retrograde Begins',
    tag: 'MEDIUM',
    score: 72,
    body: 'Tech stocks historically underperform by avg 2.1% during this cycle.',
    sectors: ['Technology', 'Communication'],
  },
  {
    title: 'Venus Neptune Trine',
    tag: 'POSITIVE',
    score: 68,
    body: 'Consumer and discretionary names often improve in the next week.',
    sectors: ['Consumer Disc.', 'Luxury'],
  },
  {
    title: 'Mars Jupiter Opposition',
    tag: 'HIGH',
    score: 87,
    body: 'Major alignment can elevate volatility and short-term risk.',
    sectors: ['Energy', 'Defense', 'Materials'],
  },
];

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (payload?.data && typeof payload.data === 'object') return Object.values(payload.data);
  if (payload && typeof payload === 'object') {
    const vals = Object.values(payload);
    if (vals.length && vals.every((v) => typeof v === 'object')) return vals;
  }
  return [];
};

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const pctFromChange = (price, change) => {
  if (price == null || change == null) return null;
  const prev = price - change;
  if (!prev) return null;
  return (change / prev) * 100;
};



const fmtPrice = (value) => {
  if (value == null) return '--';
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const fmtPct = (value) => {
  if (value == null) return '--';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const fmtCompactMoney = (value) => {
  if (value == null) return '--';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${Math.round(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
};

const fmtCompactVol = (value) => {
  if (value == null) return '--';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${Math.round(value)}`;
};


const normalizeSymbol = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const findBySymbol = (rows, wanted) => {
  const target = normalizeSymbol(wanted);
  if (!target) return null;
  return rows.find((item) => {
    const candidates = [item?.symbol, item?.ticker, item?.code, item?.index, item?.instrument, item?.s];
    return candidates.some((c) => {
      const n = normalizeSymbol(c);
      return n === target || n.endsWith(target);
    });
  }) || null;
};

const pickNumber = (obj, keys) => {
  for (const k of keys) {
    const n = toNumber(obj?.[k]);
    if (n != null) return n;
  }
  return null;
};


const rowQualityScore = (item) => {
  if (!item) return 0;
  const cp = pickNumber(item, ['changePercent', 'percentChange', 'change_percentage', 'change_percent', 'pChange', 'regularMarketChangePercent', 'pct', 'percent']);
  const price = pickNumber(item, ['price', 'value', 'lastPrice', 'last', 'ltp', 'close', 'regularMarketPrice']);
  const change = pickNumber(item, ['priceChange', 'change', 'delta', 'regularMarketChange', 'netChange']);
  const derived = pctFromChange(price, change);
  const vol = pickNumber(item, ['volume', 'vol', 'totalVolume', 'avgVolume', 'regularMarketVolume']);
  const mcap = pickNumber(item, ['marketCap', 'mcap', 'market_cap', 'marketcap', 'mc']);

  let score = 0;
  if (cp != null) score += 4;
  if (derived != null) score += 2;
  if (cp != null && Math.abs(cp) > 0.000001) score += 5;
  if (price != null) score += 1;
  if (vol != null) score += 1;
  if (mcap != null) score += 1;
  return score;
};


const fetchMarketRows = async (symbols, signal) => {
  const unique = [...new Set(symbols.filter(Boolean))];
  if (!unique.length) return [];

  const parseRows = async (url) => {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    return toArray(json?.data || json);
  };

  const parseYahooRows = async (list) => {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(list.join(','))}`;
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    return toArray(json?.quoteResponse?.result || json?.result || []);
  };

  const dedupRows = (allRows) => {
    const best = new Map();
    for (const item of allRows) {
      const id = normalizeSymbol(item?.symbol || item?.ticker || item?.code || item?.index || item?.instrument || item?.s);
      if (!id) continue;
      const prev = best.get(id);
      if (!prev || rowQualityScore(item) >= rowQualityScore(prev)) {
        best.set(id, item);
      }
    }
    return [...best.values()];
  };

  const liveCount = (rows) => unique.filter((sym) => {
    const m = findBySymbol(rows, sym);
    const cp = pickNumber(m, ['changePercent', 'percentChange', 'change_percentage', 'change_percent', 'pChange', 'regularMarketChangePercent', 'pct', 'percent']);
    return cp != null && Math.abs(cp) > 0.000001;
  }).length;

  const batchUrl = `${LIVE_API_BASE}/api/market/indices?symbols=${unique.join(',')}`;
  const batchRows = await parseRows(batchUrl);

  const matchedInBatch = unique.filter((sym) => !!findBySymbol(batchRows, sym)).length;
  const batchLooksGood = matchedInBatch >= Math.max(2, Math.ceil(unique.length * 0.5)) && liveCount(batchRows) >= Math.max(2, Math.ceil(unique.length * 0.25));
  if (batchLooksGood) return batchRows;

  const singles = await Promise.all(unique.map(async (sym) => {
    const u = `${LIVE_API_BASE}/api/market/indices?symbols=${encodeURIComponent(sym)}`;
    return parseRows(u);
  }));
  const mergedPrimary = dedupRows([...batchRows, ...singles.flat()]);
  if (liveCount(mergedPrimary) >= Math.max(2, Math.ceil(unique.length * 0.25))) return mergedPrimary;

  const yahooRows = await parseYahooRows(unique);
  return dedupRows([...mergedPrimary, ...yahooRows]);
};

const getUsSession = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const getPart = (type) => parts.find((part) => part.type === type)?.value || '';
  const weekday = getPart('weekday');
  const hour = Number(getPart('hour') || 0);
  const minute = Number(getPart('minute') || 0);
  const total = hour * 60 + minute;
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (isWeekend) return 'Closed';
  if (total >= 240 && total < 570) return 'Pre-market';
  if (total >= 570 && total < 960) return 'Open';
  if (total >= 960 && total < 1200) return 'After-hours';
  return 'Closed';
};

const Overview = ({ navigation }) => {
  const { theme, themeColors } = useUser();
  const isLight = theme === 'light';
  const styles = useMemo(() => createStyles(themeColors, isLight), [themeColors, isLight]);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Overview', (route) => navigation.navigate(route));

  const [tickerRows, setTickerRows] = useState([]);
  const [movers, setMovers] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [breadth, setBreadth] = useState({ up: 0, down: 0, total: 0 });
  const [session, setSession] = useState(() => getUsSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const tickerAbortRef = useRef(null);
  const moversAbortRef = useRef(null);
  const sectorsAbortRef = useRef(null);
  const breadthAbortRef = useRef(null);

  const fetchTickerStrip = useCallback(async () => {
    tickerAbortRef.current?.abort();
    const ac = new AbortController();
    tickerAbortRef.current = ac;

    try {
      const rows = await fetchMarketRows(TICKER_SYMBOLS, ac.signal);
      if (!rows.length) return;

      const mapped = TICKER_SYMBOLS.map((symbol) => {
        const match = findBySymbol(rows, symbol);
        const price = pickNumber(match, ['price','value','lastPrice','last','ltp','close','regularMarketPrice']);
        const change = pickNumber(match, ['priceChange','change','delta','regularMarketChange','netChange']);
        const cp = pickNumber(match, ['changePercent','percentChange','change_percentage','change_percent','pChange','regularMarketChangePercent','pct','percent']);
        const derivedPct = pctFromChange(price, change);
        const changePercent = (cp != null && Math.abs(cp) > 0.000001) ? cp : (derivedPct != null ? derivedPct : cp);
        return { symbol, price, changePercent };
      }).filter((item) => item.price != null || item.changePercent != null);

      setTickerRows(mapped);
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('abort')) return;
    }
  }, []);

  const fetchMovers = useCallback(async () => {
    moversAbortRef.current?.abort();
    const ac = new AbortController();
    moversAbortRef.current = ac;

    try {
      const rows = await fetchMarketRows(MOVER_SYMBOLS, ac.signal);
      if (!rows.length) throw new Error('Movers API failed');

      const mapped = MOVER_SYMBOLS.map((symbol) => {
        const match = findBySymbol(rows, symbol);
        const rawName = match?.name ?? match?.shortName ?? match?.longName;
        const company = typeof rawName === 'string' ? rawName : (COMPANY_FALLBACK[symbol] || `${symbol} Corp.`);
        const price = pickNumber(match, ['price','value','lastPrice','last','ltp','close','regularMarketPrice']);
        const change = pickNumber(match, ['priceChange','change','delta','regularMarketChange','netChange']);
        const cp = pickNumber(match, ['changePercent','percentChange','change_percentage','change_percent','pChange','regularMarketChangePercent','pct','percent']);
        const derivedPct = pctFromChange(price, change);
        const changePercent = (cp != null && Math.abs(cp) > 0.000001) ? cp : (derivedPct != null ? derivedPct : cp);

        return {
          symbol,
          company,
          changePercent,
          marketCap: pickNumber(match, ['marketCap','mcap','market_cap','marketcap','mc']),
          volume: pickNumber(match, ['volume','vol','totalVolume','avgVolume','regularMarketVolume']),
        };
      }).filter((item) => item.changePercent != null);

      setMovers((prev) => (mapped.length ? mapped : prev).sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 8));
      setError('');
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('abort')) return;
      setError('Unable to load live movers right now.');
      setMovers([]);
    }
  }, []);

  const fetchSectors = useCallback(async () => {
    sectorsAbortRef.current?.abort();
    const ac = new AbortController();
    sectorsAbortRef.current = ac;

    try {
      const symbols = SECTOR_META.map((item) => item.ticker);
      const rows = await fetchMarketRows(symbols, ac.signal);
      if (!rows.length) throw new Error('Sectors API failed');

      setSectors((prev) => {
        const mapped = SECTOR_META.map((base) => {
          const match = findBySymbol(rows, base.ticker);
          const price = pickNumber(match, ['price','value','lastPrice','last','ltp','close','regularMarketPrice']);
          const change = pickNumber(match, ['priceChange','change','delta','regularMarketChange','netChange']);
          const cp = pickNumber(match, ['changePercent','percentChange','change_percentage','change_percent','pChange','regularMarketChangePercent','pct','percent']);
          const derivedPct = pctFromChange(price, change);
        const perf = (cp != null && Math.abs(cp) > 0.000001) ? cp : (derivedPct != null ? derivedPct : cp);
          const prevItem = prev.find((s) => s.ticker === base.ticker);
          const resolved = perf != null ? perf : (prevItem?.perf ?? 0);
          return {
            ...base,
            perf: resolved,
            value: Math.abs(resolved),
          };
        });
        return mapped;
      });
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('abort')) return;
      setSectors([]);
    }
  }, []);

  const fetchBreadth = useCallback(async () => {
    breadthAbortRef.current?.abort();
    const ac = new AbortController();
    breadthAbortRef.current = ac;

    try {
      const res = await fetch(`${API_BASE_URL}/api/tagx/global-indices`, {
        signal: ac.signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;
      const payload = await res.json();
      const rows = toArray(payload);
      const valid = rows
        .map((item) => toNumber(item?.priceChange ?? item?.change ?? item?.delta))
        .filter((value) => value != null);

      const up = valid.filter((value) => value > 0).length;
      const down = valid.filter((value) => value < 0).length;
      setBreadth({ up, down, total: valid.length });
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('abort')) return;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTickerStrip(), fetchMovers(), fetchSectors(), fetchBreadth()]);
      if (mounted) setLoading(false);
    };

    load();

    const liveTimer = setInterval(() => {
      fetchTickerStrip();
      fetchMovers();
      fetchSectors();
      fetchBreadth();
    }, 60000);

    const sessionTimer = setInterval(() => setSession(getUsSession()), 60000);

    return () => {
      mounted = false;
      clearInterval(liveTimer);
      clearInterval(sessionTimer);
      tickerAbortRef.current?.abort();
      moversAbortRef.current?.abort();
      sectorsAbortRef.current?.abort();
      breadthAbortRef.current?.abort();
    };
  }, [fetchBreadth, fetchMovers, fetchSectors, fetchTickerStrip]);

  const cosmic = useMemo(() => {
    const total = breadth.total || 1;
    const alignment = Math.round((breadth.up / total) * 100);
    const volatility = Math.round((breadth.down / total) * 30);
    const confidence = Math.max(0, Math.min(100, alignment - Math.round(volatility / 3)));
    return { alignment, volatility, confidence };
  }, [breadth]);

  const sectorLegend = useMemo(() => {
    const max = Math.max(...sectors.map((item) => Math.abs(item.perf || 0)), 1);
    return [...sectors]
      .sort((a, b) => Math.abs(b.perf || 0) - Math.abs(a.perf || 0))
      .map((item) => ({
        ...item,
        perfText: fmtPct(item.perf),
        score: (5 + ((Math.abs(item.perf || 0) / max) * 3.5)).toFixed(1),
      }));
  }, [sectors]);

  const openNewsletter = useCallback(async () => {
    try {
      await Linking.openURL('https://finance.rajeevprakash.com/products/daily-newsletter/');
    } catch {
      Alert.alert('Open failed', 'Unable to open link right now.');
    }
  }, []);

  return (
    <View style={styles.safeArea} {...swipeHandlers}>
      <GradientBackground>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tickerStrip} contentContainerStyle={styles.tickerStripContent}>
          {tickerRows.map((item) => {
            const isUp = (item.changePercent || 0) >= 0;
            return (
              <View key={item.symbol} style={styles.tickerPill}>
                <AppText style={styles.tickerSymbol}>{item.symbol}</AppText>
                <AppText style={styles.tickerPrice}>{fmtPrice(item.price)}</AppText>
                <AppText style={[styles.tickerPct, isUp ? styles.goodText : styles.badText]}>{fmtPct(item.changePercent)}</AppText>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.titleWrap}>
              <AppText style={styles.title}>Financial Astrology Terminal</AppText>
              <AppText style={styles.subtitle}>Institutional-grade celestial market intelligence</AppText>
            </View>
            <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
              <UserCircle size={18} color={themeColors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <Pressable style={[styles.statusPill, styles.greenPill]} onPress={() => navigation.navigate('GlobalIndices')}>
              <AppText style={styles.statusTitle}>MARKET STATUS</AppText>
              <AppText style={styles.statusText}>All systems active</AppText>
            </Pressable>
            <Pressable style={[styles.statusPill, styles.purplePill]} onPress={() => navigation.navigate('Sectors')}>
              <AppText style={styles.statusTitle}>ASTRO ENGINE</AppText>
              <AppText style={styles.statusText}>Real-time analysis</AppText>
            </Pressable>
            <Pressable style={[styles.statusPill, styles.bluePill]} onPress={() => navigation.navigate('Home')}>
              <AppText style={styles.statusTitle}>NEXT TRANSIT</AppText>
              <AppText style={styles.statusText}>{`Moon - Jupiter - ${session}`}</AppText>
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.twoColRow}>
            <View style={[styles.card, styles.colCard]}>
              <View style={styles.cardHead}>
                <AppText style={styles.cardTitle}>Active Planetary Market Events</AppText>
                <AppText style={styles.cardTag}>Live Analysis</AppText>
              </View>
              {PLANETARY_EVENTS.map((event) => (
                <View key={event.title} style={styles.eventItem}>
                  <View style={styles.eventTop}>
                    <AppText style={styles.eventTitle}>{event.title}</AppText>
                    <View style={styles.eventBadge}><AppText style={styles.eventBadgeText}>{event.tag}</AppText></View>
                  </View>
                  <AppText style={styles.eventBody}>{event.body}</AppText>
                  <AppText style={styles.eventScore}>{`${event.score}%`}</AppText>
                  <View style={styles.sectorChipRow}>
                    {event.sectors.map((sector) => (
                      <View key={sector} style={styles.sectorChip}><AppText style={styles.sectorChipText}>{sector}</AppText></View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.colCard, styles.stackCol]}>
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <AppText style={styles.cardTitle}>Cosmic Market Pulse</AppText>
                  <Pressable style={styles.refreshBtn} onPress={fetchBreadth}><RefreshCcw size={13} color={themeColors.textPrimary} /></Pressable>
                </View>
                <View style={styles.progressRow}><AppText style={styles.progressLabel}>Planetary Alignment</AppText><AppText style={styles.progressValue}>{`${cosmic.alignment}%`}</AppText></View>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${cosmic.alignment}%` }]} /></View>
                <View style={styles.progressRow}><AppText style={styles.progressLabel}>Market Volatility</AppText><AppText style={styles.progressValue}>{cosmic.volatility}</AppText></View>
                <View style={styles.progressTrack}><View style={[styles.progressFillWarning, { width: `${Math.min(cosmic.volatility * 3, 100)}%` }]} /></View>
                <View style={styles.progressRow}><AppText style={styles.progressLabel}>Astro Confidence</AppText><AppText style={[styles.progressValue, styles.goodText]}>{`${cosmic.confidence}/100`}</AppText></View>
                <View style={styles.progressTrack}><View style={[styles.progressFillGood, { width: `${cosmic.confidence}%` }]} /></View>
              </View>

              <View style={styles.card}>
                <View style={styles.cardHead}><AppText style={styles.cardTitle}>Lunar Trading Cycle</AppText><MoonStar size={16} color={themeColors.accent} /></View>
                <View style={styles.lunarRow}><AppText style={styles.lunarMoon}>O</AppText><View><AppText style={styles.lunarPhase}>Full Moon Phase</AppText><AppText style={styles.lunarDesc}>High volatility period</AppText></View></View>
                <View style={styles.progressRow}><AppText style={styles.progressLabel}>Volume impact</AppText><AppText style={styles.goodText}>+22%</AppText></View>
                <View style={styles.progressRow}><AppText style={styles.progressLabel}>Best Entry Time</AppText><AppText style={styles.warnText}>10:30 AM EST</AppText></View>
              </View>
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={[styles.card, styles.colCard]}>
              <View style={styles.cardHead}><AppText style={styles.cardTitle}>Top Movers + Astro Intelligence</AppText><AppText style={styles.cardTag}>Watchlist Universe - Liquid</AppText></View>
              {loading && <View style={styles.loadingRow}><ActivityIndicator size="small" color={themeColors.textPrimary} /><AppText style={styles.loadingText}>Loading live symbols...</AppText></View>}
              {!!error && <AppText style={styles.errorText}>{error}</AppText>}
              {!loading && movers.map((item) => {
                const isUp = (item.changePercent || 0) >= 0;
                return (
                  <Pressable key={item.symbol} style={styles.moverRow} onPress={() => navigation.navigate('GlobalIndices', { symbol: item.symbol })}>
                    <View>
                      <AppText style={styles.moverSymbol}>{item.symbol}</AppText>
                      <AppText style={styles.moverSub}>{item.company}</AppText>
                    </View>
                    <View style={styles.moverRight}>
                      <View style={styles.moverPctRow}>
                        {isUp ? <ArrowUpRight size={13} color={themeColors.positive} /> : <ArrowDownRight size={13} color={themeColors.negative} />}
                        <AppText style={[styles.moverPct, isUp ? styles.goodText : styles.badText]}>{fmtPct(item.changePercent)}</AppText>
                      </View>
                      <AppText style={styles.moverPrice}>{`${fmtCompactMoney(item.marketCap)} - Vol ${fmtCompactVol(item.volume)}`}</AppText>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.card, styles.colCard]}>
              <View style={styles.cardHead}><AppText style={styles.cardTitle}>Sector Astro-Performance Matrix Last 1 Year</AppText></View>
              <View style={styles.chartWrap}>
                {sectors.map((item) => (
                  <View key={item.ticker} style={styles.barCol}>
                    <View style={styles.barTrack}><View style={[styles.barFill, { height: `${Math.min(Math.abs(item.value || 0) * 12, 100)}%` }]} /></View>
                    <AppText style={styles.barLabel} numberOfLines={1}>{item.name}</AppText>
                  </View>
                ))}
              </View>
              <View style={styles.sectorList}>
                {sectorLegend.map((item) => (
                  <View key={`${item.name}-${item.ticker}`} style={styles.sectorRowItem}>
                    <View style={styles.sectorLeft}><View style={[styles.sectorDot, { backgroundColor: item.color }]} /><AppText style={styles.sectorName}>{item.name}</AppText><AppText style={styles.sectorTicker}>{`(${item.ticker})`}</AppText></View>
                    <View style={styles.sectorRight}><AppText style={styles.sectorPerf}>{item.perfText}</AppText><AppText style={styles.sectorScore}>{`* ${item.score}`}</AppText></View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.newsCard}>
            <AppText style={styles.newsOverline}>DAILY NEWSLETTER</AppText>
            <AppText style={styles.newsTitle}>Today's Market. Today's Edge.</AppText>
            <AppText style={styles.newsBody}>Every trading day starts with noise. Our Daily Newsletter filters it down to what matters.</AppText>
            <Pressable style={styles.newsButton} onPress={openNewsletter}><AppText style={styles.newsButtonText}>Subscribe Daily Newsletter</AppText></Pressable>
          </View>
        </ScrollView>

        <BottomTabs activeRoute="Overview" navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, isLight) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    tickerStrip: { maxHeight: 44, marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 4 : 44 },
    tickerStripContent: { paddingHorizontal: 8, gap: 6, alignItems: 'center' },
    tickerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    tickerSymbol: { color: colors.textPrimary, fontSize: 12 },
    tickerPrice: { color: colors.textMuted, fontSize: 11 },
    tickerPct: { fontSize: 11 },
    headerCard: {
      marginHorizontal: 8,
      marginTop: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 10,
      gap: 10,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titleWrap: { flex: 1, paddingRight: 8 },
    title: { color: colors.textPrimary, fontSize: 26 },
    subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    statusPill: { flex: 1, minWidth: 96, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6, gap: 2 },
    greenPill: { borderColor: isLight ? '#71cfab' : '#35be8a', backgroundColor: isLight ? 'rgba(53,190,138,0.08)' : 'rgba(27,140,103,0.2)' },
    purplePill: { borderColor: isLight ? '#f28fb3' : '#ee6e9c', backgroundColor: isLight ? 'rgba(238,110,156,0.08)' : 'rgba(155,48,91,0.2)' },
    bluePill: { borderColor: isLight ? '#79a6ff' : '#2f90ff', backgroundColor: isLight ? 'rgba(80,128,255,0.08)' : 'rgba(33,96,189,0.2)' },
    statusTitle: { color: colors.textPrimary, fontSize: 11 },
    statusText: { color: colors.textMuted, fontSize: 11 },
    content: { paddingHorizontal: 8, paddingBottom: 110, gap: 10 },
    twoColRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    colCard: { flex: 1, minWidth: 260 },
    stackCol: { gap: 10 },
    card: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 10,
      gap: 8,
    },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    cardTitle: { color: colors.textPrimary, fontSize: 16, flex: 1 },
    cardTag: {
      color: colors.textPrimary,
      fontSize: 11,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    refreshBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    eventItem: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: 8,
      gap: 6,
    },
    eventTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
    eventTitle: { color: colors.textPrimary, fontSize: 13, flex: 1 },
    eventBadge: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, paddingHorizontal: 6, paddingVertical: 1 },
    eventBadgeText: { color: colors.textMuted, fontSize: 10 },
    eventBody: { color: colors.textMuted, fontSize: 12 },
    eventScore: { color: colors.textPrimary, fontSize: 11 },
    sectorChipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    sectorChip: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, paddingHorizontal: 6, paddingVertical: 2 },
    sectorChipText: { color: colors.textPrimary, fontSize: 10 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabel: { color: colors.textMuted, fontSize: 12 },
    progressValue: { color: colors.textPrimary, fontSize: 12 },
    progressTrack: { height: 5, borderRadius: 999, backgroundColor: isLight ? '#d8dfec' : '#2e3650', overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: isLight ? '#2f65dc' : '#2d9dff' },
    progressFillWarning: { height: '100%', backgroundColor: '#f3c33c' },
    progressFillGood: { height: '100%', backgroundColor: '#1dc7a0' },
    lunarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    lunarMoon: { color: colors.textPrimary, fontSize: 22 },
    lunarPhase: { color: colors.textPrimary, fontSize: 14 },
    lunarDesc: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    loadingText: { color: colors.textMuted, fontSize: 13 },
    errorText: { color: colors.negative, fontSize: 13 },
    moverRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: 8,
      marginBottom: 4,
    },
    moverSymbol: { color: colors.textPrimary, fontSize: 18 },
    moverSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    moverRight: { alignItems: 'flex-end' },
    moverPrice: { color: colors.textMuted, fontSize: 12 },
    moverPctRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 2 },
    moverPct: { fontSize: 14 },
    goodText: { color: colors.positive },
    badText: { color: colors.negative },
    warnText: { color: '#f3c33c', fontSize: 12 },
    chartWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, minHeight: 132 },
    barCol: { flex: 1, alignItems: 'center', gap: 4 },
    barTrack: {
      width: '100%',
      height: 84,
      borderRadius: 4,
      backgroundColor: isLight ? '#d8dfec' : '#2e3650',
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: { width: '100%', backgroundColor: isLight ? '#2f65dc' : '#2d9dff' },
    barLabel: { color: colors.textMuted, fontSize: 10, width: '100%', textAlign: 'center' },
    sectorList: { marginTop: 6, gap: 4 },
    sectorRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 8 },
    sectorDot: { width: 8, height: 8, borderRadius: 999 },
    sectorName: { color: colors.textPrimary, fontSize: 12 },
    sectorTicker: { color: colors.textMuted, fontSize: 11 },
    sectorRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectorPerf: { color: '#2de28f', fontSize: 12, minWidth: 68, textAlign: 'right' },
    sectorScore: { color: '#f3c33c', fontSize: 12, minWidth: 38, textAlign: 'right' },
    newsCard: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isLight ? '#91b5ff' : 'rgba(96, 141, 255, 0.35)',
      backgroundColor: isLight ? '#d6e9ff' : '#1d56b4',
      padding: 10,
      gap: 8,
      marginBottom: 8,
    },
    newsOverline: { color: isLight ? '#133162' : '#f2f7ff', fontSize: 11 },
    newsTitle: { color: isLight ? '#133162' : '#f2f7ff', fontSize: 18 },
    newsBody: { color: isLight ? '#254676' : '#e6f0ff', fontSize: 12 },
    newsButton: { borderRadius: 6, backgroundColor: '#ffffff', paddingVertical: 9, alignItems: 'center' },
    newsButtonText: { color: '#184ea7', fontSize: 12 },
  });

export default Overview;
