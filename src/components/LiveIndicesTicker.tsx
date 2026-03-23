import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Info, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import AppText from './AppText';
import CardLoadingOverlay from './CardLoadingOverlay';
import { API_BASE_URL, useUser } from '../store/UserContext';
import { getMarketDataCache, getUsMarketSession, setMarketDataCache, shouldRefreshMarketData } from '../utils/marketDataCache';

const LIVE_INDICES_API_BASE = 'https://finance.rajeevprakash.com';
const LIVE_INDICES_CACHE_KEY = 'liveIndices';
const LIVE_INDICES_TTL_MS = 30 * 1000;

const INDEX_LIST = [
  { id: 'GSPC', name: 'S&P 500' },
  { id: 'IXIC', name: 'NASDAQ' },
  { id: 'DJI', name: 'Dow Jones' },
  { id: 'RUT', name: 'Russell 2000' },
];

const INDEX_HELP = {
  GSPC: {
    title: 'S&P 500',
    short: 'Tracks 500 large U.S. companies and is a key benchmark for U.S. equities.',
    what:
      'The S&P 500 is a market-cap weighted index covering 500 leading publicly traded U.S. companies across sectors.',
    why:
      'It is widely used as a broad proxy for U.S. stock market performance and risk sentiment.',
    how:
      'Use it to gauge broad-market direction. Rising S&P 500 often signals risk-on; falling can signal risk-off.',
    note:
      'Breadth matters. A healthy rally has participation across sectors, not only a few mega-caps.',
  },
  IXIC: {
    title: 'NASDAQ Composite',
    short: 'A tech-heavy index that reflects growth and innovation exposure in U.S. markets.',
    what:
      'NASDAQ Composite includes thousands of stocks listed on NASDAQ, with higher weight to tech and growth names.',
    why:
      'It tends to be more sensitive to rates and liquidity because growth stocks rely on future earnings.',
    how:
      'Compare NASDAQ vs S&P 500 to judge growth leadership. Outperformance can imply stronger appetite for risk.',
    note:
      'When yields spike, NASDAQ can underperform even if the broader market stays stable.',
  },
  DJI: {
    title: 'Dow Jones Industrial Average',
    short: 'A price-weighted index of 30 large, established U.S. blue-chip companies.',
    what:
      'The Dow is composed of 30 major U.S. companies and is price-weighted (higher-priced stocks move it more).',
    why:
      'It is often used as a sentiment gauge for blue-chip stability and traditional industry leadership.',
    how:
      'If Dow holds up while NASDAQ drops, markets may be rotating from growth to defensive leadership.',
    note: 'Because it is price-weighted and only 30 stocks, it is less broad than the S&P 500.',
  },
  RUT: {
    title: 'Russell 2000',
    short: 'Tracks ~2,000 U.S. small-caps and reflects domestic growth and risk appetite.',
    what:
      'Russell 2000 includes small-cap companies and is often viewed as a proxy for U.S. domestic economic strength.',
    why: 'Small caps are sensitive to credit conditions, funding costs, and economic surprises.',
    how:
      'Watch it for early signals of risk appetite. Strength can imply improving liquidity and confidence.',
    note: 'In tighter liquidity cycles, small caps can lag due to higher financing stress.',
  },
};

