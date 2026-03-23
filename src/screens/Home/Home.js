import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import HomeHeader from '../../components/HomeHeader';
import LiveIndicesTicker from '../../components/LiveIndicesTicker';
import MarketHeatmap from '../../features/marketHeatmap/MarketHeatmap';
import { useHeatmapData } from '../../features/marketHeatmap/useHeatmapData';
import { useTickerSearch } from '../../features/stocks/useTickerSearch';
import { fetchStockInfo, fetchStockNews, mapNews } from '../../features/stocks/api';
import { navigateToStockDetail, normalizeStockSymbol } from '../../features/stocks/navigation';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';
import { useUser } from '../../store/UserContext';
import { getMarketDataCache, getUsMarketSession, setMarketDataCache, shouldRefreshMarketData } from '../../utils/marketDataCache';

const STOCK_ROWS = [
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'AVGO', name: 'Broadcom' },
  { symbol: 'GOOGL', name: 'Alphabet A' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'GOOG', name: 'Alphabet C' },
  { symbol: 'JPM', name: 'JPMorgan' },
  { symbol: 'WMT', name: 'Walmart' },
  { symbol: 'ORCL', name: 'Oracle' },
  { symbol: 'V', name: 'Visa' },
  { symbol: 'LLY', name: 'Eli Lilly' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'MA', name: 'Mastercard' },
  { symbol: 'XOM', name: 'Exxon Mobil' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'PLTR', name: 'Palantir' },
  { symbol: 'COST', name: 'Costco' },
];

const NEWS_SYMBOLS = ['NVDA', 'MSFT', 'AAPL', 'AMZN', 'META', 'TSLA'];
const US_MARKET_TIME_ZONE = 'America/New_York';
const PREMARKET_OPEN_MINUTES = 4 * 60;
const MARKET_OPEN_MINUTES = 9 * 60 + 30;
const MARKET_CLOSE_MINUTES = 16 * 60;
const AFTER_HOURS_CLOSE_MINUTES = 20 * 60;
const HOME_STOCKS_CACHE_KEY = 'homeStocks';
const HOME_STOCKS_TTL_MS = 60 * 1000;

const NEWS_FALLBACK_ROWS = [
  {
    id: 'fallback-1',
    title: 'Mega-cap tech continues to steer broader market sentiment',
    provider: 'Market Desk',
    publishedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    url: 'https://finance.rajeevprakash.com/products/daily-newsletter/',
  },
  {
    id: 'fallback-2',
    title: 'Treasury yields and dollar moves remain key cross-asset drivers',
    provider: 'Macro Watch',
    publishedAt: new Date(Date.now() - 42 * 60000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=1200&q=80',
    url: 'https://finance.rajeevprakash.com/products/daily-newsletter/',
  },
  {
    id: 'fallback-3',
    title: 'Energy and financials stay in focus as sector rotation broadens',
    provider: 'Street Pulse',
    publishedAt: new Date(Date.now() - 76 * 60000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80',
    url: 'https://finance.rajeevprakash.com/products/daily-newsletter/',
  },
  {
    id: 'fallback-4',
    title: 'Volatility stays selective as traders reassess risk leadership',
    provider: 'Flow Wire',
    publishedAt: new Date(Date.now() - 122 * 60000).toISOString(),
    thumbnail: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    url: 'https://finance.rajeevprakash.com/products/daily-newsletter/',
  },
];

const marketClockFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: US_MARKET_TIME_ZONE,
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  month: 'short',
  day: 'numeric',
});

const marketClockPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: US_MARKET_TIME_ZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const buildMarketClock = () => {
  const now = new Date();
  const parts = marketClockPartsFormatter.formatToParts(now);
  const valueOf = (type) => parts.find((part) => part.type === type)?.value || '';
  const weekday = valueOf('weekday');
  const hour = Number(valueOf('hour') || 0);
  const minute = Number(valueOf('minute') || 0);
  const totalMinutes = hour * 60 + minute;
  const isWeekday = weekday !== 'Sat' && weekday !== 'Sun';
  const isPremarket = isWeekday && totalMinutes >= PREMARKET_OPEN_MINUTES && totalMinutes < MARKET_OPEN_MINUTES;
  const isOpen = isWeekday && totalMinutes >= MARKET_OPEN_MINUTES && totalMinutes < MARKET_CLOSE_MINUTES;
  const isAfterHours = isWeekday && totalMinutes >= MARKET_CLOSE_MINUTES && totalMinutes < AFTER_HOURS_CLOSE_MINUTES;
  const session = isOpen ? 'open' : isPremarket ? 'premarket' : isAfterHours ? 'afterhours' : 'closed';
  const statusLabel =
    session === 'open' ? 'OPEN' : session === 'premarket' ? 'PRE' : session === 'afterhours' ? 'AFTER' : 'CLOSED';

  return {
    session,
    isExtendedHours: isPremarket || isAfterHours,
    isOpen,
    label: `${statusLabel} • ${marketClockFormatter.format(now)} ET`,
  };
};

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const looksLikeTicker = (value) => /^[A-Z][A-Z0-9.-]{0,9}$/.test(normalizeStockSymbol(value));

const mapHomeStockInfo = (payload, symbol, fallbackName) => {
  const source = payload?.data || payload || {};

  return {
    symbol,
    shortName: String(source?.shortName || source?.name || fallbackName || ''),
    longName: String(source?.longName || source?.companyName || source?.name || fallbackName || ''),
    marketState: String(source?.marketState || ''),
    regularMarketPrice: toNumber(source?.regularMarketPrice ?? source?.currentPrice),
    regularMarketChange: toNumber(source?.regularMarketChange ?? source?.priceChange),
    regularMarketChangePercent: toNumber(source?.regularMarketChangePercent ?? source?.priceChangePercent),
    regularMarketPreviousClose: toNumber(source?.regularMarketPreviousClose ?? source?.previousClose),
    regularMarketClose: toNumber(source?.regularMarketClose ?? source?.close),
    preMarketPrice: toNumber(source?.preMarketPrice),
    preMarketChangePercent: toNumber(source?.preMarketChangePercent),
    postMarketPrice: toNumber(source?.postMarketPrice),
    postMarketChangePercent: toNumber(source?.postMarketChangePercent),
  };
};

