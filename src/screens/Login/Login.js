import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import { Apple, Chrome, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import DialogX from '../../components/DialogX';
import GradientBackground from '../../components/GradientBackground';
import { API_BASE_URL, useUser } from '../../store/UserContext';
import {
  logRequestError,
  logRequestStart,
  logResponse,
  networkHintForAndroidLoopback,
} from '../../utils/networkDebug';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const MAX_WIDTH = 420;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(MAX_WIDTH, SCREEN_WIDTH - 32);
const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 16;

const createPalette = (themeColors, theme) => ({
  ...themeColors,
  brandAccent: themeColors.accent,
  brandChipBg: themeColors.surfaceAlt,
  brandChipBorder: themeColors.border,
  cardBg: themeColors.surfaceGlass,
  cardBorder: themeColors.border,
  cardGlossTop: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.42)',
  inputBg: themeColors.surfaceAlt,
  inputBorder: themeColors.border,
  socialBg: themeColors.surfaceAlt,
  socialBorder: themeColors.border,
  primaryBg: themeColors.accent,
  primaryText: theme === 'dark' ? '#0B0B0C' : '#FFFFFF',
  success: themeColors.positive,
  danger: themeColors.negative,
});

const Login = ({ navigation }) => 
  {
  const { getOrCreateDeviceId, setAuthSession, theme, themeColors } = useUser();
  const colors = useMemo(() => createPalette(themeColors, theme), [theme, themeColors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [takeOverDialogVisible, setTakeOverDialogVisible] = useState(false);
  const [takeOverResolver, setTakeOverResolver] = useState(null);

  const showError = (message) => {
    setStatusType('error');
    setStatusMessage(message);
  };

  const performLogin = async ({ identifier, passwordValue, force }) => {
    const deviceId = await getOrCreateDeviceId();
    const loginUrl = `${API_BASE_URL}/api/auth/login`;

    logRequestStart({
      label: 'auth.login',
      url: loginUrl,
      method: 'POST',
      meta: {
        identifier,
        force,
        hasDeviceId: Boolean(deviceId),
        apiBaseUrl: API_BASE_URL,
      },
    });

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-device-id': deviceId,
      },
      body: JSON.stringify({
        email: identifier,
        password: passwordValue,
        device_id: deviceId,
        force,
      }),
    });
    await logResponse({ label: 'auth.login', response });

    const data = await response.json().catch(() => null);
    return { response, data, deviceId, loginUrl };
  };

  const handleLogin = async () => {
    const trimmedUsername = username.trim().toLowerCase();
    const loginUrl = `${API_BASE_URL}/api/auth/login`;

    if (!trimmedUsername) {
      showError('Username is required.');
      return;
    }

    if (!password) {
      showError('Password is required.');
      return;
    }

    setStatusType('');
    setStatusMessage('');
    setIsSubmitting(true);

    try {
      let { response, data, deviceId } = await performLogin({
        identifier: trimmedUsername,
        passwordValue: password,
        force: false,
      });
      console.log('[NetworkDebug] auth.login payload', {
        hasData: Boolean(data),
        keys: data && typeof data === 'object' ? Object.keys(data) : [],
      });

      if (response.status === 409 && data?.error === 'device_limit_reached') {
        const shouldTakeOver = await new Promise((resolve) => {
          setTakeOverResolver(() => resolve);
          setTakeOverDialogVisible(true);
        });

        if (!shouldTakeOver) {
          setStatusType('');
          setStatusMessage('');
          return;
        }

        ({ response, data, deviceId } = await performLogin({
          identifier: trimmedUsername,
          passwordValue: password,
          force: true,
        }));
      }

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || data?.errors?.[0]?.msg || 'Login failed. Please try again.',
        );
      }

      const responseUser = data?.user || data?.data?.user || data?.session?.user || data?.data || null;

      await setAuthSession({
        token: data?.token || '',
        refreshToken: data?.refresh_token || '',
        deviceId,
        identifier: trimmedUsername,
        user: responseUser,
      });

      setStatusType('success');
      setStatusMessage('Login successful.');
    } catch (error) {
      logRequestError({ label: 'auth.login', url: loginUrl, error });
      const loopbackHint = networkHintForAndroidLoopback({ apiBaseUrl: API_BASE_URL, error });
      showError(loopbackHint || error?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <AppText style={styles.brandTitle}>Welcome back</AppText>
          <AppText style={styles.brandSubtitle}>Sign in to continue to your dashboard</AppText>

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
                  editable={!isSubmitting}
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
                  editable={!isSubmitting}
                />
                <Pressable disabled={isSubmitting} onPress={() => setShowPassword((prev) => !prev)}>
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
              <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                <AppText style={styles.link}>Forgot password?</AppText>
              </Pressable>
            </View>

            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <AppText style={styles.primaryText}>{isSubmitting ? 'Signing in...' : 'Sign in'}</AppText>
            </Pressable>

            {!!statusMessage && (
              <AppText style={statusType === 'success' ? styles.successText : styles.errorText}>
                {statusMessage}
              </AppText>
            )}

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <AppText style={styles.dividerText}>or continue with</AppText>
              <View style={styles.divider} />
            </View>

            <Pressable style={styles.socialButton}>
              <View style={styles.socialIconCircle}>
                <Chrome size={14} color={colors.textPrimary} />
              </View>
              <AppText style={styles.socialText}>Continue with Google</AppText>
            </Pressable>
            <Pressable style={styles.socialButton}>
              <View style={styles.socialIconCircle}>
                <Apple size={14} color={colors.textPrimary} />
              </View>
              <AppText style={styles.socialText}>Continue with Apple</AppText>
            </Pressable>

            <View style={styles.footerRow}>
              <AppText style={styles.footerText}>Don't have an account?</AppText>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <AppText style={styles.link}>Create one</AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <DialogX
          visible={takeOverDialogVisible}
          tone="default"
          icon={ShieldCheck}
          title="Continue On This Device?"
          message="This account is already active on another device. If you continue here, the older login session will be revoked and this device will stay signed in."
          onRequestClose={() => {
            setTakeOverDialogVisible(false);
            takeOverResolver?.(false);
            setTakeOverResolver(null);
          }}
          actions={[
            {
              label: 'Cancel',
              variant: 'ghost',
              onPress: () => {
                setTakeOverDialogVisible(false);
                takeOverResolver?.(false);
                setTakeOverResolver(null);
              },
            },
            {
              label: 'Continue Here',
              variant: 'primary',
              onPress: () => {
                setTakeOverDialogVisible(false);
                takeOverResolver?.(true);
                setTakeOverResolver(null);
              },
            },
          ]}
        />
      </GradientBackground>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: TOP_INSET,
      paddingBottom: 24,
      gap: 16,
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
      paddingVertical: 6,
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
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.brandChipBorder,
      backgroundColor: colors.brandChipBg,
    },
    brandTitle: {
      color: colors.textPrimary,
      fontSize: 28,
      fontFamily: FONT.extraBold,
      lineHeight: 34,
      width: '100%',
      maxWidth: CARD_WIDTH,
    },
    brandSubtitle: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: FONT.regular,
      width: '100%',
      maxWidth: CARD_WIDTH,
    },
    card: {
      width: '100%',
      maxWidth: CARD_WIDTH,
      backgroundColor: colors.cardBg,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 16,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 24,
      elevation: 6,
      overflow: 'hidden',
    },
    cardGlossTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 80,
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
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
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
    },
    link: {
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },
    primaryButton: {
      backgroundColor: colors.primaryBg,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 12,
      elevation: 6,
    },
    primaryButtonDisabled: {
      opacity: 0.65,
    },
    primaryText: {
      color: colors.primaryText,
      fontFamily: FONT.semiBold,
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
      paddingVertical: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.socialBg,
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
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    footerText: {
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
  });

export default Login;
