import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Rect } from 'react-native-svg';
import { hierarchy, treemap, treemapBinary } from 'd3-hierarchy';
import { RefreshCcw } from 'lucide-react-native';
import sectorUniverse from '../../../sector_top_20_tickers.json';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import HomeHeader from '../../components/HomeHeader';
import { navigateToStockDetail, normalizeStockSymbol } from '../../features/stocks/navigation';
import { useTickerSearch } from '../../features/stocks/useTickerSearch';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';
import { API_BASE_URL, useUser } from '../../store/UserContext';
import { getUsMarketSession } from '../../utils/marketDataCache';

const OVERVIEW_HEATMAP_CACHE_KEY = 'overview_heatmap_quotes_v4';
const ACTIVE_MARKET_TTL_MS = 2 * 60 * 1000;
const CLOSED_MARKET_TTL_MS = 30 * 60 * 1000;
const QUOTE_BATCH_SIZE = 40;
const MIN_TICKER_WIDTH = 52;
const MIN_TICKER_HEIGHT = 42;
const MIN_CHANGE_WIDTH = 82;
const MIN_CHANGE_HEIGHT = 60;
const MIN_ICON_ONLY_WIDTH = 24;
const MIN_ICON_ONLY_HEIGHT = 24;

const SECTORS = Object.entries(sectorUniverse?.sectors || {}).map(([name, tickers]) => ({
  name,
  tickers: Array.isArray(tickers) ? tickers : [],
}));

const MARKET_CAP_GROUPS = Object.entries(sectorUniverse?.market_cap_heatmap || {}).map(([name, tickers]) => ({
  name,
  tickers: Array.isArray(tickers) ? tickers : [],
}));

const ALL_TICKERS = [...new Set([
  ...SECTORS.flatMap((sector) => sector.tickers),
  ...MARKET_CAP_GROUPS.flatMap((group) => group.tickers),
])];

const GROUP_COLORS = {
  'Mega Cap': '#7C3AED',
  'Large Cap': '#2563EB',
  'Mid Cap': '#0891B2',
  'Small Cap': '#EA580C',
  Technology: '#6D7CFF',
  Financials: '#18C37E',
  'Health Care': '#FF6E9F',
  Energy: '#F7A600',
  'Consumer Discretionary': '#8A63FF',
  'Consumer Staples': '#16B7C6',
  'Communication Services': '#FF865E',
  Industrials: '#4A96FF',
  Materials: '#85C744',
  'Real Estate': '#FFC34D',
  Utilities: '#8B97AD',
  Unknown: '#98A2B3',
};

const MARKET_CAP_WEIGHTS = [22, 18, 16, 14, 13, 12, 11, 10, 9, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3];
const SECTOR_WEIGHTS = [18, 16, 14, 13, 12, 11, 10, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3];

let overviewMemoryCache = {
  data: null,
  fetchedAt: 0,
};

