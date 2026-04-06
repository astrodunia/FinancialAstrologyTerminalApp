import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ArrowRight,
  Check,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react-native';
import AppDialog from '../../components/AppDialog';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import HomeHeader from '../../components/HomeHeader';
import { navigateToStockDetail, normalizeStockSymbol } from '../../features/stocks/navigation';
import { useTickerSearch } from '../../features/stocks/useTickerSearch';
import { useUser } from '../../store/UserContext';

const WEB_BASE_URL = 'https://finance.rajeevprakash.com';
const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const PLANS = [
  {
    id: 'basic',
    title: 'Basic',
    subtitle: 'Anyone exploring the terminal',
    price: '$0',
    family: 'basic',
    badge: 'Starter',
    description: 'A clean entry point for testing dashboards, layouts, and lightweight tracking.',
    bullets: ['Core dashboards', 'Snapshot data', 'Watchlist up to 20 symbols', '3 price alerts'],
  },
  {
    id: 'pro',
    title: 'Pro',
    subtitle: 'Individual traders',
    price: '$500 / month',
    family: 'pro',
    badge: 'Popular',
    description: 'Built for active market participants who need realtime data, overlays, and timing tools.',
    bullets: ['Realtime market data', 'Full calendars', 'Planetary overlays', '500 symbols and 50 alerts'],
  },
  {
    id: 'pro_insights',
    title: 'Pro + Insights',
    subtitle: 'Curated market windows',
    price: '$1,000 / month',
    family: 'pro',
    badge: 'Research',
    description: 'Adds curated windows and stronger context for traders who want higher-conviction timing.',
    bullets: ['Everything in Pro', 'Insights windows', 'Higher-conviction timing workflows', 'Priority research context'],
  },
  {
    id: 'pro_insights_consult',
    title: 'Pro + Insights + Consultation',
    subtitle: 'Curated windows plus weekly 1:1 time',
    price: '$2,000 / month',
    family: 'pro',
    badge: 'Advisor',
    description: 'For users who want direct analyst interaction in addition to data, overlays, and insights.',
    bullets: ['Everything in Pro + Insights', 'Weekly 1:1 consultation', 'Higher-touch guidance', 'Deeper workflow support'],
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    subtitle: 'Teams and desks',
    price: '$1,000 / user / month',
    family: 'enterprise',
    badge: 'Team',
    description: 'A desk-ready plan with seat controls, shared workflows, and broader operational support.',
    bullets: ['Everything in Pro', 'Seat management', 'Shared workflows', 'Account support'],
  },
  {
    id: 'enterprise_insights',
    title: 'Enterprise + Insights',
    subtitle: 'Firms with curated windows',
    price: '$2,000 / user / month',
    family: 'enterprise',
    badge: 'Desk Research',
    description: 'Adds guided timing context for firms that need shared workflows and curated windows together.',
    bullets: ['Everything in Enterprise', 'Insights windows', 'Team-ready research context', 'Broader workflow coverage'],
  },
  {
    id: 'enterprise_insights_consult',
    title: 'Enterprise + Insights + Consultation',
    subtitle: 'Firms that also want analyst time',
    price: '$3,000 / user / month',
    family: 'enterprise',
    badge: 'White Glove',
    description: 'The highest-touch package for firms that want platform depth plus weekly consultation.',
    bullets: ['Everything in Enterprise + Insights', 'Weekly 1:1 consultation', 'Higher-touch support', 'Advanced team workflow guidance'],
  },
];

const PLAN_GROUPS = [
  {
    key: 'basic',
    title: 'Start Simple',
    body: 'For new users who want the terminal structure without full trading depth yet.',
  },
  {
    key: 'pro',
    title: 'Trade With Precision',
    body: 'For active traders who want realtime data, overlays, curated windows, and optional consultation.',
  },
  {
    key: 'enterprise',
    title: 'Scale Across Teams',
    body: 'For desks and firms that need seat controls, shared workflows, and higher-touch support.',
  },
];

