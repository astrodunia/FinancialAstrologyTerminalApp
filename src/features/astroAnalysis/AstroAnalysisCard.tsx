import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import AppText from '../../components/AppText';
import type { AstroAnalysisRow, GroupedAstroAnalysis } from './types';

type Props = {
  data: GroupedAstroAnalysis | null;
  isLoading: boolean;
  error: Error | null;
  themeColors: any;
  onPress: () => void;
  onRefresh: () => void;
};

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
  if (r === 'buy' || r === 'strong buy' || r === 'strong') return { text: themeColors.positive, border: 'rgba(73,209,141,0.4)', bg: 'rgba(73,209,141,0.1)' };
  if (r === 'sell' || r === 'strong sell' || r === 'weak') return { text: themeColors.negative, border: 'rgba(240,140,140,0.4)', bg: 'rgba(240,140,140,0.1)' };
  if (r === 'hold' || r === 'moderate') return { text: '#F9A825', border: 'rgba(249,168,37,0.4)', bg: 'rgba(249,168,37,0.1)' };
  return { text: themeColors.textMuted, border: themeColors.border, bg: 'transparent' };
};

const TermBadge = ({ view, themeColors, styles }: any) => {
  const colors = viewColors(themeColors, view);
  const label = viewLabel(view);
  if (label === '--') {
    return <View style={[styles.termBadge, { borderColor: 'transparent' }]}><AppText style={[styles.termBadgeText, { color: themeColors.textMuted }]}>--</AppText></View>;
  }
  return (
    <View style={[styles.termBadge, { borderColor: colors.border, backgroundColor: colors.bg }]}>
      <AppText style={[styles.termBadgeText, { color: colors.text }]}>{label}</AppText>
    </View>
  );
};

const RatingCell = ({ row, themeColors, styles }: any) => {
  const colors = ratingColors(themeColors, row.rating);
  return (
    <View style={styles.ratingCell}>
      <View style={[styles.ratingBadge, { borderColor: colors.border, backgroundColor: colors.bg }]}>
        <AppText style={[styles.ratingBadgeText, { color: colors.text }]}>{row.rating || 'N/A'}</AppText>
      </View>
      <AppText style={[styles.scoreNum, { color: colors.text }]}>
        {row.astroScore != null ? Math.round(row.astroScore) : '--'}
      </AppText>
    </View>
  );
};

const TableRow = ({ row, themeColors, styles, isLast }: any) => (
  <View style={[styles.tableRow, isLast && styles.tableRowLast]}>
    <View style={styles.colSymbol}>
      <AppText style={styles.symbolText} numberOfLines={1}>{row.symbol}</AppText>
      <AppText style={styles.nameText} numberOfLines={1}>{row.name || ''}</AppText>
    </View>
    <TermBadge view={row.shortTermView} themeColors={themeColors} styles={styles} />
    <TermBadge view={row.midTermView} themeColors={themeColors} styles={styles} />
    <TermBadge view={row.longTermView} themeColors={themeColors} styles={styles} />
    <RatingCell row={row} themeColors={themeColors} styles={styles} />
  </View>
);

