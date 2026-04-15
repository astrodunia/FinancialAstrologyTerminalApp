import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Bookmark, RefreshCcw, Search, X } from 'lucide-react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import AppDialog from '../../components/AppDialog';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import { hasProAccess } from '../../features/plans/guards';
import { useUser } from '../../store/UserContext';
import { navigateToStockDetail, normalizeStockSymbol } from '../../features/stocks/navigation';
import {
  addSymbol as addSymbolToWatchlist,
  createList as createWatchlist,
  getListById,
  getLists as getWatchlists,
  removeSymbol as removeSymbolFromWatchlist,
} from '../../services/watchlistApi';
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

const nakshatraTransitData = require('../../../nakshatra-transits.json');

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

const formatDateTime = (timestamp: number | string | null | undefined) => {
  if (timestamp == null || timestamp === '') return '--';
  const dt = new Date(timestamp);
  if (!Number.isFinite(dt.getTime())) return '--';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dt);
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

type TransitMode = 'planetary' | 'nakshatra';

type TransitRow = {
  planet: string;
  rashi: string;
  start: string;
  end: string | null;
  metadata?: {
    calendarYear?: number;
    timezone?: string;
    source?: string;
  };
  extras?: {
    nakshatra?: string | null;
    motion?: string | null;
    comment?: string | null;
  };
};

type TransitPerformance = {
  key: string;
  mode: TransitMode;
  planet: string;
  label: string;
  subLabel: string;
  start: string;
  end: string | null;
  startClose: number;
  endClose: number;
  absChange: number;
  pctChange: number;
  isActive: boolean;
};

const TRANSIT_SOURCE_NAKSHATRA = 'drikpanchang-nakshatra';
const DRIK_PLANET_MAP: Record<string, string> = {
  surya: 'Sun',
  chandra: 'Moon',
  mangal: 'Mars',
  budha: 'Mercury',
  guru: 'Jupiter',
  shukra: 'Venus',
  shani: 'Saturn',
  rahu: 'Rahu',
  ketu: 'Ketu',
  arun: 'Uranus',
  varun: 'Neptune',
  yama: 'Pluto',
};

const parseTransitIso = (value?: string | null) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
    const dt = new Date(`${value}+05:30`);
    return Number.isFinite(dt.getTime()) ? dt.toISOString() : null;
  }
  const dt = new Date(value);
  return Number.isFinite(dt.getTime()) ? dt.toISOString() : null;
};

const normalizeNakshatraLabel = (raw?: string | null) => {
  const cleaned = String(raw || '').trim();
  if (!cleaned) {
    return { label: 'Unknown', nakshatra: 'Unknown', motion: null as string | null };
  }

  const hasTruePrefix = /^True\s+/i.test(cleaned);
  const deTrue = cleaned.replace(/^True\s+/i, '').trim();
  const transitMatch = deTrue.match(/transits to\s+(.+)$/i);
  const target = (transitMatch?.[1] || deTrue).trim();
  const motion = hasTruePrefix ? 'True' : null;

  return {
    label: motion ? `${motion} ${target}` : target,
    nakshatra: target,
    motion,
  };
};

