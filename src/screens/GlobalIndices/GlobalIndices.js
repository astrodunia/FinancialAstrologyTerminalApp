import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
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
  UserCircle,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
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
  CASE30: 'Africa',
};

const GLOBAL_INDICES_URL = `${API_BASE_URL}/api/tagx/global-indices`;

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
    .filter((item) => item.ticker !== 'N/A');
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

const GlobalIndices = ({ navigation }) => {
  const { themeColors } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [data, setData] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadIndices = async () => {
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
      setData(next);
      setUpdatedAt(payload?.updatedAt || new Date().toISOString());
    } catch (err) {
      setError(err?.message || 'Failed to load global indices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndices();
  }, []);

  const derived = useMemo(() => {
    const valid = data.filter((item) => item.priceChange != null);
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
  }, [data]);

  const grouped = useMemo(() => {
    const groups = {};

    data.forEach((item) => {
      const region = REGION_MAP[item.ticker] || 'Other';
      if (!groups[region]) groups[region] = [];
      groups[region].push(item);
    });

    const order = ['Americas', 'Europe', 'Asia-Pacific', 'Africa', 'Other'];
    return order.filter((region) => groups[region]?.length).map((region) => [region, groups[region]]);
  }, [data]);

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

  return (
    <View style={styles.safeArea}>
      <GradientBackground>
        <View pointerEvents="none" style={styles.bgAuraTop} />
        <View pointerEvents="none" style={styles.bgAuraBottom} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              <Globe size={16} color={themeColors.textPrimary} />
            </View>
            <View style={styles.headerTextWrap}>
              <AppText style={styles.title}>Global Market Outlook</AppText>
              <AppText style={styles.headerSubtitle}>Live breadth, momentum, and regional rotation</AppText>
            </View>
          </View>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
            <UserCircle size={18} color={themeColors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroGrid}>
            <View style={styles.heroCard}>
            <View style={styles.badgeRow}>
              <View style={styles.heroBadge}>
                <Globe size={14} color={themeColors.accent} />
                <AppText style={styles.heroBadgeText}>GLOBAL MARKETS</AppText>
              </View>
              <View style={styles.heroBadge}>
                <Sparkles size={14} color={themeColors.accent} />
                <AppText style={styles.heroBadgeText}>{livePulseLabel}</AppText>
              </View>
              {!!error && (
                <View style={[styles.heroBadge, styles.errorBadge]}>
                  <AlertTriangle size={14} color={themeColors.negative} />
                    <AppText style={styles.errorBadgeText}>Data issue</AppText>
                  </View>
                )}
              </View>

              <AppText style={styles.heroTitle}>Global Market Outlook</AppText>
              <AppText style={styles.heroSubtitle}>
                Live snapshot of global benchmarks with breadth, momentum, and regional rotation signal.
              </AppText>

              <View style={styles.metaRow}>
                <AppText style={styles.metaPill}>Updated {fmtUpdatedAt(updatedAt)}</AppText>
                <AppText style={styles.metaPill}>{data.length} indices tracked</AppText>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.pulsePill}>
                  <Sparkles size={14} color={themeColors.accent} />
                  <AppText style={styles.pulsePillText}>Pulse: {derived.regime}</AppText>
                </View>

                <Pressable style={styles.refreshPill} onPress={loadIndices}>
                  <RefreshCcw size={14} color={themeColors.textPrimary} />
                  <AppText style={styles.refreshPillText}>Refresh</AppText>
                </Pressable>
              </View>
            </View>

            <View style={styles.riskCard}>
              <View style={styles.riskHeader}>
                <View>
                  <AppText style={styles.sectionOverline}>RISK PULSE</AppText>
                  <AppText style={styles.riskTitle}>{derived.regime}</AppText>
                  <AppText style={styles.riskCaption}>Composite from breadth + avg move</AppText>
                </View>
                <View style={styles.scoreBox}>
                  <Shield size={14} color={themeColors.textMuted} />
                  <AppText style={styles.scoreText}>{loading ? '--' : derived.score}</AppText>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${loading ? 35 : derived.score}%` }]} />
              </View>

              <View style={styles.statGrid}>
                <View style={[styles.statCard, styles.statCardUp]}>
                  <View style={styles.statRowTop}>
                    <AppText style={styles.statLabel}>Advancers</AppText>
                    <TrendingUp size={14} color={themeColors.positive} />
                  </View>
                  <AppText style={styles.statValue}>{loading ? '--' : derived.advancers.length}</AppText>
                </View>

                <View style={[styles.statCard, styles.statCardDown]}>
                  <View style={styles.statRowTop}>
                    <AppText style={styles.statLabel}>Decliners</AppText>
                    <TrendingDown size={14} color={themeColors.negative} />
                  </View>
                  <AppText style={styles.statValue}>{loading ? '--' : derived.decliners.length}</AppText>
                </View>

                <View style={[styles.statCard, styles.statCardNeutral]}>
                  <View style={styles.statRowTop}>
                    <AppText style={styles.statLabel}>Avg Move</AppText>
                    <Sparkles size={14} color={themeColors.accent} />
                  </View>
                  <AppText style={styles.statValue}>
                    {loading || derived.avgPct == null ? '--' : `${derived.avgPct.toFixed(2)}%`}
                  </AppText>
                </View>

                <View style={[styles.statCard, styles.statCardNeutral]}>
                  <View style={styles.statRowTop}>
                    <AppText style={styles.statLabel}>Coverage</AppText>
                    <Globe size={14} color={themeColors.textMuted} />
                  </View>
                  <AppText style={styles.statValue}>{loading ? '--' : data.filter((item) => item.price != null).length}</AppText>
                </View>
              </View>
            </View>
          </View>

          {!!error && <AppText style={styles.errorText}>{error}</AppText>}

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={themeColors.textPrimary} />
              <AppText style={styles.loadingText}>Syncing global indices...</AppText>
            </View>
          )}

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View>
                <AppText style={styles.sectionOverline}>MOVERS RADAR</AppText>
                <AppText style={styles.sectionTitle}>Largest Swings</AppText>
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
                  <View key={item.ticker} style={[styles.moverCard, moverToneStyle]}>
                    <View style={[styles.moverAccent, tone === 'up' ? styles.moverAccentUp : tone === 'down' ? styles.moverAccentDown : styles.moverAccentFlat]} />
                    <View style={styles.moverTopRow}>
                      <View style={styles.moverTitleWrap}>
                        <AppText numberOfLines={1} style={styles.moverTicker}>{(item.ticker || '').toUpperCase()}</AppText>
                        <AppText numberOfLines={1} style={styles.moverRegion}>{item.name}</AppText>
                        <AppText numberOfLines={1} style={styles.moverSubRegion}>{REGION_MAP[item.ticker] || 'Other'}</AppText>
                      </View>
                      <View style={[styles.tonePill, { borderColor: pill.borderColor, backgroundColor: pill.backgroundColor }]}>
                        <AppText style={[styles.tonePillText, { color: pill.color }]}>
                          {tone === 'up' ? 'Upswing' : tone === 'down' ? 'Downswing' : 'Flat'}
                        </AppText>
                      </View>
                    </View>

                    <View style={styles.moverBottomRow}>
                      <View>
                        <AppText style={styles.moverValue}>{fmtNumber(item.price)}</AppText>
                        <AppText style={styles.moverValueLabel}>Last traded</AppText>
                      </View>

                      <View style={styles.moverChangeBox}>
                        <View style={styles.moverChangeMain}>
                          {tone === 'up' ? (
                            <ArrowUpRight size={16} color={toneStyle.color} />
                          ) : tone === 'down' ? (
                            <ArrowDownRight size={16} color={toneStyle.color} />
                          ) : null}
                          <AppText style={[styles.moverChangeValue, { color: toneStyle.color }]}>
                            {item.priceChange == null
                              ? '--'
                              : `${item.priceChange > 0 ? '+' : ''}${fmtNumber(item.priceChange)}`}
                          </AppText>
                        </View>
                        <AppText numberOfLines={1} style={styles.moverPctText}>
                          {pct == null ? '' : `(${pct.toFixed(2)}%)`}
                        </AppText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View>
                <AppText style={styles.sectionOverline}>REGIONAL PULSE</AppText>
                <AppText style={styles.sectionTitle}>Where Momentum Is Building</AppText>
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
                      <AppText style={styles.regionStat}>{stats?.adv || 0}/{stats?.total || 0} up</AppText>
                    </View>

                    <View style={styles.regionTrack}>
                      <View style={[styles.regionFill, { width: `${Math.max(8, ratio)}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <View>
              <AppText style={styles.sectionOverline}>WORLD INDICES</AppText>
              <AppText style={styles.sectionTitle}>Regional Breakdown</AppText>
            </View>
          </View>

          {grouped.map(([region, items]) => {
            const stats = regionStats[region];
            const pill = getPillStyle(stats?.tone || 'flat', themeColors);

            return (
              <View key={region} style={styles.sectionCard}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.regionTitleRow}>
                    <View style={styles.regionDot} />
                    <AppText style={styles.sectionTitle}>{region}</AppText>
                    <AppText style={styles.sectionCount}>{items.length} indices</AppText>
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
                      <View key={`${region}-${item.ticker}`} style={styles.miniCard}>
                        <View style={styles.miniTopRow}>
                          <View style={styles.flex1}>
                            <AppText style={styles.miniTitle}>{(item.ticker || '').toUpperCase()}</AppText>
                            <AppText style={styles.miniSubtitle}>Index</AppText>
                          </View>
                          <View style={[styles.tonePill, { borderColor: localPill.borderColor, backgroundColor: localPill.backgroundColor }]}>
                            <AppText style={[styles.tonePillText, { color: localPill.color }]}>
                              {tone === 'up' ? 'Up' : tone === 'down' ? 'Down' : 'Flat'}
                            </AppText>
                          </View>
                        </View>

                        <View style={styles.miniValueRow}>
                          <View>
                            <AppText style={styles.miniValue}>{fmtInteger(item.price)}</AppText>
                            <AppText style={styles.changePctText}>{pct == null ? '--' : `${pct.toFixed(2)}%`}</AppText>
                          </View>
                          <View style={styles.changeRow}>
                            {tone === 'up' ? (
                              <ArrowUpRight size={14} color={toneStyle.color} />
                            ) : tone === 'down' ? (
                              <ArrowDownRight size={14} color={toneStyle.color} />
                            ) : null}
                            <AppText style={[styles.changeText, { color: toneStyle.color }]}>
                              {item.priceChange == null
                                ? '--'
                                : `${item.priceChange > 0 ? '+' : ''}${fmtNumber(item.priceChange)}`}
                            </AppText>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <BottomTabs activeRoute="GlobalIndices" navigation={navigation} />
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
    header: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 54,
      paddingBottom: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 4,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    headerTextWrap: {
      flex: 1,
    },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
    title: {
      color: colors.textPrimary,
      fontSize: 19,
      flexShrink: 1,
    },
    headerSubtitle: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 128,
      gap: 16,
    },
  bgAuraTop: {
    position: 'absolute',
    top: -80,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(155, 213, 255, 0.10)',
  },
  bgAuraBottom: {
    position: 'absolute',
    bottom: 30,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(201, 168, 255, 0.10)',
  },
  heroGrid: {
    gap: 12,
  },
    heroCard: {
      backgroundColor: isLight ? '#FFFFFF' : colors.surfaceGlass,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(110, 89, 207, 0.18)' : 'rgba(155, 213, 255, 0.25)',
      padding: 16,
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: isLight ? 0.06 : 0,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: isLight ? 1 : 0,
    },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
    heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
      backgroundColor: isLight ? 'rgba(110, 89, 207, 0.06)' : 'rgba(255,255,255,0.04)',
    },
  heroBadgeText: {
    color: colors.textMuted,
    fontSize: 10,
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
    },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 12.5,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
    metaPill: {
      color: colors.textMuted,
      fontSize: 11,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: isLight ? 'rgba(13, 27, 42, 0.04)' : 'rgba(255,255,255,0.04)',
    },
    pulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
      backgroundColor: isLight ? 'rgba(110, 89, 207, 0.14)' : 'rgba(155, 213, 255, 0.16)',
    },
  pulsePillText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
    refreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
      backgroundColor: isLight ? 'rgba(13, 27, 42, 0.06)' : 'rgba(255,255,255,0.08)',
    },
  refreshPillText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
    riskCard: {
      backgroundColor: isLight ? '#FFFFFF' : colors.surfaceGlass,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.12)' : 'rgba(201, 168, 255, 0.22)',
      padding: 16,
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: isLight ? 0.05 : 0,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: isLight ? 1 : 0,
    },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionOverline: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  riskTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    marginTop: 4,
  },
  riskCaption: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
    scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
      backgroundColor: isLight ? 'rgba(13, 27, 42, 0.04)' : 'rgba(255,255,255,0.04)',
    },
  scoreText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
    progressTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: isLight ? 'rgba(13, 27, 42, 0.10)' : 'rgba(255,255,255,0.10)',
      overflow: 'hidden',
    },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#90F2B2',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  statCardUp: {
    borderColor: 'rgba(73, 209, 141, 0.30)',
    backgroundColor: 'rgba(73, 209, 141, 0.10)',
  },
  statCardDown: {
    borderColor: 'rgba(240, 140, 140, 0.30)',
    backgroundColor: 'rgba(240, 140, 140, 0.10)',
  },
    statCardNeutral: {
      borderColor: colors.border,
      backgroundColor: isLight ? 'rgba(13, 27, 42, 0.04)' : 'rgba(255,255,255,0.04)',
    },
  statRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 20,
  },
  errorText: {
    color: colors.negative,
    fontSize: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
  },
    sectionCard: {
      backgroundColor: isLight ? '#FFFFFF' : colors.surfaceGlass,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.12)' : 'rgba(255, 255, 255, 0.14)',
      padding: 14,
      gap: 12,
      shadowColor: '#000',
      shadowOpacity: isLight ? 0.05 : 0,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: isLight ? 1 : 0,
    },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      marginTop: 2,
    },
  sectionCount: {
    color: colors.textMuted,
    fontSize: 11,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moversGrid: {
    gap: 10,
  },
    miniCard: {
      width: '48%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.12)' : 'rgba(155,213,255,0.18)',
      backgroundColor: isLight ? '#F8FAFF' : 'rgba(255,255,255,0.06)',
      padding: 12,
      gap: 10,
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
    letterSpacing: 0.6,
  },
  miniSubtitle: {
    color: colors.textMuted,
    fontSize: 10.5,
    marginTop: 3,
  },
  tonePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
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
    moverCard: {
      width: '100%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isLight ? 'rgba(13, 27, 42, 0.14)' : colors.border,
      backgroundColor: isLight ? '#FFFFFF' : colors.surfaceAlt,
      padding: 14,
      gap: 12,
      minHeight: 152,
      shadowColor: '#000',
      shadowOpacity: isLight ? 0.08 : 0.14,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: isLight ? 8 : 10,
      elevation: isLight ? 1 : 2,
    },
    moverAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
    },
    moverAccentUp: {
      backgroundColor: colors.positive,
    },
    moverAccentDown: {
      backgroundColor: colors.negative,
    },
    moverAccentFlat: {
      backgroundColor: colors.accent,
    },
    moverCardUp: {
      borderColor: isLight ? 'rgba(25, 158, 99, 0.26)' : 'rgba(73, 209, 141, 0.35)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(73, 209, 141, 0.08)',
    },
    moverCardDown: {
      borderColor: isLight ? 'rgba(207, 63, 88, 0.26)' : 'rgba(240, 140, 140, 0.35)',
      backgroundColor: isLight ? '#FFFFFF' : 'rgba(240, 140, 140, 0.08)',
    },
    moverCardFlat: {
      borderColor: isLight ? 'rgba(110, 89, 207, 0.24)' : colors.border,
      backgroundColor: isLight ? '#FFFFFF' : colors.surfaceAlt,
    },
  moverTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  moverTitleWrap: {
    flex: 1,
  },
    moverTicker: {
      color: colors.textPrimary,
      fontSize: 19,
      letterSpacing: 0.7,
    },
    moverRegion: {
      color: isLight ? '#445161' : colors.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
  moverSubRegion: {
    color: isLight ? '#6B7788' : colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
    moverValue: {
      color: colors.textPrimary,
      fontSize: 28,
    },
  moverValueLabel: {
    color: isLight ? '#6B7788' : colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
    moverBottomRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 2,
    },
  moverChangeBox: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minWidth: 116,
  },
  moverChangeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
    moverChangeValue: {
      fontSize: 14,
    },
  moverPctText: {
    color: isLight ? '#5B6676' : colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  miniValue: {
    color: colors.textPrimary,
    fontSize: 19,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  changeText: {
    fontSize: 11,
  },
  changePctText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  regionList: {
    gap: 10,
  },
    regionCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isLight ? '#F8FAFF' : 'rgba(255,255,255,0.04)',
      padding: 12,
      gap: 8,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  regionName: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  regionStat: {
    color: colors.textMuted,
    fontSize: 11,
  },
    regionTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: isLight ? 'rgba(13, 27, 42, 0.12)' : 'rgba(255,255,255,0.10)',
      overflow: 'hidden',
    },
  regionFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  });
};

export default GlobalIndices;
