export type HeatmapSector = 'Technology' | 'Financial' | 'Healthcare' | 'Energy' | 'Consumer';

export type HeatmapMeta = {
  symbol: string;
  sector: HeatmapSector;
  astroStrength: number;
  logoUrl?: string;
};

export type DashboardInfoEnvelope = {
  ok: boolean;
  count?: number;
  data?: Record<
    string,
    {
      ok: boolean;
      status: number;
      data?: {
        symbol: string;
        name: string | null;
        price: number | null;
        prevClose: number | null;
        sessionClose: number | null;
        volume: number | null;
      };
    }
  >;
};

export type HeatmapQuote = {
  symbol: string;
  name: string;
  sector: HeatmapSector;
  astroStrength: number;
  logoUrl?: string;
  price: number | null;
  prevClose: number | null;
  sessionClose: number | null;
  volume: number | null;
  change: number;
  size: number;
};

export type HeatmapLegendSector = {
  sector: HeatmapSector;
  color: string;
};