const chunk = (items, size) => {
  const groups = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
};

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatPercent = (value) => {
  if (value == null) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const formatUpdatedAt = (timestamp) => {
  if (!timestamp) return 'Waiting for data';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

const getCacheTtl = () => (getUsMarketSession().isActive ? ACTIVE_MARKET_TTL_MS : CLOSED_MARKET_TTL_MS);
const isCacheFresh = (timestamp) => Boolean(timestamp) && Date.now() - timestamp < getCacheTtl();

const getSessionLabel = () => {
  const session = getUsMarketSession().session;
  if (session === 'open') return 'Open';
  if (session === 'premarket') return 'Pre-market';
  if (session === 'afterhours') return 'After-hours';
  return 'Closed';
};

const symbolToSector = (() => {
  const map = {};
  SECTORS.forEach((sector) => {
    sector.tickers.forEach((ticker) => {
      map[normalizeStockSymbol(ticker)] = sector.name;
    });
  });
  return map;
})();

const computeChangePercent = (price, prevClose, sessionClose) => {
  const reference = prevClose ?? sessionClose ?? null;
  if (price == null || reference == null || reference <= 0) return null;
  return ((price - reference) / reference) * 100;
};

const readCachedHeatmap = async () => {
  try {
    const raw = await AsyncStorage.getItem(OVERVIEW_HEATMAP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCachedHeatmap = async (entry) => {
  try {
    await AsyncStorage.setItem(OVERVIEW_HEATMAP_CACHE_KEY, JSON.stringify(entry));
  } catch {}
};

const fetchHeatmapQuotes = async (signal) => {
  const payloads = await Promise.all(
    chunk(ALL_TICKERS, QUOTE_BATCH_SIZE).map(async (symbols) => {
      const response = await fetch(
        `${String(API_BASE_URL).replace(/\/+$/, '')}/api/tagx/dashboard/info?tickers=${encodeURIComponent(symbols.join(','))}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal,
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || `Heatmap request failed (${response.status})`);
      }
      return payload?.data || {};
    }),
  );

  const quotes = {};

  payloads.forEach((batch) => {
    Object.entries(batch).forEach(([symbol, wrapper]) => {
      const row = wrapper?.data || {};
      const normalized = normalizeStockSymbol(symbol);
      const price = toNumber(row?.price);
      const prevClose = toNumber(row?.prevClose);
      const sessionClose = toNumber(row?.sessionClose);

      quotes[normalized] = {
        symbol: normalized,
        name: row?.name || normalized,
        price,
        prevClose,
        sessionClose,
        volume: toNumber(row?.volume),
        changePercent: computeChangePercent(price, prevClose, sessionClose),
        sector: symbolToSector[normalized] || 'Unknown',
      };
    });
  });

  return quotes;
};

const getTilePalette = (changePercent) => {
  if (changePercent == null || Math.abs(changePercent) < 0.000001) {
    return {
      fill: '#8F98A3',
      border: '#A7B0BA',
      text: '#FFFFFF',
      subtext: 'rgba(255,255,255,0.92)',
      glow: null,
    };
  }

  if (changePercent >= 2) {
    return {
      fill: '#0F7A43',
      border: '#1FE07C',
      text: '#FFFFFF',
      subtext: 'rgba(255,255,255,0.92)',
      glow: 'rgba(31,224,124,0.22)',
    };
  }

  if (changePercent > 0) {
    return {
      fill: '#22C55E',
      border: '#7AF0A8',
      text: '#052714',
      subtext: '#07351B',
      glow: 'rgba(122,240,168,0.16)',
    };
  }

  if (changePercent <= -2) {
    return {
      fill: '#8F1233',
      border: '#FF6B8C',
      text: '#FFFFFF',
      subtext: 'rgba(255,255,255,0.92)',
      glow: 'rgba(255,107,140,0.2)',
    };
  }

  return {
    fill: '#F43F5E',
    border: '#FF98AA',
    text: '#FFFFFF',
    subtext: 'rgba(255,255,255,0.92)',
    glow: 'rgba(255,152,170,0.18)',
  };
};

const buildTreemapLayouts = (items, width, height) => {
  if (!items.length || width <= 0 || height <= 0) return [];

  const rootInput = hierarchy({
    name: 'root',
    children: items.map((item) => ({
      ...item,
      value: item.weight > 0 ? item.weight : 1,
    })),
  })
    .sum((node) => (typeof node.value === 'number' && node.value > 0 ? node.value : 1))
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  const root = treemap()
    .tile(treemapBinary)
    .size([width, height])
    .paddingOuter(0)
    .paddingInner(0)
    .round(true)(rootInput);

  return root.leaves().map((leaf) => ({
    ...leaf.data,
    x: leaf.x0,
    y: leaf.y0,
    width: Math.max(0, leaf.x1 - leaf.x0),
    height: Math.max(0, leaf.y1 - leaf.y0),
  }));
};

const TreemapCard = ({
  title,
  subtitle,
  description,
  accentColor,
  headerValue,
  insights = [],
  items,
  cardHeight,
  onPressSymbol,
  contentWidth,
  styles,
}) => {
  const layouts = useMemo(
    () => buildTreemapLayouts(items, contentWidth, cardHeight),
    [cardHeight, contentWidth, items],
  );

  return (
    <View style={styles.heatmapCard}>
      <View style={styles.heatmapHeader}>
        <View style={styles.heatmapTitleWrap}>
          <View style={[styles.heatmapAccent, { backgroundColor: accentColor }]} />
          <View style={styles.heatmapTitleTextWrap}>
            <AppText style={styles.heatmapTitle}>{title}</AppText>
            <AppText style={styles.heatmapSubtitle}>{subtitle}</AppText>
          </View>
        </View>
        {headerValue ? (
          <View style={styles.heatmapHeaderValue}>
            <AppText style={styles.heatmapHeaderValueText}>{headerValue}</AppText>
          </View>
        ) : null}
      </View>

      {insights.length ? (
        <View style={styles.insightsRow}>
          {insights.map((item) => (
            <View key={`${title}-${item}`} style={styles.insightPill}>
              <AppText style={styles.insightText}>{item}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      {!!description ? <AppText style={styles.heatmapDescription}>{description}</AppText> : null}

      <View style={[styles.heatmapFrame, { height: cardHeight }]}>
        <Svg width={contentWidth} height={cardHeight} style={styles.svgBase}>
          {layouts.map((tile) => {
            const palette = getTilePalette(tile.changePercent);

            return (
              <React.Fragment key={`bg-${title}-${tile.symbol}`}>
                <Rect x={tile.x} y={tile.y} width={tile.width} height={tile.height} fill={palette.fill} />
                <Rect x={tile.x} y={tile.y} width={tile.width} height={tile.height} fill="none" stroke={palette.border} strokeWidth={1} />
                {palette.glow ? (
                  <Rect
                    x={tile.x + 0.5}
                    y={tile.y + 0.5}
                    width={Math.max(0, tile.width - 1)}
                    height={Math.max(0, tile.height - 1)}
                    fill="none"
                    stroke={palette.glow}
                    strokeWidth={1}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </Svg>

        {layouts.map((tile) => {
          const palette = getTilePalette(tile.changePercent);
          const showTicker = tile.width >= MIN_TICKER_WIDTH && tile.height >= MIN_TICKER_HEIGHT;
          const showChange = tile.width >= MIN_CHANGE_WIDTH && tile.height >= MIN_CHANGE_HEIGHT;
          const showIconOnly = tile.width >= MIN_ICON_ONLY_WIDTH && tile.height >= MIN_ICON_ONLY_HEIGHT;
          const largeTile = tile.width > 120 && tile.height > 88;
          const hugeTile = tile.width > 170 && tile.height > 120;
          const tickerInitial = String(tile.symbol || '?').charAt(0);

          return (
            <Pressable
              key={`${title}-${tile.symbol}`}
              style={[
                styles.tilePressable,
                {
                  left: tile.x,
                  top: tile.y,
                  width: tile.width,
                  height: tile.height,
                },
              ]}
              onPress={() => onPressSymbol(tile.symbol)}
            >
              <View style={styles.tileInner}>
                {showTicker ? (
                  <View style={styles.tileCenterContent}>
                    <AppText
                      numberOfLines={1}
                      style={[
                        styles.tileTicker,
                        largeTile ? styles.tileTickerMedium : null,
                        hugeTile ? styles.tileTickerLarge : null,
                        { color: '#FFFFFF' },
                      ]}
                    >
                      {tile.symbol}
                    </AppText>
                    {showChange ? (
                      <AppText
                        numberOfLines={1}
                        style={[
                          styles.tileChange,
                          largeTile ? styles.tileChangeMedium : null,
                          hugeTile ? styles.tileChangeLarge : null,
                          { color: '#FFFFFF' },
                        ]}
                      >
                        {formatPercent(tile.changePercent)}
                      </AppText>
                    ) : null}
                  </View>
                ) : showIconOnly ? (
                  <View style={styles.tileDotWrap}>
                    <AppText style={[styles.tileFallbackLetter, { color: '#FFFFFF' }]}>
                      {tickerInitial}
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.tileDotWrap} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const describeBreadth = ({ up, down, flat, tracked }) => {
  if (!tracked) {
    return 'Breadth summary will appear once live heatmap data is available.';
  }

  if (up > down) {
    return `${up} stocks are positive, ${down} are negative, and ${flat} are flat. Breadth is leaning constructive, which usually helps the major indices hold up if leadership stays broad.`;
  }

  if (down > up) {
    return `${down} stocks are negative, ${up} are positive, and ${flat} are flat. Breadth is leaning weak, which can pressure the broader market even if a few mega-cap names stay green.`;
  }

  return `${up} stocks are positive, ${down} are negative, and ${flat} are flat. Breadth is balanced right now, so index direction may depend more on heavyweight sectors and large-cap leaders.`;
};

const describeSectorImpact = (sector) => {
  if (!sector?.name) {
    return 'Sector impact commentary will update once enough sector data is loaded.';
  }

  const avg = sector.avgChange ?? 0;
  const direction = avg >= 0 ? 'leading' : 'lagging';
  const moveText = formatPercent(avg);

  if (sector.name === 'Technology') {
    return `Technology is ${direction} with an average move of ${moveText}. Because tech has a heavy weight in Nasdaq and a large influence on the S&P 500, strength here can lift the indices quickly, while weakness can drag sentiment across the market.`;
  }

  if (sector.name === 'Financials') {
    return `Financials are ${direction} with an average move of ${moveText}. Banks and financials often shape confidence in economic growth, credit conditions, and broad index stability, especially for the Dow and S&P 500.`;
  }

  if (sector.name === 'Energy') {
    return `Energy is ${direction} with an average move of ${moveText}. Sharp moves here often affect inflation expectations, commodities sentiment, and cyclical risk appetite across the market.`;
  }

  return `${sector.name} is ${direction} with an average move of ${moveText}. When this sector strengthens, it improves market breadth in its group; when it weakens, it can weigh on index momentum and rotation across related stocks.`;
};

const describeMarketCapGroup = (groupName, items) => {
  const active = items.filter((item) => item.changePercent != null);
  const avgChange = active.length
    ? active.reduce((sum, item) => sum + (item.changePercent || 0), 0) / active.length
    : null;
  const moveText = formatPercent(avgChange);

  if (groupName === 'Mega Cap') {
    return `Mega-cap stocks are averaging ${moveText}. This group has the biggest influence on the headline indices, so strong moves here can move the whole market.`;
  }

  if (groupName === 'Large Cap') {
    return `Large-cap stocks are averaging ${moveText}. This group often reflects the broader market tone and helps confirm whether index strength is stable or narrow.`;
  }

  if (groupName === 'Mid Cap') {
    return `Mid-cap stocks are averaging ${moveText}. Strength here usually suggests participation is widening beyond the biggest names.`;
  }

  if (groupName === 'Small Cap') {
    return `Small-cap stocks are averaging ${moveText}. This group is sensitive to domestic growth and risk appetite, so it can hint at whether traders are rotating into higher-risk names.`;
  }

  return `${groupName} stocks are averaging ${moveText}. This view shows where leadership is concentrated across market-cap tiers.`;
};

const Overview = ({ navigation }) => {
  const { themeColors, user } = useUser();
  const { width: screenWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const profileName = user?.displayName || user?.name || 'Trader';
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Overview', (route) => navigation.navigate(route));
  const contentWidth = Math.max(280, screenWidth - 36);

  const [searchQuery, setSearchQuery] = useState('');
  const [quotesBySymbol, setQuotesBySymbol] = useState(overviewMemoryCache.data || {});
  const [lastUpdated, setLastUpdated] = useState(overviewMemoryCache.fetchedAt || 0);
  const [loading, setLoading] = useState(!overviewMemoryCache.data);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sessionLabel, setSessionLabel] = useState(() => getSessionLabel());
  const { results, loading: searchLoading, error: searchError } = useTickerSearch(searchQuery);

  const applyCacheEntry = useCallback((entry) => {
    if (!entry?.data) return;
    overviewMemoryCache = entry;
    setQuotesBySymbol(entry.data);
    setLastUpdated(entry.fetchedAt);
  }, []);

  const refreshOverview = useCallback(async ({ force = false, signal } = {}) => {
    if (!force && overviewMemoryCache.data && isCacheFresh(overviewMemoryCache.fetchedAt)) {
      setLoading(false);
      return;
    }

    if (overviewMemoryCache.data) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const quotes = await fetchHeatmapQuotes(signal);
      const entry = { data: quotes, fetchedAt: Date.now() };
      applyCacheEntry(entry);
      await writeCachedHeatmap(entry);
      setError('');
    } catch (nextError) {
      if (String(nextError?.message || '').toLowerCase().includes('abort')) return;
      setError(overviewMemoryCache.data ? 'Showing cached heatmap. Live refresh failed.' : 'Unable to load heatmap right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyCacheEntry]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const bootstrap = async () => {
      const stored = await readCachedHeatmap();
      if (!mounted) return;

      const bestEntry =
        stored && (!overviewMemoryCache.fetchedAt || stored.fetchedAt > overviewMemoryCache.fetchedAt)
          ? stored
          : overviewMemoryCache.fetchedAt
            ? overviewMemoryCache
            : null;

      if (bestEntry?.data) {
        applyCacheEntry(bestEntry);
        setLoading(false);
      }

      await refreshOverview({
        force: !bestEntry || !isCacheFresh(bestEntry.fetchedAt),
        signal: controller.signal,
      });
    };

    bootstrap();

    const refreshTimer = setInterval(() => {
      setSessionLabel(getSessionLabel());
      if (getUsMarketSession().isActive) {
        refreshOverview({ force: true });
      }
    }, ACTIVE_MARKET_TTL_MS);

    const clockTimer = setInterval(() => {
      setSessionLabel(getSessionLabel());
    }, 60000);

    return () => {
      mounted = false;
      controller.abort();
      clearInterval(refreshTimer);
      clearInterval(clockTimer);
    };
  }, [applyCacheEntry, refreshOverview]);

  const submitTickerSearch = () => {
    const normalized = normalizeStockSymbol(searchQuery);
    if (/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized)) {
      navigateToStockDetail(navigation, normalized);
      return;
    }
    if (results[0]?.symbol) {
      navigateToStockDetail(navigation, results[0].symbol);
    }
  };

  const selectTickerSearchResult = (item) => {
    if (!item?.symbol) return;
    setSearchQuery(item.symbol);
    navigateToStockDetail(navigation, item.symbol);
  };

  const marketCapHeatmaps = useMemo(() => {
    return MARKET_CAP_GROUPS.map((group) => ({
      ...group,
      items: group.tickers.map((ticker, index) => {
        const symbol = normalizeStockSymbol(ticker);
        const quote = quotesBySymbol[symbol] || {};
        return {
          symbol,
          changePercent: quote.changePercent ?? null,
          weight: MARKET_CAP_WEIGHTS[index] || 1,
        };
      }),
    }));
  }, [quotesBySymbol]);

  const sectorHeatmaps = useMemo(() => {
    return SECTORS.map((sector) => {
      const items = sector.tickers.map((ticker, index) => {
        const symbol = normalizeStockSymbol(ticker);
        const quote = quotesBySymbol[symbol] || {};
        return {
          symbol,
          changePercent: quote.changePercent ?? null,
          weight: SECTOR_WEIGHTS[index] || 1,
        };
      });

      const active = items.filter((item) => item.changePercent != null);
      const avgChange = active.length
        ? active.reduce((sum, item) => sum + item.changePercent, 0) / active.length
        : null;
      const leader = [...active].sort((left, right) => (right.changePercent || 0) - (left.changePercent || 0))[0] || null;
      const upCount = active.filter((item) => (item.changePercent || 0) > 0).length;
      const downCount = active.filter((item) => (item.changePercent || 0) < 0).length;

      return {
        name: sector.name,
        items,
        avgChange,
        leader,
        upCount,
        downCount,
      };
    });
  }, [quotesBySymbol]);

  const visibleSectors = useMemo(() => {
    const filter = searchQuery.trim().toLowerCase();
    if (!filter) return sectorHeatmaps;

    return sectorHeatmaps
      .map((sector) => ({
        ...sector,
        items: sector.items.filter((item) => sector.name.toLowerCase().includes(filter) || item.symbol.toLowerCase().includes(filter)),
      }))
      .filter((sector) => sector.items.length > 0);
  }, [searchQuery, sectorHeatmaps]);

  const summary = useMemo(() => {
    const rows = Object.values(quotesBySymbol);
    const active = rows.filter((item) => item?.changePercent != null);
    return {
      tracked: rows.length,
      up: active.filter((item) => item.changePercent > 0).length,
      down: active.filter((item) => item.changePercent < 0).length,
      flat: active.filter((item) => Math.abs(item.changePercent) < 0.000001).length,
    };
  }, [quotesBySymbol]);

  const legendItems = [
    { label: 'Dark Red', color: '#8F1233' },
    { label: 'Red', color: '#F43F5E' },
    { label: 'Grey', color: '#8F98A3' },
    { label: 'Green', color: '#22C55E' },
    { label: 'Dark Green', color: '#0F7A43' },
  ];

  const marketSummary = useMemo(() => {
    const sectorsWithData = sectorHeatmaps.filter((sector) => sector.avgChange != null);
    const strongestSector =
      [...sectorsWithData].sort((left, right) => (right.avgChange || 0) - (left.avgChange || 0))[0] || null;
    const weakestSector =
      [...sectorsWithData].sort((left, right) => (left.avgChange || 0) - (right.avgChange || 0))[0] || null;

    return {
      breadthText: describeBreadth(summary),
      strongestSector,
      weakestSector,
      strongestText: strongestSector ? describeSectorImpact(strongestSector) : '',
      weakestText: weakestSector
        ? `${weakestSector.name} is the weakest pocket at ${formatPercent(weakestSector.avgChange)}. Continued pressure there can weigh on risk appetite and keep the broader market defensive.`
        : '',
    };
  }, [sectorHeatmaps, summary]);

  return (
    <View style={styles.screen} {...swipeHandlers}>
      <GradientBackground>
        <HomeHeader
          themeColors={themeColors}
          profileName={profileName}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          searchResults={results}
          searchLoading={searchLoading}
          searchError={searchError}
          showSearchResults={Boolean(searchQuery.trim())}
          onPressSearchResult={selectTickerSearchResult}
          onSubmitSearch={submitTickerSearch}
          onPressProfile={() => navigation.navigate('Profile')}
          onPressGlobalIndices={() => navigation.navigate('GlobalIndices')}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTextWrap}>
                <AppText style={styles.heroTitle}>Market Heatmap</AppText>
                <AppText style={styles.heroSubtitle}>Proper treemap layout with real tile hierarchy, stronger contrast, and cached fast loads.</AppText>
              </View>
              <Pressable style={styles.refreshButton} onPress={() => refreshOverview({ force: true })}>
                {refreshing ? <ActivityIndicator size="small" color={themeColors.textPrimary} /> : <RefreshCcw size={16} color={themeColors.textPrimary} />}
              </Pressable>
            </View>

            <View style={styles.metaRow}>
              <AppText style={styles.metaPill}>{`Session ${sessionLabel}`}</AppText>
              <AppText style={styles.metaPill}>{`${summary.up} Up`}</AppText>
              <AppText style={styles.metaPill}>{`${summary.down} Down`}</AppText>
              <AppText style={styles.metaPill}>{`${summary.flat} Flat`}</AppText>
            </View>

            <AppText style={styles.updatedText}>{`Updated ${formatUpdatedAt(lastUpdated)}`}</AppText>

            {error ? (
              <View style={styles.inlineMessage}>
                <AppText style={styles.inlineMessageText}>{error}</AppText>
              </View>
            ) : null}

            <View style={styles.legendRow}>
              {legendItems.map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <AppText style={styles.legendText}>{item.label}</AppText>
                </View>
              ))}
            </View>
          </View>

          {loading && !summary.tracked ? (
            <View style={styles.loaderCard}>
              <ActivityIndicator size="small" color={themeColors.textPrimary} />
              <AppText style={styles.loaderText}>Loading heatmaps...</AppText>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderTextWrap}>
                  <AppText style={styles.sectionTitle}>Market Cap View</AppText>
                  <AppText style={styles.sectionDescription}>
                    Track leadership by market-cap bucket to see whether index strength is coming from mega caps only or broadening into mid and small caps.
                  </AppText>
                </View>
                <AppText style={styles.sectionMeta}>{`${marketCapHeatmaps.length} maps`}</AppText>
              </View>

              {marketCapHeatmaps.map((group) => (
                <TreemapCard
                  key={group.name}
                  title={group.name}
                  subtitle={`${group.items.length} stocks`}
                  description={describeMarketCapGroup(group.name, group.items)}
                  accentColor={GROUP_COLORS[group.name] || GROUP_COLORS.Unknown}
                  headerValue={null}
                  insights={[]}
                  items={group.items}
                  cardHeight={320}
                  onPressSymbol={(symbol) => navigateToStockDetail(navigation, symbol)}
                  contentWidth={contentWidth}
                  styles={styles}
                />
              ))}

              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderTextWrap}>
                  <AppText style={styles.sectionTitle}>Sector View</AppText>
                  <AppText style={styles.sectionDescription}>
                    Compare sector breadth and rotation to understand which groups are supporting the indices and which groups are dragging market sentiment lower.
                  </AppText>
                </View>
                <AppText style={styles.sectionMeta}>{`${visibleSectors.length} maps`}</AppText>
              </View>

              {visibleSectors.map((sector) => (
                <TreemapCard
                  key={sector.name}
                  title={sector.name}
                  subtitle="Sector heatmap"
                  description={describeSectorImpact(sector)}
                  accentColor={GROUP_COLORS[sector.name] || GROUP_COLORS.Unknown}
                  headerValue={formatPercent(sector.avgChange)}
                  insights={[
                    `${sector.upCount} up / ${sector.downCount} down`,
                    sector.leader ? `Leader ${sector.leader.symbol} ${formatPercent(sector.leader.changePercent)}` : 'Leader --',
                  ]}
                  items={sector.items}
                  cardHeight={280}
                  onPressSymbol={(symbol) => navigateToStockDetail(navigation, symbol)}
                  contentWidth={contentWidth}
                  styles={styles}
                />
              ))}

              <View style={styles.summaryCard}>
                <AppText style={styles.summaryTitle}>Market Breadth & Sector Impact</AppText>
                <AppText style={styles.summaryText}>{marketSummary.breadthText}</AppText>
                {marketSummary.strongestText ? (
                  <AppText style={styles.summaryText}>{marketSummary.strongestText}</AppText>
                ) : null}
                {marketSummary.weakestText ? (
                  <AppText style={styles.summaryText}>{marketSummary.weakestText}</AppText>
                ) : null}
              </View>
            </>
          )}
        </ScrollView>

        <BottomTabs activeRoute="Overview" navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 110,
      gap: 16,
    },
    heroCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 24,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    heroTextWrap: {
      flex: 1,
      gap: 4,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 22,
      fontFamily: 'NotoSans-ExtraBold',
    },
    heroSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    metaRow: {
      flexDirection: 'row',    
      flexWrap: 'wrap',
      gap: 8,
    },
    metaPill: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: 'NotoSans-SemiBold',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    updatedText: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: 'NotoSans-Medium',
    },
    inlineMessage: {
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inlineMessageText: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: 'NotoSans-Medium',
    },
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },
    legendText: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: 'NotoSans-Medium',
    },
    loaderCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 20,
      paddingVertical: 32,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    loaderText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: 'NotoSans-Medium',
    },
    summaryCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    summaryTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontFamily: 'NotoSans-ExtraBold',
    },
    summaryText: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 19,
      fontFamily: 'NotoSans-Regular',
    },
    heatmapDescription: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },
    sectionHeaderTextWrap: {
      flex: 1,
      gap: 4,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontFamily: 'NotoSans-ExtraBold',
    },
    sectionDescription: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    sectionMeta: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: 'NotoSans-Medium',
    },
    heatmapCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 24,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 7 },
      elevation: 3,
    },
    heatmapHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    heatmapTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    heatmapAccent: {
      width: 6,
      height: 28,
      borderRadius: 999,
    },
    heatmapTitleTextWrap: {
      gap: 2,
    },
    heatmapTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontFamily: 'NotoSans-ExtraBold',
    },
    heatmapSubtitle: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: 'NotoSans-Medium',
    },
    heatmapHeaderValue: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    heatmapHeaderValueText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: 'NotoSans-ExtraBold',
    },
    insightsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    insightPill: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    insightText: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: 'NotoSans-SemiBold',
    },
    heatmapFrame: {
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
    },
    svgBase: {
      position: 'absolute',
      left: 0,
      top: 0,
    },
    tilePressable: {
      position: 'absolute',
      overflow: 'hidden',
    },
    tileInner: {
      flex: 1,
      paddingHorizontal: 6,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    tileCenterContent: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    tileTicker: {
      fontSize: 13,
      fontFamily: 'NotoSans-ExtraBold',
      letterSpacing: 0.4,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    tileTickerMedium: {
      fontSize: 18,
      lineHeight: 22,
      letterSpacing: 0.5,
    },
    tileTickerLarge: {
      fontSize: 24,
      lineHeight: 28,
      letterSpacing: 0.8,
    },
    tileChange: {
      fontSize: 10,
      fontFamily: 'NotoSans-ExtraBold',
      textAlign: 'center',
    },
    tileChangeMedium: {
      fontSize: 12,
      lineHeight: 16,
    },
    tileChangeLarge: {
      fontSize: 14,
      lineHeight: 18,
    },
    tileDotWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileFallbackLetter: {
      fontSize: 18,
      lineHeight: 22,
      fontFamily: 'NotoSans-ExtraBold',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
  });

export default Overview;



