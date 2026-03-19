import { NativeModules, Platform } from 'react-native';

const API_PORT = 4500;

const getHostFromScriptUrl = () => {
  const scriptUrl = NativeModules?.SourceCode?.scriptURL || '';
  const matched = scriptUrl.match(/^https?:\/\/([^/:]+)(?::\d+)?/i);
  return matched?.[1] || '';
};

const isLocalhost = (host) => host === 'localhost' || host === '127.0.0.1' || host === '::1';

const resolveApiBaseUrl = () => {
  const devHost = __DEV__ ? getHostFromScriptUrl() : '';

  if (devHost) {
    if (Platform.OS === 'android') {
      if (isLocalhost(devHost)) return `http://10.0.2.2:${API_PORT}`;
      return `http://${devHost}:${API_PORT}`;
    }
    return `http://${devHost}:${API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://192.168.1.8:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const API_BASE_URL_DEBUG = {
  platform: Platform.OS,
  resolvedBaseUrl: API_BASE_URL,
  metroHost: getHostFromScriptUrl() || null,
};
