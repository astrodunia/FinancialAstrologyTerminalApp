import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
  View,
  Pressable
} from 'react-native';
import { Mail } from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';

const MAX_WIDTH = 420;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(MAX_WIDTH, SCREEN_WIDTH - 32);

const createPalette = (themeColors, theme) => ({
  ...themeColors,
  cardBg: themeColors.surfaceGlass,
  cardBorder: themeColors.border,
  inputBg: themeColors.surfaceAlt,
  inputBorder: themeColors.border,
  primaryBg: themeColors.accent,
  primaryText: theme === 'dark' ? '#0B0B0C' : '#FFFFFF',
  success: themeColors.positive,
  danger: themeColors.negative,
});

const ForgotPassword = ({ navigation }) => {
  const { theme, themeColors } = useUser();
  const colors = useMemo(() => createPalette(themeColors, theme), [theme, themeColors]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async () => {
    if (loading) return;

    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setError(null);
    setMessage('If an account exists, a reset link will be sent shortly.');
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientBackground>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Added top spacing instead of header */}
          <View style={styles.topSpacer} />

          <AppText style={styles.title}>Forgot password</AppText>
          <AppText style={styles.subtitle}>
            Enter your email and we will send a reset link if the account exists.
          </AppText>

          <View style={styles.card}>
            <View style={styles.field}>
              <AppText style={styles.label}>Email</AppText>

              <View style={styles.inputRow}>
                <Mail size={18} color={colors.textMuted} />

                <AppTextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
            {message ? <AppText style={styles.messageText}>{message}</AppText> : null}

            <Pressable
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              <AppText style={styles.primaryText}>
                {loading ? 'Sending...' : 'Send reset link'}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>

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
      paddingTop: 70,
      paddingBottom: 100, // space for bottom tabs
      gap: 16,
      alignItems: 'center',
    },

    topSpacer: {
      height: 30, // replaces header spacing
      width: '100%',
    },

    title: {
      color: colors.textPrimary,
      fontSize: 26,
      width: '100%',
      maxWidth: CARD_WIDTH,
      fontFamily: 'NotoSans-ExtraBold',
    },

    subtitle: {
      color: colors.textMuted,
      fontSize: 13,
      width: '100%',
      maxWidth: CARD_WIDTH,
      fontFamily: 'NotoSans-Regular',
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
    },

    field: {
      gap: 8,
    },

    label: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: 'NotoSans-Medium',
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
      fontFamily: 'NotoSans-Regular',
    },

    primaryButton: {
      backgroundColor: colors.primaryBg,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },

    primaryButtonDisabled: {
      opacity: 0.7,
    },

    primaryText: {
      color: colors.primaryText,
      fontFamily: 'NotoSans-SemiBold',
    },

    errorText: {
      color: colors.danger,
      fontSize: 12,
      fontFamily: 'NotoSans-Regular',
    },

    messageText: {
      color: colors.success,
      fontSize: 12,
      fontFamily: 'NotoSans-Regular',
    },
  });

export default ForgotPassword;