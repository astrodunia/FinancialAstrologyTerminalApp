import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Info, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import AppText from './AppText';
import { API_BASE_URL } from '../store/UserContext';

const LIVE_INDICES_API_BASE = 'https://finance.rajeevprakash.com';

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

const COLORS = {
  cardBg: 'rgba(17, 20, 30, 0.74)',
  border: 'rgba(255, 255, 255, 0.10)',
  textPrimary: '#FFFFFF',
  textMuted: '#B7BDC8',
  positive: '#49D18D',
  negative: '#F08C8C',
  neutral: '#F5C36A',
  modalBackdrop: 'rgba(0, 0, 0, 0.65)',
  modalSurface: '#14161D',
};

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

const isUsRegularMarketOpen = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const valueOf = (type: string) => parts.find((part) => part.type === type)?.value || '';
  const weekday = valueOf('weekday');
  const hour = Number(valueOf('hour') || 0);
  const minute = Number(valueOf('minute') || 0);
  const totalMinutes = hour * 60 + minute;
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (isWeekend) return false;
  return totalMinutes >= 570 && totalMinutes < 960; // 9:30am - 4:00pm ET
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

function SkeletonCard() {
  return (
    <View style={[styles.card, styles.skeletonCard]}>
      <View style={styles.skeletonTop}>
        <View style={styles.skeletonSymbol} />
        <View style={styles.skeletonMood} />
      </View>
      <View style={styles.skeletonPrice} />
      <View style={styles.skeletonDelta} />
      <View style={styles.skeletonFooter} />
      <ActivityIndicator size="small" color={COLORS.textMuted} style={styles.skeletonSpinner} />
    </View>
  );
}

function InfoModal({ symbol, visible, onClose }: { symbol: string; visible: boolean; onClose: () => void }) {
  const help = (INDEX_HELP as any)[symbol];
  if (!help) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <AppText style={styles.modalTitle}>{help.title}</AppText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={16} color={COLORS.textMuted} />
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
  const navigation = useNavigation<any>();
  const [rows, setRows] = useState<ViewRow[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [helpSymbol, setHelpSymbol] = useState<string | null>(null);
  const [marketOpen, setMarketOpen] = useState(() => isUsRegularMarketOpen());

  const abortRef = useRef<AbortController | null>(null);
  const reqSeq = useRef(0);

  const load = useCallback(async () => {
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

      setRows(mapped);
      setStatus('ok');
    } catch (e: any) {
      if (isAbortError(e)) return;
      if (mySeq !== reqSeq.current) return;
      setStatus('error');
      setError(e?.message || 'Failed to load indices');
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();

    const marketClockId = setInterval(() => {
      setMarketOpen(isUsRegularMarketOpen());
    }, 60000);

    return () => {
      clearInterval(marketClockId);
      abortRef.current?.abort();
    };
  }, [load]);

  useEffect(() => {
    if (!marketOpen) return undefined;

    load();

    const pollId = setInterval(() => {
      load();
    }, 30000);

    return () => clearInterval(pollId);
  }, [load, marketOpen]);

  const cards = useMemo(() => rows, [rows]);

  const openIndex = (symbol: string) => {
    if (onPressIndex) {
      onPressIndex(symbol);
      return;
    }

    navigation.navigate('Overview', { indexSymbol: symbol });
  };

  return (
    <View style={styles.grid}>
      {status === 'loading' && INDEX_LIST.map((item) => <SkeletonCard key={item.id} />)}

      {status === 'error' && <AppText style={styles.errorText}>{error}</AppText>}

      {status === 'ok' && cards.map((row) => {
        const mood = classify(row.changePercent);
        const isUp = (row.change ?? 0) >= 0;
        return (
          <Pressable
            key={row.symbol}
            style={styles.card}
            onPress={() => openIndex(row.symbol)}
          >
            <View style={styles.headerRow}>
              <AppText numberOfLines={1} style={styles.nameText}>{row.name}</AppText>
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

            <AppText style={styles.valueText}>{row.close == null ? '--' : nf0.format(row.close)}</AppText>

            {row.change != null ? (
              <View style={styles.deltaPill}>
                <View style={[styles.deltaIconWrap, isUp ? styles.deltaIconUp : styles.deltaIconDown]}>
                  {isUp ? (
                    <TrendingUp size={13} color={COLORS.positive} />
                  ) : (
                    <TrendingDown size={13} color={COLORS.negative} />
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
                <Info size={14} color={COLORS.textMuted} />
              </Pressable>
            </View>
          </Pressable>
        );
      })}

      <InfoModal symbol={helpSymbol || ''} visible={!!helpSymbol} onClose={() => setHelpSymbol(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(17, 20, 30, 0.82)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 13,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    minHeight: 154,
  },
  skeletonCard: {
    justifyContent: 'space-between',
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
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  skeletonMood: {
    width: 62,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  skeletonPrice: {
    width: '56%',
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginTop: 8,
  },
  skeletonDelta: {
    width: '78%',
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginTop: 6,
  },
  skeletonFooter: {
    width: '85%',
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 6,
  },
  skeletonSpinner: {
    marginTop: 8,
  },
  errorText: {
    color: COLORS.negative,
    fontSize: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
  },
  badgeBullish: {
    borderColor: 'rgba(73, 209, 141, 0.45)',
    backgroundColor: 'rgba(73, 209, 141, 0.14)',
  },
  badgeBearish: {
    borderColor: 'rgba(240, 140, 140, 0.45)',
    backgroundColor: 'rgba(240, 140, 140, 0.14)',
  },
  badgeNeutral: {
    borderColor: 'rgba(245, 195, 106, 0.45)',
    backgroundColor: 'rgba(245, 195, 106, 0.14)',
  },
  bullText: {
    color: COLORS.positive,
  },
  bearText: {
    color: COLORS.negative,
  },
  neutralText: {
    color: COLORS.neutral,
  },
  valueText: {
    color: COLORS.textPrimary,
    fontSize: 24,
    letterSpacing: 0.3,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
  },
  deltaIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaIconUp: {
    backgroundColor: 'rgba(73, 209, 141, 0.17)',
  },
  deltaIconDown: {
    backgroundColor: 'rgba(240, 140, 140, 0.17)',
  },
  changeText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  upText: {
    color: COLORS.positive,
  },
  downText: {
    color: COLORS.negative,
  },
  mutedText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 3,
  },
  prevCloseText: {
    color: COLORS.textMuted,
    fontSize: 10,
    flex: 1,
  },
  infoBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderColor: COLORS.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.modalBackdrop,
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.modalSurface,
    borderRadius: 16,
    borderColor: COLORS.border,
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
    color: COLORS.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalIntro: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  modalText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  noteBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  noteTitle: {
    fontSize: 11,
    color: COLORS.textPrimary,
  },
  noteText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
