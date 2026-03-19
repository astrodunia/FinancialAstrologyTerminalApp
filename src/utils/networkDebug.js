import { Platform } from 'react-native';

const tag = '[NetworkDebug]';

const toStringSafe = (value) => {
  if (value == null) return '';
  try {
    return String(value);
  } catch {
    return '';
  }
};

export const logRequestStart = ({ label, url, method = 'GET', meta = {} }) => {
  console.log(`${tag} ${label} request`, {
    platform: Platform.OS,
    url,
    method,
    at: new Date().toISOString(),
    ...meta,
  });
};

export const logResponse = async ({ label, response }) => {
  const contentType = response.headers?.get?.('content-type') || '';
  console.log(`${tag} ${label} response`, {
    status: response.status,
    ok: response.ok,
    contentType,
    redirected: response.redirected,
    url: response.url,
  });
};

export const logRequestError = ({ label, url, error }) => {
  console.error(`${tag} ${label} error`, {
    platform: Platform.OS,
    url,
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
  });
};

export const networkHintForAndroidLoopback = ({ apiBaseUrl, error }) => {
  const message = toStringSafe(error?.message).toLowerCase();
  const usesLoopback = toStringSafe(apiBaseUrl).includes('10.0.2.2');
  const isNetworkFailure = message.includes('network request failed') || message.includes('failed to fetch');

  if (Platform.OS === 'android' && usesLoopback && isNetworkFailure) {
    return 'Network request failed. `10.0.2.2` works only on Android emulator. On a physical phone use your laptop LAN IP (for example `http://192.168.x.x:4500`).';
  }

  return null;
};
