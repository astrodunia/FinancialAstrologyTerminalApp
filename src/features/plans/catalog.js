const PLAN_CATALOG = [
  {
    id: 'basic',
    title: 'Basic',
    subtitle: 'Anyone exploring the terminal',
    price: '$0',
    family: 'basic',
    badge: 'Starter',
    description: 'A clean entry point for testing dashboards, layouts, and lightweight tracking.',
    bullets: ['Core dashboards', 'Snapshot data', '2 watchlists', '25 tickers in each watchlist'],
  },
  {
    id: 'pro',
    title: 'Pro',
    subtitle: 'Individual traders',
    price: '$500 / month',
    family: 'pro',
    badge: 'Popular',
    description: 'Built for active market participants who need realtime data, overlays, and timing tools.',
    bullets: ['Realtime market data', 'Full calendars', 'Planetary overlays', 'Multiple watchlists and higher limits'],
  },
  {
    id: 'pro_insights',
    title: 'Pro + Insights',
    subtitle: 'Curated market windows',
    price: '$1,000 / month',
    family: 'pro',
    badge: 'Research',
    description: 'Adds curated windows and stronger context for traders who want higher-conviction timing.',
    bullets: ['Everything in Pro', 'Insights windows', 'Higher-conviction timing workflows', 'Priority research context'],
  },
  {
    id: 'pro_insights_consult',
    title: 'Pro + Insights + Consultation',
    subtitle: 'Curated windows plus weekly 1:1 time',
    price: '$2,000 / month',
    family: 'pro',
    badge: 'Advisor',
    description: 'For users who want direct analyst interaction in addition to data, overlays, and insights.',
    bullets: ['Everything in Pro + Insights', 'Weekly 1:1 consultation', 'Higher-touch guidance', 'Deeper workflow support'],
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    subtitle: 'Teams and desks',
    price: '$1,000 / user / month',
    family: 'enterprise',
    badge: 'Team',
    description: 'A desk-ready plan with seat controls, shared workflows, and broader operational support.',
    bullets: ['Everything in Pro', 'Seat management', 'Shared workflows', 'Account support'],
  },
  {
    id: 'enterprise_insights',
    title: 'Enterprise + Insights',
    subtitle: 'Firms with curated windows',
    price: '$2,000 / user / month',
    family: 'enterprise',
    badge: 'Desk Research',
    description: 'Adds guided timing context for firms that need shared workflows and curated windows together.',
    bullets: ['Everything in Enterprise', 'Insights windows', 'Team-ready research context', 'Broader workflow coverage'],
  },
  {
    id: 'enterprise_insights_consult',
    title: 'Enterprise + Insights + Consultation',
    subtitle: 'Firms that also want analyst time',
    price: '$3,000 / user / month',
    family: 'enterprise',
    badge: 'White Glove',
    description: 'The highest-touch package for firms that want platform depth plus weekly consultation.',
    bullets: ['Everything in Enterprise + Insights', 'Weekly 1:1 consultation', 'Higher-touch support', 'Advanced team workflow guidance'],
  },
];

const PLAN_GROUPS = [
  {
    key: 'basic',
    title: 'Start Simple',
    body: 'For new users who want the terminal structure without full trading depth yet.',
  },
  {
    key: 'pro',
    title: 'Trade With Precision',
    body: 'For active traders who want realtime data, overlays, curated windows, and optional consultation.',
  },
  {
    key: 'enterprise',
    title: 'Scale Across Teams',
    body: 'For desks and firms that need seat controls, shared workflows, and higher-touch support.',
  },
];

