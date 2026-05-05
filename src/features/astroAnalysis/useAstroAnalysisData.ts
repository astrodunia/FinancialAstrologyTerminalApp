import { useCallback, useEffect, useState } from 'react';
import { fetchAstroAnalysis } from './api';
import type { GroupedAstroAnalysis, AstroAnalysisRow } from './types';

type FetcherFunc = (path: string, init?: RequestInit) => Promise<Response>;

export type AstroAnalysisState = {
  data: GroupedAstroAnalysis | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cachedData: GroupedAstroAnalysis | null = null;
let cacheTimestamp = 0;

export const useAstroAnalysisData = (fetcher: FetcherFunc): AstroAnalysisState => {
  const [data, setData] = useState<GroupedAstroAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (skipCache = false) => {
      const now = Date.now();
      const isCacheValid = cachedData && now - cacheTimestamp < CACHE_TTL;

      if (isCacheValid && !skipCache) {
        setData(cachedData);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAstroAnalysis(fetcher);
        cachedData = result;
        cacheTimestamp = now;
        setData(result);
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);

        // Keep using cached data on error
        if (cachedData) {
          setData(cachedData);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetcher],
  );

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(async () => {
    await load(true);
  }, [load]);

  return { data, isLoading, error, refetch };
};
