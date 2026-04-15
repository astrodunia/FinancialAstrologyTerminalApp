import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CheckCircle2, ShieldCheck } from 'lucide-react-native';
import AppText from '../../components/AppText';
import BackButtonHeader from '../../components/BackButtonHeader';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';

const SECTIONS = [
  {
    title: 'Information We Collect',
    body:
      'We collect the information needed to operate the Financial Astrology Terminal, personalize the experience, and protect account access.',
    items: [
      'Account details such as your name, email address, and profile information.',
      'Subscription and billing records such as plan, renewal status, payment status, and transaction metadata.',
      'Device, browser, and usage information such as IP address, operating system, search activity, visited screens, and feature usage.',
      'Support and feedback data when you contact us or share screenshots, notes, or requests.',
      'Aggregated or anonymized trends to improve the platform without identifying specific users.',
    ],
  },
  {
    title: 'How We Use Information',
    body:
      'Your information is used to run the platform securely, deliver product features, and improve service quality.',
    items: [
      'Create, maintain, and secure your account and authenticated sessions.',
      'Deliver dashboards, research, alerts, watchlists, and account-related notifications.',
      'Process subscriptions, billing, renewals, and payment-related communication.',
      'Remember preferences and improve reliability, usability, and research relevance.',
      'Detect fraud, prevent abuse, and comply with legal or regulatory obligations.',
    ],
  },
  {
    title: 'When We Share Information',
    body:
      'We do not sell your personal data. Information is shared only when necessary to operate the service or comply with law.',
    items: [
      'With trusted service providers such as infrastructure, analytics, email, or payment vendors.',
      'When you explicitly ask us to connect your account to another service or workflow.',
      'During a merger, acquisition, or transfer of assets under appropriate confidentiality protections.',
      'When required by law, legal process, or to protect the rights, safety, and integrity of the platform.',
    ],
  },
  {
    title: 'Data Retention',
    body:
      'We retain personal data only as long as required for the purposes described in this policy or by law.',
    items: [
      'Account and subscription data are kept while your account is active and for a reasonable period after that.',
      'Billing records are retained in line with tax, accounting, and regulatory requirements.',
      'Logs and security records are retained for a limited time to investigate issues and protect the service.',
      'Data that is no longer needed is deleted, anonymized, or archived securely depending on legal obligations.',
    ],
  },
  {
    title: 'Security',
    body:
      'We use reasonable technical and organizational safeguards, though no online system can be guaranteed 100 percent secure.',
    items: [
      'Encryption in transit where appropriate and restricted access to production systems.',
      'Monitoring and logging to identify suspicious activity and unauthorized access attempts.',
      'Access to personal data is limited to people and providers who need it for legitimate business purposes.',
    ],
  },
  {
    title: 'Your Rights & Choices',
    body:
      'Depending on your location, you may have rights over how your personal data is accessed, corrected, deleted, or restricted.',
    items: [
      'You may request access to the personal data we hold about you.',
      'You may request correction of inaccurate or incomplete information.',
      'You may request deletion or restriction where applicable by law.',
      'You can opt out of non-essential marketing communications at any time.',
    ],
  },
  {
    title: 'Third-Party Services & Links',
    body:
      'The platform may integrate with external services that have their own privacy practices.',
    items: [
      'Payment processors, analytics providers, communication tools, and other external vendors may process data on our behalf.',
      'External links and tools operate under their own privacy policies and terms.',
      'You should review the privacy terms of any third-party site before sharing personal information there.',
    ],
  },
  {
    title: 'Children’s Privacy',
    body:
      'The Financial Astrology Terminal is intended for adult and professional users.',
    items: [
      'We do not knowingly collect personal data from children under the minimum legal age.',
      'If you believe a child has submitted personal data to us, contact us so we can investigate and remove it where required.',
    ],
  },
  {
    title: 'Changes to This Policy',
    body:
      'We may revise this policy as the product, legal requirements, or business practices evolve.',
    items: [
      'The Last updated date at the top of this screen reflects the latest revision.',
      'Material changes may also be communicated through email or prominent product notices.',
    ],
  },
  {
    title: 'Contact',
    body:
      'If you have questions about privacy or want to exercise your rights, contact us directly.',
    items: [
      'Email: pr@rajeevprakash.com',
      'Include the email address tied to your account so we can locate your records efficiently.',
    ],
  },
];

