import React, { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  Calculator,
  ChevronRight,
  Grid3X3,
  List,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import AppDialog from '../../components/AppDialog';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import ProfileAvatarButton from '../../components/ProfileAvatarButton';
import { useUser } from '../../store/UserContext';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const CATEGORY_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'trading', label: 'Trading' },
  { key: 'investing', label: 'Investing' },
  { key: 'personal-finance', label: 'Personal Finance' },
  { key: 'astrology', label: 'Astrology' },
];

const CALCULATORS = [
  {
    section: 'Trading',
    items: [
      {
        id: 'support-resistance',
        title: 'Support & Resistance',
        description: 'Derive key S/R levels from historical price.',
        category: 'trading',
        tags: ['price levels'],
      },
      {
        id: 'win-rate-risk-reward',
        title: 'Win-Rate & Risk-Reward',
        description: 'Plan entries with stop/target and expectancy.',
        category: 'trading',
        tags: ['trade planning'],
      },
      {
        id: 'rr-quick',
        title: 'RR Ratio (Quick)',
        description: 'Fast R:R ratio from stop to target distance.',
        category: 'trading',
        tags: ['trade planning'],
      },
      {
        id: 'risk-reward-break-even',
        title: 'Risk-Reward Ratio Calculator',
        description: 'Find break-even win-rate for a given R:R.',
        category: 'trading',
        tags: ['expectancy'],
      },
      {
        id: 'position-size',
        title: 'Position Size Calculator',
        description: 'Size trades by account risk and stop distance.',
        category: 'trading',
        tags: ['position planning'],
      },
      {
        id: 'stock-dca',
        title: 'Stock Average Calculator',
        description: 'Calculate weighted average buy price across lots.',
        category: 'trading',
        tags: ['position planning'],
      },
      {
        id: 'profit-loss',
        title: 'Profit & Loss (P&L)',
        description: 'Evaluate realized and unrealized trade P&L.',
        category: 'trading',
        tags: ['trading'],
      },
      {
        id: 'fibonacci',
        title: 'Fibonacci Retracement',
        description: 'Compute retracement levels for technical analysis.',
        category: 'trading',
        tags: ['technical analysis'],
      },
      {
        id: 'stop-loss-take-profit',
        title: 'Stop Loss & Take Profit',
        description: 'Compute stop/target values from entry and risk.',
        category: 'trading',
        tags: ['trade planning'],
      },
      {
        id: 'drawdown-capital-recovery',
        title: 'Drawdown & Capital Recovery',
        description: 'Estimate capital required to recover from drawdown.',
        category: 'trading',
        tags: ['risk management'],
      },
      {
        id: 'options-pricing-greeks',
        title: 'Options Pricing & Greeks',
        description: 'Approximate option value and greek sensitivities.',
        category: 'trading',
        tags: ['options'],
      },
      {
        id: 'risk-reward-india',
        title: 'Risk-Reward (India)',
        description: 'Risk-reward helper tailored for Indian market ticks.',
        category: 'trading',
        tags: ['india'],
      },
      {
        id: 'trading-risk-reward',
        title: 'Trading Risk-Reward',
        description: 'Compare risk and reward across multiple setups.',
        category: 'trading',
        tags: ['trading'],
      },
      {
        id: 'risk-to-reward',
        title: 'Risk to Reward',
        description: 'Simple risk to reward ratio calculator.',
        category: 'trading',
        tags: ['trading'],
      },
      {
        id: 'stock-risk-reward',
        title: 'Stock Risk-Reward',
        description: 'Position-level risk-reward for stock trades.',
        category: 'trading',
        tags: ['trading'],
      },
    ],
  },
  {
    section: 'Investing',
    items: [
      {
        id: 'cagr',
        title: 'CAGR',
        description: 'Measure annualized investment growth.',
        category: 'investing',
        tags: ['returns'],
      },
      {
        id: 'roi',
        title: 'ROI',
        description: 'Return on investment in absolute terms.',
        category: 'investing',
        tags: ['returns'],
      },
      {
        id: 'npv',
        title: 'NPV',
        description: 'Net present value of discounted cash flows.',
        category: 'investing',
        tags: ['valuation'],
      },
      {
        id: 'irr',
        title: 'IRR',
        description: 'Internal rate of return for investment cash flows.',
        category: 'investing',
        tags: ['valuation'],
      },
      {
        id: 'sharpe-sortino',
        title: 'Sharpe & Sortino Ratios',
        description: 'Risk-adjusted return using Sharpe and Sortino.',
        category: 'investing',
        tags: ['portfolio'],
      },
      {
        id: 'correlation',
        title: 'Correlation & Covariance',
        description: 'Relationship analysis between assets.',
        category: 'investing',
        tags: ['portfolio'],
      },
      {
        id: 'dcf',
        title: 'DCF',
        description: 'Discounted cash flow valuation with terminal value.',
        category: 'investing',
        tags: ['valuation'],
      },
      {
        id: 'portfolio-risk-std',
        title: 'Portfolio Risk (Std Dev)',
        description: 'Portfolio volatility from weighted components.',
        category: 'investing',
        tags: ['portfolio'],
      },
      {
        id: 'efficient-frontier',
        title: 'Efficient Frontier',
        description: 'Optimization helper for asset allocation.',
        category: 'investing',
        tags: ['portfolio'],
      },
      {
        id: 'dividend-pe',
        title: 'Dividend & P/E',
        description: 'Dividend yield and P/E ratio helper.',
        category: 'investing',
        tags: ['valuation'],
      },
    ],
  },
  {
    section: 'Personal Finance',
    items: [
      {
        id: 'emergency-fund',
        title: 'Emergency Fund',
        description: 'Plan safety buffer for unexpected expenses.',
        category: 'personal-finance',
        tags: ['personal finance'],
      },
      {
        id: 'retirement-corpus',
        title: 'Retirement',
        description: 'Estimate retirement corpus and savings path.',
        category: 'personal-finance',
        tags: ['personal finance'],
      },
      {
        id: 'mortgage',
        title: 'Mortgage',
        description: 'Monthly mortgage payments and total interest.',
        category: 'personal-finance',
        tags: ['loans'],
      },
      {
        id: 'emi',
        title: 'EMI Calculator',
        description: 'Loan installment, tenure, and amortization schedule.',
        category: 'personal-finance',
        tags: ['loans'],
      },
      {
        id: 'car-loan',
        title: 'Car Loan EMI Calculator',
        description: 'Vehicle loan EMI with down payment options.',
        category: 'personal-finance',
        tags: ['loans'],
      },
      {
        id: 'home-loan-emi',
        title: 'Home Loan EMI Calculator',
        description: 'Home loan EMI, tenure and full amortization.',
        category: 'personal-finance',
        tags: ['loans'],
      },
      {
        id: 'house-affordability',
        title: 'House Affordability',
        description: 'Estimate home value based on your income.',
        category: 'personal-finance',
        tags: ['loans'],
      },
      {
        id: 'savings-last',
        title: 'How Long Will My Savings Last',
        description: 'Project runway for savings under withdrawals.',
        category: 'personal-finance',
        tags: ['personal finance'],
      },
      {
        id: 'saving-growth',
        title: 'Saving Growth',
        description: 'Visualize savings growth over time.',
        category: 'personal-finance',
        tags: ['personal finance'],
      },
      {
        id: 'save-money-goal',
        title: 'Save Money Calculator',
        description: 'Find monthly savings needed to hit a goal.',
        category: 'personal-finance',
        tags: ['savings'],
      },
      {
        id: 'net-worth',
        title: 'Net Worth Calculator',
        description: 'Calculate current net worth and track trend.',
        category: 'personal-finance',
        tags: ['planning'],
      },
      {
        id: 'college-calculator',
        title: 'College Calculators',
        description: 'Student budget and education planning tools.',
        category: 'personal-finance',
        tags: ['education'],
      },
      {
        id: 'high-yield-savings',
        title: 'High-Yield Savings Calculator',
        description: 'Estimate savings growth with APY and deposits.',
        category: 'personal-finance',
        tags: ['savings'],
      },
      {
        id: 'retirement-savings-pf',
        title: 'Retirement Savings Calculator',
        description: 'Projected retirement corpus and monthly need.',
        category: 'personal-finance',
        tags: ['retirement'],
      },
      {
        id: 'sip',
        title: 'SIP Calculator',
        description: 'Estimate SIP maturity with invested amount.',
        category: 'personal-finance',
        tags: ['mutual funds'],
      },
      {
        id: 'lumpsum',
        title: 'Lumpsum Calculator',
        description: 'Future value estimate for one-time investment.',
        category: 'personal-finance',
        tags: ['mutual funds'],
      },
      {
        id: 'swp',
        title: 'SWP Calculator',
        description: 'Monthly withdrawals and final corpus projection.',
        category: 'personal-finance',
        tags: ['mutual funds'],
      },
      {
        id: 'fd',
        title: 'FD Calculator',
        description: 'Fixed deposit maturity amount and interest.',
        category: 'personal-finance',
        tags: ['deposits'],
      },
      {
        id: 'simple-interest',
        title: 'Simple Interest Calculator',
        description: 'Interest and maturity amount on simple basis.',
        category: 'personal-finance',
        tags: ['deposits'],
      },
      {
        id: 'compound-interest',
        title: 'Compound Interest Calculator',
        description: 'Compound growth from principal and periodic rate.',
        category: 'personal-finance',
        tags: ['deposits'],
      },
      {
        id: 'rd',
        title: 'RD Calculator',
        description: 'Recurring deposit maturity estimate.',
        category: 'personal-finance',
        tags: ['deposits'],
      },
      {
        id: 'mutual-fund-return',
        title: 'Mutual Fund Return Calculator',
        description: 'SIP + lump sum return projection.',
        category: 'personal-finance',
        tags: ['mutual funds'],
      },
      {
        id: 'spending',
        title: 'Spending Calculator',
        description: 'Understand monthly spending breakdown.',
        category: 'personal-finance',
        tags: ['budgeting'],
      },
      {
        id: 'life-insurance',
        title: 'Life Insurance',
        description: 'Estimate required life insurance coverage.',
        category: 'personal-finance',
        tags: ['protection'],
      },
      {
        id: 'property-valuation',
        title: 'Property Valuation',
        description: 'Estimate property value from key inputs.',
        category: 'personal-finance',
        tags: ['real estate'],
      },
      {
        id: 'carpet',
        title: 'Carpet Calculator',
        description: 'Estimate room carpet need and area.',
        category: 'personal-finance',
        tags: ['home improvement'],
      },
      {
        id: '401k-retirement',
        title: '401(k) Retirement Savings',
        description: 'Project 401(k) balance with salary growth and employer match.',
        category: 'personal-finance',
        tags: ['retirement'],
      },
      {
        id: 'fire',
        title: 'Financial Freedom (9-Step)',
        description: 'Target corpus for long-term financial independence.',
        category: 'personal-finance',
        tags: ['financial planning'],
      },
    ],
  },
  {
    section: 'Astrology',
    items: [
      {
        id: 'astro-longevity',
        title: 'Astrology Longevity',
        description: 'Birth-chart based longevity insights.',
        category: 'astrology',
        tags: ['astrology'],
      },
    ],
  },
];
const SECTION_ICONS = {
  Trading: TrendingUp,
  Investing: Wallet,
  'Personal Finance': Calculator,
  Astrology: Sparkles,
};

