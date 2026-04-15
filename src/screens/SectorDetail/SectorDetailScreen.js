import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { getSectorPage, SECTOR_BY_SLUG } from '../../data/sectors/sectorUniverse';
import { fetchStockInfo } from '../../features/stocks/api';
import { navigateToStockDetail } from '../../features/stocks/navigation';
import { useUser } from '../../store/UserContext';

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const mapSectorStockInfo = (payload, symbol) => {
  const source = payload?.data || payload || {};
  return {
    isLoading: false,
    symbol,
    name: String(source?.longName || source?.shortName || source?.companyName || symbol),
    price: toNumber(
      source?.regularMarketPrice ??
        source?.currentPrice ??
        source?.regularMarketClose ??
        source?.close,
    ),
    pct: toNumber(source?.regularMarketChangePercent ?? source?.priceChangePercent),
  };
};

const buildPlaceholderStocks = (tickers) =>
  tickers.map((ticker) => ({
    isLoading: true,
    symbol: ticker,
    name: ticker,
    price: null,
    pct: null,
  }));

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

const SectorDetailScreen = ({ navigation, route }) => {
  const slug = route?.params?.slug || 'technology';
  const { themeColors, authFetch } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const sector = SECTOR_BY_SLUG[slug] || SECTOR_BY_SLUG.technology;

  const [page, setPage] = useState(1);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(1);
  }, [slug]);

  const pageTickers = useMemo(() => getSectorPage(sector, page), [page, sector]);
  const totalPages = sector?.totalPages || 1;

  const loadQuotes = useCallback(
    async (signal) => {
      setLoading(true);
      setError('');
      const placeholders = buildPlaceholderStocks(pageTickers);
      setStockItems(placeholders);

      try {
        const settled = await Promise.allSettled(
          pageTickers.map(async (ticker) => {
            const payload = await fetchStockInfo(authFetch, ticker, signal);
            return mapSectorStockInfo(payload, ticker);
          }),
        );

        if (signal?.aborted) return;

        const nextItems = settled
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);

        if (!nextItems.length) {
          throw new Error('No stock quotes available for this page.');
        }

        const nextBySymbol = new Map(nextItems.map((item) => [item.symbol, item]));
        setStockItems(placeholders.map((item) => nextBySymbol.get(item.symbol) || item));
      } catch (nextError) {
        if (signal?.aborted) return;
        setError(nextError?.message || 'Failed to load sector stocks.');
        setStockItems(placeholders);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [authFetch, pageTickers],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadQuotes(controller.signal);
    return () => controller.abort();
  }, [loadQuotes]);

  const visibleStocks = stockItems;

  return (
    <View style={styles.screen}>
      <GradientBackground>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color={themeColors.textPrimary} />
          </Pressable>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <AppText style={styles.sectionTitle}>{sector?.name || 'Tech'} stocks</AppText>
              </View>
              <View style={styles.paginationBar}>
                <Pressable
                  style={[styles.pageIconBtn, page <= 1 && styles.pageBtnDisabled]}
                  disabled={page <= 1}
                  onPress={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={16} color={page <= 1 ? themeColors.textMuted : themeColors.textPrimary} />
                </Pressable>

                <AppText style={styles.pageText}>{page}/{totalPages}</AppText>

                <Pressable
                  style={[styles.pageIconBtn, page >= totalPages && styles.pageBtnDisabled]}
                  disabled={page >= totalPages}
                  onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <ChevronRight size={16} color={page >= totalPages ? themeColors.textMuted : themeColors.textPrimary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.stocksCard}>
              <View style={styles.stockHeadRow}>
                <AppText style={styles.stockHeadTextLeft}>Symbol</AppText>
                <View style={styles.stockHeadRight}>
                  <AppText style={styles.stockHeadText}>Price</AppText>
                  <AppText style={styles.stockHeadText}>Change</AppText>
                </View>
              </View>

              {!loading && error ? (
                <View style={styles.inlineStateRow}>
                  <AppText style={styles.errorText}>{error}</AppText>
                </View>
              ) : null}

              {visibleStocks.length
                ? visibleStocks.map((item, idx) => {
                    if (item.isLoading) {
                      return (
                        <View key={item.symbol} style={[styles.stockRow, idx === visibleStocks.length - 1 && styles.listRowLast]}>
                          <View style={styles.stockLeft}>
                            <AppText style={styles.ticker}>{item.symbol}</AppText>
                            <View style={styles.loadingCompanyBar} />
                          </View>

                          <View style={styles.stockRight}>
                            <View style={styles.loadingPriceBar} />
                            <View style={styles.loadingChangePill}>
                              <ActivityIndicator size="small" color={themeColors.textMuted} />
                            </View>
                          </View>
                        </View>
                      );
                    }

                    const pct = item.pct ?? 0;
                    const isFlat = Math.abs(pct) < 0.000001;
                    const up = pct > 0;

                    return (
                      <Pressable
                        key={item.symbol}
                        onPress={() => navigateToStockDetail(navigation, item.symbol)}
                        style={[styles.stockRow, idx === visibleStocks.length - 1 && styles.listRowLast]}
                      >
                        <View style={styles.stockLeft}>
                          <AppText style={styles.ticker}>{item.symbol}</AppText>
                          <AppText style={styles.company} numberOfLines={1}>
                            {item.name}
                          </AppText>
                        </View>

                        <View style={styles.stockRight}>
                          <AppText style={styles.priceText}>{formatPrice(item.price)}</AppText>
                          <View
                            style={[
                              styles.changePill,
                              isFlat ? styles.changePillNeutral : up ? styles.changePillUp : styles.changePillDown,
                            ]}
                          >
                            {isFlat ? null : up ? (
                              <ArrowUpRight size={12} color={themeColors.positive} />
                            ) : (
                              <ArrowDownRight size={12} color={themeColors.negative} />
                            )}
                            <AppText
                              style={[
                                styles.changeText,
                                { color: isFlat ? themeColors.textMuted : up ? themeColors.positive : themeColors.negative },
                              ]}
                            >
                              {formatPct(item.pct)}
                            </AppText>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                : null}

              {!visibleStocks.length ? <View style={styles.centerState}><AppText style={styles.stateText}>No stocks available.</AppText></View> : null}
            </View>
          </View>
        </ScrollView>
        <BottomTabs activeRoute="Sectors" navigation={navigation} />
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
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: 120,
    },

    backButton: {
      alignSelf: 'flex-start',
      width: 44,
      height: 44,
      marginTop: 14,
      marginBottom: 20,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      alignItems: 'center',
      justifyContent: 'center',
    },

    sectionBlock: {
      marginBottom: 20,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 10,
    },

    sectionTitleBlock: {
      flex: 1,
      paddingRight: 10,
    },

    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontFamily: 'NotoSans-ExtraBold',
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
      fontFamily: 'NotoSans-Regular',
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
      fontFamily: 'NotoSans-Regular',
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
      fontFamily: 'NotoSans-ExtraBold',
    },

    company: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 2,
      fontFamily: 'NotoSans-Regular',
    },

    loadingCompanyBar: {
      width: 92,
      height: 9,
      marginTop: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      opacity: 0.9,
    },

    priceText: {
      color: colors.textPrimary,
      fontSize: 12,
      width: 92,
      textAlign: 'right',
      fontFamily: 'NotoSans-Regular',
    },

    loadingPriceBar: {
      width: 68,
      height: 10,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      opacity: 0.9,
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

    changePillNeutral: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderColor: colors.border,
    },

    loadingChangePill: {
      minWidth: 82,
      minHeight: 28,
      paddingHorizontal: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },

    changeText: {
      fontSize: 11,
      fontFamily: 'NotoSans-Medium',
    },

    centerState: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 18,
    },

    inlineStateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    stateText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: 'NotoSans-Regular',
    },

    errorText: {
      color: colors.negative,
      fontSize: 12,
      textAlign: 'center',
      fontFamily: 'NotoSans-Regular',
    },

    paginationBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    pageIconBtn: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
    },

    pageBtnDisabled: {
      opacity: 0.5,
    },

    pageText: {
      fontSize: 12,
      color: colors.textPrimary,
      fontFamily: 'NotoSans-SemiBold',
    },
  });

export default SectorDetailScreen;
