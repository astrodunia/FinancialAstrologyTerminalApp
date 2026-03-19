import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logRequestError, logRequestStart, logResponse } from '../utils/networkDebug';
import { API_BASE_URL, API_BASE_URL_DEBUG } from '../utils/apiBaseUrl';

export { API_BASE_URL };

const STORAGE_KEYS = {
  deviceId: 'device_id',
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  lastLoginUsername: 'last_login_username',
  userProfile: 'user_profile',
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
const SESSION_INVALID_ERRORS = new Set(['session_revoked', 'session_rotated', 'invalid_refresh']);

const createDeviceId = () => {
  return `mobile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatNameFromIdentifier = (identifier) => {
  if (!identifier) return 'Trader';

  const base = identifier.includes('@') ? identifier.split('@')[0] : identifier;
  const formatted = base
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

  return formatted || 'Trader';
};

const extractUserFromPayload = (payload) => {
  return payload?.user || payload?.data?.user || payload?.session?.user || payload?.data || null;
};

const parseJsonSafely = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractApiError = (payload) => {
  return payload?.error || payload?.message || payload?.errors?.[0]?.msg || '';
};

const buildUserState = ({ user, identifier }) => {
  const source = user || {};
  const rawName = source.name || source.fullName || source.username || source.email || identifier || '';

  return {
    name: rawName,
    email: source.email || (typeof identifier === 'string' && identifier.includes('@') ? identifier : ''),
    displayName: rawName.includes('@') ? formatNameFromIdentifier(rawName) : rawName || 'Trader',
  };
};

export const UserProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSyncingSession, setIsSyncingSession] = useState(false);
  const [token, setToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [lastLoginUsername, setLastLoginUsername] = useState('');
  const [user, setUser] = useState(buildUserState({ user: null, identifier: '' }));
  const [themePreference, setThemePreferenceState] = useState('system');

  useEffect(() => {
    console.log('[NetworkDebug] api.base', API_BASE_URL_DEBUG);
  }, []);

  const persistUser = useCallback(async (nextUser) => {
    await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(nextUser));
  }, []);

  const getOrCreateDeviceId = useCallback(async () => {
    if (deviceId) return deviceId;

    const stored = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
    if (stored) {
      setDeviceId(stored);
      return stored;
    }

    const generated = createDeviceId();
    await AsyncStorage.setItem(STORAGE_KEYS.deviceId, generated);
    setDeviceId(generated);
    return generated;
  }, [deviceId]);

  const syncSession = useCallback(async () => {
    if (!token || !deviceId) return;

    const sessionUrl = `${API_BASE_URL}/api/auth/session`;

    try {
      setIsSyncingSession(true);
      logRequestStart({
        label: 'auth.session',
        url: sessionUrl,
        method: 'GET',
        meta: { hasToken: Boolean(token), hasDeviceId: Boolean(deviceId) },
      });

      const response = await fetch(sessionUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'x-device-id': deviceId,
        },
      });
      await logResponse({ label: 'auth.session', response });

      if (!response.ok) return;

      const payload = await response.json().catch(() => null);
      const sessionUser = extractUserFromPayload(payload);
      if (!sessionUser) return;

      const nextUser = buildUserState({ user: sessionUser, identifier: lastLoginUsername });
      setUser(nextUser);
      await persistUser(nextUser);
    } catch (error) {
      logRequestError({ label: 'auth.session', url: sessionUrl, error });
    } finally {
      setIsSyncingSession(false);
    }
  }, [deviceId, lastLoginUsername, persistUser, token]);

  const setAuthSession = useCallback(
    async ({ token: nextToken, refreshToken: nextRefreshToken, deviceId: nextDeviceId, identifier, user: nextRawUser }) => {
      const resolvedIdentifier = identifier || lastLoginUsername;
      const nextUser = buildUserState({ user: nextRawUser, identifier: resolvedIdentifier });

      setToken(nextToken || '');
      setRefreshToken(nextRefreshToken || '');
      setDeviceId(nextDeviceId || '');
      setLastLoginUsername(resolvedIdentifier || '');
      setUser(nextUser);

      const entries = [
        [STORAGE_KEYS.accessToken, nextToken || ''],
        [STORAGE_KEYS.refreshToken, nextRefreshToken || ''],
        [STORAGE_KEYS.deviceId, nextDeviceId || ''],
        [STORAGE_KEYS.lastLoginUsername, resolvedIdentifier || ''],
        [STORAGE_KEYS.userProfile, JSON.stringify(nextUser)],
      ];

      await AsyncStorage.multiSet(entries);
    },
    [lastLoginUsername],
  );

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [
          storedToken,
          storedRefresh,
          storedDeviceId,
          storedUsername,
          storedUserProfile,
          storedThemePreference,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.accessToken),
          AsyncStorage.getItem(STORAGE_KEYS.refreshToken),
          AsyncStorage.getItem(STORAGE_KEYS.deviceId),
          AsyncStorage.getItem(STORAGE_KEYS.lastLoginUsername),
          AsyncStorage.getItem(STORAGE_KEYS.userProfile),
          AsyncStorage.getItem(STORAGE_KEYS.themePreference),
        ]);

        setToken(storedToken || '');
        setRefreshToken(storedRefresh || '');
        setDeviceId(storedDeviceId || '');
        setLastLoginUsername(storedUsername || '');

        if (storedUserProfile) {
          try {
            const parsed = JSON.parse(storedUserProfile);
            setUser(parsed);
          } catch {
            setUser(buildUserState({ user: null, identifier: storedUsername || '' }));
          }
        } else {
          setUser(buildUserState({ user: null, identifier: storedUsername || '' }));
        }

        if (storedThemePreference === 'light' || storedThemePreference === 'dark' || storedThemePreference === 'system') {
          setThemePreferenceState(storedThemePreference);
        }
      } finally {
        setIsHydrating(false);
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrating && token && deviceId) {
      syncSession();
    }
  }, [deviceId, isHydrating, syncSession, token]);

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
      const nextUser = buildUserState({ user: nextRawUser, identifier: lastLoginUsername });
      setUser(nextUser);
      await persistUser(nextUser);
      return nextUser;
    },
    [lastLoginUsername, persistUser],
  );

  const clearAuthSession = useCallback(async () => {
    setToken('');
    setRefreshToken('');
    setLastLoginUsername('');
    setUser(buildUserState({ user: null, identifier: '' }));
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.accessToken,
      STORAGE_KEYS.refreshToken,
      STORAGE_KEYS.lastLoginUsername,
      STORAGE_KEYS.userProfile,
    ]);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const currentDeviceId = await getOrCreateDeviceId().catch(() => deviceId);
    const currentRefreshToken = refreshToken;
    const refreshUrl = `${API_BASE_URL}/api/auth/refresh`;

    if (!currentDeviceId || !currentRefreshToken) {
      await clearAuthSession();
      return null;
    }

    try {
      logRequestStart({
        label: 'auth.refresh',
        url: refreshUrl,
        method: 'POST',
        meta: { hasRefreshToken: Boolean(currentRefreshToken), hasDeviceId: Boolean(currentDeviceId) },
      });

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-device-id': currentDeviceId,
        },
        credentials: 'include',
        body: JSON.stringify({
          refresh_token: currentRefreshToken,
          device_id: currentDeviceId,
        }),
      });
      await logResponse({ label: 'auth.refresh', response });

      const payload = await parseJsonSafely(response);
      if (!response.ok) {
        const apiError = extractApiError(payload);
        if (SESSION_INVALID_ERRORS.has(apiError)) {
          await clearAuthSession();
          return null;
        }

        throw new Error(apiError || `Refresh failed (${response.status})`);
      }

      const nextToken = payload?.token || '';
      if (!nextToken) {
        throw new Error('Refresh response did not include an access token.');
      }

      setToken(nextToken);
      await AsyncStorage.setItem(STORAGE_KEYS.accessToken, nextToken);
      return nextToken;
    } catch (error) {
      logRequestError({ label: 'auth.refresh', url: refreshUrl, error });
      throw error;
    }
  }, [clearAuthSession, deviceId, getOrCreateDeviceId, refreshToken]);

  const authFetch = useCallback(
    async (path, init = {}) => {
      const currentDeviceId = await getOrCreateDeviceId().catch(() => deviceId);
      const normalizedPath = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
      const {
        headers: initHeaders = {},
        skipRefresh = false,
        allowUnauthorized = false,
        ...restInit
      } = init;

      const doFetch = async (accessToken) => {
        const headers = {
          Accept: 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(currentDeviceId ? { 'x-device-id': currentDeviceId } : {}),
          ...initHeaders,
        };

        return fetch(normalizedPath, {
          credentials: 'include',
          ...restInit,
          headers,
        });
      };

      let response = await doFetch(token);

      if (allowUnauthorized || response.status !== 401 || skipRefresh) {
        return response;
      }

      const unauthorizedPayload = await parseJsonSafely(response);
      const unauthorizedError = extractApiError(unauthorizedPayload);
      if (SESSION_INVALID_ERRORS.has(unauthorizedError)) {
        await clearAuthSession();
        return response;
      }

      const nextToken = await refreshAccessToken().catch(() => null);
      if (!nextToken) {
        return response;
      }

      response = await doFetch(nextToken);
      if (response.status !== 401) {
        return response;
      }

      const retryPayload = await parseJsonSafely(response);
      const retryError = extractApiError(retryPayload);
      if (SESSION_INVALID_ERRORS.has(retryError)) {
        await clearAuthSession();
      }

      return response;
    },
    [clearAuthSession, deviceId, getOrCreateDeviceId, refreshAccessToken, token],
  );

  const logout = useCallback(async () => {
    const currentDeviceId = await getOrCreateDeviceId().catch(() => deviceId);
    const logoutUrl = `${API_BASE_URL}/api/auth/logout2`;

    try {
      logRequestStart({
        label: 'auth.logout',
        url: logoutUrl,
        method: 'POST',
        meta: { hasToken: Boolean(token), hasDeviceId: Boolean(currentDeviceId) },
      });
      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(currentDeviceId ? { 'x-device-id': currentDeviceId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ device_id: currentDeviceId || '' }),
      });
      await logResponse({ label: 'auth.logout', response });
    } catch (error) {
      logRequestError({ label: 'auth.logout', url: logoutUrl, error });
    } finally {
      await clearAuthSession();
    }
  }, [clearAuthSession, deviceId, getOrCreateDeviceId, token]);

  const value = useMemo(
    () => ({
      isHydrating,
      isSyncingSession,
      token,
      refreshToken,
      deviceId,
      lastLoginUsername,
      user,
      theme,
      themePreference,
      themeColors,
      getOrCreateDeviceId,
      authFetch,
      refreshAccessToken,
      setAuthSession,
      syncSession,
      updateUserProfile,
      clearAuthSession,
      logout,
      setThemePreference,
      toggleTheme,
    }),
    [
      deviceId,
      authFetch,
      getOrCreateDeviceId,
      isHydrating,
      isSyncingSession,
      lastLoginUsername,
      refreshAccessToken,
      refreshToken,
      setAuthSession,
      syncSession,
      updateUserProfile,
      clearAuthSession,
      logout,
      setThemePreference,
      token,
      theme,
      themeColors,
      themePreference,
      toggleTheme,
      user,
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
