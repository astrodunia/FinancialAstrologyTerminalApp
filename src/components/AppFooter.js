import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  Twitter,
} from 'lucide-react-native';
import AppText from './AppText';
import { useUser } from '../store/UserContext';

const FOOTER_GROUPS = [
  {
    title: 'PRODUCTS',
    links: [
      'Annual Letter',
      'Live Signals',
      'Daily Newsletter',
      'Global Commodities',
      'Two Stocks Pick',
      'Institutional Market Timing',
      'U.S. Bond Market',
      'Futures Dashboard',
    ],
  },
  {
    title: 'FINANCIAL FORECAST',
    links: [
      'SPX500 Forecast',
      'Nasdaq Prediction',
      'Dow Forecast',
      'Russell Prediction',
      'Gold Prediction',
      'Silver Prediction',
      'Copper Prediction',
      'U.S. Stock Market',
    ],
  },
  {
    title: 'TOOLS',
    links: [
      'How to Guide',
      'Investing Basics',
      'Assets',
      'Calculators',
      'Comparator',
      'Market Mood Index(MMI)',
      'Crypto Prediction',
      'Forex Prediction',
    ],
  },
  {
    title: 'QUICK LINKS',
    links: [
      'About Us',
      'Financial Astrology Terminal',
      'Blogs',
      'Support',
      'Guide',
      'Privacy Policy',
    ],
  },
];

const SOCIALS = [
  { key: 'twitter', Icon: Twitter },
  { key: 'linkedin', Icon: Linkedin },
  { key: 'facebook', Icon: Facebook },
  { key: 'instagram', Icon: Instagram },
  { key: 'mail', Icon: Mail },
  { key: 'chat', Icon: MessageCircle },
];

const AppFooter = () => {
  const { themeColors } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <View style={styles.footer}>
      <View style={styles.brandRow}>
        <View style={styles.brandBadge}>
          <AppText style={styles.brandBadgeText}>RP</AppText>
        </View>
        <View>
          <AppText style={styles.brandName}>Rajeev Prakash Finance</AppText>
          <AppText style={styles.brandSite}>finance.rajeevprakash.com</AppText>
        </View>
      </View>

      <AppText style={styles.brandDesc}>
        Advanced charts, drawing tools, and research to navigate markets confidently.
      </AppText>

      <View style={styles.socialRow}>
        {SOCIALS.map((item) => {
          const Icon = item.Icon;
          return (
            <Pressable key={item.key} style={styles.socialBtn}>
              <Icon size={15} color={themeColors.textPrimary} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.columnsWrap}>
        {FOOTER_GROUPS.map((group) => (
          <View key={group.title} style={styles.groupCol}>
            <AppText style={styles.groupTitle}>{group.title}</AppText>
            {group.links.map((link) => (
              <Pressable key={link} style={styles.linkRow}>
                <AppText style={styles.linkText}>{link}</AppText>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    footer: {
      marginTop: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: '#071738',
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    brandBadge: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: '#d8302f',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '800',
    },
    brandName: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    brandSite: {
      color: '#8ca3cc',
      fontSize: 12,
      marginTop: 2,
    },
    brandDesc: {
      color: '#cfdbf8',
      fontSize: 14,
      lineHeight: 20,
    },
    socialRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    socialBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'rgba(255,255,255,0.02)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    columnsWrap: {
      flexDirection: 'column',
      gap: 12,
    },
    groupCol: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'rgba(255,255,255,0.03)',
      paddingHorizontal: 10,
      paddingVertical: 10,
      gap: 5,
    },
    groupTitle: {
      color: '#f2f6ff',
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
      marginBottom: 4,
    },
    linkRow: {
      paddingVertical: 1,
    },
    linkText: {
      color: '#d9e4ff',
      fontSize: 14,
      lineHeight: 19,
    },
  });

export default AppFooter;
