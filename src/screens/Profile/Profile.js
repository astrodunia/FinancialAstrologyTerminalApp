import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeModules,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Box,
  Calculator,
  Eye,
  EyeOff,
  Info,
  ImagePlus,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  Monitor,
  MoonStar,
  Palette,
  Rocket,
  Save,
  ShieldCheck,
  SunMedium,
  Trash2,
  User as UserIcon,
  UserCircle,
} from 'lucide-react-native';
import DialogX from '../../components/DialogX';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import BackButtonHeader from '../../components/BackButtonHeader';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import PlanGate from '../../components/PlanGate';
import { useUser } from '../../store/UserContext';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const makeInitials = (name = '', email = '') => {
  const source = (name || email || 'U').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const getImagePickerModule = () => {
  try {
    return require('react-native-image-picker');
  } catch {
    return null;
  }
};

const getNativeImagePicker = () => {
  if (NativeModules?.ImagePicker?.launchImageLibrary) {
    return NativeModules.ImagePicker;
  }

  try {
    const turboModule = require('react-native-image-picker/src/platforms/NativeImagePicker').default;
    if (turboModule?.launchImageLibrary) {
      return turboModule;
    }
  } catch {
    return null;
  }

  return null;
};

const THEME_OPTIONS = [
  { key: 'system', label: 'System', description: 'Follow device appearance', Icon: Monitor },
  { key: 'light', label: 'Light', description: 'Bright interface', Icon: SunMedium },
  { key: 'dark', label: 'Dark', description: 'Low-glare interface', Icon: MoonStar },
];

const Profile = ({ navigation }) => {
  const { user, themeColors, themePreference, setThemePreference, authFetch, updateUserProfile, updateProfileImage, logout, currentPlan } = useUser();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const styles = useMemo(() => createStyles(themeColors, isCompact), [themeColors, isCompact]);

  const [account, setAccount] = useState({ name: user?.displayName || '', email: user?.email || '' });
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  useEffect(() => {
    setAccount({ name: user?.displayName || '', email: user?.email || '' });
  }, [user?.displayName, user?.email]);

  const loadAvatar = useCallback(async () => {
    setLoadingAvatar(true);
    try {
      const res = await authFetch('/api/me/profile-image');
      const json = await safeJson(res);
      if (!res.ok) {
        setAvatarUrl('');
        return;
      }

      const nextUrl =
        typeof json?.image === 'string'
          ? json.image
          : typeof json?.image?.url === 'string'
          ? json.image.url
          : '';
      setAvatarUrl(nextUrl || '');
      await updateProfileImage(nextUrl || '');
    } catch {
      setAvatarUrl('');
      await updateProfileImage('');
    } finally {
      setLoadingAvatar(false);
    }
  }, [authFetch, updateProfileImage]);

  useEffect(() => {
    loadAvatar();
  }, [loadAvatar]);

  const uploadAvatar = useCallback(
    async (asset) => {
      if (!asset?.uri) {
        setError('Unable to read the selected image.');
        return;
      }

      if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
        setError('File is too large. Maximum size is 3 MB.');
        return;
      }

      const type = String(asset.type || '').toLowerCase();
      if (type && !/^image\/(jpeg|jpg|png|webp)$/.test(type)) {
        setError('Unsupported image type. Use JPG, PNG or WEBP.');
        return;
      }

      setSavingAvatar(true);
      setError('');
      setNotice('');

      try {
        const form = new FormData();
        form.append('image', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `profile-${Date.now()}.jpg`,
        });

        const res = await authFetch('/api/me/profile-image', {
          method: 'POST',
          body: form,
        });
        const json = await safeJson(res);

        if (!res.ok) {
          throw new Error(json?.error || json?.message || `Upload failed (${res.status})`);
        }

        const nextUrl =
          typeof json?.image === 'string'
            ? json.image
            : typeof json?.image?.url === 'string'
            ? json.image.url
            : '';

        setAvatarUrl(nextUrl || '');
        await updateProfileImage(nextUrl || '');
        setNotice('Profile image updated successfully.');
      } catch (nextError) {
        setError(nextError?.message || 'Failed to upload profile image.');
      } finally {
        setSavingAvatar(false);
      }
    },
    [authFetch, updateProfileImage],
  );

  const pickAvatar = useCallback(async () => {
    setError('');
    setNotice('');

    try {
      const imagePicker = getImagePickerModule();
      const nativeImagePicker = getNativeImagePicker();

      if (!imagePicker?.launchImageLibrary || !nativeImagePicker) {
        throw new Error('Image upload is not linked in the installed app build yet. Rebuild the app after installing native dependencies.');
      }

      const result = await imagePicker.launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeBase64: false,
        quality: 0.9,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        throw new Error(result.errorMessage || 'Unable to open image library.');
      }

      const asset = result.assets?.[0];
      if (!asset) {
        throw new Error('No image was selected.');
      }

      await uploadAvatar(asset);
    } catch (nextError) {
      setError(nextError?.message || 'Failed to select an image.');
    }
  }, [uploadAvatar]);

  const removeAvatar = useCallback(async () => {
    setSavingAvatar(true);
    setError('');
    setNotice('');

    try {
      const res = await authFetch('/api/me/profile-image', {
        method: 'DELETE',
      });
      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error(json?.error || json?.message || `Delete failed (${res.status})`);
      }

      setAvatarUrl('');
      await updateProfileImage('');
      setNotice('Profile image removed successfully.');
    } catch (nextError) {
      setError(nextError?.message || 'Failed to remove profile image.');
    } finally {
      setSavingAvatar(false);
    }
  }, [authFetch, updateProfileImage]);

  const saveAccount = async () => {
    setError('');
    setNotice('');

    const name = account.name.trim();
    const email = account.email.trim();

    if (!name) {
      setError('Please enter your name.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }

    setSavingAccount(true);

    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const json = await safeJson(res);
      if (!res.ok) {
        throw new Error(json?.msg || json?.message || `Profile update failed (${res.status})`);
      }

      const serverUser = json?.user || { name, email };
      await updateUserProfile(serverUser);
      setNotice(json?.msg || 'Profile updated successfully.');
    } catch (nextError) {
      setError(nextError?.message || 'Failed to update profile.');
    } finally {
      setSavingAccount(false);
    }
  };

  const validatePassword = () => {
    if (!password.current || !password.next || !password.confirm) {
      return 'Please fill all password fields.';
    }
    if (password.next.length < 8) return 'New password must be at least 8 characters.';
    if (password.next !== password.confirm) return 'New passwords do not match.';
    if (password.current === password.next) return 'New password must be different from current password.';
    return '';
  };

  const changePassword = async () => {
    const validation = validatePassword();
    setError('');
    setNotice('');

    if (validation) {
      setError(validation);
      return;
    }

    setSavingPassword(true);

    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: password.current, newPassword: password.next }),
      });

      const json = await safeJson(res);
      if (!res.ok) {
        throw new Error(json?.msg || json?.message || `Password update failed (${res.status})`);
      }

      setPassword({ current: '', next: '', confirm: '' });
      setNotice(json?.msg || 'Password changed successfully.');
    } catch (nextError) {
      setError(nextError?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const confirmLogout = () => {
    setLogoutDialogVisible(true);
  };

  const initials = makeInitials(account.name, account.email);

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <BackButtonHeader colors={themeColors} onPress={() => navigation.goBack()} containerStyle={styles.header}>
          <View style={styles.headerTextWrap}>
            <AppText style={styles.title}>Profile</AppText>
            <AppText style={styles.subtitle}>Keep your identity, image, and account access up to date.</AppText>
          </View>
        </BackButtonHeader>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorBanner}>
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          ) : null}

          {notice ? (
            <View style={styles.okBanner}>
              <AppText style={styles.okText}>{notice}</AppText>
            </View>
          ) : null}

          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroTopRow}>
              <View style={styles.avatarWrap}>
                {loadingAvatar ? (
                  <View style={styles.avatarFallback}>
                    <ActivityIndicator size="small" color={themeColors.textPrimary} />
                  </View>
                ) : avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <UserCircle size={40} color={themeColors.textPrimary} />
                    <AppText style={styles.avatarInitials}>{initials}</AppText>
                  </View>
                )}
              </View>

              <View style={styles.heroMeta}>
                <AppText style={styles.profileName}>{account.name || 'Trader'}</AppText>
                <AppText style={styles.profileMeta}>{account.email || 'No email available'}</AppText>
               
              </View>
            </View>

            <View style={styles.avatarActions}>
              <Pressable style={styles.primaryInlineButton} onPress={pickAvatar} disabled={savingAvatar}>
                {savingAvatar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ImagePlus size={15} color="#FFFFFF" />
                )}
                <AppText style={styles.primaryInlineButtonText}>{savingAvatar ? 'Working...' : 'Upload photo'}</AppText>
              </Pressable>

              <Pressable
                style={[styles.ghostInlineButton, (!avatarUrl || savingAvatar) && styles.ghostInlineButtonDisabled]}
                onPress={removeAvatar}
                disabled={!avatarUrl || savingAvatar}
              >
                <Trash2 size={15} color={themeColors.negative} />
                <AppText style={styles.ghostInlineButtonText}>Remove</AppText>
              </Pressable>
            </View>

            <AppText style={styles.heroHint}>Supported: JPG, PNG, WEBP. Max size: 3 MB.</AppText>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Account</AppText>
            <AppText style={styles.cardDescription}>Keep your public identity and contact email current.</AppText>

            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>Full name</AppText>
              <View style={styles.inputWrap}>
                <UserIcon size={16} color={themeColors.textMuted} />
                <AppTextInput
                  value={account.name}
                  onChangeText={(value) => setAccount((current) => ({ ...current, name: value }))}
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={themeColors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>Email</AppText>
              <View style={styles.inputWrap}>
                <Mail size={16} color={themeColors.textMuted} />
                <AppTextInput
                  value={account.email}
                  onChangeText={(value) => setAccount((current) => ({ ...current, email: value }))}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                  placeholderTextColor={themeColors.textMuted}
                />
              </View>
            </View>

            <Pressable style={styles.primaryButton} onPress={saveAccount} disabled={savingAccount}>
              {savingAccount ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Save size={14} color="#FFFFFF" />}
              <AppText style={styles.primaryButtonText}>{savingAccount ? 'Saving...' : 'Save changes'}</AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Password</AppText>
            <AppText style={styles.cardDescription}>Update your password when you want to rotate account access.</AppText>

            {[
              { key: 'current', label: 'Current password' },
              { key: 'next', label: 'New password' },
              { key: 'confirm', label: 'Confirm new password' },
            ].map((item) => {
              const field = item.key;
              const visible = showPwd[field];

              return (
                <View key={item.key} style={styles.inputGroup}>
                  <AppText style={styles.inputLabel}>{item.label}</AppText>
                  <View style={styles.inputWrap}>
                    <Lock size={16} color={themeColors.textMuted} />
                    <AppTextInput
                      value={password[field]}
                      onChangeText={(value) => setPassword((current) => ({ ...current, [field]: value }))}
                      secureTextEntry={!visible}
                      style={styles.input}
                      placeholder={item.label}
                      placeholderTextColor={themeColors.textMuted}
                    />
                    <Pressable onPress={() => setShowPwd((current) => ({ ...current, [field]: !visible }))}>
                      {visible ? <EyeOff size={16} color={themeColors.textMuted} /> : <Eye size={16} color={themeColors.textMuted} />}
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <Pressable style={styles.primaryButton} onPress={changePassword} disabled={savingPassword}>
              {savingPassword ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Lock size={14} color="#FFFFFF" />}
              <AppText style={styles.primaryButtonText}>{savingPassword ? 'Updating...' : 'Update password'}</AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Theme</AppText>
            <AppText style={styles.cardDescription}>
              Choose how the app looks. Your selection is saved on this device and applies immediately.
            </AppText>

            <View style={styles.themeOptions}>
              {THEME_OPTIONS.map((option) => {
                const Icon = option.Icon;
                const active = themePreference === option.key;

                return (
                  <Pressable
                    key={option.key}
                    style={[styles.themeOptionCard, active && styles.themeOptionCardActive]}
                    onPress={() => setThemePreference(option.key)}
                  >
                    <View style={[styles.themeOptionIconWrap, active && styles.themeOptionIconWrapActive]}>
                      <Icon size={16} color={active ? '#FFFFFF' : themeColors.accent} />
                    </View>

                    <View style={styles.themeOptionTextWrap}>
                      <AppText style={styles.themeOptionTitle}>{option.label}</AppText>
                      <AppText style={styles.themeOptionDescription}>{option.description}</AppText>
                    </View>

                    <View style={[styles.themeOptionRadio, active && styles.themeOptionRadioActive]}>
                      {active ? <View style={styles.themeOptionRadioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.themeHintRow}>
              <Palette size={15} color={themeColors.accent} />
              <AppText style={styles.themeHintText}>Switch between Light, Dark, or System.</AppText>
            </View>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Plans & billing</AppText>
            <AppText style={styles.cardDescription}>
              Compare plans, review pricing, and open billing actions from one place.
            </AppText>

            <View style={styles.planSummaryCard}>
              <View style={styles.planSummaryRow}>
                <Rocket size={16} color={themeColors.accent} />
                <AppText style={styles.planSummaryTitle}>{currentPlan.title}</AppText>
              </View>
              <AppText style={styles.planSummaryMeta}>
                {currentPlan.id ? `${currentPlan.price} • ${currentPlan.status || 'active'}` : 'No active plan found in your current session'}
              </AppText>
              {currentPlan.id ? (
                <AppText style={styles.planSummaryBody}>
                  {currentPlan.description}
                </AppText>
              ) : null}
              <AppText style={styles.planSummaryBody}>
                {`Watchlists: ${currentPlan.limits?.watchlists == null ? 'Multiple / plan-based' : currentPlan.limits.watchlists}`}
              </AppText>
              <AppText style={styles.planSummaryBody}>
                {`Tickers per watchlist: ${currentPlan.limits?.watchlistSymbols == null ? 'Plan-based' : currentPlan.limits.watchlistSymbols}`}
              </AppText>
              <AppText style={styles.planSummaryBody}>
                {`Alerts: ${currentPlan.limits?.alerts == null ? 'Plan-based' : currentPlan.limits.alerts}`}
              </AppText>
            </View>

            <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('UpgradeOnWebsite')}>
              <Rocket size={16} color={themeColors.accent} />
              <AppText style={styles.secondaryButtonText}>{currentPlan.id ? 'Upgrade on website' : 'Plans & pricing'}</AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Access in app</AppText>
            <AppText style={styles.cardDescription}>
              The backend plan decides what this app unlocks. These blocks are examples of entitlement gating from your current /me response.
            </AppText>

            <View style={styles.planAccessLockedCard}>
              <AppText style={styles.planAccessLockedTitle}>Current limits</AppText>
              <AppText style={styles.planAccessLockedBody}>
                {`Current plan: ${currentPlan.title}`}
              </AppText>
              <AppText style={styles.planAccessLockedBody}>
                {`Watchlists allowed: ${currentPlan.limits?.watchlists == null ? 'Multiple / unlimited by plan' : currentPlan.limits.watchlists}`}
              </AppText>
              <AppText style={styles.planAccessLockedBody}>
                {`Symbols per watchlist: ${currentPlan.limits?.watchlistSymbols == null ? 'Plan-based' : currentPlan.limits.watchlistSymbols}`}
              </AppText>
              <AppText style={styles.planAccessLockedBody}>
                {`Portfolio positions: ${currentPlan.limits?.portfolioPositions == null ? 'Plan-based' : currentPlan.limits.portfolioPositions}`}
              </AppText>
              <AppText style={styles.planAccessLockedBody}>
                {`Realtime data: ${currentPlan.features?.realtime_data ? 'Yes' : 'No'}`}
              </AppText>
              <AppText style={styles.planAccessLockedBody}>
                {`Planetary overlays: ${currentPlan.features?.planetary_overlays ? 'Yes' : 'No'}`}
              </AppText>
              <AppText style={styles.planAccessLockedBody}>
                {`Insights: ${currentPlan.features?.insights ? 'Yes' : 'No'}`}
              </AppText>
              <AppText style={styles.planAccessLockedBody}>
                {`Consultation: ${currentPlan.features?.consultation ? 'Yes' : 'No'}`}
              </AppText>
            </View>

            <PlanGate
              plan={currentPlan}
              feature="insights"
              fallback={
                <View style={styles.planAccessLockedCard}>
                  <AppText style={styles.planAccessLockedTitle}>Insights locked</AppText>
                  <AppText style={styles.planAccessLockedBody}>Upgrade on the website to unlock insights content in the app.</AppText>
                  <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('UpgradeOnWebsite')}>
                    <AppText style={styles.secondaryButtonText}>Upgrade on website</AppText>
                  </Pressable>
                </View>
              }
            >
              <View style={styles.planAccessEnabledCard}>
                <AppText style={styles.planAccessEnabledTitle}>Insights unlocked</AppText>
                <AppText style={styles.planAccessEnabledBody}>
                  This content is visible because your current backend plan includes insights access.
                </AppText>
              </View>
            </PlanGate>

          </View>

          <View style={styles.card}>
            <AppText style={styles.infoCardTitle}>Products</AppText>
            <AppText style={styles.infoCardDescription}>
              Discover all Financial Astrology Terminal offerings, from subscription plans to deep-dive research products.
            </AppText>

            <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Products')}>
              <Box size={16} color={themeColors.accent} />
              <AppText style={styles.infoCardButtonText}>Explore products</AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <AppText style={styles.infoCardTitle}>About the Financial Astrology Terminal</AppText>
            <AppText style={styles.infoCardDescription}>
              Open the detailed overview on a dedicated screen with full methodology, design principles, and timing framework notes.
            </AppText>

            <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('AboutTerminal')}>
              <Info size={16} color={themeColors.accent} />
              <AppText style={styles.infoCardButtonText}>About the Terminal</AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>More help</AppText>
            <AppText style={styles.cardDescription}>
              Open the detailed pages below for privacy information and the support center.
            </AppText>

            <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('PrivacyPolicy')}>
              <ShieldCheck size={16} color={themeColors.accent} />
              <AppText style={styles.secondaryButtonText}>Privacy & data</AppText>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Support')}>
              <LifeBuoy size={16} color={themeColors.accent} />
              <AppText style={styles.secondaryButtonText}>Support & help</AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Tools</AppText>
            <AppText style={styles.cardDescription}>
              Open trading and finance calculators from your profile whenever you need them.
            </AppText>

            <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Calculators')}>
              <Calculator size={16} color={themeColors.accent} />
              <AppText style={styles.secondaryButtonText}>Calculators</AppText>
            </Pressable>
          </View>

          <View style={styles.logoutCard}>
            <AppText style={styles.cardTitle}>Logout</AppText>
            <AppText style={styles.cardDescription}>
              Sign out from this device if you want to end your current session securely.
            </AppText>

            <Pressable style={styles.logoutButton} onPress={confirmLogout} disabled={loggingOut}>
              {loggingOut ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <LogOut size={18} color="#FFFFFF" />
              )}
              <AppText style={styles.logoutButtonText}>{loggingOut ? 'Logging out...' : 'Log out'}</AppText>
            </Pressable>
          </View>
        </ScrollView>

        <DialogX
          visible={logoutDialogVisible}
          tone="danger"
          icon={LogOut}
          title="Log Out Of This Device?"
          message="You will be signed out on this device and will need to sign in again to access your account."
          onRequestClose={() => setLogoutDialogVisible(false)}
          actions={[
            {
              label: 'Cancel',
              variant: 'ghost',
              onPress: () => setLogoutDialogVisible(false),
            },
            {
              label: 'Log Out',
              variant: 'danger',
              onPress: async () => {
                setLogoutDialogVisible(false);
                setLoggingOut(true);
                try {
                  await logout();
                } finally {
                  setLoggingOut(false);
                }
              },
            },
          ]}
        />

        <BottomTabs navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, isCompact) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      gap: 16,
    },
    headerTextWrap: {
      gap: 6,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 30,
      fontFamily: 'NotoSans-ExtraBold',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    logoutCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(207, 63, 88, 0.22)',
      backgroundColor: 'rgba(207, 63, 88, 0.08)',
      padding: isCompact ? 14 : 16,
      gap: 14,
      marginBottom: 8,
    },
    logoutButton: {
      width: '100%',
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(207, 63, 88, 0.38)',
      backgroundColor: colors.negative,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },
    logoutButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 110,
      paddingTop: 4,
      gap: 16,
    },
    errorBanner: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(207, 63, 88, 0.35)',
      backgroundColor: 'rgba(207, 63, 88, 0.12)',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    errorText: {
      color: colors.negative,
      fontSize: 12,
      fontFamily: 'NotoSans-Regular',
    },
    okBanner: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(25, 158, 99, 0.35)',
      backgroundColor: 'rgba(25, 158, 99, 0.12)',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    okText: {
      color: colors.positive,
      fontSize: 12,
      fontFamily: 'NotoSans-Regular',
    },
    heroCard: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 18,
      gap: 14,
    },
    heroGlow: {
      position: 'absolute',
      top: -18,
      right: -10,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.accent,
      opacity: 0.08,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatarWrap: {
      width: 92,
      height: 92,
      borderRadius: 46,
      overflow: 'hidden',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    avatarInitials: {
      color: colors.textPrimary,
      fontSize: 12,
      fontFamily: 'NotoSans-SemiBold',
    },
    heroMeta: {
      flex: 1,
      gap: 5,
    },
    profileName: {
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 30,
      fontFamily: 'NotoSans-ExtraBold',
    },
    profileMeta: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: 'NotoSans-Regular',
    },
    profileSubtext: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    avatarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    primaryInlineButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: 14,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },
    primaryInlineButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
    ghostInlineButton: {
      minHeight: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(207, 63, 88, 0.25)',
      backgroundColor: 'rgba(207, 63, 88, 0.08)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 14,
    },
    ghostInlineButtonDisabled: {
      opacity: 0.55,
    },
    ghostInlineButtonText: {
      color: colors.negative,
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
    heroHint: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: 'NotoSans-Regular',
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: isCompact ? 14 : 16,
      gap: 14,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontFamily: 'NotoSans-SemiBold',
    },
    cardDescription: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      marginTop: -2,
      fontFamily: 'NotoSans-Regular',
    },
    planSummaryCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 6,
    },
    planSummaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    planSummaryTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: 'NotoSans-SemiBold',
    },
    planSummaryMeta: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: 'NotoSans-Medium',
    },
    planSummaryBody: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    planAccessEnabledCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(25, 158, 99, 0.28)',
      backgroundColor: 'rgba(25, 158, 99, 0.10)',
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 6,
    },
    planAccessEnabledTitle: {
      color: colors.positive,
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
    planAccessEnabledBody: {
      color: colors.textPrimary,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    planAccessLockedCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 8,
    },
    planAccessLockedTitle: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
    planAccessLockedBody: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'NotoSans-Regular',
    },
    themeOptions: {
      gap: 10,
    },
    themeOptionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    themeOptionCardActive: {
      borderColor: colors.accent,
      backgroundColor: 'rgba(110, 89, 207, 0.10)',
    },
    themeOptionIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeOptionIconWrapActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    themeOptionTextWrap: {
      flex: 1,
      gap: 2,
    },
    themeOptionTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: 'NotoSans-SemiBold',
    },
    themeOptionDescription: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: 'NotoSans-Regular',
    },
    themeOptionRadio: {
      width: 18,
      height: 18,
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeOptionRadioActive: {
      borderColor: colors.accent,
    },
    themeOptionRadioDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    themeHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeHintText: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: 'NotoSans-Regular',
    },
    inputGroup: {
      gap: 8,
    },
    inputLabel: {
      color: colors.textPrimary,
      fontSize: 12,
      fontFamily: 'NotoSans-SemiBold',
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
    },
    input: {
      flex: 1,
      color: colors.textPrimary,
      paddingVertical: 11,
    },
    primaryButton: {
      minHeight: 46,
      borderRadius: 14,
      backgroundColor: colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
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
    infoCardTitle: {
      color: colors.textPrimary,
      fontSize: isCompact ? 15 : 16,
      lineHeight: isCompact ? 22 : 24,
      fontFamily: 'NotoSans-SemiBold',
    },
    infoCardDescription: {
      color: colors.textMuted,
      fontSize: isCompact ? 12 : 13,
      lineHeight: isCompact ? 18 : 19,
      fontFamily: 'NotoSans-Regular',
      marginTop: -2,
    },
    infoCardButtonText: {
      color: colors.textPrimary,
      fontSize: isCompact ? 12 : 13,
      fontFamily: 'NotoSans-SemiBold',
    },
  });

export default Profile;
