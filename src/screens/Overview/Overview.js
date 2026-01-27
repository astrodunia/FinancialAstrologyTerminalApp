import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { UserCircle } from 'lucide-react-native';
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
};

const Overview = ({ navigation }) => {
  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.header}>
          <AppText style={styles.title}>Overview</AppText>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <UserCircle size={18} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Daily pulse</AppText>
            {[
              { label: 'Market sentiment', value: 'Optimistic' },
              { label: 'Volatility', value: 'Low' },
              { label: 'Top theme', value: 'AI momentum' },
            ].map((item) => (
              <View key={item.label} style={styles.row}>
                <AppText style={styles.rowLabel}>{item.label}</AppText>
                <AppText style={styles.rowValue}>{item.value}</AppText>
              </View>
            ))}
          </View>
        </ScrollView>

        <BottomTabs activeRoute="Overview" navigation={navigation} />
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
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  rowValue: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});

export default Overview;
