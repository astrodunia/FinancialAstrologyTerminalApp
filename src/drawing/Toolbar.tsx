import React, { useMemo, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import {
  ArrowDown,
  ArrowUp,
  Circle,
  EllipsisVertical,
  Eraser,
  FunctionSquare,
  Hexagon,
  Infinity,
  Lock,
  LockOpen,
  Minus,
  MoveHorizontal,
  MoveVertical,
  MousePointer2,
  Pencil,
  RectangleHorizontal,
  Redo2,
  Route,
  Settings2,
  Send,
  Trash2,
  TrendingUp,
  Type,
  Undo2,
  Copy,
} from 'lucide-react-native';
import type { DrawingTool } from './types';

const TOOL_ORDER: DrawingTool[] = [
  'select',
  'segment',
  'ray',
  'xline',
  'hline',
  'vline',
  'rect',
  'ellipse',
  'label',
  'arrow',
  'channel',
  'fib',
  'path',
  'polygon',
];

const LABELS: Record<DrawingTool, string> = {
  select: 'Select',
  segment: 'Segment',
  ray: 'Ray',
  xline: 'XLine',
  hline: 'HLine',
  vline: 'VLine',
  rect: 'Rect',
  ellipse: 'Ellipse',
  label: 'Label',
  arrow: 'Arrow',
  channel: 'Channel',
  fib: 'Fib',
  path: 'Path',
  polygon: 'Polygon',
};

const ICONS: Record<DrawingTool, any> = {
  select: MousePointer2,
  segment: Minus,
  ray: TrendingUp,
  xline: Infinity,
  hline: MoveHorizontal,
  vline: MoveVertical,
  rect: RectangleHorizontal,
  ellipse: Circle,
  label: Type,
  arrow: ArrowUp,
  channel: Route,
  fib: FunctionSquare,
  path: Pencil,
  polygon: Hexagon,
};

export type DrawingToolbarProps = {
  activeTool: DrawingTool;
  readOnly?: boolean;
  disabledTools?: DrawingTool[];
  vertical?: boolean;
  compact?: boolean;
  theme?: {
    panelBg?: string;
    panelBorder?: string;
    toolBg?: string;
    toolText?: string;
    toolActiveBg?: string;
    toolActiveText?: string;
    actionBg?: string;
    actionText?: string;
    scrollBg?: string;
    scrollText?: string;
    dangerBg?: string;
    dangerBorder?: string;
    dangerIcon?: string;
    dangerDisabledBg?: string;
    dangerDisabledIcon?: string;
  };
  onToolChange: (tool: DrawingTool) => void;
  onClear: () => void;
  onShare?: () => void;
  onDeleteSelected?: () => void;
  canDelete?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onDuplicate?: () => void;
  canDuplicate?: boolean;
  onToggleLock?: () => void;
  canToggleLock?: boolean;
  isLocked?: boolean;
  onSettings?: () => void;
};

export const DrawingToolbar = ({
  activeTool,
  readOnly = false,
  disabledTools = [],
  vertical = false,
  compact = false,
  theme,
  onToolChange,
  onClear,
  onShare,
  onDeleteSelected,
  canDelete = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onDuplicate,
  canDuplicate = false,
  onToggleLock,
  canToggleLock = false,
  isLocked = false,
  onSettings,
}: DrawingToolbarProps) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const tools = useMemo(() => TOOL_ORDER, []);
  const [showAllTools, setShowAllTools] = React.useState(false);

  const scrollStep = useMemo(() => (vertical ? 220 : 280), [vertical]);
  const palette = {
    panelBg: theme?.panelBg ?? 'rgba(12,19,31,0.92)',
    panelBorder: theme?.panelBorder ?? 'rgba(255,255,255,0.12)',
    toolBg: theme?.toolBg ?? 'rgba(255,255,255,0.08)',
    toolText: theme?.toolText ?? '#dbeafe',
    toolActiveBg: theme?.toolActiveBg ?? '#4da3ff',
    toolActiveText: theme?.toolActiveText ?? '#081322',
    actionBg: theme?.actionBg ?? 'rgba(255,255,255,0.12)',
    actionText: theme?.actionText ?? '#eff6ff',
    scrollBg: theme?.scrollBg ?? 'rgba(255,255,255,0.08)',
    scrollText: theme?.scrollText ?? '#bfdbfe',
    dangerBg: theme?.dangerBg ?? '#ef4444',
    dangerBorder: theme?.dangerBorder ?? '#dc2626',
    dangerIcon: theme?.dangerIcon ?? '#ffffff',
    dangerDisabledBg: theme?.dangerDisabledBg ?? 'rgba(148,163,184,0.25)',
    dangerDisabledIcon: theme?.dangerDisabledIcon ?? 'rgba(255,255,255,0.75)',
  };

  if (compact) {
    return (
      <>
        <View style={[styles.compactWrap, { backgroundColor: palette.panelBg, borderColor: palette.panelBorder }]}>
          <View style={styles.compactGroup}>
            <Pressable
              style={[styles.compactBtn, { backgroundColor: activeTool === 'select' ? palette.toolActiveBg : palette.toolBg }]}
              onPress={() => onToolChange('select')}
              accessibilityRole="button"
              accessibilityLabel="Cursor tool"
            >
              <MousePointer2 size={16} color={activeTool === 'select' ? palette.toolActiveText : palette.toolText} />
            </Pressable>
            <Pressable
              style={[
                styles.compactBtn,
                { backgroundColor: palette.toolBg },
                (!onUndo || !canUndo || readOnly) && styles.toolBtnDisabled,
              ]}
              onPress={onUndo}
              disabled={!onUndo || !canUndo || readOnly}
              accessibilityRole="button"
              accessibilityLabel="Undo"
            >
              <Undo2 size={16} color={palette.toolText} />
            </Pressable>
            <Pressable
              style={[
                styles.compactBtn,
                { backgroundColor: palette.toolBg },
                (!onRedo || !canRedo || readOnly) && styles.toolBtnDisabled,
              ]}
              onPress={onRedo}
              disabled={!onRedo || !canRedo || readOnly}
              accessibilityRole="button"
              accessibilityLabel="Redo"
            >
              <Redo2 size={16} color={palette.toolText} />
            </Pressable>
            <Pressable
              style={[styles.compactBtn, { backgroundColor: palette.actionBg }]}
              onPress={() => setShowAllTools(true)}
              accessibilityRole="button"
              accessibilityLabel="Open drawing tools"
            >
              <EllipsisVertical size={16} color={palette.actionText} />
            </Pressable>
          </View>
          {onDeleteSelected ? (
            <View style={styles.compactDeleteWrap}>
              <View style={[styles.compactDivider, { backgroundColor: palette.panelBorder }]} />
              <Pressable
                style={[
                  styles.compactBtn,
                  styles.compactDeleteBtn,
                  {
                    backgroundColor: canDelete ? palette.dangerBg : palette.dangerDisabledBg,
                    borderColor: canDelete ? palette.dangerBorder : 'transparent',
                  },
                ]}
                onPress={onDeleteSelected}
                disabled={!canDelete}
                accessibilityRole="button"
                accessibilityLabel="Delete all drawings"
              >
                <Trash2 size={17} color={canDelete ? palette.dangerIcon : palette.dangerDisabledIcon} />
              </Pressable>
            </View>
          ) : null}
        </View>

        <Modal visible={showAllTools} transparent animationType="fade" onRequestClose={() => setShowAllTools(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAllTools(false)}>
            <Pressable
              onPress={(evt) => evt.stopPropagation()}
              style={[styles.modalCard, { backgroundColor: palette.panelBg, borderColor: palette.panelBorder }]}
            >
              <View style={styles.modalGrid}>
                {tools.map((tool) => {
                  const disabled = readOnly || disabledTools.includes(tool);
                  const active = activeTool === tool;
                  const Icon = ICONS[tool];
                  return (
                    <Pressable
                      key={`modal-${tool}`}
                      disabled={disabled}
                      style={[
                        styles.modalToolBtn,
                        { backgroundColor: palette.toolBg },
                        active && { backgroundColor: palette.toolActiveBg },
                        disabled && styles.toolBtnDisabled,
                      ]}
                      onPress={() => {
                        onToolChange(tool);
                        setShowAllTools(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={LABELS[tool]}
                    >
                      <Icon size={16} color={active ? palette.toolActiveText : palette.toolText} />
                      <AppText style={[styles.modalToolText, { color: active ? palette.toolActiveText : palette.toolText }]}>
                        {LABELS[tool]}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                {onDuplicate ? (
                  <Pressable
                    style={[styles.modalActionBtn, { backgroundColor: palette.actionBg }, !canDuplicate && styles.toolBtnDisabled]}
                    onPress={onDuplicate}
                    disabled={!canDuplicate}
                    accessibilityRole="button"
                    accessibilityLabel="Duplicate selected drawing"
                  >
                    <Copy size={15} color={palette.actionText} />
                  </Pressable>
                ) : null}
                {onToggleLock ? (
                  <Pressable
                    style={[styles.modalActionBtn, { backgroundColor: palette.actionBg }, !canToggleLock && styles.toolBtnDisabled]}
                    onPress={onToggleLock}
                    disabled={!canToggleLock}
                    accessibilityRole="button"
                    accessibilityLabel={isLocked ? 'Unlock selected drawing' : 'Lock selected drawing'}
                  >
                    {isLocked ? <LockOpen size={15} color={palette.actionText} /> : <Lock size={15} color={palette.actionText} />}
                  </Pressable>
                ) : null}
                <Pressable
                  style={[styles.modalActionBtn, { backgroundColor: palette.actionBg }, readOnly && styles.toolBtnDisabled]}
                  onPress={onClear}
                  disabled={readOnly}
                  accessibilityRole="button"
                  accessibilityLabel="Clear drawings"
                >
                  <Eraser size={15} color={palette.actionText} />
                </Pressable>
                {onShare ? (
                  <Pressable
                    style={[styles.modalActionBtn, { backgroundColor: palette.actionBg }]}
                    onPress={onShare}
                    accessibilityRole="button"
                    accessibilityLabel="Share drawings"
                  >
                    <Send size={15} color={palette.actionText} />
                  </Pressable>
                ) : null}
                {onSettings ? (
                  <Pressable
                    style={[styles.modalActionBtn, { backgroundColor: palette.actionBg }]}
                    onPress={onSettings}
                    accessibilityRole="button"
                    accessibilityLabel="Drawing settings"
                  >
                    <Settings2 size={15} color={palette.actionText} />
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        vertical ? styles.verticalWrap : styles.horizontalWrap,
        { backgroundColor: palette.panelBg, borderColor: palette.panelBorder },
      ]}
    >
      {vertical ? (
        <Pressable
          style={[styles.scrollBtn, { backgroundColor: palette.scrollBg }]}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Scroll tools up"
        >
          <ArrowUp size={14} color={palette.scrollText} />
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollRef}
        horizontal={!vertical}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.toolsList, vertical ? styles.toolsVertical : styles.toolsHorizontal]}
      >
        {tools.map((tool) => {
          const disabled = readOnly || disabledTools.includes(tool);
          const active = activeTool === tool;
          const Icon = ICONS[tool];
          return (
            <Pressable
              key={tool}
              disabled={disabled}
              style={[
                styles.toolBtn,
                { backgroundColor: palette.toolBg },
                active && { backgroundColor: palette.toolActiveBg },
                disabled && styles.toolBtnDisabled,
              ]}
              onPress={() => onToolChange(tool)}
              accessibilityRole="button"
              accessibilityLabel={LABELS[tool]}
            >
              <Icon size={16} color={active ? palette.toolActiveText : palette.toolText} />
            </Pressable>
          );
        })}
      </ScrollView>

      {vertical ? (
        <Pressable
          style={[styles.scrollBtn, { backgroundColor: palette.scrollBg }]}
          onPress={() => scrollRef.current?.scrollTo({ y: scrollStep, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="Scroll tools down"
        >
          <ArrowDown size={14} color={palette.scrollText} />
        </Pressable>
      ) : null}

      <View style={[styles.actions, vertical ? styles.actionsVertical : styles.actionsHorizontal]}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: palette.actionBg }, readOnly && styles.toolBtnDisabled]}
          onPress={onClear}
          disabled={readOnly}
          accessibilityRole="button"
          accessibilityLabel="Clear drawings"
        >
          <Eraser size={15} color={palette.actionText} />
        </Pressable>
        {onShare ? (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: palette.actionBg }]}
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Share drawings"
          >
            <Send size={15} color={palette.actionText} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  compactWrap: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'nowrap',
  },
  compactGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDeleteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactDivider: {
    width: 1,
    height: 18,
    opacity: 0.85,
  },
  compactDeleteBtn: {
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalToolBtn: {
    width: 64,
    minHeight: 58,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  modalToolText: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    fontFamily: 'NotoSans-Medium',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    gap: 8,
  },
  horizontalWrap: {
    width: '100%',
  },
  verticalWrap: {
    width: 130,
    maxHeight: 420,
  },
  toolsList: {
    gap: 8,
  },
  toolsHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolsVertical: {
    flexDirection: 'column',
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnDisabled: {
    opacity: 0.4,
  },
  actions: {
    gap: 8,
  },
  actionsHorizontal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionsVertical: {
    flexDirection: 'column',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBtn: {
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