const formatPrice = (value) => {
  if (value == null || Number.isNaN(value)) return '--';
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPct = (value) => {
  if (value == null || Number.isNaN(value)) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(2)}%`;
};

const formatRelativeTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const resolveDisplayPrice = (info, marketClock) => {
  if (!info) return null;

  if (marketClock.session === 'open') {
    return info.regularMarketPrice ?? info.regularMarketClose ?? info.regularMarketPreviousClose ?? null;
  }

  if (marketClock.session === 'premarket') {
    return info.preMarketPrice ?? info.regularMarketPrice ?? info.regularMarketClose ?? info.regularMarketPreviousClose ?? null;
  }

  if (marketClock.session === 'afterhours') {
    return info.postMarketPrice ?? info.regularMarketPrice ?? info.regularMarketClose ?? info.regularMarketPreviousClose ?? null;
  }

  return info.regularMarketClose ?? info.regularMarketPrice ?? info.regularMarketPreviousClose ?? null;
};

const resolveDisplayPct = (info, displayPrice, marketClock) => {
  if (!info) return null;

  if (marketClock.session === 'premarket' && info.preMarketChangePercent != null) {
    return info.preMarketChangePercent;
  }

  if (marketClock.session === 'afterhours' && info.postMarketChangePercent != null) {
    return info.postMarketChangePercent;
  }

  if (marketClock.session !== 'open' && info.regularMarketPreviousClose != null && displayPrice != null && info.regularMarketPreviousClose !== 0) {
    return ((displayPrice - info.regularMarketPreviousClose) / info.regularMarketPreviousClose) * 100;
  }

  if (info.regularMarketChangePercent != null) return info.regularMarketChangePercent;

  const previousClose = info.regularMarketPreviousClose;
  if (displayPrice == null || previousClose == null || previousClose === 0) return null;
  return ((displayPrice - previousClose) / previousClose) * 100;
};

const dedupeNews = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = item.url || item.id || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const HomeSkeleton = ({ styles, themeColors }) => (
  <>
    <View style={styles.sectionBlock}>
      <View style={styles.tickerSkeletonCard}>
        <ActivityIndicator size="small" color={themeColors.textMuted} />
      </View>
    </View>

    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <View style={[styles.skeletonLine, styles.skeletonSectionTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonSectionMeta]} />
      </View>
      <View style={styles.stocksCard}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <View key={idx} style={[styles.stockRow, idx === 4 && styles.listRowLast]}>
            <View style={styles.stockLeft}>
              <View style={[styles.skeletonLine, styles.skeletonTicker]} />
              <View style={[styles.skeletonLine, styles.skeletonCompany]} />
            </View>
            <View style={styles.stockRight}>
              <View style={[styles.skeletonLine, styles.skeletonPrice]} />
              <View style={[styles.skeletonBadge, styles.skeletonPill, { borderColor: themeColors.border }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  </>
);

const Home = ({ navigation }) => {
  const { themeColors, user, authFetch } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const cachedStocks = getMarketDataCache(HOME_STOCKS_CACHE_KEY)?.data || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [marketClock, setMarketClock] = useState(() => buildMarketClock());
  const [stockItems, setStockItems] = useState(cachedStocks);
  const [stocksLoading, setStocksLoading] = useState(!cachedStocks.length);
  const [stocksError, setStocksError] = useState('');
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(!cachedStocks.length);
  const heatmapQuery = useHeatmapData();
  const { results: tickerResults, loading: tickerSearchLoading, error: tickerSearchError } = useTickerSearch(searchQuery);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Home', (route) => navigation.navigate(route));

  const profileName = user?.displayName || user?.name || 'Trader';

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

  const selectTickerSearchResult = useCallback(
    (item) => {
      if (!item?.symbol) return;
      setSearchQuery(item.symbol);
      navigateToStockDetail(navigation, item.symbol);
    },
    [navigation],
  );

  const loadStocks = useCallback(async (signal) => {
    const cached = getMarketDataCache(HOME_STOCKS_CACHE_KEY)?.data || [];
    const shouldRefresh = shouldRefreshMarketData(HOME_STOCKS_CACHE_KEY, HOME_STOCKS_TTL_MS);

    if (!shouldRefresh && cached.length) {
      setStockItems(cached);
      setStocksLoading(false);
      setStocksError('');
      return;
    }

    setStocksLoading(true);
    setStocksError('');

    try {
      const settled = await Promise.allSettled(
        STOCK_ROWS.map(async (item) => {
          const payload = await fetchStockInfo(authFetch, item.symbol, signal);
          const info = mapHomeStockInfo(payload, item.symbol, item.name);
          return {
            symbol: item.symbol,
            name: info.longName || info.shortName || item.name,
            info,
          };
        }),
      );

      if (signal?.aborted) return;

      const nextStocks = settled
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter((item) => item?.info);

      if (!nextStocks.length) {
        throw new Error('No stock quotes available.');
      }

      setMarketDataCache(HOME_STOCKS_CACHE_KEY, nextStocks, getUsMarketSession().session);
      setStockItems(nextStocks);
    } catch (error) {
      if (signal?.aborted) return;
      if (cached.length) {
        setStockItems(cached);
      } else {
        setStocksError(error?.message || 'Failed to load stocks.');
      }
    } finally {
      if (!signal?.aborted) {
        setStocksLoading(false);
      }
    }
  }, [authFetch]);

  const loadNews = useCallback(async (signal) => {
    setNewsLoading(true);

    try {
      const settled = await Promise.allSettled(
        NEWS_SYMBOLS.map(async (symbol) => {
          const payload = await fetchStockNews(authFetch, symbol, signal);
          return mapNews(payload);
        }),
      );

      if (signal?.aborted) return;

      const merged = settled
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value || []);

      const nextNews = dedupeNews(merged)
        .sort((a, b) => {
          const left = a?.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const right = b?.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return right - left;
        })
        .slice(0, 4);

      setNewsItems(nextNews.length ? nextNews : NEWS_FALLBACK_ROWS);
    } catch {
      if (!signal?.aborted) {
        setNewsItems(NEWS_FALLBACK_ROWS);
      }
    } finally {
      if (!signal?.aborted) {
        setNewsLoading(false);
      }
    }
  }, [authFetch]);

  useEffect(() => {
    const controller = new AbortController();
    loadNews(controller.signal);

    Promise.allSettled([loadStocks(controller.signal)]).finally(() => {
      if (!controller.signal.aborted) {
        setInitialLoading(false);
      }
    });

    return () => {
      controller.abort();
    };
  }, [loadNews, loadStocks]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMarketClock(buildMarketClock());
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!getUsMarketSession().isActive) return undefined;

    const intervalId = setInterval(() => {
      setMarketClock(buildMarketClock());
      const controller = new AbortController();
      loadStocks(controller.signal);
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [loadStocks, marketClock.isOpen, marketClock.isExtendedHours, marketClock.session]);

  const visibleStocks = useMemo(() => {
    return stockItems.map((item) => {
      const price = resolveDisplayPrice(item.info, marketClock);
      const pct = resolveDisplayPct(item.info, price, marketClock);

      return {
        symbol: item.symbol,
        name: item.name,
        price,
        pct,
      };
    });
  }, [marketClock, stockItems]);

  const openNews = useCallback(async (item) => {
    if (!item?.url) return;
    try {
      await Linking.openURL(item.url);
    } catch {}
  }, []);

  return (
    <View style={styles.screen} {...swipeHandlers}>
      <GradientBackground>
        <HomeHeader
          themeColors={themeColors}
          profileName={profileName}
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
          {initialLoading ? (
            <HomeSkeleton styles={styles} themeColors={themeColors} />
          ) : (
            <>
              <View style={styles.sectionBlock}>
                <LiveIndicesTicker />
              </View>

              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <AppText style={styles.sectionTitle}>Top 20 stocks</AppText>
                  <AppText style={styles.sectionLink}>{marketClock.label}</AppText>
                </View>

                <View style={styles.stocksCard}>
                  <View style={styles.stockHeadRow}>
                    <AppText style={styles.stockHeadTextLeft}>Symbol</AppText>
                    <View style={styles.stockHeadRight}>
                      <AppText style={styles.stockHeadText}>Price</AppText>
                      <AppText style={styles.stockHeadText}>Change</AppText>
                    </View>
                  </View>

                  {stocksLoading && !visibleStocks.length ? (
                    <View style={styles.centerState}>
                      <ActivityIndicator size="small" color={themeColors.textPrimary} />
                      <AppText style={styles.stateText}>Loading live quotes...</AppText>
                    </View>
                  ) : null}

                  {stocksError && !visibleStocks.length ? (
                    <View style={styles.centerState}>
                      <AppText style={styles.errorText}>{stocksError}</AppText>
                    </View>
                  ) : null}

                  {visibleStocks.map((item, idx) => {
                    const up = (item.pct ?? 0) >= 0;

                    return (
                      <Pressable
                        key={item.symbol}
                        onPress={() => navigateToStockDetail(navigation, item.symbol)}
                        style={[styles.stockRow, idx === visibleStocks.length - 1 && styles.listRowLast]}
                      >
                        <View style={styles.stockLeft}>
                          <AppText style={styles.ticker}>{item.symbol}</AppText>
                          <AppText style={styles.company}>{item.name}</AppText>
                        </View>
                        <View style={styles.stockRight}>
                          <AppText style={styles.priceText}>{formatPrice(item.price)}</AppText>
                          <View style={[styles.changePill, up ? styles.changePillUp : styles.changePillDown]}>
                            {up ? (
                              <ArrowUpRight size={12} color={themeColors.positive} />
                            ) : (
                              <ArrowDownRight size={12} color={themeColors.negative} />
                            )}
                            <AppText style={[styles.changeText, { color: up ? themeColors.positive : themeColors.negative }]}>
                              {formatPct(item.pct)}
                            </AppText>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}

                  {!stocksLoading && !stocksError && !visibleStocks.length ? (
                    <View style={styles.centerState}>
                      <AppText style={styles.stateText}>No stocks match your search.</AppText>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <AppText style={styles.sectionTitle}>Market news</AppText>
                  <AppText style={styles.sectionLink}>{newsLoading ? 'Syncing' : `${newsItems.length} stories`}</AppText>
                </View>

                <View style={styles.newsGrid}>
                  {(newsItems.length ? newsItems : NEWS_FALLBACK_ROWS).map((item) => (
                    <Pressable key={item.id} style={styles.newsCard} onPress={() => openNews(item)}>
                      {item.thumbnail ? (
                        <Image source={{ uri: item.thumbnail }} style={styles.newsImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.newsImage, styles.newsImageFallback]}>
                          <AppText style={styles.newsFallbackText}>No image</AppText>
                        </View>
                      )}
                      <View style={styles.newsOverlay} />
                      <View style={styles.newsMetaRow}>
                        <AppText style={styles.newsSource}>{item.provider || 'Market news'}</AppText>
                        <AppText style={styles.newsMeta}>{formatRelativeTime(item.publishedAt) || 'Latest'}</AppText>
                      </View>
                      <AppText numberOfLines={2} style={styles.newsTitle}>
                        {item.title || 'Untitled story'}
                      </AppText>
                      <View style={styles.newsFooter}>
                        <ExternalLink size={14} color="#FFFFFF" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.sectionBlock}>
                <MarketHeatmap
                  items={heatmapQuery.data || []}
                  loading={heatmapQuery.isLoading}
                  error={heatmapQuery.error instanceof Error ? heatmapQuery.error.message : ''}
                  onRetry={heatmapQuery.refetch}
                  onPressSymbol={(symbol) => navigateToStockDetail(navigation, symbol)}
                />
              </View>
            </>
          )}
        </ScrollView>

        <BottomTabs activeRoute="Home" navigation={navigation} />
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
      gap: 18,
    },
    sectionBlock: {
      gap: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
    },
    sectionLink: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'right',
      flexShrink: 1,
    },
    tickerSkeletonCard: {
      minHeight: 76,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stocksCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 18,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    stockHeadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stockHeadTextLeft: {
      color: colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.3,
    },
    stockHeadRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 26,
    },
    stockHeadText: {
      color: colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.3,
      width: 72,
      textAlign: 'right',
    },
    stockRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    listRowLast: {
      borderBottomWidth: 0,
    },
    stockLeft: {
      flex: 1,
      paddingRight: 8,
    },
    stockRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    ticker: {
      color: colors.textPrimary,
      fontSize: 14,
    },
    company: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
    priceText: {
      color: colors.textPrimary,
      fontSize: 12,
      width: 92,
      textAlign: 'right',
    },
    changePill: {
      minWidth: 82,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    changePillUp: {
      backgroundColor: 'rgba(73, 209, 141, 0.12)',
      borderColor: 'rgba(73, 209, 141, 0.45)',
    },
    changePillDown: {
      backgroundColor: 'rgba(240, 140, 140, 0.12)',
      borderColor: 'rgba(240, 140, 140, 0.45)',
    },
    changeText: {
      fontSize: 11,
    },
    centerState: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 18,
    },
    stateText: {
      color: colors.textMuted,
      fontSize: 12,
    },
    errorText: {
      color: colors.negative,
      fontSize: 12,
      textAlign: 'center',
    },
    newsGrid: {
      gap: 12,
    },
    newsCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      overflow: 'hidden',
      position: 'relative',
      minHeight: 182,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    newsImage: {
      width: '100%',
      height: 182,
    },
    newsImageFallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    newsFallbackText: {
      color: colors.textMuted,
      fontSize: 12,
    },
    newsOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.34)',
    },
    newsMetaRow: {
      position: 'absolute',
      top: 10,
      left: 10,
      right: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    newsSource: {
      fontSize: 10,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      flexShrink: 1,
    },
    newsMeta: {
      color: '#FFFFFF',
      fontSize: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    newsTitle: {
      position: 'absolute',
      left: 10,
      right: 44,
      bottom: 10,
      color: '#FFFFFF',
      fontSize: 13,
      lineHeight: 18,
    },
    newsFooter: {
      position: 'absolute',
      right: 12,
      bottom: 12,
    },
    skeletonBlock: {
      backgroundColor: colors.surfaceAlt,
    },
    skeletonLine: {
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonBadge: {
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
    },
    skeletonSectionTitle: {
      width: 120,
      height: 14,
    },
    skeletonSectionMeta: {
      width: 66,
      height: 12,
    },
    skeletonTicker: {
      width: 44,
      height: 12,
    },
    skeletonCompany: {
      width: 96,
      height: 10,
      marginTop: 6,
    },
    skeletonPrice: {
      width: 78,
      height: 12,
    },
    skeletonPill: {
      width: 80,
      height: 24,
    },
    skeletonNewsChip: {
      width: 64,
      height: 20,
    },
    skeletonNewsTitle: {
      width: '100%',
      height: 12,
    },
    skeletonNewsTitleShort: {
      width: '70%',
      height: 12,
    },
  });

export default Home;
