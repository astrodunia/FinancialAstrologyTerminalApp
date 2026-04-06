export type AuthProviderName = 'google' | 'apple';

export type AuthProviders = {
  google?: { id: string };
  apple?: { id: string };
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  providers?: AuthProviders;
};

export type AuthSession = {
  token: string;
  refreshToken: string;
  user: AuthUser | null;
};

export type LoginResponse = {
  token: string;
  refresh_token: string;
  user: AuthUser;
  firstLogin: boolean;
};

export type TakeoverResponse = {
  error: 'device_limit_reached';
  limit: number;
};

export type ApiErrorPayload = {
  error?: string;
  message?: string;
  errors?: Array<{ msg?: string }>;
};

export type SessionEntryRoute = 'Home' | 'Plans';

export type HostedAuthProvider = 'google' | 'apple';

export type HostedAuthCallbackPayload = {
  token: string;
  refreshToken: string;
  firstLogin: boolean;
  error: string;
  message: string;
  user: AuthUser | null;
};
