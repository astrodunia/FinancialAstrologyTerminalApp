import {
  DEFAULT_CHART_TIMEFRAME,
  buildStockDetailPath,
  getChartTimeframeConfig,
  normalizeChartTimeframe,
  normalizeStockSymbol,
  normalizeStockTab,
} from '../src/features/stocks/navigation';

test('normalizes stock symbols to uppercase and trims whitespace', () => {
  expect(normalizeStockSymbol(' brk.b ')).toBe('BRK-B');
});

test('builds the web-shaped stock detail path', () => {
  expect(buildStockDetailPath('aapl')).toBe('/s/AAPL');
  expect(buildStockDetailPath('brk.b', 'chart', '5Y')).toBe('/s/BRK.B/chart/5Y');
});

test('falls back to default tab and timeframe when invalid', () => {
  expect(normalizeStockTab('bad-tab')).toBe('overview');
  expect(normalizeChartTimeframe('100Y')).toBe(DEFAULT_CHART_TIMEFRAME);
  expect(getChartTimeframeConfig('1D')).toEqual({ label: '1D', period: '1d', interval: '1m' });
});
