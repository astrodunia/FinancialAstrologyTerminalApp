import { useQuery } from '@tanstack/react-query';
import { HEATMAP_TICKERS_CSV } from './heatmapMeta';
import { createMockHeatmapData, fetchHeatmapEnvelope, transformHeatmapEnvelope } from './api';
import type { HeatmapQuote } from './types';

export const HEATMAP_QUERY_KEY = ['market-heatmap', HEATMAP_TICKERS_CSV] as const;

export const useHeatmapData = () => {
  return useQuery<HeatmapQuote[]>({
    queryKey: HEATMAP_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const payload = await fetchHeatmapEnvelope(HEATMAP_TICKERS_CSV, signal);
      return transformHeatmapEnvelope(payload);
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });
};

export { createMockHeatmapData };

