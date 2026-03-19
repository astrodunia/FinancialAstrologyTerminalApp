import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ArrowLeft,
  Crown,
  BarChart3,
  Layers3,
  Sprout,
  ChevronRight,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { SECTORS } from '../../data/sectors/sectorConfig';

const marketCaps = [
  {
    key: 'mega',
    title: 'Mega Cap',
    subtitle: '~$200B+',
    icon: Crown,
    color: '#EAB308',
  },
  {
    key: 'large',
    title: 'Large Cap',
    subtitle: '~$10B–$200B',
    icon: BarChart3,
    color: '#5B7CFA',
  },
  {
    key: 'mid',
    title: 'Mid Cap',
    subtitle: '~$2B–$10B',
    icon: Layers3,
    color: '#28C7A1',
  },
  {
    key: 'small',
    title: 'Small Cap',
    subtitle: '~<$2B',
    icon: Sprout,
    color: '#7C8596',
  },
];

const goBackOrFallback = (navigation, fallbackScreen) => {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  navigation.navigate(fallbackScreen);
};

const SectorHubScreen = ({ navigation }) => {
  const styles = createStyles();

  const openSector = (sector) => {
    navigation.navigate('SectorDetail', {
      slug: sector.slug,
    });
  };

  const openMarketCap = (cap) => {
    navigation.navigate('MarketCapDetail', {
      marketCap: cap.key,
      title: cap.title,
    });
  };

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.screen}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                style={styles.backButton}
                hitSlop={10}
                onPress={() => goBackOrFallback(navigation, 'Home')}
              >
                <ArrowLeft size={18} color="#344054" />
              </Pressable>
              <View>
                <AppText style={styles.headerTitle}>Sectors</AppText>
                <AppText style={styles.headerSub}>
                  Tap a sector to view tickers, charts, and insights.
                </AppText>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Sectors</AppText>
              <AppText style={styles.sectionSub}>
                Browse all sector dashboards in a mobile-friendly view.
              </AppText>

              <View style={styles.grid}>
                {SECTORS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Pressable
                      key={item.slug}
                      style={styles.card}
                      onPress={() => openSector(item)}
                    >
                      <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                        <Icon size={18} color="#FFFFFF" />
                      </View>

                      <View style={styles.cardBody}>
                        <AppText style={styles.cardTitle}>{item.name}</AppText>
                        <AppText style={styles.cardSub}>{item.subtitle}</AppText>
                      </View>

                      <View style={styles.arrowWrap}>
                        <ChevronRight size={16} color="#98A2B3" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Market Cap</AppText>
              <AppText style={styles.sectionSub}>
                Jump to universes by size: mega, large, mid, or small cap.
              </AppText>

              <View style={styles.marketCapGrid}>
                {marketCaps.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Pressable
                      key={item.key}
                      style={styles.capCard}
                      onPress={() => openMarketCap(item)}
                    >
                      <View style={[styles.capIconWrap, { backgroundColor: item.color }]}>
                        <Icon size={16} color="#FFFFFF" />
                      </View>

                      <AppText style={styles.capTitle}>{item.title}</AppText>
                      <AppText style={styles.capSub}>{item.subtitle}</AppText>

                      <View style={styles.capArrow}>
                        <ChevronRight size={14} color="#98A2B3" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <BottomTabs activeRoute="Sectors" navigation={navigation} />
        </View>
      </GradientBackground>
    </View>
  );
};

const createStyles = () =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },

    screen: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },

    header: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#EAECF0',
      backgroundColor: '#F8FAFC',
    },

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    backButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#EAECF0',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      marginTop: 2,
    },

    headerTitle: {
      fontSize: 22,
      color: '#1D2939',
      fontWeight: '800',
      marginBottom: 2,
    },

    headerSub: {
      fontSize: 13,
      color: '#667085',
      lineHeight: 20,
      maxWidth: 290,
    },

    content: {
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 120,
    },

    section: {
      marginBottom: 26,
    },

    sectionTitle: {
      fontSize: 18,
      color: '#1D2939',
      fontWeight: '800',
      marginBottom: 4,
    },

    sectionSub: {
      fontSize: 13,
      color: '#667085',
      lineHeight: 20,
      marginBottom: 14,
    },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },

    card: {
      width: '48.2%',
      minHeight: 144,
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#EEF2F6',
      padding: 14,
      marginBottom: 12,
      justifyContent: 'space-between',
    },

    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },

    cardBody: {
      flex: 1,
    },

    cardTitle: {
      fontSize: 15,
      color: '#101828',
      fontWeight: '700',
      marginBottom: 4,
    },

    cardSub: {
      fontSize: 12,
      color: '#667085',
      lineHeight: 18,
    },

    arrowWrap: {
      alignSelf: 'flex-end',
      marginTop: 10,
    },

    marketCapGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },

    capCard: {
      width: '48.2%',
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#EEF2F6',
      padding: 14,
      marginBottom: 12,
      minHeight: 118,
    },

    capIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },

    capTitle: {
      fontSize: 15,
      color: '#101828',
      fontWeight: '700',
      marginBottom: 4,
    },

    capSub: {
      fontSize: 12,
      color: '#667085',
      lineHeight: 18,
    },

    capArrow: {
      alignSelf: 'flex-end',
      marginTop: 8,
    },
  });

export default SectorHubScreen;