const PLAN_FEATURES = [
  {
    label: 'Realtime market data',
    values: {
      basic: false,
      pro: true,
      pro_insights: true,
      pro_insights_consult: true,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Planetary overlays and alerts',
    values: {
      basic: false,
      pro: true,
      pro_insights: true,
      pro_insights_consult: true,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Watchlist capacity',
    values: {
      basic: '2 watchlists x 25 tickers',
      pro: 'Multiple / plan-based',
      pro_insights: 'Multiple / plan-based',
      pro_insights_consult: 'Multiple / plan-based',
      enterprise: 'Shared team capacity',
      enterprise_insights: 'Shared team capacity',
      enterprise_insights_consult: 'Shared team capacity',
    },
  },
  {
    label: 'Price and volume alerts',
    values: {
      basic: '3',
      pro: '50',
      pro_insights: '50',
      pro_insights_consult: '50',
      enterprise: '250 / seat',
      enterprise_insights: '250 / seat',
      enterprise_insights_consult: '250 / seat',
    },
  },
  {
    label: 'Curated insights windows',
    values: {
      basic: false,
      pro: false,
      pro_insights: true,
      pro_insights_consult: true,
      enterprise: false,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Weekly 1:1 consultation',
    values: {
      basic: false,
      pro: false,
      pro_insights: false,
      pro_insights_consult: true,
      enterprise: false,
      enterprise_insights: false,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Seat management and shared lists',
    values: {
      basic: false,
      pro: false,
      pro_insights: false,
      pro_insights_consult: false,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'API access and SSO',
    values: {
      basic: false,
      pro: false,
      pro_insights: false,
      pro_insights_consult: false,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
  {
    label: 'Dedicated account manager',
    values: {
      basic: false,
      pro: false,
      pro_insights: false,
      pro_insights_consult: false,
      enterprise: true,
      enterprise_insights: true,
      enterprise_insights_consult: true,
    },
  },
];

const normalizeValue = (value) => String(value || '').trim().toLowerCase().replace(/[\s+/.-]+/g, '_');

const PLAN_ALIAS_MAP = {
  starter: 'basic',
  free: 'basic',
  trial: 'basic',
  basic: 'basic',
  pro: 'pro',
  pro_insights: 'pro_insights',
  pro_with_insights: 'pro_insights',
  pro_plus_insights: 'pro_insights',
  research: 'pro_insights',
  pro_insights_consult: 'pro_insights_consult',
  pro_insights_consultation: 'pro_insights_consult',
  pro_plus_insights_plus_consultation: 'pro_insights_consult',
  advisor: 'pro_insights_consult',
  enterprise: 'enterprise',
  enterprise_insights: 'enterprise_insights',
  enterprise_plus_insights: 'enterprise_insights',
  enterprise_insights_consult: 'enterprise_insights_consult',
  enterprise_insights_consultation: 'enterprise_insights_consult',
  enterprise_plus_insights_plus_consultation: 'enterprise_insights_consult',
  white_glove: 'enterprise_insights_consult',
};

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'paid', 'current', 'enabled']);
const DEFAULT_LIMITS_BY_PLAN = {
  basic: {
    watchlists: 2,
    watchlistSymbols: 25,
    alerts: 0,
    portfolioPositions: 5,
  },
  pro: {
    watchlists: null,
    watchlistSymbols: null,
    alerts: 50,
    portfolioPositions: null,
  },
  pro_insights: {
    watchlists: null,
    watchlistSymbols: null,
    alerts: 50,
    portfolioPositions: null,
  },
  pro_insights_consult: {
    watchlists: null,
    watchlistSymbols: null,
    alerts: 50,
    portfolioPositions: null,
  },
  enterprise: {
    watchlists: null,
    watchlistSymbols: null,
    alerts: 250,
    portfolioPositions: null,
  },
  enterprise_insights: {
    watchlists: null,
    watchlistSymbols: null,
    alerts: 250,
    portfolioPositions: null,
  },
  enterprise_insights_consult: {
    watchlists: null,
    watchlistSymbols: null,
    alerts: 250,
    portfolioPositions: null,
  },
};

const getQuotaLimit = (quota, fallback = null) => {
  const max = quota?.max;
  if (typeof max === 'number' && max > 0) {
    return max;
  }
  return fallback;
};

export const getPlanById = (planId) => PLAN_CATALOG.find((plan) => plan.id === planId) || null;

export const resolvePlanId = (value) => {
  const normalized = normalizeValue(value);
  return PLAN_ALIAS_MAP[normalized] || (getPlanById(normalized) ? normalized : null);
};

export const resolveCurrentPlan = (user) => {
  const source = user || {};
  const subscription = source.subscription || source.membership || source.billing || {};
  const planPayload = source.plan || subscription.plan || {};
  const rawPlanValue =
    planPayload.sku ||
    planPayload.tier ||
    planPayload.id ||
    planPayload.slug ||
    planPayload.name ||
    source.planId ||
    source.plan_id ||
    source.plan ||
    source.subscriptionPlan ||
    source.subscription_plan ||
    source.membershipPlan ||
    source.membership_plan ||
    subscription.planId ||
    subscription.plan_id ||
    subscription.plan?.id ||
    subscription.plan?.slug ||
    subscription.plan?.name ||
    subscription.tier ||
    subscription.name ||
    '';

  const planId = resolvePlanId(rawPlanValue);
  const plan = getPlanById(planId);
  const statusRaw =
    source.subscriptionStatus ||
    source.subscription_status ||
    source.planStatus ||
    source.plan_status ||
    planPayload.status ||
    subscription.status ||
    source.status ||
    '';
  const status = String(statusRaw || '').trim().toLowerCase();
  const isActive = status ? ACTIVE_STATUSES.has(status) : Boolean(plan);

  if (!plan) {
    return {
      id: null,
      title: 'No active plan',
      subtitle: 'Plan not available from current session',
      price: '--',
      family: null,
      badge: 'Unknown',
      description: 'The app did not receive a subscription plan in the current user session.',
      bullets: [],
      status: status || 'unknown',
      isActive: false,
      featureValues: {},
      addons: {
        insights: false,
        consultation: false,
      },
      expiresAt: null,
      org: null,
      features: {},
      quotas: {},
      limits: {
        watchlists: null,
        watchlistSymbols: null,
        alerts: null,
        portfolioPositions: null,
      },
    };
  }

  const backendFeatures = source.features || {};
  const backendQuotas = source.quotas || {};
  const defaults = DEFAULT_LIMITS_BY_PLAN[plan.id] || DEFAULT_LIMITS_BY_PLAN.basic;
  const featureValues = PLAN_FEATURES.reduce((acc, feature) => {
    acc[feature.label] = feature.values[plan.id];
    return acc;
  }, {});

  return {
    ...plan,
    status: status || 'active',
    isActive,
    featureValues,
    addons: {
      insights: Boolean(planPayload?.addons?.insights ?? backendFeatures?.insights ?? plan.id.includes('insights')),
      consultation: Boolean(planPayload?.addons?.consultation ?? backendFeatures?.consultation ?? plan.id.includes('consult')),
    },
    expiresAt: planPayload?.expiresAt || planPayload?.expires_at || null,
    org: planPayload?.org || null,
    features: backendFeatures,
    quotas: backendQuotas,
    limits: {
      watchlists: getQuotaLimit(backendQuotas?.watchlists, defaults.watchlists),
      watchlistSymbols: getQuotaLimit(backendQuotas?.watchlist_symbols, defaults.watchlistSymbols),
      alerts: getQuotaLimit(backendQuotas?.alerts, defaults.alerts),
      portfolioPositions: getQuotaLimit(backendQuotas?.portfolio_positions, defaults.portfolioPositions),
    },
  };
};

export { PLAN_CATALOG, PLAN_GROUPS, PLAN_FEATURES };
