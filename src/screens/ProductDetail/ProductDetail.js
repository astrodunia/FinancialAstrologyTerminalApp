import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  Globe,
  Landmark,
  Layers3,
  Newspaper,
  Radio,
  Sparkles,
  TrendingUp,
  Users2,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';
import { getProductById } from '../Products/productCatalog';

const ICON_MAP = {
  'file-text': FileText,
  radio: Radio,
  newspaper: Newspaper,
  globe: Globe,
  briefcase: Briefcase,
  building: Building2,
  landmark: Landmark,
  'trending-up': TrendingUp,
};

const VISUAL_THEMES = {
  'annual-letter': { primary: '#F59E0B', secondary: '#B45309', soft: '#FEF3C7' },
  'live-signals': { primary: '#10B981', secondary: '#047857', soft: '#D1FAE5' },
  'daily-newsletter': { primary: '#3B82F6', secondary: '#1D4ED8', soft: '#DBEAFE' },
  'global-commodities': { primary: '#F97316', secondary: '#C2410C', soft: '#FFEDD5' },
  'two-stocks-pick': { primary: '#8B5CF6', secondary: '#6D28D9', soft: '#EDE9FE' },
  'institutional-market-timing': { primary: '#14B8A6', secondary: '#0F766E', soft: '#CCFBF1' },
  'us-bond-market': { primary: '#6366F1', secondary: '#4338CA', soft: '#E0E7FF' },
  'futures-market': { primary: '#EF4444', secondary: '#B91C1C', soft: '#FEE2E2' },
};

const PRODUCT_HERO_IMAGES = {
  'annual-letter': 'https://rajeevprakash.com/wp-content/uploads/2026/01/AstroDunia-Annual-Letter-2026-cover.png',
  'live-signals': 'https://rajeevprakash.com/wp-content/uploads/2025/11/Live-signals-scaled.jpg',
  'daily-newsletter': 'https://rajeevprakash.com/wp-content/uploads/2026/01/Professional-Traders.webp',
  'global-commodities': 'https://rajeevprakash.com/wp-content/uploads/2026/01/global-health-spending.webp',
  'two-stocks-pick': 'https://rajeevprakash.com/wp-content/uploads/2026/02/SGX-Dividend-Stocks-.webp',
  'institutional-market-timing': 'https://rajeevprakash.com/wp-content/uploads/2026/01/InstitutionalMarket-1.webp',
  'us-bond-market': 'https://rajeevprakash.com/wp-content/uploads/2025/11/Intraday-Reversal-Zones-For-U.S.-Index-Futures-2-1.png',
  'futures-market':
    'https://rajeevprakash.com/wp-content/uploads/2024/10/DALL·E-2024-10-14-09.48.41-A-simple-and-attractive-digital-chart-representing-stock-market-index-futures-with-minimalistic-upward-and-downward-trend-lines.-The-design-features-a.webp',
};

