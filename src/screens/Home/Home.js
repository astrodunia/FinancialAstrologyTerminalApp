import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import HomeHeader from '../../components/HomeHeader';
import LiveIndicesTicker from '../../components/LiveIndicesTicker';
import { useUser } from '../../store/UserContext';
import { navigateToStockDetail } from '../../features/stocks/navigation';

const STOCK_ROWS = [
  { symbol: 'NVDA', name: 'NVIDIA', price: 1193.4, pct: 3.2 },
  { symbol: 'MSFT', name: 'Microsoft', price: 428.3, pct: 1.1 },
  { symbol: 'AAPL', name: 'Apple', price: 214.8, pct: 0.7 },
  { symbol: 'AMZN', name: 'Amazon', price: 196.6, pct: -0.8 },
  { symbol: 'META', name: 'Meta', price: 549.2, pct: 1.9 },
  { symbol: 'AVGO', name: 'Broadcom', price: 1819.1, pct: 2.4 },
  { symbol: 'GOOGL', name: 'Alphabet A', price: 176.5, pct: 0.9 },
  { symbol: 'TSLA', name: 'Tesla', price: 244.7, pct: -1.6 },
  { symbol: 'GOOG', name: 'Alphabet C', price: 178.2, pct: 0.8 },
  { symbol: 'JPM', name: 'JPMorgan', price: 206.5, pct: 0.4 },
  { symbol: 'WMT', name: 'Walmart', price: 72.3, pct: 0.3 },
  { symbol: 'ORCL', name: 'Oracle', price: 141.6, pct: 1.6 },
  { symbol: 'V', name: 'Visa', price: 282.9, pct: 0.5 },
  { symbol: 'LLY', name: 'Eli Lilly', price: 892.7, pct: -0.2 },
  { symbol: 'NFLX', name: 'Netflix', price: 694.5, pct: 2.1 },
  { symbol: 'MA', name: 'Mastercard', price: 483.4, pct: 0.6 },
  { symbol: 'XOM', name: 'Exxon Mobil', price: 116.1, pct: -0.9 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 152.7, pct: -0.3 },
  { symbol: 'PLTR', name: 'Palantir', price: 31.4, pct: 4.2 },
  { symbol: 'COST', name: 'Costco', price: 834.9, pct: 0.7 },
];

const NEWS_ROWS = [
  {
    id: 'news-1',
    title: 'AI mega-caps lift Wall Street as chip demand accelerates',
    time: '3m ago',
    source: 'Market Wire',
    image:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'news-2',
    title: 'Treasury yields ease as inflation expectations cool',
    time: '12m ago',
    source: 'Macro Desk',
    image:
      'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'news-3',
    title: 'Crude slips after inventory build surprises energy traders',
    time: '21m ago',
    source: 'Commodities Now',
    image:
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'news-4',
    title: 'US banks steady while fintech names extend weekly gains',
    time: '35m ago',
    source: 'Street Pulse',
    image:
      'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80',
  },
];

const Home = ({ navigation }) => {
  const { themeColors, user } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [searchQuery, setSearchQuery] = useState('');

  const profileName = user?.displayName || user?.name || 'Trader';

  const visibleStocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return STOCK_ROWS;
    return STOCK_ROWS.filter(
      (item) => item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
    );
  }, [searchQuery]);

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
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Market indices</AppText>
            <Pressable onPress={() => navigation.navigate('GlobalIndices')}>
              <AppText style={styles.sectionLink}>View all</AppText>
            </Pressable>
          </View>

          <LiveIndicesTicker />

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Top 20 stocks</AppText>
            <AppText style={styles.sectionLink}>{visibleStocks.length} symbols</AppText>
          </View>

          <View style={styles.stocksCard}>
            <View style={styles.stockHeadRow}>
              <AppText style={styles.stockHeadTextLeft}>Symbol</AppText>
              <View style={styles.stockHeadRight}>
                <AppText style={styles.stockHeadText}>Price</AppText>
                <AppText style={styles.stockHeadText}>Change</AppText>
              </View>
            </View>

            {visibleStocks.map((item, idx) => {
              const up = item.pct >= 0;
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
                    <AppText style={styles.priceText}>${item.price.toFixed(2)}</AppText>
                    <View style={[styles.changePill, up ? styles.changePillUp : styles.changePillDown]}>
                      {up ? (
                        <ArrowUpRight size={12} color={themeColors.positive} />
                      ) : (
                        <ArrowDownRight size={12} color={themeColors.negative} />
                      )}
                      <AppText style={[styles.changeText, { color: up ? themeColors.positive : themeColors.negative }]}>
                        {up ? '+' : ''}
                        {item.pct.toFixed(2)}%
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Market news</AppText>
            <AppText style={styles.sectionLink}>With images</AppText>
          </View>

          <View style={styles.newsGrid}>
            {NEWS_ROWS.map((item) => (
              <Pressable key={item.id} style={styles.newsCard} onPress={() => navigation.navigate('GlobalIndices')}>
                <Image source={{ uri: item.image }} style={styles.newsImage} resizeMode="cover" />
                <View style={styles.newsOverlay} />
                <View style={styles.newsMetaRow}>
                  <AppText style={styles.newsSource}>{item.source}</AppText>
                  <AppText style={styles.newsMeta}>{item.time}</AppText>
                </View>
                <AppText numberOfLines={2} style={styles.newsTitle}>
                  {item.title}
                </AppText>
              </Pressable>
            ))}
          </View>
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
      paddingTop: 2,
      paddingBottom: 110,
      gap: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
    },
    sectionLink: {
      color: colors.textMuted,
      fontSize: 12,
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
      width: 50,
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
      width: 72,
      textAlign: 'right',
    },
    changePill: {
      minWidth: 74,
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
    newsGrid: {
      gap: 12,
    },
    newsCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      overflow: 'hidden',
      position: 'relative',
      minHeight: 168,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    newsImage: {
      width: '100%',
      height: 168,
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
    },
    newsSource: {
      fontSize: 10,
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
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
      right: 10,
      bottom: 10,
      color: '#FFFFFF',
      fontSize: 13,
      lineHeight: 18,
    },
  });

export default Home;
