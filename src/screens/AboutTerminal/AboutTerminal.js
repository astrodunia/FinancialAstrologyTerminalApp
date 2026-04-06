import React, { useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BrainCircuit, CalendarClock, CheckCircle2, Compass, Layers3, Orbit, ShieldCheck, Sparkles, Users2 } from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import HomeHeader from '../../components/HomeHeader';
import { useUser } from '../../store/UserContext';

const ABOUT_IMAGE_URL = 'https://finance.rajeevprakash.com/_next/image/?url=%2Fimages%2Fabout.png&w=1920&q=75';

const ABOUT_KEY_POINTS = [
  'Built for indices, commodities, FX, bonds, and crypto',
  'Focused on timing windows, not stock tips',
  'Grounded in two decades of live practice',
];

const ABOUT_AT_A_GLANCE = [
  'Core idea: treat planetary cycles as a statistically testable timing layer, not a belief system.',
  'Primary users: hedge funds, family offices, active traders, wealth managers, and sophisticated individual investors.',
  'Key outcome: avoid unstable windows, time entries and exits more cleanly, and align allocations with structural cycles.',
];

const ABOUT_MARKET_BEHAVIOUR = [
  'Volatility spikes in major equity indices and commodities',
  'Trend exhaustion and reversal windows in key benchmarks',
  'Liquidity compressions and risk-off episodes',
  'Macro rotation between sectors, styles, and regions',
];

const ABOUT_DESIGN_PRINCIPLES = [
  'Non-mystical framing: planetary cycles are documented as cyclical markers, similar to seasonality or sentiment indicators.',
  'Testable logic: signals and timing windows can be examined against historical data and integrated into existing research pipelines.',
  'Complementary, not competing: the terminal does not replace macro research, valuations, or quant models. It overlays an additional axis of information.',
];

const ABOUT_PIPELINE_STEPS = [
  'Data ingestion: planetary positions, aspects, and phase changes are collected and normalised into machine-readable form.',
  'Historical linkage: these time points are overlaid on price, volatility, and macro series to identify statistically notable clusters.',
  'Signal construction: the system creates labelled windows, each tagged with probability, directionality bias, and asset sensitivity.',
  'Live mapping: upcoming windows are projected onto the current market environment, giving traders a forward calendar of cycle-sensitive days and weeks.',
];

const ABOUT_USER_STACK = [
  'Macro and fundamental analysis for regime and valuation context',
  'Technical structures for entries, exits, and risk placement',
  'Quantitative models, volatility surfaces, and flow data',
  'Portfolio-level risk frameworks focused on drawdown and exposure limits',
];

const CTA_PRODUCTS = [
  { id: 'annual-letter', label: 'Annual Letter', url: 'https://finance.rajeevprakash.com/products/annual-letter-2026/' },
  { id: 'live-signals', label: 'Live Signals', url: 'https://finance.rajeevprakash.com/products/live-signals/' },
  { id: 'daily-newsletter', label: 'Daily Newsletter', url: 'https://finance.rajeevprakash.com/products/daily-newsletter/' },
];