const ProductDetail = ({ navigation, route }) => {
  const { themeColors } = useUser();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const styles = useMemo(() => createStyles(themeColors, isCompact), [themeColors, isCompact]);

  const productId = route?.params?.productId;
  const product = getProductById(productId);
  const ProductIcon = ICON_MAP[product.iconKey] || FileText;
  const visual = VISUAL_THEMES[product.id] || VISUAL_THEMES['annual-letter'];
  const heroImage = PRODUCT_HERO_IMAGES[product.id];

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={18} color={themeColors.textPrimary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText style={styles.title}>{product.title}</AppText>
            <AppText style={styles.subtitle}>Product landing page</AppText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            {heroImage ? (
              <View style={styles.heroImageWrap}>
                <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="contain" />
                <View style={[styles.mediaChip, styles.heroImageChip, { backgroundColor: '#FFFFFF' }]}>
                  <ProductIcon size={16} color={visual.primary} />
                  <AppText style={[styles.mediaChipText, { color: '#0F172A' }]}>{product.title}</AppText>
                </View>
              </View>
            ) : (
              <View style={[styles.heroMedia, { backgroundColor: visual.soft }]}>
                <View style={[styles.mediaBlobA, { backgroundColor: visual.primary }]} />
                <View style={[styles.mediaBlobB, { backgroundColor: visual.secondary }]} />
                <View style={[styles.mediaChip, { backgroundColor: '#FFFFFF' }]}>
                  <ProductIcon size={16} color={visual.primary} />
                  <AppText style={[styles.mediaChipText, { color: '#0F172A' }]}>Market Timing</AppText>
                </View>
              </View>
            )}
            <View style={styles.heroTextWrap}>
              <AppText style={styles.heroHeading}>{product.title}</AppText>
              <AppText style={styles.heroIntro}>{product.intro}</AppText>
            </View>
            <View style={styles.metricRow}>
              <View style={[styles.metricCard, { backgroundColor: visual.soft, borderColor: visual.primary }]}>
                <AppText style={[styles.metricValue, { color: visual.secondary }]}>Daily</AppText>
                <AppText style={styles.metricLabel}>Updates</AppText>
              </View>
              <View style={[styles.metricCard, { backgroundColor: '#E0F2FE', borderColor: '#38BDF8' }]}>
                <AppText style={[styles.metricValue, { color: '#0369A1' }]}>Pro</AppText>
                <AppText style={styles.metricLabel}>Research</AppText>
              </View>
              <View style={[styles.metricCard, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
                <AppText style={[styles.metricValue, { color: '#047857' }]}>Fast</AppText>
                <AppText style={styles.metricLabel}>Reading</AppText>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}>
                <FileText size={14} color="#1D4ED8" />
              </View>
              <AppText style={styles.sectionTitle}>About Section</AppText>
            </View>
            <AppText style={styles.paragraph}>{product.about}</AppText>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
                <Sparkles size={14} color="#B45309" />
              </View>
              <AppText style={styles.sectionTitle}>What You Get</AppText>
            </View>
            <View style={styles.listWrap}>
              {product.highlights.map((item) => (
                <View key={item} style={styles.listRow}>
                  <CheckCircle2 size={14} color="#059669" style={styles.listIcon} />
                  <AppText style={styles.listText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD' }]}>
                <Users2 size={14} color="#6D28D9" />
              </View>
              <AppText style={styles.sectionTitle}>Who It Is For</AppText>
            </View>
            <View style={styles.listWrap}>
              {product.audience.map((item) => (
                <View key={item} style={styles.listRow}>
                  <CheckCircle2 size={14} color="#6366F1" style={styles.listIcon} />
                  <AppText style={styles.listText}>{item}</AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#CCFBF1', borderColor: '#5EEAD4' }]}>
                <Layers3 size={14} color="#0F766E" />
              </View>
              <AppText style={styles.sectionTitle}>Reading Experience</AppText>
            </View>
            <AppText style={styles.paragraph}>
              This landing page is designed for fast reading on mobile: bold title hierarchy, clean spacing, and high-contrast icon markers
              so users can scan the content quickly before diving deeper.
            </AppText>
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
    header: {
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCopy: {
      flex: 1,
      gap: 3,
    },
    title: {
      color: colors.textPrimary,
      fontSize: isCompact ? 20 : 24,
      lineHeight: isCompact ? 26 : 30,
      fontFamily: 'NotoSans-ExtraBold',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: isCompact ? 11 : 12,
      lineHeight: isCompact ? 16 : 18,
      fontFamily: 'NotoSans-Medium',
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 120,
      gap: 12,
    },
    heroCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: isCompact ? 14 : 16,
      gap: 14,
    },
    heroMedia: {
      width: '100%',
      height: isCompact ? 140 : 162,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      padding: 12,
    },
    heroImageWrap: {
      width: '100%',
      height: isCompact ? 180 : 216,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      justifyContent: 'flex-end',
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    heroImageChip: {
      margin: 12,
      alignSelf: 'flex-start',
    },
    mediaBlobA: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      top: -48,
      left: -28,
      opacity: 0.82,
    },
    mediaBlobB: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      right: -50,
      bottom: -70,
      opacity: 0.88,
    },
    mediaChip: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.12)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    mediaChipText: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: 'NotoSans-SemiBold',
    },
    heroTextWrap: {
      gap: 4,
    },
    heroHeading: {
      color: colors.textPrimary,
      fontSize: isCompact ? 18 : 20,
      lineHeight: isCompact ? 24 : 28,
      fontFamily: 'NotoSans-ExtraBold',
    },
    heroIntro: {
      color: colors.textMuted,
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 18 : 20,
      fontFamily: 'NotoSans-Regular',
    },
    metricRow: {
      flexDirection: 'row',
      gap: 8,
    },
    metricCard: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 1,
    },
    metricValue: {
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 16 : 17,
      fontFamily: 'NotoSans-SemiBold',
      textAlign: 'center',
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: isCompact ? 10 : 11,
      lineHeight: isCompact ? 13 : 14,
      fontFamily: 'NotoSans-Medium',
      textAlign: 'center',
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: isCompact ? 13 : 15,
      gap: 10,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: isCompact ? 14 : 16,
      lineHeight: isCompact ? 20 : 22,
      fontFamily: 'NotoSans-SemiBold',
    },
    paragraph: {
      color: colors.textMuted,
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 19 : 21,
      fontFamily: 'NotoSans-Regular',
    },
    listWrap: {
      gap: 7,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    listIcon: {
      marginTop: 2,
    },
    listText: {
      color: colors.textMuted,
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 19 : 21,
      fontFamily: 'NotoSans-Regular',
      flex: 1,
    },
  });

export default ProductDetail;
