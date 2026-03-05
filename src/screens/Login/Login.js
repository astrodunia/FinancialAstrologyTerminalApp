import React, { useState } from 'react';
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
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';

const ANDROID_API_URL = 'http://10.0.2.2:4500';
const IOS_API_URL = 'http://localhost:4500';
const API_BASE_URL = Platform.OS === 'android' ? ANDROID_API_URL : IOS_API_URL;

const COLORS = {
  background: '#0B0B0C',
  surface: '#111114',
  surfaceAlt: '#1A1B20',
  surfaceGlow: '#141821',
  textPrimary: '#FFFFFF',
  textMuted: '#B7BDC8',
  border: '#2A2D36',
  accent: '#FFFFFF',
  accentAlt: '#9FA6B2',
  badgeBg: '#141D2B',
  badgeBorder: '#2B3A57',
  badgeAccent: '#8CC8FF',
};

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

const Login = ({ navigation }) => {
  const { getOrCreateDeviceId, setAuthSession } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');

  const showError = (message) => {
    setStatusType('error');
    setStatusMessage(message);
  };

  const handleLogin = async () => {
    const trimmedUsername = username.trim().toLowerCase();

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
      const deviceId = await getOrCreateDeviceId();

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify({
          email: trimmedUsername,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || data?.errors?.[0]?.msg || 'Login failed. Please try again.',
        );
      }

      const responseUser =
        data?.user || data?.data?.user || data?.session?.user || data?.data || null;

      await setAuthSession({
        token: data?.token || '',
        refreshToken: data?.refresh_token || '',
        deviceId,
        identifier: trimmedUsername,
        user: responseUser,
      });

      setStatusType('success');
      setStatusMessage('Login successful.');
      navigation.navigate('Home');
    } catch (error) {
      showError(error?.message || 'Login failed. Please try again.');
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
            <Sparkles size={14} color={COLORS.badgeAccent} />
            <AppText style={styles.brandPillText}>Financial Astrology</AppText>
          </View>
          <View style={styles.securityBadge}>
            <ShieldCheck size={16} color={COLORS.badgeAccent} />
          </View>
        </View>

        <AppText style={styles.brandTitle}>Welcome back</AppText>
        <AppText style={styles.brandSubtitle}>Sign in to continue to your dashboard</AppText>

        <View style={styles.card}>
          <View style={styles.cardGlossTop} />
          <View style={styles.field}>
            <AppText style={styles.label}>Username</AppText>
            <View style={styles.inputRow}>
              <Mail size={18} color={COLORS.textMuted} />
              <AppTextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username or email"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                autoCapitalize="none"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={styles.field}>
            <AppText style={styles.label}>Password</AppText>
            <View style={styles.inputRow}>
              <Lock size={18} color={COLORS.textMuted} />
              <AppTextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                secureTextEntry={!showPassword}
                editable={!isSubmitting}
              />
              <Pressable disabled={isSubmitting} onPress={() => setShowPassword((prev) => !prev)}>
                {showPassword ? (
                  <EyeOff size={18} color={COLORS.textMuted} />
                ) : (
                  <Eye size={18} color={COLORS.textMuted} />
                )}
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
              <Chrome size={14} color={COLORS.textPrimary} />
            </View>
            <AppText style={styles.socialText}>Continue with Google</AppText>
          </Pressable>
          <Pressable style={styles.socialButton}>
            <View style={styles.socialIconCircle}>
              <Apple size={14} color={COLORS.textPrimary} />
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
      </GradientBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.badgeBg,
    borderWidth: 1,
    borderColor: COLORS.badgeBorder,
  },
  brandPillText: {
    color: COLORS.badgeAccent,
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
    borderColor: COLORS.badgeBorder,
    backgroundColor: COLORS.badgeBg,
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: FONT.extraBold,
    lineHeight: 34,
    width: '100%',
    maxWidth: CARD_WIDTH,
  },
  brandSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONT.regular,
    width: '100%',
    maxWidth: CARD_WIDTH,
  },
  card: {
    width: '100%',
    maxWidth: CARD_WIDTH,
    backgroundColor: 'rgba(16, 20, 30, 0.62)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardHighlight: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  field: {
    gap: 8,
  },
  label: {
    color: COLORS.textPrimary,
    fontFamily: FONT.semiBold,
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(12, 14, 20, 0.72)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
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
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  checkboxMark: {
    color: COLORS.background,
    fontSize: 12,
    fontFamily: FONT.extraBold,
  },
  checkLabel: {
    color: COLORS.textPrimary,
    fontFamily: FONT.semiBold,
  },
  link: {
    color: COLORS.textPrimary,
    fontFamily: FONT.semiBold,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryText: {
    color: '#0B0B0C',
    fontFamily: FONT.semiBold,
  },
  successText: {
    color: '#86E0A1',
    fontFamily: FONT.medium,
    fontSize: 12,
  },
  errorText: {
    color: '#F08C8C',
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
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONT.regular,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(12, 14, 20, 0.6)',
  },
  socialIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialIconText: {
    color: COLORS.textPrimary,
    fontFamily: FONT.semiBold,
    fontSize: 12,
  },
  socialText: {
    color: COLORS.textPrimary,
    fontFamily: FONT.semiBold,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: COLORS.textMuted,
    fontFamily: FONT.regular,
  },
});

export default Login;
