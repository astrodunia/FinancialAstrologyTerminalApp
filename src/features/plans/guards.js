const normalizeSku = (plan) => String(plan?.id || plan?.sku || '').trim().toLowerCase();

export const getPlanSku = (plan) => normalizeSku(plan);

export const hasAddon = (plan, addon) => Boolean(plan?.addons?.[addon]);

export const hasProAccess = (plan) => {
  if (typeof plan?.features?.realtime_data === 'boolean') {
    return plan.features.realtime_data;
  }
  const sku = normalizeSku(plan);
  return sku === 'pro' || sku.startsWith('pro_') || sku === 'enterprise' || sku.startsWith('enterprise_');
};

export const hasInsightsAccess = (plan) => {
  if (typeof plan?.features?.insights === 'boolean') {
    return plan.features.insights;
  }
  const sku = normalizeSku(plan);
  return hasAddon(plan, 'insights') || sku.includes('insights');
};

export const hasConsultationAccess = (plan) => {
  if (typeof plan?.features?.consultation === 'boolean') {
    return plan.features.consultation;
  }
  const sku = normalizeSku(plan);
  return hasAddon(plan, 'consultation') || sku.includes('consult');
};

export const hasEnterpriseAccess = (plan) => {
  if (typeof plan?.features?.seat_management === 'boolean') {
    return plan.features.seat_management;
  }
  const sku = normalizeSku(plan);
  return sku === 'enterprise' || sku.startsWith('enterprise_');
};

export const canAccessFeature = (plan, featureKey) => {
  switch (featureKey) {
    case 'basic':
      return true;
    case 'pro':
      return hasProAccess(plan);
    case 'insights':
      return hasInsightsAccess(plan);
    case 'consultation':
      return hasConsultationAccess(plan);
    case 'enterprise':
      return hasEnterpriseAccess(plan);
    default:
      return false;
  }
};
