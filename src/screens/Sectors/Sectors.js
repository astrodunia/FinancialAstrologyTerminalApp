import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
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
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow} />

              <View style={styles.grid}>
                {visibleSectors.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Pressable
                      key={item.slug}
                      style={styles.card}
                      onPress={() => openSector(item)}
                    >
                      <View style={styles.cardGlow} />
                      <View style={[styles.cardOrb, { backgroundColor: item.color }]} />

                      <View style={styles.cardTopRow}>
                        <View style={styles.cardTitleRow}>
                          <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                            <Icon size={18} color="#FFFFFF" />
                          </View>

                          <View style={styles.titleBlock}>
                            <AppText style={styles.cardTitle}>
                              {item.name}
                            </AppText>
                            <AppText style={styles.cardSub}>
                              {item.apiSectorName}
                            </AppText>
                          </View>
                        </View>

                        <View style={styles.cardCountBadge}>
                          <AppText style={styles.cardCountText}>
                            {item.count} stocks
                          </AppText>
                        </View>
                      </View>

                      <View style={styles.metricRow}>
                        <View style={styles.metricPill}>
                          <AppText style={styles.metricLabel}>Universe</AppText>
                          <AppText style={styles.metricValue}>
                            {item.count}
                          </AppText>
                        </View>

                        <View style={styles.metricPill}>
                          <AppText style={styles.metricLabel}>Pages</AppText>
                          <AppText style={styles.metricValue}>
                            {item.totalPages}
                          </AppText>
                        </View>
                      </View>

                      <View style={styles.previewRow}>
                        {item.preview.map((ticker) => (
                          <View key={ticker} style={styles.previewChip}>
                            <AppText style={styles.previewChipText}>
                              {ticker}
                            </AppText>
                          </View>
                        ))}
                      </View>

                      <View style={styles.cardFooter}>
                        <AppText style={styles.cardFooterText}>
                          Browse sector
                        </AppText>
                        <ChevronRight size={18} color={themeColors.textPrimary} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {!visibleSectors.length ? (
                <View style={styles.emptyState}>
                  <AppText style={styles.emptyTitle}>
                    No sectors found
                  </AppText>
                  <AppText style={styles.emptyText}>
                    Search by sector name or ticker from the header.
                  </AppText>
                </View>
              ) : null}
            </View>
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
      paddingTop: 12,
      paddingBottom: 120,
    },

    section: {
      marginBottom: 24,
    },

    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 14,
    },

    sectionTitle: {
      fontFamily: 'NotoSans-ExtraBold',
      fontSize: 16,
      lineHeight: 20,
      color: colors.textPrimary,
    },

    sectionMeta: {
      fontFamily: 'NotoSans-Medium',
      fontSize: 11,
      lineHeight: 14,
      color: colors.textMuted,
    },

    grid: {
      gap: 14,
    },

    card: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 24,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: theme === 'dark' ? 'rgba(14,17,25,0.95)' : 'rgba(255,255,255,0.95)',
      shadowColor: '#000000',
      shadowOpacity: theme === 'dark' ? 0.22 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5,
    },

    cardGlow: {
      position: 'absolute',
      top: -24,
      right: -18,
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: colors.accent,
      opacity: theme === 'dark' ? 0.08 : 0.05,
    },

    cardOrb: {
      position: 'absolute',
      bottom: -24,
      right: -16,
      width: 76,
      height: 76,
      borderRadius: 38,
      opacity: theme === 'dark' ? 0.12 : 0.08,
    },

    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 12,
    },

    cardTitleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingRight: 6,
    },

    titleBlock: {
      flex: 1,
      minWidth: 0,
    },

    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOpacity: 0.14,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },

    cardCountBadge: {
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(13,27,42,0.035)',
      borderWidth: 1,
      borderColor: colors.border,
    },

    cardCountText: {
      fontFamily: 'NotoSans-Medium',
      fontSize: 10,
      lineHeight: 12,
      color: colors.textMuted,
    },

    cardTitle: {
      fontFamily: 'NotoSans-ExtraBold',
      fontSize: 15,
      lineHeight: 18,
      color: colors.textPrimary,
      marginBottom: 3,
    },

    cardSub: {
      fontFamily: 'NotoSans-Medium',
      fontSize: 11,
      lineHeight: 16,
      color: colors.textMuted,
    },

    metricRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },

    metricPill: {
      flex: 1,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
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
      marginBottom: 2,
    },

    metricValue: {
      fontFamily: 'NotoSans-SemiBold',
      fontSize: 12,
      lineHeight: 15,
      color: colors.textPrimary,
    },

    previewRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },

    previewChip: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(13,27,42,0.04)',
      borderWidth: 1,
      borderColor: colors.border,
    },

    previewChipText: {
      fontFamily: 'NotoSans-Medium',
      fontSize: 10,
      lineHeight: 12,
      color: colors.textPrimary,
    },

    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 6,
    },

    cardFooterText: {
      fontFamily: 'NotoSans-SemiBold',
      fontSize: 11,
      lineHeight: 14,
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },

    emptyState: {
      marginTop: 12,
      padding: 20,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: theme === 'dark' ? 'rgba(18,22,30,0.72)' : 'rgba(255,255,255,0.8)',
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
