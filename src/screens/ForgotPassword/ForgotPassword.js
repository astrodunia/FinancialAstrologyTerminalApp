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
import { Mail, ArrowLeft } from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';

const MAX_WIDTH = 420;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(MAX_WIDTH, SCREEN_WIDTH - 32);
const TOP_INSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 16;

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
      // TODO: hook to backend reset endpoint when available.
      await new Promise((resolve) => setTimeout(resolve, 800));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <GradientBackground>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <ArrowLeft size={18} color={colors.textPrimary} />
              <AppText style={styles.backText}>Back</AppText>
            </Pressable>
          </View>

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
              <AppText style={styles.primaryText}>{loading ? 'Sending...' : 'Send reset link'}</AppText>
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
      paddingTop: TOP_INSET,
      paddingBottom: 24,
      gap: 16,
      alignItems: 'center',
    },
    headerRow: {
      width: '100%',
      maxWidth: CARD_WIDTH,
      alignItems: 'flex-start',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backText: {
      color: colors.textPrimary,
      fontSize: 12,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 26,
      width: '100%',
      maxWidth: CARD_WIDTH,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 13,
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
    },
    field: {
      gap: 8,
    },
    label: {
      color: colors.textPrimary,
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
    },
    errorText: {
      color: colors.danger,
      fontSize: 12,
    },
    messageText: {
      color: colors.success,
      fontSize: 12,
    },
  });

export default ForgotPassword;