const AstroAnalysisCard = ({ data, isLoading, error, themeColors, onPress, onRefresh }: Props) => {
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const hasData = data && (data.usStocks.length > 0 || data.indexEtfs.length > 0 || data.bondEtfs.length > 0);
  const rows = useMemo(() => {
    if (!hasData) return [];
    return [...(data?.usStocks || []), ...(data?.indexEtfs || []), ...(data?.bondEtfs || [])].slice(0, 5);
  }, [data, hasData]);

  if (isLoading && !hasData) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle}>Astro analysis</AppText>
          <ActivityIndicator size="small" color={themeColors.textMuted} />
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={themeColors.accent} />
        </View>
      </View>
    );
  }

  if (error && !hasData) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle}>Astro analysis</AppText>
        </View>
        <View style={styles.stateBox}>
          <AppText style={styles.errorText}>{error.message || 'Failed to load'}</AppText>
          <Pressable style={styles.retryBtn} onPress={onRefresh}>
            <AppText style={styles.retryText}>Retry</AppText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AppText style={styles.cardTitle}>Astro analysis</AppText>
        </View>
        <View style={styles.stateBox}>
          <AppText style={styles.emptyText}>No data available</AppText>
        </View>
      </View>
    );
  }

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <AppText style={styles.cardTitle}>Astro analysis</AppText>
        <View style={styles.headerRight}>
          {isLoading && <ActivityIndicator size="small" color={themeColors.textMuted} style={{ marginRight: 6 }} />}
          <ChevronRight size={18} color={themeColors.textMuted} />
        </View>
      </View>

      <View style={styles.colHeaders}>
        <AppText style={[styles.colHeaderText, { flex: 1 }]}>STOCK</AppText>
        <AppText style={[styles.colHeaderText, styles.colHeaderCenter]}>S</AppText>
        <AppText style={[styles.colHeaderText, styles.colHeaderCenter]}>M</AppText>
        <AppText style={[styles.colHeaderText, styles.colHeaderCenter]}>L</AppText>
        <AppText style={[styles.colHeaderText, styles.colHeaderRight]}>RATING</AppText>
      </View>

      {rows.map((row, idx) => (
        <TableRow
          key={`${row.symbol}-${idx}`}
          row={row}
          themeColors={themeColors}
          styles={styles}
          isLast={idx === rows.length - 1}
        />
      ))}

      <View style={styles.viewAllRow}>
        <AppText style={styles.viewAllText}>View all astro analysis</AppText>
      </View>
    </Pressable>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceGlass,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      paddingTop: 14,
      paddingHorizontal: 12,
      paddingBottom: 4,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 2,
      marginBottom: 10,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontFamily: 'NotoSans-SemiBold',
    },
    colHeaders: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 2,
    },
    colHeaderText: {
      color: colors.textMuted,
      fontSize: 9,
      fontFamily: 'NotoSans-Regular',
      letterSpacing: 0.4,
    },
    colHeaderCenter: {
      width: 38,
      textAlign: 'center',
    },
    colHeaderRight: {
      width: 70,
      textAlign: 'right',
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 4,
    },
    tableRowLast: {
      borderBottomWidth: 0,
    },
    colSymbol: {
      flex: 1,
      paddingRight: 4,
    },
    symbolText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontFamily: 'NotoSans-ExtraBold',
    },
    nameText: {
      color: colors.textMuted,
      fontSize: 9,
      fontFamily: 'NotoSans-Regular',
      marginTop: 1,
    },
    termBadge: {
      width: 34,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
    },
    termBadgeText: {
      fontSize: 9,
      fontFamily: 'NotoSans-SemiBold',
    },
    ratingCell: {
      width: 70,
      alignItems: 'flex-end',
      gap: 3,
    },
    ratingBadge: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
      alignSelf: 'flex-end',
    },
    ratingBadgeText: {
      fontSize: 10,
      fontFamily: 'NotoSans-SemiBold',
    },
    scoreNum: {
      fontSize: 9,
      fontFamily: 'NotoSans-Regular',
      color: colors.textMuted,
    },
    viewAllRow: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    viewAllText: {
      color: colors.accent,
      fontSize: 12,
      fontFamily: 'NotoSans-SemiBold',
    },
    loadingBox: {
      minHeight: 120,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    stateBox: {
      minHeight: 80,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 14,
    },
    errorText: {
      color: colors.negative,
      fontSize: 13,
      textAlign: 'center',
      fontFamily: 'NotoSans-Regular',
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: 'NotoSans-Regular',
    },
    retryBtn: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.accent,
    },
    retryText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: 'NotoSans-SemiBold',
    },
  });

export default AstroAnalysisCard;
