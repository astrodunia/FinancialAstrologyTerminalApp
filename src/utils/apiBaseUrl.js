import { NativeModules, Platform } from 'react-native';

const API_PORT = 4500;
const API_PROTOCOL = 'http';

// Optional single-point override for a physical device or a remote backend.
// Examples:
//   '192.168.1.8'
//   'api.example.com'
// Leave empty to auto-detect from the Metro host in development.
const API_HOST_OVERRIDE = '';

const getHostFromScriptUrl = () => {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL || '';
  const matched = scriptUrl.match(/^https?:\/\/([^/:]+)(?::\d+)?/i);
  return matched?.[1] || '';
};

const normalizeHost = (host) => String(host || '').trim().replace(/^https?:\/\//i, '').replace(/:\d+$/, '');

const isLocalhost = (host) => {
  const normalizedHost = normalizeHost(host);
  return normalizedHost === 'localhost' || normalizedHost === '127.0.0.1' || normalizedHost === '::1';
};

const buildBaseUrl = (host) => `${API_PROTOCOL}://${normalizeHost(host)}:${API_PORT}`;

const resolveApiHost = () => {
  const overrideHost = normalizeHost(API_HOST_OVERRIDE);
  if (overrideHost) {
    return {
      host: overrideHost,
      source: 'manual_override',
    };
  }

  const metroHost = normalizeHost(__DEV__ ? getHostFromScriptUrl() : '');
  if (metroHost) {
    if (Platform.OS === 'android' && isLocalhost(metroHost)) {
      return {
        host: '192.168.1.6',
        source: 'android_emulator_loopback',
      };
    }

    return {
      host: metroHost,
      source: 'metro_host',
    };
  }

  if (__DEV__ && Platform.OS === 'android') {
    return {
      host: '192.168.1.6',
      source: 'android_dev_fallback',
    };
  }

  if (__DEV__ && Platform.OS === 'ios') {
    return {
      host: 'localhost',
      source: 'ios_dev_fallback',
    };
  }

  return {
    host: 'localhost',
    source: 'generic_fallback',
  };
};

const resolveApiBaseUrl = () => {
  return buildBaseUrl(resolveApiHost().host);
};

export const API_BASE_URL = resolveApiBaseUrl();
export const LIVE_API_BASE = 'https://finance.rajeevprakash.com';
export const buildApiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const API_BASE_URL_DEBUG = {
  platform: Platform.OS,
  resolvedBaseUrl: API_BASE_URL,
  resolution: resolveApiHost().source,
  hostOverride: normalizeHost(API_HOST_OVERRIDE) || null,
  metroHost: getHostFromScriptUrl() || null,
};

