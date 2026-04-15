import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthProvider';
import { resolveCurrentPlan } from '../features/plans/catalog';
import { API_BASE_URL, API_BASE_URL_DEBUG } from '../utils/apiBaseUrl';

export { API_BASE_URL };

const STORAGE_KEYS = {
  profileImageUrl: 'profile_image_url',
  themePreference: 'theme_preference',
};

const THEME_PALETTES = {
  dark: {
    background: '#0B0B0C',
    surface: '#111114',
    surfaceAlt: '#1A1B20',
    surfaceGlass: 'rgba(16, 20, 30, 0.62)',
    textPrimary: '#FFFFFF',
    textMuted: '#B7BDC8',
    border: 'rgba(255, 255, 255, 0.08)',
    accent: '#C9A8FF',
    positive: '#49D18D',
    negative: '#F08C8C',
    tabBarBg: 'rgba(12, 14, 20, 0.85)',
    gradientStops: ['#07090F', '#0F1420', '#0A0D14', '#050608'],
    glowLeft: ['#3A4E7A', '#1B253B'],
    glowRight: ['#6B4D91', '#251A3B'],
  },
  light: {
    background: '#F4F7FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EDF2FA',
    surfaceGlass: 'rgba(255, 255, 255, 0.92)',
    textPrimary: '#0D1B2A',
    textMuted: '#5F6C7B',
    border: 'rgba(13, 27, 42, 0.12)',
    accent: '#6E59CF',
    positive: '#199E63',
    negative: '#CF3F58',
    tabBarBg: 'rgba(255, 255, 255, 0.94)',
    gradientStops: ['#F8FBFF', '#EEF4FF', '#E9F0FF', '#F7FAFF'],
    glowLeft: ['#A2C0FF', '#EAF1FF'],
    glowRight: ['#CAB6FF', '#F1EAFF'],
  },
};

const UserContext = createContext(null);

const formatNameFromIdentifier = (identifier) => {
  if (!identifier) return 'Trader';

  const base = identifier.includes('@') ? identifier.split('@')[0] : identifier;
  const formatted = base
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

  return formatted || 'Trader';
};

const buildUserState = (authUser) => {
  const source = authUser || {};
  const rawName = source.name || source.fullName || source.username || source.email || '';
  const resolvedName = rawName || formatNameFromIdentifier(source.email || '');

  return {
    ...source,
    name: resolvedName || 'Trader',
    email: source.email || '',
    displayName: resolvedName.includes('@') ? formatNameFromIdentifier(resolvedName) : resolvedName || 'Trader',
  };
};

export const UserProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const auth = useAuth();
  const [localHydrated, setLocalHydrated] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [themePreference, setThemePreferenceState] = useState('system');
  const [isSyncingSession, setIsSyncingSession] = useState(false);

  useEffect(() => {
    console.log('[NetworkDebug] api.base', API_BASE_URL_DEBUG);
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [storedProfileImageUrl, storedThemePreference] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.profileImageUrl),
          AsyncStorage.getItem(STORAGE_KEYS.themePreference),
        ]);

        setProfileImageUrl(storedProfileImageUrl || '');

        if (storedThemePreference === 'light' || storedThemePreference === 'dark' || storedThemePreference === 'system') {
          setThemePreferenceState(storedThemePreference);
        }
      } finally {
        setLocalHydrated(true);
      }
    };

    hydrate();
  }, []);

  const updateProfileImage = useCallback(async (nextUrl) => {
    const normalized = nextUrl || '';
    setProfileImageUrl(normalized);
    await AsyncStorage.setItem(STORAGE_KEYS.profileImageUrl, normalized);
    return normalized;
  }, []);

  const setThemePreference = useCallback(async (nextPreference) => {
    const normalized =
      nextPreference === 'light' || nextPreference === 'dark' || nextPreference === 'system'
        ? nextPreference
        : 'system';

    setThemePreferenceState(normalized);
    await AsyncStorage.setItem(STORAGE_KEYS.themePreference, normalized);
  }, []);

  const theme = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'light' ? 'light' : 'dark';
    }

    return themePreference;
  }, [systemColorScheme, themePreference]);

  const themeColors = useMemo(() => {
    return THEME_PALETTES[theme] || THEME_PALETTES.dark;
  }, [theme]);

  const toggleTheme = useCallback(async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemePreferenceState(next);
    await AsyncStorage.setItem(STORAGE_KEYS.themePreference, next);
  }, [theme]);

  const updateUserProfile = useCallback(
    async (nextRawUser) => {
      const nextUser = {
        ...(auth.user || {}),
        ...(nextRawUser || {}),
      };

      await auth.updateUser(nextUser);
      return buildUserState(nextUser);
    },
    [auth.updateUser, auth.user],
  );

  const syncSession = useCallback(async () => {
    try {
      setIsSyncingSession(true);
      return await auth.syncSession();
    } finally {
      setIsSyncingSession(false);
    }
  }, [auth.syncSession]);

  useEffect(() => {
    if (!localHydrated || !auth.token) {
      return;
    }

    syncSession().catch(() => null);
  }, [auth.token, localHydrated, syncSession]);

  const value = useMemo(
    () => {
      const nextUser = buildUserState(auth.user);
      const currentPlan = resolveCurrentPlan(nextUser);

      return {
        isHydrating: auth.isHydrating || !localHydrated,
        isSyncingSession,
        token: auth.token,
        refreshToken: auth.refreshToken,
        deviceId: auth.deviceId,
        lastLoginUsername: auth.user?.email || '',
        user: nextUser,
        currentPlan,
        profileImageUrl,
        theme,
        themePreference,
        themeColors,
        entryRoute: auth.entryRoute,
        getOrCreateDeviceId: auth.getOrCreateDeviceId,
        authFetch: auth.authFetch,
        refreshAccessToken: auth.refreshSession,
        setAuthSession: auth.setAuthSession,
        syncSession,
        updateUserProfile,
        updateProfileImage,
        clearAuthSession: auth.clearAuthSession,
        logout: auth.logout,
        setThemePreference,
        toggleTheme,
      };
    },
    [
      auth,
      isSyncingSession,
      localHydrated,
      profileImageUrl,
      setThemePreference,
      syncSession,
      theme,
      themeColors,
      themePreference,
      toggleTheme,
      updateProfileImage,
      updateUserProfile,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside UserProvider');
  }

  return context;
};
