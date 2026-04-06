import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import {
  BarChart3,
  CircleDollarSign,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react-native';
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import Svg, { Circle, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import AppText from '../../components/AppText';
import AppTextInput from '../../components/AppTextInput';
import BottomTabs from '../../components/BottomTabs';
import GradientBackground from '../../components/GradientBackground';
import ProfileAvatarButton from '../../components/ProfileAvatarButton';
import { useUser } from '../../store/UserContext';
import { navigateToStockDetail } from '../../features/stocks/navigation';
import { usePortfolio } from '../../hooks/usePortfolio';
import { MAIN_TAB_ROUTES, useHorizontalSwipe } from '../../navigation/useHorizontalSwipe';

const fmtMoney = (value) => `$${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
const fmtNum = (value) => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 4 });
const fmtPct = (value) => `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;
const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Portfolio = ({ navigation }) => {
  const { themeColors, user } = useUser();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isTablet = width >= 820;
  const styles = useMemo(() => createStyles(themeColors, isCompact, isTablet), [themeColors, isCompact, isTablet]);

  const swipeHandlers = useHorizontalSwipe(MAIN_TAB_ROUTES, 'Portfolio', (route) => navigation.navigate(route));

  const {
    rows,
    summary,
    allocation,
    listLoading,
    addLoading,
    saveLoading,
    deleteLoading,
    sellLoading,
    searchText,
    suggestions,
    sortKey,
    sortDir,
    addDraft,
    editDraft,
    sellDraft,
    editingId,
    sellingId,
    setSearchText,
    setAddDraft,
    setEditDraft,
    setSellDraft,
    setEditingId,
    setSellingId,
    onCreateOrAddPosition,
    onSavePosition,
    onSellPosition,
    onDeletePosition,
    onSelectSuggestion,
    toggleSort,
    startEdit,
    startSell,
    estimateSellPnl,
  } = usePortfolio();

  const [analyticsTab, setAnalyticsTab] = useState('allocation');
  const profileName = user?.displayName || user?.name || 'Trader';
  const maxDayPct = Math.max(1, ...rows.map((item) => Math.abs(Number(item.dayPct || 0))));
  const allocationChartData = allocation.filter((item) => Number(item.sharePct || 0) > 0).slice(0, 6);
  const perfRows = rows.slice(0, 6);
  const valueSeries = [
    { label: 'Jul', value: Number(summary.totalCost || 0) },
    { label: 'Aug', value: Number(((summary.totalCost || 0) + (summary.totalValue || 0)) / 2) },
    { label: 'Sep', value: Number(summary.totalValue || 0) },
  ];
  const valueMax = Math.max(1, ...valueSeries.map((p) => p.value));
  const donutSize = isCompact ? 150 : 170;
  const donutRadius = isCompact ? 50 : 56;
  const donutCenter = donutSize / 2;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const summaryCards = [
    {
      key: 'value',
      title: 'Net Value',
      value: fmtMoney(summary.totalValue),
      sub: `${fmtMoney(summary.dayChange)} today`,
      positive: summary.dayChange >= 0,
      Icon: CircleDollarSign,
    },
    {
      key: 'gain',
      title: 'Net Gain/Loss',
      value: fmtMoney(summary.totalGain),
      sub: fmtPct(summary.totalGainPercent),
      positive: summary.totalGain >= 0,
      Icon: TrendingUp,
    },
    {
      key: 'cost',
      title: 'Net Investment',
      value: fmtMoney(summary.totalCost),
      sub: `${rows.length} open positions`,
      positive: true,
      Icon: Target,
    },
  ];

  return (
    <View style={styles.safeArea} {...swipeHandlers}>
      <GradientBackground>
        <View style={styles.header}>
          <AppText style={styles.title}>Portfolio</AppText>
          <ProfileAvatarButton style={styles.iconButton} onPress={() => navigation.navigate('Profile')} size={36} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryGrid}>
            {summaryCards.map((item) => {
              const AccentIcon = item.Icon;
              return (
                <View key={item.key} style={styles.summaryCard}>
                  <View style={styles.summaryHead}>
                    <AccentIcon size={14} color={item.positive ? '#22c55e' : '#ef4444'} />
                    <AppText style={styles.summaryLabel}>{item.title}</AppText>
                  </View>
                  <AppText style={styles.summaryValue} weight="semiBold">{item.value}</AppText>
                  <AppText style={[styles.summarySub, item.positive ? styles.up : styles.down]}>{item.sub}</AppText>
                </View>
              );
            })}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <Plus size={15} color={themeColors.textPrimary} />
              <AppText style={styles.cardTitle} weight="semiBold">Add Position</AppText>
            </View>

            <View style={styles.inputShell}>
              <Search size={14} color={themeColors.textMuted} />
              <AppTextInput
                value={addDraft.symbol || searchText}
                onChangeText={(text) => {
                  setSearchText(text);
                  setAddDraft((prev) => ({ ...prev, symbol: text }));
                }}
                placeholder="Search symbols"
                placeholderTextColor={themeColors.textMuted}
                style={styles.inputNoBorder}
                autoCapitalize="characters"
              />
            </View>

            {!!suggestions.length && (
              <View style={styles.suggestionBox}>
                {suggestions.map((item) => (
                  <Pressable key={item.symbol} style={styles.suggestionRow} onPress={() => onSelectSuggestion(item)}>
                    <AppText style={styles.suggestionSym} weight="semiBold">{item.symbol}</AppText>
                    <AppText style={styles.suggestionName} numberOfLines={1}>{item.name}</AppText>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.inlineFields}>
              <AppTextInput
                value={addDraft.buyPrice}
                onChangeText={(text) => setAddDraft((prev) => ({ ...prev, buyPrice: text }))}
                keyboardType="decimal-pad"
                placeholder="Buy price"
                placeholderTextColor={themeColors.textMuted}
                style={[styles.input, styles.fieldCell]}
              />
              <AppTextInput
                value={addDraft.quantity}
                onChangeText={(text) => setAddDraft((prev) => ({ ...prev, quantity: text }))}
                keyboardType="numeric"
                placeholder="Quantity"
                placeholderTextColor={themeColors.textMuted}
                style={[styles.input, styles.fieldCell]}
              />
              <Pressable style={[styles.primaryBtn, styles.fieldCellBtn]} onPress={onCreateOrAddPosition} disabled={addLoading}>
                {addLoading ? <ActivityIndicator size="small" color="#fff" /> : <Plus size={13} color="#fff" />}
                <AppText style={styles.primaryBtnText} weight="semiBold">{addLoading ? 'Adding' : 'Add'}</AppText>
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <BarChart3 size={15} color={themeColors.textPrimary} />
              <AppText style={styles.cardTitle} weight="semiBold">Your Positions</AppText>
            </View>

            {listLoading ? (
              <ActivityIndicator size="small" color={themeColors.textPrimary} />
            ) : (
              <FlatList
                data={rows}
                keyExtractor={(item) => item.id || item.symbol}
                scrollEnabled={false}
                contentContainerStyle={styles.rowGap}
                renderItem={({ item }) => {
                  const isUp = item.gain >= 0;
                  const isEditing = editingId === item.id;
                  const isSelling = sellingId === item.id;

                  return (
                    <View style={styles.positionCard}>
                      <View style={styles.positionHead}>
                        <Pressable style={styles.headLeft} onPress={() => navigateToStockDetail(navigation, item.symbol)}>
                          <AppText style={styles.symbol} weight="semiBold">{item.symbol}</AppText>
                          <AppText style={styles.name} numberOfLines={1}>{item.name}</AppText>
                        </Pressable>
                        <View style={styles.headActions}>
                          <Pressable style={styles.actionIcon} onPress={() => startSell(item)} hitSlop={8}>
                            <CircleDollarSign size={13} color={themeColors.textPrimary} />
                          </Pressable>
                          <Pressable style={styles.actionIcon} onPress={() => startEdit(item)} hitSlop={8}>
                            <Pencil size={13} color={themeColors.textPrimary} />
                          </Pressable>
                          <Pressable
                            style={styles.actionIcon}
                            onPress={() =>
                              Alert.alert('Delete position?', `Delete ${item.symbol} from portfolio?`, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => onDeletePosition(item.id) },
                              ])
                            }
                            disabled={deleteLoading}
                          >
                            <Trash2 size={13} color={themeColors.negative} />
                          </Pressable>
                        </View>
                      </View>

                      <View style={styles.metricGrid}>
                        <View style={styles.metricRow}>
                          <AppText style={styles.metricLabel}>Qty</AppText>
                          <AppText style={styles.metricValue}>{fmtNum(item.quantity)}</AppText>
                        </View>
                        <View style={styles.metricRow}>
                          <AppText style={styles.metricLabel}>Avg Buy</AppText>
                          <AppText style={styles.metricValue}>{fmtMoney(item.buyPrice)}</AppText>
                        </View>
                        <View style={styles.metricRow}>
                          <AppText style={styles.metricLabel}>Price</AppText>
                          <AppText style={styles.metricValue}>{fmtMoney(item.currentPrice)}</AppText>
                        </View>
                        <View style={styles.metricRow}>
                          <AppText style={styles.metricLabel}>Value</AppText>
                          <AppText style={styles.metricValue}>{fmtMoney(item.value)}</AppText>
                        </View>
                        <View style={styles.metricRow}>
                          <AppText style={styles.metricLabel}>P/L</AppText>
                          <AppText style={[styles.metricValue, isUp ? styles.up : styles.down]}>{fmtMoney(item.gain)}</AppText>
                        </View>
                        <View style={styles.metricRow}>
                          <AppText style={styles.metricLabel}>P/L%</AppText>
                          <AppText style={[styles.metricValue, isUp ? styles.up : styles.down]}>{fmtPct(item.gainPct)}</AppText>
                        </View>
                      </View>

                      {isEditing && (
                        <View style={styles.panel}>
                          <AppText style={styles.panelTitle} weight="semiBold">Edit {item.symbol}</AppText>
                          <View style={styles.inlineFields}>
                            <AppTextInput
                              value={editDraft.quantity}
                              onChangeText={(text) => setEditDraft((prev) => ({ ...prev, id: item.id, quantity: text }))}
                              keyboardType="numeric"
                              placeholder="Quantity"
                              placeholderTextColor={themeColors.textMuted}
                              style={[styles.input, styles.inputHalf]}
                            />
                            <AppTextInput
                              value={editDraft.buyPrice}
                              onChangeText={(text) => setEditDraft((prev) => ({ ...prev, id: item.id, buyPrice: text }))}
                              keyboardType="decimal-pad"
                              placeholder="Buy price"
                              placeholderTextColor={themeColors.textMuted}
                              style={[styles.input, styles.inputHalf]}
                            />
                          </View>
                          <View style={styles.inlineFields}>
                            <Pressable style={styles.secondaryBtn} onPress={() => setEditingId('')}>
                              <AppText style={styles.secondaryBtnText}>Cancel</AppText>
                            </Pressable>
                            <Pressable style={styles.primaryBtnSmall} onPress={onSavePosition} disabled={saveLoading}>
                              <AppText style={styles.primaryBtnText} weight="semiBold">{saveLoading ? 'Saving...' : 'Save'}</AppText>
                            </Pressable>
                          </View>
                        </View>
                      )}

                      {isSelling && (
                        <View style={styles.panel}>
                          <AppText style={styles.panelTitle} weight="semiBold">Sell {item.symbol}</AppText>
                          <View style={styles.inlineFields}>
                            <View style={styles.inputHalf}>
                              <AppText style={styles.inputLabel}>Sell Price</AppText>
                              <AppTextInput
                                value={sellDraft.sellPrice}
                                onChangeText={(text) => setSellDraft((prev) => ({ ...prev, id: item.id, sellPrice: text }))}
                                keyboardType="decimal-pad"
                                placeholder="Sell Price"
                                placeholderTextColor={themeColors.textMuted}
                                style={styles.input}
                              />
                            </View>
                            <View style={styles.inputHalf}>
                              <AppText style={styles.inputLabel}>Sell Quantity</AppText>
                              <AppTextInput
                                value={sellDraft.sellQty}
                                onChangeText={(text) => setSellDraft((prev) => ({ ...prev, id: item.id, sellQty: text }))}
                                keyboardType="numeric"
                                placeholder="Sell Quantity"
                                placeholderTextColor={themeColors.textMuted}
                                style={styles.input}
                              />
                            </View>
                          </View>
                          <AppText style={styles.metric}>Estimated PnL {fmtMoney(estimateSellPnl(item))}</AppText>
                          <View style={styles.inlineFields}>
                            <Pressable style={styles.secondaryBtn} onPress={() => setSellingId('')}>
                              <AppText style={styles.secondaryBtnText}>Cancel</AppText>
                            </Pressable>
                            <Pressable style={styles.primaryBtnSmall} onPress={onSellPosition} disabled={sellLoading}>
                              <AppText style={styles.primaryBtnText} weight="semiBold">{sellLoading ? 'Selling...' : 'Sell'}</AppText>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                }}
                ListEmptyComponent={<AppText style={styles.empty}>No positions yet. Add your first holding.</AppText>}
              />
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHead}>
              <BarChart3 size={15} color={themeColors.textPrimary} />
              <AppText style={styles.cardTitle} weight="semiBold">Allocation / Performance</AppText>
            </View>

            <View style={styles.analyticsTabs}>
              {[
                { key: 'allocation', label: 'Allocation' },
                { key: 'performance', label: 'Performance' },
              ].map((tab) => (
                <Pressable key={tab.key} style={[styles.tabBtn, analyticsTab === tab.key && styles.tabBtnActive]} onPress={() => setAnalyticsTab(tab.key)}>
                  <AppText style={styles.tabText} weight={analyticsTab === tab.key ? 'semiBold' : 'regular'}>{tab.label}</AppText>
                </Pressable>
              ))}
            </View>

            {analyticsTab === 'allocation' && (
              <View style={styles.analyticsPanel}>
                <AppText style={styles.analyticsTitle} weight="semiBold">Allocation by Symbol</AppText>
                {!!allocationChartData.length && (
                  <View style={styles.chartWrap}>
                    <Svg width={donutSize} height={donutSize}>
                      <Circle
                        cx={donutCenter}
                        cy={donutCenter}
                        r={donutRadius}
                        stroke={themeColors.border}
                        strokeWidth={16}
                        fill="none"
                      />
                      {allocationChartData.reduce(
                        (acc, item, index) => {
                          const pct = Number(item.sharePct || 0);
                          const seg = (pct / 100) * donutCircumference;
                          acc.nodes.push(
                            <Circle
                              key={`${item.symbol}-${index}`}
                              cx={donutCenter}
                              cy={donutCenter}
                              r={donutRadius}
                              stroke={PIE_COLORS[index % PIE_COLORS.length]}
                              strokeWidth={16}
                              fill="none"
                              strokeDasharray={`${seg} ${donutCircumference}`}
                              transform={`rotate(${acc.angle - 90} ${donutCenter} ${donutCenter})`}
                            />,
                          );
                          acc.angle += (pct / 100) * 360;
                          return acc;
                        },
                        { angle: 0, nodes: [] },
                      ).nodes}
                    </Svg>
                  </View>
                )}
                {allocationChartData.map((item, index) => (
                  <View key={item.symbol} style={styles.analyticsRow}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }]} />
                      <AppText style={styles.metric}>{item.symbol}</AppText>
                    </View>
                    <AppText style={styles.metric}>{fmtPct(item.sharePct)}</AppText>
                  </View>
                ))}
              </View>
            )}

            {analyticsTab === 'performance' && (
              <View style={styles.analyticsPanel}>
                <AppText style={styles.analyticsTitle} weight="semiBold">Day Change (in percentage)</AppText>
                {!!perfRows.length && (
                  <View style={styles.chartBox}>
                    <Svg width="100%" height={240} viewBox="0 0 320 240">
                      <Line x1="34" y1="30" x2="34" y2="194" stroke={themeColors.border} strokeWidth="1" />
                      <Line x1="34" y1="112" x2="300" y2="112" stroke={themeColors.border} strokeWidth="1" />
                      <Line x1="34" y1="194" x2="300" y2="194" stroke={themeColors.border} strokeWidth="1" />
                      <Line x1="34" y1="30" x2="300" y2="30" stroke={themeColors.border} strokeDasharray="3 3" strokeWidth="0.8" />
                      <Line x1="34" y1="112" x2="300" y2="112" stroke={themeColors.border} strokeDasharray="3 3" strokeWidth="0.8" />
                      <Line x1="34" y1="194" x2="300" y2="194" stroke={themeColors.border} strokeDasharray="3 3" strokeWidth="0.8" />
                      <SvgText x="4" y="34" fontSize="10" fill={themeColors.textMuted}>{`${maxDayPct.toFixed(1)}%`}</SvgText>
                      <SvgText x="4" y="116" fontSize="10" fill={themeColors.textMuted}>0.00%</SvgText>
                      <SvgText x="4" y="198" fontSize="10" fill={themeColors.textMuted}>{`${(-maxDayPct).toFixed(1)}%`}</SvgText>
                      {perfRows.map((item, index) => {
                        const pct = Number(item.dayPct || 0);
                        const isUp = pct >= 0;
                        const slot = 266 / perfRows.length;
                        const barW = Math.max(20, slot * 0.55);
                        const x = 34 + index * slot + (slot - barW) / 2;
                        const h = (Math.abs(pct) / maxDayPct) * 84;
                        const y = isUp ? 112 - h : 112;

                        return (
                          <React.Fragment key={item.id}>
                            <Rect
                              x={x}
                              y={y}
                              width={barW}
                              height={Math.max(2, h)}
                              rx="3"
                              fill={isUp ? '#16a34a' : '#dc2626'}
                            />
                            <SvgText
                              x={x + barW / 2}
                              y="210"
                              fontSize="10"
                              textAnchor="middle"
                              fill={themeColors.textPrimary}
                            >
                              {item.symbol}
                            </SvgText>
                          </React.Fragment>
                        );
                      })}
                    </Svg>
                  </View>
                )}
                {perfRows.map((item) => {
                  const pct = Number(item.dayPct || 0);
                  return (
                    <View key={item.id} style={styles.analyticsRow}>
                      <AppText style={styles.metric}>{item.symbol}</AppText>
                      <AppText style={[styles.metric, pct >= 0 ? styles.up : styles.down]}>{fmtPct(pct)}</AppText>
                    </View>
                  );
                })}

                <AppText style={styles.analyticsTitle} weight="semiBold">Portfolio Value</AppText>
                <View style={styles.chartBox}>
                  <Svg width="100%" height={220} viewBox="0 0 320 220">
                    <Line x1="34" y1="20" x2="34" y2="184" stroke={themeColors.border} strokeWidth="1" />
                    <Line x1="34" y1="184" x2="300" y2="184" stroke={themeColors.border} strokeWidth="1" />
                    <Line x1="34" y1="20" x2="300" y2="20" stroke={themeColors.border} strokeDasharray="3 3" strokeWidth="0.8" />
                    <Line x1="34" y1="102" x2="300" y2="102" stroke={themeColors.border} strokeDasharray="3 3" strokeWidth="0.8" />
                    <Line x1="34" y1="184" x2="300" y2="184" stroke={themeColors.border} strokeDasharray="3 3" strokeWidth="0.8" />
                    <SvgText x="2" y="24" fontSize="10" fill={themeColors.textMuted}>{Math.round(valueMax).toString()}</SvgText>
                    <SvgText x="2" y="106" fontSize="10" fill={themeColors.textMuted}>{Math.round(valueMax / 2).toString()}</SvgText>
                    <SvgText x="2" y="188" fontSize="10" fill={themeColors.textMuted}>0</SvgText>
                    <Polygon
                      points={valueSeries
                        .map((p, i) => {
                          const x = 34 + (266 / (valueSeries.length - 1)) * i;
                          const y = 184 - (p.value / valueMax) * 164;
                          return `${x},${y}`;
                        })
                        .concat(['300,184', '34,184'])
                        .join(' ')}
                      fill="rgba(37,99,235,0.20)"
                    />
                    <Polyline
                      points={valueSeries
                        .map((p, i) => {
                          const x = 34 + (266 / (valueSeries.length - 1)) * i;
                          const y = 184 - (p.value / valueMax) * 164;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    {valueSeries.map((p, i) => {
                      const x = 34 + (266 / (valueSeries.length - 1)) * i;
                      return (
                        <SvgText key={p.label} x={x} y="202" fontSize="10" textAnchor="middle" fill={themeColors.textMuted}>
                          {p.label}
                        </SvgText>
                      );
                    })}
                  </Svg>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <BottomTabs activeRoute="Portfolio" navigation={navigation} />
      </GradientBackground>
    </View>
  );
};

const createStyles = (colors, isCompact, isTablet) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 6 : 12,
      paddingBottom: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: { color: colors.textPrimary, fontSize: isCompact ? 20 : 24 },
    subtitle: { color: colors.textMuted, fontSize: 12 },
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
    content: { paddingHorizontal: 12, paddingBottom: 110, gap: 12 },

    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    summaryCard: {
      flexBasis: isTablet ? '32%' : isCompact ? '100%' : '48%',
      flexGrow: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 10,
      gap: 4,
    },
    summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    summaryLabel: { color: colors.textMuted, fontSize: 11 },
    summaryValue: { color: colors.textPrimary, fontSize: isCompact ? 18 : 20 },
    summarySub: { fontSize: 11 },

    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 10,
      gap: 9,
    },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { color: colors.textPrimary, fontSize: 15 },

    inputShell: {
      minHeight: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 10,
    },
    inputNoBorder: { flex: 1, color: colors.textPrimary, fontSize: 14, paddingVertical: 8 },
    input: {
      minHeight: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      color: colors.textPrimary,
      fontSize: 14,
    },

    inlineFields: { flexDirection: isCompact ? 'column' : 'row', gap: 8 },
    fieldCell: { flex: 1 },
    fieldCellBtn: { minWidth: isCompact ? '100%' : 88 },

    primaryBtn: {
      minHeight: 40,
      borderRadius: 10,
      backgroundColor: '#1d4ed8',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 10,
    },
    primaryBtnSmall: {
      flex: 1,
      minHeight: 36,
      borderRadius: 8,
      backgroundColor: '#1d4ed8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 12 },

    secondaryBtn: {
      flex: 1,
      minHeight: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: { color: colors.textPrimary, fontSize: 12 },

    suggestionBox: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
      marginTop: -2,
    },
    suggestionRow: {
      minHeight: 34,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 10,
    },
    suggestionSym: { color: colors.textPrimary, fontSize: 12, width: 58 },
    suggestionName: { color: colors.textMuted, fontSize: 12, flex: 1 },

    sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    sortChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      backgroundColor: colors.surfaceAlt,
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
    },
    sortChipActive: { borderColor: '#1d4ed8', backgroundColor: 'rgba(29,78,216,0.12)' },
    sortText: { color: colors.textPrimary, fontSize: 11 },

    rowGap: { gap: 8 },
    positionCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 10,
      backgroundColor: colors.surfaceAlt,
      gap: 8,
    },
    positionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    headLeft: { flex: 1 },
    headActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionIcon: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    symbol: { color: colors.textPrimary, fontSize: 15 },
    name: { color: colors.textMuted, fontSize: 12, maxWidth: isTablet ? 340 : 190 },

    metricGrid: { gap: 6 },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surfaceGlass,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    metricLabel: { color: colors.textMuted, fontSize: 12 },
    metricValue: { color: colors.textPrimary, fontSize: 12 },
    metric: {
      color: colors.textPrimary,
      fontSize: 12,
    },

    panel: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 8,
      gap: 8,
    },
    panelTitle: { color: colors.textPrimary, fontSize: 13 },
    inputLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 5 },
    inputHalf: { flex: 1 },

    analyticsTabs: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    tabBtn: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tabBtnActive: { borderColor: '#1d4ed8', backgroundColor: 'rgba(29,78,216,0.12)' },
    tabText: { color: colors.textPrimary, fontSize: 12 },

    analyticsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 6,
    },
    analyticsPanel: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surfaceAlt,
      padding: 10,
      gap: 10,
    },
    analyticsTitle: { color: colors.textPrimary, fontSize: 14 },
    chartWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    chartBox: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.surfaceGlass,
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    analyticsStack: { gap: 6 },
    barTrack: {
      height: 8,
      width: '100%',
      borderRadius: 999,
      backgroundColor: colors.surfaceGlass,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 999,
    },
    legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },

    empty: { color: colors.textMuted, fontSize: 12, paddingVertical: 8 },
    up: { color: '#16a34a' },
    down: { color: '#dc2626' },
  });

export default Portfolio;
