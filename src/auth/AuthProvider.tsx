import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getOrCreateDeviceId } from './deviceId';
import {
  clearAuthSessionStorage,
  getAuthSession,
  saveAuthSession,
  updateStoredToken,
  updateStoredUser,
} from './authStorage';
import { API_BASE, apiFetch, configureApiClient, SESSION_INVALID_ERRORS } from './apiClient';
import { isAppleSignInSupported, revokeGoogleSession, signInWithAppleRequest, signInWithGoogleRequest } from './authService';
import type { ApiErrorPayload, AuthSession, AuthUser, SessionEntryRoute } from './types';

type TakeoverConfirm = () => Promise<boolean>;
type ProgressCallback = (message: string) => void;

type AuthContextValue = {
  isHydrating: boolean;
  isAuthenticated: boolean;
  token: string;
  refreshToken: string;
  deviceId: string;
  user: AuthUser | null;
  entryRoute: SessionEntryRoute;
  isAppleSupported: boolean;
  getOrCreateDeviceId: () => Promise<string>;
  authFetch: typeof apiFetch;
  setAuthSession: (session: {
    token: string;
    refreshToken: string;
    deviceId?: string;
    user: AuthUser | null;
    firstLogin?: boolean;
  }) => Promise<void>;
  clearAuthSession: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  signInWithGoogle: (confirmTakeover: TakeoverConfirm, onProgress?: ProgressCallback) => Promise<SessionEntryRoute>;
  signInWithApple: (confirmTakeover: TakeoverConfirm, onProgress?: ProgressCallback) => Promise<SessionEntryRoute>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser | null) => Promise<void>;
  syncSession: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getApiError = (payload: ApiErrorPayload | null | undefined): string => {
  return payload?.error || payload?.message || payload?.errors?.[0]?.msg || '';
};

