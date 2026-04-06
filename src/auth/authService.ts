import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth, appleAuthAndroid } from '@invertase/react-native-apple-authentication';
import { API_BASE } from './apiClient';
import type { ApiErrorPayload, LoginResponse } from './types';

const googleServices = require('../../android/app/google-services.json');

const GOOGLE_LOGIN_PATH = '/api/auth/google/mobile';
const APPLE_LOGIN_PATH = '/api/auth/apple/mobile';

type TakeoverConfirm = () => Promise<boolean>;
type ProgressCallback = (message: string) => void;

type GoogleLoginPayload = {
  id_token: string;
  device_id: string;
  force: boolean;
};

type AppleLoginPayload = {
  identity_token: string;
  authorization_code: string;
  apple_user: string;
  email: string;
  name: string;
  device_id: string;
  force: boolean;
};

const getApiError = (payload: ApiErrorPayload | null | undefined): string => {
  return payload?.error || payload?.message || payload?.errors?.[0]?.msg || '';
};

const logAuthDebug = (label: string, details: Record<string, unknown>): void => {
  console.log(`[AuthDebug] ${label}`, details);
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const atobFn = (globalThis as { atob?: (value: string) => string }).atob;
    const decoded = typeof atobFn === 'function' ? atobFn(padded) : '';

    if (!decoded) {
      return null;
    }

    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const getGoogleWebClientId = (): string => {
  const clients = Array.isArray(googleServices?.client) ? googleServices.client : [];

  for (const client of clients) {
    const oauthClients = Array.isArray(client?.oauth_client) ? client.oauth_client : [];
    const webClient = oauthClients.find(
      (oauthClient: { client_type?: number; client_id?: string }) =>
        Number(oauthClient?.client_type) === 3 &&
        typeof oauthClient?.client_id === 'string' &&
        oauthClient.client_id.endsWith('.apps.googleusercontent.com'),
    );

    if (webClient?.client_id) {
      return webClient.client_id;
    }
  }

  throw new Error('Google webClientId with client_type 3 was not found in android/app/google-services.json');
};

let didConfigureGoogle = false;

export const configureGoogleSignIn = (): void => {
  if (didConfigureGoogle) {
    return;
  }

  const webClientId = getGoogleWebClientId();
  GoogleSignin.configure({
    webClientId,
  });
  logAuthDebug('google.configure', { webClientId });
  didConfigureGoogle = true;
};

const postJson = async <TPayload extends Record<string, unknown>>(
  path: string,
  payload: TPayload,
  deviceId: string,
): Promise<{ response: Response; data: LoginResponse | ApiErrorPayload | null }> => {
  logAuthDebug('request.start', {
    path,
    deviceId,
    payloadKeys: Object.keys(payload),
    hasIdToken: typeof payload.id_token === 'string' ? payload.id_token.length > 0 : false,
    hasIdentityToken: typeof payload.identity_token === 'string' ? payload.identity_token.length > 0 : false,
    force: payload.force,
  });

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-device-id': deviceId,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  logAuthDebug('request.response', {
    path,
    status: response.status,
    ok: response.ok,
    data,
  });
  return { response, data };
};

const resolveTakeover = async <TPayload extends { force: boolean }>(
  path: string,
  payload: TPayload,
  deviceId: string,
  confirmTakeover: TakeoverConfirm,
): Promise<LoginResponse> => {
  let result = await postJson(path, payload, deviceId);
  const errorPayload = result.data as ApiErrorPayload | null;

  if (result.response.status === 409 && errorPayload?.error === 'device_limit_reached') {
    const shouldContinue = await confirmTakeover();
    if (!shouldContinue) {
      throw new Error('Sign-in cancelled.');
    }

    result = await postJson(path, { ...payload, force: true }, deviceId);
  }

  if (!result.response.ok) {
    throw new Error(getApiError(result.data as ApiErrorPayload | null) || `Request failed (${result.response.status})`);
  }

  return result.data as LoginResponse;
};

export const signInWithGoogleRequest = async (
  deviceId: string,
  confirmTakeover: TakeoverConfirm,
  onProgress?: ProgressCallback,
): Promise<LoginResponse> => {
  configureGoogleSignIn();
  onProgress?.('Checking Google Play Services...');
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  logAuthDebug('google.playServices.ok', { deviceId });

  onProgress?.('Opening Google account chooser...');
  const signInResult = (await GoogleSignin.signIn()) as { data?: { idToken?: string }; idToken?: string };
  const idToken = signInResult?.data?.idToken || signInResult?.idToken;
  const decodedPayload = idToken ? decodeJwtPayload(idToken) : null;
  logAuthDebug('google.signIn.result', {
    deviceId,
    resultKeys: signInResult ? Object.keys(signInResult) : [],
    dataKeys: signInResult?.data ? Object.keys(signInResult.data) : [],
    hasIdToken: Boolean(idToken),
    idTokenLength: idToken ? idToken.length : 0,
    tokenClaims: decodedPayload
      ? {
          iss: decodedPayload.iss,
          aud: decodedPayload.aud,
          azp: decodedPayload.azp,
          exp: decodedPayload.exp,
          email: decodedPayload.email,
          email_verified: decodedPayload.email_verified,
          sub: decodedPayload.sub,
        }
      : null,
  });

  if (!idToken) {
    throw new Error('No Google ID token returned by native sign-in.');
  }

  const payload: GoogleLoginPayload = {
    id_token: idToken,
    device_id: deviceId,
    force: false,
  };

  onProgress?.('Verifying Google account with server...');
  return resolveTakeover(GOOGLE_LOGIN_PATH, payload, deviceId, confirmTakeover);
};

export const signInWithAppleRequest = async (
  deviceId: string,
  confirmTakeover: TakeoverConfirm,
  onProgress?: ProgressCallback,
): Promise<LoginResponse> => {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS.');
  }

  onProgress?.('Opening Apple sign-in...');
  const appleResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  });
  logAuthDebug('apple.signIn.result', {
    deviceId,
    hasIdentityToken: Boolean(appleResponse.identityToken),
    hasAuthorizationCode: Boolean(appleResponse.authorizationCode),
    hasEmail: Boolean(appleResponse.email),
    hasName: Boolean(appleResponse.fullName?.givenName || appleResponse.fullName?.familyName),
  });

  const identityToken = appleResponse.identityToken || '';
  const authorizationCode = appleResponse.authorizationCode || '';
  if (!identityToken || !authorizationCode) {
    throw new Error('Apple Sign-In did not return the required identity token.');
  }

  const fullName = [appleResponse.fullName?.givenName, appleResponse.fullName?.familyName].filter(Boolean).join(' ').trim();
  const payload: AppleLoginPayload = {
    identity_token: identityToken,
    authorization_code: authorizationCode,
    apple_user: appleResponse.user,
    email: appleResponse.email || '',
    name: fullName,
    device_id: deviceId,
    force: false,
  };

  onProgress?.('Verifying Apple account with server...');
  return resolveTakeover(APPLE_LOGIN_PATH, payload, deviceId, confirmTakeover);
};

export const revokeGoogleSession = async (): Promise<void> => {
  try {
    await GoogleSignin.revokeAccess();
  } catch {}

  try {
    await GoogleSignin.signOut();
  } catch {}
};

export const isAppleSignInSupported = (): boolean => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  if (typeof appleAuthAndroid !== 'undefined' && appleAuthAndroid) {
    return false;
  }

  return appleAuth.isSupported;
};
