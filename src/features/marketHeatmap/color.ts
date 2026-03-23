import type { HeatmapLegendSector, HeatmapSector } from './types';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const SECTOR_TINTS: Record<HeatmapSector, string> = {
  Technology: '#5B7CFA',
  Financial: '#22C55E',
  Healthcare: '#EF5A8A',
  Energy: '#F59E0B',
  Consumer: '#8B5CF6',
};

export const HEATMAP_LEGEND_SECTORS: HeatmapLegendSector[] = [
  { sector: 'Technology', color: SECTOR_TINTS.Technology },
  { sector: 'Financial', color: SECTOR_TINTS.Financial },
  { sector: 'Healthcare', color: SECTOR_TINTS.Healthcare },
  { sector: 'Energy', color: SECTOR_TINTS.Energy },
  { sector: 'Consumer', color: SECTOR_TINTS.Consumer },
];

const getPositiveFill = (change: number) => {
  const strength = clamp(change / 4, 0, 1);
  if (strength < 0.12) return '#67C98A';
  if (strength < 0.28) return '#43BA72';
  if (strength < 0.52) return '#239B57';
  if (strength < 0.78) return '#137A43';
  return '#0A5A31';
};

const getNegativeFill = (change: number) => {
  const strength = clamp(Math.abs(change) / 4, 0, 1);
  if (strength < 0.12) return '#ED7D89';
  if (strength < 0.28) return '#E75C6B';
  if (strength < 0.52) return '#D93A4E';
  if (strength < 0.78) return '#B72639';
  return '#8E1728';
};

export const getHeatmapTileColors = (change: number, astroStrength: number) => {
  const fill = change > 0 ? getPositiveFill(change) : change < 0 ? getNegativeFill(change) : '#BFC4C9';
  const isNeutral = change === 0;
  const border = 'transparent';
  const text = '#FFFFFF';
  const subtext = 'rgba(255,255,255,0.92)';
  const glow = astroStrength > 8 ? 'rgba(255,255,255,0.18)' : null;

  return {
    fill,
    border,
    text,
    subtext,
    glow,
    isNeutral,
  };
};
