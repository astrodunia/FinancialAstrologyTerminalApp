import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import _BackButtonHeader from '../../components/BackButtonHeader';
const BackButtonHeader = _BackButtonHeader as React.ComponentType<{ colors: any; onPress: () => void }>;
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import AppText from '../../components/AppText';
import { useUser } from '../../store/UserContext';
import { useAstroAnalysisData } from '../../features/astroAnalysis/useAstroAnalysisData';
import type { AstroAnalysisRow, TermDetail } from '../../features/astroAnalysis/types';

const CATEGORY_LABELS: Record<string, string> = {
  usStocks: 'Top U.S. Stocks',
  indexEtfs: 'Top Index ETFs',
  bondEtfs: 'Top Bond ETFs',
};

const CATEGORY_ORDER = ['usStocks', 'indexEtfs', 'bondEtfs'] as const;

type ActiveTerm = 'short' | 'mid' | 'long';

const viewLabel = (view?: string | null) => {
  const v = (view || '').toLowerCase();
  if (v.includes('bull')) return 'Bull';
  if (v.includes('bear')) return 'Bear';
  if (v) return 'Neu';
  return '--';
};

const viewColors = (themeColors: any, view?: string | null) => {
  const v = (view || '').toLowerCase();
  if (v.includes('bull')) return { text: themeColors.positive, border: 'rgba(73,209,141,0.4)', bg: 'rgba(73,209,141,0.1)' };
  if (v.includes('bear')) return { text: themeColors.negative, border: 'rgba(240,140,140,0.4)', bg: 'rgba(240,140,140,0.1)' };
  if (v) return { text: themeColors.textMuted, border: 'rgba(183,189,200,0.25)', bg: 'rgba(183,189,200,0.07)' };
  return { text: themeColors.textMuted, border: 'transparent', bg: 'transparent' };
};

const ratingColors = (themeColors: any, rating?: string | null) => {
  const r = (rating || '').toLowerCase();
  if (r === 'buy' || r === 'strong buy' || r === 'strong') return { text: themeColors.positive, border: 'rgba(73,209,141,0.4)', bg: 'rgba(73,209,141,0.12)' };
  if (r === 'sell' || r === 'strong sell' || r === 'weak') return { text: themeColors.negative, border: 'rgba(240,140,140,0.4)', bg: 'rgba(240,140,140,0.12)' };
  if (r === 'hold' || r === 'moderate') return { text: '#F9A825', border: 'rgba(249,168,37,0.4)', bg: 'rgba(249,168,37,0.12)' };
  return { text: themeColors.textMuted, border: themeColors.border, bg: 'transparent' };
};

