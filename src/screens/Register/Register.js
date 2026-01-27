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
import { Apple, Chrome, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import GradientBackground from '../../components/GradientBackground';

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
  badgeBg: '#1A1730',
  badgeBorder: '#3A2B66',
  badgeAccent: '#C9A8FF',
  success: '#86E0A1',
  warning: '#F5C36A',
  danger: '#F08C8C',
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

const Register = ({ navigation }) => {
  const [fullName, setFullName] = useState('Jane Doe');
  const [email, setEmail] = useState('you@example.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = useMemo(() => {
    if (!password) return { label: 'Weak', color: COLORS.danger, width: '25%' };
    if (password.length >= 10) return { label: 'Strong', color: COLORS.success, width: '100%' };
    if (password.length >= 6) return { label: 'Medium', color: COLORS.warning, width: '60%' };
    return { label: 'Weak', color: COLORS.danger, width: '35%' };
  }, [password]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientBackground>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppText style={styles.brandTitle}>Create your AstroDunia account</AppText>
          <View style={styles.securityBadge}>
            <ShieldCheck size={16} color={COLORS.badgeAccent} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardGlossTop} />
          <AppText style={styles.cardTitle}>Join AstroDunia Financial Terminal</AppText>
          <AppText style={styles.cardSubtitle}>Set up your account to access the dashboard</AppText>

          <View style={styles.field}>
            <AppText style={styles.label}>Full name</AppText>
            <View style={styles.inputRow}>
              <User size={18} color={COLORS.textMuted} />
              <AppTextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jane Doe"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.field}>
            <AppText style={styles.label}>Email</AppText>
            <View style={styles.inputRow}>
              <Mail size={18} color={COLORS.textMuted} />
              <AppTextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
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
                placeholder="Enter password"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                {showPassword ? (
                  <EyeOff size={18} color={COLORS.textMuted} />
                ) : (
                  <Eye size={18} color={COLORS.textMuted} />
                )}
              </Pressable>
            </View>
            <View style={styles.strengthRow}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    { backgroundColor: strength.color, width: strength.width },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <AppText style={styles.label}>Confirm password</AppText>
            <View style={styles.inputRow}>
              <Lock size={18} color={COLORS.textMuted} />
              <AppTextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
                secureTextEntry={!showConfirm}
              />
              <Pressable onPress={() => setShowConfirm((prev) => !prev)}>
                {showConfirm ? (
                  <EyeOff size={18} color={COLORS.textMuted} />
                ) : (
                  <Eye size={18} color={COLORS.textMuted} />
                )}
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.checkRow} onPress={() => setAgree((prev) => !prev)}>
            <View style={[styles.checkbox, agree && styles.checkboxActive]}>
              {agree ? <AppText style={styles.checkboxMark}>✓</AppText> : null}
            </View>
            <AppText style={styles.checkLabel}>I agree to the</AppText>
            <AppText style={styles.link}>Terms</AppText>
            <AppText style={styles.checkLabel}>and</AppText>
            <AppText style={styles.link}>Privacy Policy</AppText>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
            <AppText style={styles.primaryText}>Create account</AppText>
          </Pressable>

          <View style={styles.footerRow}>
            <AppText style={styles.footerText}>Already have an account?</AppText>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <AppText style={styles.link}>Sign in</AppText>
            </Pressable>
          </View>

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
    paddingBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    maxWidth: CARD_WIDTH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: FONT.extraBold,
    lineHeight: 28,
    flex: 1,
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
  card: {
    width: '100%',
    maxWidth: CARD_WIDTH,
    backgroundColor: 'rgba(16, 20, 30, 0.62)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 12,
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
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONT.semiBold,
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontFamily: FONT.regular,
  },
  field: {
    gap: 8,
  },
  label: {
    color: COLORS.textPrimary,
    fontFamily: FONT.semiBold,
    fontSize: 12,
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
    paddingVertical: 8,
    fontFamily: FONT.regular,
  },
  strengthRow: {
    gap: 6,
  },
  strengthBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
  },
  strengthText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONT.regular,
  },
  checkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
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
    color: COLORS.textMuted,
    fontFamily: FONT.regular,
  },
  link: {
    color: COLORS.textPrimary,
    fontFamily: FONT.semiBold,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 6,
  },
  primaryText: {
    color: '#0B0B0C',
    fontFamily: FONT.semiBold,
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
    paddingVertical: 8,
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
});

export default Register;
