import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Bookmark, RefreshCcw, Search, X } from 'lucide-react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { useUser } from '../../store/UserContext';
import { navigateToStockDetail, normalizeStockSymbol } from '../../features/stocks/navigation';
import { useTickerSearch } from '../../features/stocks/useTickerSearch';
import {
  INDEX_TIMEFRAMES,
  classifyIndexMood,
  getSnapshotPreviousClose,
  normalizeIndexSymbol,
  normalizeIndexTimeframe,
  resolveIndexName,
  type IndexCandle,
  type IndexTimeframe,
} from '../../features/indices/api';
import { useIndexCandles, useIndexInfo, useIndexSnapshots } from '../../features/indices/hooks';

const INDEX_LIST = [
  { id: 'GSPC', name: 'S&P 500' },
  { id: 'IXIC', name: 'NASDAQ' },
  { id: 'DJI', name: 'Dow Jones' },
  { id: 'RUT', name: 'Russell 2000' },
];

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatSignedNumber = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '--';
  return `${value >= 0 ? '+' : ''}${nf2.format(value)}`;
};

const formatSignedPercent = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '--';
  return `${value >= 0 ? '+' : ''}${nf2.format(value)}%`;
};

const formatMarketValue = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '--';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
};

const formatValue = (value: number | null | undefined, digits = 2) => {
  if (value == null || Number.isNaN(value)) return '--';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const formatVolume = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return '--';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDateTime = (timestamp: number) => {
  if (!timestamp || Number.isNaN(timestamp)) return '--';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
};

const downsampleCandlesForChart = (candles: IndexCandle[], timeframe: IndexTimeframe) => {
  const maxPointsMap: Record<IndexTimeframe, number> = {
    '1D': 72,
    '5D': 80,
    '1M': 90,
    '2M': 90,
    '3M': 96,
    '6M': 104,
    '1Y': 120,
    '5Y': 140,
    ALL: 180,
  };

  const maxPoints = maxPointsMap[timeframe];
  if (candles.length <= maxPoints) return candles;

  const stride = Math.ceil(candles.length / maxPoints);
  const sampled = candles.filter((_, index) => index % stride === 0);
  const last = candles[candles.length - 1];

  if (sampled[sampled.length - 1]?.t !== last.t) {
    sampled.push(last);
  }

  return sampled;
};

const createPalette = (themeColors: any, theme: string) => ({
  background: themeColors.background,
  surface: themeColors.surface,
  surfaceAlt: themeColors.surfaceAlt,
  surfaceGlass: themeColors.surfaceGlass,
  border: themeColors.border,
  textPrimary: themeColors.textPrimary,
  textMuted: themeColors.textMuted,
  positive: themeColors.positive,
  negative: themeColors.negative,
  neutral: theme === 'dark' ? '#F5C36A' : '#B7791F',
  badgeBg: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(243,246,251,1)',
  shellBg: theme === 'dark' ? 'rgba(22,28,40,1)' : 'rgba(255,255,255,1)',
  shellBorder: 'transparent',
  chartCardBg: theme === 'dark' ? 'rgba(20,26,38,1)' : 'rgba(255,255,255,1)',
  chartTopTint: theme === 'dark' ? 'rgba(27,34,48,1)' : 'rgba(247,249,253,1)',
  chartChipBg: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(243,246,251,1)',
  chartChipBorder: 'transparent',
  chartActiveChipBg: theme === 'dark' ? '#F8FAFF' : '#122033',
  chartActiveChipText: theme === 'dark' ? '#0A1320' : '#FFFFFF',
  cardShadow: theme === 'dark' ? 0.24 : 0.11,
  statBg: theme === 'dark' ? 'rgba(20,26,38,1)' : 'rgba(255,255,255,1)',
  subtleLine: 'transparent',
  chartGrid: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
});

const buildChartGeometry = (candles: IndexCandle[], width: number, height: number) => {
  if (!candles.length) {
    return {
      linePath: '',
      areaPath: '',
      min: 0,
      max: 0,
    };
  }

  const values = candles.map((item) => item.c);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = candles.length === 1 ? 0 : width / (candles.length - 1);

  const points = candles.map((point, index) => {
    const x = index * step;
    const y = height - ((point.c - min) / range) * height;
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1]?.x.toFixed(2) || 0} ${height} L 0 ${height} Z`;

  return {
    linePath,
    areaPath,
    min,
    max,
  };
};

const StatCard = ({
  styles,
  label,
  value,
  valueStyle,
}: {
  styles: any;
  label: string;
  value: string;
  valueStyle?: any;
}) => (
  <View style={styles.statCard}>
    <AppText style={styles.statLabel}>{label}</AppText>
    <AppText style={[styles.statValue, valueStyle]}>{value}</AppText>
  </View>
);

const EmptyCard = ({ styles, title, message }: { styles: any; title: string; message: string }) => (
  <View style={styles.centerCard}>
    <AppText style={styles.centerTitle}>{title}</AppText>
    <AppText style={styles.centerMessage}>{message}</AppText>
  </View>
);

const MainChart = ({
  candles,
  color,
  themeColors,
  theme,
}: {
  candles: IndexCandle[];
  color: string;
  themeColors: Record<string, string>;
  theme: string;
}) => {
  const styles = useMemo(() => createStyles(themeColors, theme), [themeColors, theme]);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 68, 250);
  const chartHeight = 268;
  const plotHeight = chartHeight - 24;
  const values = candles.map((item) => item.c);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const { linePath, areaPath } = buildChartGeometry(candles, chartWidth, plotHeight);
  const step = candles.length === 1 ? 0 : chartWidth / (candles.length - 1);
  const softenedColor =
    color === '#199E63' || color === '#49D18D'
      ? '#16A34A'
      : color === '#CF3F58' || color === '#F08C8C'
        ? '#DC2626'
        : color;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const setNearestPoint = React.useCallback(
    (touchX: number) => {
      const clampedX = Math.max(0, Math.min(chartWidth, touchX));
      const index = step === 0 ? 0 : Math.round(clampedX / step);
      setActiveIndex(Math.max(0, Math.min(candles.length - 1, index)));
    },
    [candles.length, chartWidth, step],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (evt) => setNearestPoint(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => setNearestPoint(evt.nativeEvent.locationX),
        onPanResponderRelease: () => setActiveIndex(null),
        onPanResponderTerminate: () => setActiveIndex(null),
      }),
    [setNearestPoint],
  );

  const activePoint = useMemo(() => {
    if (activeIndex == null) return null;
    const point = candles[activeIndex];
    if (!point) return null;
    const x = step === 0 ? chartWidth / 2 : activeIndex * step;
    const y = plotHeight - ((point.c - min) / (max - min || 1)) * plotHeight;
    const baseline = candles[0]?.c ?? point.c;
    const delta = point.c - baseline;
    const pct = baseline ? (delta / baseline) * 100 : 0;
    return { point, x, y, delta, pct };
  }, [activeIndex, candles, chartWidth, max, min, plotHeight, step]);

  const tooltipTheme = {
    backgroundColor: theme === 'light' ? 'rgba(15, 23, 42, 0.94)' : 'rgba(9, 14, 24, 0.92)',
    borderColor: theme === 'light' ? 'rgba(255, 255, 255, 0.18)' : themeColors.border,
    titleColor: '#FFFFFF',
    bodyColor: theme === 'light' ? 'rgba(255,255,255,0.88)' : themeColors.textMuted,
  };

  return (
    <View>
      <View style={styles.chartWrap}>
        <Svg width={chartWidth} height={chartHeight}>
          <Rect x="0" y="0" width={chartWidth} height={chartHeight} rx="20" fill="transparent" />
          <Line x1="0" y1={plotHeight} x2={chartWidth} y2={plotHeight} stroke="rgba(148,163,184,0.16)" strokeWidth="1" />
          <Line x1={chartWidth * 0.36} y1={0} x2={chartWidth * 0.36} y2={plotHeight} stroke="rgba(148,163,184,0.10)" strokeWidth="1" />
          <Line x1={0} y1={plotHeight * 0.46} x2={chartWidth} y2={plotHeight * 0.46} stroke="rgba(148,163,184,0.10)" strokeWidth="1" strokeDasharray="4 4" />
          <Path d={areaPath} fill={softenedColor} opacity={0.12} />
          <Path d={linePath} fill="none" stroke={softenedColor} strokeOpacity={0.98} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
          {activePoint ? (
            <>
              <Line
                x1={activePoint.x}
                y1="0"
                x2={activePoint.x}
                y2={plotHeight}
                stroke={themeColors.textMuted}
                strokeOpacity={0.3}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <Circle cx={activePoint.x} cy={activePoint.y} r="6" fill={softenedColor} stroke={themeColors.surface} strokeWidth="3" />
            </>
          ) : null}
        </Svg>
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
        {activePoint ? (
          <View
            style={[
              styles.chartTooltip,
              {
                left: Math.min(Math.max(activePoint.x - 78, 8), chartWidth - 156),
                top: Math.max(activePoint.y - 76, 8),
                backgroundColor: tooltipTheme.backgroundColor,
                borderColor: tooltipTheme.borderColor,
              },
            ]}
            pointerEvents="none"
          >
            <AppText style={[styles.chartTooltipPrice, { color: tooltipTheme.titleColor }]}>
              {formatMarketValue(activePoint.point.c)}
            </AppText>
            <AppText style={[styles.chartTooltipTime, { color: tooltipTheme.bodyColor }]}>
              {formatDateTime(activePoint.point.t)}
            </AppText>
            <AppText style={[styles.chartTooltipChange, { color: tooltipTheme.titleColor }]}>
              {`${activePoint.delta >= 0 ? 'Up' : 'Down'} ${formatMarketValue(Math.abs(activePoint.delta))} (${activePoint.pct >= 0 ? '+' : ''}${activePoint.pct.toFixed(2)}%)`}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.chartLegendRow}>
        <AppText style={styles.chartLegendText}>{formatMarketValue(min)}</AppText>
        <AppText style={styles.chartLegendText}>{formatMarketValue(max)}</AppText>
      </View>
    </View>
  );
};

export function IndexDetailScreen({ navigation, route }: any) {
  const { theme, themeColors } = useUser() as any;
  const colors = useMemo(() => createPalette(themeColors, theme), [theme, themeColors]);
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);

  const routeSymbol = route?.params?.symbol;
  const routeTf = route?.params?.tf;
  const symbol = useMemo(() => normalizeIndexSymbol(routeSymbol), [routeSymbol]);
  const initialTf = useMemo(() => normalizeIndexTimeframe(routeTf), [routeTf]);
  const [selectedTf, setSelectedTf] = useState<IndexTimeframe>(initialTf);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSelectedTf(initialTf);
  }, [initialTf, symbol]);

  const indexInfo = useIndexInfo(symbol);
  const candlesState = useIndexCandles(symbol, selectedTf);
  const { results, loading: searchLoading, error: searchError } = useTickerSearch(searchQuery, {
    enabled: searchOpen,
    limit: 8,
  });

  const remainingSymbols = useMemo(
    () => INDEX_LIST.map((item) => item.id).filter((item) => item !== symbol),
    [symbol],
  );
  const remainingIndices = useIndexSnapshots(remainingSymbols);

  const snapshot = indexInfo.info;
  const previousClose = getSnapshotPreviousClose(snapshot);
  const latestCandle = candlesState.latest;
  const displayPrice = snapshot?.price ?? latestCandle?.c ?? previousClose ?? null;
  const title = resolveIndexName(symbol, snapshot?.name);
  const mood = classifyIndexMood(snapshot?.changePercent ?? null);
  const isPositive = (snapshot?.change ?? 0) >= 0;

  const chartCandles = useMemo(
    () => downsampleCandlesForChart(candlesState.candles, selectedTf),
    [candlesState.candles, selectedTf],
  );

  const chartData = useMemo(
    () => chartCandles.map((item) => ({ x: new Date(item.t), y: item.c })),
    [chartCandles],
  );

  const fullScreenLoading =
    !symbol || ((indexInfo.loading || candlesState.loading) && !snapshot && candlesState.candles.length === 0);

  const onSelectTimeframe = (nextTf: IndexTimeframe) => {
    setSelectedTf(nextTf);
    navigation?.setParams?.({ symbol, tf: nextTf });
  };

  const onRefresh = () => {
    indexInfo.reload();
    candlesState.reload();
    remainingIndices.reload();
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const submitTickerSearch = () => {
    const normalized = normalizeStockSymbol(searchQuery);
    if (/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized)) {
      closeSearch();
      navigateToStockDetail(navigation, normalized);
      return;
    }

    if ((results[0] as any)?.symbol) {
      closeSearch();
      navigateToStockDetail(navigation, (results[0] as any).symbol);
    }
  };

  const selectTickerSearchResult = (item: any) => {
    if (!item?.symbol) return;
    closeSearch();
    navigateToStockDetail(navigation, item.symbol);
  };

  const openIndex = (nextSymbol: string) => {
    navigation?.push?.('IndexDetail', { symbol: nextSymbol, tf: selectedTf });
  };

  const rangeTone =
    candlesState.rangeChangePercent == null
      ? null
      : candlesState.rangeChangePercent >= 0
        ? styles.positiveText
        : styles.negativeText;

  return (
    <View style={styles.screen}>
      <GradientBackground>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <AppText style={styles.eyebrow}>Global Index</AppText>
                <AppText style={styles.screenTitle}>{title || 'Index'}</AppText>
                <AppText style={styles.screenSubtitle}>
                  {symbol || '--'} • {snapshot?.marketState ? String(snapshot.marketState).toUpperCase() : 'STATE N/A'}
                </AppText>
              </View>

              <Pressable style={styles.refreshButton} onPress={() => setSearchOpen((value) => !value)}>
                {searchOpen ? <X size={18} color={colors.textPrimary} /> : <Search size={18} color={colors.textPrimary} />}
              </Pressable>
            </View>

            {searchOpen ? (
              <View style={styles.searchCard}>
                <View style={styles.searchInputRow}>
                  <Search size={16} color={colors.textMuted} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search stocks or companies"
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                    autoFocus
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={submitTickerSearch}
                  />
                  {searchQuery.trim() ? (
                    <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                      <X size={14} color={colors.textMuted} />
                    </Pressable>
                  ) : null}
                </View>

                {searchLoading ? (
                  <View style={styles.searchStateRow}>
                    <ActivityIndicator size="small" color={colors.textMuted} />
                    <AppText style={styles.searchStateText}>Searching…</AppText>
                  </View>
                ) : searchError ? (
                  <AppText style={styles.searchStateText}>{searchError}</AppText>
                ) : searchQuery.trim() ? (
                  results.length ? (
                    <View style={styles.searchResultsList}>
                      {results.map((item: any, index) => (
                        <Pressable
                          key={`${item.symbol}-${index}`}
                          style={[styles.searchResultRow, index === 0 && styles.searchResultRowFirst]}
                          onPress={() => selectTickerSearchResult(item)}
                        >
                          <View style={styles.searchResultMain}>
                            <AppText style={styles.searchResultSymbol}>{item.symbol}</AppText>
                            <AppText numberOfLines={1} style={styles.searchResultName}>
                              {item.name || 'Unknown company'}
                            </AppText>
                          </View>
                          {item.exchange ? <AppText style={styles.searchResultMeta}>{item.exchange}</AppText> : null}
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <AppText style={styles.searchStateText}>No matches found.</AppText>
                  )
                ) : (
                  <AppText style={styles.searchHintText}>Search by stock symbol or company name.</AppText>
                )}
              </View>
            ) : null}

            {!symbol ? (
              <EmptyCard styles={styles} title="Missing symbol" message="Open this screen with a valid index symbol." />
            ) : fullScreenLoading ? (
              <View style={styles.centerCard}>
                <ActivityIndicator size="small" color={colors.textPrimary} />
                <AppText style={styles.centerMessage}>Loading index details...</AppText>
              </View>
            ) : (
              <>
                <View style={styles.chartHeroCard}>
                  <View style={styles.chartTopRow}>
                    <View style={styles.chartIdentityBlock}>
                      <View style={styles.chartTitleRow}>
                        <AppText style={styles.chartTitle}>{title}</AppText>
                        <View
                          style={[
                            styles.moodBadge,
                            mood === 'BULLISH' && styles.moodBadgeBullish,
                            mood === 'BEARISH' && styles.moodBadgeBearish,
                            mood === 'NEUTRAL' && styles.moodBadgeNeutral,
                          ]}
                        >
                          <AppText
                            style={[
                              styles.moodText,
                              mood === 'BULLISH' && styles.positiveText,
                              mood === 'BEARISH' && styles.negativeText,
                              mood === 'NEUTRAL' && styles.neutralText,
                            ]}
                          >
                            {mood}
                          </AppText>
                        </View>
                      </View>

                      <AppText style={styles.chartSymbol}>{symbol}</AppText>

                      <View style={styles.chartValueLine}>
                        <AppText style={styles.chartHeadlinePrice}>
                          {displayPrice == null ? '--' : formatMarketValue(displayPrice)}
                        </AppText>
                        <AppText style={[styles.chartHeadlineDelta, isPositive ? styles.positiveText : styles.negativeText]}>
                          {typeof snapshot?.change === 'number' && typeof snapshot?.changePercent === 'number'
                            ? `${formatSignedNumber(snapshot.change)} (${formatSignedPercent(snapshot.changePercent)})`
                            : '--'}
                        </AppText>
                        <AppText style={styles.chartHeadlineTf}>{selectedTf === 'ALL' ? 'All' : selectedTf}</AppText>
                      </View>
                    </View>

                    <Pressable style={styles.iconRefreshButton} onPress={onRefresh}>
                      <RefreshCcw size={15} color={colors.textMuted} />
                    </Pressable>
                  </View>

                  <View style={styles.chartMetaGrid}>
                    <View style={styles.metaPillModern}>
                      <AppText style={styles.metaPillLabel}>Prev Close</AppText>
                      <AppText style={styles.metaPillValue}>{previousClose == null ? '--' : formatValue(previousClose, 2)}</AppText>
                    </View>
                    <View style={styles.metaPillModern}>
                      <AppText style={styles.metaPillLabel}>Range</AppText>
                      <AppText style={[styles.metaPillValue, rangeTone]}>
                        {candlesState.rangeChangePercent == null ? '--' : formatSignedPercent(candlesState.rangeChangePercent)}
                      </AppText>
                    </View>
                    <View style={styles.metaPillModern}>
                      <AppText style={styles.metaPillLabel}>State</AppText>
                      <AppText style={styles.metaPillValue}>
                        {snapshot?.marketState ? String(snapshot.marketState).toUpperCase() : '--'}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.actionPillsRow}>
                    <Pressable style={styles.actionPill}>
                      <Bell size={14} color={colors.textMuted} />
                      <AppText style={styles.actionPillText}>Alert</AppText>
                    </Pressable>

                    <Pressable style={styles.actionPill}>
                      <Bookmark size={14} color={colors.textMuted} />
                      <AppText style={styles.actionPillText}>Watch</AppText>
                    </Pressable>
                  </View>

                  <View style={styles.chartCanvasShell}>
                    {candlesState.loading && !candlesState.candles.length ? (
                      <View style={styles.chartPlaceholder}>
                        <ActivityIndicator size="small" color={colors.textPrimary} />
                        <AppText style={styles.centerMessage}>Loading candles...</AppText>
                      </View>
                    ) : candlesState.error && !candlesState.candles.length ? (
                      <EmptyCard styles={styles} title="Chart unavailable" message={candlesState.error} />
                    ) : chartData.length === 0 ? (
                      <EmptyCard styles={styles} title="No chart data" message="No candles were returned for this index." />
                    ) : (
                      <MainChart
                        candles={chartCandles}
                        color={candlesState.rangeChangePercent != null && candlesState.rangeChangePercent < 0 ? colors.negative : colors.positive}
                        themeColors={themeColors}
                        theme={theme}
                      />
                    )}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartTfWrap}
                  >
                    {INDEX_TIMEFRAMES.map((tf) => {
                      const active = tf === selectedTf;
                      return (
                        <Pressable
                          key={tf}
                          onPress={() => onSelectTimeframe(tf)}
                          style={[styles.chartTfChip, active && styles.chartTfChipActive]}
                        >
                          <AppText style={[styles.chartTfChipText, active && styles.chartTfChipTextActive]}>
                            {tf === 'ALL' ? 'All' : tf}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.section}>
                  <AppText style={styles.sectionTitle}>Stats</AppText>
                  <View style={styles.statsGrid}>
                    <StatCard styles={styles} label="Prev Close" value={previousClose == null ? '--' : formatValue(previousClose, 2)} />
                    <StatCard
                      styles={styles}
                      label="Range TF"
                      value={candlesState.rangeChangePercent == null ? '--' : formatSignedPercent(candlesState.rangeChangePercent)}
                      valueStyle={rangeTone}
                    />
                    <StatCard styles={styles} label="Open (last)" value={formatValue(latestCandle?.o ?? null, 2)} />
                    <StatCard styles={styles} label="High (last)" value={formatValue(latestCandle?.h ?? null, 2)} />
                    <StatCard styles={styles} label="Low (last)" value={formatValue(latestCandle?.l ?? null, 2)} />
                    <StatCard styles={styles} label="Close (last)" value={formatValue(latestCandle?.c ?? null, 2)} />
                    <StatCard styles={styles} label="Volume (last)" value={formatVolume(latestCandle?.v ?? null)} />
                    <StatCard styles={styles} label="High in range" value={formatValue(candlesState.rangeHigh, 2)} />
                    <StatCard styles={styles} label="Low in range" value={formatValue(candlesState.rangeLow, 2)} />
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.cardHeaderRow}>
                    <AppText style={styles.sectionTitle}>More Indices</AppText>
                    {remainingIndices.loading ? <ActivityIndicator size="small" color={colors.textMuted} /> : null}
                  </View>

                  {remainingIndices.error && !remainingIndices.data?.length ? (
                    <EmptyCard styles={styles} title="Could not load indices" message={remainingIndices.error} />
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.remainingRow}>
                      {(remainingIndices.data || [])
                        .map((item) => ({
                          ...item,
                          symbol: normalizeIndexSymbol(item.symbol),
                        }))
                        .filter((item) => item.symbol && item.symbol !== symbol)
                        .map((item) => {
                          const itemMood = classifyIndexMood(item.changePercent ?? null);
                          const itemPositive = (item.change ?? 0) >= 0;
                          const itemPreviousClose = getSnapshotPreviousClose(item);
                          const itemPrice = item.price ?? itemPreviousClose ?? null;

                          return (
                            <Pressable key={item.symbol} style={styles.remainingCard} onPress={() => openIndex(item.symbol)}>
                              <View style={styles.remainingHeader}>
                                <View style={styles.symbolPill}>
                                  <AppText style={styles.symbolPillText}>{item.symbol}</AppText>
                                </View>
                                <View
                                  style={[
                                    styles.smallBadge,
                                    itemMood === 'BULLISH' && styles.moodBadgeBullish,
                                    itemMood === 'BEARISH' && styles.moodBadgeBearish,
                                    itemMood === 'NEUTRAL' && styles.moodBadgeNeutral,
                                  ]}
                                >
                                  <AppText
                                    style={[
                                      styles.smallBadgeText,
                                      itemMood === 'BULLISH' && styles.positiveText,
                                      itemMood === 'BEARISH' && styles.negativeText,
                                      itemMood === 'NEUTRAL' && styles.neutralText,
                                    ]}
                                  >
                                    {itemMood}
                                  </AppText>
                                </View>
                              </View>
                              <AppText style={styles.remainingPrice}>
                                {itemPrice == null ? '--' : nf0.format(itemPrice)}
                              </AppText>
                              <AppText style={[styles.remainingDelta, itemPositive ? styles.positiveText : styles.negativeText]}>
                                {item.change == null ? '--' : `${formatSignedNumber(item.change)} (${formatSignedPercent(item.changePercent)})`}
                              </AppText>
                            </Pressable>
                          );
                        })}
                    </ScrollView>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          <BottomTabs activeRoute="Overview" navigation={navigation} />
        </SafeAreaView>
      </GradientBackground>
    </View>
  );
}

const createStyles = (colors: any, theme: string) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 10,
      paddingTop: 12,
      paddingBottom: 116,
      gap: 18,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 4,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    eyebrow: {
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      fontFamily: FONT.medium,
    },
    screenTitle: {
      fontSize: 20,
      lineHeight: 34,
      color: colors.textPrimary,
      fontFamily: FONT.extraBold,
    },
    screenSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    refreshButton: {
      width: 42,
      height: 42,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.shellBg,
    },
    searchCard: {
      borderRadius: 18,
      backgroundColor: colors.chartCardBg,
      padding: 12,
      gap: 10,
    },
    searchInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 14,
      backgroundColor: colors.chartChipBg,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchInput: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 14,
      paddingVertical: 0,
      fontFamily: FONT.regular,
    },
    clearSearchButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchResultsList: {
      overflow: 'hidden',
      borderRadius: 14,
      backgroundColor: colors.chartTopTint,
    },
    searchResultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.chartGrid,
    },
    searchResultRowFirst: {
      borderTopWidth: 0,
    },
    searchResultMain: {
      flex: 1,
      gap: 3,
    },
    searchResultSymbol: {
      fontSize: 14,
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },
    searchResultName: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    searchResultMeta: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },
    searchStateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 4,
    },
    searchStateText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    searchHintText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: FONT.regular,
      paddingHorizontal: 4,
    },
    chartHeroCard: {
      overflow: 'hidden',
      borderRadius: 24,
      backgroundColor: colors.chartCardBg,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 14,
    },
    chartTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    chartIdentityBlock: {
      flex: 1,
      gap: 2,
    },
    chartTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    chartTitle: {
      fontSize: 18,
      color: colors.textPrimary,
      fontFamily: FONT.extraBold,
    },
    chartSymbol: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: FONT.medium,
      textTransform: 'uppercase',
    },
    chartValueLine: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: 6,
      marginTop: 4,
    },
    chartHeadlinePrice: {
      fontSize: 22,
      color: theme === 'dark' ? '#FFFFFF' : '#122033',
      fontFamily: FONT.extraBold,
    },
    chartHeadlineDelta: {
      fontSize: 14,
      fontFamily: FONT.semiBold,
    },
    chartHeadlineTf: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },
    iconRefreshButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.chartChipBg,
    },
    chartMetaGrid: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    metaPillModern: {
      minWidth: 88,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: colors.chartChipBg,
      gap: 2,
    },
    metaPillLabel: {
      fontSize: 10,
      color: colors.textMuted,
      fontFamily: FONT.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    metaPillValue: {
      fontSize: 13,
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },
    actionPillsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.chartChipBg,
    },
    actionPillText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },
    chartCanvasShell: {
      borderRadius: 18,
      backgroundColor: colors.chartTopTint,
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 4,
    },
    chartWrap: {
      position: 'relative',
    },
    chartLegendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingHorizontal: 2,
    },
    chartLegendText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    chartTooltip: {
      position: 'absolute',
      width: 156,
      borderRadius: 16,
      borderWidth: 0,
      paddingHorizontal: 12,
      paddingVertical: 10,
      shadowColor: '#000000',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    chartTooltipPrice: {
      fontSize: 13,
      fontFamily: FONT.extraBold,
    },
    chartTooltipTime: {
      marginTop: 2,
      fontSize: 10,
      fontFamily: FONT.medium,
    },
    chartTooltipChange: {
      marginTop: 6,
      fontSize: 11,
      fontFamily: FONT.semiBold,
      lineHeight: 15,
    },
    chartPlaceholder: {
      minHeight: 220,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    chartTfWrap: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: 4,
      paddingRight: 8,
    },
    chartTfChip: {
      minWidth: 50,
      borderRadius: 999,
      backgroundColor: colors.chartChipBg,
      paddingHorizontal: 12,
      paddingVertical: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartTfChipActive: {
      backgroundColor: colors.chartActiveChipBg,
    },
    chartTfChipText: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },
    chartTfChipTextActive: {
      color: colors.chartActiveChipText,
    },
    section: {
      gap: 10,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statCard: {
      width: '48%',
      minWidth: 150,
      borderRadius: 16,
      backgroundColor: colors.statBg,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 6,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      fontFamily: FONT.medium,
    },
    statValue: {
      fontSize: 15,
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },
    centerCard: {
      minHeight: 180,
      borderRadius: 24,
      backgroundColor: colors.statBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      gap: 10,
    },
    centerTitle: {
      fontSize: 18,
      color: colors.textPrimary,
      textAlign: 'center',
      fontFamily: FONT.semiBold,
    },
    centerMessage: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      fontFamily: FONT.regular,
    },
    remainingRow: {
      gap: 12,
      paddingRight: 4,
    },
    remainingCard: {
      width: 210,
      overflow: 'hidden',
      borderRadius: 18,
      backgroundColor: colors.statBg,
      padding: 12,
      gap: 8,
    },
    remainingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    symbolPill: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.chartChipBg,
    },
    symbolPillText: {
      fontSize: 10,
      color: colors.textPrimary,
      fontFamily: FONT.medium,
    },
    smallBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.badgeBg,
    },
    smallBadgeText: {
      fontSize: 10,
      fontFamily: FONT.medium,
    },
    remainingName: {
      fontSize: 14,
      color: colors.textPrimary,
      fontFamily: FONT.medium,
    },
    remainingPrice: {
      fontSize: 24,
      color: colors.textPrimary,
      fontFamily: FONT.extraBold,
    },
    remainingDelta: {
      fontSize: 12,
      fontFamily: FONT.medium,
    },
    moodBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.badgeBg,
      alignSelf: 'flex-start',
    },
    moodBadgeBullish: {
      backgroundColor: colors.badgeBg,
    },
    moodBadgeBearish: {
      backgroundColor: colors.badgeBg,
    },
    moodBadgeNeutral: {
      backgroundColor: colors.badgeBg,
    },
    moodText: {
      fontSize: 11,
      fontFamily: FONT.medium,
    },
    positiveText: {
      color: colors.positive,
      fontFamily: FONT.semiBold,
    },
    negativeText: {
      color: colors.negative,
      fontFamily: FONT.semiBold,
    },
    neutralText: {
      color: colors.neutral,
      fontFamily: FONT.semiBold,
    },
  });

export default IndexDetailScreen;
