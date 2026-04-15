import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Globe,
  RefreshCcw,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import HomeHeader from '../../components/HomeHeader';
import { navigateToStockDetail, normalizeStockSymbol } from '../../features/stocks/navigation';
import { useTickerSearch } from '../../features/stocks/useTickerSearch';
import { API_BASE_URL, useUser } from '../../store/UserContext';

const REGION_MAP = {
  GSPC: 'Americas',
  DJI: 'Americas',
  IXIC: 'Americas',
  RUT: 'Americas',
  SET: 'Americas',
  BVSP: 'Americas',
  MXX: 'Americas',
  IPSA: 'Americas',
  VIX: 'Americas',
  FTSE: 'Europe',
  GDAXI: 'Europe',
  FCHI: 'Europe',
  STOXX50E: 'Europe',
  IBEX: 'Europe',
  N225: 'Asia-Pacific',
  HSI: 'Asia-Pacific',
  TWII: 'Asia-Pacific',
  KS11: 'Asia-Pacific',
  KQ11: 'Asia-Pacific',
  NSEI: 'Asia-Pacific',
  BSESN: 'Asia-Pacific',
  AXJO: 'Asia-Pacific',
  NZ50: 'Asia-Pacific',
  STI: 'Asia-Pacific',
  JKSE: 'Asia-Pacific',
};

const GLOBAL_INDICES_URL = `${API_BASE_URL}/api/tagx/global-indices`;
const HIDDEN_TICKERS = new Set([
  'CASE30',
  'SMI',
  'MIB',
  'TOPX',
  'HSTECH',
  'SSEC',
  'SZ399001',
  'KOSPI',
  'FBMKLCI',
  'TA125',
  'J203',
  'SPTSX',
]);

const fmtNumber = (value, digits = 2) => {
  if (value == null || Number.isNaN(value)) return '--';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const fmtInteger = (value) => {
  if (value == null || Number.isNaN(value)) return '--';
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const pctFromChange = (price, change) => {
  if (price == null || change == null) return null;
  const prev = price - change;
  if (!Number.isFinite(prev) || prev === 0) return null;
  return (change / prev) * 100;
};

const changeTone = (change) => {
  if (change == null || Number.isNaN(change)) return 'flat';
  if (change > 0.01) return 'up';
  if (change < -0.01) return 'down';
  return 'flat';
};

const fmtUpdatedAt = (iso) => {
  if (!iso) return '--';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '--';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dt);
};

const clamp01 = (x) => Math.max(0, Math.min(1, x));

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractIndices = (payload) => {
  return toArray(payload)
    .map((item) => ({
      name: item?.name || item?.label || item?.index || item?.ticker || 'Unknown Index',
      ticker: item?.ticker || item?.symbol || item?.code || 'N/A',
      price: toNumber(item?.price ?? item?.value ?? item?.last),
      priceChange: toNumber(item?.priceChange ?? item?.change ?? item?.delta),
    }))
    .filter((item) => item.ticker !== 'N/A')
    .filter((item) => !HIDDEN_TICKERS.has(String(item.ticker || '').toUpperCase()));
};

const getToneStyle = (tone, colors) => {
  if (tone === 'up') return { color: colors.positive };
  if (tone === 'down') return { color: colors.negative };
  return { color: colors.textMuted };
};

const getPillStyle = (tone, colors) => {
  if (tone === 'up') {
    return {
      borderColor: 'rgba(73, 209, 141, 0.45)',
      backgroundColor: 'rgba(73, 209, 141, 0.14)',
      color: colors.positive,
    };
  }
  if (tone === 'down') {
    return {
      borderColor: 'rgba(240, 140, 140, 0.45)',
      backgroundColor: 'rgba(240, 140, 140, 0.14)',
      color: colors.negative,
    };
  }
  return {
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    color: colors.textMuted,
  };
};

const LoadingShell = ({ styles, themeColors }) => (
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.heroCard}>
      <View style={styles.heroOrbA} />
      <View style={styles.heroOrbB} />
      <View style={styles.skeletonRowBetween}>
        <View style={styles.flex1}>
          <View style={[styles.skeletonLine, styles.skeletonBadgeLine]} />
          <View style={[styles.skeletonLine, styles.skeletonHeroTitle]} />
          <View style={[styles.skeletonLine, styles.skeletonHeroSub]} />
        </View>
        <View style={[styles.skeletonBadge, { borderColor: themeColors.border }]} />
      </View>
      <View style={styles.heroMetricsRow}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.heroMetricCard}>
            <View style={[styles.skeletonLine, styles.skeletonMiniLabel]} />
            <View style={[styles.skeletonLine, styles.skeletonMiniValue]} />
          </View>
        ))}
      </View>
    </View>

    <View style={styles.sectionCard}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.skeletonLine, styles.skeletonSectionTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonSectionMeta]} />
      </View>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeletonMoverCard}>
          <View style={styles.skeletonMoverLeft}>
            <View style={[styles.skeletonLine, styles.skeletonTicker]} />
            <View style={[styles.skeletonLine, styles.skeletonSubline]} />
          </View>
          <View style={styles.skeletonMoverRight}>
            <View style={[styles.skeletonLine, styles.skeletonPrice]} />
            <View style={[styles.skeletonLine, styles.skeletonSublineSmall]} />
          </View>
        </View>
      ))}
    </View>
  </ScrollView>
);

