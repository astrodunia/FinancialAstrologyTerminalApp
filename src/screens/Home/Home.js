import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  Bell,
  Globe,
  Newspaper,
  Search,
  UserCircle,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import LiveIndicesTicker from '../../components/LiveIndicesTicker';
import { useUser } from '../../store/UserContext';

const getUsMarketStatus = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const valueOf = (type) => parts.find((part) => part.type === type)?.value || '';
  const weekday = valueOf('weekday');
  const hour = Number(valueOf('hour') || 0);
  const minute = Number(valueOf('minute') || 0);
  const totalMinutes = hour * 60 + minute;
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  let session = 'Closed';
  let tone = 'closed';

  if (!isWeekend) {
    if (totalMinutes >= 240 && totalMinutes < 570) {
      session = 'Pre-market';
      tone = 'premarket';
    } else if (totalMinutes >= 570 && totalMinutes < 960) {
      session = 'Open';
      tone = 'open';
    } else if (totalMinutes >= 960 && totalMinutes < 1200) {
      session = 'After-hours';
      tone = 'afterhours';
    }
  }

  const dayLabel = `${weekday}, ${valueOf('month')} ${valueOf('day')}`;
  const timeLabel = now.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    dateTimeLabel: `${dayLabel} • ${timeLabel} ET`,
    session,
    tone,
  };
};