const AboutTerminal = ({ navigation }) => {
  const { themeColors, user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const styles = useMemo(() => createStyles(themeColors, isCompact), [themeColors, isCompact]);
  const profileName = user?.displayName || user?.name || 'Trader';

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <HomeHeader
          themeColors={themeColors}
          profileName={profileName}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          searchResults={[]}
          searchLoading={false}
          searchError=""
          showSearchResults={false}
          onPressSearchResult={() => {}}
          onSubmitSearch={() => {}}
          onPressProfile={() => navigation.navigate('Profile')}
          onPressGlobalIndices={() => navigation.navigate('GlobalIndices')}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Image source={{ uri: ABOUT_IMAGE_URL }} style={styles.aboutImage} resizeMode="cover" />
            <View style={styles.heroTag}>
              <Sparkles size={12} color={themeColors.accent} />
              <AppText style={styles.heroTagText}>Professional Timing Research Layer</AppText>
            </View>

            <AppText style={styles.aboutHeading}>A Cycle-Based Timing Intelligence Layer for Modern Markets</AppText>
            <AppText style={styles.aboutParagraph}>
              The Financial Astrology Terminal by Rajeev Prakash is a professional research environment that structurally maps
              planetary cycles to macro regimes, volatility clusters, and cross-asset rotations. It is designed for traders and
              institutional investors who want a differentiated timing edge without sacrificing discipline, data, or risk control.
            </AppText>
            <AppText style={styles.aboutParagraph}>
              Instead of forecasting markets through stories or intuition, the terminal focuses on tested historical correlations
              between celestial configurations and market behaviour. Planetary transits, retrogrades, ingresses, and lunar phases are
              treated as a systematic alternative data factor, layered on top of traditional macro, technical, and quantitative frameworks.
            </AppText>

            <View style={styles.aboutList}>
              {ABOUT_KEY_POINTS.map((point) => (
                <View key={point} style={styles.listRow}>
                  <CheckCircle2 size={14} color={themeColors.accent} style={styles.listIcon} />
                  <AppText style={styles.aboutListItem}>{point}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <Compass size={14} color={themeColors.accent} />
              </View>
              <AppText style={styles.aboutSectionTitle}>Financial Astrology Terminal Overview</AppText>
            </View>
            <AppText style={styles.aboutSubTitle}>At a Glance</AppText>
            <View style={styles.aboutList}>
              {ABOUT_AT_A_GLANCE.map((item) => (
                <View key={item} style={styles.listRow}>
                  <CheckCircle2 size={14} color={themeColors.accent} style={styles.listIcon} />
                  <AppText style={styles.aboutListItem}>{item}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <Orbit size={14} color={themeColors.accent} />
              </View>
              <AppText style={styles.aboutSectionTitle}>What the Financial Astrology Terminal Actually Does</AppText>
            </View>
            <AppText style={styles.aboutParagraph}>
              The terminal continuously tracks the positions and relationships of key celestial bodies - including the Sun, Moon,
              Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto - alongside lunar nodes, eclipses, and lunations.
              Each configuration is evaluated for its historical association with:
            </AppText>
            <View style={styles.aboutList}>
              {ABOUT_MARKET_BEHAVIOUR.map((item) => (
                <View key={item} style={styles.listRow}>
                  <CheckCircle2 size={14} color={themeColors.accent} style={styles.listIcon} />
                  <AppText style={styles.aboutListItem}>{item}</AppText>
                </View>
              ))}
            </View>
            <AppText style={styles.aboutParagraph}>
              These correlations are not treated as deterministic laws. Instead, they are encoded as conditional probability bands.
              When a historically sensitive configuration approaches, and when it overlaps with stretched technicals, crowded positioning,
              or macro stress, the terminal flags an elevated-risk or high-opportunity window.
            </AppText>
            <AppText style={styles.aboutParagraph}>
              For a user, that means seeing not just where price is, but where time itself has tended to matter most. The goal is simple:
              improve timing and risk management, not replace fundamental or quantitative work.
            </AppText>

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <Layers3 size={14} color={themeColors.accent} />
              </View>
              <AppText style={styles.aboutSectionTitle}>Key Design Principles</AppText>
            </View>
            <View style={styles.aboutList}>
              {ABOUT_DESIGN_PRINCIPLES.map((item) => (
                <View key={item} style={styles.listRow}>
                  <CheckCircle2 size={14} color={themeColors.accent} style={styles.listIcon} />
                  <AppText style={styles.aboutListItem}>{item}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <BrainCircuit size={14} color={themeColors.accent} />
              </View>
              <AppText style={styles.aboutSectionTitle}>How the Timing Intelligence Layer Works</AppText>
            </View>
            <AppText style={styles.aboutParagraph}>
              At the heart of the Financial Astrology Terminal is a timing engine that synchronises astronomical data with financial
              time series. The system digests ephemeris information and converts planetary movements into structured signals: transits,
              aspects, retrograde phases, ingresses, and eclipse bands. Each of these is mapped to historical price and volatility data
              across indices, commodities, FX pairs, bonds, and crypto assets.
            </AppText>
            <AppText style={styles.aboutParagraph}>
              Based on this mapping, the terminal builds a library of cycle windows: time bands where certain types of market behaviour
              have repeatedly clustered. These might be windows where equity indices tend to experience sharp reversals, where safe-haven
              demand is more likely to surge, or where macro rotation typically accelerates.
            </AppText>
            <AppText style={styles.aboutParagraph}>
              Users do not see esoteric jargon. They see practical language: stress windows, breakout risk, shakeout zones, exhaustion
              bands, or high-probability continuation windows. The astrological logic sits underneath; the surface output speaks the
              language of risk and timing that professionals use every day.
            </AppText>

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <CalendarClock size={14} color={themeColors.accent} />
              </View>
              <AppText style={styles.aboutSectionTitle}>From Celestial Data to Trading Context</AppText>
            </View>
            <View style={styles.aboutList}>
              {ABOUT_PIPELINE_STEPS.map((item, index) => (
                <View key={item} style={styles.listRow}>
                  <CheckCircle2 size={14} color={themeColors.accent} style={styles.listIcon} />
                  <AppText style={styles.aboutListItem}>{`${index + 1}. ${item}`}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <Users2 size={14} color={themeColors.accent} />
              </View>
              <AppText style={styles.aboutSectionTitle}>Who Uses the Financial Astrology Terminal?</AppText>
            </View>
            <AppText style={styles.aboutParagraph}>
              The terminal is built for professionals who already take markets seriously: portfolio managers, traders, risk officers,
              and sophisticated individuals who understand that most edges come from incremental improvements in timing, not from magical
              forecasts. For them, the question is not whether astrology causes market moves, but whether specific celestial configurations
              align with recognisable market outcomes often enough to matter.
            </AppText>
            <AppText style={styles.aboutParagraph}>Typical users blend the terminal with:</AppText>
            <View style={styles.aboutList}>
              {ABOUT_USER_STACK.map((item) => (
                <View key={item} style={styles.listRow}>
                  <CheckCircle2 size={14} color={themeColors.accent} style={styles.listIcon} />
                  <AppText style={styles.aboutListItem}>{item}</AppText>
                </View>
              ))}
            </View>
            <AppText style={styles.aboutParagraph}>
              In that environment, the Financial Astrology Terminal acts as a timing overlay. It helps users decide when to be aggressive,
              when to lean defensive, and when to simply reduce noise by avoiding historically unstable windows.
            </AppText>

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <ShieldCheck size={14} color={themeColors.accent} />
              </View>
              <AppText style={styles.aboutSectionTitle}>Why Institutions Pay Attention to Time</AppText>
            </View>
            <AppText style={styles.aboutParagraph}>
              In a world where most information is widely available and factor models are heavily crowded, edges rarely come from knowing
              something dramatic that others do not. They come from understanding when to scale exposure up or down, when to avoid known
              stress periods, and when to ride a trend without getting shaken out by noise.
            </AppText>
            <AppText style={styles.aboutParagraph}>
              The Financial Astrology Terminal addresses exactly that dimension: it puts time on the same footing as price and fundamentals.
              By structurally encoding cycle windows, it offers an additional way to frame risk: not just what could happen, but when it is
              more likely to matter.
            </AppText>

            <View style={styles.ctaCard}>
              <AppText style={styles.ctaTitle}>Related Links</AppText>
              <View style={styles.ctaList}>
                {CTA_PRODUCTS.map((item) => (
                  <Pressable key={item.id} style={styles.ctaButton} onPress={() => Linking.openURL(item.url).catch(() => {})}>
                    <AppText style={styles.ctaButtonText}>{item.label}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <BottomTabs navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, isCompact) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 120,
      gap: 16,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: isCompact ? 14 : 16,
      gap: 12,
    },
    aboutImage: {
      width: '100%',
      height: isCompact ? 168 : 220,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    aboutHeading: {
      color: colors.textPrimary,
      fontSize: isCompact ? 22 : 28,
      lineHeight: isCompact ? 30 : 36,
      fontFamily: 'NotoSans-ExtraBold',
    },
    heroTag: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroTagText: {
      color: colors.textPrimary,
      fontSize: 11,
      lineHeight: 16,
      fontFamily: 'NotoSans-Medium',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    sectionIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aboutSectionTitle: {
      color: colors.textPrimary,
      fontSize: isCompact ? 16 : 18,
      lineHeight: isCompact ? 24 : 27,
      fontFamily: 'NotoSans-SemiBold',
      flex: 1,
    },
    aboutSubTitle: {
      color: colors.textPrimary,
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 20 : 22,
      fontFamily: 'NotoSans-SemiBold',
      marginTop: -4,
    },
    aboutParagraph: {
      color: colors.textMuted,
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 19 : 21,
      fontFamily: 'NotoSans-Regular',
    },
    aboutList: {
      gap: 6,
      marginTop: -2,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    listIcon: {
      marginTop: isCompact ? 2 : 3,
    },
    aboutListItem: {
      color: colors.textMuted,
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 19 : 21,
      fontFamily: 'NotoSans-Regular',
      flex: 1,
    },
    ctaCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: isCompact ? 10 : 12,
      gap: 10,
      marginTop: 4,
    },
    ctaTitle: {
      color: colors.textPrimary,
      fontSize: isCompact ? 14 : 15,
      lineHeight: isCompact ? 20 : 22,
      fontFamily: 'NotoSans-SemiBold',
    },
    ctaList: {
      gap: 8,
    },
    ctaButton: {
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    ctaButtonText: {
      color: colors.textPrimary,
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 18 : 19,
      fontFamily: 'NotoSans-SemiBold',
      textAlign: 'center',
    },
  });

export default AboutTerminal;
