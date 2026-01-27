import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Globe, UserCircle } from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';

const COLORS = {
  background: '#0B0B0C',
  surfaceAlt: '#1A1B20',
  surfaceGlass: 'rgba(16, 20, 30, 0.62)',
  textPrimary: '#FFFFFF',
  textMuted: '#B7BDC8',
  border: 'rgba(255, 255, 255, 0.08)',
  positive: '#49D18D',
  negative: '#F08C8C',
};

const GlobalIndices = ({ navigation }) => {
  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              <Globe size={16} color={COLORS.textPrimary} />
            </View>
            <AppText style={styles.title}>Global Indices</AppText>
          </View>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <UserCircle size={18} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {[
            { label: 'Nikkei 225', value: '36,420.20', change: '+0.38%' },
            { label: 'FTSE 100', value: '7,694.30', change: '-0.22%' },
            { label: 'DAX', value: '17,650.80', change: '+0.19%' },
          ].map((item) => {
            const positive = item.change.startsWith('+');
            return (
              <View key={item.label} style={styles.card}>
                <View style={styles.row}>
                  <AppText style={styles.rowLabel}>{item.label}</AppText>
                  <AppText style={styles.rowValue}>{item.value}</AppText>
                </View>
                <AppText
                  style={[styles.change, { color: positive ? COLORS.positive : COLORS.negative }]}
                >
                  {item.change}
                </AppText>
              </View>
            );
          })}
        </ScrollView>

        <BottomTabs navigation={navigation} />
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
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
  },
  rowValue: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  change: {
    fontSize: 12,
  },
});

export default GlobalIndices;
