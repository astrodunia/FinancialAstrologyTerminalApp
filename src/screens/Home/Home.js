import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Newspaper,
  Search,
  UserCircle,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';

const COLORS = {
  background: '#0B0B0C',
  surface: '#111114',
  surfaceAlt: '#1A1B20',
  surfaceGlass: 'rgba(16, 20, 30, 0.62)',
  textPrimary: '#FFFFFF',
  textMuted: '#B7BDC8',
  border: 'rgba(255, 255, 255, 0.08)',
  accent: '#FFFFFF',
  positive: '#49D18D',
  negative: '#F08C8C',
  chip: '#1F2430',
};

const Home = ({ navigation }) => {
  const [filter, setFilter] = useState('Stocks');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <UserCircle size={26} color={COLORS.textPrimary} />
            </View>
            <View>
              <AppText style={styles.greeting}>Good morning</AppText>
              <AppText style={styles.userName}>Aarav Sharma</AppText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.iconButton}
              onPress={() => navigation.navigate('GlobalIndices')}
            >
              <UserCircle size={18} color={COLORS.textPrimary} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.textMuted} />
            <AppTextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search markets, stocks, crypto"
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
            />
          </View>
          <View style={styles.profileCard}>
            <View>
              <AppText style={styles.profileTitle}>Your Profile</AppText>
              <AppText style={styles.profileSubtitle}>Taurus • Mumbai • 120 credits</AppText>
            </View>
            <Pressable
              style={styles.globeButton}
              onPress={() => navigation.navigate('GlobalIndices')}
            >
              <Globe size={18} color={COLORS.textPrimary} />
              <AppText style={styles.globeText}>Global Indices</AppText>
            </Pressable>
          </View>

        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle}>Market indices</AppText>
          <AppText style={styles.sectionLink}>View all</AppText>
        </View>
        <View style={styles.cardRow}>
          {[
            { label: 'S&P 500', value: '5,180.22', change: '+0.64%' },
            { label: 'NASDAQ', value: '16,104.18', change: '+0.42%' },
            { label: 'DOW J', value: '38,564.90', change: '-0.18%' },
          ].map((item) => {
            const positive = item.change.startsWith('+');
            return (
              <View key={item.label} style={styles.marketCard}>
                <AppText style={styles.marketLabel}>{item.label}</AppText>
                <AppText style={styles.marketValue}>{item.value}</AppText>
                <View style={styles.marketChangeRow}>
                  {positive ? (
                    <ArrowUpRight size={14} color={COLORS.positive} />
                  ) : (
                    <ArrowDownRight size={14} color={COLORS.negative} />
                  )}
                  <AppText
                    style={[
                      styles.marketChange,
                      { color: positive ? COLORS.positive : COLORS.negative },
                    ]}
                  >
                    {item.change}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>

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
                    <AppText style={active ? styles.filterTextActive : styles.filterText}>
                      {item}
                    </AppText>
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
              <AppText style={[styles.change, { color: COLORS.positive }]}>
                {item.change}
              </AppText>
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
                    <AppText style={active ? styles.filterTextActive : styles.filterText}>
                      {item}
                    </AppText>
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
              <AppText style={[styles.change, { color: COLORS.negative }]}>
                {item.change}
              </AppText>
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
                  <Newspaper size={14} color={COLORS.textPrimary} />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  greeting: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  profileCard: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  profileSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  globeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  globeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  sectionLink: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  marketCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  marketLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  marketValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  marketChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  marketChange: {
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.textPrimary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  filterText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  filterTextActive: {
    fontSize: 11,
    color: '#0B0B0C',
  },
  listCard: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  ticker: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  company: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  change: {
    fontSize: 12,
  },
  newsCard: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  newsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  newsIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  newsMeta: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});

export default Home;