const getGreeting = () => {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      hour12: false,
    }).format(new Date()),
  );

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const Home = ({ navigation }) => {
  const { themeColors, user } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [filter, setFilter] = useState('Stocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [marketStatus, setMarketStatus] = useState(() => getUsMarketStatus());

  const profileName = user?.displayName || user?.name || 'Trader';
  const initials = (profileName || 'T')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((v) => v[0]?.toUpperCase() || '')
    .join('');

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getUsMarketStatus());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.headerWrap}>
          <View style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <Pressable
                style={styles.headerIdentity}
                onPress={() => navigation.navigate('Profile')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.avatarHalo}>
                  <View style={styles.avatar}>
                    <AppText style={styles.avatarInitials}>{initials || 'T'}</AppText>
                  </View>
                </View>

                <View style={styles.headerTextWrap}>
                  <AppText style={styles.greeting}>{getGreeting()}</AppText>
                  <AppText numberOfLines={1} style={styles.userName}>
                    {profileName}
                  </AppText>
                  <AppText numberOfLines={1} style={styles.subLine}>
                    {marketStatus.dateTimeLabel}
                  </AppText>
                </View>
              </Pressable>

              <View style={styles.headerActions}>
                <Pressable style={styles.iconButton}>
                  <Bell size={18} color={themeColors.textPrimary} />
                </Pressable>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('Profile')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <UserCircle size={18} color={themeColors.textPrimary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.headerBottomRow}>
              <View
                style={[
                  styles.livePill,
                  marketStatus.tone === 'open' && styles.livePillOpen,
                  marketStatus.tone === 'premarket' && styles.livePillPre,
                  marketStatus.tone === 'afterhours' && styles.livePillAfter,
                ]}
              >
                <View
                  style={[
                    styles.liveDot,
                    marketStatus.tone === 'open' && styles.liveDotOpen,
                    marketStatus.tone === 'premarket' && styles.liveDotPre,
                    marketStatus.tone === 'afterhours' && styles.liveDotAfter,
                    marketStatus.tone === 'closed' && styles.liveDotClosed,
                  ]}
                />
                <AppText numberOfLines={1} style={styles.livePillText}>
                  US Market: {marketStatus.session}
                </AppText>
              </View>

              <Pressable
                style={styles.marketInfoButton}
                onPress={() => navigation.navigate('GlobalIndices')}
              >
                <Globe size={15} color={themeColors.textPrimary} />
                <AppText style={styles.marketInfoText}>Global Indices</AppText>
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.searchBar}>
            <Search size={18} color={themeColors.textMuted} />
            <AppTextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search markets, stocks, crypto"
              placeholderTextColor={themeColors.textMuted}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Market indices</AppText>
            <Pressable onPress={() => navigation.navigate('GlobalIndices')}>
              <AppText style={styles.sectionLink}>View all</AppText>
            </Pressable>
          </View>

          <LiveIndicesTicker />

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Top movers</AppText>
            <View style={styles.filterRow}>
              {['Stocks', 'ETFs', 'Crypto'].map((item) => {
                const active = filter === item;
                return (
                  <Pressable
                    key={item}
                    style={active ? styles.filterChipActive : styles.filterChip}
                    onPress={() => setFilter(item)}
                  >
                    <AppText style={active ? styles.filterTextActive : styles.filterText}>{item}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.listCard}>
            {[
              { label: 'NVDA', name: 'NVIDIA', change: '+3.2%' },
              { label: 'AAPL', name: 'Apple', change: '+1.4%' },
              { label: 'TSLA', name: 'Tesla', change: '+1.1%' },
            ].map((item, idx) => (
              <View key={item.label} style={[styles.listRow, idx === 2 && styles.listRowLast]}>
                <View>
                  <AppText style={styles.ticker}>{item.label}</AppText>
                  <AppText style={styles.company}>{item.name}</AppText>
                </View>
                <AppText style={[styles.change, { color: themeColors.positive }]}>{item.change}</AppText>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Top losers</AppText>
            <View style={styles.filterRow}>
              {['Stocks', 'ETFs', 'Crypto'].map((item) => {
                const active = filter === item;
                return (
                  <Pressable
                    key={`losers-${item}`}
                    style={active ? styles.filterChipActive : styles.filterChip}
                    onPress={() => setFilter(item)}
                  >
                    <AppText style={active ? styles.filterTextActive : styles.filterText}>{item}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.listCard}>
            {[
              { label: 'META', name: 'Meta', change: '-2.1%' },
              { label: 'AMZN', name: 'Amazon', change: '-1.3%' },
              { label: 'NFLX', name: 'Netflix', change: '-0.9%' },
            ].map((item, idx) => (
              <View key={item.label} style={[styles.listRow, idx === 2 && styles.listRowLast]}>
                <View>
                  <AppText style={styles.ticker}>{item.label}</AppText>
                  <AppText style={styles.company}>{item.name}</AppText>
                </View>
                <AppText style={[styles.change, { color: themeColors.negative }]}>{item.change}</AppText>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Market news</AppText>
            <AppText style={styles.sectionLink}>View all</AppText>
          </View>

          <View style={styles.newsCard}>
            {[
              { title: 'S&P 500 edges higher amid tech rally', time: '2m ago' },
              { title: 'Oil dips on inventory surprise', time: '14m ago' },
              { title: 'Gold steady as yields cool', time: '28m ago' },
            ].map((item, idx) => (
              <View key={item.title} style={[styles.newsRow, idx === 2 && styles.listRowLast]}>
                <View style={styles.newsIcon}>
                  <Newspaper size={14} color={themeColors.textPrimary} />
                </View>
                <View style={styles.newsContent}>
                  <AppText style={styles.newsTitle}>{item.title}</AppText>
                  <AppText style={styles.newsMeta}>{item.time}</AppText>
                </View>
              </View>
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
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerWrap: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 50,
      paddingBottom: 8,
    },
    headerCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    headerTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    headerIdentity: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      gap: 10,
    },
    headerTextWrap: {
      flex: 1,
      minWidth: 0,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatarHalo: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    greeting: {
      color: colors.textMuted,
      fontSize: 11,
    },
    userName: {
      color: colors.textPrimary,
      fontSize: 20,
    },
    subLine: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 1,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 6,
      flexShrink: 1,
    },
    livePillOpen: {
      backgroundColor: 'rgba(73, 209, 141, 0.14)',
      borderColor: 'rgba(73, 209, 141, 0.45)',
    },
    livePillPre: {
      backgroundColor: 'rgba(255, 196, 94, 0.14)',
      borderColor: 'rgba(255, 196, 94, 0.45)',
    },
    livePillAfter: {
      backgroundColor: 'rgba(161, 161, 255, 0.14)',
      borderColor: 'rgba(161, 161, 255, 0.45)',
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.textMuted,
    },
    liveDotOpen: {
      backgroundColor: colors.positive,
    },
    liveDotPre: {
      backgroundColor: '#FFC45E',
    },
    liveDotAfter: {
      backgroundColor: '#A1A1FF',
    },
    liveDotClosed: {
      backgroundColor: colors.textMuted,
    },
    livePillText: {
      color: colors.textMuted,
      fontSize: 11,
    },
    marketInfoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    marketInfoText: {
      color: colors.textPrimary,
      fontSize: 11,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 2,
      paddingBottom: 110,
      gap: 16,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      paddingVertical: 0,
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
    filterRow: {
      flexDirection: 'row',
      gap: 8,
    },
    filterChip: {
      backgroundColor: colors.surfaceAlt,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.textPrimary,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 999,
    },
    filterText: {
      fontSize: 11,
      color: colors.textMuted,
    },
    filterTextActive: {
      fontSize: 11,
      color: colors.background,
    },
    listCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 16,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
    listRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    listRowLast: {
      borderBottomWidth: 0,
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
    change: {
      fontSize: 12,
    },
    newsCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 16,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
    newsRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    newsIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newsContent: {
      flex: 1,
    },
    newsTitle: {
      color: colors.textPrimary,
      fontSize: 12,
    },
    newsMeta: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 2,
    },
  });

export default Home;
