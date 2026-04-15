import React, { useMemo } from 'react';
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
import BackButtonHeader from '../../components/BackButtonHeader';
import GradientBackground from '../../components/GradientBackground';
import CalculatorCTAContact from '../../components/CalculatorCTAContact';
import { useUser } from '../../store/UserContext';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';
import { CALCULATOR_SECTIONS } from './catalog';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const CATEGORY_META = {
  trading: {
    icon: TrendingUp,
    tintLight: '#EEF7FF',
    accent: '#1A77D4',
    glow: 'rgba(26, 119, 212, 0.14)',
  },
  investing: {
    icon: Wallet,
    tintLight: '#EEF9F1',
    accent: '#2F9159',
    glow: 'rgba(47, 145, 89, 0.14)',
  },
  'personal-finance': {
    icon: Calculator,
    tintLight: '#FFF6E8',
    accent: '#BE7A1B',
    glow: 'rgba(190, 122, 27, 0.14)',
  },
  astrology: {
    icon: Sparkles,
    tintLight: '#F5EEFF',
    accent: '#7F4AC6',
    glow: 'rgba(127, 74, 198, 0.14)',
  },
};

const Calculators = ({ navigation }) => {
  const { theme, themeColors } = useUser();
  const { width } = useWindowDimensions();
  const isLight = theme === 'light';
  const compact = width < 380;
  const styles = useMemo(() => createStyles(themeColors, compact, isLight), [themeColors, compact, isLight]);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Calculators', (route) => navigation.navigate(route));

  return (
    <View style={styles.safeArea} {...swipeHandlers}>
      <GradientBackground>
        <BackButtonHeader colors={themeColors} onPress={() => navigation.goBack()} containerStyle={styles.header} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowPrimary} />
            <View style={styles.heroGlowSecondary} />
            <View style={styles.heroBadge}>
              <Calculator size={13} color={themeColors.accent} />
              <AppText style={styles.heroBadgeText}>Calculators</AppText>
            </View>
            <AppText style={styles.heroTitle}>Decision tools built for trading, investing, and everyday money workflows.</AppText>
            <AppText style={styles.heroSubtitle}>
              Open focused calculators for risk, position sizing, investing plans, and personal finance without leaving the terminal flow.
            </AppText>
          </View>

          <View style={styles.cardGrid}>
            {CALCULATOR_SECTIONS.map((section) => {
              const meta = CATEGORY_META[section.key] || CATEGORY_META.trading;
              const CardIcon = meta.icon;
              const cardBg = isLight ? meta.tintLight : themeColors.surfaceAlt;
              const cardBorder = isLight ? `${meta.accent}4D` : themeColors.border;
              const railBg = isLight ? `${meta.accent}1A` : themeColors.surfaceGlass;
              const railBorder = isLight ? `${meta.accent}8A` : themeColors.border;

              return (
                <Pressable
                  key={section.key}
                  style={[styles.categoryCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  onPress={() => navigation.navigate('CalculatorCategoryList', { categoryKey: section.key })}
                >
                  <View style={[styles.categoryGlow, { backgroundColor: meta.glow }]} />
                  <View style={styles.categoryHead}>
                    <View style={[styles.categoryIconWrap, { borderColor: meta.accent, backgroundColor: isLight ? '#FFFFFF' : themeColors.surfaceGlass }]}>
                      <CardIcon size={16} color={meta.accent} />
                    </View>
                    <View style={[styles.chevronWrap, { borderColor: meta.accent }]}>
                      <ChevronRight size={14} color={meta.accent} />
                    </View>
                  </View>

                  <View style={styles.categoryBody}>
                    <View style={styles.categoryMain}>
                      <AppText style={styles.categoryTitle}>{section.title}</AppText>
                      <AppText style={styles.categorySubtitle}>{section.subtitle}</AppText>
                      <View style={styles.countRow}>
                        <View style={[styles.countPill, { borderColor: meta.accent }]}>
                          <Calculator size={11} color={meta.accent} />
                          <AppText style={[styles.countText, { color: meta.accent }]}>{`${section.items.length} tools`}</AppText>
                        </View>
                        <View style={[styles.countPillGhost, { borderColor: meta.accent }]}>
                          <AppText style={[styles.countGhostText, { color: meta.accent }]}>Ready</AppText>
                        </View>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.rightRail,
                        {
                          borderColor: railBorder,
                          backgroundColor: railBg,
                        },
                      ]}
                    >
                      <View style={styles.railStat}>
                        <AppText style={[styles.railValue, { color: meta.accent }]}>{section.items.length}</AppText>
                        <AppText style={styles.railLabel}>Tools</AppText>
                      </View>
                      <View style={styles.railIcons}>
                        {section.items.slice(0, 3).map((item) => (
                          <View key={item.id} style={[styles.railIconBubble, { borderColor: meta.accent }]}>
                            <Calculator size={10} color={meta.accent} />
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <CalculatorCTAContact />
        </ScrollView>

        <BottomTabs activeRoute="Calculators" navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, compact, isLight) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      gap: 16,
    },
    content: {
      paddingHorizontal: 12,
      paddingTop: 0,
      paddingBottom: 130,
      gap: compact ? 10 : 12,
    },
    heroCard: {
      position: 'relative',
      overflow: 'hidden',
      marginTop: 40,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: compact ? 18 : 20,
      gap: 10,
    },
    heroGlowPrimary: {
      position: 'absolute',
      top: -34,
      right: -18,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.accent,
      opacity: 0.11,
    },
    heroGlowSecondary: {
      position: 'absolute',
      bottom: -44,
      left: -20,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: colors.positive,
      opacity: 0.08,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    heroBadgeText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: FONT.medium,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: compact ? 22 : 24,
      lineHeight: compact ? 30 : 32,
      fontFamily: FONT.extraBold,
    },
    heroSubtitle: {
      color: colors.textMuted,
      fontSize: compact ? 13 : 14,
      lineHeight: compact ? 20 : 21,
    },
    cardGrid: {
      gap: 10,
    },
    categoryCard: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: compact ? 14 : 16,
      gap: compact ? 10 : 12,
    },
    categoryGlow: {
      position: 'absolute',
      top: -24,
      right: -18,
      width: 110,
      height: 110,
      borderRadius: 55,
    },
    categoryHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: colors.border,
      backgroundColor: isLight ? 'rgba(255,255,255,0.65)' : colors.surfaceAlt,
    },
    chevronWrap: {
      width: 30,
      height: 30,
      borderRadius: 999,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isLight ? 'rgba(255,255,255,0.7)' : colors.surfaceGlass,
    },
    categoryBody: {
      flexDirection: compact ? 'column' : 'row',
      gap: 12,
      alignItems: compact ? 'flex-start' : 'stretch',
    },
    categoryMain: {
      flex: 1,
      gap: compact ? 8 : 10,
    },
    categoryTitle: {
      color: colors.textPrimary,
      fontSize: compact ? 20 : 22,
      lineHeight: compact ? 24 : 27,
      fontFamily: FONT.extraBold,
    },
    categorySubtitle: {
      color: colors.textMuted,
      fontSize: compact ? 12 : 13,
      lineHeight: compact ? 18 : 19,
    },
    countPill: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 5,
      backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : colors.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    countText: {
      fontSize: compact ? 10 : 11,
      fontFamily: FONT.semiBold,
    },
    countRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    countPillGhost: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: isLight ? 'rgba(255,255,255,0.38)' : colors.surfaceGlass,
    },
    countGhostText: {
      fontSize: compact ? 10 : 11,
      fontFamily: FONT.medium,
    },
    rightRail: {
      width: compact ? '100%' : 76,
      borderRadius: 18,
      borderWidth: 1,
      backgroundColor: isLight ? 'rgba(255,255,255,0.45)' : colors.surfaceAlt,
      paddingVertical: 10,
      paddingHorizontal: 7,
      justifyContent: compact ? 'flex-start' : 'space-between',
      alignItems: 'center',
      gap: 8,
      flexDirection: compact ? 'row' : 'column',
    },
    railStat: {
      alignItems: 'center',
      gap: 2,
    },
    railValue: {
      fontSize: compact ? 18 : 20,
      lineHeight: compact ? 20 : 22,
      fontFamily: FONT.extraBold,
    },
    railLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: FONT.medium,
    },
    railIcons: {
      flexDirection: 'row',
      gap: 4,
      flexWrap: 'wrap',
      justifyContent: 'center',
      flex: compact ? 1 : 0,
    },
    railIconBubble: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default Calculators;



