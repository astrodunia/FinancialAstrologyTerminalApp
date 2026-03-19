import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import AppText from '../../components/AppText';
import GradientBackground from '../../components/GradientBackground';
import BottomTabs from '../../components/BottomTabs';
import { SECTORS } from '../../data/sectors/sectorConfig';

const SectorsScreen = ({ navigation }) => {
  const openSector = (sector) => {
    navigation.navigate('SectorDetail', {
      slug: sector.slug,
      title: sector.name,
    });
  };

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <AppText style={styles.title}>Sectors</AppText>
              <AppText style={styles.subtitle}>
                Tap a sector to view tickers, charts, and insights.
              </AppText>
            </View>

            <View style={styles.grid}>
              {SECTORS.map((sector) => {
                const Icon = sector.icon;

                return (
                  <Pressable
                    key={sector.slug}
                    style={styles.card}
                    onPress={() => openSector(sector)}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: sector.color }]}>
                      <Icon size={18} color="#FFFFFF" />
                    </View>

                    <View style={styles.cardBody}>
                      <AppText style={styles.cardTitle}>{sector.name}</AppText>
                      <AppText style={styles.cardSubtitle}>{sector.subtitle}</AppText>
                    </View>

                    <ChevronRight size={16} color="#98A2B3" />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <BottomTabs activeRoute="Sectors" navigation={navigation} />
        </View>
      </GradientBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  header: { marginBottom: 18 },
  title: { fontSize: 24, fontWeight: '800', color: '#101828', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#667085' },
  grid: { gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#101828', marginBottom: 2 },
  cardSubtitle: { fontSize: 12, color: '#667085' },
});

export default SectorsScreen;