const formatPrice = (value: number | null | undefined): string => {
  if (value == null) return '--';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const TermBadge = ({ view, themeColors, styles }: any) => {
  const colors = viewColors(themeColors, view);
  const label = viewLabel(view);
  return (
    <View style={[styles.termBadge, { borderColor: colors.border, backgroundColor: colors.bg }]}>
      <AppText style={[styles.termBadgeText, { color: colors.text }]}>{label}</AppText>
    </View>
  );
};

const ScoreBar = ({ score, ratingColor, styles }: any) => {
  const pct = Math.max(0, Math.min(100, score || 0));
  return (
    <View style={styles.scoreBarTrack}>
      <View style={[styles.scoreBarFill, { width: `${pct}%`, backgroundColor: ratingColor }]} />
    </View>
  );
};

const DetailModal = ({
  row,
  visible,
  onClose,
  themeColors,
  styles,
}: {
  row: AstroAnalysisRow | null;
  visible: boolean;
  onClose: () => void;
  themeColors: any;
  styles: any;
}) => {
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>('short');

  const currentDetail: TermDetail | null = useMemo(() => {
    if (!row) return null;
    if (activeTerm === 'short') return row.shortTermDetail ?? null;
    if (activeTerm === 'mid') return row.midTermDetail ?? null;
    return row.longTermDetail ?? null;
  }, [row, activeTerm]);

  const termView = useMemo(() => {
    if (!row) return '';
    if (activeTerm === 'short') return row.shortTermView || '';
    if (activeTerm === 'mid') return row.midTermView || '';
    return row.longTermView || '';
  }, [row, activeTerm]);

  const termLabel = activeTerm === 'short' ? 'Short Term' : activeTerm === 'mid' ? 'Mid Term' : 'Long Term';
  const viewClr = viewColors(themeColors, termView);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={styles.modalTitleGroup}>
              <AppText style={styles.modalName} numberOfLines={1}>{row?.name || row?.symbol || ''}</AppText>
              <AppText style={styles.modalSymbol}>{row?.symbol || ''}</AppText>
            </View>
            <View style={[styles.termViewBadge, { borderColor: viewClr.border, backgroundColor: viewClr.bg }]}>
              <AppText style={[styles.termViewBadgeText, { color: viewClr.text }]}>{termLabel} View</AppText>
            </View>
          </View>

          <View style={styles.termTabs}>
            {(['short', 'mid', 'long'] as ActiveTerm[]).map((term) => (
              <Pressable
                key={term}
                style={[styles.termTab, activeTerm === term && styles.termTabActive]}
                onPress={() => setActiveTerm(term)}
              >
                <AppText style={[styles.termTabText, activeTerm === term && styles.termTabTextActive]}>
                  {term === 'short' ? 'Short' : term === 'mid' ? 'Mid' : 'Long'} Term
                </AppText>
              </Pressable>
            ))}
          </View>

          <View style={styles.tradingRow}>
            <View style={styles.tradingItem}>
              <AppText style={styles.tradingLabel}>Entry</AppText>
              <AppText style={styles.tradingValue}>{formatPrice(currentDetail?.entry)}</AppText>
            </View>
            <View style={styles.tradingDivider} />
            <View style={styles.tradingItem}>
              <AppText style={styles.tradingLabel}>Target Price</AppText>
              <AppText style={styles.tradingValue}>{formatPrice(currentDetail?.targetPrice)}</AppText>
            </View>
            <View style={styles.tradingDivider} />
            <View style={styles.tradingItem}>
              <AppText style={styles.tradingLabel}>Stop Loss</AppText>
              <AppText style={[styles.tradingValue, { color: themeColors.negative }]}>
                {formatPrice(currentDetail?.stopLoss)}
              </AppText>
            </View>
          </View>

          {(currentDetail?.cause) ? (
            <View style={styles.causeSection}>
              <AppText style={styles.causeLabel}>Cause</AppText>
              <AppText style={styles.causeText}>{currentDetail.cause}</AppText>
            </View>
          ) : null}

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <AppText style={styles.closeBtnText}>Close</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const TableRow = ({
  row,
  themeColors,
  styles,
  onPress,
}: {
  row: AstroAnalysisRow;
  themeColors: any;
  styles: any;
  onPress: (row: AstroAnalysisRow) => void;
}) => {
  const rc = ratingColors(themeColors, row.rating);
  return (
    <Pressable style={styles.tableRow} onPress={() => onPress(row)}>
      <View style={styles.colSymbol}>
        <AppText style={styles.symbolText}>{row.symbol}</AppText>
        <AppText style={styles.nameText} numberOfLines={1}>{row.name || ''}</AppText>
      </View>
      <TermBadge view={row.shortTermView} themeColors={themeColors} styles={styles} />
      <TermBadge view={row.midTermView} themeColors={themeColors} styles={styles} />
      <TermBadge view={row.longTermView} themeColors={themeColors} styles={styles} />
      <View style={styles.ratingCol}>
        <View style={[styles.ratingBadge, { borderColor: rc.border, backgroundColor: rc.bg }]}>
          <AppText style={[styles.ratingText, { color: rc.text }]}>{row.rating || 'N/A'}</AppText>
        </View>
        {row.astroScore != null ? (
          <>
            <ScoreBar score={row.astroScore} ratingColor={rc.text} styles={styles} />
            <AppText style={[styles.scoreNum, { color: rc.text }]}>{Math.round(row.astroScore)}</AppText>
          </>
        ) : null}
      </View>
    </Pressable>
  );
};

export default function AstroAnalysisScreen({ navigation }: any) {
  const { themeColors, authFetch } = useUser();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const astroQuery = useAstroAnalysisData(authFetch);
  const [selectedRow, setSelectedRow] = useState<AstroAnalysisRow | null>(null);

  const sections = useMemo(() => {
    if (!astroQuery.data) return [];
    return CATEGORY_ORDER
      .map((key) => ({
        title: CATEGORY_LABELS[key],
        data: astroQuery.data![key] || [],
        key,
      }))
      .filter((s) => s.data.length > 0);
  }, [astroQuery.data]);

  const renderItem = useCallback(
    ({ item }: { item: AstroAnalysisRow }) => (
      <TableRow row={item} themeColors={themeColors} styles={styles} onPress={setSelectedRow} />
    ),
    [styles, themeColors],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: any }) => (
      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>{section.title}</AppText>
        <AppText style={styles.sectionCount}>{section.data.length} items</AppText>
      </View>
    ),
    [styles],
  );

  const renderSectionFooter = useCallback(() => <View style={styles.sectionGap} />, [styles]);

  const tableHeader = useMemo(() => (
    <View style={styles.tableHeader}>
      <AppText style={[styles.colHead, { flex: 1 }]}>STOCK NAME</AppText>
      <AppText style={[styles.colHead, styles.colHeadCenter]}>S</AppText>
      <AppText style={[styles.colHead, styles.colHeadCenter]}>M</AppText>
      <AppText style={[styles.colHead, styles.colHeadCenter]}>L</AppText>
      <AppText style={[styles.colHead, styles.colHeadRight]}>ANALYSIS RATING</AppText>
    </View>
  ), [styles]);

  if (astroQuery.isLoading && !astroQuery.data) {
    return (
      <View style={styles.screen}>
        <GradientBackground>
          <BackButtonHeader colors={themeColors} onPress={() => navigation.goBack()} />
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={themeColors.accent} />
            <AppText style={styles.loadingText}>Loading astro analysis...</AppText>
          </View>
          <BottomTabs activeRoute="Home" navigation={navigation} />
        </GradientBackground>
      </View>
    );
  }

  if (astroQuery.error && !astroQuery.data) {
    return (
      <View style={styles.screen}>
        <GradientBackground>
          <BackButtonHeader colors={themeColors} onPress={() => navigation.goBack()} />
          <View style={styles.centerContent}>
            <AppText style={styles.errorTitle}>Error Loading Analysis</AppText>
            <AppText style={styles.errorText}>{astroQuery.error.message || 'Something went wrong'}</AppText>
            <Pressable style={styles.retryBtn} onPress={() => astroQuery.refetch()}>
              <AppText style={styles.retryText}>Try Again</AppText>
            </Pressable>
          </View>
          <BottomTabs activeRoute="Home" navigation={navigation} />
        </GradientBackground>
      </View>
    );
  }

  if (!sections.length) {
    return (
      <View style={styles.screen}>
        <GradientBackground>
          <BackButtonHeader colors={themeColors} onPress={() => navigation.goBack()} />
          <View style={styles.centerContent}>
            <AppText style={styles.errorTitle}>No Data Available</AppText>
            <AppText style={styles.errorText}>Astro analysis data will appear here soon</AppText>
          </View>
          <BottomTabs activeRoute="Home" navigation={navigation} />
        </GradientBackground>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <GradientBackground>
        <BackButtonHeader
          colors={themeColors}
          onPress={() => navigation.goBack()}
        />

        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.symbol}-${index}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          ListHeaderComponent={tableHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />

        {astroQuery.isLoading && (
          <View style={styles.syncOverlay}>
            <ActivityIndicator size="small" color={themeColors.accent} />
            <AppText style={styles.syncText}>Updating...</AppText>
          </View>
        )}

        <BottomTabs activeRoute="Home" navigation={navigation} />
      </GradientBackground>

      <DetailModal
        row={selectedRow}
        visible={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        themeColors={themeColors}
        styles={styles}
      />
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },

    centerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 12,
    },
    loadingText: { color: colors.textMuted, fontSize: 14, fontFamily: 'NotoSans-Regular' },
    errorTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: 'NotoSans-SemiBold' },
    errorText: { color: colors.textMuted, fontSize: 13, fontFamily: 'NotoSans-Regular', textAlign: 'center' },
    retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.accent },
    retryText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'NotoSans-SemiBold' },

    listContent: {
      paddingHorizontal: 10,
      paddingTop: 4,
      paddingBottom: 110,
    },

    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10,
    },
    colHead: {
      color: colors.textMuted,
      fontSize: 9,
      fontFamily: 'NotoSans-Regular',
      letterSpacing: 0.5,
    },
    colHeadCenter: { width: 38, textAlign: 'center' },
    colHeadRight: { width: 90, textAlign: 'right' },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 10,
    },
    sectionTitle: { color: colors.textPrimary, fontSize: 14, fontFamily: 'NotoSans-SemiBold' },
    sectionCount: { color: colors.textMuted, fontSize: 11, fontFamily: 'NotoSans-Regular' },
    sectionGap: { height: 8 },

    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      paddingHorizontal: 12,
      marginBottom: 6,
      backgroundColor: colors.surfaceGlass,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },

    colSymbol: { flex: 1, paddingRight: 4 },
    symbolText: { color: colors.textPrimary, fontSize: 13, fontFamily: 'NotoSans-ExtraBold' },
    nameText: { color: colors.textMuted, fontSize: 10, fontFamily: 'NotoSans-Regular', marginTop: 2 },

    termBadge: {
      width: 34,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
    },
    termBadgeText: { fontSize: 9, fontFamily: 'NotoSans-SemiBold' },

    ratingCol: {
      width: 90,
      alignItems: 'flex-end',
      gap: 4,
    },
    ratingBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
    },
    ratingText: { fontSize: 11, fontFamily: 'NotoSans-SemiBold' },
    scoreBarTrack: {
      width: 70,
      height: 3,
      borderRadius: 999,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    scoreBarFill: {
      height: 3,
      borderRadius: 999,
    },
    scoreNum: {
      fontSize: 10,
      fontFamily: 'NotoSans-Regular',
      color: colors.textMuted,
    },

    syncOverlay: {
      position: 'absolute',
      bottom: 120,
      left: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surfaceGlass,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    syncText: { color: colors.textMuted, fontSize: 12, fontFamily: 'NotoSans-Regular' },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 20,
      paddingBottom: 34,
      paddingTop: 12,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 18,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    modalTitleGroup: { flex: 1, paddingRight: 10 },
    modalName: { color: colors.textPrimary, fontSize: 17, fontFamily: 'NotoSans-SemiBold' },
    modalSymbol: { color: colors.textMuted, fontSize: 13, fontFamily: 'NotoSans-Regular', marginTop: 3 },
    termViewBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
    },
    termViewBadgeText: { fontSize: 11, fontFamily: 'NotoSans-SemiBold' },

    termTabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    termTab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
    },
    termTabActive: {
      borderColor: colors.accent,
      backgroundColor: 'rgba(201,168,255,0.12)',
    },
    termTabText: {
      color: colors.textMuted,
      fontSize: 12,
      fontFamily: 'NotoSans-Regular',
    },
    termTabTextActive: {
      color: colors.accent,
      fontFamily: 'NotoSans-SemiBold',
    },

    tradingRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    tradingItem: { flex: 1, alignItems: 'center', gap: 6 },
    tradingLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'NotoSans-Regular' },
    tradingValue: { color: colors.textPrimary, fontSize: 15, fontFamily: 'NotoSans-SemiBold' },
    tradingDivider: { width: 1, height: 38, backgroundColor: colors.border, alignSelf: 'center' },

    causeSection: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
      gap: 6,
    },
    causeLabel: { color: colors.textMuted, fontSize: 11, fontFamily: 'NotoSans-Regular', letterSpacing: 0.3 },
    causeText: { color: colors.textPrimary, fontSize: 13, fontFamily: 'NotoSans-Regular', lineHeight: 20 },

    closeBtn: {
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    closeBtnText: { color: colors.textPrimary, fontSize: 14, fontFamily: 'NotoSans-SemiBold' },
  });
