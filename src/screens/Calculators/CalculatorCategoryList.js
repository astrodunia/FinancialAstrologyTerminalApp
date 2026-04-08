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
import { getCalculatorSection } from './catalog';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const CATEGORY_ICON_MAP = {
  trading: TrendingUp,
  investing: Wallet,
  'personal-finance': Calculator,
  astrology: Sparkles,
};

const CalculatorCategoryList = ({ navigation, route }) => {
  const { themeColors, user } = useUser();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const styles = useMemo(() => createStyles(themeColors, compact), [themeColors, compact]);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  const categoryKey = route?.params?.categoryKey;
  const section = getCalculatorSection(categoryKey);
  const SectionIcon = CATEGORY_ICON_MAP[section?.key] || Calculator;
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

  const visibleItems = section?.items || [];

  return (
    <View style={styles.safeArea}>
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
        />

        <View style={styles.categoryHeadCard}>
          <View style={styles.titleRow}>
            <SectionIcon size={16} color={themeColors.textPrimary} />
            <AppText style={styles.title}>{section?.title || 'Category Not Found'}</AppText>
          </View>
          <AppText style={styles.subtitle}>{`${visibleItems.length} calculators`}</AppText>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {section ? (
            visibleItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.calculatorCard}
                onPress={() => navigation.navigate('CalculatorTool', { calculator: item })}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.cardIcon}>
                    <Calculator size={13} color={themeColors.textMuted} />
                  </View>
                  <View style={styles.cardTextWrap}>
                    <AppText style={styles.cardTitle}>{item.title}</AppText>
                    <AppText style={styles.cardDesc}>{item.description}</AppText>
                  </View>
                </View>
                <ChevronRight size={14} color={themeColors.textMuted} />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <AppText style={styles.emptyTitle}>Category Not Found</AppText>
            </View>
          )}

          {section && !visibleItems.length && (
            <View style={styles.emptyCard}>
              <AppText style={styles.emptyTitle}>No calculators found</AppText>
            </View>
          )}

          <CalculatorCTAContact />
        </ScrollView>

        <BottomTabs activeRoute="Calculators" navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, compact) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    categoryHeadCard: {
      marginHorizontal: 12,
      marginTop: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: compact ? 8 : 10,
      gap: 6,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      color: colors.textPrimary,
      fontSize: compact ? 16 : 18,
      fontFamily: FONT.semiBold,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: compact ? 11 : 12,
    },
    content: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 120,
      gap: compact ? 7 : 8,
    },
    calculatorCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: compact ? 9 : 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardLeft: {
      flex: 1,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    cardIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    cardTextWrap: {
      flex: 1,
      gap: 2,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: compact ? 13 : 14,
      fontFamily: FONT.semiBold,
    },
    cardDesc: {
      color: colors.textMuted,
      fontSize: compact ? 11 : 12,
      lineHeight: compact ? 15 : 16,
    },
    emptyCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 16,
      gap: 5,
      alignItems: 'center',
      marginTop: 6,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: compact ? 15 : 17,
      fontFamily: FONT.semiBold,
    },
  });

export default CalculatorCategoryList;