const FEATURES = [
  {
    label: 'Realtime market data',
    values: {
      basic: false,
      pro: true,
      pro_insights: true,
      pro_insights_consult: true,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Planetary overlays and alerts',
    values: {
      basic: false,
      pro: true,
      pro_insights: true,
      pro_insights_consult: true,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Watchlist capacity',
    values: {
      basic: '20',
      pro: '500',
      pro_insights: '500',
      pro_insights_consult: '500',
      enterprise: '2,000 / seat',
      enterprise_insights: '2,000 / seat',
      enterprise_insights_consult: '2,000 / seat',
    },
  },
  {
    label: 'Price and volume alerts',
    values: {
      basic: '3',
      pro: '50',
      pro_insights: '50',
      pro_insights_consult: '50',
      enterprise: '250 / seat',
      enterprise_insights: '250 / seat',
      enterprise_insights_consult: '250 / seat',
    },
  },
  {
    label: 'Curated insights windows',
    values: {
      basic: false,
      pro: false,
      pro_insights: true,
      pro_insights_consult: true,
      enterprise: false,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Weekly 1:1 consultation',
    values: {
      basic: false,
      pro: false,
      pro_insights: false,
      pro_insights_consult: true,
      enterprise: false,
      enterprise_insights: false,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Seat management and shared lists',
    values: {
      basic: false,
      pro: false,
      pro_insights: false,
      pro_insights_consult: false,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'API access and SSO',
    values: {
      basic: false,
      pro: false,
      pro_insights: false,
      pro_insights_consult: false,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Dedicated account manager',
    values: {
      basic: false,
      pro: false,
      pro_insights: false,
      pro_insights_consult: false,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
];

const FAMILY_META = {
  basic: {
    icon: Star,
    tint: '#94A3B8',
    panel: 'rgba(148, 163, 184, 0.14)',
    glow: 'rgba(148, 163, 184, 0.16)',
    accentSoft: 'rgba(148, 163, 184, 0.22)',
    sectionBg: 'rgba(148, 163, 184, 0.08)',
    buttonBg: '#64748B',
  },
  pro: {
    icon: Rocket,
    tint: '#7C6CFF',
    panel: 'rgba(124, 108, 255, 0.14)',
    glow: 'rgba(124, 108, 255, 0.18)',
    accentSoft: 'rgba(124, 108, 255, 0.22)',
    sectionBg: 'rgba(124, 108, 255, 0.08)',
    buttonBg: '#6D5AFD',
  },
  enterprise: {
    icon: ShieldCheck,
    tint: '#14B8A6',
    panel: 'rgba(20, 184, 166, 0.14)',
    glow: 'rgba(20, 184, 166, 0.18)',
    accentSoft: 'rgba(20, 184, 166, 0.22)',
    sectionBg: 'rgba(20, 184, 166, 0.08)',
    buttonBg: '#0F9D90',
  },
};

const openExternal = async (url, onError) => {
  try {
    await Linking.openURL(url);
  } catch {
    onError?.();
  }
};

const renderFeatureValue = (value, colors) => {
  if (typeof value === 'boolean') {
    return value ? <Check size={15} color={colors.positive} /> : <X size={15} color={colors.negative} />;
  }

  return <AppText style={[stylesStatic.compareValue, { color: colors.textPrimary }]}>{value}</AppText>;
};

const Plans = ({ navigation }) => {
  const { themeColors, user } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkErrorVisible, setLinkErrorVisible] = useState(false);
  const profileName = user?.displayName || user?.name || 'Trader';
  const { results, loading, error: searchError } = useTickerSearch(searchQuery);

  const submitTickerSearch = () => {
    const normalized = normalizeStockSymbol(searchQuery);
    if (/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized)) {
      navigateToStockDetail(navigation, normalized);
      return;
    }

    if (results[0]?.symbol) {
      navigateToStockDetail(navigation, results[0].symbol);
    }
  };

  const selectTickerSearchResult = (item) => {
    if (!item?.symbol) return;
    setSearchQuery(item.symbol);
    navigateToStockDetail(navigation, item.symbol);
  };

  return (
    <View style={styles.screen}>
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

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowLeft} />
            <View style={styles.heroGlowRight} />

            <View style={styles.heroTag}>
              <Sparkles size={13} color={themeColors.accent} />
              <AppText style={styles.heroTagText}>Subscription Plans</AppText>
            </View>

            <AppText style={styles.heroTitle}>Choose the right trading stack for your workflow.</AppText>
            <AppText style={styles.heroBody}>
              From simple market monitoring to curated insights and consultation, each plan adds a more powerful layer of data,
              timing context, and execution support.
            </AppText>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatCard}>
                <AppText style={styles.heroStatValue}>7</AppText>
                <AppText style={styles.heroStatLabel}>Plan options</AppText>
              </View>
              <View style={styles.heroStatCard}>
                <AppText style={styles.heroStatValue}>Real-time</AppText>
                <AppText style={styles.heroStatLabel}>Available on paid tiers</AppText>
              </View>
              <View style={styles.heroStatCard}>
                <AppText style={styles.heroStatValue}>1:1</AppText>
                <AppText style={styles.heroStatLabel}>Consultation on top tiers</AppText>
              </View>
            </View>
          </View>

          <View style={styles.planStack}>
            {PLAN_GROUPS.map((group) => {
              const meta = FAMILY_META[group.key];
              const GroupIcon = meta.icon;
              const groupPlans = PLANS.filter((plan) => plan.family === group.key);

              return (
                <View key={group.key} style={[styles.familySection, { borderColor: meta.accentSoft, backgroundColor: meta.sectionBg }]}>
                  <View style={styles.familySectionHead}>
                    <View style={[styles.familySectionIcon, { backgroundColor: meta.panel, borderColor: meta.accentSoft }]}>
                      <GroupIcon size={18} color={meta.tint} />
                    </View>
                    <View style={styles.familySectionTextWrap}>
                      <AppText style={styles.familySectionTitle}>{group.title}</AppText>
                      <AppText style={styles.familySectionBody}>{group.body}</AppText>
                    </View>
                  </View>

                  <View style={styles.familyCardStack}>
                    {groupPlans.map((plan) => {
                      const Icon = meta.icon;

                      return (
                        <View
                          key={plan.id}
                          style={[
                            styles.planCard,
                            {
                              borderColor: meta.accentSoft,
                              backgroundColor: meta.panel,
                            },
                          ]}
                        >
                          <View style={styles.planTopRow}>
                            <View style={styles.planTitleBlock}>
                              <View style={[styles.familyBadge, { borderColor: meta.accentSoft, backgroundColor: meta.panel }]}>
                                <Icon size={13} color={meta.tint} />
                                <AppText style={[styles.familyBadgeText, { color: meta.tint }]}>{plan.badge}</AppText>
                              </View>
                              <AppText style={styles.planTitle}>{plan.title}</AppText>
                              <AppText style={styles.planSubtitle}>{plan.subtitle}</AppText>
                            </View>

                            <View style={styles.priceWrap}>
                              <AppText style={styles.planPrice}>{plan.price}</AppText>
                            </View>
                          </View>

                          <AppText style={styles.planDescription}>{plan.description}</AppText>

                          <View style={styles.bulletList}>
                            {plan.bullets.map((bullet) => (
                              <View key={bullet} style={styles.bulletRow}>
                                <Check size={14} color={themeColors.positive} />
                                <AppText style={styles.bulletText}>{bullet}</AppText>
                              </View>
                            ))}
                          </View>

                          <Pressable
                            style={[styles.primaryButton, { backgroundColor: meta.buttonBg }]}
                            onPress={() => openExternal(`${WEB_BASE_URL}/checkout?plan=${encodeURIComponent(plan.id)}`, () => setLinkErrorVisible(true))}
                          >
                            <AppText style={styles.primaryButtonText}>Choose {plan.title}</AppText>
                            <ArrowRight size={15} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>


          <View style={styles.compareCard}>
            <AppText style={styles.compareTitle}>Compare features</AppText>
            <AppText style={styles.compareBody}>
              A compact mobile comparison of the features that usually drive upgrade decisions.
            </AppText>

            {FEATURES.map((feature) => (
              <View key={feature.label} style={styles.compareRow}>
                <AppText style={styles.compareLabel}>{feature.label}</AppText>

                <View style={styles.compareValues}>
                  {PLANS.map((plan) => (
                    <View key={`${feature.label}-${plan.id}`} style={styles.compareCell}>
                      <AppText style={styles.comparePlanName}>{plan.title}</AppText>
                      {renderFeatureValue(feature.values[plan.id], themeColors)}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <AppDialog
          visible={linkErrorVisible}
          title="Open Failed"
          message="Unable to open the link right now."
          onRequestClose={() => setLinkErrorVisible(false)}
          actions={[
            {
              label: 'Close',
              variant: 'primary',
              onPress: () => setLinkErrorVisible(false),
            },
          ]}
        />

        <BottomTabs navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const stylesStatic = StyleSheet.create({
  compareValue: {
    fontFamily: FONT.medium,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 10,
      paddingTop: 12,
      paddingBottom: 120,
      gap: 16,
    },
    heroCard: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 20,
      gap: 14,
    },
    heroGlowLeft: {
      position: 'absolute',
      top: -34,
      left: -22,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.accent,
      opacity: 0.11,
    },
    heroGlowRight: {
      position: 'absolute',
      bottom: -40,
      right: -30,
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: colors.positive,
      opacity: 0.08,
    },
    heroTag: {
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
    heroTagText: {
      fontFamily: FONT.medium,
      color: colors.textPrimary,
      fontSize: 11,
    },
    heroTitle: {
      fontFamily: FONT.extraBold,
      color: colors.textPrimary,
      fontSize: 26,
      lineHeight: 32,
    },
    heroBody: {
      fontFamily: FONT.regular,
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: '94%',
    },
    heroStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    heroStatCard: {
      minWidth: '30%',
      flexGrow: 1,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 4,
    },
    heroStatValue: {
      fontFamily: FONT.extraBold,
      color: colors.textPrimary,
      fontSize: 16,
      lineHeight: 20,
    },
    heroStatLabel: {
      fontFamily: FONT.regular,
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
    },
    planStack: {
      gap: 14,
    },
    familySection: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 14,
      gap: 14,
    },
    familySectionHead: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    familySectionIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    familySectionTextWrap: {
      flex: 1,
      gap: 4,
    },
    familySectionTitle: {
      fontFamily: FONT.extraBold,
      color: colors.textPrimary,
      fontSize: 18,
      lineHeight: 22,
    },
    familySectionBody: {
      fontFamily: FONT.regular,
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    familyCardStack: {
      gap: 12,
    },
    planCard: {
      position: 'relative',
      borderRadius: 18,
      borderWidth: 1,
      padding: 16,
      gap: 12,
    },
    planTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    planTitleBlock: {
      flex: 1,
      gap: 6,
    },
    familyBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
    },
    familyBadgeText: {
      fontFamily: FONT.medium,
      fontSize: 11,
    },
    planTitle: {
      fontFamily: FONT.extraBold,
      color: colors.textPrimary,
      fontSize: 18,
      lineHeight: 22,
    },
    planSubtitle: {
      fontFamily: FONT.regular,
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    priceWrap: {
      alignItems: 'flex-end',
      maxWidth: 132,
    },
    planPrice: {
      fontFamily: FONT.extraBold,
      color: colors.textPrimary,
      fontSize: 18,
      lineHeight: 22,
      textAlign: 'right',
    },
    planDescription: {
      fontFamily: FONT.regular,
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    bulletList: {
      gap: 10,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    bulletText: {
      fontFamily: FONT.medium,
      flex: 1,
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 19,
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },
    primaryButtonText: {
      fontFamily: FONT.semiBold,
      color: '#FFFFFF',
      fontSize: 13,
    },
    manageCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 18,
      gap: 14,
    },
    manageRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    manageIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    manageTextWrap: {
      flex: 1,
      gap: 4,
    },
    manageTitle: {
      fontFamily: FONT.extraBold,
      color: colors.textPrimary,
      fontSize: 16,
    },
    manageText: {
      fontFamily: FONT.regular,
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
    },
    secondaryButton: {
      minHeight: 46,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    secondaryButtonText: {
      fontFamily: FONT.semiBold,
      color: colors.textPrimary,
      fontSize: 13,
    },
    compareCard: {
      borderRadius: 26,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 18,
      gap: 14,
    },
    compareTitle: {
      fontFamily: FONT.extraBold,
      color: colors.textPrimary,
      fontSize: 20,
    },
    compareBody: {
      fontFamily: FONT.regular,
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    compareRow: {
      gap: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 14,
    },
    compareLabel: {
      fontFamily: FONT.semiBold,
      color: colors.textPrimary,
      fontSize: 14,
    },
    compareValues: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    compareCell: {
      minWidth: '47%',
      flexGrow: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 10,
      gap: 6,
      alignItems: 'center',
    },
    comparePlanName: {
      fontFamily: FONT.medium,
      color: colors.textMuted,
      fontSize: 10,
      lineHeight: 14,
      textAlign: 'center',
    },
  });

export default Plans;
