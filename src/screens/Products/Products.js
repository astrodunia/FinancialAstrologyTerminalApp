import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Activity,
  ArrowLeft,
  Briefcase,
  Building2,
  FileText,
  Globe,
  Landmark,
  Newspaper,
  Radio,
  TrendingUp,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';
import { PRODUCT_CATALOG } from './productCatalog';

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

const Products = ({ navigation }) => {
  const { themeColors } = useUser();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const styles = useMemo(() => createStyles(themeColors, isCompact), [themeColors, isCompact]);

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={18} color={themeColors.textPrimary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText style={styles.title}>Explore Products</AppText>
            <AppText style={styles.subtitle}>Tap any card to open a detailed landing page.</AppText>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {PRODUCT_CATALOG.map((item) => {
            const Icon = ICON_MAP[item.iconKey] || FileText;

            return (
              <Pressable key={item.id} style={styles.card} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconWrap}>
                    <Icon size={20} color={themeColors.accent} />
                  </View>
                  <View style={styles.textWrap}>
                    <AppText style={styles.cardTitle}>{item.title}</AppText>
                    <AppText style={styles.cardDescription}>{item.intro}</AppText>
                  </View>
                </View>
                <View style={styles.badge}>
                  <Activity size={14} color={themeColors.textPrimary} />
                </View>
              </Pressable>
            );
          })}
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
      fontFamily: 'NotoSans-Regular',
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 120,
      gap: 10,
    },
    card: {
      minHeight: 112,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    cardLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
      gap: 2,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: isCompact ? 15 : 17,
      lineHeight: isCompact ? 21 : 24,
      fontFamily: 'NotoSans-SemiBold',
    },
    cardDescription: {
      color: colors.textMuted,
      fontSize: isCompact ? 11 : 12,
      lineHeight: isCompact ? 17 : 18,
      fontFamily: 'NotoSans-Regular',
    },
    badge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default Products;