const Calculators = ({ navigation }) => {
  const { theme, themeColors } = useUser();
  const isLight = theme === 'light';
  const styles = useMemo(() => createStyles(themeColors, isLight), [isLight, themeColors]);
  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Calculators', (route) => navigation.navigate(route));

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [openFailedVisible, setOpenFailedVisible] = useState(false);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();

    return CALCULATORS.map((section) => {
      const items = section.items.filter((item) => {
        const categoryOk = activeCategory === 'all' || item.category === activeCategory;
        if (!categoryOk) return false;

        if (!q) return true;

        const haystack = [item.title, item.description, ...(item.tags || [])].join(' ').toLowerCase();
        return haystack.includes(q);
      });

      return { ...section, items };
    }).filter((section) => section.items.length > 0);
  }, [activeCategory, query]);

  const totalVisible = useMemo(
    () => filteredSections.reduce((sum, section) => sum + section.items.length, 0),
    [filteredSections],
  );

  const openCalculator = (calculator) => {
    navigation.navigate('CalculatorTool', { calculator });
  };

  const openLiveSignals = async (url = 'https://finance.rajeevprakash.com') => {
    try {
      await Linking.openURL(url);
    } catch {
      setOpenFailedVisible(true);
    }
  };

  return (
    <View style={styles.safeArea} {...swipeHandlers}>
      <GradientBackground>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleWrap}>
              <AppText style={styles.kicker}>CALCULATORS</AppText>
              <AppText style={styles.title}>Finance Calculator Hub for Smarter Decisions</AppText>
              <AppText style={styles.subtitle}>
                Explore trading, investing, and personal finance tools in one fast practical interface.
              </AppText>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={viewMode === 'list' ? styles.headerBtnActive : styles.headerBtn}
                onPress={() => setViewMode('list')}
              >
                <List size={14} color={themeColors.textPrimary} />
              </Pressable>
              <Pressable
                style={viewMode === 'grid' ? styles.headerBtnActive : styles.headerBtn}
                onPress={() => setViewMode('grid')}
              >
                <Grid3X3 size={14} color={themeColors.textPrimary} />
              </Pressable>
              <ProfileAvatarButton style={styles.headerBtn} onPress={() => navigation.navigate('Profile')} size={34} />
            </View>
          </View>

          <View style={styles.searchBar}>
            <Search size={16} color={themeColors.textMuted} />
            <AppTextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search calculators"
              placeholderTextColor={themeColors.textMuted}
              style={styles.searchInput}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {CATEGORY_OPTIONS.map((option) => {
              const active = activeCategory === option.key;
              return (
                <Pressable
                  key={option.key}
                  style={active ? styles.filterChipActive : styles.filterChip}
                  onPress={() => setActiveCategory(option.key)}
                >
                  <AppText style={active ? styles.filterTextActive : styles.filterText}>{option.label}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {filteredSections.map((section) => {
            const SectionIcon = SECTION_ICONS[section.section] || Calculator;
            return (
              <View key={section.section} style={styles.sectionWrap}>
                <View style={styles.sectionHead}>
                  <View style={styles.sectionTitleRow}>
                    <SectionIcon size={14} color={themeColors.textPrimary} />
                    <AppText style={styles.sectionTitle}>{section.section}</AppText>
                  </View>
                  <AppText style={styles.sectionCount}>{section.items.length} calculators</AppText>
                </View>

                <View style={viewMode === 'list' ? styles.listWrap : styles.gridWrap}>
                  {section.items.map((item) => (
                    <Pressable
                      key={item.id}
                      style={viewMode === 'list' ? styles.cardList : styles.cardGrid}
                      onPress={() => openCalculator(item)}
                    >
                      <View style={styles.cardTop}>
                        <View style={styles.cardIcon}>
                          <Calculator size={13} color={themeColors.textMuted} />
                        </View>
                        <AppText style={styles.cardCategory}>{section.section}</AppText>
                      </View>

                      <AppText style={styles.cardTitle}>{item.title}</AppText>
                      <AppText style={styles.cardDescription}>{item.description}</AppText>

                      <View style={styles.cardFooter}>
                        <View style={styles.tagPill}>
                          <AppText style={styles.tagText}>{item.tags?.[0] || section.section}</AppText>
                        </View>
                        <View style={styles.openIconBtn}>
                          <ChevronRight size={12} color={themeColors.textMuted} />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}

          {totalVisible === 0 && (
            <View style={styles.emptyCard}>
              <AppText style={styles.emptyTitle}>No calculators found</AppText>
              <AppText style={styles.emptyBody}>Try another keyword or switch category filters.</AppText>
            </View>
          )}

          <View style={styles.banner}>
            <View>
              <AppText style={styles.bannerTitle}>Trade with discipline, not emotion</AppText>
              <AppText style={styles.bannerBody}>
                Get real-time entries, exits, and risk levels with daily context.
              </AppText>
            </View>
            <View style={styles.bannerActions}>
              <Pressable style={styles.bannerBtn} onPress={() => openLiveSignals('https://finance.rajeevprakash.com/products/live-signals/')}>
                <AppText style={styles.bannerBtnText}>Join Live Signals</AppText>
              </Pressable>
              <Pressable style={styles.bannerBtnGhost} onPress={() => openLiveSignals('https://finance.rajeevprakash.com/products/daily-newsletter/')}>
                <AppText style={styles.bannerBtnGhostText}>Daily Outlook</AppText>
              </Pressable>
            </View>
          </View>

          <View style={styles.contactWrap}>
            <View style={styles.contactTag}>
              <AppText style={styles.contactTagText}>Inquiries</AppText>
            </View>
            <AppText style={styles.contactTitle}>Talk to our team</AppText>
            <View style={styles.contactCard}>
              <AppText style={styles.contactHead}>Product & Subscription Inquiries</AppText>
              <AppText style={styles.contactSub}>
                For pricing, enterprise access, or integration questions, reach us directly.
              </AppText>
              <View style={styles.contactRow}>
                <Pressable style={styles.contactItem} onPress={() => openLiveSignals('tel:+919669919000')}>
                  <AppText style={styles.contactItemText}>+91-96699-19000</AppText>
                </Pressable>
                <Pressable style={styles.contactItem} onPress={() => openLiveSignals('mailto:pr@rajeevprakash.com')}>
                  <AppText style={styles.contactItemText}>pr@rajeevprakash.com</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        <AppDialog
          visible={openFailedVisible}
          title="Open Failed"
          message="Unable to open link right now."
          onRequestClose={() => setOpenFailedVisible(false)}
          actions={[
            {
              label: 'Close',
              variant: 'primary',
              onPress: () => setOpenFailedVisible(false),
            },
          ]}
        />

        <BottomTabs activeRoute="Calculators" navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, isLight) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerCard: {
      marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 6 : 50,
      marginHorizontal: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 10,
      gap: 10,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    headerTitleWrap: {
      flex: 1,
      gap: 3,
    },
    kicker: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.semiBold,
      letterSpacing: 0.7,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      lineHeight: 28,
      fontFamily: FONT.semiBold,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 6,
    },
    headerBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    headerBtnActive: {
      width: 30,
      height: 30,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isLight ? '#7f8eb3' : '#8aa8ff',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isLight ? '#eaf0ff' : 'rgba(111, 144, 255, 0.24)',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      paddingVertical: 0,
      color: colors.textPrimary,
    },
    filterRow: {
      gap: 8,
      paddingRight: 8,
    },
    filterChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    filterChipActive: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isLight ? '#7f8eb3' : '#8aa8ff',
      backgroundColor: isLight ? '#eaf0ff' : 'rgba(111, 144, 255, 0.24)',
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    filterText: {
      color: colors.textMuted,
      fontSize: 12,
    },
    filterTextActive: {
      color: colors.textPrimary,
      fontSize: 12,
      fontFamily: FONT.semiBold,
    },
    content: {
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 140,
      gap: 12,
    },
    sectionWrap: {
      gap: 8,
    },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontFamily: FONT.semiBold,
    },
    sectionCount: {
      color: colors.textMuted,
      fontSize: 12,
    },
    gridWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    listWrap: {
      gap: 8,
    },
    cardGrid: {
      width: '100%',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 9,
      gap: 8,
      minHeight: 145,
    },
    cardList: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 10,
      gap: 8,
      minHeight: 112,
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardIcon: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    cardCategory: {
      color: colors.textMuted,
      fontSize: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: colors.surfaceAlt,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: FONT.semiBold,
      lineHeight: 18,
    },
    cardDescription: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      flex: 1,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 6,
    },
    tagPill: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: colors.surfaceAlt,
    },
    tagText: {
      color: colors.textMuted,
      fontSize: 10,
    },
    openIconBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    emptyCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 16,
      gap: 5,
      alignItems: 'center',
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      fontFamily: FONT.semiBold,
    },
    emptyBody: {
      color: colors.textMuted,
      fontSize: 13,
    },
    banner: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isLight ? '#91b5ff' : 'rgba(96, 141, 255, 0.35)',
      backgroundColor: isLight ? '#d6e9ff' : '#1d56b4',
      padding: 12,
      gap: 10,
    },
    bannerTitle: {
      color: isLight ? '#133162' : '#f2f7ff',
      fontSize: 17,
      fontFamily: FONT.semiBold,
    },
    bannerBody: {
      color: isLight ? '#254676' : '#e6f0ff',
      fontSize: 12,
      marginTop: 2,
    },
    bannerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    bannerBtn: {
      borderRadius: 999,
      backgroundColor: '#ffffff',
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    bannerBtnText: {
      color: '#1f4ea1',
      fontSize: 12,
      fontFamily: FONT.semiBold,
    },
    bannerBtnGhost: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isLight ? 'transparent' : 'rgba(255,255,255,0.7)',
      backgroundColor: isLight ? '#ffffff' : 'transparent',
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    bannerBtnGhostText: {
      color: isLight ? '#2b5cab' : '#ffffff',
      fontSize: 12,
      fontFamily: FONT.semiBold,
    },
    contactWrap: {
      alignItems: 'center',
      gap: 8,
      paddingBottom: 10,
    },
    contactTag: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    contacttagText: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: FONT.semiBold,
    },
    contactTitle: {
      color: colors.textPrimary,
      fontSize: 30,
      fontFamily: FONT.semiBold,
      lineHeight: 34,
    },
    contactCard: {
      width: '100%',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 10,
      gap: 5,
    },
    contactHead: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: FONT.semiBold,
    },
    contactSub: {
      color: colors.textMuted,
      fontSize: 11,
    },
    contactRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    contactItem: {
      flex: 1,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    contactItemText: {
      color: colors.textPrimary,
      fontSize: 12,
    },
  });

export default Calculators;