const buildNakshatraRows = (dataset: any): TransitRow[] => {
  const years = dataset?.years || {};
  const byPlanet = new Map<string, any[]>();

  Object.entries(years).forEach(([yearKey, planetMap]) => {
    const yearNum = Number(yearKey);
    if (!Number.isFinite(yearNum) || !planetMap || typeof planetMap !== 'object') return;

    Object.entries(planetMap as Record<string, any>).forEach(([planetKey, payload]) => {
      const planet = DRIK_PLANET_MAP[planetKey.toLowerCase()] || planetKey;
      const transits = Array.isArray(payload?.transits) ? payload.transits : [];
      const parsed = transits
        .map((transit: any) => {
          const start = parseTransitIso(transit?.transitTime);
          if (!start) return null;
          const end = parseTransitIso(transit?.transitEndTime);
          const label = normalizeNakshatraLabel(transit?.nakshatra);
          return {
            planet,
            yearNum,
            start,
            end,
            label,
            raw: typeof transit?.nakshatra === 'string' ? transit.nakshatra : '',
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.start.localeCompare(b.start));

      const bucket = byPlanet.get(planet) || [];
      bucket.push(...parsed);
      byPlanet.set(planet, bucket);
    });
  });

  const rows: TransitRow[] = [];
  byPlanet.forEach((entries, planet) => {
    const sorted = entries.slice().sort((a: any, b: any) => a.start.localeCompare(b.start));
    sorted.forEach((entry: any, index: number) => {
      const next = sorted[index + 1];
      rows.push({
        planet,
        rashi: entry.label.label,
        start: entry.start,
        end: entry.end || (next ? next.start : null),
        metadata: {
          calendarYear: entry.yearNum,
          timezone: 'Asia/Kolkata',
          source: TRANSIT_SOURCE_NAKSHATRA,
        },
        extras: {
          nakshatra: entry.label.nakshatra,
          motion: entry.label.motion,
          comment: entry.raw ? `Raw: ${entry.raw}` : null,
        },
      });
    });
  });

  return rows.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
};

const ALL_NAKSHATRA_ROWS: TransitRow[] = buildNakshatraRows(nakshatraTransitData);

const PremiumLockedSection = ({
  styles,
  title,
  body,
  onPress,
}: {
  styles: ReturnType<typeof createStyles>;
  title: string;
  body: string;
  onPress: () => void;
}) => (
  <View style={styles.premiumLockedCard}>
    <View style={styles.premiumLockedGlow} />
    <AppText style={styles.premiumLockedEyebrow}>Pro Preview</AppText>
    <AppText style={styles.premiumLockedTitle}>{title}</AppText>
    <AppText style={styles.premiumLockedBody}>{body}</AppText>
    <Pressable style={styles.premiumLockedButton} onPress={onPress}>
      <AppText style={styles.premiumLockedButtonText}>Go to plans</AppText>
    </Pressable>
  </View>
);

const overlapsRange = (row: TransitRow, startTs: number, endTs: number) => {
  const rowStart = new Date(row.start).getTime();
  const rowEnd = row.end ? new Date(row.end).getTime() : endTs;
  if (!Number.isFinite(rowStart) || !Number.isFinite(rowEnd)) return false;
  return rowEnd >= startTs && rowStart <= endTs;
};

const findCandleAtOrAfter = (points: IndexCandle[], targetTs: number) => {
  for (let index = 0; index < points.length; index += 1) {
    if (points[index].t >= targetTs) return points[index];
  }
  return null;
};

const findCandleAtOrBefore = (points: IndexCandle[], targetTs: number) => {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].t <= targetTs) return points[index];
  }
  return null;
};

const computeTransitPerformance = (
  rows: TransitRow[],
  candles: IndexCandle[],
  rangeEndTs: number,
  mode: TransitMode,
): TransitPerformance[] =>
  rows
    .map((row, index) => {
      const startTs = new Date(row.start).getTime();
      const endTs = row.end ? new Date(row.end).getTime() : rangeEndTs;
      if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs < startTs) return null;

      const startPoint = findCandleAtOrAfter(candles, startTs) || findCandleAtOrBefore(candles, startTs);
      const endPoint = findCandleAtOrBefore(candles, endTs) || findCandleAtOrAfter(candles, endTs);
      const startClose = startPoint?.c ?? null;
      const endClose = endPoint?.c ?? null;
      if (startClose == null || endClose == null || startClose === 0) return null;

      const absChange = endClose - startClose;
      const pctChange = (absChange / startClose) * 100;
      const now = Date.now();
      const activeEndTs = row.end ? endTs : Math.max(endTs, now);
      const isActive = startTs <= now && now <= activeEndTs;

      const label = mode === 'nakshatra' ? row.extras?.nakshatra || row.rashi || row.planet : `${row.planet} • ${row.rashi}`;
      const subLabel =
        mode === 'nakshatra'
          ? row.planet
          : row.extras?.nakshatra
            ? `${row.rashi} • ${row.extras.nakshatra}`
            : row.rashi;

      return {
        key: [
          mode,
          row.planet,
          row.start,
          row.end || 'open',
          row.rashi,
          row.extras?.nakshatra || '',
          row.metadata?.source || 'unknown',
          row.metadata?.calendarYear ?? 'na',
          index,
        ].join(':'),
        mode,
        planet: row.planet,
        label,
        subLabel,
        start: row.start,
        end: row.end,
        startClose,
        endClose,
        absChange,
        pctChange,
        isActive,
      };
    })
    .filter((item): item is TransitPerformance => item != null)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

