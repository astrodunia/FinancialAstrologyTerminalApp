import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '../features/plans/api';
import { resolveCurrentPlan } from '../features/plans/catalog';
import { useUser } from '../store/UserContext';

export const usePlan = () => {
  const { token, authFetch, updateUserProfile, user, currentPlan, isHydrating } = useUser() as any;

  const query = useQuery({
    queryKey: ['me-plan', token],
    enabled: Boolean(token) && !isHydrating,
    queryFn: async () => {
      const payload = await fetchMe(authFetch);
      const mergedUser = {
        ...(payload?.user || {}),
        plan: payload?.plan || null,
        quotas: payload?.quotas || null,
        features: payload?.features || null,
      };

      await updateUserProfile(mergedUser);
      return payload;
    },
    staleTime: 60 * 1000,
  });

  const resolvedPlan = query.data
    ? resolveCurrentPlan({
        ...(query.data?.user || user),
        plan: query.data?.plan || null,
        quotas: query.data?.quotas || null,
        features: query.data?.features || null,
      })
    : currentPlan;

  return {
    ...query,
    plan: resolvedPlan,
    user: query.data?.user || user,
    refreshPlan: query.refetch,
  };
};
