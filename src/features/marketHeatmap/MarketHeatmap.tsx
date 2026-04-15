import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { hierarchy, treemap, treemapBinary, type HierarchyRectangularNode } from 'd3-hierarchy';
import {
  CircleDollarSign,
  Flame,
  HeartPulse,
  HelpCircle,
  Landmark,
  MonitorSmartphone,
  X,
} from 'lucide-react-native';
import AppText from '../../components/AppText';
import { useUser } from '../../store/UserContext';
import { HEATMAP_LEGEND_SECTORS } from './color';
import { getHeatmapTileColors } from './color';
import type { HeatmapQuote, HeatmapSector } from './types';

const MIN_TILE_LABEL_WIDTH = 52;
const MIN_TILE_LABEL_HEIGHT = 42;
const MIN_TILE_NAME_WIDTH = 92;
const MIN_TILE_NAME_HEIGHT = 78;

const formatPct = (value: number) => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const formatPrice = (value: number | null) => {
  if (value == null || Number.isNaN(value)) return '--';
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const SECTOR_ICONS: Record<HeatmapSector, React.ComponentType<any>> = {
  Technology: MonitorSmartphone,
  Financial: Landmark,
  Healthcare: HeartPulse,
  Energy: Flame,
  Consumer: CircleDollarSign,
};

type Props = {
  items: HeatmapQuote[];
  loading: boolean;
  error?: string;
  onPressSymbol: (symbol: string) => void;
  onRetry?: () => void;
};

type TileLayout = HeatmapQuote & {
  x: number;
  y: number;
  width: number;
  height: number;
};

const HeatmapSkeleton = ({ styles }: { styles: any }) => (
  <View style={styles.skeletonWrap}>
    <View style={[styles.skeletonTile, styles.skeletonLarge]} />
    <View style={styles.skeletonRow}>
      <View style={[styles.skeletonTile, styles.skeletonMedium]} />
      <View style={[styles.skeletonTile, styles.skeletonMedium]} />
    </View>
    <View style={styles.skeletonRow}>
      <View style={[styles.skeletonTile, styles.skeletonSmall]} />
      <View style={[styles.skeletonTile, styles.skeletonSmall]} />
      <View style={[styles.skeletonTile, styles.skeletonSmall]} />
    </View>
  </View>
);

export default function MarketHeatmap({ items, loading, error, onPressSymbol, onRetry }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const { theme, themeColors } = useUser() as any;
  const [helpVisible, setHelpVisible] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<HeatmapQuote | null>(null);
  const heatmapWidth = Math.max(280, screenWidth - 56);
  const heatmapHeight = Math.max(340, Math.round(heatmapWidth * 0.7));
  const styles = useMemo(() => createStyles(heatmapHeight, themeColors, theme), [heatmapHeight, themeColors, theme]);

  const layouts = useMemo<TileLayout[]>(() => {
    if (!items.length) return [];

    const rootInput = hierarchy({
      name: 'root',
      children: items.map((item) => ({
        ...item,
        name: item.symbol,
        value: typeof item.size === 'number' && Number.isFinite(item.size) && item.size > 0 ? item.size : 1,
      })),
    } as any)
      .sum((node: any) => (typeof node.value === 'number' && Number.isFinite(node.value) && node.value > 0 ? node.value : 1))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const root = treemap<any>()
      .tile(treemapBinary)
      .size([heatmapWidth, heatmapHeight])
      .paddingOuter(0)
      .paddingInner(0)
      .round(true)(rootInput) as HierarchyRectangularNode<any>;

    return root
      .leaves()
      .map((leaf) => ({
        ...(leaf.data as HeatmapQuote),
        x: leaf.x0,
        y: leaf.y0,
        width: Math.max(0, leaf.x1 - leaf.x0),
        height: Math.max(0, leaf.y1 - leaf.y0),
      }))
      .filter((leaf) => leaf.width > 0 && leaf.height > 0);
  }, [heatmapHeight, heatmapWidth, items]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <AppText style={styles.title}>Stock Heatmap</AppText>
          <AppText style={styles.subtitle}>Colors show percentage move. Tile size tracks activity.</AppText>
        </View>
        <Pressable style={styles.infoButton} onPress={() => setHelpVisible(true)}>
          <HelpCircle size={16} color={themeColors.textMuted} />
        </Pressable>
      </View>

      {loading && !items.length ? (
        <HeatmapSkeleton styles={styles} />
      ) : error && !items.length ? (
        <View style={styles.centerState}>
          <AppText style={styles.errorText}>{error}</AppText>
          {onRetry ? (
            <Pressable style={styles.retryButton} onPress={onRetry}>
              <AppText style={styles.retryText}>Retry</AppText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={[styles.heatmapFrame, { height: heatmapHeight }]}>
          <Svg width={heatmapWidth} height={heatmapHeight} style={styles.svgBase}>
            {layouts.map((tile) => {
              const colors = getHeatmapTileColors(tile.change, tile.astroStrength);

              return (
                <React.Fragment key={`svg-${tile.symbol}`}>
                  <Rect
                    x={tile.x}
                    y={tile.y}
                    width={tile.width}
                    height={tile.height}
                    fill={colors.fill}
                  />
                  <Rect
                    x={tile.x}
                    y={tile.y}
                    width={tile.width}
                    height={tile.height}
                    fill="none"
                    stroke={colors.border}
                    strokeWidth={0}
                  />
                  {colors.glow ? (
                    <Rect
                      x={tile.x + 1}
                      y={tile.y + 1}
                      width={Math.max(0, tile.width - 2)}
                      height={Math.max(0, tile.height - 2)}
                      fill="none"
                      stroke={colors.glow}
                      strokeWidth={1.4}
                      opacity={0.7}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </Svg>

          {layouts.map((tile) => {
            const colors = getHeatmapTileColors(tile.change, tile.astroStrength);
            const showName = tile.width >= MIN_TILE_NAME_WIDTH && tile.height >= MIN_TILE_NAME_HEIGHT;
            const compact = tile.width < MIN_TILE_LABEL_WIDTH || tile.height < MIN_TILE_LABEL_HEIGHT;
            const SectorIcon = SECTOR_ICONS[tile.sector];

            return (
              <Pressable
                key={tile.symbol}
                style={[
                  styles.tilePressable,
                  {
                    left: tile.x,
                    top: tile.y,
                    width: tile.width,
                    height: tile.height,
                  },
                ]}
                onPress={() => onPressSymbol(tile.symbol)}
                onLongPress={() => setSelectedSymbol(tile)}
                delayLongPress={220}
              >
                <View style={styles.tileInner}>
                  {compact ? (
                    <View style={styles.compactTile}>
                      <SectorIcon size={14} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.centeredContent}>
                      <AppText
                        numberOfLines={1}
                        style={[
                          styles.tileTicker,
                          tile.width > 180 && tile.height > 130 ? styles.tileTickerLarge : null,
                          { color: colors.text },
                        ]}
                      >
                        {tile.symbol}
                      </AppText>
                      {showName ? (
                        <AppText numberOfLines={1} style={[styles.tileName, { color: colors.subtext }]}>
                          {tile.name}
                        </AppText>
                      ) : null}
                      <AppText
                        style={[
                          styles.tileChange,
                          tile.width > 180 && tile.height > 130 ? styles.tileChangeLarge : null,
                          { color: colors.text },
                        ]}
                      >
                        {formatPct(tile.change)}
                      </AppText>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.legendWrap}>
        <View style={styles.scaleRow}>
          <View style={[styles.scaleBlock, styles.scaleDeepRed]} />
          <View style={[styles.scaleBlock, styles.scaleRed]} />
          <View style={[styles.scaleBlock, styles.scaleNeutral]} />
          <View style={[styles.scaleBlock, styles.scaleGreen]} />
          <View style={[styles.scaleBlock, styles.scaleDeepGreen]} />
        </View>
        <View style={styles.scaleLabels}>
          <AppText style={styles.legendText}>-3%+</AppText>
          <AppText style={styles.legendText}>-1%</AppText>
          <AppText style={styles.legendText}>0%</AppText>
          <AppText style={styles.legendText}>+1%</AppText>
          <AppText style={styles.legendText}>+3%+</AppText>
        </View>

        <View style={styles.sectorLegendRow}>
          {HEATMAP_LEGEND_SECTORS.map((item) => (
            <View key={item.sector} style={styles.sectorLegendItem}>
              <View style={[styles.sectorDot, { backgroundColor: item.color }]} />
              <AppText style={styles.sectorLegendText}>{item.sector}</AppText>
            </View>
          ))}
        </View>
      </View>

      <Modal
        visible={helpVisible || Boolean(selectedSymbol)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setHelpVisible(false);
          setSelectedSymbol(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <AppText style={styles.sheetTitle}>
                {selectedSymbol ? selectedSymbol.symbol : 'How this heatmap works'}
              </AppText>
              <Pressable
                style={styles.closeButton}
                onPress={() => {
                  setHelpVisible(false);
                  setSelectedSymbol(null);
                }}
              >
                <X size={16} color={themeColors.textMuted} />
              </Pressable>
            </View>

            {selectedSymbol ? (
              <>
                <AppText style={styles.sheetBodyText}>{selectedSymbol.name}</AppText>
                <View style={styles.sheetInfoGrid}>
                  <View style={styles.sheetInfoPill}>
                    <AppText style={styles.sheetInfoLabel}>Sector</AppText>
                    <AppText style={styles.sheetInfoValue}>{selectedSymbol.sector}</AppText>
                  </View>
                  <View style={styles.sheetInfoPill}>
                    <AppText style={styles.sheetInfoLabel}>Astro</AppText>
                    <AppText style={styles.sheetInfoValue}>{selectedSymbol.astroStrength.toFixed(1)}</AppText>
                  </View>
                  <View style={styles.sheetInfoPill}>
                    <AppText style={styles.sheetInfoLabel}>Price</AppText>
                    <AppText style={styles.sheetInfoValue}>{formatPrice(selectedSymbol.price)}</AppText>
                  </View>
                  <View style={styles.sheetInfoPill}>
                    <AppText style={styles.sheetInfoLabel}>Move</AppText>
                    <AppText style={styles.sheetInfoValue}>{formatPct(selectedSymbol.change)}</AppText>
                  </View>
                </View>
                <Pressable
                  style={styles.sheetAction}
                  onPress={() => {
                    setSelectedSymbol(null);
                    onPressSymbol(selectedSymbol.symbol);
                  }}
                >
                  <AppText style={styles.sheetActionText}>Open symbol details</AppText>
                </Pressable>
              </>
            ) : (
              <>
                <AppText style={styles.sheetBodyText}>
                  Tile size uses volume first, then price as fallback. Larger tiles represent more active stocks.
                </AppText>
                <AppText style={styles.sheetBodyText}>
                  Color reflects percentage move from prior close or session close. Red means down, green means up, and near-flat names look neutral.
                </AppText>
                <AppText style={styles.sheetBodyText}>
                  Long press any tile for quick details, or tap to open the full stock screen.
                </AppText>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (heatmapHeight: number, colors: any, theme: string) =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceGlass,
      padding: 12,
      shadowColor: '#000000',
      shadowOpacity: theme === 'dark' ? 0.18 : 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: theme === 'dark' ? 4 : 2,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      color: colors.textPrimary,
      fontFamily: 'NotoSans-ExtraBold',
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 11,
      lineHeight: 16,
      color: colors.textMuted,
      fontFamily: 'NotoSans-Regular',
      maxWidth: 250,
    },
    infoButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    heatmapFrame: {
      width: '100%',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      position: 'relative',
      marginBottom: 12,
    },
    svgBase: {
      ...StyleSheet.absoluteFillObject,
    },
    tilePressable: {
      position: 'absolute',
      padding: 0,
    },
    tileInner: {
      flex: 1,
    },
    centeredContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    compactTile: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileTicker: {
      fontSize: 16,
      lineHeight: 20,
      fontFamily: 'NotoSans-ExtraBold',
      textAlign: 'center',
      marginBottom: 4,
    },
    tileTickerLarge: {
      fontSize: 18,
      lineHeight: 22,
    },
    tileName: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: 'NotoSans-Regular',
      textAlign: 'center',
      marginBottom: 4,
    },
    tileChange: {
      fontSize: 13,
      lineHeight: 16,
      fontFamily: 'NotoSans-SemiBold',
      textAlign: 'center',
    },
    tileChangeLarge: {
      fontSize: 15,
      lineHeight: 18,
    },
    legendWrap: {
      gap: 8,
    },
    scaleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 8,
      borderRadius: 999,
      overflow: 'hidden',
    },
    scaleBlock: {
      flex: 1,
      height: 8,
    },
    scaleDeepRed: {
      backgroundColor: '#A81E2C',
    },
    scaleRed: {
      backgroundColor: '#EF6B77',
    },
    scaleNeutral: {
      backgroundColor: '#BFC4C9',
    },
    scaleGreen: {
      backgroundColor: '#47BF7D',
    },
    scaleDeepGreen: {
      backgroundColor: '#0C6D3A',
    },
    scaleLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    legendText: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: 'NotoSans-Regular',
    },
    sectorLegendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 2,
    },
    sectorLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    sectorLegendText: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: 'NotoSans-Regular',
    },
    centerState: {
      minHeight: heatmapHeight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    errorText: {
      fontSize: 12,
      color: colors.negative,
      textAlign: 'center',
      fontFamily: 'NotoSans-Regular',
    },
    retryButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.textPrimary,
    },
    retryText: {
      fontSize: 12,
      color: colors.background,
      fontFamily: 'NotoSans-SemiBold',
    },
    skeletonWrap: {
      gap: 0,
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
    },
    skeletonRow: {
      flexDirection: 'row',
      gap: 0,
    },
    skeletonTile: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 0.5,
      borderColor: colors.surface,
    },
    skeletonLarge: {
      height: 128,
      width: '100%',
    },
    skeletonMedium: {
      flex: 1,
      height: 112,
    },
    skeletonSmall: {
      flex: 1,
      height: 86,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(9, 20, 32, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    bottomSheet: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '80%',
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    sheetTitle: {
      fontSize: 16,
      color: colors.textPrimary,
      fontFamily: 'NotoSans-ExtraBold',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    sheetBodyText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textMuted,
      fontFamily: 'NotoSans-Regular',
    },
    sheetInfoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    sheetInfoPill: {
      minWidth: '47%',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sheetInfoLabel: {
      fontSize: 10,
      lineHeight: 12,
      color: colors.textMuted,
      fontFamily: 'NotoSans-Medium',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    sheetInfoValue: {
      fontSize: 13,
      lineHeight: 16,
      color: colors.textPrimary,
      fontFamily: 'NotoSans-SemiBold',
    },
    sheetAction: {
      marginTop: 4,
      borderRadius: 14,
      backgroundColor: colors.textPrimary,
      paddingHorizontal: 14,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetActionText: {
      color: colors.background,
      fontSize: 13,
      fontFamily: 'NotoSans-SemiBold',
    },
  });
