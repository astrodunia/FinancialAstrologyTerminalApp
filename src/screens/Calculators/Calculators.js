import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Calculator,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import CalculatorCTAContact from '../../components/CalculatorCTAContact';
import HomeHeader from '../../components/HomeHeader';
import { navigateToStockDetail, normalizeStockSymbol } from '../../features/stocks/navigation';
import { useTickerSearch } from '../../features/stocks/useTickerSearch';
import { useUser } from '../../store/UserContext';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';
import { CALCULATOR_SECTIONS } from './catalog';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const CATEGORY_META = {
  trading: {
    icon: TrendingUp,
    tintLight: '#e8f4ff',
    accent: '#1a77d4',
  },
  investing: {
    icon: Wallet,
    tintLight: '#e8f8ec',
    accent: '#2f9159',
  },
  'personal-finance': {
    icon: Calculator,
    tintLight: '#fff3de',
    accent: '#be7a1b',
  },
  astrology: {
    icon: Sparkles,
    tintLight: '#f3e8ff',
    accent: '#7f4ac6',
  },
};

const Calculators = ({ navigation }) => {
  const { theme, themeColors, user } = useUser();
  const { width } = useWindowDimensions();
  const isLight = theme === 'light';
  const compact = width < 380;
  const styles = useMemo(() => createStyles(themeColors, compact, isLight), [themeColors, compact, isLight]);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Calculators', (route) => navigation.navigate(route));
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const profileName = user?.displayName || user?.name || 'Trader';
  const { results, loading, error: searchError } = useTickerSearch(headerSearchQuery);

  const submitTickerSearch = () => {
    const normalized = normalizeStockSymbol(headerSearchQuery);
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
    setHeaderSearchQuery(item.symbol);
    navigateToStockDetail(navigation, item.symbol);
  };

  return (
    <View style={styles.safeArea} {...swipeHandlers}>
      <GradientBackground>
        <HomeHeader
          themeColors={themeColors}
          profileName={profileName}
          searchQuery={headerSearchQuery}
          onChangeSearchQuery={setHeaderSearchQuery}
          searchResults={results}
          searchLoading={loading}
          searchError={searchError}
          showSearchResults={Boolean(headerSearchQuery.trim())}
          onPressSearchResult={selectTickerSearchResult}
          onSubmitSearch={submitTickerSearch}
          onPressProfile={() => navigation.navigate('Profile')}
          onPressGlobalIndices={() => navigation.navigate('GlobalIndices')}
          headerMetaText="Calculators"
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.cardGrid}>
            {CALCULATOR_SECTIONS.map((section) => {
              const meta = CATEGORY_META[section.key] || CATEGORY_META.trading;
              const CardIcon = meta.icon;
              const cardBg = isLight ? meta.tintLight : themeColors.surfaceAlt;
              const cardBorder = isLight ? `${meta.accent}4D` : themeColors.border;
              const railBg = isLight ? `${meta.accent}1A` : themeColors.surfaceGlass;
              const railBorder = isLight ? `${meta.accent}8A` : themeColors.border;

              return (
                <Pressable
                  key={section.key}
                  style={[styles.categoryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  onPress={() => navigation.navigate('CalculatorCategoryList', { categoryKey: section.key })}
                >
                  <View style={styles.categoryHead}>
                    <View style={[styles.categoryIconWrap, { borderColor: meta.accent }]}>
                      <CardIcon size={16} color={meta.accent} />
                    </View>
                    <ChevronRight size={14} color={meta.accent} />
                  </View>

                  <View style={styles.categoryBody}>
                    <View style={styles.categoryMain}>
                      <AppText style={styles.categoryTitle}>{section.title}</AppText>
                      <AppText style={styles.categorySubtitle}>{section.subtitle}</AppText>                      <View style={styles.countRow}>
                        <View style={[styles.countPill, { borderColor: meta.accent }]}>
                          <Calculator size={11} color={meta.accent} />
                          <AppText style={[styles.countText, { color: meta.accent }]}>{`${section.items.length} tools`}</AppText>
                        </View>
                        <View style={[styles.countPillGhost, { borderColor: meta.accent }]}>
                          <AppText style={[styles.countGhostText, { color: meta.accent }]}>Ready</AppText>
                        </View>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.rightRail,
                        {
                          borderColor: railBorder,
                          backgroundColor: railBg,
                        },
                      ]}
                    >
                      <View style={styles.railStat}>
                        <AppText style={[styles.railValue, { color: meta.accent }]}>{section.items.length}</AppText>
                        <AppText style={styles.railLabel}>Tools</AppText>
                      </View>
                      <View style={styles.railIcons}>
                        {section.items.slice(0, 3).map((item) => (
                          <View key={item.id} style={[styles.railIconBubble, { borderColor: meta.accent }]}>
                            <Calculator size={10} color={meta.accent} />
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <CalculatorCTAContact />
        </ScrollView>

        <BottomTabs activeRoute="Calculators" navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, compact, isLight) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 10,
      paddingTop: 12,
      paddingBottom: 130,
      gap: compact ? 8 : 10,
    },
    cardGrid: {
      gap: 10,
    },
    categoryCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: compact ? 10 : 12,
      gap: compact ? 6 : 8,
    },
    categoryHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: colors.border,
      backgroundColor: isLight ? 'rgba(255,255,255,0.65)' : colors.surfaceAlt,
    },
    categoryBody: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'stretch',
    },
    categoryMain: {
      flex: 1,
      gap: compact ? 6 : 8,
    },
    categoryTitle: {
      color: colors.textPrimary,
      fontSize: compact ? 18 : 20,
      fontFamily: FONT.semiBold,
    },
    categorySubtitle: {
      color: colors.textMuted,
      fontSize: compact ? 11 : 12,
      lineHeight: compact ? 15 : 17,
    },
    countPill: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : colors.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    countText: {
      fontSize: compact ? 10 : 11,
      fontFamily: FONT.semiBold,
    },
    countRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    countPillGhost: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 9,
      paddingVertical: 4,
      backgroundColor: isLight ? 'rgba(255,255,255,0.38)' : colors.surfaceGlass,
    },
    countGhostText: {
      fontSize: compact ? 10 : 11,
      fontFamily: FONT.medium,
    },
    rightRail: {
      width: compact ? 60 : 68,
      borderRadius: 10,
      borderWidth: 1,
      backgroundColor: isLight ? 'rgba(255,255,255,0.45)' : colors.surfaceAlt,
      paddingVertical: 7,
      paddingHorizontal: 6,
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 6,
    },
    railStat: {
      alignItems: 'center',
      gap: 1,
    },
    railValue: {
      fontSize: compact ? 16 : 18,
      lineHeight: compact ? 18 : 20,
      fontFamily: FONT.semiBold,
    },
    railLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: FONT.medium,
    },
    railIcons: {
      flexDirection: 'row',
      gap: 4,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    railIconBubble: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default Calculators;








