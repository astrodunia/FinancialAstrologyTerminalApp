export const STOCK_DETAIL_TABS = ['overview', 'chart', 'fundamentals', 'news', 'alerts'];
export const DEFAULT_STOCK_TAB = 'overview';
export const DEFAULT_CHART_TIMEFRAME = '1M';

export const TF_CONFIG = {
  '1D': { period: '1d', interval: '1m' },
  '5D': { period: '5d', interval: '1m' },
  '1M': { period: '1mo', interval: '30m' },
  '2M': { period: '3mo', interval: '15m' },
  '3M': { period: '3mo', interval: '30m' },
  '6M': { period: '6mo', interval: '15m' },
  '1Y': { period: '1y', interval: '30m' },
  '5Y': { period: '5y', interval: '1wk' },
  ALL: { period: 'max', interval: '1mo' },
};

export const TF_INTERVAL_FALLBACKS = {
  '1D': ['1m', '2m', '5m', '15m'],
  '5D': ['5m', '15m', '30m', '1h'],
  '1M': ['30m', '15m', '5m', '1h', '1d'],
  '2M': ['15m', '30m', '1h', '1d'],
  '3M': ['30m', '1h', '1d'],
  '6M': ['15m', '30m', '1h', '1d'],
  '1Y': ['30m', '1h', '1d', '1wk'],
  '5Y': ['1wk', '1mo'],
  ALL: ['1mo', '1wk'],
};

export const CHART_TIMEFRAME_OPTIONS = Object.entries(TF_CONFIG).map(([label, value]) => ({
  label,
  ...value,
}));

export const normalizeStockSymbol = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase();
};

export const normalizeStockTab = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return STOCK_DETAIL_TABS.includes(normalized) ? normalized : DEFAULT_STOCK_TAB;
};

export const normalizeChartTimeframe = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return CHART_TIMEFRAME_OPTIONS.some((item) => item.label === normalized)
    ? normalized
    : DEFAULT_CHART_TIMEFRAME;
};

export const getChartTimeframeConfig = (value) => {
  const normalized = normalizeChartTimeframe(value);
  return CHART_TIMEFRAME_OPTIONS.find((item) => item.label === normalized) || CHART_TIMEFRAME_OPTIONS[2];
};

export const buildStockDetailPath = (symbol, tab, timeframe) => {
  const normalizedSymbol = normalizeStockSymbol(symbol);
  if (!normalizedSymbol) return '/s';

  const normalizedTab = normalizeStockTab(tab);
  const normalizedTimeframe = normalizeChartTimeframe(timeframe);
  const parts = ['/s', encodeURIComponent(normalizedSymbol)];

  if (normalizedTab !== DEFAULT_STOCK_TAB || (normalizedTab === 'chart' && normalizedTimeframe !== DEFAULT_CHART_TIMEFRAME)) {
    parts.push(normalizedTab);
  }

  if (normalizedTab === 'chart' && normalizedTimeframe !== DEFAULT_CHART_TIMEFRAME) {
    parts.push(normalizedTimeframe);
  }

  return parts.join('/');
};

export const navigateToStockDetail = (navigation, symbol, options = {}) => {
  const normalizedSymbol = normalizeStockSymbol(symbol);
  if (!navigation || !normalizedSymbol) return;

  const tab = normalizeStockTab(options.tab);
  const timeframe = normalizeChartTimeframe(options.timeframe);

  navigation.navigate('StockDetail', {
    symbol: normalizedSymbol,
    tab,
    tf: tab === 'chart' ? timeframe : undefined,
    path: buildStockDetailPath(normalizedSymbol, tab, timeframe),
  });
};