const GlobalIndices = ({ navigation }) => {
  const { themeColors, user } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [data, setData] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const mountedRef = useRef(true);
  const profileName = user?.displayName || user?.name || 'Trader';
  const { results, loading: searchLoading, error: searchError } = useTickerSearch(searchQuery);

  const loadIndices = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(GLOBAL_INDICES_URL, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to load (${response.status})`);
      }

      const payload = await response.json();
      const next = extractIndices(payload);

      if (!mountedRef.current) return;

      setData(next);
      setUpdatedAt(payload?.updatedAt || new Date().toISOString());
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.message || 'Failed to load global indices.');
      setData([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadIndices();

    return () => {
      mountedRef.current = false;
    };
  }, [loadIndices]);

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return data;

    return data.filter((item) => {
      const region = REGION_MAP[item.ticker] || 'Other';
      return (
        String(item.ticker || '').toLowerCase().includes(query) ||
        String(item.name || '').toLowerCase().includes(query) ||
        region.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  const derived = useMemo(() => {
    const valid = filteredData.filter((item) => item.priceChange != null);
    const advancers = valid.filter((item) => item.priceChange > 0);
    const decliners = valid.filter((item) => item.priceChange < 0);

    const pctValues = valid
      .map((item) => pctFromChange(item.price, item.priceChange))
      .filter((value) => value != null);

    const avgPct = pctValues.length
      ? pctValues.reduce((sum, value) => sum + value, 0) / pctValues.length
      : null;

    const movers = [...valid]
      .sort((a, b) => Math.abs(b.priceChange || 0) - Math.abs(a.priceChange || 0))
      .slice(0, 4);

    const breadth = valid.length ? advancers.length / valid.length : 0.5;
    const avgScaled = avgPct == null ? 0.5 : clamp01((avgPct + 1.2) / 2.4);
    const score = Math.round(clamp01(0.55 * breadth + 0.45 * avgScaled) * 100);
    const regime = score >= 62 ? 'Risk-On' : score <= 42 ? 'Risk-Off' : 'Balanced';

    return { valid, advancers, decliners, avgPct, movers, score, regime };
  }, [filteredData]);

  const grouped = useMemo(() => {
    const groups = {};

    filteredData.forEach((item) => {
      const region = REGION_MAP[item.ticker] || 'Other';
      if (!groups[region]) groups[region] = [];
      groups[region].push(item);
    });

    const order = ['Americas', 'Europe', 'Asia-Pacific', 'Africa', 'Other'];
    return order.filter((region) => groups[region]?.length).map((region) => [region, groups[region]]);
  }, [filteredData]);

  const regionStats = useMemo(() => {
    const out = {};

    grouped.forEach(([region, items]) => {
      const pctValues = items
        .map((item) => pctFromChange(item.price, item.priceChange))
        .filter((value) => value != null);

      const avg = pctValues.length ? pctValues.reduce((sum, value) => sum + value, 0) / pctValues.length : null;
      const valid = items.filter((item) => item.priceChange != null);
      const adv = valid.filter((item) => item.priceChange > 0).length;
      const dec = valid.filter((item) => item.priceChange < 0).length;

      let tone = 'flat';
      if (avg != null && avg > 0.05) tone = 'up';
      if (avg != null && avg < -0.05) tone = 'down';

      out[region] = { avg, adv, dec, total: valid.length, tone };
    });

    return out;
  }, [grouped]);

  const livePulseLabel = useMemo(() => {
    if (loading) return 'Syncing';
    if (error) return 'Degraded';
    return 'Live';
  }, [error, loading]);

  const openIndexDetail = useCallback(
    (symbol) => {
      if (!symbol) return;
      navigation.navigate('IndexDetail', { symbol: String(symbol).toUpperCase(), tf: '1M' });
    },
    [navigation],
  );

  const submitTickerSearch = useCallback(() => {
    const normalized = normalizeStockSymbol(searchQuery);
    if (/^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized)) {
      navigateToStockDetail(navigation, normalized);
      return;
    }

    if (results[0]?.symbol) {
      navigateToStockDetail(navigation, results[0].symbol);
    }
  }, [navigation, results, searchQuery]);

  const selectTickerSearchResult = useCallback(
    (item) => {
      if (!item?.symbol) return;
      setSearchQuery(item.symbol);
      navigateToStockDetail(navigation, item.symbol);
    },
    [navigation],
  );

  const page = (
    <>
      <HomeHeader
        themeColors={themeColors}
        profileName={profileName}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        searchResults={results}
        searchLoading={searchLoading}
        searchError={searchError}
        showSearchResults={Boolean(searchQuery.trim())}
        onPressSearchResult={selectTickerSearchResult}
        onSubmitSearch={submitTickerSearch}
        onPressProfile={() => navigation.navigate('Profile')}
        onPressGlobalIndices={() => {}}
      />

      {loading ? (
        <View style={styles.fullPageLoaderWrap}>
          <LoadingShell styles={styles} themeColors={themeColors} />
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color={themeColors.textPrimary} />
            <AppText style={styles.loaderOverlayText}>Syncing global market snapshot...</AppText>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroOrbA} />
            <View style={styles.heroOrbB} />
            <View style={styles.heroGlowLine} />

            <View style={styles.badgeRow}>
              <View style={styles.heroBadge}>
                <Globe size={14} color={themeColors.accent} />
                <AppText style={styles.heroBadgeText}>GLOBAL MARKETS</AppText>
              </View>
              <AppText style={styles.heroStatusText}>{livePulseLabel}</AppText>
              {!!error && (
                <View style={[styles.heroBadge, styles.errorBadge]}>
                  <AlertTriangle size={14} color={themeColors.negative} />
                  <AppText style={styles.errorBadgeText}>Data issue</AppText>
                </View>
              )}
            </View>

            <View style={styles.heroTopRow}>
              <View style={styles.heroCopyWrap}>
                <AppText style={styles.heroTitle}>Global Market Outlook</AppText>
                <AppText style={styles.heroSubtitle}>Live cross-market pulse and risk snapshot.</AppText>
              </View>

              <Pressable style={styles.refreshButton} onPress={loadIndices}>
                <RefreshCcw size={15} color={themeColors.textPrimary} />
                <AppText style={styles.refreshButtonText}>Refresh</AppText>
              </Pressable>
            </View>

            <View style={styles.metaRow}>
              <AppText style={styles.metaPill}>{`Updated ${fmtUpdatedAt(updatedAt)}`}</AppText>
              <View style={styles.pulsePill}>
                <Shield size={13} color={themeColors.accent} />
                <AppText style={styles.pulsePillText}>{`Pulse ${derived.regime}`}</AppText>
              </View>
            </View>

            <View style={styles.heroMetricsRow}>
              <View style={styles.heroMetricCard}>
                <AppText style={styles.heroMetricLabel}>Risk score</AppText>
                <AppText style={styles.heroMetricValue}>{derived.score}</AppText>
              </View>
              <View style={styles.heroMetricCard}>
                <AppText style={styles.heroMetricLabel}>Breadth</AppText>
                <AppText style={styles.heroMetricValue}>
                  {derived.valid.length ? `${Math.round((derived.advancers.length / derived.valid.length) * 100)}%` : '--'}
                </AppText>
              </View>
            </View>
          </View>

          {!!error && (
            <View style={styles.inlineAlert}>
              <AlertTriangle size={16} color={themeColors.negative} />
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          )}

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View>
                <AppText weight="medium" style={styles.sectionOverline}>RISK PULSE</AppText>
                <AppText weight="semiBold" style={styles.sectionTitle}>Breadth and Tone</AppText>
              </View>
              <View style={styles.scoreBox}>
                <Shield size={14} color={themeColors.textMuted} />
                <AppText weight="semiBold" style={styles.scoreText}>{derived.score}</AppText>
              </View>
            </View>

            <View style={styles.breadthHeroCard}>
              <View style={styles.breadthHeroTopRow}>
                <View>
                  <AppText weight="medium" style={styles.breadthHeroLabel}>Market regime</AppText>
                  <AppText weight="semiBold" style={styles.breadthHeroValue}>{derived.regime}</AppText>
                </View>
                <View style={styles.breadthScoreRing}>
                  <AppText weight="semiBold" style={styles.breadthScoreValue}>{derived.score}</AppText>
                  <AppText weight="medium" style={styles.breadthScoreLabel}>Score</AppText>
                </View>
              </View>
              <AppText weight="medium" style={styles.breadthHeroMeta}>
                {derived.avgPct == null ? 'Average move unavailable' : `Average move ${derived.avgPct.toFixed(2)}%`}
              </AppText>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${derived.score}%` }]} />
            </View>

            <View style={styles.breadthList}>
              <View style={styles.breadthRow}>
                <View style={styles.breadthRowLeft}>
                  <View style={[styles.breadthIconWrap, styles.breadthIconWrapUp]}>
                    <TrendingUp size={13} color={themeColors.positive} />
                  </View>
                  <AppText weight="medium" style={styles.breadthRowLabel}>Advancers</AppText>
                </View>
                <View style={[styles.breadthValuePill, styles.breadthValuePillUp]}>
                  <AppText weight="semiBold" style={[styles.breadthValueText, { color: themeColors.positive }]}>{derived.advancers.length}</AppText>
                </View>
              </View>

              <View style={styles.breadthRow}>
                <View style={styles.breadthRowLeft}>
                  <View style={[styles.breadthIconWrap, styles.breadthIconWrapDown]}>
                    <TrendingDown size={13} color={themeColors.negative} />
                  </View>
                  <AppText weight="medium" style={styles.breadthRowLabel}>Decliners</AppText>
                </View>
                <View style={[styles.breadthValuePill, styles.breadthValuePillDown]}>
                  <AppText weight="semiBold" style={[styles.breadthValueText, { color: themeColors.negative }]}>{derived.decliners.length}</AppText>
                </View>
              </View>

              <View style={styles.breadthRow}>
                <View style={styles.breadthRowLeft}>
                  <View style={[styles.breadthIconWrap, styles.breadthIconWrapNeutral]}>
                    <Sparkles size={13} color={themeColors.accent} />
                  </View>
                  <AppText weight="medium" style={styles.breadthRowLabel}>Average move</AppText>
                </View>
                <View style={styles.breadthValuePill}>
                  <AppText weight="semiBold" style={styles.breadthValueText}>
                    {derived.avgPct == null ? '--' : `${derived.avgPct.toFixed(2)}%`}
                  </AppText>
                </View>
              </View>

              <View style={styles.breadthRow}>
                <View style={styles.breadthRowLeft}>
                  <View style={[styles.breadthIconWrap, styles.breadthIconWrapNeutral]}>
                    <Globe size={13} color={themeColors.textMuted} />
                  </View>
                  <AppText weight="medium" style={styles.breadthRowLabel}>Indices tracked</AppText>
                </View>
                <View style={styles.breadthValuePill}>
                  <AppText weight="semiBold" style={styles.breadthValueText}>{derived.valid.length}</AppText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View>
                <AppText weight="medium" style={styles.sectionOverline}>MOVERS RADAR</AppText>
                <AppText weight="semiBold" style={styles.sectionTitle}>Largest Swings</AppText>
              </View>
              <AppText style={styles.metaPill}>Top 4</AppText>
            </View>

            <View style={styles.moversGrid}>
              {derived.movers.map((item) => {
                const pct = pctFromChange(item.price, item.priceChange);
                const tone = changeTone(item.priceChange);
                const toneStyle = getToneStyle(tone, themeColors);
                const pill = getPillStyle(tone, themeColors);
                const moverToneStyle =
                  tone === 'up'
                    ? styles.moverCardUp
                    : tone === 'down'
                      ? styles.moverCardDown
                      : styles.moverCardFlat;

                return (
                  <Pressable
                    key={item.ticker}
                    style={({ pressed }) => [styles.moverCard, moverToneStyle, pressed && styles.moverCardPressed]}
                    onPress={() => openIndexDetail(item.ticker)}
                  >
                    <View style={styles.moverGlow} />
                    <View style={styles.moverHeaderRow}>
                      <View style={styles.moverIdentityWrap}>
                        <View
                          style={[
                            styles.moverDot,
                            tone === 'up'
                              ? styles.moverDotUp
                              : tone === 'down'
                                ? styles.moverDotDown
                                : styles.moverDotFlat,
                          ]}
                        />
                        <View style={styles.moverTitleWrap}>
                          <AppText weight="semiBold" numberOfLines={1} style={styles.moverTicker}>{(item.ticker || '').toUpperCase()}</AppText>
                          <AppText weight="medium" numberOfLines={1} style={styles.moverRegion}>{item.name}</AppText>
                        </View>
                      </View>
                    </View>

                    <View style={styles.moverMiddleRow}>
                      <View style={styles.moverPriceBlock}>
                        <AppText weight="semiBold" style={styles.moverValue}>{fmtNumber(item.price)}</AppText>
                        <AppText weight="medium" style={styles.moverValueLabel}>Last traded</AppText>
                      </View>

                      <View style={styles.moverDeltaBlock}>
                        <View style={styles.moverChangeMain}>
                          {tone === 'up' ? (
                            <ArrowUpRight size={18} color={toneStyle.color} />
                          ) : tone === 'down' ? (
                            <ArrowDownRight size={18} color={toneStyle.color} />
                          ) : null}
                          <AppText weight="semiBold" style={[styles.moverChangeValue, { color: toneStyle.color }]}>
                            {pct == null ? '--' : `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`}
                          </AppText>
                        </View>
                        <AppText weight="medium" style={styles.moverPctText}>
                          {item.priceChange == null
                            ? '--'
                            : `${item.priceChange > 0 ? '+' : ''}${fmtNumber(item.priceChange)} pts`}
                        </AppText>
                      </View>
                    </View>

                    <View style={styles.moverFooterRow}>
                      <View style={[styles.tonePill, styles.moverTonePill, { borderColor: pill.borderColor, backgroundColor: pill.backgroundColor }]}>
                        <AppText weight="medium" style={[styles.tonePillText, { color: pill.color }]}>
                          {tone === 'up' ? 'Upswing' : tone === 'down' ? 'Downswing' : 'Flat'}
                        </AppText>
                      </View>
                      <View style={styles.moverMetaChip}>
                        <AppText weight="medium" style={styles.moverMetaChipText}>{REGION_MAP[item.ticker] || 'Other'}</AppText>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View>
                <AppText weight="medium" style={styles.sectionOverline}>REGIONAL PULSE</AppText>
                <AppText weight="semiBold" style={styles.sectionTitle}>Where Momentum Is Building</AppText>
              </View>
            </View>

            <View style={styles.regionList}>
              {grouped.map(([region]) => {
                const stats = regionStats[region];
                const pill = getPillStyle(stats?.tone || 'flat', themeColors);
                const ratio = stats?.total ? Math.round((stats.adv / stats.total) * 100) : 50;

                return (
                  <View key={region} style={styles.regionCard}>
                    <View style={styles.regionTopRow}>
                      <View style={styles.regionTitleRow}>
                        <View style={styles.regionDot} />
                        <AppText style={styles.regionName}>{region}</AppText>
                        <View style={[styles.tonePill, { borderColor: pill.borderColor, backgroundColor: pill.backgroundColor }]}>
                          <AppText style={[styles.tonePillText, { color: pill.color }]}>
                            {stats?.avg == null ? '--' : `${stats.avg.toFixed(2)}%`}
                          </AppText>
                        </View>
                      </View>
                      <AppText style={styles.regionStat}>{`${stats?.adv || 0}/${stats?.total || 0} up`}</AppText>
                    </View>

                    <View style={styles.regionTrack}>
                      <View style={[styles.regionFill, { width: `${Math.max(8, ratio)}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View>
                <AppText weight="medium" style={styles.sectionOverline}>WORLD INDICES</AppText>
                <AppText weight="semiBold" style={styles.sectionTitle}>Regional Breakdown</AppText>
              </View>
            </View>

            {grouped.map(([region, items]) => {
              const stats = regionStats[region];
              const pill = getPillStyle(stats?.tone || 'flat', themeColors);

              return (
                <View key={region} style={styles.regionSectionBlock}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.regionTitleRow}>
                      <View style={styles.regionDot} />
                      <AppText style={styles.regionSectionTitle}>{region}</AppText>
                      <AppText style={styles.sectionCount}>{`${items.length} indices`}</AppText>
                    </View>
                    <View style={[styles.tonePill, { borderColor: pill.borderColor, backgroundColor: pill.backgroundColor }]}>
                      <AppText style={[styles.tonePillText, { color: pill.color }]}>
                        {stats?.avg == null ? '--' : `${stats.avg.toFixed(2)}% avg`}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.grid2}>
                    {items.map((item) => {
                      const pct = pctFromChange(item.price, item.priceChange);
                      const tone = changeTone(item.priceChange);
                      const toneStyle = getToneStyle(tone, themeColors);
                      const localPill = getPillStyle(tone, themeColors);

                      return (
                        <Pressable
                          key={`${region}-${item.ticker}`}
                          style={({ pressed }) => [styles.miniCard, pressed && styles.miniCardPressed]}
                          onPress={() => openIndexDetail(item.ticker)}
                        >
                          <View style={styles.miniTopRow}>
                            <View style={styles.flex1}>
                              <AppText weight="semiBold" style={styles.miniTitle}>{(item.ticker || '').toUpperCase()}</AppText>
                              <AppText weight="medium" style={styles.miniSubtitle}>{item.name}</AppText>
                            </View>
                            <View style={[styles.tonePill, { borderColor: localPill.borderColor, backgroundColor: localPill.backgroundColor }]}>
                              <AppText weight="medium" style={[styles.tonePillText, { color: localPill.color }]}>
                                {tone === 'up' ? 'Up' : tone === 'down' ? 'Down' : 'Flat'}
                              </AppText>
                            </View>
                          </View>

                          <View style={styles.miniValueRow}>
                            <View>
                              <AppText weight="semiBold" style={styles.miniValue}>{fmtInteger(item.price)}</AppText>
                              <AppText weight="medium" style={styles.changePctText}>{pct == null ? '--' : `${pct.toFixed(2)}%`}</AppText>
                            </View>
                            <View style={styles.changeRow}>
                              {tone === 'up' ? (
                                <ArrowUpRight size={14} color={toneStyle.color} />
                              ) : tone === 'down' ? (
                                <ArrowDownRight size={14} color={toneStyle.color} />
                              ) : null}
                              <AppText weight="medium" style={[styles.changeText, { color: toneStyle.color }]}>
                                {item.priceChange == null
                                  ? '--'
                                  : `${item.priceChange > 0 ? '+' : ''}${fmtNumber(item.priceChange)}`}
                              </AppText>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <BottomTabs activeRoute="GlobalIndices" navigation={navigation} />
    </>
  );

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View pointerEvents="none" style={styles.bgAuraTop} />
        <View pointerEvents="none" style={styles.bgAuraBottom} />
        {page}
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors) => {
  const isLight = (colors?.background || '').toLowerCase().startsWith('#f');

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 128,
      gap: 16,
    },
    fullPageLoaderWrap: {
      flex: 1,
    },
    loaderOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: isLight ? 'rgba(244, 247, 251, 0.72)' : 'rgba(11, 11, 12, 0.62)',
    },
    loaderOverlayText: {
      color: colors.textPrimary,
      fontSize: 13,
    },
    bgAuraTop: {
      position: 'absolute',
      top: -70,
      right: -56,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(125, 211, 252, 0.10)',
    },
    bgAuraBottom: {
      position: 'absolute',
      bottom: 44,
      left: -64,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(74, 222, 128, 0.07)',
    },
    heroCard: {
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255, 255, 255, 0.12)',
      padding: 16,
      gap: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: isLight ? 0.1 : 0.16,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 18,
      elevation: 4,
    },
    heroGlowLine: {
      position: 'absolute',
      top: 0,
      left: 16,
      right: 16,
      height: 3,
      borderBottomLeftRadius: 999,
      borderBottomRightRadius: 999,
      backgroundColor: isLight ? 'rgba(59, 130, 246, 0.26)' : 'rgba(147, 197, 253, 0.32)',
    },
    heroOrbA: {
      position: 'absolute',
      top: -58,
      right: -26,
      width: 132,
      height: 132,
      borderRadius: 999,
      backgroundColor: 'rgba(56, 189, 248, 0.11)',
    },
    heroOrbB: {
      position: 'absolute',
      bottom: -74,
      left: -46,
      width: 132,
      height: 132,
      borderRadius: 999,
      backgroundColor: 'rgba(74, 222, 128, 0.08)',
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    heroCopyWrap: {
      flex: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 11,
      backgroundColor: isLight ? 'rgba(59, 130, 246, 0.06)' : 'rgba(255,255,255,0.06)',
    },
    heroBadgeText: {
      color: colors.textPrimary,
      fontSize: 10.5,
    },
    heroStatusText: {
      color: colors.textMuted,
      fontSize: 11,
    },
    errorBadge: {
      borderColor: 'rgba(240, 140, 140, 0.45)',
      backgroundColor: 'rgba(240, 140, 140, 0.12)',
    },
    errorBadgeText: {
      color: colors.negative,
      fontSize: 10,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      marginTop: 2,
    },
    heroSubtitle: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 4,
      maxWidth: '80%',
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    metaPill: {
      color: colors.textMuted,
      fontSize: 10.5,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 10,
      backgroundColor: isLight ? 'rgba(15, 23, 42, 0.04)' : 'rgba(255,255,255,0.05)',
    },
    pulsePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(59, 130, 246, 0.12)' : 'rgba(147, 197, 253, 0.16)',
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 10,
      backgroundColor: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(155, 213, 255, 0.10)',
    },
    pulsePillText: {
      color: colors.textPrimary,
      fontSize: 11,
    },
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.05)',
    },
    refreshButtonText: {
      color: colors.textPrimary,
      fontSize: 12,
    },
    heroMetricsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    heroMetricCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255,255,255,0.1)',
      padding: 12,
      backgroundColor: isLight ? '#F8FBFF' : 'rgba(255,255,255,0.05)',
      gap: 8,
    },
    heroMetricLabel: {
      color: colors.textMuted,
      fontSize: 11,
    },
    heroMetricValue: {
      color: colors.textPrimary,
      fontSize: 20,
    },
    inlineAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(240, 140, 140, 0.35)',
      backgroundColor: 'rgba(240, 140, 140, 0.10)',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
    },
    errorText: {
      color: colors.negative,
      fontSize: 12,
      flex: 1,
    },
    sectionCard: {
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255, 255, 255, 0.12)',
      padding: 16,
      gap: 12,
      marginTop: 6,
      shadowColor: '#000',
      shadowOpacity: isLight ? 0.08 : 0.12,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 14,
      elevation: 3,
    },
    sectionOverline: {
      color: colors.textMuted,
      fontSize: 10.5,
      letterSpacing: 1.8,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 19,
      marginTop: 3,
    },
    sectionCount: {
      color: colors.textMuted,
      fontSize: 11,
    },
    scoreBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 6,
      paddingHorizontal: 9,
      backgroundColor: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255,255,255,0.06)',
    },
    scoreText: {
      color: colors.textPrimary,
      fontSize: 13,
    },
    breadthHeroCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255,255,255,0.10)',
      backgroundColor: isLight ? '#F8FBFF' : 'rgba(255,255,255,0.05)',
      padding: 12,
      gap: 6,
    },
    breadthHeroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    breadthHeroLabel: {
      color: colors.textMuted,
      fontSize: 11,
    },
    breadthHeroValue: {
      color: colors.textPrimary,
      fontSize: 20,
    },
    breadthHeroMeta: {
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
    },
    breadthScoreRing: {
      width: 74,
      minHeight: 74,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255,255,255,0.10)',
      backgroundColor: isLight ? '#F8FBFF' : 'rgba(255,255,255,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      gap: 4,
    },
    breadthScoreValue: {
      color: colors.textPrimary,
      fontSize: 20,
    },
    breadthScoreLabel: {
      color: colors.textMuted,
      fontSize: 10,
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255,255,255,0.09)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: '#5CD6A3',
    },
    breadthList: {
      gap: 8,
    },
    breadthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255,255,255,0.08)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    breadthRowLeft: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      flex: 1,
    },
    breadthIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    breadthIconWrapUp: {
      backgroundColor: 'rgba(73, 209, 141, 0.10)',
      borderColor: 'rgba(73, 209, 141, 0.24)',
    },
    breadthIconWrapDown: {
      backgroundColor: 'rgba(240, 140, 140, 0.10)',
      borderColor: 'rgba(240, 140, 140, 0.24)',
    },
    breadthIconWrapNeutral: {
      backgroundColor: isLight ? '#F8FBFF' : 'rgba(255,255,255,0.05)',
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255,255,255,0.08)',
    },
    breadthRowLabel: {
      color: colors.textMuted,
      fontSize: 11,
    },
    breadthValuePill: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255,255,255,0.08)',
      backgroundColor: isLight ? '#F8FBFF' : 'rgba(255,255,255,0.04)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      minWidth: 64,
      alignItems: 'center',
    },
    breadthValuePillUp: {
      borderColor: 'rgba(73, 209, 141, 0.22)',
      backgroundColor: 'rgba(73, 209, 141, 0.08)',
    },
    breadthValuePillDown: {
      borderColor: 'rgba(240, 140, 140, 0.22)',
      backgroundColor: 'rgba(240, 140, 140, 0.08)',
    },
    breadthValueText: {
      color: colors.textPrimary,
      fontSize: 15,
    },
    moversGrid: {
      gap: 10,
    },
    moverCard: {
      width: '100%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255,255,255,0.10)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.05)',
      padding: 12,
      gap: 9,
      minHeight: 108,
      shadowColor: '#000',
      shadowOpacity: isLight ? 0.07 : 0.12,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
      elevation: 2,
      overflow: 'hidden',
    },
    moverCardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.995 }],
    },
    moverGlow: {
      position: 'absolute',
      top: -20,
      right: -14,
      width: 64,
      height: 64,
      borderRadius: 999,
      backgroundColor: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(155, 213, 255, 0.06)',
    },
    moverHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    moverIdentityWrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      flex: 1,
    },
    moverDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginTop: 4,
    },
    moverDotUp: {
      backgroundColor: colors.positive,
    },
    moverDotDown: {
      backgroundColor: colors.negative,
    },
    moverDotFlat: {
      backgroundColor: colors.accent,
    },
    moverCardUp: {
      borderColor: isLight ? 'rgba(25, 158, 99, 0.20)' : 'rgba(73, 209, 141, 0.24)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)',
    },
    moverCardDown: {
      borderColor: isLight ? 'rgba(207, 63, 88, 0.20)' : 'rgba(240, 140, 140, 0.24)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)',
    },
    moverCardFlat: {
      borderColor: isLight ? 'rgba(110, 89, 207, 0.24)' : colors.border,
      backgroundColor: isLight ? '#FFFFFF' : colors.surfaceAlt,
    },
    moverTitleWrap: {
      flex: 1,
    },
    moverTicker: {
      color: colors.textPrimary,
      fontSize: 17,
      letterSpacing: 0.4,
    },
    moverRegion: {
      color: isLight ? '#445161' : colors.textMuted,
      fontSize: 11,
      marginTop: 1,
    },
    moverValue: {
      color: colors.textPrimary,
      fontSize: 19,
    },
    moverValueLabel: {
      color: isLight ? '#6B7788' : colors.textMuted,
      fontSize: 9.5,
      marginTop: 1,
    },
    moverMiddleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 8,
    },
    moverPriceBlock: {
      flex: 1,
      justifyContent: 'center',
    },
    moverDeltaBlock: {
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      minWidth: 92,
      backgroundColor: isLight ? '#F7FAFF' : 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 7,
    },
    moverChangeMain: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 3,
    },
    moverChangeValue: {
      fontSize: 14,
    },
    moverPctText: {
      color: isLight ? '#5B6676' : colors.textMuted,
      fontSize: 10,
      marginTop: 2,
    },
    moverFooterRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    moverTonePill: {
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    moverMetaChip: {
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.08)' : 'rgba(255,255,255,0.10)',
      backgroundColor: isLight ? '#FAFBFD' : 'rgba(255,255,255,0.04)',
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    moverMetaChipText: {
      color: colors.textMuted,
      fontSize: 9.5,
    },
    regionList: {
      gap: 10,
    },
    regionCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.10)' : 'rgba(255,255,255,0.1)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.05)',
      padding: 13,
      gap: 10,
    },
    regionTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    regionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      flex: 1,
    },
    regionDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    regionName: {
      color: colors.textPrimary,
      fontSize: 14,
    },
    regionStat: {
      color: colors.textMuted,
      fontSize: 11,
    },
    regionTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: isLight ? 'rgba(13, 27, 42, 0.09)' : 'rgba(255,255,255,0.09)',
      overflow: 'hidden',
    },
    regionFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    regionSectionBlock: {
      gap: 10,
      marginTop: 4,
    },
    regionSectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
    },
    grid2: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    miniCard: {
      width: '48%',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.10)' : 'rgba(155,213,255,0.16)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(255,255,255,0.05)',
      padding: 13,
      gap: 8,
      shadowColor: '#000',
      shadowOpacity: isLight ? 0.04 : 0.08,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 1,
    },
    miniCardPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.995 }],
    },
    miniTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    flex1: {
      flex: 1,
    },
    miniTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      letterSpacing: 0.3,
    },
    miniSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 2,
    },
    tonePill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 9,
    },
    tonePillText: {
      fontSize: 10.5,
    },
    miniValueRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 8,
    },
    miniValue: {
      color: colors.textPrimary,
      fontSize: 18,
    },
    changeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
    },
    changeText: {
      fontSize: 10.5,
    },
    changePctText: {
      color: colors.textMuted,
      fontSize: 9.5,
    },
    skeletonRowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    skeletonLine: {
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonBadge: {
      width: 72,
      height: 30,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: colors.surfaceAlt,
    },
    skeletonBadgeLine: {
      width: 110,
      height: 10,
    },
    skeletonHeroTitle: {
      width: 180,
      height: 20,
      marginTop: 10,
    },
    skeletonHeroSub: {
      width: '92%',
      height: 12,
      marginTop: 8,
    },
    skeletonMiniLabel: {
      width: 56,
      height: 10,
    },
    skeletonMiniValue: {
      width: 42,
      height: 14,
    },
    skeletonSectionTitle: {
      width: 132,
      height: 14,
    },
    skeletonSectionMeta: {
      width: 68,
      height: 12,
    },
    skeletonMoverCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#F8FAFF' : 'rgba(255,255,255,0.04)',
      borderRadius: 16,
      padding: 12,
      gap: 10,
    },
    skeletonMoverLeft: {
      flex: 1,
    },
    skeletonMoverRight: {
      alignItems: 'flex-end',
      minWidth: 80,
    },
    skeletonTicker: {
      width: 72,
      height: 12,
    },
    skeletonSubline: {
      width: 118,
      height: 10,
      marginTop: 7,
    },
    skeletonSublineSmall: {
      width: 56,
      height: 10,
      marginTop: 7,
    },
    skeletonPrice: {
      width: 58,
      height: 12,
    },
  });
};

export default GlobalIndices;
