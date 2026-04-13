import React, { useMemo } from 'react';
import { PanResponder, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg from 'react-native-svg';
import AppText from '../components/AppText';
import type { DrawingEngine } from './useDrawingEngine';
import type { PlotRect, ScaleContract } from './types';
import { draftToShape, renderDraft, renderSelectionHandles, renderShape } from './shapeRenderers';

export type DrawingOverlayProps = {
  engine: DrawingEngine;
  scales: ScaleContract;
  plotRect: PlotRect;
  allowTextEditor?: boolean;
  handleRadius?: number;
  theme?: {
    editorBg?: string;
    editorBorder?: string;
    inputBg?: string;
    inputBorder?: string;
    inputText?: string;
    placeholderText?: string;
    cancelBg?: string;
    saveBg?: string;
    buttonText?: string;
  };
};

export const DrawingOverlay = ({
  engine,
  scales,
  plotRect,
  allowTextEditor = true,
  handleRadius = 5,
  theme,
}: DrawingOverlayProps) => {
  const palette = {
    editorBg: theme?.editorBg ?? 'rgba(8,16,28,0.95)',
    editorBorder: theme?.editorBorder ?? 'rgba(255,255,255,0.14)',
    inputBg: theme?.inputBg ?? 'transparent',
    inputBorder: theme?.inputBorder ?? 'rgba(255,255,255,0.18)',
    inputText: theme?.inputText ?? '#f8fafc',
    placeholderText: theme?.placeholderText ?? '#8ca1ba',
    cancelBg: theme?.cancelBg ?? 'rgba(255,255,255,0.1)',
    saveBg: theme?.saveBg ?? '#4da3ff',
    buttonText: theme?.buttonText ?? '#f8fafc',
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !engine.textEdit,
        onMoveShouldSetPanResponder: () => !engine.textEdit,




        onPanResponderGrant: (evt) => {
          engine.onPointerDown(evt.nativeEvent.locationX, evt.nativeEvent.locationY, Date.now());
        },
        onPanResponderMove: (evt) => {
          engine.onPointerMove(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderRelease: (evt) => {
          engine.onPointerUp(evt.nativeEvent.locationX, evt.nativeEvent.locationY, Date.now());
        },
        onPanResponderTerminate: (evt) => {
          engine.onPointerUp(evt.nativeEvent.locationX, evt.nativeEvent.locationY, Date.now());
        },
      }),
    [engine],
  );

  const selectedShape = engine.selectedShape;
  const draftShape = engine.draft ? draftToShape(engine.draft, engine.style) : null;
  const editorWidth = Math.max(140, Math.min(220, plotRect.width - 24));
  const rawEditorLeft = scales.xToPx(engine.textEdit?.point.x ?? 0);
  const editorLeft = Math.max(
    plotRect.left + 6,
    Math.min(rawEditorLeft, plotRect.left + plotRect.width - editorWidth - 6),
  );
  const rawEditorTop = scales.yToPx(engine.textEdit?.point.y ?? 0) - 46;
  const editorTop = Math.max(plotRect.top + 6, Math.min(rawEditorTop, plotRect.top + plotRect.height - 94));

  return (
    <View pointerEvents={engine.textEdit ? 'box-none' : 'box-only'} style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
      <Svg width="100%" height="100%">
        {engine.shapes.map((shape) => renderShape(shape, { scales, plotRect, handleRadius }))}
        {renderDraft(draftShape, { scales, plotRect, handleRadius })}
        {renderSelectionHandles(selectedShape, { scales, plotRect, handleRadius })}
      </Svg>

      {allowTextEditor && engine.textEdit ? (
        <View
          style={[
            styles.editorWrap,
            {
              left: editorLeft,
              top: editorTop,
              width: editorWidth,
              backgroundColor: palette.editorBg,
              borderColor: palette.editorBorder,
            },
          ]}
        >
          <TextInput
            value={engine.textEdit.value}
            onChangeText={engine.updateTextEdit}
            placeholder="Label text"
            placeholderTextColor={palette.placeholderText}
            style={[
              styles.input,
              {
                color: palette.inputText,
                borderColor: palette.inputBorder,
                backgroundColor: palette.inputBg,
              },
            ]}
            autoFocus
          />
          <View style={styles.editorActions}>
            <Pressable onPress={engine.cancelTextEdit} style={[styles.cancelBtn, { backgroundColor: palette.cancelBg }]}>
              <AppText style={[styles.btnText, { color: palette.buttonText }]}>Cancel</AppText>
            </Pressable>
            <Pressable onPress={engine.commitTextEdit} style={[styles.saveBtn, { backgroundColor: palette.saveBg }]}>
              <AppText style={[styles.btnText, { color: palette.buttonText }]}>Save</AppText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  editorWrap: {
    position: 'absolute',
    width: 180,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    minHeight: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    fontFamily: 'NotoSans-Regular',
    fontSize: 12,
  },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'NotoSans-SemiBold',
    fontSize: 11,
  },
});
