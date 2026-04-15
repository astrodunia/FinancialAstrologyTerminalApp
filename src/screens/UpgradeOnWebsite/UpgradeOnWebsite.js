import React, { useCallback, useMemo, useState } from 'react';
import { AppState, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ExternalLink, RefreshCcw, ShieldCheck } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import BackButtonHeader from '../../components/BackButtonHeader';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { usePlan } from '../../hooks/usePlan';
import { useUser } from '../../store/UserContext';

const WEBSITE_PLANS_URL = 'https://finance.rajeevprakash.com/plans';

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
      paddingHorizontal: 12,
      paddingBottom: 120,
      gap: 16,
    },
    card: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 18,
      gap: 12,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontFamily: 'NotoSans-ExtraBold',
    },
    body: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'NotoSans-Regular',
    },
    statusCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: 14,
      gap: 8,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontFamily: 'NotoSans-SemiBold',
    },
    statusMeta: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: 'NotoSans-Medium',
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 14,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
    secondaryButton: {
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
  });

export default function UpgradeOnWebsite({ navigation }) {
  const { themeColors } = useUser();
  const { plan, refreshPlan, isFetching } = usePlan();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [openError, setOpenError] = useState('');

  useFocusEffect(
    useCallback(() => {
      refreshPlan();
    }, [refreshPlan]),
  );

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshPlan();
      }
    });

    return () => subscription.remove();
  }, [refreshPlan]);

  const handleOpenWebsite = async () => {
    try {
      setOpenError('');
      await Linking.openURL(WEBSITE_PLANS_URL);
    } catch {
      setOpenError('Unable to open the website plans page right now.');
    }
  };

  return (
    <View style={styles.screen}>
      <GradientBackground>
        <BackButtonHeader colors={themeColors} onPress={() => navigation.goBack()} containerStyle={styles.header} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <AppText style={styles.title}>Upgrade on website</AppText>
            <AppText style={styles.body}>
              This app does not process payments. All subscriptions and upgrades happen on the website. When you return here,
              the app refreshes your plan from the backend and updates access automatically.
            </AppText>

            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <ShieldCheck size={16} color={themeColors.accent} />
                <AppText style={styles.statusTitle}>{plan?.title || 'No active plan'}</AppText>
              </View>
              <AppText style={styles.statusMeta}>
                {plan?.id ? `${plan.price} • ${plan.status || 'active'}` : 'No active plan found in current backend session'}
              </AppText>
              {plan?.expiresAt ? <AppText style={styles.statusMeta}>{`Expires: ${plan.expiresAt}`}</AppText> : null}
            </View>

            <Pressable style={styles.primaryButton} onPress={handleOpenWebsite}>
              <ExternalLink size={16} color="#FFFFFF" />
              <AppText style={styles.primaryButtonText}>Open website plans</AppText>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => refreshPlan()}>
              <RefreshCcw size={16} color={themeColors.textPrimary} />
              <AppText style={styles.secondaryButtonText}>{isFetching ? 'Refreshing...' : 'Refresh current plan'}</AppText>
            </Pressable>

            {openError ? <AppText style={styles.body}>{openError}</AppText> : null}
          </View>
        </ScrollView>

        <BottomTabs navigation={navigation} />
      </GradientBackground>
    </View>
  );
}
