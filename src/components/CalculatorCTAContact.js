import React, { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import AppText from './AppText';
import { useUser } from '../store/UserContext';

const FONT = {
  semiBold: 'NotoSans-SemiBold',
};

const CalculatorCTAContact = () => {
  const { theme, themeColors } = useUser();
  const { width } = useWindowDimensions();
  const isLight = theme === 'light';
  const compact = width < 380;
  const styles = useMemo(() => createStyles(themeColors, isLight, compact), [themeColors, isLight, compact]);

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      // no-op
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <View>
          <AppText style={styles.bannerTitle}>Trade gold with discipline, not emotion</AppText>
          <AppText style={styles.bannerBody}>
            Get real-time entries, exits, and risk levels with daily context and timing.
          </AppText>
        </View>
        <View style={styles.bannerActions}>
          <Pressable style={styles.bannerBtn} onPress={() => openLink('https://finance.rajeevprakash.com/products/live-signals/')}>
            <AppText style={styles.bannerBtnText}>Join Live Signals</AppText>
          </Pressable>
          <Pressable style={styles.bannerBtnGhost} onPress={() => openLink('https://finance.rajeevprakash.com/products/daily-newsletter/')}>
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
            <Pressable style={styles.contactItem} onPress={() => openLink('tel:+919669919000')}>
              <AppText style={styles.contactItemText}>+91-96699-19000</AppText>
            </Pressable>
            <Pressable style={styles.contactItem} onPress={() => openLink('mailto:pr@rajeevprakash.com')}>
              <AppText style={styles.contactItemText}>pr@rajeevprakash.com</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors, isLight, compact) =>
  StyleSheet.create({
    wrap: {
      gap: 10,
      marginTop: 4,
    },
    banner: {
      borderRadius: compact ? 10 : 12,
      borderWidth: 1,
      borderColor: isLight ? '#8fb2ff' : 'rgba(89,134,255,0.4)',
      backgroundColor: isLight ? '#d9e9ff' : '#1f59bd',
      padding: compact ? 10 : 12,
      gap: 10,
    },
    bannerTitle: {
      color: isLight ? '#0f2f66' : '#f2f8ff',
      fontSize: compact ? 14 : 16,
      fontFamily: FONT.semiBold,
    },
    bannerBody: {
      color: isLight ? '#31578f' : '#dceafe',
      fontSize: compact ? 11 : 12,
      marginTop: 2,
    },
    bannerActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    bannerBtn: {
      borderRadius: 999,
      backgroundColor: '#ffffff',
      paddingHorizontal: compact ? 10 : 12,
      paddingVertical: compact ? 6 : 7,
    },
    bannerBtnText: {
      color: '#184ea7',
      fontSize: compact ? 11 : 12,
      fontFamily: FONT.semiBold,
    },
    bannerBtnGhost: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isLight ? 'transparent' : 'rgba(255,255,255,0.7)',
      backgroundColor: isLight ? '#ffffff' : 'transparent',
      paddingHorizontal: compact ? 10 : 12,
      paddingVertical: compact ? 6 : 7,
    },
    bannerBtnGhostText: {
      color: isLight ? '#2b5cab' : '#ffffff',
      fontSize: compact ? 11 : 12,
      fontFamily: FONT.semiBold,
    },
    contactWrap: {
      alignItems: 'center',
      gap: 8,
      paddingBottom: compact ? 4 : 6,
    },
    contactTag: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    contactTagText: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: FONT.semiBold,
    },
    contactTitle: {
      color: colors.textPrimary,
      fontSize: compact ? 20 : 22,
      lineHeight: compact ? 25 : 28,
      fontFamily: FONT.semiBold,
      textAlign: 'center',
    },
    contactCard: {
      width: '100%',
      borderRadius: compact ? 9 : 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: compact ? 9 : 10,
      gap: 5,
    },
    contactHead: {
      color: colors.textPrimary,
      fontSize: compact ? 16 : 20,
      lineHeight: compact ? 22 : 26,
      fontFamily: FONT.semiBold,
    },
    contactSub: {
      color: colors.textMuted,
      fontSize: compact ? 12 : 13,
      lineHeight: compact ? 16 : 18,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    contactItem: {
      flexGrow: 1,
      flexBasis: compact ? '100%' : 0,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: compact ? 9 : 10,
      paddingVertical: compact ? 7 : 8,
    },
    contactItemText: {
      color: colors.textPrimary,
      fontSize: compact ? 13 : 14,
    },
  });

export default CalculatorCTAContact;
