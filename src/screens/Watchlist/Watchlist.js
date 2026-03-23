import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { UserCircle } from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';
import { navigateToStockDetail } from '../../features/stocks/navigation';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';

const Watchlist = ({ navigation }) => {
  const { themeColors } = useUser();
  const styles = createStyles(themeColors);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Watchlist', (route) => navigation.navigate(route));

  return (
    <View style={styles.safeArea} {...swipeHandlers}>
      <GradientBackground>
        <View style={styles.header}>
          <AppText style={styles.title}>Watchlist</AppText>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <UserCircle size={18} color={themeColors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Pinned assets</AppText>
            {['AAPL', 'NVDA', 'TSLA'].map((item) => (
              <Pressable key={item} style={styles.row} onPress={() => navigateToStockDetail(navigation, item)}>
                <AppText style={styles.rowLabel}>{item}</AppText>
                <AppText style={styles.rowValue}>View details</AppText>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <BottomTabs activeRoute="Watchlist" navigation={navigation} />
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
    header: {
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 110,
      gap: 16,
    },
    card: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 15,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowLabel: {
      color: colors.textPrimary,
      fontSize: 13,
    },
    rowValue: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });

export default Watchlist;
