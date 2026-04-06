import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import HomeHeader from '../../components/HomeHeader';
import { SECTOR_COLLECTION } from '../../data/sectors/sectorUniverse';
import { navigateToStockDetail, normalizeStockSymbol } from '../../features/stocks/navigation';
import { useTickerSearch } from '../../features/stocks/useTickerSearch';
import { useUser } from '../../store/UserContext';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';

const SectorHubScreen = ({ navigation }) => {
  const { theme, themeColors, user } = useUser();
  const styles = createStyles(themeColors, theme);
  const [searchQuery, setSearchQuery] = useState('');
  const profileName = user?.displayName || user?.name || 'Trader';
  const { results, loading, error: searchError } = useTickerSearch(searchQuery);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Sectors', (route) => navigation.navigate(route));

  const visibleSectors = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return SECTOR_COLLECTION;

    return SECTOR_COLLECTION.filter((item) => {
      return (
        item.name.toLowerCase().includes(normalized) ||
        item.apiSectorName.toLowerCase().includes(normalized) ||
        item.tickers.some((ticker) => ticker.toLowerCase().includes(normalized))
      );
    });
  }, [searchQuery]);

  const openSector = (sector) => {
    navigation.navigate('SectorDetail', {
      slug: sector.slug,
    });
  };

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

  return (
    <View style={styles.safeArea} {...swipeHandlers}>
      <GradientBackground>
        <View style={styles.screen}>
          <HomeHeader
            themeColors={themeColors}
            profileName={profileName}
            searchQuery={searchQuery}
            onChangeSearchQuery={setSearchQuery}
            searchResults={results}
            searchLoading={loading}
            searchError={searchError}
            showSearchResults={Boolean(searchQuery.trim())}
            onPressSearchResult={selectTickerSearchResult}
            onSubmitSearch={submitTickerSearch}
            onPressProfile={() => navigation.navigate('Profile')}
            onPressGlobalIndices={() => navigation.navigate('GlobalIndices')}
          />

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.introCard}>
              <View style={styles.introTopRow}>
                <AppText style={styles.introEyebrow}>Sector Overview</AppText>
                <View style={styles.introCountPill}>
                  <AppText style={styles.introCountText}>{visibleSectors.length} sectors</AppText>
                </View>
              </View>
              <AppText style={styles.introTitle}>Follow capital rotation with more clarity.</AppText>
              <AppText style={styles.introBody}>
                Move through the market one sector at a time to spot where momentum is accelerating, where leadership is
                fading, and which groups are worth drilling into before you commit to individual stocks.
              </AppText>
            </View>

            <View style={styles.grid}>
              {visibleSectors.map((item) => {
                const Icon = item.icon;

                return (
                  <Pressable
                    key={item.slug}
                    style={styles.card}
                    onPress={() => openSector(item)}
                  >
                    <View style={[styles.cardAccent, { backgroundColor: item.color }]} />

                    <View style={styles.cardTopRow}>
                      <View style={styles.cardTitleRow}>
                        <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                          <Icon size={18} color="#FFFFFF" />
                        </View>

                        <View style={styles.titleBlock}>
                          <AppText style={styles.cardTitle}>{item.name}</AppText>
                          <AppText style={styles.cardSub}>{item.subtitle}</AppText>
                        </View>
                      </View>

                      <View style={styles.cardArrowWrap}>
                        <ArrowUpRight size={16} color={themeColors.textPrimary} />
                      </View>
                    </View>

                    <View style={styles.metricRow}>
                      <View style={styles.metricTile}>
                        <AppText style={styles.metricLabel}>Stocks</AppText>
                        <AppText style={styles.metricValue}>{item.count}</AppText>
                      </View>

                      <View style={styles.metricTile}>
                        <AppText style={styles.metricLabel}>Pages</AppText>
                        <AppText style={styles.metricValue}>{item.totalPages}</AppText>
                      </View>
                    </View>

                    <View style={styles.previewBlock}>
                      <AppText style={styles.previewLabel}>Key names</AppText>
                      <View style={styles.previewRow}>
                        {item.preview.map((ticker) => (
                          <View key={ticker} style={styles.previewChip}>
                            <AppText style={styles.previewChipText}>{ticker}</AppText>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {!visibleSectors.length ? (
              <View style={styles.emptyState}>
                <AppText style={styles.emptyTitle}>No sectors found</AppText>
                <AppText style={styles.emptyText}>
                  Search by sector name or ticker from the header to jump directly into the right market group.
                </AppText>
              </View>
            ) : null}
          </ScrollView>

          <BottomTabs activeRoute="Sectors" navigation={navigation} />
        </View>
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },

    screen: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 120,
      gap: 16,
    },

    introCard: {
      borderRadius: 28,
      paddingHorizontal: 18,
      paddingVertical: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: theme === 'dark' ? 'rgba(16, 20, 30, 0.82)' : 'rgba(255,255,255,0.92)',
      shadowColor: '#000000',
      shadowOpacity: theme === 'dark' ? 0.18 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
      gap: 10,
    },

    introTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },

    introEyebrow: {
      fontFamily: 'NotoSans-SemiBold',
      fontSize: 11,
      lineHeight: 14,
      color: colors.accent,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },

    introCountPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(13,27,42,0.035)',
    },

    introCountText: {
      fontFamily: 'NotoSans-Medium',
      fontSize: 10,
      lineHeight: 12,
      color: colors.textMuted,
    },

    introTitle: {
      fontFamily: 'NotoSans-ExtraBold',
      fontSize: 22,
      lineHeight: 28,
      color: colors.textPrimary,
    },

    introBody: {
      fontFamily: 'NotoSans-Regular',
      fontSize: 13,
      lineHeight: 21,
      color: colors.textMuted,
    },

    grid: {
      gap: 14,
    },

    card: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 26,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: theme === 'dark' ? 'rgba(14,17,25,0.95)' : 'rgba(255,255,255,0.96)',
      shadowColor: '#000000',
      shadowOpacity: theme === 'dark' ? 0.22 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5,
    },

    cardAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      opacity: 0.95,
    },

    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14,
    },

    cardTitleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingRight: 8,
    },

    titleBlock: {
      flex: 1,
      minWidth: 0,
    },

    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },

    cardArrowWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(13,27,42,0.03)',
    },

    cardTitle: {
      fontFamily: 'NotoSans-ExtraBold',
      fontSize: 16,
      lineHeight: 20,
      color: colors.textPrimary,
      marginBottom: 4,
    },

    cardSub: {
      fontFamily: 'NotoSans-Medium',
      fontSize: 11,
      lineHeight: 17,
      color: colors.textMuted,
    },

    metricRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },

    metricTile: {
      flex: 1,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(13,27,42,0.03)',
    },

    metricLabel: {
      fontFamily: 'NotoSans-Medium',
      fontSize: 10,
      lineHeight: 12,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: 4,
    },

    metricValue: {
      fontFamily: 'NotoSans-ExtraBold',
      fontSize: 14,
      lineHeight: 18,
      color: colors.textPrimary,
    },

    previewBlock: {
      gap: 8,
    },

    previewLabel: {
      fontFamily: 'NotoSans-SemiBold',
      fontSize: 11,
      lineHeight: 14,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    previewRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    previewChip: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(13,27,42,0.04)',
      borderWidth: 1,
      borderColor: colors.border,
    },

    previewChipText: {
      fontFamily: 'NotoSans-SemiBold',
      fontSize: 10,
      lineHeight: 12,
      color: colors.textPrimary,
    },

    emptyState: {
      marginTop: 4,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: theme === 'dark' ? 'rgba(18,22,30,0.72)' : 'rgba(255,255,255,0.86)',
    },

    emptyTitle: {
      fontFamily: 'NotoSans-SemiBold',
      fontSize: 15,
      lineHeight: 18,
      color: colors.textPrimary,
      marginBottom: 4,
    },

    emptyText: {
      fontFamily: 'NotoSans-Regular',
      fontSize: 13,
      lineHeight: 20,
      color: colors.textMuted,
    },
  });

export default SectorHubScreen;
