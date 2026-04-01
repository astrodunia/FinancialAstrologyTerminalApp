import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import {
  Activity,
  BarChart3,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  ChartNoAxesCombined,
  ExternalLink,
  Globe,
  Info,
  Newspaper,
  RefreshCcw,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import GradientBackground from '../../components/GradientBackground';
import { useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';
import { useUser } from '../../store/UserContext';
import {
  CHART_TIMEFRAME_OPTIONS,
  DEFAULT_CHART_TIMEFRAME,
  DEFAULT_STOCK_TAB,
  normalizeChartTimeframe,
  normalizeStockSymbol,
  normalizeStockTab,
} from '../../features/stocks/navigation';
import {
  useStockFundamentals,
  useStockHistory,
  useStockInfo,
  useStockNews,
  useTickerAlerts,
} from '../../features/stocks/hooks';
import type { CompanyProfile, FundamentalsBundle, StockHistoryPoint, StockInfo, StockNewsItem } from '../../features/stocks/types';

const FONT = {
  regular: 'NotoSans-Regular',
  medium: 'NotoSans-Medium',
  semiBold: 'NotoSans-SemiBold',
  extraBold: 'NotoSans-ExtraBold',
};

const normalizeInitialTabState = (tab: string, hasToken: boolean) => {
  if (tab === 'alerts' && !hasToken) {
    return DEFAULT_STOCK_TAB;
  }
  return tab;
};

const TAB_LABELS = {
  overview: 'Overview',
  chart: 'Chart',
  fundamentals: 'Fundamentals',
  news: 'News',
  alerts: 'Alerts',
};

const formatCurrency = (value: number | null, currency = 'USD') => {
  if (value == null || Number.isNaN(value)) return '--';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency || '$'} ${value.toFixed(2)}`;
  }
};

const formatAbbrevNumber = (value: number | null) => {
  if (value == null || Number.isNaN(value)) return '--';
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return `${value.toFixed(2)}`;
};

const formatCompact = (value: number | null) => {
  if (value == null || Number.isNaN(value)) return '--';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number | null, fallbackSuffix = '%') => {
  if (value == null || Number.isNaN(value)) return '--';
  const normalized = Math.abs(value) > 1 ? value : value * 100;
  return `${normalized.toFixed(2)}${fallbackSuffix}`;
};

const formatDateTime = (value: string) => {
  if (!value) return '--';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '--';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dt);
};

const chartPath = (points: StockHistoryPoint[], width: number, height: number) => {
  if (!points.length) return '';
  const values = points.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = points.length === 1 ? 0 : width / (points.length - 1);

  return points
    .map((point, index) => {
      const x = index * step;
      const y = height - ((point.value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
};

const downsampleHistoryForChart = (points: StockHistoryPoint[] | null, timeframe: string) => {
  if (!points?.length) return [];

  const maxPointsMap: Record<string, number> = {
    '1D': 72,
    '5D': 80,
    '1M': 90,
    '2M': 90,
    '3M': 96,
    '6M': 104,
    '1Y': 120,
    '5Y': 140,
  };

  const maxPoints = maxPointsMap[timeframe] || 90;
  if (points.length <= maxPoints) return points;

  const stride = Math.ceil(points.length / maxPoints);
  const sampled = points.filter((_, index) => index % stride === 0);
  const last = points[points.length - 1];

  if (sampled[sampled.length - 1]?.timestamp !== last.timestamp) {
    sampled.push(last);
  }

  return sampled;
};

const OverviewTab = ({
  info,
  company,
  sparkline,
  sparklineLoading,
  sparklineError,
  themeColors,
}: {
  info: StockInfo | null;
  company: CompanyProfile | null;
  sparkline: StockHistoryPoint[] | null;
  sparklineLoading: boolean;
  sparklineError: string;
  themeColors: Record<string, string>;
}) => {
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const name = company?.name || info?.longName || info?.shortName || info?.symbol || '--';
  const description = company?.description || info?.longBusinessSummary;
  const isOpen =
    (info?.marketState || '').toLowerCase().includes('regular') || (info?.marketState || '').toLowerCase() === 'open';
  const change = info?.regularMarketChange;
  const isUp = (change ?? 0) >= 0;
  const chartColor = isUp ? themeColors.positive : themeColors.negative;
  const updatedAt = sparkline?.[sparkline.length - 1]?.timestamp
    ? new Date(sparkline[sparkline.length - 1].timestamp).toLocaleTimeString()
    : '';
  const profileScore = (() => {
    const volume = info?.averageDailyVolume3Month ?? info?.averageDailyVolume10Day ?? 0;
    const liquidityScore = Math.max(0, Math.min(1, volume / 50000000));
    const range =
      info?.fiftyTwoWeekHigh != null && info?.fiftyTwoWeekLow != null && info?.regularMarketPrice
        ? (info.fiftyTwoWeekHigh - info.fiftyTwoWeekLow) / info.regularMarketPrice
        : 0.5;
    const stabilityScore = Math.max(0, Math.min(1, 1 - Math.min(1, range / 1.2)));
    return Math.round((0.55 * liquidityScore + 0.45 * stabilityScore) * 100);
  })();
  const hq = [info?.address1, info?.city, info?.state, info?.zip, info?.country].filter(Boolean).join(', ') || '--';
  const dividendLabel = (() => {
    const yieldValue = info?.trailingAnnualDividendYield ?? info?.dividendYield;
    const rateValue = info?.trailingAnnualDividendRate ?? info?.dividendRate;
    if (yieldValue != null) {
      return `${formatPercent(yieldValue)}${rateValue != null ? ` (Rate ${formatCurrency(rateValue, info?.currency)})` : ''}`;
    }
    if (rateValue != null) {
      return `Rate ${formatCurrency(rateValue, info?.currency)}`;
    }
    return '--';
  })();
  const targetLabel =
    info?.targetMeanPrice != null
      ? formatCurrency(info.targetMeanPrice, info?.currency)
      : info?.targetLowPrice != null && info?.targetHighPrice != null
        ? `${formatCurrency(info.targetLowPrice, info?.currency)} - ${formatCurrency(info.targetHighPrice, info?.currency)}`
        : '--';
  const recommendationLabel = info?.averageAnalystRating || info?.recommendationKey || '--';
  const overviewStatCards = [
    { label: 'Market Cap', value: formatCompact(info?.marketCap ?? null) },
    { label: 'Avg Volume', value: formatCompact(info?.averageDailyVolume3Month ?? null) },
    { label: 'P/E', value: info?.trailingPE != null ? info.trailingPE.toFixed(2) : '--' },
    { label: 'Dividend', value: dividendLabel },
    { label: 'Forward P/E', value: info?.forwardPE != null ? info.forwardPE.toFixed(2) : '--' },
    { label: 'Target Mean', value: targetLabel },
    {
      label: 'Target High',
      value: info?.targetHighPrice != null ? formatCurrency(info.targetHighPrice, info?.currency) : '--',
    },
    {
      label: 'Target Low',
      value: info?.targetLowPrice != null ? formatCurrency(info.targetLowPrice, info?.currency) : '--',
    },
    {
      label: 'Analyst Count',
      value: info?.numberOfAnalystOpinions != null ? `${info.numberOfAnalystOpinions}` : '--',
    },
    { label: 'Recommendation', value: recommendationLabel },
    { label: 'Sector', value: info?.sector || company?.sector || '--' },
    { label: 'Industry', value: info?.industry || company?.industry || '--' },
  ];

  return (
    <View style={styles.tabContent}>
      <View style={[styles.card, styles.overviewSnapshotSection]}>
        <View style={styles.cardTitleRow}>
          <View style={styles.inlineInfoRow}>
            <Activity size={16} color={themeColors.textPrimary} />
            <AppText style={styles.cardTitle}>Price Snapshot</AppText>
          </View>
          <AppText style={styles.metricValue}>{formatCurrency(info?.regularMarketPrice ?? null, info?.currency)}</AppText>
        </View>
        <AppText style={styles.snapshotMetaText}>
          {formatCurrency(info?.regularMarketPreviousClose ?? null, info?.currency)} prev close
          {updatedAt ? ` • Updated ${updatedAt}` : ''}
        </AppText>
        <View style={styles.actionRow}>
          <Pressable style={styles.actionChip}>
            <Bell size={15} color={themeColors.textPrimary} />
            <AppText style={styles.actionChipText}>Alert</AppText>
          </Pressable>
          <Pressable style={styles.actionChip}>
            <Bookmark size={15} color={themeColors.textPrimary} />
            <AppText style={styles.actionChipText}>Watch</AppText>
          </Pressable>
        </View>

        {sparkline?.length ? (
          <View style={styles.overviewSnapshotChartWrap}>
            <MainChart points={sparkline} color={chartColor} />
          </View>
        ) : sparklineLoading ? (
          <ActivityIndicator size="small" color={themeColors.textPrimary} />
        ) : (
          <AppText style={styles.emptyText}>{sparklineError || 'No intraday chart data.'}</AppText>
        )}

        <View style={styles.metricsGrid}>
          {[
            { label: 'Open', value: formatCurrency(info?.regularMarketOpen ?? null, info?.currency) },
            { label: 'High', value: formatCurrency(info?.regularMarketDayHigh ?? null, info?.currency) },
            { label: 'Low', value: formatCurrency(info?.regularMarketDayLow ?? null, info?.currency) },
            { label: 'Prev Close', value: formatCurrency(info?.regularMarketPreviousClose ?? null, info?.currency) },
            {
              label: 'Day Range',
              value:
                info?.regularMarketDayLow != null && info?.regularMarketDayHigh != null
                  ? `${formatCurrency(info.regularMarketDayLow, info.currency)} - ${formatCurrency(
                      info.regularMarketDayHigh,
                      info.currency,
                    )}`
                  : '--',
            },
            {
              label: '52W Range',
              value:
                info?.fiftyTwoWeekLow != null && info?.fiftyTwoWeekHigh != null
                  ? `${formatCurrency(info.fiftyTwoWeekLow, info.currency)} - ${formatCurrency(
                      info.fiftyTwoWeekHigh,
                      info.currency,
                    )}`
                  : '--',
            },
            { label: 'Volume', value: formatCompact(info?.regularMarketVolume ?? null) },
          ].map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.metricCard}>
              <AppText style={styles.metricLabel}>{item.label}</AppText>
              <AppText style={styles.metricValue}>{item.value}</AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.cardTitleRow}>
          <View style={styles.heroHeaderBlock}>
            <AppText style={styles.heroName}>{name}</AppText>
            <AppText style={styles.heroSub}>
              {[info?.exchange, info?.sector || company?.sector, info?.industry || company?.industry]
                .filter(Boolean)
                .join(' • ') || 'No company metadata available'}
            </AppText>
          </View>
          <Pressable style={styles.refreshButton}>
            <RefreshCcw size={15} color={themeColors.textPrimary} />
            <AppText style={styles.refreshButtonText}>Refresh</AppText>
          </Pressable>
        </View>

        <View style={styles.heroBadgeRow}>
          <View style={styles.symbolBadge}>
            <AppText style={styles.symbolBadgeText}>{info?.symbol || '--'}</AppText>
          </View>
          <View style={[styles.marketStateBadge, isOpen ? styles.marketStateBadgeOpen : styles.marketStateBadgeClosed]}>
            <AppText style={styles.marketStateBadgeText}>{info?.marketState || '—'}</AppText>
          </View>
        </View>

        <View style={styles.kpiStack}>
          <OverviewKpiCard
            icon={<Wallet size={15} color={themeColors.textMuted} />}
            label="Market Cap"
            value={formatCompact(info?.marketCap ?? null)}
            styles={styles}
          />
          <OverviewKpiCard
            icon={<BarChart3 size={15} color={themeColors.textMuted} />}
            label="Avg Volume"
            value={formatCompact(info?.averageDailyVolume3Month ?? null)}
            styles={styles}
          />
          <OverviewKpiCard
            icon={<TrendingUp size={15} color={themeColors.textMuted} />}
            label="P/E"
            value={info?.trailingPE != null ? info.trailingPE.toFixed(2) : '--'}
            styles={styles}
          />
          <OverviewKpiCard
            icon={<Target size={15} color={themeColors.textMuted} />}
            label="Target Mean"
            value={targetLabel}
            sub={info?.numberOfAnalystOpinions != null ? `${info.numberOfAnalystOpinions} analysts` : undefined}
            styles={styles}
          />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.cardTitleRow}>
            <View style={styles.inlineInfoRow}>
              <Info size={15} color={themeColors.textMuted} />
              <AppText style={styles.profileCardTitle}>Liquidity & Stability Profile</AppText>
            </View>
            <AppText style={styles.profileScoreText}>{profileScore}/100</AppText>
          </View>
          <View style={styles.profileTrack}>
            <View style={[styles.profileFill, { width: `${profileScore}%` }]} />
          </View>
          <AppText style={styles.profileCaption}>
            UI score based on average volume and 52-week range. Not investment advice.
          </AppText>
        </View>
      </View>

      <View style={styles.splitColumn}>
        <View style={styles.card}>
          <View style={styles.inlineInfoRow}>
            <BarChart3 size={16} color={themeColors.textPrimary} />
            <AppText style={styles.cardTitle}>Key Statistics</AppText>
          </View>
        <View style={styles.metricsGrid}>
          {overviewStatCards.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.metricCard}>
              <AppText style={styles.metricLabel}>{item.label}</AppText>
              <AppText style={styles.metricValue}>{item.value}</AppText>
            </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.inlineInfoRow}>
            <Building2 size={16} color={themeColors.textPrimary} />
            <AppText style={styles.cardTitle}>Company</AppText>
          </View>
          <OverviewMiniRow
            icon={<Users size={15} color={themeColors.textMuted} />}
            label="Employees"
            value={info?.fullTimeEmployees != null ? formatCompact(info.fullTimeEmployees) : '--'}
            styles={styles}
          />
          <OverviewMiniRow
            icon={<Globe size={15} color={themeColors.textMuted} />}
            label="HQ"
            value={hq}
            styles={styles}
          />
          <OverviewMiniRow
            icon={<Briefcase size={15} color={themeColors.textMuted} />}
            label="Sector"
            value={info?.sector || company?.sector || '--'}
            styles={styles}
          />
          <OverviewMiniRow
            icon={<Briefcase size={15} color={themeColors.textMuted} />}
            label="Industry"
            value={info?.industry || company?.industry || '--'}
            styles={styles}
          />
          <OverviewMiniRow
            icon={<Info size={15} color={themeColors.textMuted} />}
            label="CEO"
            value={company?.ceo || '--'}
            styles={styles}
          />
          <OverviewMiniRow
            icon={<Info size={15} color={themeColors.textMuted} />}
            label="Founded"
            value={company?.founded || '--'}
            styles={styles}
          />
          <OverviewMiniRow
            icon={<Globe size={15} color={themeColors.textMuted} />}
            label="Website"
            value={info?.website || company?.website || '--'}
            styles={styles}
          />
          <OverviewMiniRow
            icon={<Info size={15} color={themeColors.textMuted} />}
            label="Exchange"
            value={info?.exchange || company?.exchange || '--'}
            styles={styles}
          />
        </View>
      </View>

      <View style={styles.card}>
        <AppText style={styles.cardTitle}>About {name}</AppText>
        <AppText style={styles.bodyText}>{description || 'Company description is not available.'}</AppText>
      </View>

      {info?.companyOfficers?.length ? (
        <View style={styles.card}>
          <View style={styles.inlineInfoRow}>
            <Users size={16} color={themeColors.textPrimary} />
            <AppText style={styles.cardTitle}>Leadership</AppText>
          </View>
          {info.companyOfficers.slice(0, 8).map((officer) => (
            <View key={`${officer.name}-${officer.title}`} style={styles.leadershipRow}>
              <AppText style={styles.leadershipName}>{officer.name}</AppText>
              <AppText style={styles.leadershipTitle}>{officer.title || '--'}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const OverviewKpiCard = ({
  icon,
  label,
  value,
  sub,
  styles,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  styles: ReturnType<typeof createStyles>;
}) => (
  <View style={styles.overviewKpiCard}>
    <View style={styles.inlineInfoRow}>
      {icon}
      <AppText style={styles.overviewKpiLabel}>{label}</AppText>
    </View>
    <AppText style={styles.overviewKpiValue}>{value}</AppText>
    {sub ? <AppText style={styles.overviewKpiSub}>{sub}</AppText> : null}
  </View>
);

const OverviewMiniRow = ({
  icon,
  label,
  value,
  styles,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) => (
  <View style={styles.overviewMiniRow}>
    <View style={styles.overviewMiniIcon}>{icon}</View>
    <View style={styles.overviewMiniBody}>
      <AppText style={styles.overviewMiniLabel}>{label}</AppText>
      <AppText style={styles.overviewMiniValue}>{value}</AppText>
    </View>
  </View>
);

const ChartTab = ({
  info,
  history,
  loading,
  error,
  timeframe,
  onChangeTimeframe,
  themeColors,
}: {
  info: StockInfo | null;
  history: StockHistoryPoint[] | null;
  loading: boolean;
  error: string;
  timeframe: string;
  onChangeTimeframe: (value: string) => void;
  themeColors: Record<string, string>;
}) => {
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const displayHistory = useMemo(() => downsampleHistoryForChart(history, timeframe), [history, timeframe]);
  const trend = useMemo(() => {
    if (!displayHistory?.length) {
      return {
        referenceOpen: info?.regularMarketOpen ?? null,
        latestClose: info?.regularMarketPrice ?? null,
      };
    }

    const first = displayHistory[0];
    const last = displayHistory[displayHistory.length - 1];
    return {
      referenceOpen: first?.open ?? first?.close ?? first?.value ?? info?.regularMarketOpen ?? null,
      latestClose: last?.close ?? last?.value ?? info?.regularMarketPrice ?? null,
    };
  }, [displayHistory, info?.regularMarketOpen, info?.regularMarketPrice]);

  const isUp =
    trend.referenceOpen != null && trend.latestClose != null
      ? trend.latestClose >= trend.referenceOpen
      : (info?.regularMarketChange ?? 0) >= 0;
  const price = info?.regularMarketPrice ?? null;
  const change = info?.regularMarketChange ?? null;
  const changePct = info?.regularMarketChangePercent ?? null;
  const chartColor =
    trend.referenceOpen != null && trend.latestClose != null
      ? isUp
        ? themeColors.positive
        : themeColors.negative
      : info?.regularMarketChange != null && info.regularMarketChange < 0
        ? themeColors.negative
        : themeColors.positive;

  return (
    <View style={styles.tabContent}>
      <View style={styles.chartHeroCard}>
        <View style={styles.chartPriceRow}>
          <AppText style={styles.chartPriceValue}>{formatCurrency(price, info?.currency)}</AppText>
          <AppText style={[styles.chartPriceChange, { color: isUp ? themeColors.positive : themeColors.negative }]}>
            {change != null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '--'}
            {changePct != null ? ` (${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%)` : ''}
          </AppText>
          <AppText style={styles.chartPriceTf}>{timeframe}</AppText>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionChip}>
            <Bell size={15} color={themeColors.textPrimary} />
            <AppText style={styles.actionChipText}>Alert</AppText>
          </Pressable>
          <Pressable style={styles.actionChip}>
            <Bookmark size={15} color={themeColors.textPrimary} />
            <AppText style={styles.actionChipText}>Watch</AppText>
          </Pressable>
        </View>

        <View style={styles.chartCanvasWrap}>
          {displayHistory?.length ? (
            <MainChart points={displayHistory} color={chartColor} tall />
          ) : loading ? (
            <View style={styles.chartLoaderWrap}>
              <ActivityIndicator size="small" color={themeColors.textPrimary} />
            </View>
          ) : (
            <AppText style={styles.emptyText}>{error || 'No chart data for this timeframe.'}</AppText>
          )}
          {loading ? (
            <View style={styles.chartLoadingOverlay} pointerEvents="none">
              <View style={styles.chartLoadingTrack}>
                <View style={[styles.chartLoadingFill, { backgroundColor: chartColor }]} />
              </View>
              <AppText style={styles.chartLoadingText}>Updating chart...</AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.chartTfWrap}>
          {CHART_TIMEFRAME_OPTIONS.map((item) => {
            const active = item.label === timeframe;
            return (
              <Pressable
                key={item.label}
                onPress={() => onChangeTimeframe(item.label)}
                style={[styles.chartTfChip, active && styles.chartTfChipActive]}
              >
                <AppText style={[styles.chartTfChipText, active && styles.chartTfChipTextActive]}>{item.label}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {[
          { label: 'Price', value: formatCurrency(info?.regularMarketPrice ?? null, info?.currency) },
          { label: 'Open', value: formatCurrency(info?.regularMarketOpen ?? null, info?.currency) },
          { label: 'Prev Close', value: formatCurrency(info?.regularMarketPreviousClose ?? null, info?.currency) },
          { label: 'Range', value: `${formatCurrency(trend.referenceOpen, info?.currency)} -> ${formatCurrency(trend.latestClose, info?.currency)}` },
        ].map((item) => (
          <View key={item.label} style={styles.metricCard}>
            <AppText style={styles.metricLabel}>{item.label}</AppText>
            <AppText style={styles.metricValue}>{item.value}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
};

const findFirstNumericKey = (rows: Record<string, unknown>[]) => {
  const preferred = ['revenue', 'netIncome', 'totalRevenue', 'totalAssets', 'value', 'earnings'];
  for (const key of preferred) {
    if (rows.some((row) => typeof row[key] === 'number' || typeof row[key] === 'string')) return key;
  }
  const sample = rows[0] || {};
  return Object.keys(sample).find((key) => typeof sample[key] === 'number' || typeof sample[key] === 'string') || '';
};

const renderKeyValueRows = (rows: Record<string, unknown>[], styles: ReturnType<typeof createStyles>) =>
  rows.map((row, index) => {
    const title =
      String(row.period || row.date || row.year || row.asOfDate || row.fiscalDateEnding || `Row ${index + 1}`);
    const numericKey = findFirstNumericKey([row]);
    const value = numericKey ? row[numericKey] : null;
    return (
      <View key={`${title}-${index}`} style={styles.listRow}>
        <View style={styles.listTextBlock}>
          <AppText style={styles.listTitle}>{title}</AppText>
          <AppText style={styles.listSummary}>{numericKey || 'Data row'}</AppText>
        </View>
        <AppText style={styles.listMeta}>{value == null ? '--' : String(value)}</AppText>
      </View>
    );
  });

const renderEstimateSummaryRows = (
  rows: Record<string, unknown>[],
  styles: ReturnType<typeof createStyles>,
  currency?: string,
) =>
  rows.slice(0, 4).map((row, index) => {
    const title = String(row.period || row.date || row.year || `Estimate ${index + 1}`);
    const avg = typeof row.avg === 'number' ? row.avg : null;
    const high = typeof row.high === 'number' ? row.high : null;
    const low = typeof row.low === 'number' ? row.low : null;
    const growth = typeof row.growth === 'number' ? row.growth : null;
    return (
      <View key={`${title}-${index}`} style={styles.estimateCard}>
        <AppText style={styles.estimateTitle}>{title}</AppText>
        <View style={styles.estimateGrid}>
          <View style={styles.estimateMetric}>
            <AppText style={styles.estimateLabel}>Avg</AppText>
            <AppText style={styles.estimateValue}>{formatCurrency(avg, currency)}</AppText>
          </View>
          <View style={styles.estimateMetric}>
            <AppText style={styles.estimateLabel}>High</AppText>
            <AppText style={styles.estimateValue}>{formatCurrency(high, currency)}</AppText>
          </View>
          <View style={styles.estimateMetric}>
            <AppText style={styles.estimateLabel}>Low</AppText>
            <AppText style={styles.estimateValue}>{formatCurrency(low, currency)}</AppText>
          </View>
          <View style={styles.estimateMetric}>
            <AppText style={styles.estimateLabel}>Growth</AppText>
            <AppText style={styles.estimateValue}>{formatPercent(growth)}</AppText>
          </View>
        </View>
      </View>
    );
  });

const humanizeFieldLabel = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatFundamentalValue = (key: string, value: unknown, _currency?: string) => {
  if (value == null) return '--';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '--';
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey.includes('margin') ||
      normalizedKey.includes('yield') ||
      normalizedKey.includes('growth') ||
      normalizedKey.includes('returnon') ||
      normalizedKey.includes('surprise')
    ) {
      return formatPercent(value);
    }
    if (
      normalizedKey.includes('price') ||
      normalizedKey.includes('revenue') ||
      normalizedKey.includes('income') ||
      normalizedKey.includes('asset') ||
      normalizedKey.includes('liabilit') ||
      normalizedKey.includes('equity') ||
      normalizedKey.includes('cash') ||
      normalizedKey.includes('debt') ||
      normalizedKey.includes('ebit') ||
      normalizedKey.includes('profit')
    ) {
      return formatAbbrevNumber(value);
    }
    if (Math.abs(value) >= 1000) return formatAbbrevNumber(value);
    return `${value.toFixed(2)}`;
  }
  return String(value);
};

const getPeriodLabel = (row: Record<string, unknown>, fallback: string) =>
  String(row.period || row.date || row.year || row.asOfDate || row.fiscalDateEnding || fallback);

const pickLatestRow = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return null;
  const sorted = [...rows].sort((left, right) => {
    const leftValue = new Date(String(left.period || left.date || left.year || left.asOfDate || left.fiscalDateEnding || 0)).getTime();
    const rightValue = new Date(String(right.period || right.date || right.year || right.asOfDate || right.fiscalDateEnding || 0)).getTime();
    return rightValue - leftValue;
  });
  return sorted[0] || rows[0];
};

const renderSnapshotFields = (
  row: Record<string, unknown> | null,
  keys: string[],
  styles: ReturnType<typeof createStyles>,
  currency?: string,
) => {
  if (!row) return <AppText style={styles.emptyText}>No snapshot data available.</AppText>;

  const items = keys
    .map((key) => ({ key, value: row[key] }))
    .filter((item) => item.value != null);

  if (!items.length) return <AppText style={styles.emptyText}>No snapshot data available.</AppText>;

  return (
    <View style={styles.snapshotTileGrid}>
      {items.map((item, index) => (
        <View key={`${item.key}-${index}`} style={styles.snapshotTile}>
          <AppText style={styles.snapshotTileLabel}>{humanizeFieldLabel(item.key)}</AppText>
          <AppText style={styles.snapshotTileValue}>{formatFundamentalValue(item.key, item.value, currency)}</AppText>
        </View>
      ))}
    </View>
  );
};

const statementKeyOrder = {
  income: [
    'Total Revenue',
    'Operating Revenue',
    'Cost Of Revenue',
    'Gross Profit',
    'Operating Expense',
    'Operating Income',
    'EBITDA',
    'EBIT',
    'Net Income',
    'Research And Development',
    'Selling General And Administration',
    'Tax Provision',
    'Basic EPS',
    'Diluted EPS',
  ],
  balance: [
    'TotalAssets',
    'CurrentAssets',
    'CashCashEquivalentsAndShortTermInvestments',
    'CashAndCashEquivalents',
    'OtherShortTermInvestments',
    'Receivables',
    'Inventory',
    'NetPPE',
    'GoodwillAndOtherIntangibleAssets',
    'TotalLiabilitiesNetMinorityInterest',
    'CurrentLiabilities',
    'TotalDebt',
    'LongTermDebt',
    'StockholdersEquity',
    'WorkingCapital',
  ],
};

const getStatementPeriods = (rows: Record<string, unknown>[]) =>
  [...rows]
    .sort((left, right) => {
      const leftValue = new Date(String(left.period || left.date || left.year || left.asOfDate || left.fiscalDateEnding || 0)).getTime();
      const rightValue = new Date(String(right.period || right.date || right.year || right.asOfDate || right.fiscalDateEnding || 0)).getTime();
      return leftValue - rightValue;
    })
    .map((row, index) => ({
      key: `${String(row.period || row.date || row.year || row.asOfDate || row.fiscalDateEnding || 'period')}-${index}`,
      label: getPeriodLabel(row, '--'),
      row,
    }));

const renderStatementMatrix = (
  rows: Record<string, unknown>[],
  preferredKeys: string[],
  styles: ReturnType<typeof createStyles>,
  currency?: string,
) => {
  if (!rows.length) return <AppText style={styles.emptyText}>No statement data.</AppText>;

  const periods = getStatementPeriods(rows);
  const allKeys = Array.from(
    new Set(
      periods.flatMap(({ row }) =>
        Object.keys(row).filter((key) => key !== 'period' && key !== 'date' && key !== 'year' && key !== 'asOfDate' && key !== 'fiscalDateEnding'),
      ),
    ),
  );

  const orderedKeys = [
    ...preferredKeys.filter((key) => allKeys.includes(key)),
    ...allKeys.filter((key) => !preferredKeys.includes(key)),
  ].filter((key) =>
    periods.some(({ row }) => row[key] != null && !(typeof row[key] === 'number' && Number.isNaN(row[key] as number))),
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statementTableWrap}>
      <View style={styles.statementTable}>
        <View style={styles.statementHeaderRow}>
          <View style={styles.statementMetricCell}>
            <AppText style={styles.statementHeaderText}>Metric</AppText>
          </View>
          {periods.map(({ key: periodKey, label }) => (
            <View key={periodKey} style={styles.statementPeriodCell}>
              <AppText style={styles.statementHeaderText}>{label}</AppText>
            </View>
          ))}
        </View>

        {orderedKeys.map((key, index) => (
          <View
            key={`${key}-${index}`}
            style={[styles.statementDataRow, index % 2 === 0 ? styles.statementDataRowAlt : null]}
          >
            <View style={styles.statementMetricCell}>
              <AppText style={styles.statementMetricText}>{humanizeFieldLabel(key)}</AppText>
            </View>
            {periods.map(({ key: periodKey, row }) => (
              <View key={`${key}-${periodKey}`} style={styles.statementPeriodCell}>
                <AppText style={styles.statementValueText}>{formatFundamentalValue(key, row[key], currency)}</AppText>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const renderInfoFields = (
  info: StockInfo | null,
  styles: ReturnType<typeof createStyles>,
) => {
  if (!info) return <AppText style={styles.emptyText}>No company info available.</AppText>;

  const hiddenKeys = new Set([
    'symbol',
    'shortName',
    'website',
    'regularMarketPrice',
    'regularMarketChange',
    'regularMarketChangePercent',
    'regularMarketOpen',
    'regularMarketPreviousClose',
    'regularMarketDayHigh',
    'regularMarketDayLow',
    'regularMarketClose',
    'companyOfficers',
    'currency',
  ]);

  const fields = Object.entries(info).filter(([key, value]) => !hiddenKeys.has(key) && value != null && value !== '');
  if (!fields.length) return <AppText style={styles.emptyText}>No company info available.</AppText>;

  return (
    <View style={styles.snapshotTileGrid}>
      {fields.map(([key, value], index) => {
        const isLastOddItem = fields.length % 2 === 1 && index === fields.length - 1;
        return (
        <View key={`${key}-${index}`} style={[styles.snapshotTile, isLastOddItem && styles.snapshotTileFullWidth]}>
          <AppText style={styles.snapshotTileLabel}>{humanizeFieldLabel(key)}</AppText>
          <AppText style={styles.snapshotTileValue}>{formatFundamentalValue(key, value, info.currency)}</AppText>
        </View>
      )})}
    </View>
  );
};

const FundamentalsLoadingState = ({
  styles,
  themeColors,
}: {
  styles: ReturnType<typeof createStyles>;
  themeColors: Record<string, string>;
}) => (
  <View style={styles.tabContent}>
    <View style={[styles.card, styles.sectionHeroCard, styles.fundamentalsHeroCard]}>
      <AppText style={styles.cardTitle}>Fundamentals</AppText>
      <AppText style={styles.sectionHeroText}>
        Loading statements, estimates, analyst sentiment, and company-level financial context.
      </AppText>
      <View style={styles.fundamentalsLoaderRow}>
        <ActivityIndicator size="small" color={themeColors.textPrimary} />
        <AppText style={styles.fundamentalsLoaderText}>Loading fundamentals...</AppText>
      </View>
    </View>

    <View style={styles.metricsGrid}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={`fund-shell-metric-${index}`} style={[styles.metricCard, styles.skeletonCard]} />
      ))}
    </View>

    {Array.from({ length: 4 }).map((_, index) => (
      <View key={`fund-shell-section-${index}`} style={[styles.card, styles.fundamentalsSectionCard, styles.skeletonSection]} />
    ))}
  </View>
);

const FundamentalsTab = ({
  bundle,
  loading,
  error,
  themeColors,
}: {
  bundle: FundamentalsBundle | null;
  loading: boolean;
  error: string;
  themeColors: Record<string, string>;
}) => {
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const info = bundle?.info || null;
  const latestIncomeRow = pickLatestRow(bundle?.incomeStatement || []);
  const latestBalanceRow = pickLatestRow(bundle?.balanceSheet || []);
  const metricCards = [
    { label: 'Market Cap', value: formatCompact(info?.marketCap ?? null) },
    { label: 'P/E Ratio', value: info?.trailingPE != null ? info.trailingPE.toFixed(2) : '--' },
    { label: 'Dividend Yield', value: formatPercent(info?.dividendYield ?? null) },
    { label: 'Analyst Target', value: formatCurrency(info?.targetMeanPrice ?? null, info?.currency) },
    { label: 'Forward P/E', value: info?.forwardPE != null ? info.forwardPE.toFixed(2) : '--' },
    { label: 'Recommendation', value: info?.recommendationKey || info?.averageAnalystRating || '--' },
  ];
  const analystSummary = [
    { label: 'Target Mean', value: formatCurrency(info?.targetMeanPrice ?? null, info?.currency) },
    { label: 'Target High', value: formatCurrency(info?.targetHighPrice ?? null, info?.currency) },
    { label: 'Target Low', value: formatCurrency(info?.targetLowPrice ?? null, info?.currency) },
    {
      label: 'Analyst Count',
      value: info?.numberOfAnalystOpinions != null ? `${info.numberOfAnalystOpinions}` : '--',
    },
  ];
  const companyInfoCards = [
    { label: 'Company', value: info?.longName || '--' },
    { label: 'Website', value: info?.website || '--' },
    { label: 'Sector', value: info?.sector || '--' },
    { label: 'Industry', value: info?.industry || '--' },
    { label: 'Employees', value: info?.fullTimeEmployees != null ? formatCompact(info.fullTimeEmployees) : '--' },
    { label: 'Beta', value: info?.beta != null ? `${info.beta}` : '--' },
    { label: 'Gross Margin', value: formatPercent(info?.grossMargins ?? null) },
    { label: 'Operating Margin', value: formatPercent(info?.operatingMargins ?? null) },
    { label: 'Profit Margin', value: formatPercent(info?.profitMargins ?? null) },
    { label: 'ROE', value: formatPercent(info?.returnOnEquity ?? null) },
    { label: 'ROA', value: formatPercent(info?.returnOnAssets ?? null) },
    { label: 'Revenue Growth', value: formatPercent(info?.revenueGrowth ?? null) },
  ];

  if (loading && !bundle) {
    return <FundamentalsLoadingState styles={styles} themeColors={themeColors} />;
  }

  return (
    <View style={styles.tabContent}>
      <View style={[styles.card, styles.sectionHeroCard, styles.fundamentalsHeroCard]}>
        <AppText style={styles.cardTitle}>Fundamentals</AppText>
        <AppText style={styles.sectionHeroText}>
          Statements, estimates, recommendations, and company-level financial context from the existing stock APIs.
        </AppText>
        <View style={styles.fundamentalsHeroMeta}>
          <View style={styles.fundamentalsHeroBadge}>
            <AppText style={styles.fundamentalsHeroBadgeText}>{info?.longName || info?.symbol || '--'}</AppText>
          </View>
          <View style={styles.fundamentalsHeroBadge}>
            <AppText style={styles.fundamentalsHeroBadgeText}>{info?.sector || '--'}</AppText>
          </View>
          <View style={styles.fundamentalsHeroBadge}>
            <AppText style={styles.fundamentalsHeroBadgeText}>{info?.industry || '--'}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {metricCards.map((item, index) => (
          <View key={`${item.label}-${index}`} style={styles.metricCard}>
            <AppText style={styles.metricLabel}>{item.label}</AppText>
            <AppText style={styles.metricValue}>{item.value}</AppText>
          </View>
        ))}
      </View>

      <View style={[styles.card, styles.fundamentalsSectionCard]}>
        <AppText style={styles.cardTitle}>Company context</AppText>
        <View style={styles.snapshotTileGrid}>
          {companyInfoCards.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.snapshotTile}>
              <AppText style={styles.snapshotTileLabel}>{item.label}</AppText>
              <AppText style={styles.snapshotTileValue}>{item.value}</AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, styles.fundamentalsSectionCard]}>
        <AppText style={styles.cardTitle}>All company info</AppText>
        {renderInfoFields(info, styles)}
      </View>

      {error && !bundle ? (
        <View style={[styles.card, styles.fundamentalsSectionCard]}>
          <AppText style={styles.emptyText}>{error}</AppText>
        </View>
      ) : null}

      {bundle ? (
        <>
          <View style={[styles.card, styles.fundamentalsSectionCard]}>
            <AppText style={styles.cardTitle}>Analyst outlook</AppText>
            <View style={styles.metricsGrid}>
              {analystSummary.map((item, index) => (
                <View key={`${item.label}-${index}`} style={styles.metricCard}>
                  <AppText style={styles.metricLabel}>{item.label}</AppText>
                  <AppText style={styles.metricValue}>{item.value}</AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, styles.fundamentalsSectionCard]}>
            <AppText style={styles.cardTitle}>Latest income snapshot</AppText>
            <AppText style={styles.sectionHeroText}>{getPeriodLabel(latestIncomeRow || {}, 'Most recent period')}</AppText>
            {renderSnapshotFields(
              latestIncomeRow,
              [
                'TotalRevenue',
                'Cost Of Revenue',
                'Gross Profit',
                'Operating Income',
                'EBITDA',
                'EBIT',
                'Net Income',
                'Research And Development',
              ],
              styles,
              info?.currency,
            )}
          </View>

          <View style={[styles.card, styles.fundamentalsSectionCard]}>
            <AppText style={styles.cardTitle}>Latest balance snapshot</AppText>
            <AppText style={styles.sectionHeroText}>{getPeriodLabel(latestBalanceRow || {}, 'Most recent period')}</AppText>
            {renderSnapshotFields(
              latestBalanceRow,
              [
                'TotalAssets',
                'CurrentAssets',
                'TotalLiabilitiesNetMinorityInterest',
                'StockholdersEquity',
                'CashCashEquivalentsAndShortTermInvestments',
                'TotalDebt',
                'LongTermDebt',
                'WorkingCapital',
              ],
              styles,
              info?.currency,
            )}
          </View>

          <View style={[styles.card, styles.fundamentalsSectionCard]}>
            <AppText style={styles.cardTitle}>Earnings estimates</AppText>
            {bundle.earningsEstimate.length ? (
              <View style={styles.estimateStack}>
                {renderEstimateSummaryRows(bundle.earningsEstimate, styles, info?.currency)}
              </View>
            ) : (
              <AppText style={styles.emptyText}>No earnings estimate data.</AppText>
            )}
          </View>

          <View style={[styles.card, styles.fundamentalsSectionCard]}>
            <AppText style={styles.cardTitle}>Revenue estimates</AppText>
            {bundle.revenueEstimate.length ? (
              <View style={styles.estimateStack}>
                {renderEstimateSummaryRows(bundle.revenueEstimate, styles, info?.currency)}
              </View>
            ) : (
              <AppText style={styles.emptyText}>No revenue estimate data.</AppText>
            )}
          </View>

          <View style={[styles.card, styles.fundamentalsSectionCard]}>
            <AppText style={styles.cardTitle}>Earnings history</AppText>
            {bundle.earningsHistory.length ? (
              renderKeyValueRows(bundle.earningsHistory, styles)
            ) : (
              <AppText style={styles.emptyText}>No earnings history data.</AppText>
            )}
          </View>

          <View style={[styles.card, styles.fundamentalsSectionCard]}>
            <AppText style={styles.cardTitle}>Income statement</AppText>
            {bundle.incomeStatement.length ? (
              renderStatementMatrix(bundle.incomeStatement, statementKeyOrder.income, styles, info?.currency)
            ) : (
              <AppText style={styles.emptyText}>No income statement data.</AppText>
            )}
          </View>

          <View style={[styles.card, styles.fundamentalsSectionCard]}>
            <AppText style={styles.cardTitle}>Balance sheet</AppText>
            {bundle.balanceSheet.length ? (
              renderStatementMatrix(bundle.balanceSheet, statementKeyOrder.balance, styles, info?.currency)
            ) : (
              <AppText style={styles.emptyText}>No balance sheet data.</AppText>
            )}
          </View>

        </>
      ) : null}
    </View>
  );
};

const NewsTab = ({
  news,
  loading,
  error,
  themeColors,
}: {
  news: StockNewsItem[] | null;
  loading: boolean;
  error: string;
  themeColors: Record<string, string>;
}) => {
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  return (
    <View style={styles.tabContent}>
      <View style={[styles.card, styles.sectionHeroCard]}>
        <AppText style={styles.cardTitle}>Latest news</AppText>
        <AppText style={styles.sectionHeroText}>
          Recent headlines and summaries for this ticker. Tap any story to open it externally.
        </AppText>
      </View>

      {loading && !news?.length ? (
        <View style={[styles.card, styles.sectionHeroCard]}>
          <ActivityIndicator size="small" color={themeColors.textPrimary} />
          <AppText style={styles.emptyText}>Loading news...</AppText>
        </View>
      ) : null}

      {error && !news?.length ? (
        <View style={[styles.card, styles.sectionHeroCard]}>
          <AppText style={styles.emptyText}>{error}</AppText>
        </View>
      ) : null}

      {news?.length
        ? news.map((item) => (
            <Pressable
              key={item.id}
              style={styles.newsArticleCard}
              onPress={() => item.url && Linking.openURL(item.url)}
            >
              <View style={styles.newsArticleMedia}>
                {item.thumbnail ? (
                  <Image source={{ uri: item.thumbnail }} style={styles.newsThumbnail} resizeMode="cover" />
                ) : (
                  <View style={styles.newsThumbnailFallback}>
                    <Newspaper size={22} color={themeColors.textMuted} />
                    <AppText style={styles.newsFallbackText}>No image</AppText>
                  </View>
                )}
              </View>

              <View style={styles.newsArticleBody}>
                <View style={styles.newsMetaRow}>
                  <View style={styles.newsProviderBadge}>
                    <AppText style={styles.newsProviderText}>{item.provider || 'News'}</AppText>
                  </View>
                  {item.publishedAt ? (
                    <AppText style={styles.newsMetaLine}>{formatDateTime(item.publishedAt)}</AppText>
                  ) : null}
                </View>

                <AppText style={styles.newsHeadline}>{item.title || 'Untitled story'}</AppText>
                {item.summary ? <AppText style={styles.newsSummary}>{item.summary}</AppText> : null}

                <View style={styles.newsFooterRow}>
                  <AppText style={styles.newsFooterText}>{item.provider || 'Open source'}</AppText>
                  <ExternalLink size={16} color={themeColors.textMuted} />
                </View>
              </View>
            </Pressable>
          ))
        : !loading && !error
          ? (
            <View style={[styles.card, styles.sectionHeroCard]}>
              <AppText style={styles.emptyText}>No recent news for this ticker.</AppText>
            </View>
            )
          : null}
    </View>
  );
};

const AlertsTab = ({
  enabled,
  alertsState,
  symbol,
  themeColors,
}: {
  enabled: boolean;
  alertsState: ReturnType<typeof useTickerAlerts>;
  symbol: string;
  themeColors: Record<string, string>;
}) => {
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const parsed = Number(targetPrice);
    if (!Number.isFinite(parsed)) return;
    try {
      setSubmitting(true);
      await alertsState.createAlert(condition, parsed);
      setTargetPrice('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!enabled) {
    return (
      <View style={styles.tabContent}>
        <View style={[styles.card, styles.sectionHeroCard]}>
          <AppText style={styles.cardTitle}>Alerts</AppText>
          <AppText style={styles.emptyText}>Alerts are only available for authenticated users.</AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={[styles.card, styles.sectionHeroCard]}>
        <AppText style={styles.cardTitle}>Create alert</AppText>
        <AppText style={styles.sectionHeroText}>
          Create and manage price alerts for this ticker using the existing alerts backend.
        </AppText>
        <View style={styles.chipsRow}>
          {['above', 'below'].map((item) => {
            const active = condition === item;
            return (
              <Pressable
                key={item}
                onPress={() => setCondition(item as 'above' | 'below')}
                style={[styles.chip, active && styles.chipActive]}
              >
                <AppText style={[styles.chipText, active && styles.chipTextActive]}>
                  {item === 'above' ? 'Price Above' : 'Price Below'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={targetPrice}
          onChangeText={setTargetPrice}
          keyboardType="decimal-pad"
          placeholder={`Target price for ${symbol}`}
          placeholderTextColor={themeColors.textMuted}
          style={styles.input}
        />
        <Pressable onPress={submit} disabled={submitting} style={styles.primaryButton}>
          <AppText style={styles.primaryButtonText}>{submitting ? 'Saving...' : 'Create Alert'}</AppText>
        </Pressable>
      </View>

      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Current alerts</AppText>
        {alertsState.loading && !alertsState.data?.length ? (
          <ActivityIndicator size="small" color={themeColors.textPrimary} />
        ) : null}
        {alertsState.error && !alertsState.data?.length ? (
          <AppText style={styles.emptyText}>{alertsState.error}</AppText>
        ) : null}
        {alertsState.data?.length ? (
          alertsState.data.map((item) => (
            <View key={item.id} style={styles.alertRow}>
              <View style={styles.listTextBlock}>
                <AppText style={styles.listTitle}>
                  {item.condition === 'below' ? 'Below' : 'Above'} {item.targetPrice ?? '--'}
                </AppText>
                <AppText style={styles.listSummary}>{item.enabled ? 'Active' : 'Paused'}</AppText>
              </View>
              <View style={styles.alertActions}>
                <Pressable onPress={() => alertsState.toggleAlert(item.id, !item.enabled)} style={styles.smallButton}>
                  <AppText style={styles.smallButtonText}>{item.enabled ? 'Pause' : 'Resume'}</AppText>
                </Pressable>
                <Pressable onPress={() => alertsState.removeAlert(item.id)} style={styles.smallButton}>
                  <AppText style={styles.smallButtonText}>Delete</AppText>
                </Pressable>
              </View>
            </View>
          ))
        ) : !alertsState.loading && !alertsState.error ? (
          <AppText style={styles.emptyText}>No alerts configured for this ticker.</AppText>
        ) : null}
      </View>
    </View>
  );
};

const buildAreaPath = (points: StockHistoryPoint[], width: number, height: number) => {
  if (!points.length) return '';
  const line = chartPath(points, width, height);
  const baseY = height;
  return `${line} L ${width.toFixed(2)} ${baseY.toFixed(2)} L 0 ${baseY.toFixed(2)} Z`;
};

const MainChart = ({
  points,
  color,
  tall = false,
}: {
  points: StockHistoryPoint[];
  color: string;
  tall?: boolean;
}) => {
  const { theme, themeColors } = useUser() as any;
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 72, 240);
  const chartHeight = tall ? 372 : 292;
  const plotHeight = chartHeight - 28;
  const values = points.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const path = chartPath(points, chartWidth, plotHeight);
  const areaPath = buildAreaPath(points, chartWidth, plotHeight);
  const step = points.length === 1 ? 0 : chartWidth / (points.length - 1);
  const softenedColor =
    color === '#199E63' || color === '#49D18D'
      ? '#16A34A'
      : color === '#CF3F58' || color === '#F08C8C'
        ? '#DC2626'
        : color;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const setNearestPoint = useCallback(
    (touchX: number) => {
      const clampedX = Math.max(0, Math.min(chartWidth, touchX));
      const index = step === 0 ? 0 : Math.round(clampedX / step);
      setActiveIndex(Math.max(0, Math.min(points.length - 1, index)));
    },
    [chartWidth, points.length, step],
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
    const point = points[activeIndex];
    if (!point) return null;
    const x = step === 0 ? chartWidth / 2 : activeIndex * step;
    const y = plotHeight - ((point.value - min) / (max - min || 1)) * plotHeight;
    const baseline = points[0]?.value ?? point.value;
    const delta = point.value - baseline;
    const pct = baseline ? (delta / baseline) * 100 : 0;
    return { point, x, y, delta, pct };
  }, [activeIndex, chartWidth, max, min, plotHeight, points, step]);

  const tooltipTheme = {
    backgroundColor: theme === 'light' ? 'rgba(15, 23, 42, 0.94)' : 'rgba(9, 14, 24, 0.9)',
    borderColor: theme === 'light' ? 'rgba(255, 255, 255, 0.18)' : themeColors.border,
    titleColor: '#FFFFFF',
    bodyColor: theme === 'light' ? 'rgba(255,255,255,0.88)' : themeColors.textMuted,
  };

  return (
    <View>
      <View style={styles.chartWrap}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={softenedColor} stopOpacity="0.18" />
              <Stop offset="100%" stopColor={softenedColor} stopOpacity="0.015" />
            </LinearGradient>
          </Defs>
          <Line x1="0" y1={plotHeight} x2={chartWidth} y2={plotHeight} stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
          {tall ? (
            <>
              <Line x1={chartWidth * 0.38} y1={0} x2={chartWidth * 0.38} y2={plotHeight} stroke="rgba(148,163,184,0.12)" strokeWidth="1" />
              <Line x1={0} y1={plotHeight * 0.45} x2={chartWidth} y2={plotHeight * 0.45} stroke="rgba(148,163,184,0.12)" strokeWidth="1" strokeDasharray="4 4" />
            </>
          ) : null}
          <Path d={areaPath} fill="url(#chartAreaGradient)" />
          <Path d={path} fill="none" stroke={softenedColor} strokeOpacity={0.92} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {activePoint ? (
            <>
              <Line
                x1={activePoint.x}
                y1="0"
                x2={activePoint.x}
                y2={plotHeight}
                stroke={themeColors.textMuted}
                strokeOpacity={0.34}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <Circle cx={activePoint.x} cy={activePoint.y} r="5" fill={softenedColor} stroke={themeColors.surface} strokeWidth="2.5" />
            </>
          ) : null}
        </Svg>
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
        {activePoint ? (
          <View
            style={[
              styles.chartTooltip,
              {
                left: Math.min(Math.max(activePoint.x - 74, 8), chartWidth - 148),
                top: Math.max(activePoint.y - 72, 8),
                backgroundColor: tooltipTheme.backgroundColor,
                borderColor: tooltipTheme.borderColor,
              },
            ]}
            pointerEvents="none"
          >
            <AppText style={[styles.chartTooltipPrice, { color: tooltipTheme.titleColor }]}>
              {formatCurrency(activePoint.point.value)}
            </AppText>
            <AppText style={[styles.chartTooltipTime, { color: tooltipTheme.bodyColor }]}>
              {formatDateTime(activePoint.point.timestamp)}
            </AppText>
            <AppText
              style={[
                styles.chartTooltipChange,
                {
                  color: tooltipTheme.titleColor,
                },
              ]}
            >
              {`${activePoint.delta >= 0 ? 'Up' : 'Down'} ${formatCurrency(Math.abs(activePoint.delta))} (${activePoint.pct >= 0 ? '+' : ''}${activePoint.pct.toFixed(2)}%)`}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.chartLegendRow}>
        <AppText style={styles.chartLegendText}>{formatCurrency(min)}</AppText>
        <AppText style={styles.chartLegendText}>{formatCurrency(max)}</AppText>
      </View>
    </View>
  );
};

const TabContent = ({
  activeTab,
  infoState,
  overviewSparkline,
  chartState,
  fundamentalsState,
  newsState,
  alertsState,
  chartTimeframe,
  onChangeChartTimeframe,
  symbol,
  token,
  themeColors,
}: any) => {
  if (activeTab === 'overview') {
    return (
      <OverviewTab
        info={infoState.info}
        company={infoState.company}
        sparkline={overviewSparkline.data}
        sparklineLoading={overviewSparkline.loading}
        sparklineError={overviewSparkline.error}
        themeColors={themeColors}
      />
    );
  }

  if (activeTab === 'chart') {
    return (
      <ChartTab
        info={infoState.info}
        history={chartState.data}
        loading={chartState.loading}
        error={chartState.error}
        timeframe={chartTimeframe}
        onChangeTimeframe={onChangeChartTimeframe}
        themeColors={themeColors}
      />
    );
  }

  if (activeTab === 'fundamentals') {
    return (
      <FundamentalsTab
        bundle={fundamentalsState.data}
        loading={fundamentalsState.loading}
        error={fundamentalsState.error}
        themeColors={themeColors}
      />
    );
  }

  if (activeTab === 'news') {
    return (
      <NewsTab
        news={newsState.data}
        loading={newsState.loading}
        error={newsState.error}
        themeColors={themeColors}
      />
    );
  }

  return (
    <AlertsTab enabled={Boolean(token)} alertsState={alertsState} symbol={symbol} themeColors={themeColors} />
  );
};

const StockDetailScreen = ({ route }: any) => {
  const { themeColors, token } = useUser() as any;
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const symbol = useMemo(() => normalizeStockSymbol(route?.params?.symbol), [route?.params?.symbol]);
  const routeTab = useMemo(
    () => normalizeInitialTabState(normalizeStockTab(route?.params?.tab), Boolean(token)),
    [route?.params?.tab, token],
  );
  const routeTimeframe = useMemo(
    () => normalizeChartTimeframe(route?.params?.tf),
    [route?.params?.tf],
  );
  const [activeTab, setActiveTab] = useState(routeTab);
  const [chartTimeframe, setChartTimeframe] = useState(routeTimeframe || DEFAULT_CHART_TIMEFRAME);
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({ [routeTab]: true, overview: true });

  useEffect(() => {
    setActiveTab(routeTab);
    setChartTimeframe(routeTimeframe || DEFAULT_CHART_TIMEFRAME);
    setVisitedTabs({ [routeTab]: true, overview: true });
  }, [routeTab, routeTimeframe, symbol]);

  useEffect(() => {
    setVisitedTabs((prev) => ({ ...prev, [activeTab]: true }));
  }, [activeTab]);

  const infoState = useStockInfo(symbol);
  const overviewSparkline = useStockHistory(symbol, '1D', true);
  const chartState = useStockHistory(symbol, chartTimeframe, visitedTabs.chart || activeTab === 'chart');
  const fundamentalsState = useStockFundamentals(symbol, visitedTabs.fundamentals || activeTab === 'fundamentals');
  const newsState = useStockNews(symbol, visitedTabs.news || activeTab === 'news');
  const alertsState = useTickerAlerts(symbol, Boolean(token) && (visitedTabs.alerts || activeTab === 'alerts'));

  const price = infoState.info?.regularMarketPrice;
  const change = infoState.info?.regularMarketChange;
  const changePct = infoState.info?.regularMarketChangePercent;
  const toneUp = (change ?? 0) >= 0;
  const visibleTabs = useMemo(
    () => ['overview', 'chart', 'fundamentals', 'news', ...(token ? ['alerts'] : [])],
    [token],
  );
  const handleTabChange = useCallback((nextTab: string) => {
    setActiveTab(nextTab);
  }, []);
  const tabSwipeHandlers = useHorizontalSwipe(visibleTabs, activeTab, handleTabChange);

  return (
    <View style={styles.screen}>
      <GradientBackground>
        <View style={styles.header}>
          <View style={styles.symbolRow}>
            <View style={styles.symbolMeta}>
              <AppText style={styles.symbolText}>{symbol || '--'}</AppText>
              <AppText style={styles.symbolName}>
                {infoState.company?.name || infoState.info?.longName || infoState.info?.shortName || 'Loading company'}
              </AppText>
            </View>
            <View style={styles.priceBlock}>
              <AppText style={styles.priceText}>{formatCurrency(price ?? null, infoState.info?.currency)}</AppText>
              <AppText style={[styles.changeText, { color: toneUp ? themeColors.positive : themeColors.negative }]}>
                {change != null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}` : '--'}{' '}
                {changePct != null ? `(${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%)` : ''}
              </AppText>
            </View>
          </View>

          {infoState.loading && !infoState.info ? (
            <View style={styles.inlineLoader}>
              <ActivityIndicator size="small" color={themeColors.textPrimary} />
            </View>
          ) : null}
          {infoState.error && !infoState.info ? <AppText style={styles.errorText}>{infoState.error}</AppText> : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsBar}
        >
          {visibleTabs.map((tab) => {
            const active = activeTab === tab;
            const Icon = tab === 'chart' ? ChartNoAxesCombined : tab === 'news' ? Newspaper : tab === 'alerts' ? Bell : null;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
                <View style={styles.tabButtonInner}>
                  {Icon ? <Icon size={17} color={active ? themeColors.textPrimary : themeColors.textMuted} /> : null}
                  <AppText style={[styles.tabLabel, active && styles.tabLabelActive]}>{TAB_LABELS[tab as keyof typeof TAB_LABELS]}</AppText>
                </View>
                <View style={[styles.tabUnderline, active && styles.tabUnderlineActive]} />
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          {...tabSwipeHandlers}
        >
          <View key={`${symbol}-${activeTab}-${activeTab === 'chart' ? chartTimeframe : 'base'}`}>
            <TabContent
              activeTab={activeTab}
              infoState={infoState}
              overviewSparkline={overviewSparkline}
              chartState={chartState}
              fundamentalsState={fundamentalsState}
              newsState={newsState}
              alertsState={alertsState}
              chartTimeframe={chartTimeframe}
              onChangeChartTimeframe={setChartTimeframe}
              symbol={symbol}
              token={token}
              themeColors={themeColors}
            />
          </View>
        </ScrollView>
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors: Record<string, string>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: 28,
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 10,
    },
    symbolRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 12,
    },
    symbolMeta: {
      flex: 1,
      gap: 4,
    },
    symbolText: {
      fontSize: 24,
      fontFamily: 'NotoSans-ExtraBold',
      color: colors.textPrimary,
    },
    symbolName: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    priceBlock: {
      alignItems: 'flex-end',
      gap: 4,
    },
    priceText: {
      fontSize: 26,
      fontFamily: 'NotoSans-ExtraBold',
      color: colors.textPrimary,
    },
    changeText: {
      fontSize: 13,
      fontFamily: FONT.semiBold,
    },
    inlineLoader: {
      alignItems: 'flex-start',
    },
    errorText: {
      color: colors.negative,
      fontSize: 12,
      fontFamily: FONT.regular,
    },
    tabsBar: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(15, 23, 42, 0.08)',
      backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'flex-end',
    },
    tabsScroll: {
      flexGrow: 0,
      maxHeight: 68,
    },
    tabButton: {
      marginRight: 20,
      flexShrink: 0,
    },
    tabButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 34,
      paddingHorizontal: 2,
      paddingTop: 4,
      paddingBottom: 6,
    },
    tabLabel: {
      fontSize: 15,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },
    tabLabelActive: {
      color: colors.textPrimary,
      fontFamily: FONT.semiBold,
    },
    tabUnderline: {
      height: 3,
      minWidth: 18,
      borderRadius: 999,
      backgroundColor: 'transparent',
      marginTop: 8,
    },
    tabUnderlineActive: {
      backgroundColor: colors.textPrimary,
    },
    contentScroll: {
      flex: 1,
    },
    chartWrap: {
      position: 'relative',
    },
    chartLegendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    chartLegendText: {
      fontSize: 11,
      color: '#94A3B8',
      fontFamily: FONT.regular,
    },
    chartTooltip: {
      position: 'absolute',
      width: 148,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      shadowColor: '#000000',
      shadowOpacity: 0.18,
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
    scrollContent: {
      paddingHorizontal: 10,
      paddingTop: 20,
      paddingBottom: 32,
    },
    tabContent: {
      gap: 16,
    },
    sectionHeroCard: {
      width: '100%',
      gap: 8,
    },
    fundamentalsHeroCard: {
      minHeight: 132,
      justifyContent: 'center',
    },
    fundamentalsHeroMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    fundamentalsHeroBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    fundamentalsHeroBadgeText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: FONT.medium,
    },
    sectionHeroText: {
      width: '100%',
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: FONT.regular,
    },
    card: {
      width: '100%',
      backgroundColor: colors.surfaceGlass,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 12,
      shadowColor: '#0F172A',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    overviewSnapshotSection: {
      marginTop: 10,
    },
    snapshotMetaText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: FONT.regular,
      marginTop: -2,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
    },
    actionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    actionChipText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: FONT.medium,
    },
    fundamentalsLoaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 6,
    },
    fundamentalsLoaderText: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: FONT.medium,
    },
    heroCard: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 14,
    },
    heroHeaderBlock: {
      flex: 1,
      gap: 4,
      paddingRight: 12,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    cardTitle: {
      fontSize: 20,
      fontFamily: FONT.semiBold,
      color: colors.textPrimary,
    },
    cardBadge: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },
    heroName: {
      fontSize: 18,
      fontFamily: FONT.semiBold,
      color: colors.textPrimary,
    },
    heroSub: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: FONT.regular,
    },
    heroBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    symbolBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    symbolBadgeText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: FONT.medium,
    },
    marketStateBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
    },
    marketStateBadgeOpen: {
      backgroundColor: 'rgba(73, 209, 141, 0.12)',
      borderColor: 'rgba(73, 209, 141, 0.42)',
    },
    marketStateBadgeClosed: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.border,
    },
    marketStateBadgeText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: FONT.medium,
      textTransform: 'uppercase',
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    refreshButtonText: {
      color: colors.textPrimary,
      fontFamily: FONT.medium,
      fontSize: 13,
    },
    snapshotHeroCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: 14,
      gap: 10,
    },
    snapshotHeroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    snapshotHeroTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    snapshotHeroLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: FONT.medium,
    },
    snapshotHeroPrice: {
      color: colors.textPrimary,
      fontSize: 22,
      fontFamily: FONT.extraBold,
    },
    heroChangePill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
    },
    changePillUp: {
      backgroundColor: 'rgba(73, 209, 141, 0.12)',
      borderColor: 'rgba(73, 209, 141, 0.42)',
    },
    changePillDown: {
      backgroundColor: 'rgba(240, 140, 140, 0.12)',
      borderColor: 'rgba(240, 140, 140, 0.42)',
    },
    heroChangeText: {
      fontSize: 12,
      fontFamily: FONT.semiBold,
    },
    kpiStack: {
      gap: 10,
    },
    overviewKpiCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: 14,
      gap: 6,
    },
    overviewKpiLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.medium,
    },
    overviewKpiValue: {
      color: colors.textPrimary,
      fontSize: 18,
      fontFamily: FONT.semiBold,
    },
    overviewKpiSub: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.regular,
    },
    profileCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: 14,
      gap: 10,
    },
    inlineInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    profileCardTitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: FONT.medium,
    },
    profileScoreText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontFamily: FONT.semiBold,
    },
    profileTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: 'rgba(148,163,184,0.18)',
      overflow: 'hidden',
    },
    profileFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.positive,
    },
    profileCaption: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
      fontFamily: FONT.regular,
    },
    chartHeroCard: {
      backgroundColor: colors.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
      gap: 16,
      shadowColor: '#0F172A',
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
    chartPriceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      gap: 8,
    },
    chartPriceValue: {
      color: colors.textPrimary,
      fontSize: 24,
      fontFamily: FONT.extraBold,
    },
    chartPriceChange: {
      fontSize: 14,
      fontFamily: FONT.semiBold,
    },
    chartPriceTf: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: FONT.medium,
    },
    chartCanvasWrap: {
      marginTop: 16,
      minHeight: 372,
      justifyContent: 'center',
      position: 'relative',
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.surfaceGlass,
    },
    chartLoaderWrap: {
      minHeight: 220,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartLoadingOverlay: {
      position: 'absolute',
      top: 10,
      left: 10,
      right: 10,
      alignItems: 'center',
      gap: 8,
    },
    chartLoadingTrack: {
      width: '100%',
      height: 4,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: 'rgba(148,163,184,0.18)',
    },
    chartLoadingFill: {
      width: '42%',
      height: '100%',
      borderRadius: 999,
    },
    chartLoadingText: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.medium,
    },
    chartTfWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingTop: 4,
    },
    chartTfChip: {
      minWidth: 0,
      flexGrow: 1,
      flexBasis: 0,
      paddingHorizontal: 0,
      paddingVertical: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
    },
    chartTfChipActive: {
      backgroundColor: colors.textPrimary,
      borderColor: colors.textPrimary,
      shadowColor: '#0F172A',
      shadowOpacity: colors.background === '#0B0B0C' ? 0.18 : 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    chartTfChipText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: FONT.medium,
    },
    chartTfChipTextActive: {
      color: colors.background,
      fontFamily: FONT.semiBold,
    },
    sparklineCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      backgroundColor: colors.surfaceAlt,
      gap: 10,
    },
    sparklineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metricCard: {
      width: '47%',
      backgroundColor: colors.surfaceGlass,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 8,
    },
    skeletonCard: {
      minHeight: 92,
      backgroundColor: colors.surfaceAlt,
      borderColor: 'rgba(15, 23, 42, 0.06)',
    },
    skeletonSection: {
      minHeight: 156,
      backgroundColor: colors.surfaceAlt,
      borderColor: 'rgba(15, 23, 42, 0.06)',
    },
    metricLabel: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      fontFamily: FONT.medium,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: FONT.semiBold,
    },
    aboutGrid: {
      gap: 10,
    },
    aboutRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },
    aboutValue: {
      flex: 1,
      textAlign: 'right',
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: FONT.medium,
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    splitColumn: {
      gap: 14,
    },
    fundamentalsSectionCard: {
      minHeight: 124,
      justifyContent: 'flex-start',
    },
    overviewSnapshotChartWrap: {
      paddingTop: 40,
      marginBottom: 12,
    },
    overviewMiniRow: {
      flexDirection: 'row',
      gap: 10,
      padding: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    overviewMiniIcon: {
      paddingTop: 1,
    },
    overviewMiniBody: {
      flex: 1,
      gap: 4,
    },
    overviewMiniLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.regular,
    },
    overviewMiniValue: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: FONT.medium,
    },
    leadershipRow: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 4,
    },
    leadershipName: {
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: FONT.semiBold,
    },
    leadershipTitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: FONT.regular,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 4,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    chipActive: {
      borderColor: colors.textPrimary,
      backgroundColor: colors.surfaceGlass,
    },
    chipText: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily: FONT.medium,
    },
    chipTextActive: {
      color: colors.textPrimary,
    },
    estimateStack: {
      gap: 12,
    },
    estimateCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      padding: 14,
      gap: 12,
    },
    estimateTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontFamily: FONT.semiBold,
    },
    estimateGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    estimateMetric: {
      width: '47%',
      borderRadius: 14,
      backgroundColor: colors.surfaceGlass,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 4,
    },
    estimateLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.medium,
    },
    estimateValue: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: FONT.semiBold,
    },
    snapshotTileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    snapshotTile: {
      width: '47%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 4,
    },
    snapshotTileFullWidth: {
      width: '100%',
    },
    snapshotTileLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    snapshotTileValue: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: FONT.semiBold,
    },
    statementTableWrap: {
      paddingBottom: 4,
    },
    statementTable: {
      minWidth: 760,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    statementHeaderRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceGlass,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statementDataRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(15, 23, 42, 0.06)',
    },
    statementDataRowAlt: {
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    statementMetricCell: {
      width: 210,
      paddingHorizontal: 14,
      paddingVertical: 12,
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    statementPeriodCell: {
      width: 140,
      paddingHorizontal: 14,
      paddingVertical: 12,
      justifyContent: 'center',
      alignItems: 'flex-end',
      borderRightWidth: 1,
      borderRightColor: 'rgba(15, 23, 42, 0.06)',
    },
    statementHeaderText: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: FONT.semiBold,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    statementMetricText: {
      color: colors.textPrimary,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FONT.medium,
    },
    statementValueText: {
      color: colors.textPrimary,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: FONT.semiBold,
      textAlign: 'right',
    },
    listRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    listTextBlock: {
      flex: 1,
      gap: 6,
    },
    listTitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textPrimary,
      fontFamily: FONT.medium,
    },
    listSummary: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    listMeta: {
      color: colors.textPrimary,
      fontSize: 12,
      fontFamily: FONT.medium,
    },
    newsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(15, 23, 42, 0.06)',
    },
    newsArticleCard: {
      width: '100%',
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      overflow: 'hidden',
      shadowColor: '#0F172A',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    newsArticleMedia: {
      height: 188,
      width: '100%',
      backgroundColor: colors.surfaceAlt,
    },
    newsThumbnail: {
      width: '100%',
      height: '100%',
    },
    newsThumbnailFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    newsFallbackText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: FONT.medium,
    },
    newsArticleBody: {
      padding: 16,
      gap: 12,
    },
    newsMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    },
    newsProviderBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    newsProviderText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontFamily: FONT.medium,
    },
    newsHeadline: {
      color: colors.textPrimary,
      fontSize: 17,
      lineHeight: 24,
      fontFamily: FONT.semiBold,
    },
    newsSummary: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 21,
      fontFamily: FONT.regular,
    },
    newsFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    newsFooterText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: FONT.medium,
    },
    newsIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    newsMetaLine: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: FONT.regular,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: FONT.regular,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
      color: colors.textPrimary,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: FONT.regular,
    },
    primaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      paddingVertical: 13,
      backgroundColor: colors.accent,
    },
    primaryButtonText: {
      color: colors.background,
      fontSize: 14,
      fontFamily: FONT.semiBold,
    },
    alertRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(15, 23, 42, 0.06)',
    },
    alertActions: {
      flexDirection: 'row',
      gap: 8,
      paddingTop: 2,
    },
    smallButton: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    smallButtonText: {
      fontSize: 12,
      color: colors.textPrimary,
      fontFamily: FONT.medium,
    },
  });

export default StockDetailScreen;