async function fetchPlanetaryTransitRows(authFetch: any, years: number[], signal?: AbortSignal): Promise<TransitRow[]> {
  const allRows: TransitRow[] = [];

  for (const year of years) {
    const response = await authFetch(`/api/transits?year=${encodeURIComponent(String(year))}`, {
      method: 'GET',
      signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.error || payload?.message || `Failed to fetch transit rows for ${year}.`;
      throw new Error(message);
    }
    const rows = Array.isArray(payload?.rows) ? payload.rows : [];
    allRows.push(...rows);
  }

  return allRows;
}

const useTransitPerformance = (candles: IndexCandle[], authFetch: any) => {
  const [planetaryRows, setPlanetaryRows] = useState<TransitRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sortedCandles = useMemo(
    () => (Array.isArray(candles) ? candles.slice().sort((a, b) => a.t - b.t) : []),
    [candles],
  );

  const range = useMemo(() => {
    if (!sortedCandles.length) return null;
    return {
      startTs: sortedCandles[0].t,
      endTs: sortedCandles[sortedCandles.length - 1].t,
    };
  }, [sortedCandles]);

  useEffect(() => {
    if (!range || !authFetch) {
      setPlanetaryRows([]);
      setLoading(false);
      setError('');
      return;
    }

    const startYear = new Date(range.startTs).getUTCFullYear();
    const endYear = new Date(range.endTs).getUTCFullYear();
    const years = [];
    for (let year = startYear; year <= endYear; year += 1) {
      years.push(year);
    }

    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchPlanetaryTransitRows(authFetch, years, controller.signal)
      .then((rows) => {
        if (!active) return;
        setPlanetaryRows(rows);
      })
      .catch((err: any) => {
        if (!active || String(err?.name || '').toLowerCase() === 'aborterror') return;
        setPlanetaryRows([]);
        setError(err?.message || 'Unable to load planetary transits.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [authFetch, range]);

  const nakshatraResults = useMemo(() => {
    if (!range || !sortedCandles.length) return [];
    const rows = ALL_NAKSHATRA_ROWS.filter((row) => overlapsRange(row, range.startTs, range.endTs));
    return computeTransitPerformance(rows, sortedCandles, range.endTs, 'nakshatra');
  }, [range, sortedCandles]);

  const planetaryResults = useMemo(() => {
    if (!range || !sortedCandles.length || !planetaryRows.length) return [];
    const rows = planetaryRows.filter((row) => overlapsRange(row, range.startTs, range.endTs));
    return computeTransitPerformance(rows, sortedCandles, range.endTs, 'planetary');
  }, [planetaryRows, range, sortedCandles]);

  return {
    loading,
    error,
    planetaryResults,
    nakshatraResults,
  };
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

const WatchlistPicker = ({
  visible,
  lists,
  onClose,
  onSelect,
  onSave,
  selectedId,
  pending,
  styles,
}: {
  visible: boolean;
  lists: { id: string; title: string; count?: number; symbols?: string[] }[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onSave: () => void;
  selectedId: string;
  pending: boolean;
  styles: any;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.watchlistModalOverlay}>
      <Pressable style={styles.watchlistModalScrim} onPress={pending ? undefined : onClose} />
      <View style={styles.watchlistModalCard}>
        <AppText style={styles.watchlistModalTitle}>Choose watchlist</AppText>
        <AppText style={styles.watchlistModalMessage}>Select which watchlist should store this index.</AppText>

        <ScrollView style={styles.watchlistModalList} contentContainerStyle={styles.watchlistModalListContent}>
          {lists.map((list) => (
            <Pressable
              key={list.id}
              style={[
                styles.watchlistOptionRow,
                list.id === selectedId ? styles.watchlistOptionRowSelected : null,
                pending ? styles.watchlistOptionRowDisabled : null,
              ]}
              onPress={() => onSelect(list.id)}
              disabled={pending}
            >
              <View style={styles.watchlistOptionTextBlock}>
                <AppText style={styles.watchlistOptionTitle}>{list.title}</AppText>
                <AppText style={styles.watchlistOptionMeta}>
                  {list.count === 1 ? '1 stock' : `${list.count || 0} stocks`}
                </AppText>
              </View>
              <View style={[styles.watchlistOptionDot, list.id === selectedId ? styles.watchlistOptionDotSelected : null]} />
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.watchlistModalActions}>
          <Pressable style={styles.watchlistModalCancel} onPress={onClose} disabled={pending}>
            <AppText style={styles.watchlistModalCancelText}>Cancel</AppText>
          </Pressable>
          <Pressable
            style={[
              styles.watchlistModalSave,
              (!selectedId || pending) ? styles.watchlistModalSaveDisabled : null,
            ]}
            onPress={onSave}
            disabled={!selectedId || pending}
          >
            <AppText style={styles.watchlistModalSaveText}>{pending ? 'Saving...' : 'Save'}</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
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
  const { theme, themeColors, token, authFetch, currentPlan } = useUser() as any;
  const colors = useMemo(() => createPalette(themeColors, theme), [theme, themeColors]);
  const styles = useMemo(() => createStyles(colors, theme), [colors, theme]);
  const hasProPlan = useMemo(() => hasProAccess(currentPlan), [currentPlan]);

  const routeSymbol = route?.params?.symbol;
  const routeTf = route?.params?.tf;
  const symbol = useMemo(() => normalizeIndexSymbol(routeSymbol), [routeSymbol]);
  const initialTf = useMemo(() => normalizeIndexTimeframe(routeTf), [routeTf]);
  const [selectedTf, setSelectedTf] = useState<IndexTimeframe>(initialTf);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlistAdded, setWatchlistAdded] = useState(false);
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(Boolean(token && symbol));
  const [watchlistPickerVisible, setWatchlistPickerVisible] = useState(false);
  const [watchlistOptions, setWatchlistOptions] = useState<any[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState('');
  const [watchlistMemberships, setWatchlistMemberships] = useState<Array<{ id: string; title: string }>>([]);
  const [watchlistDialog, setWatchlistDialog] = useState({
    visible: false,
    title: '',
    message: '',
  });
  const [transitMode, setTransitMode] = useState<TransitMode>('planetary');
  const [selectedTransitPlanet, setSelectedTransitPlanet] = useState('All');

  useEffect(() => {
    setSelectedTf(initialTf);
  }, [initialTf, symbol]);

  const openWatchlistDialog = (title: string, message: string) => {
    setWatchlistDialog({ visible: true, title, message });
  };

  const closeWatchlistDialog = () => {
    setWatchlistDialog((prev) => ({ ...prev, visible: false }));
  };

  const watchlistDialogActions: { label: string; onPress: () => void }[] =
    watchlistDialog.title === 'Added to watchlist'
      ? []
      : [
          {
            label: 'OK',
            onPress: closeWatchlistDialog,
          },
        ];

  useEffect(() => {
    if (!watchlistDialog.visible || watchlistDialog.title !== 'Added to watchlist') return undefined;
    const timer = setTimeout(() => {
      setWatchlistDialog((prev) => ({ ...prev, visible: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [watchlistDialog.title, watchlistDialog.visible]);

  const loadDetailedWatchlists = async (signal?: AbortSignal) => {
    const lists = await getWatchlists(authFetch, signal);
    const detailed = await Promise.all(
      lists.map(async (list: any) => {
        try {
          const detail = await getListById(authFetch, list.id, signal);
          return {
            ...list,
            ...detail,
            symbols: Array.isArray(detail?.symbols) ? detail.symbols : list.symbols || [],
            count: typeof detail?.count === 'number' ? detail.count : list.count,
          };
        } catch {
          return list;
        }
      }),
    );

    return detailed;
  };

  const refreshWatchlistMembership = async (signal?: AbortSignal) => {
    if (!token || !symbol) {
      setWatchlistAdded(false);
      setWatchlistMemberships([]);
      setWatchlistLoading(false);
      return [];
    }

    setWatchlistLoading(true);
    try {
      const lists = await loadDetailedWatchlists(signal);
      const matches = lists.filter((list: any) => Array.isArray(list?.symbols) && list.symbols.includes(symbol));
      setWatchlistAdded(matches.length > 0);
      setWatchlistMemberships(
        matches
          .map((list: any) => ({ id: String(list.id || ''), title: String(list.title || 'Watchlist') }))
          .filter((item) => item.id),
      );
      return lists;
    } catch {
      setWatchlistAdded(false);
      setWatchlistMemberships([]);
      return [];
    } finally {
      setWatchlistLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    refreshWatchlistMembership(controller.signal).catch(() => {});
    return () => controller.abort();
  }, [authFetch, symbol, token]);

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
  const { loading: transitLoading, error: transitError, planetaryResults, nakshatraResults } = useTransitPerformance(
    candlesState.candles,
    authFetch,
  );
  const transitResults = transitMode === 'planetary' ? planetaryResults : nakshatraResults;
  const latestTransitTimestamp = candlesState.candles.length ? candlesState.candles[candlesState.candles.length - 1].t : null;
  const transitPlanets = useMemo(() => {
    const set = new Set<string>();
    transitResults.forEach((item) => {
      if (item.planet) set.add(item.planet);
    });
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [transitResults]);
  const filteredTransitResults = useMemo(() => {
    if (selectedTransitPlanet === 'All') return transitResults;
    return transitResults.filter((item) => item.planet === selectedTransitPlanet);
  }, [selectedTransitPlanet, transitResults]);
  const featuredTransit = useMemo(
    () => filteredTransitResults.find((item) => item.isActive) || filteredTransitResults[0] || null,
    [filteredTransitResults],
  );

  const fullScreenLoading =
    !symbol || ((indexInfo.loading || candlesState.loading) && !snapshot && candlesState.candles.length === 0);

  useEffect(() => {
    if (!transitPlanets.includes(selectedTransitPlanet)) {
      setSelectedTransitPlanet('All');
    }
  }, [selectedTransitPlanet, transitPlanets]);

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

  const handleOpenAlerts = () => {
    if (!symbol) return;
    navigateToStockDetail(navigation, symbol, { tab: 'alerts' });
  };

  const closeWatchlistPicker = () => {
    if (watchlistBusy) return;
    setWatchlistPickerVisible(false);
    setWatchlistOptions([]);
    setSelectedWatchlistId('');
  };

  const addToChosenWatchlist = async (list: any) => {
    if (!list?.id || !symbol) return;

    if (Array.isArray(list?.symbols) && list.symbols.includes(symbol)) {
      openWatchlistDialog('Already added', `${symbol} already exists in "${list.title}".`);
      return;
    }

    setWatchlistBusy(true);
    try {
      await addSymbolToWatchlist(authFetch, list.id, symbol);
      setWatchlistAdded(true);
      setWatchlistMemberships([{ id: String(list.id), title: String(list.title || 'Watchlist') }]);
      setWatchlistPickerVisible(false);
      setWatchlistOptions([]);
      setSelectedWatchlistId('');
      openWatchlistDialog('Added to watchlist', `${symbol} was added to "${list.title}".`);
      await refreshWatchlistMembership();
    } catch (error: any) {
      openWatchlistDialog('Watchlist', error?.message || 'Unable to add index to watchlist.');
    } finally {
      setWatchlistBusy(false);
    }
  };

  const handleRemoveFromWatchlist = async () => {
    if (!symbol || !watchlistMemberships.length || watchlistBusy) return;

    setWatchlistBusy(true);
    try {
      await Promise.all(
        watchlistMemberships.map((item) => removeSymbolFromWatchlist(authFetch, item.id, symbol)),
      );
      setWatchlistAdded(false);
      setWatchlistMemberships([]);
      openWatchlistDialog('Removed from watchlist', `${symbol} was removed from your watchlist.`);
      await refreshWatchlistMembership();
    } catch (error: any) {
      openWatchlistDialog('Watchlist', error?.message || 'Unable to remove index from watchlist.');
    } finally {
      setWatchlistBusy(false);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!token) {
      openWatchlistDialog('Sign in required', 'Sign in to save indices to your watchlist.');
      return;
    }

    if (!symbol || watchlistBusy) return;

    try {
      if (watchlistAdded) {
        await handleRemoveFromWatchlist();
        return;
      }

      setWatchlistBusy(true);
      const lists = await loadDetailedWatchlists();

      if (!lists.length) {
        const created = await createWatchlist(authFetch, 'Custom Watchlist');
        if (!created?.id) {
          throw new Error('Watchlist was created without an id.');
        }

        await addSymbolToWatchlist(authFetch, created.id, symbol);
        setWatchlistAdded(true);
        setWatchlistMemberships([{ id: String(created.id), title: String(created.title || 'Custom Watchlist') }]);
        openWatchlistDialog('Added to watchlist', `${symbol} was added to "${created.title || 'Custom Watchlist'}".`);
        await refreshWatchlistMembership();
        return;
      }

      if (lists.length === 1) {
        await addSymbolToWatchlist(authFetch, lists[0].id, symbol);
        setWatchlistAdded(true);
        setWatchlistMemberships([{ id: String(lists[0].id), title: String(lists[0].title || 'Watchlist') }]);
        openWatchlistDialog('Added to watchlist', `${symbol} was added to "${lists[0].title || 'Watchlist'}".`);
        await refreshWatchlistMembership();
        return;
      }

      setWatchlistOptions(lists);
      setSelectedWatchlistId(lists[0]?.id || '');
      setWatchlistPickerVisible(true);
    } catch (error: any) {
      openWatchlistDialog('Watchlist', error?.message || 'Unable to update watchlist.');
    } finally {
      setWatchlistBusy(false);
    }
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
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                
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
                    <Pressable style={styles.actionPill} onPress={handleOpenAlerts}>
                      <Bell size={14} color={colors.textMuted} />
                      <AppText style={styles.actionPillText}>Alert</AppText>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionPill,
                        watchlistAdded ? styles.actionPillAdded : null,
                        watchlistLoading || watchlistBusy ? styles.actionPillDisabled : null,
                      ]}
                      onPress={handleToggleWatchlist}
                      disabled={watchlistLoading || watchlistBusy}
                    >
                      {watchlistAdded ? (
                        <View style={styles.actionPillDangerIcon}>
                          <X size={11} strokeWidth={2.25} color={colors.negative} />
                        </View>
                      ) : (
                        <Bookmark size={14} color={colors.textMuted} />
                      )}
                      <AppText style={[styles.actionPillText, watchlistAdded ? styles.actionPillTextAdded : null]}>
                        {watchlistLoading || watchlistBusy ? 'Saving...' : watchlistAdded ? 'Remove' : 'Watch'}
                      </AppText>
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
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <AppText style={styles.sectionTitle}>Transit Performance</AppText>
                      <AppText style={styles.chartTransitCaption}>
                        Index move across the current chart range using planet transit API and local nakshatra windows.
                      </AppText>
                    </View>
                  </View>

                  {hasProPlan ? (
                    <>
                      <View style={styles.chartTransitModeRow}>
                        {(['planetary', 'nakshatra'] as TransitMode[]).map((mode) => {
                          const active = mode === transitMode;
                          return (
                            <Pressable
                              key={mode}
                              onPress={() => setTransitMode(mode)}
                              style={[styles.chartTransitModeChip, active ? styles.chartTransitModeChipActive : null]}
                            >
                              <AppText style={[styles.chartTransitModeText, active ? styles.chartTransitModeTextActive : null]}>
                                {mode === 'planetary' ? 'Planetary' : 'Nakshatra'}
                              </AppText>
                            </Pressable>
                          );
                        })}
                      </View>

                      {transitPlanets.length > 1 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.remainingRow}>
                          {transitPlanets.map((planet) => {
                            const active = planet === selectedTransitPlanet;
                            return (
                              <Pressable
                                key={planet}
                                onPress={() => setSelectedTransitPlanet(planet)}
                                style={[styles.chartTfChip, active ? styles.chartTfChipActive : null]}
                              >
                                <AppText style={[styles.chartTfChipText, active ? styles.chartTfChipTextActive : null]}>{planet}</AppText>
                              </Pressable>
                            );
                          })}
                        </ScrollView>
                      ) : null}

                      {featuredTransit ? (
                        <View style={styles.transitFeaturedCard}>
                          <View style={styles.transitFeaturedHeader}>
                            <View style={styles.transitFeaturedTitleBlock}>
                              <AppText style={styles.transitFeaturedEyebrow}>
                                {featuredTransit.isActive ? 'Current Transit' : 'Latest Transit'}
                              </AppText>
                              <AppText style={styles.transitFeaturedTitle}>{featuredTransit.label}</AppText>
                              <AppText style={styles.transitFeaturedSub}>{featuredTransit.subLabel}</AppText>
                            </View>
                            <View style={styles.transitFeaturedValueBlock}>
                              <AppText
                                style={[
                                  styles.transitFeaturedPct,
                                  { color: featuredTransit.pctChange >= 0 ? colors.positive : colors.negative },
                                ]}
                              >
                                {featuredTransit.pctChange >= 0 ? '+' : ''}
                                {featuredTransit.pctChange.toFixed(2)}%
                              </AppText>
                              <AppText style={styles.transitFeaturedValue}>
                                {featuredTransit.absChange >= 0 ? '+' : ''}
                                {formatValue(featuredTransit.absChange, 2)}
                              </AppText>
                            </View>
                          </View>

                          <AppText style={styles.transitFeaturedRange}>
                            {formatDateTime(featuredTransit.start)} {'->'} {formatDateTime(featuredTransit.end || latestTransitTimestamp)}
                          </AppText>

                          <View style={styles.transitMetricRow}>
                            <View style={styles.transitMetricCard}>
                              <AppText style={styles.transitMetricLabel}>Start</AppText>
                              <AppText style={styles.transitMetricValue}>{formatValue(featuredTransit.startClose, 2)}</AppText>
                            </View>
                            <View style={styles.transitMetricCard}>
                              <AppText style={styles.transitMetricLabel}>End</AppText>
                              <AppText style={styles.transitMetricValue}>{formatValue(featuredTransit.endClose, 2)}</AppText>
                            </View>
                          </View>
                        </View>
                      ) : null}

                      {transitLoading ? (
                        <View style={styles.chartTransitState}>
                          <ActivityIndicator size="small" color={colors.textPrimary} />
                          <AppText style={styles.centerMessage}>Loading transit windows...</AppText>
                        </View>
                      ) : transitMode === 'planetary' && transitError ? (
                        <AppText style={styles.centerMessage}>{transitError}</AppText>
                      ) : filteredTransitResults.length ? (
                        <View style={styles.transitList}>
                          {filteredTransitResults.slice(0, 8).map((item) => (
                            <View key={item.key} style={styles.transitListCard}>
                              <View style={styles.transitListHeader}>
                                <View style={styles.transitListTitleBlock}>
                                  <AppText style={styles.transitListTitle}>{item.label}</AppText>
                                  <AppText style={styles.transitListSub}>{item.subLabel}</AppText>
                                </View>
                                <AppText
                                  style={[
                                    styles.transitListPct,
                                    { color: item.pctChange >= 0 ? colors.positive : colors.negative },
                                  ]}
                                >
                                  {item.pctChange >= 0 ? '+' : ''}
                                  {item.pctChange.toFixed(2)}%
                                </AppText>
                              </View>
                              <AppText style={styles.transitListRange}>
                                {formatDateTime(item.start)} {'->'} {formatDateTime(item.end || latestTransitTimestamp)}
                              </AppText>
                              <View style={styles.transitListFooter}>
                                <AppText style={styles.transitListValue}>
                                  {formatValue(item.startClose, 2)} {'->'} {formatValue(item.endClose, 2)}
                                </AppText>
                                <AppText
                                  style={[
                                    styles.transitListValue,
                                    { color: item.absChange >= 0 ? colors.positive : colors.negative },
                                  ]}
                                >
                                  {item.absChange >= 0 ? '+' : ''}
                                  {formatValue(item.absChange, 2)}
                                </AppText>
                              </View>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <AppText style={styles.centerMessage}>
                          No {transitMode === 'planetary' ? 'planetary' : 'nakshatra'} transit performance matched this chart range.
                        </AppText>
                      )}
                    </>
                  ) : (
                    <PremiumLockedSection
                      styles={styles}
                      title="Planetary performance is available on Pro"
                      body="Upgrade to Pro to unlock planetary and nakshatra performance for index chart ranges."
                      onPress={() => navigation.navigate('Plans')}
                    />
                  )}
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

          <WatchlistPicker
            visible={watchlistPickerVisible}
            lists={watchlistOptions}
            onClose={closeWatchlistPicker}
            onSelect={setSelectedWatchlistId}
            onSave={() => {
              const selected = watchlistOptions.find((item: any) => item.id === selectedWatchlistId);
              if (!selected || watchlistBusy) return;
              addToChosenWatchlist(selected);
            }}
            selectedId={selectedWatchlistId}
            pending={watchlistBusy}
            styles={styles}
          />
          <AppDialog
            visible={watchlistDialog.visible}
            title={watchlistDialog.title}
            message={watchlistDialog.message}
            onRequestClose={closeWatchlistDialog}
            icon={Bookmark}
            actions={watchlistDialogActions as any}
          />
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
      paddingTop: 8,
      paddingBottom: 116,
      gap: 18,
    },
    backButton: {
      alignSelf: 'flex-start',
      width: 44,
      height: 44,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 4,
      marginBottom: 4,
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
      marginTop: 30,
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
      borderWidth: 1,
      borderColor: 'transparent',
    },
    actionPillDisabled: {
      opacity: 0.72,
    },
    actionPillAdded: {
      backgroundColor: 'rgba(207, 63, 88, 0.08)',
      borderColor: 'rgba(207, 63, 88, 0.24)',
    },
    actionPillDangerIcon: {
      width: 18,
      height: 18,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(207, 63, 88, 0.12)',
    },
    actionPillText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },
    actionPillTextAdded: {
      fontSize: 13,
      color: colors.negative,
      fontFamily: FONT.semiBold,
    },
    watchlistModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 22,
      paddingVertical: 24,
    },
    watchlistModalScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme === 'dark' ? 'rgba(3, 6, 12, 0.68)' : 'rgba(10, 18, 32, 0.34)',
    },
    watchlistModalCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      shadowColor: '#000000',
      shadowOpacity: theme === 'dark' ? 0.28 : 0.16,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 14 },
      elevation: 12,
      gap: 14,
    },
    watchlistModalTitle: {
      fontSize: 18,
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },
    watchlistModalMessage: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textMuted,
      fontFamily: FONT.regular,
      marginTop: -6,
    },
    watchlistModalList: {
      maxHeight: 240,
    },
    watchlistModalListContent: {
      gap: 10,
      paddingVertical: 2,
    },
    watchlistOptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    watchlistOptionRowSelected: {
      borderColor: colors.textPrimary,
      backgroundColor: colors.chartChipBg,
    },
    watchlistOptionRowDisabled: {
      opacity: 0.7,
    },
    watchlistOptionTextBlock: {
      flex: 1,
      gap: 4,
    },
    watchlistOptionTitle: {
      fontSize: 14,
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },
    watchlistOptionMeta: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    watchlistOptionDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: 'transparent',
    },
    watchlistOptionDotSelected: {
      backgroundColor: colors.textPrimary,
      borderColor: colors.textPrimary,
    },
    watchlistModalActions: {
      flexDirection: 'row',
      gap: 10,
    },
    watchlistModalSave: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.textPrimary,
    },
    watchlistModalSaveDisabled: {
      opacity: 0.45,
    },
    watchlistModalSaveText: {
      fontSize: 14,
      color: colors.background,
      fontFamily: FONT.semiBold,
    },
    watchlistModalCancel: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    watchlistModalCancelText: {
      fontSize: 14,
      color: colors.textPrimary,
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
    chartTransitCaption: {
      marginTop: 4,
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FONT.regular,
    },
    chartTransitModeRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
      marginBottom: 12,
    },
    chartTransitModeChip: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartTransitModeChipActive: {
      backgroundColor: colors.textPrimary,
      borderColor: colors.textPrimary,
    },
    chartTransitModeText: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: FONT.medium,
    },
    chartTransitModeTextActive: {
      color: colors.background,
      fontFamily: FONT.semiBold,
    },
    chartTransitState: {
      paddingVertical: 18,
      gap: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    premiumLockedCard: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(59, 130, 246, 0.22)',
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      paddingHorizontal: 18,
      paddingVertical: 18,
      gap: 10,
      marginTop: 10,
    },
    premiumLockedGlow: {
      position: 'absolute',
      top: -42,
      right: -24,
      width: 138,
      height: 138,
      borderRadius: 999,
      backgroundColor: 'rgba(96, 165, 250, 0.16)',
    },
    premiumLockedEyebrow: {
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: '#2563EB',
      fontFamily: FONT.semiBold,
    },
    premiumLockedTitle: {
      fontSize: 18,
      lineHeight: 24,
      color: colors.textPrimary,
      fontFamily: FONT.extraBold,
    },
    premiumLockedBody: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    premiumLockedButton: {
      alignSelf: 'flex-start',
      borderRadius: 14,
      backgroundColor: '#2563EB',
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 2,
    },
    premiumLockedButtonText: {
      fontSize: 13,
      color: '#FFFFFF',
      fontFamily: FONT.semiBold,
    },
    transitFeaturedCard: {
      marginTop: 8,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 16,
      gap: 12,
    },
    transitFeaturedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    transitFeaturedTitleBlock: {
      flex: 1,
      gap: 4,
    },
    transitFeaturedValueBlock: {
      alignItems: 'flex-end',
      gap: 4,
    },
    transitFeaturedEyebrow: {
      color: colors.textMuted,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      fontFamily: FONT.medium,
    },
    transitFeaturedTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      lineHeight: 24,
      fontFamily: FONT.semiBold,
    },
    transitFeaturedSub: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FONT.regular,
    },
    transitFeaturedPct: {
      fontSize: 18,
      lineHeight: 24,
      fontFamily: FONT.extraBold,
    },
    transitFeaturedValue: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: FONT.semiBold,
    },
    transitFeaturedRange: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FONT.regular,
    },
    transitMetricRow: {
      flexDirection: 'row',
      gap: 10,
    },
    transitMetricCard: {
      flex: 1,
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 4,
    },
    transitMetricLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    transitMetricValue: {
      color: colors.textPrimary,
      fontSize: 15,
      fontFamily: FONT.semiBold,
    },
    transitList: {
      gap: 10,
      marginTop: 12,
    },
    transitListCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 8,
    },
    transitListHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      alignItems: 'flex-start',
    },
    transitListTitleBlock: {
      flex: 1,
      gap: 2,
    },
    transitListTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONT.semiBold,
    },
    transitListSub: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FONT.regular,
    },
    transitListPct: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: FONT.extraBold,
    },
    transitListRange: {
      color: colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FONT.regular,
    },
    transitListFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      alignItems: 'center',
    },
    transitListValue: {
      color: colors.textPrimary,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FONT.medium,
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
