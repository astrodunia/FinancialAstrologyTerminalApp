import type { MeResponse } from './types';

const normalizePayload = (payload: any): MeResponse => {
  const root = payload?.data || payload || {};
  const user = root?.user || null;
  return {
    user,
    plan: root?.plan || user?.plan || null,
    quotas: root?.quotas || null,
    features: root?.features || null,
  };
};

export const fetchMe = async (authFetch: (path: string, init?: RequestInit & Record<string, any>) => Promise<Response>): Promise<MeResponse> => {
  let response = await authFetch('/api/me', { method: 'GET' });

  if (response.status === 404) {
    response = await authFetch('/api/auth/me', { method: 'GET' });
  }

  if (!response.ok) {
    throw new Error(`Failed to load /me (${response.status})`);
  }

  const payload = await response.json().catch(() => null);
  return normalizePayload(payload);
};