const createPalette = (themeColors: any, theme: string) => ({
  cardBg: themeColors.surfaceGlass,
  border: themeColors.border,
  textPrimary: themeColors.textPrimary,
  textMuted: themeColors.textMuted,
  surface: themeColors.surface,
  surfaceAlt: themeColors.surfaceAlt,
  positive: themeColors.positive,
  negative: themeColors.negative,
  neutral: theme === 'dark' ? '#F5C36A' : '#B7791F',
  modalBackdrop: theme === 'dark' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(9, 20, 32, 0.34)',
  modalSurface: themeColors.surface,
  badgeBullishBorder: theme === 'dark' ? 'rgba(73, 209, 141, 0.45)' : 'rgba(25, 158, 99, 0.55)',
  badgeBullishBg: theme === 'dark' ? 'rgba(73, 209, 141, 0.14)' : 'rgba(25, 158, 99, 0.14)',
  badgeBearishBorder: theme === 'dark' ? 'rgba(240, 140, 140, 0.45)' : 'rgba(207, 63, 88, 0.55)',
  badgeBearishBg: theme === 'dark' ? 'rgba(240, 140, 140, 0.14)' : 'rgba(207, 63, 88, 0.14)',
  badgeNeutralBorder: theme === 'dark' ? 'rgba(245, 195, 106, 0.45)' : 'rgba(183, 121, 31, 0.48)',
  badgeNeutralBg: theme === 'dark' ? 'rgba(245, 195, 106, 0.14)' : 'rgba(183, 121, 31, 0.14)',
  symbolBg: themeColors.surfaceAlt,
  symbolBorder: themeColors.border,
  shadowOpacity: theme === 'dark' ? 0.2 : 0.1,
});

const nf0 = new Intl.NumberFormat(undefined);
const nf2 = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const isAbortError = (e: any) => {
  const name = e?.name?.toString().toLowerCase() || '';
  const message = e?.message?.toString().toLowerCase() || '';
  return name.includes('abort') || message.includes('abort');
};

const classify = (pct?: number | null): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
  if (pct == null || !Number.isFinite(pct)) return 'NEUTRAL';
  if (Math.abs(pct) < 0.15) return 'NEUTRAL';
  return pct > 0 ? 'BULLISH' : 'BEARISH';
};

type ViewRow = {
  symbol: string;
  name: string;
  close: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
};

type Props = {
  onPressIndex?: (symbol: string) => void;
};

function SkeletonCard({ styles, colors }: { styles: any; colors: any }) {
  return (
    <View style={[styles.card, styles.skeletonCard]}>
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTop}>
          <View style={styles.skeletonSymbol} />
          <View style={styles.skeletonMood} />
        </View>
        <View style={styles.skeletonPrice} />
        <View style={styles.skeletonDelta} />
        <View style={styles.skeletonFooter} />
      </View>
      <CardLoadingOverlay color={colors.textMuted} />
    </View>
  );
}