const buildEntryRoute = (firstLogin?: boolean): SessionEntryRoute => {
  return firstLogin ? 'Plans' : 'Home';
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isHydrating, setIsHydrating] = useState(true);
  const [deviceId, setDeviceId] = useState('');
  const [session, setSession] = useState<AuthSession>({
    token: '',
    refreshToken: '',
    user: null,
  });
  const [entryRoute, setEntryRoute] = useState<SessionEntryRoute>('Home');
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const getSessionSnapshot = useCallback(() => {
    if (!session.token) {
      return null;
    }

    return {
      token: session.token,
    };
  }, [session.token]);

  const clearAuthSession = useCallback(async () => {
    setSession({
      token: '',
      refreshToken: '',
      user: null,
    });
    setEntryRoute('Home');
    await clearAuthSessionStorage();
  }, []);

  const setAuthSession = useCallback(
    async ({
      token,
      refreshToken,
      deviceId: nextDeviceId,
      user,
      firstLogin,
    }: {
      token: string;
      refreshToken: string;
      deviceId?: string;
      user: AuthUser | null;
      firstLogin?: boolean;
    }) => {
      const resolvedDeviceId = nextDeviceId || deviceId || (await getOrCreateDeviceId());
      setDeviceId(resolvedDeviceId);

      const nextSession: AuthSession = {
        token: token || '',
        refreshToken: refreshToken || '',
        user: user || null,
      };

      setSession(nextSession);
      setEntryRoute(buildEntryRoute(firstLogin));
      await saveAuthSession(nextSession);
    },
    [deviceId],
  );

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      const currentDeviceId = deviceId || (await getOrCreateDeviceId());
      const currentRefreshToken = session.refreshToken;

      if (!currentDeviceId || !currentRefreshToken) {
        await clearAuthSession();
        return null;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'x-device-id': currentDeviceId,
          },
          body: JSON.stringify({
            refresh_token: currentRefreshToken,
            device_id: currentDeviceId,
          }),
        });
        const payload = (await response.json().catch(() => null)) as ApiErrorPayload & { token?: string } | null;

        if (!response.ok) {
          const errorCode = getApiError(payload);
          if (SESSION_INVALID_ERRORS.has(errorCode)) {
            await clearAuthSession();
            return null;
          }

          throw new Error(errorCode || `Refresh failed (${response.status})`);
        }

        const nextToken = payload?.token || '';
        if (!nextToken) {
          throw new Error('Refresh response did not include token.');
        }

        setSession((current) => ({
          ...current,
          token: nextToken,
        }));
        await updateStoredToken(nextToken);
        return nextToken;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [clearAuthSession, deviceId, session.refreshToken]);

  const updateUser = useCallback(async (user: AuthUser | null) => {
    setSession((current) => ({
      ...current,
      user,
    }));
    await updateStoredUser(user);
  }, []);

  const syncSession = useCallback(async (): Promise<AuthUser | null> => {
    if (!session.token) {
      return null;
    }

    const response = await apiFetch('/api/auth/session', { method: 'GET' });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as { user?: AuthUser; data?: { user?: AuthUser } } | null;
    const nextUser = payload?.user || payload?.data?.user || null;
    if (!nextUser) {
      return null;
    }

    await updateUser(nextUser);
    return nextUser;
  }, [session.token, updateUser]);

  const signInWithGoogle = useCallback(
    async (confirmTakeover: TakeoverConfirm, onProgress?: ProgressCallback): Promise<SessionEntryRoute> => {
      const currentDeviceId = deviceId || (await getOrCreateDeviceId());
      const data = await signInWithGoogleRequest(currentDeviceId, confirmTakeover, onProgress);

      await setAuthSession({
        token: data.token,
        refreshToken: data.refresh_token,
        deviceId: currentDeviceId,
        user: data.user,
        firstLogin: data.firstLogin,
      });

      return buildEntryRoute(data.firstLogin);
    },
    [deviceId, setAuthSession],
  );

  const signInWithApple = useCallback(
    async (confirmTakeover: TakeoverConfirm, onProgress?: ProgressCallback): Promise<SessionEntryRoute> => {
      const currentDeviceId = deviceId || (await getOrCreateDeviceId());
      const data = await signInWithAppleRequest(currentDeviceId, confirmTakeover, onProgress);

      await setAuthSession({
        token: data.token,
        refreshToken: data.refresh_token,
        deviceId: currentDeviceId,
        user: data.user,
        firstLogin: data.firstLogin,
      });

      return buildEntryRoute(data.firstLogin);
    },
    [deviceId, setAuthSession],
  );

  const logout = useCallback(async () => {
    const currentDeviceId = deviceId || (await getOrCreateDeviceId());

    try {
      await fetch(`${API_BASE}/api/auth/logout2`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
          'x-device-id': currentDeviceId,
        },
        body: JSON.stringify({
          device_id: currentDeviceId,
        }),
      });
    } finally {
      await revokeGoogleSession();
      await clearAuthSession();
    }
  }, [clearAuthSession, deviceId, session.token]);

  useEffect(() => {
    configureApiClient({
      getDeviceId: async () => {
        const nextDeviceId = deviceId || (await getOrCreateDeviceId());
        if (!deviceId) {
          setDeviceId(nextDeviceId);
        }
        return nextDeviceId;
      },
      getSession: getSessionSnapshot,
      refreshSession,
    });
  }, [deviceId, getSessionSnapshot, refreshSession]);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [storedDeviceId, storedSession] = await Promise.all([getOrCreateDeviceId(), getAuthSession()]);

        setDeviceId(storedDeviceId);
        if (storedSession) {
          setSession(storedSession);
        }
      } finally {
        setIsHydrating(false);
      }
    };

    hydrate();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isHydrating,
      isAuthenticated: Boolean(session.token),
      token: session.token,
      refreshToken: session.refreshToken,
      deviceId,
      user: session.user,
      entryRoute,
      isAppleSupported: isAppleSignInSupported(),
      getOrCreateDeviceId,
      authFetch: apiFetch,
      setAuthSession,
      clearAuthSession,
      refreshSession,
      signInWithGoogle,
      signInWithApple,
      logout,
      updateUser,
      syncSession,
    }),
    [
      clearAuthSession,
      deviceId,
      entryRoute,
      isHydrating,
      logout,
      refreshSession,
      session.refreshToken,
      session.token,
      session.user,
      setAuthSession,
      signInWithApple,
      signInWithGoogle,
      syncSession,
      updateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
