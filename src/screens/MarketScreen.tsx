import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import GradientBackground from '../components/GradientBackground';
import HomeHeader from '../components/HomeHeader';
import MarketHeatmap from '../features/marketHeatmap/MarketHeatmap';
import { useHeatmapData } from '../features/marketHeatmap/useHeatmapData';
import { normalizeStockSymbol, navigateToStockDetail } from '../features/stocks/navigation';
import { useTickerSearch } from '../features/stocks/useTickerSearch';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../navigation/useHorizontalSwipe';
import { useUser } from '../store/UserContext';

export default function MarketScreen({ navigation }: any) {
  const { themeColors, user } = useUser() as any;
  const { data = [], isLoading, error, refetch } = useHeatmapData();
  const [searchQuery, setSearchQuery] = useState('');
  const profileName = user?.displayName || user?.name || 'Trader';
  const { results, loading, error: searchError } = useTickerSearch(searchQuery);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Overview', (route) => navigation.navigate(route));

  const submitTickerSearch = useCallback(() => {
    const normalized = normalizeStockSymbol(searchQuery);
    if (/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized)) {
      navigateToStockDetail(navigation, normalized);
      return;
    }

    if (results[0]?.symbol) {
      navigateToStockDetail(navigation, results[0].symbol);
    }
  }, [navigation, results, searchQuery]);

  const selectTickerSearchResult = useCallback(
    (item: { symbol?: string }) => {
      if (!item?.symbol) return;
      setSearchQuery(item.symbol);
      navigateToStockDetail(navigation, item.symbol);
    },
    [navigation],
  );

  return (
    <View style={styles.screen} {...swipeHandlers}>
      <GradientBackground>
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
        <ScrollView contentContainerStyle={styles.content}>
          <MarketHeatmap
            items={data}
            loading={isLoading}
            error={error instanceof Error ? error.message : ''}
            onRetry={refetch}
            onPressSymbol={(symbol) => navigateToStockDetail(navigation, symbol)}
          />
        </ScrollView>
      </GradientBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
