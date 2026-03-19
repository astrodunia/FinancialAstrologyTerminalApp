import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Smartphone,
  User as UserIcon,
  UserCircle,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';

const makeInitials = (name = '', email = '') => {
  const source = (name || email || 'U').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const Profile = ({ navigation }) => {
  const {
    user,
    theme,
    themeColors,
    themePreference,
    authFetch,
    updateUserProfile,
    logout,
    setThemePreference,
    toggleTheme,
  } = useUser();

  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [account, setAccount] = useState({ name: user?.displayName || '', email: user?.email || '' });
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });

  const [avatarUrl, setAvatarUrl] = useState('');
  const [devices, setDevices] = useState([]);

  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState('');

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

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
    } catch {
      setAvatarUrl('');
    } finally {
      setLoadingAvatar(false);
    }
  }, [authFetch]);

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true);
    setError('');

    try {
      const res = await authFetch('/api/auth/devices');
      const json = await safeJson(res);

      if (!res.ok) {
        throw new Error(json?.message || `Failed to load devices (${res.status})`);
      }

      const payload = json?.data || json;
      const nextDevices = Array.isArray(payload?.devices) ? payload.devices : [];
      setDevices(nextDevices);
    } catch (e) {
      setError(e?.message || 'Failed to load active devices.');
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadAvatar();
    loadDevices();
  }, [loadAvatar, loadDevices]);

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
    } catch (e) {
      setError(e?.message || 'Failed to update profile.');
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
    } catch (e) {
      setError(e?.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const revokeDevice = useCallback(
    async (device) => {
      const targetDeviceId = device?.device_id;
      if (!targetDeviceId) {
        setError('Invalid device selected.');
        return;
      }

      setError('');
      setNotice('');
      setRevokingDeviceId(targetDeviceId);

      try {
        const res = await authFetch('/api/auth/devices/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: targetDeviceId }),
        });
        const json = await safeJson(res);

        if (!res.ok) {
          throw new Error(json?.message || json?.error || `Failed to revoke device (${res.status})`);
        }

        setNotice(json?.message || json?.msg || 'Device logged out successfully.');
        setDevices((currentDevices) =>
          currentDevices.filter((currentDevice) => currentDevice?.device_id !== targetDeviceId),
        );
        await loadDevices();
      } catch (e) {
        setError(e?.message || 'Failed to revoke device.');
      } finally {
        setRevokingDeviceId('');
      }
    },
    [authFetch, loadDevices],
  );

  const confirmRevokeDevice = useCallback(
    (device) => {
      const label = device?.label || `${device?.browser || 'Unknown browser'} on ${device?.os || 'Unknown OS'}`;
      const isCurrent = Boolean(device?.is_current);

      Alert.alert(
        isCurrent ? 'Log Out This Device' : 'Log Out Device',
        isCurrent ? 'This will log out this phone as well. Continue?' : `Log out ${label}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log out',
            style: 'destructive',
            onPress: async () => {
              await revokeDevice(device);
              if (isCurrent) {
                await logout();
              }
            },
          },
        ],
      );
    },
    [logout, revokeDevice],
  );

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out from this account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const initials = makeInitials(account.name, account.email);

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View style={styles.header}>
          <AppText style={styles.title}>Profile</AppText>
          <Pressable style={styles.iconButton} onPress={confirmLogout} disabled={loggingOut}>
            {loggingOut ? (
              <ActivityIndicator size="small" color={themeColors.textPrimary} />
            ) : (
              <LogOut size={18} color={themeColors.textPrimary} />
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!!error && (
            <View style={styles.errorBanner}>
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          )}
          {!!notice && (
            <View style={styles.okBanner}>
              <AppText style={styles.okText}>{notice}</AppText>
            </View>
          )}

          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <UserCircle size={42} color={themeColors.textPrimary} />
                  <AppText style={styles.avatarInitials}>{initials}</AppText>
                </View>
              )}
            </View>
            <View style={styles.profileMetaArea}>
              <AppText style={styles.profileName}>{account.name || 'Trader'}</AppText>
              <AppText style={styles.profileMeta}>{account.email || 'No email available'}</AppText>
              <Pressable style={styles.reloadButton} onPress={loadAvatar} disabled={loadingAvatar}>
                {loadingAvatar ? <ActivityIndicator size="small" color={themeColors.textPrimary} /> : <RefreshCw size={14} color={themeColors.textPrimary} />}
                <AppText style={styles.reloadText}>Refresh image</AppText>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Account details</AppText>
            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>Full name</AppText>
              <View style={styles.inputWrap}>
                <UserIcon size={16} color={themeColors.textMuted} />
                <AppTextInput value={account.name} onChangeText={(value) => setAccount((s) => ({ ...s, name: value }))} style={styles.input} placeholder="Your name" placeholderTextColor={themeColors.textMuted} />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>Email</AppText>
              <View style={styles.inputWrap}>
                <Mail size={16} color={themeColors.textMuted} />
                <AppTextInput value={account.email} onChangeText={(value) => setAccount((s) => ({ ...s, email: value }))} style={styles.input} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor={themeColors.textMuted} />
              </View>
            </View>
            <Pressable style={styles.primaryButton} onPress={saveAccount} disabled={savingAccount}>
              {savingAccount ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Save size={14} color="#FFFFFF" />}
              <AppText style={styles.primaryButtonText}>{savingAccount ? 'Saving...' : 'Save changes'}</AppText>
            </Pressable>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Change password</AppText>

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
                      onChangeText={(value) => setPassword((s) => ({ ...s, [field]: value }))}
                      secureTextEntry={!visible}
                      style={styles.input}
                      placeholder={item.label}
                      placeholderTextColor={themeColors.textMuted}
                    />
                    <Pressable onPress={() => setShowPwd((s) => ({ ...s, [field]: !visible }))}>
                      {visible ? (
                        <EyeOff size={16} color={themeColors.textMuted} />
                      ) : (
                        <Eye size={16} color={themeColors.textMuted} />
                      )}
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
            <View style={styles.cardHeaderRow}>
              <AppText style={styles.cardTitle}>Active devices</AppText>
              <Pressable style={styles.smallActionButton} onPress={loadDevices} disabled={loadingDevices}>
                {loadingDevices ? (
                  <ActivityIndicator size="small" color={themeColors.textPrimary} />
                ) : (
                  <RefreshCw size={14} color={themeColors.textPrimary} />
                )}
                <AppText style={styles.smallActionText}>Refresh</AppText>
              </Pressable>
            </View>

            {!devices.length && !loadingDevices ? (
              <AppText style={styles.emptyText}>No active devices found.</AppText>
            ) : null}

            {devices.map((device, index) => {
              const deviceId = device?.device_id || `device-${index}`;
              const label = device?.label || `${device?.browser || 'Unknown browser'} on ${device?.os || 'Unknown OS'}`;
              const isCurrent = Boolean(device?.is_current);
              const isRevoking = revokingDeviceId === device?.device_id;

              return (
                <View key={deviceId} style={styles.deviceRow}>
                  <View style={styles.deviceMain}>
                    <AppText style={styles.deviceTitle}>{label}</AppText>
                    <AppText style={styles.deviceMeta}>Last seen: {formatDateTime(device?.last_seen)}</AppText>
                    <AppText style={styles.deviceMeta}>IP: {device?.ip || '—'}</AppText>
                  </View>
                  <View style={styles.deviceActions}>
                    {isCurrent ? <AppText style={styles.currentDeviceBadge}>Current</AppText> : null}
                    <Pressable
                      style={[styles.revokeButton, isRevoking && styles.revokeButtonDisabled]}
                      onPress={() => confirmRevokeDevice(device)}
                      disabled={isRevoking}
                    >
                      {isRevoking ? (
                        <ActivityIndicator size="small" color={themeColors.negative} />
                      ) : (
                        <Smartphone size={14} color={themeColors.negative} />
                      )}
                      <AppText style={styles.revokeButtonText}>
                        {isCurrent ? 'Log out here' : 'Log out'}
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Appearance</AppText>
            <View style={styles.themeRow}>
              {[
                { key: 'light', label: 'Light' },
                { key: 'dark', label: 'Dark' },
                { key: 'system', label: 'System' },
              ].map((option) => {
                const active = themePreference === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={[styles.themeChip, active && styles.themeChipActive]}
                    onPress={() => setThemePreference(option.key)}
                  >
                    <AppText style={[styles.themeChipText, active && styles.themeChipTextActive]}>{option.label}</AppText>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={styles.themeToggleButton} onPress={toggleTheme}>
              <AppText style={styles.themeToggleText}>Toggle now (current: {theme})</AppText>
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
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 28,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 110,
      gap: 14,
    },
    errorBanner: {
      backgroundColor: 'rgba(240, 140, 140, 0.14)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(240, 140, 140, 0.45)',
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    errorText: {
      color: colors.negative,
      fontSize: 12,
    },
    okBanner: {
      backgroundColor: 'rgba(73, 209, 141, 0.14)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(73, 209, 141, 0.45)',
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    okText: {
      color: colors.positive,
      fontSize: 12,
    },
    profileCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarWrap: {
      width: 84,
      height: 84,
      borderRadius: 42,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    avatarInitials: {
      color: colors.textMuted,
      fontSize: 11,
    },
    profileMetaArea: {
      flex: 1,
      gap: 5,
    },
    profileName: {
      color: colors.textPrimary,
      fontSize: 17,
    },
    profileMeta: {
      color: colors.textMuted,
      fontSize: 12,
    },
    reloadButton: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    reloadText: {
      color: colors.textPrimary,
      fontSize: 11,
    },
    card: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 14,
    },
    inputGroup: {
      gap: 6,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 12,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    input: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 13,
      paddingVertical: 0,
    },
    primaryButton: {
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
    },
    smallActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    smallActionText: {
      color: colors.textPrimary,
      fontSize: 11,
    },
    deviceRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
      marginTop: 2,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    deviceMain: {
      flex: 1,
      gap: 2,
    },
    deviceActions: {
      alignItems: 'flex-end',
      gap: 8,
    },
    deviceTitle: {
      color: colors.textPrimary,
      fontSize: 12,
    },
    deviceMeta: {
      color: colors.textMuted,
      fontSize: 11,
    },
    currentDeviceBadge: {
      alignSelf: 'flex-start',
      color: colors.positive,
      fontSize: 10,
      borderWidth: 1,
      borderColor: colors.positive,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    revokeButton: {
      minWidth: 108,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(240, 140, 140, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(240, 140, 140, 0.4)',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    revokeButtonDisabled: {
      opacity: 0.7,
    },
    revokeButtonText: {
      color: colors.negative,
      fontSize: 11,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 12,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    themeChip: {
      flex: 1,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingVertical: 8,
      alignItems: 'center',
    },
    themeChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    themeChipText: {
      color: colors.textPrimary,
      fontSize: 12,
    },
    themeChipTextActive: {
      color: '#FFFFFF',
    },
    themeToggleButton: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginTop: 2,
    },
    themeToggleText: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });

export default Profile;
