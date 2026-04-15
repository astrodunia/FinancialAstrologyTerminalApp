export type AuthProviderName = 'google' | 'apple';

export type AuthProviders = {
  google?: { id: string };
  apple?: { id: string };
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  plan?: Record<string, any> | null;
  subscription?: Record<string, any> | null;
  billing?: Record<string, any> | null;
  membership?: Record<string, any> | null;
  planId?: string;
  plan_id?: string;
  subscriptionStatus?: string;
  subscription_status?: string;
  [key: string]: any;
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
