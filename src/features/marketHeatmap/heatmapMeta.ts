import type { HeatmapMeta } from './types';

export const HEATMAP_META: HeatmapMeta[] = [
  {
    symbol: 'NVDA',
    sector: 'Technology',
    astroStrength: 9.4,
    logoUrl: 'https://logo.clearbit.com/nvidia.com',
  },
  {
    symbol: 'MSFT',
    sector: 'Technology',
    astroStrength: 8.9,
    logoUrl: 'https://logo.clearbit.com/microsoft.com',
  },
  {
    symbol: 'AAPL',
    sector: 'Technology',
    astroStrength: 8.3,
    logoUrl: 'https://logo.clearbit.com/apple.com',
  },
  {
    symbol: 'GOOGL',
    sector: 'Technology',
    astroStrength: 8.1,
    logoUrl: 'https://logo.clearbit.com/abc.xyz',
  },
  {
    symbol: 'AMZN',
    sector: 'Consumer',
    astroStrength: 8.7,
    logoUrl: 'https://logo.clearbit.com/amazon.com',
  },
  {
    symbol: 'META',
    sector: 'Technology',
    astroStrength: 8.6,
    logoUrl: 'https://logo.clearbit.com/meta.com',
  },
  {
    symbol: 'TSLA',
    sector: 'Consumer',
    astroStrength: 9.1,
    logoUrl: 'https://logo.clearbit.com/tesla.com',
  },
  {
    symbol: 'BRK.A',
    sector: 'Financial',
    astroStrength: 7.7,
    logoUrl: 'https://logo.clearbit.com/berkshirehathaway.com',
  },
  {
    symbol: 'JPM',
    sector: 'Financial',
    astroStrength: 8.0,
    logoUrl: 'https://logo.clearbit.com/jpmorganchase.com',
  },
  {
    symbol: 'BAC',
    sector: 'Financial',
    astroStrength: 7.4,
    logoUrl: 'https://logo.clearbit.com/bankofamerica.com',
  },
  {
    symbol: 'WFC',
    sector: 'Financial',
    astroStrength: 7.1,
    logoUrl: 'https://logo.clearbit.com/wellsfargo.com',
  },
  {
    symbol: 'WMT',
    sector: 'Consumer',
    astroStrength: 7.8,
    logoUrl: 'https://logo.clearbit.com/walmart.com',
  },
  {
    symbol: 'JNJ',
    sector: 'Healthcare',
    astroStrength: 7.2,
    logoUrl: 'https://logo.clearbit.com/jnj.com',
  },
  {
    symbol: 'PFE',
    sector: 'Healthcare',
    astroStrength: 7.0,
    logoUrl: 'https://logo.clearbit.com/pfizer.com',
  },
  {
    symbol: 'UNH',
    sector: 'Healthcare',
    astroStrength: 8.2,
    logoUrl: 'https://logo.clearbit.com/unitedhealthgroup.com',
  },
  {
    symbol: 'XOM',
    sector: 'Energy',
    astroStrength: 7.9,
    logoUrl: 'https://logo.clearbit.com/exxonmobil.com',
  },
  {
    symbol: 'CVX',
    sector: 'Energy',
    astroStrength: 7.6,
    logoUrl: 'https://logo.clearbit.com/chevron.com',
  },
];

export const HEATMAP_META_BY_SYMBOL = HEATMAP_META.reduce<Record<string, HeatmapMeta>>((acc, item) => {
  acc[item.symbol] = item;
  return acc;
}, {});

export const HEATMAP_TICKERS = HEATMAP_META.map((item) => item.symbol);
export const HEATMAP_TICKERS_CSV = HEATMAP_TICKERS.join(',');

