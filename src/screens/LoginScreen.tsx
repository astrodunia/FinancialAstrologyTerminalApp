import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Apple, Chrome, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react-native';
import AppText from '../components/AppText';
import AppTextInput from '../components/AppTextInput';
import GradientBackground from '../components/GradientBackground';
import { loginWithPasswordRequest } from '../auth/authService';
import TakeoverDialog from '../components/TakeoverDialog';
import { useAuth } from '../auth/AuthProvider';
import { API_BASE_URL } from '../utils/apiBaseUrl';
import { networkHintForAndroidLoopback } from '../utils/networkDebug';
import { useUser } from '../store/UserContext';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const MAX_WIDTH = 430;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(MAX_WIDTH, SCREEN_WIDTH - 28);
const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 16;

const createPalette = (themeColors: any, theme: string) => ({
  ...themeColors,
  brandAccent: themeColors.accent,
  brandChipBg: theme === 'dark' ? 'rgba(201, 168, 255, 0.12)' : 'rgba(110, 89, 207, 0.10)',
  brandChipBorder: theme === 'dark' ? 'rgba(201, 168, 255, 0.20)' : 'rgba(110, 89, 207, 0.14)',
  cardBg: theme === 'dark' ? 'rgba(14, 18, 28, 0.84)' : 'rgba(255, 255, 255, 0.95)',
  cardBorder: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(13, 27, 42, 0.08)',
  cardGlossTop: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.50)',
  inputBg: theme === 'dark' ? 'rgba(20, 24, 34, 0.92)' : 'rgba(248, 250, 255, 0.96)',
  inputBorder: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(13, 27, 42, 0.10)',
  socialBg: theme === 'dark' ? 'rgba(20, 24, 34, 0.88)' : 'rgba(250, 252, 255, 0.98)',
  socialBorder: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(13, 27, 42, 0.10)',
  socialDisabledBg: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(13, 27, 42, 0.04)',
  progressBg: theme === 'dark' ? 'rgba(201, 168, 255, 0.10)' : 'rgba(110, 89, 207, 0.08)',
  progressBorder: theme === 'dark' ? 'rgba(201, 168, 255, 0.22)' : 'rgba(110, 89, 207, 0.14)',
  primaryBg: themeColors.accent,
  primaryText: theme === 'dark' ? '#0B0B0C' : '#FFFFFF',
  success: themeColors.positive,
  danger: themeColors.negative,
});

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { theme, themeColors } = useUser() as any;
  const { signInWithGoogle, signInWithApple, isAppleSupported, getOrCreateDeviceId, setAuthSession, syncSession } = useAuth();
  const colors = useMemo(() => createPalette(themeColors, theme), [theme, themeColors]);
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<'google' | 'apple' | ''>('');
  const [socialProgressMessage, setSocialProgressMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [statusMessage, setStatusMessage] = useState('');
  const [takeoverVisible, setTakeoverVisible] = useState(false);
  const [takeoverResolver, setTakeoverResolver] = useState<((confirmed: boolean) => void) | null>(null);

  const requestTakeoverConfirmation = async (): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setTakeoverResolver(() => resolve);
      setTakeoverVisible(true);
    });
  };

  const resetTakeoverDialog = (confirmed: boolean) => {
    setTakeoverVisible(false);
    takeoverResolver?.(confirmed);
    setTakeoverResolver(null);
  };

  const applyBackendSession = async (data: any, deviceId: string) => {
    await setAuthSession({
      token: data?.token || '',
      refreshToken: data?.refresh_token || '',
      deviceId,
      user: data?.user || data?.data?.user || data?.session?.user || data?.data || null,
      firstLogin: Boolean(data?.firstLogin),
    });
    await syncSession().catch(() => null);
  };

  const handlePasswordLogin = async () => {
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      setStatusType('error');
      setStatusMessage('Username is required.');
      return;
    }

    if (!password) {
      setStatusType('error');
      setStatusMessage('Password is required.');
      return;
    }

    setIsPasswordSubmitting(true);
    setStatusType('');
    setStatusMessage('');

    try {
      const deviceId = await getOrCreateDeviceId();
      const data = await loginWithPasswordRequest(trimmedUsername, password, deviceId, requestTakeoverConfirmation);
      await applyBackendSession(data, deviceId);
      setStatusType('success');
      setStatusMessage('Login successful.');
    } catch (error: any) {
      const loopbackHint = networkHintForAndroidLoopback({ apiBaseUrl: API_BASE_URL, error });
      setStatusType('error');
      setStatusMessage(loopbackHint || error?.message || 'Login failed. Please try again.');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    if (provider === 'apple' && !isAppleSupported) {
      return;
    }

    setSocialLoadingProvider(provider);
    setSocialProgressMessage('');
    setStatusType('');
    setStatusMessage('');

    try {
      if (provider === 'google') {
        await signInWithGoogle(requestTakeoverConfirmation, setSocialProgressMessage);
      } else {
        await signInWithApple(requestTakeoverConfirmation, setSocialProgressMessage);
      }

      setStatusType('success');
      setStatusMessage(`Signed in with ${provider === 'google' ? 'Google' : 'Apple'}.`);
    } catch (error: any) {
      const loopbackHint = networkHintForAndroidLoopback({ apiBaseUrl: API_BASE_URL, error });
      const nextMessage =
        error?.message === 'Sign-in cancelled.'
          ? ''
          : loopbackHint || error?.message || 'Sign-in failed. Please try again.';

      setStatusType(nextMessage ? 'error' : '');
      setStatusMessage(nextMessage);
    } finally {
      setSocialLoadingProvider('');
      setSocialProgressMessage('');
    }
  };

  const isAnySocialLoading = Boolean(socialLoadingProvider);
  const isAppleDisabled = !isAppleSupported;

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientBackground>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.brandPill}>
              <Sparkles size={14} color={colors.brandAccent} />
              <AppText style={styles.brandPillText}>Financial Astrology Terminal</AppText>
            </View>
            <View style={styles.securityBadge}>
              <ShieldCheck size={16} color={colors.brandAccent} />
            </View>
          </View>

          <View style={styles.copyBlock}>
            <AppText style={styles.brandTitle}>Sign in</AppText>
            <AppText style={styles.brandSubtitle}>
              Continue to your Financial Astrology Terminal
            </AppText>
          </View>

          <View style={styles.card}>
            <View style={styles.cardGlossTop} />

            <View style={styles.field}>
              <AppText style={styles.label}>Username</AppText>
              <View style={styles.inputRow}>
                <Mail size={18} color={colors.textMuted} />
                <AppTextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username or email"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  editable={!isPasswordSubmitting}
                />
              </View>
            </View>

            <View style={styles.field}>
              <AppText style={styles.label}>Password</AppText>
              <View style={styles.inputRow}>
                <Lock size={18} color={colors.textMuted} />
                <AppTextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  editable={!isPasswordSubmitting}
                />
                <Pressable disabled={isPasswordSubmitting} onPress={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                </Pressable>
              </View>
            </View>

            <View style={styles.rowBetween}>
              <Pressable style={styles.checkRow} onPress={() => setRemember((prev) => !prev)}>
                <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                  {remember ? <AppText style={styles.checkboxMark}>✓</AppText> : null}
                </View>
                <AppText style={styles.checkLabel}>Remember me</AppText>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <AppText style={styles.link}>Create an Account</AppText>
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryButton, isPasswordSubmitting && styles.disabledButton]}
              onPress={handlePasswordLogin}
              disabled={isPasswordSubmitting}
            >
              <AppText style={styles.primaryText}>{isPasswordSubmitting ? 'Signing in...' : 'Sign in'}</AppText>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <AppText style={styles.dividerText}>or continue with</AppText>
              <View style={styles.divider} />
            </View>

            <Pressable
              style={[
                styles.socialButton,
                socialLoadingProvider === 'google' && styles.socialButtonActive,
              ]}
              onPress={() => handleSocialLogin('google')}
              disabled={isAnySocialLoading}
            >
              <View style={styles.socialIconCircle}>
                {socialLoadingProvider === 'google' ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Chrome size={14} color={colors.textPrimary} />
                )}
              </View>
              <AppText style={styles.socialText}>
                {socialLoadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
              </AppText>
            </Pressable>

            <Pressable
              style={[
                styles.socialButton,
                isAppleDisabled && styles.socialButtonDisabled,
                socialLoadingProvider === 'apple' && styles.socialButtonActive,
              ]}
              onPress={() => handleSocialLogin('apple')}
              disabled={isAnySocialLoading || isAppleDisabled}
            >
              <View style={styles.socialIconCircle}>
                {socialLoadingProvider === 'apple' ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Apple size={14} color={isAppleDisabled ? colors.textMuted : colors.textPrimary} />
                )}
              </View>
              <AppText style={[styles.socialText, isAppleDisabled && styles.socialTextMuted]}>
                {isAppleDisabled
                  ? 'Apple sign-in unavailable'
                  : socialLoadingProvider === 'apple'
                  ? 'Connecting to Apple...'
                  : 'Continue with Apple'}
              </AppText>
            </Pressable>

            {socialProgressMessage ? (
              <View style={styles.progressPanel}>
                <ActivityIndicator size="small" color={colors.brandAccent} />
                <AppText style={styles.progressText}>{socialProgressMessage}</AppText>
              </View>
            ) : null}

            {statusMessage ? (
              <AppText style={statusType === 'success' ? styles.successText : styles.errorText}>{statusMessage}</AppText>
            ) : null}

            <View style={styles.footerRow}>
              <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                <AppText style={styles.link}>Forgot password?</AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <TakeoverDialog
          visible={takeoverVisible}
          onCancel={() => resetTakeoverDialog(false)}
          onConfirm={() => resetTakeoverDialog(true)}
        />
      </GradientBackground>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, theme: string) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 14,
      paddingTop: TOP_INSET,
      paddingBottom: 28,
      gap: 14,
      alignItems: 'center',
    },
    headerRow: {
      width: '100%',
      maxWidth: CARD_WIDTH,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brandPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.brandChipBg,
      borderWidth: 1,
      borderColor: colors.brandChipBorder,
    },
    brandPillText: {
      color: colors.brandAccent,
      fontSize: 12,
      fontFamily: FONT.medium,
    },
    securityBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.brandChipBorder,
      backgroundColor: colors.brandChipBg,
    },
    copyBlock: {
      width: '100%',
      maxWidth: CARD_WIDTH,
      gap: 6,
    },
    brandTitle: {
      color: colors.textPrimary,
      fontSize: 30,
      lineHeight: 36,
      fontFamily: FONT.extraBold,
    },
    brandSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: FONT.regular,
    },
    card: {
      width: '100%',
      maxWidth: CARD_WIDTH,
      backgroundColor: colors.cardBg,
      borderRadius: 22,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 16,
      shadowColor: '#000',
      shadowOpacity: theme === 'dark' ? 0.22 : 0.12,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 26,
      elevation: 6,
      overflow: 'hidden',
    },
    cardGlossTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 86,
      backgroundColor: colors.cardGlossTop,
    },
    field: {
      gap: 8,
    },
    label: {
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
      fontSize: 13,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.inputBg,
      borderRadius: 14,
      paddingHorizontal: 13,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      minHeight: 52,
    },
    input: {
      flex: 1,
      color: colors.textPrimary,
      paddingVertical: 10,
      fontFamily: FONT.regular,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    checkboxActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    checkboxMark: {
      color: colors.primaryText,
      fontSize: 12,
      fontFamily: FONT.extraBold,
    },
    checkLabel: {
      color: colors.textMuted,
      fontFamily: FONT.semiBold,
      fontSize: 13,
    },
    primaryButton: {
      backgroundColor: colors.primaryBg,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.22,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 14,
      elevation: 7,
    },
    primaryText: {
      color: colors.primaryText,
      fontFamily: FONT.semiBold,
      fontSize: 15,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: FONT.regular,
    },
    socialButton: {
      borderWidth: 1,
      borderColor: colors.socialBorder,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.socialBg,
      flexDirection: 'row',
      gap: 8,
    },
    socialButtonActive: {
      borderColor: colors.brandAccent,
      backgroundColor: colors.progressBg,
    },
    socialButtonDisabled: {
      backgroundColor: colors.socialDisabledBg,
      opacity: 0.72,
    },
    socialIconCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    socialText: {
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
      fontSize: 13,
    },
    socialTextMuted: {
      color: colors.textMuted,
    },
    progressPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.progressBorder,
      backgroundColor: colors.progressBg,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    progressText: {
      flex: 1,
      color: colors.textPrimary,
      fontFamily: FONT.medium,
      fontSize: 12,
    },
    disabledButton: {
      opacity: 0.65,
    },
    successText: {
      color: colors.success,
      fontFamily: FONT.medium,
      fontSize: 12,
    },
    errorText: {
      color: colors.danger,
      fontFamily: FONT.medium,
      fontSize: 12,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: 4,
    },
    link: {
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
      fontSize: 13,
    },
  });
