import { API_BASE_URL as API_BASE } from '../utils/apiBaseUrl';

export { API_BASE };

export const SESSION_INVALID_ERRORS = new Set(['session_revoked', 'session_rotated', 'invalid_refresh']);

type SessionSnapshot = {
  token: string;
};

type RequestBody = RequestInit['body'] | Record<string, unknown> | null | undefined;
type RequestHeaders = RequestInit['headers'];

type ConfigureApiClientArgs = {
  getDeviceId: () => Promise<string>;
  getSession: () => SessionSnapshot | null;
  refreshSession: () => Promise<string | null>;
};

export type ApiRequestInit = RequestInit & {
  allowUnauthorized?: boolean;
  skipAuthRefresh?: boolean;
};

let apiClientConfig: ConfigureApiClientArgs | null = null;

export const configureApiClient = (config: ConfigureApiClientArgs): void => {
  apiClientConfig = config;
};

const isJsonBodyCandidate = (body: RequestBody): body is Record<string, unknown> => {
  if (!body || typeof body !== 'object') {
    return false;
  }

  if (body instanceof FormData) {
    return false;
  }

  if (body instanceof URLSearchParams) {
    return false;
  }

  return true;
};

const buildUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

const normalizeHeaders = (
  incomingHeaders: RequestHeaders | undefined,
  token: string,
  deviceId: string,
  hasJsonBody: boolean,
): Headers => {
  const headers = new Headers(incomingHeaders || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.delete('Authorization');
  }

  headers.set('x-device-id', deviceId);
  return headers;
};

const executeFetch = async (path: string, init: ApiRequestInit, token: string, deviceId: string): Promise<Response> => {
  const body = init.body as RequestBody;
  const hasJsonBody = isJsonBodyCandidate(body);
  const headers = normalizeHeaders(init.headers, token, deviceId, hasJsonBody);
  const resolvedBody = hasJsonBody ? JSON.stringify(body) : (body as RequestInit['body']);

  return fetch(buildUrl(path), {
    ...init,
    headers,
    body: resolvedBody,
  });
};

export const apiFetch = async (path: string, init: ApiRequestInit = {}): Promise<Response> => {
  if (!apiClientConfig) {
    throw new Error('apiClient is not configured.');
  }

  const deviceId = await apiClientConfig.getDeviceId();
  const session = apiClientConfig.getSession();
  const token = session?.token || '';
  const allowUnauthorized = Boolean(init.allowUnauthorized);
  const skipAuthRefresh = Boolean(init.skipAuthRefresh);

  let response = await executeFetch(path, init, token, deviceId);
  if (response.status !== 401 || allowUnauthorized || skipAuthRefresh || !token) {
    return response;
  }

  const nextToken = await apiClientConfig.refreshSession();
  if (!nextToken) {
    return response;
  }

  response = await executeFetch(path, init, nextToken, deviceId);
  return response;
};
