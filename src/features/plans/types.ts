export type BackendPlanAddons = {
  insights?: boolean;
  consultation?: boolean;
};

export type BackendPlanOrg = {
  org_id?: string | null;
  org_role?: string | null;
  seat_number?: number | null;
  seat_limit?: number | null;
  paypal_subscription_id?: string | null;
};

export type BackendPlan = {
  tier?: string | null;
  sku?: string | null;
  expiresAt?: string | null;
  family?: string | null;
  addons?: BackendPlanAddons | null;
  org?: BackendPlanOrg | null;
  status?: string | null;
};

export type BackendQuota = {
  used?: number;
  max?: number;
};

export type BackendQuotas = {
  alerts?: BackendQuota;
  watchlist_symbols?: BackendQuota;
  watchlists?: BackendQuota;
  portfolio_positions?: BackendQuota;
};

export type BackendFeatures = {
  realtime_data?: boolean;
  full_calendar?: boolean;
  planetary_overlays?: boolean;
  astro_alerts?: boolean;
  priority_support?: boolean;
  seat_management?: boolean;
  shared_assets?: boolean;
  api_access?: boolean;
  sso?: boolean;
  account_manager?: boolean;
  insights?: boolean;
  consultation?: boolean;
};

export type MeResponse = {
  user?: Record<string, any> | null;
  plan?: BackendPlan | null;
  quotas?: BackendQuotas | null;
  features?: BackendFeatures | null;
};