function InfoModal({
  symbol,
  visible,
  onClose,
  styles,
  colors,
}: {
  symbol: string;
  visible: boolean;
  onClose: () => void;
  styles: any;
  colors: any;
}) {
  const help = (INDEX_HELP as any)[symbol];
  if (!help) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <AppText style={styles.modalTitle}>{help.title}</AppText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          </View>
          <AppText style={styles.modalIntro}>A practical explanation to help you understand this market index.</AppText>

          <AppText style={styles.modalLabel}>What it is</AppText>
          <AppText style={styles.modalText}>{help.what}</AppText>

          <AppText style={styles.modalLabel}>Why it matters</AppText>
          <AppText style={styles.modalText}>{help.why}</AppText>

          <AppText style={styles.modalLabel}>How to use it</AppText>
          <AppText style={styles.modalText}>{help.how}</AppText>

          {!!help.note && (
            <View style={styles.noteBox}>
              <AppText style={styles.noteTitle}>Note</AppText>
              <AppText style={styles.noteText}>{help.note}</AppText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function LiveIndicesTicker({ onPressIndex }: Props) {
  const { theme, themeColors } = useUser();
  const colors = useMemo(() => createPalette(themeColors, theme), [theme, themeColors]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const cachedRows = (getMarketDataCache(LIVE_INDICES_CACHE_KEY)?.data as ViewRow[] | null) || [];
  const [rows, setRows] = useState<ViewRow[]>(cachedRows);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>(cachedRows.length ? 'ok' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [helpSymbol, setHelpSymbol] = useState<string | null>(null);
  const [marketActive, setMarketActive] = useState(() => getUsMarketSession().isActive);

  const abortRef = useRef<AbortController | null>(null);
  const reqSeq = useRef(0);

  const load = useCallback(async () => {
    const cached = (getMarketDataCache(LIVE_INDICES_CACHE_KEY)?.data as ViewRow[] | null) || [];
    const shouldRefresh = shouldRefreshMarketData(LIVE_INDICES_CACHE_KEY, LIVE_INDICES_TTL_MS);

    if (!shouldRefresh && cached.length) {
      setRows(cached);
      setStatus('ok');
      setError(null);
      return;
    }

    const mySeq = ++reqSeq.current;
    setStatus('loading');
    setError(null);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const symbols = INDEX_LIST.map((item) => item.id).join(',');
    const baseUrl = LIVE_INDICES_API_BASE || API_BASE_URL;
    const url = `${baseUrl}/api/market/indices?symbols=${symbols}`;

    try {
      const res = await fetch(url, {
        signal: ac.signal,
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const payload = Array.isArray(json?.data) ? json.data : [];
      if (mySeq !== reqSeq.current) return;

      const mapped: ViewRow[] = INDEX_LIST.map((meta) => {
        const item = payload.find((d: any) => (d?.symbol || '').toUpperCase() === meta.id);
        const prev = item?.regularMarketPreviousClose ?? item?.previousClose ?? null;

        return {
          symbol: meta.id,
          name: meta.name,
          close: item?.price ?? null,
          change: item?.change ?? null,
          changePercent: item?.changePercent ?? null,
          previousClose: prev,
        };
      });

      setMarketDataCache(LIVE_INDICES_CACHE_KEY, mapped, getUsMarketSession().session);
      setRows(mapped);
      setStatus('ok');
    } catch (e: any) {
      if (isAbortError(e)) return;
      if (mySeq !== reqSeq.current) return;
      if (cached.length) {
        setRows(cached);
        setStatus('ok');
        setError(null);
        return;
      }
      setStatus('error');
      setError(e?.message || 'Failed to load indices');
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();

    const marketClockId = setInterval(() => {
      setMarketActive(getUsMarketSession().isActive);
    }, 60000);

    return () => {
      clearInterval(marketClockId);
      abortRef.current?.abort();
    };
  }, [load]);

  useEffect(() => {
    if (!marketActive) return undefined;

    load();

    const pollId = setInterval(() => {
      load();
    }, 30000);

    return () => clearInterval(pollId);
  }, [load, marketActive]);

  const cards = useMemo(
    () =>
      rows.length
        ? rows
        : INDEX_LIST.map((item) => ({
            symbol: item.id,
            name: item.name,
            close: null,
            change: null,
            changePercent: null,
            previousClose: null,
          })),
    [rows],
  );

  const openIndex = (symbol: string) => {
    if (onPressIndex) {
      onPressIndex(symbol);
      return;
    }

    navigation.navigate('Overview', { indexSymbol: symbol });
  };

  return (
    <View style={styles.wrapper}>
      {status === 'error' && <AppText style={styles.errorText}>{error}</AppText>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowTrack}
      >
        {status === 'loading' && !rows.length && INDEX_LIST.map((item) => <SkeletonCard key={item.id} styles={styles} colors={colors} />)}

        {(status === 'ok' || rows.length) && cards.map((row) => {
          const mood = classify(row.changePercent);
          const isUp = (row.change ?? 0) >= 0;
          return (
            <Pressable
              key={row.symbol}
              style={styles.card}
              onPress={() => openIndex(row.symbol)}
            >
              <View style={styles.headerRow}>
                <View style={styles.symbolPill}>
                  <AppText style={styles.symbolText}>{row.symbol}</AppText>
                </View>
                <View
                  style={[
                    styles.badge,
                    mood === 'BULLISH' && styles.badgeBullish,
                    mood === 'BEARISH' && styles.badgeBearish,
                    mood === 'NEUTRAL' && styles.badgeNeutral,
                  ]}
                >
                  <AppText
                    style={[
                      styles.badgeText,
                      mood === 'BULLISH' && styles.bullText,
                      mood === 'BEARISH' && styles.bearText,
                      mood === 'NEUTRAL' && styles.neutralText,
                    ]}
                  >
                    {mood}
                  </AppText>
                </View>
              </View>

              <AppText numberOfLines={1} style={styles.nameText}>{row.name}</AppText>
              <AppText style={styles.valueText}>{row.close == null ? '--' : nf0.format(row.close)}</AppText>

              {row.change != null ? (
                <View style={styles.deltaPill}>
                  <View style={[styles.deltaIconWrap, isUp ? styles.deltaIconUp : styles.deltaIconDown]}>
                    {isUp ? (
                      <TrendingUp size={13} color={colors.positive} />
                    ) : (
                      <TrendingDown size={13} color={colors.negative} />
                    )}
                  </View>
                  <AppText style={[styles.changeText, isUp ? styles.upText : styles.downText]}>
                    {`${isUp ? '+' : ''}${nf2.format(row.change)}  `}
                    {`(${row.changePercent == null ? '--' : `${nf2.format(row.changePercent)}%`})`}
                  </AppText>
                </View>
              ) : (
                <AppText style={styles.mutedText}>--</AppText>
              )}

              <View style={styles.footerRow}>
                <AppText style={styles.prevCloseText}>
                  Prev close: {row.previousClose == null ? '--' : nf0.format(row.previousClose)}
                </AppText>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    setHelpSymbol(row.symbol);
                  }}
                  hitSlop={8}
                  style={styles.infoBtn}
                >
                  <Info size={14} color={colors.textMuted} />
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <InfoModal
        symbol={helpSymbol || ''}
        visible={!!helpSymbol}
        onClose={() => setHelpSymbol(null)}
        styles={styles}
        colors={colors}
      />
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  rowTrack: {
    gap: 10,
    paddingRight: 6,
  },
  card: {
    width: 182,
    backgroundColor: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: colors.shadowOpacity,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    minHeight: 120,
  },
  skeletonCard: {
    justifyContent: 'center',
  },
  skeletonContent: {
    gap: 6,
  },
  skeletonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonSymbol: {
    width: 54,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
  },
  skeletonMood: {
    width: 62,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
  },
  skeletonPrice: {
    width: '56%',
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  skeletonDelta: {
    width: '78%',
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
  },
  skeletonFooter: {
    width: '85%',
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.surfaceAlt,
  },
  errorText: {
    color: colors.negative,
    fontSize: 11,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  symbolPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.symbolBorder,
    backgroundColor: colors.symbolBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  symbolText: {
    fontSize: 9,
    color: colors.textPrimary,
  },
  nameText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
  },
  badgeBullish: {
    borderColor: colors.badgeBullishBorder,
    backgroundColor: colors.badgeBullishBg,
  },
  badgeBearish: {
    borderColor: colors.badgeBearishBorder,
    backgroundColor: colors.badgeBearishBg,
  },
  badgeNeutral: {
    borderColor: colors.badgeNeutralBorder,
    backgroundColor: colors.badgeNeutralBg,
  },
  bullText: {
    color: colors.positive,
  },
  bearText: {
    color: colors.negative,
  },
  neutralText: {
    color: colors.neutral,
  },
  valueText: {
    color: colors.textPrimary,
    fontSize: 20,
    letterSpacing: 0.2,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignSelf: 'flex-start',
  },
  deltaIconWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaIconUp: {
    backgroundColor: colors.badgeBullishBg,
  },
  deltaIconDown: {
    backgroundColor: colors.badgeBearishBg,
  },
  changeText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  upText: {
    color: colors.positive,
  },
  downText: {
    color: colors.negative,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 1,
  },
  prevCloseText: {
    color: colors.textMuted,
    fontSize: 9,
    flex: 1,
  },
  infoBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.modalBackdrop,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.modalSurface,
    borderRadius: 16,
    borderColor: colors.border,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalIntro: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  modalText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  noteBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: colors.surfaceAlt,
  },
  noteTitle: {
    fontSize: 11,
    color: colors.textPrimary,
  },
  noteText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
