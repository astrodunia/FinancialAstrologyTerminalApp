import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import AppText from '../../components/AppText';
import GradientBackground from '../../components/GradientBackground';
import HomeHeader from '../../components/HomeHeader';
import { getSectorPage, SECTOR_BY_SLUG, SECTOR_PAGE_SIZE } from '../../data/sectors/sectorUniverse';
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
  const { themeColors, user, authFetch } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const sector = SECTOR_BY_SLUG[slug] || SECTOR_BY_SLUG.technology;
  const profileName = user?.displayName || user?.name || 'Trader';

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(1);
    setSearchQuery('');
  }, [slug]);

  const pageTickers = useMemo(() => getSectorPage(sector, page), [page, sector]);
  const totalPages = sector?.totalPages || 1;
  const total = sector?.count || 0;
  const startIndex = total === 0 ? 0 : (page - 1) * SECTOR_PAGE_SIZE + 1;
  const endIndex = Math.min(page * SECTOR_PAGE_SIZE, total);

  const loadQuotes = useCallback(
    async (signal) => {
      setLoading(true);
      setError('');

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

        setStockItems(nextItems);
      } catch (nextError) {
        if (signal?.aborted) return;
        setError(nextError?.message || 'Failed to load sector stocks.');
        setStockItems([]);
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

  const visibleStocks = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return stockItems;

    return stockItems.filter((item) => {
      return item.symbol.toLowerCase().includes(normalized) || item.name.toLowerCase().includes(normalized);
    });
  }, [searchQuery, stockItems]);

  return (
    <View style={styles.screen}>
      <GradientBackground>
        <HomeHeader
          themeColors={themeColors}
          profileName={profileName}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          onPressProfile={() => navigation.navigate('Profile')}
          onPressGlobalIndices={() => navigation.navigate('GlobalIndices')}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>{sector?.name || 'Tech'} stocks</AppText>
              <AppText style={styles.sectionLink}>
                Page {page}/{totalPages}  {startIndex}-{endIndex} of {total}
              </AppText>
            </View>

            <View style={styles.stocksCard}>
              <View style={styles.stockHeadRow}>
                <AppText style={styles.stockHeadTextLeft}>Symbol</AppText>
                <View style={styles.stockHeadRight}>
                  <AppText style={styles.stockHeadText}>Price</AppText>
                  <AppText style={styles.stockHeadText}>Change</AppText>
                </View>
              </View>

              {loading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color={themeColors.textPrimary} />
                  <AppText style={styles.stateText}>Loading live quotes...</AppText>
                </View>
              ) : null}

              {!loading && error ? (
                <View style={styles.centerState}>
                  <AppText style={styles.errorText}>{error}</AppText>
                </View>
              ) : null}

              {!loading && !error
                ? visibleStocks.map((item, idx) => {
                    const up = (item.pct ?? 0) >= 0;

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
                          <View style={[styles.changePill, up ? styles.changePillUp : styles.changePillDown]}>
                            {up ? (
                              <ArrowUpRight size={12} color={themeColors.positive} />
                            ) : (
                              <ArrowDownRight size={12} color={themeColors.negative} />
                            )}
                            <AppText
                              style={[
                                styles.changeText,
                                { color: up ? themeColors.positive : themeColors.negative },
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

              {!loading && !error && !visibleStocks.length ? (
                <View style={styles.centerState}>
                  <AppText style={styles.stateText}>No stocks match your search.</AppText>
                </View>
              ) : null}
            </View>

            <View style={styles.paginationBar}>
              <Pressable
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                disabled={page <= 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              >
                <AppText style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>
                  Previous
                </AppText>
              </Pressable>

              <View style={styles.paginationCenter}>
                <AppText style={styles.pageText}>{page} / {totalPages}</AppText>
                <AppText style={styles.pageMeta}>
                  {startIndex}-{endIndex} of {total}
                </AppText>
              </View>

              <Pressable
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                disabled={page >= totalPages}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <AppText style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>
                  Next
                </AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
      paddingTop: 12,
      paddingBottom: 44,
    },

    sectionBlock: {
      marginBottom: 20,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },

    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontFamily: 'NotoSans-ExtraBold',
    },

    sectionLink: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'right',
      flexShrink: 1,
      fontFamily: 'NotoSans-Regular',
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

    priceText: {
      color: colors.textPrimary,
      fontSize: 12,
      width: 92,
      textAlign: 'right',
      fontFamily: 'NotoSans-Regular',
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
      fontFamily: 'NotoSans-Medium',
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
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 12,
    },

    pageBtn: {
      minWidth: 98,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 14,
      backgroundColor: colors.textPrimary,
    },

    pageBtnDisabled: {
      backgroundColor: colors.surfaceAlt,
    },

    pageBtnText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontFamily: 'NotoSans-SemiBold',
    },

    pageBtnTextDisabled: {
      color: colors.textMuted,
    },

    paginationCenter: {
      flex: 1,
      alignItems: 'center',
    },

    pageText: {
      fontSize: 14,
      color: colors.textPrimary,
      marginBottom: 2,
      fontFamily: 'NotoSans-SemiBold',
    },

    pageMeta: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: 'NotoSans-Regular',
    },
  });

export default SectorDetailScreen;
