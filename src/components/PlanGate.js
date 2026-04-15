import React from 'react';
import { View } from 'react-native';
import { canAccessFeature } from '../features/plans/guards';

export default function PlanGate({ plan, feature, fallback = null, children }) {
  if (canAccessFeature(plan, feature)) {
    return <>{children}</>;
  }

  return <View>{fallback}</View>;
}