const PrivacyPolicy = ({ navigation }) => {
  const { themeColors } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <View style={styles.screen}>
      <GradientBackground>
        <BackButtonHeader colors={themeColors} onPress={() => navigation.goBack()} containerStyle={styles.header} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowTop} />
            <View style={styles.heroGlowBottom} />
            <View style={styles.heroIcon}>
              <ShieldCheck size={20} color={themeColors.accent} />
            </View>
            <View style={styles.heroTextWrap}>
              <View style={styles.heroBadge}>
                <AppText style={styles.heroBadgeText}>Privacy & Data</AppText>
              </View>
              <AppText style={styles.heroTitle}>Clear privacy terms for a data-sensitive trading workflow.</AppText>
              <AppText style={styles.heroBody}>
                This policy explains what data we collect, why we collect it, how long we keep it, and the choices you have over your information.
              </AppText>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <AppText style={styles.summaryLabel}>Primary Use</AppText>
              <AppText style={styles.summaryValue}>Account, billing, alerts</AppText>
            </View>
            <View style={styles.summaryPill}>
              <AppText style={styles.summaryLabel}>Your Control</AppText>
              <AppText style={styles.summaryValue}>Access, correction, deletion</AppText>
            </View>
            <View style={styles.summaryPill}>
              <AppText style={styles.summaryLabel}>Contact</AppText>
              <AppText style={styles.summaryValue}>Direct support for privacy requests</AppText>
            </View>
          </View>

          {SECTIONS.map((section, index) => (
            <View key={section.title} style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionIndex}>
                  <AppText style={styles.sectionIndexText}>{String(index + 1).padStart(2, '0')}</AppText>
                </View>
                <View style={styles.sectionTitleWrap}>
                  <AppText style={styles.sectionEyebrow}>Policy Section</AppText>
                  <AppText style={styles.sectionTitle}>{section.title}</AppText>
                </View>
              </View>
              <AppText style={styles.sectionBody}>{section.body}</AppText>

              <View style={styles.listWrap}>
                {section.items.map((item) => (
                  <View key={item} style={styles.listRow}>
                    <CheckCircle2 size={15} color={themeColors.positive} />
                    <AppText style={styles.listText}>{item}</AppText>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.footerCard}>
            <AppText style={styles.footerTitle}>Questions about your data?</AppText>
            <AppText style={styles.footerBody}>
              Open Support if you need help with account access, billing, alerts, or privacy-related requests.
            </AppText>
            <Pressable style={styles.footerButton} onPress={() => navigation.navigate('Support')}>
              <AppText style={styles.footerButtonText}>Open support center</AppText>
            </Pressable>
          </View>
        </ScrollView>

        <BottomTabs navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      gap: 16,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 32,
      gap: 16,
    },
    heroCard: {
      position: 'relative',
      overflow: 'hidden',
      marginTop: 8,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 22,
      gap: 14,
    },
    heroGlowTop: {
      position: 'absolute',
      top: -36,
      right: -24,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.accent,
      opacity: 0.14,
    },
    heroGlowBottom: {
      position: 'absolute',
      bottom: -46,
      left: -16,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: colors.positive,
      opacity: 0.1,
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroTextWrap: {
      gap: 8,
    },
    heroBadge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    heroBadgeText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: 'NotoSans-SemiBold',
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 31,
      fontFamily: 'NotoSans-ExtraBold',
    },
    heroBody: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
      maxWidth: '96%',
    },
    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    summaryPill: {
      minWidth: '30%',
      flexGrow: 1,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      paddingHorizontal: 15,
      paddingVertical: 14,
      gap: 6,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: 'NotoSans-Medium',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'NotoSans-SemiBold',
    },
    sectionCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 18,
      gap: 12,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    sectionIndex: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionIndexText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontFamily: 'NotoSans-ExtraBold',
    },
    sectionTitleWrap: {
      flex: 1,
      gap: 3,
    },
    sectionEyebrow: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: 'NotoSans-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 17,
      lineHeight: 23,
      fontFamily: 'NotoSans-ExtraBold',
    },
    sectionBody: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    listWrap: {
      gap: 10,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    listText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    footerCard: {
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 20,
      gap: 12,
      marginBottom: 12,
    },
    footerTitle: {
      color: colors.textPrimary,
      fontSize: 20,
      lineHeight: 26,
      fontFamily: 'NotoSans-ExtraBold',
    },
    footerBody: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
    footerButton: {
      marginTop: 4,
      alignSelf: 'flex-start',
      minHeight: 46,
      borderRadius: 16,
      paddingHorizontal: 18,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
  });

export default PrivacyPolicy;
