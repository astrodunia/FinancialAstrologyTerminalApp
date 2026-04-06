import * as Keychain from 'react-native-keychain';
import type { AuthSession, AuthUser } from './types';

const AUTH_SERVICE = 'com.financialastrologyterminalapp.auth';

type StoredAuthPayload = {
  auth_token: string;
  refresh_token: string;
  auth_user: AuthUser | null;
};

const toStoredPayload = (session: AuthSession): StoredAuthPayload => ({
  auth_token: session.token,
  refresh_token: session.refreshToken,
  auth_user: session.user,
});

const fromStoredPayload = (payload: StoredAuthPayload): AuthSession => ({
  token: payload.auth_token || '',
  refreshToken: payload.refresh_token || '',
  user: payload.auth_user || null,
});

export const saveAuthSession = async (session: AuthSession): Promise<void> => {
  await Keychain.setGenericPassword('session', JSON.stringify(toStoredPayload(session)), {
    service: AUTH_SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
  const stored = await Keychain.getGenericPassword({ service: AUTH_SERVICE });
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored.password) as StoredAuthPayload;
    return fromStoredPayload(parsed);
  } catch {
    await clearAuthSessionStorage();
    return null;
  }
};

export const updateStoredUser = async (user: AuthUser | null): Promise<void> => {
  const current = await getAuthSession();
  if (!current) {
    return;
  }

  await saveAuthSession({
    ...current,
    user,
  });
};

export const updateStoredToken = async (token: string): Promise<void> => {
  const current = await getAuthSession();
  if (!current) {
    return;
  }

  await saveAuthSession({
    ...current,
    token,
  });
};

export const clearAuthSessionStorage = async (): Promise<void> => {
  await Keychain.resetGenericPassword({ service: AUTH_SERVICE });
};

