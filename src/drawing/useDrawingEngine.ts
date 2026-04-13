import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DataPoint,
  Draft,
  DragState,
  DrawingShape,
  DrawingTool,
  HandleDragState,
  PlotRect,
  ScaleContract,
  SharePayload,
  ShapeStyle,
  TextEditState,
} from './types';
import {
  DEFAULT_FIB_LEVELS,
  DEFAULT_STYLE,
  addPointIfFar,
  createId,
  hitTestHandle,
  hitTestTopShape,
  pxToDataPoint,
  translateShape,
  updateShapeHandle,
} from './utils';

type PointerMode = 'idle' | 'drag' | 'handle' | 'path';

type PointerSnapshot = {
  mode: PointerMode;
  downPx: { x: number; y: number };
  downAt: number;
  moved: boolean;
};

export type DrawingEngineOptions = {
  scales: ScaleContract;
  plotRect: PlotRect;
  initialShapes?: DrawingShape[];
  initialTool?: DrawingTool;
  defaultStyle?: Partial<ShapeStyle>;
  readOnly?: boolean;
  xDomain?: [number, number] | null;
  onChange?: (shapes: DrawingShape[]) => void;
  onShare?: (payload: SharePayload) => void;
};

export type DrawingEngine = {
  shapes: DrawingShape[];
  activeTool: DrawingTool;
  selectedId: string | null;
  draft: Draft | null;
  drag: DragState | null;
  handleDrag: HandleDragState | null;
  textEdit: TextEditState | null;
  readOnly: boolean;
  style: ShapeStyle;
  selectedShape: DrawingShape | null;
  selectedLocked: boolean;
  canUndo: boolean;
  canRedo: boolean;
  setActiveTool: (tool: DrawingTool) => void;
  setStyle: (next: Partial<ShapeStyle>) => void;
  setReadOnly: (value: boolean) => void;
  replaceShapes: (next: DrawingShape[]) => void;
  setSelectedId: (id: string | null) => void;
  updateShape: (shape: DrawingShape) => void;
  deleteSelected: () => void;
  clearAll: () => void;
  duplicateSelected: () => void;
  toggleSelectedLock: () => void;
  startTextEdit: (point: DataPoint, targetId?: string, initialValue?: string) => void;
  updateTextEdit: (value: string) => void;
  commitTextEdit: () => void;
  cancelTextEdit: () => void;
  undo: () => void;
  redo: () => void;
  share: () => void;
  onPointerDown: (x: number, y: number, timestamp?: number) => void;
  onPointerMove: (x: number, y: number) => void;
  onPointerUp: (x: number, y: number, timestamp?: number) => void;
};

const TAP_MAX_MS = 280;
const TAP_MOVE_PX = 8;
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_DIST = 20;

const isTwoClickTool = (tool: DrawingTool) =>
  tool === 'segment' ||
  tool === 'ray' ||
  tool === 'xline' ||
  tool === 'rect' ||
  tool === 'ellipse' ||
  tool === 'arrow' ||
  tool === 'fib';

const buildStyle = (style?: Partial<ShapeStyle>): ShapeStyle => ({
  ...DEFAULT_STYLE,
  ...(style || {}),
});

export const useDrawingEngine = ({
  scales,
  plotRect,
  initialShapes = [],
  initialTool = 'select',
  defaultStyle,
  readOnly: readOnlyProp = false,
  xDomain = null,
  onChange,
  onShare,
}: DrawingEngineOptions): DrawingEngine => {
  const [shapes, setShapes] = useState<DrawingShape[]>(initialShapes);
  const [activeTool, setActiveToolState] = useState<DrawingTool>(initialTool);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [handleDrag, setHandleDrag] = useState<HandleDragState | null>(null);
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(readOnlyProp);
  const [style, setStyleState] = useState<ShapeStyle>(buildStyle(defaultStyle));

  const pointerRef = useRef<PointerSnapshot | null>(null);
  const lastTapRef = useRef<{ at: number; x: number; y: number } | null>(null);
  const initializedFromInitialShapesRef = useRef(false);
  const historyPastRef = useRef<DrawingShape[][]>([]);
  const historyFutureRef = useRef<DrawingShape[][]>([]);
  const [historyTick, setHistoryTick] = useState(0);
  const gestureHistoryPushedRef = useRef(false);

  const bumpHistoryTick = useCallback(() => {
    setHistoryTick((value) => value + 1);
  }, []);

  const pushHistory = useCallback(
    (snapshot: DrawingShape[]) => {
      historyPastRef.current.push(snapshot);
      if (historyPastRef.current.length > 100) {
        historyPastRef.current.shift();
      }
      historyFutureRef.current = [];
      bumpHistoryTick();
    },
    [bumpHistoryTick],
  );

  const resetHistory = useCallback(() => {
    historyPastRef.current = [];
    historyFutureRef.current = [];
    bumpHistoryTick();
  }, [bumpHistoryTick]);

  const setShapesWithHistory = useCallback(
    (updater: (prev: DrawingShape[]) => DrawingShape[]) => {
      setShapes((prev) => {
        const next = updater(prev);
        if (next !== prev) pushHistory(prev);
        return next;
      });
    },
    [pushHistory],
  );

  useEffect(() => {
    if (initializedFromInitialShapesRef.current) return;
    setShapes(initialShapes);
    resetHistory();
    initializedFromInitialShapesRef.current = true;
  }, [initialShapes, resetHistory]);

  useEffect(() => {
    setReadOnly(readOnlyProp);
  }, [readOnlyProp]);

  useEffect(() => {
    onChange?.(shapes);
  }, [onChange, shapes]);

  const selectedShape = useMemo(
    () => (selectedId ? shapes.find((shape) => shape.id === selectedId) || null : null),
    [selectedId, shapes],
  );
  const selectedLocked = Boolean(selectedShape?.locked);

  const replaceShapes = useCallback((next: DrawingShape[]) => {
    setShapes(next);
    resetHistory();
  }, [resetHistory]);

  const setActiveTool = useCallback((tool: DrawingTool) => {
    setActiveToolState(tool);
    setDraft(null);
    setDrag(null);
    setHandleDrag(null);
  }, []);

  const setStyle = useCallback((next: Partial<ShapeStyle>) => {
    setStyleState((prev) => ({ ...prev, ...next }));
  }, []);

  const updateShape = useCallback((shape: DrawingShape, options?: { recordHistory?: boolean }) => {
    if (options?.recordHistory) {
      setShapesWithHistory((prev) => prev.map((item) => (item.id === shape.id ? shape : item)));
      return;
    }
    setShapes((prev) => prev.map((item) => (item.id === shape.id ? shape : item)));
  }, [setShapesWithHistory]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setShapesWithHistory((prev) => prev.filter((shape) => shape.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setShapesWithHistory]);

  const clearAll = useCallback(() => {
    setShapesWithHistory(() => []);
    setSelectedId(null);
    setDraft(null);
    setDrag(null);
    setHandleDrag(null);
    setTextEdit(null);
  }, [setShapesWithHistory]);

  const duplicateSelected = useCallback(() => {
    if (!selectedShape) return;
    const dx = scales.pxToX(plotRect.left + 18) - scales.pxToX(plotRect.left);
    const dy = scales.pxToY(plotRect.top + 18) - scales.pxToY(plotRect.top);
    const clone = translateShape(selectedShape, dx, dy);
    const duplicated: DrawingShape = {
      ...clone,
      id: createId(),
      locked: false,
    };
    setShapesWithHistory((prev) => [...prev, duplicated]);
    setSelectedId(duplicated.id);
  }, [plotRect.left, plotRect.top, scales, selectedShape, setShapesWithHistory]);

  const toggleSelectedLock = useCallback(() => {
    if (!selectedId) return;
    setShapesWithHistory((prev) =>
      prev.map((shape) => {
        if (shape.id !== selectedId) return shape;
        return { ...shape, locked: !shape.locked };
      }),
    );
  }, [selectedId, setShapesWithHistory]);

  const startTextEdit = useCallback((point: DataPoint, targetId?: string, initialValue = '') => {
    setTextEdit({ point, targetId, value: initialValue });
  }, []);

  const updateTextEdit = useCallback((value: string) => {
    setTextEdit((prev) => (prev ? { ...prev, value } : prev));
  }, []);

  const cancelTextEdit = useCallback(() => {
    setTextEdit(null);
  }, []);

  const commitTextEdit = useCallback(() => {
    setTextEdit((current) => {
      if (!current) return null;
      const text = current.value.trim();
      if (!text) return null;
      if (current.targetId) {
        setShapesWithHistory((prev) =>
          prev.map((shape) => {
            if (shape.id !== current.targetId || shape.type !== 'label') return shape;
            return { ...shape, text };
          }),
        );
      } else {
        const created: DrawingShape = {
          id: createId(),
          type: 'label',
          point: current.point,
          text,
          fontSize: 14,
          ...style,
        };
        setShapesWithHistory((prev) => [...prev, created]);
        setSelectedId(created.id);
      }
      return null;
    });
  }, [setShapesWithHistory, style]);

  const share = useCallback(() => {
    onShare?.({ shapes, xDomain });
  }, [onShare, shapes, xDomain]);

  const commitTwoPointShape = useCallback(
    (tool: 'segment' | 'ray' | 'xline' | 'rect' | 'ellipse' | 'arrow' | 'fib', a: DataPoint, b: DataPoint) => {
      const created: DrawingShape =
        tool === 'fib'
          ? {
              id: createId(),
              type: 'fib',
              a,
              b,
              levels: DEFAULT_FIB_LEVELS.slice(),
              ...style,
            }
          : {
              id: createId(),
              type: tool,
              a,
              b,
              ...style,
            };
      setShapesWithHistory((prev) => [...prev, created]);
      setSelectedId(created.id);
    },
    [setShapesWithHistory, style],
  );

  const commitTap = useCallback(
    (point: DataPoint) => {
      if (activeTool === 'select') return;
      if (readOnly) return;

      if (activeTool === 'hline') {
        const created: DrawingShape = { id: createId(), type: 'hline', y: point.y, ...style };
        setShapesWithHistory((prev) => [...prev, created]);
        setSelectedId(created.id);
        return;
      }

      if (activeTool === 'vline') {
        const created: DrawingShape = { id: createId(), type: 'vline', x: point.x, ...style };
        setShapesWithHistory((prev) => [...prev, created]);
        setSelectedId(created.id);
        return;
      }

      if (activeTool === 'label') {
        startTextEdit(point, undefined, '');
        return;
      }

      if (isTwoClickTool(activeTool)) {
        setDraft((prev) => {
          if (!prev || prev.tool !== activeTool) {
            return { tool: activeTool, points: [point, point] };
          }
          commitTwoPointShape(activeTool, prev.points[0], point);
          return null;
        });
        return;
      }

      if (activeTool === 'channel') {
        setDraft((prev) => {
          if (!prev || prev.tool !== 'channel') {
            return { tool: 'channel', stage: 1, points: [point, point, point] };
          }
          if (prev.stage === 1) {
            return { tool: 'channel', stage: 2, points: [prev.points[0], point, point] };
          }
          const created: DrawingShape = {
            id: createId(),
            type: 'channel',
            a: prev.points[0],
            b: prev.points[1],
            c: point,
            ...style,
          };
          setShapesWithHistory((all) => [...all, created]);
          setSelectedId(created.id);
          return null;
        });
        return;
      }

      if (activeTool === 'polygon') {
        setDraft((prev) => {
          if (!prev || prev.tool !== 'polygon') {
            return { tool: 'polygon', points: [point], livePoint: point };
          }
          return {
            tool: 'polygon',
            points: [...prev.points, point],
            livePoint: point,
          };
        });
      }
    },
    [activeTool, commitTwoPointShape, readOnly, setShapesWithHistory, startTextEdit, style],
  );

  const commitDoubleTap = useCallback(() => {
    if (readOnly) return;
    setDraft((prev) => {
      if (!prev || prev.tool !== 'polygon') return prev;
      if (prev.points.length < 3) return null;
      const created: DrawingShape = {
        id: createId(),
        type: 'polygon',
        points: prev.points,
        ...style,
      };
      setShapesWithHistory((all) => [...all, created]);
      setSelectedId(created.id);
      return null;
    });
  }, [readOnly, setShapesWithHistory, style]);

  const onPointerDown = useCallback(
    (x: number, y: number, timestamp = Date.now()) => {
      pointerRef.current = {
        mode: 'idle',
        downPx: { x, y },
        downAt: timestamp,
        moved: false,
      };
      gestureHistoryPushedRef.current = false;

      const point = pxToDataPoint(x, y, scales, plotRect);

      if (activeTool === 'path' && !readOnly) {
        setDraft({ tool: 'path', points: [point] });
        pointerRef.current.mode = 'path';
        return;
      }

      if (activeTool !== 'select') return;

      const selected = selectedId ? shapes.find((shape) => shape.id === selectedId) : undefined;
      if (selected) {
        const handle = hitTestHandle(selected, { x, y }, scales, plotRect);
        if (handle && !readOnly && !selected.locked) {
          setHandleDrag({ shapeId: selected.id, handle: handle.key, original: selected });
          pointerRef.current.mode = 'handle';
          return;
        }
      }

      const hit = hitTestTopShape(shapes, { x, y }, scales, plotRect);
      if (!hit) {
        setSelectedId(null);
        return;
      }

      setSelectedId(hit.id);
      if (!readOnly && !hit.locked) {
        setDrag({ shapeId: hit.id, original: hit, start: point });
        pointerRef.current.mode = 'drag';
      }
    },
    [activeTool, plotRect, readOnly, scales, selectedId, shapes],
  );

  const onPointerMove = useCallback(
    (x: number, y: number) => {
      const pointer = pointerRef.current;
      const point = pxToDataPoint(x, y, scales, plotRect);

      if (pointer) {
        pointer.moved = pointer.moved || Math.hypot(pointer.downPx.x - x, pointer.downPx.y - y) >= TAP_MOVE_PX;
      }

      if (pointer?.mode === 'drag' && drag) {
        if (!gestureHistoryPushedRef.current) {
          pushHistory(shapes);
          gestureHistoryPushedRef.current = true;
        }
        const dx = point.x - drag.start.x;
        const dy = point.y - drag.start.y;
        const updated = translateShape(drag.original, dx, dy);
        updateShape(updated, { recordHistory: false });
        return;
      }

      if (pointer?.mode === 'handle' && handleDrag) {
        if (!gestureHistoryPushedRef.current) {
          pushHistory(shapes);
          gestureHistoryPushedRef.current = true;
        }
        const updated = updateShapeHandle(handleDrag.original, handleDrag.handle, point);
        updateShape(updated, { recordHistory: false });
        return;
      }

      if (pointer?.mode === 'path' && draft?.tool === 'path') {
        const minXData = Math.abs(scales.pxToX(plotRect.left + 2) - scales.pxToX(plotRect.left));
        const minYData = Math.abs(scales.pxToY(plotRect.top + 2) - scales.pxToY(plotRect.top));
        const minDist = Math.max(minXData, minYData, 0.000001);
        setDraft({ tool: 'path', points: addPointIfFar(draft.points, point, minDist) });
        return;
      }

      if (draft) {
        if (
          draft.tool === 'segment' ||
          draft.tool === 'ray' ||
          draft.tool === 'xline' ||
          draft.tool === 'rect' ||
          draft.tool === 'ellipse' ||
          draft.tool === 'arrow' ||
          draft.tool === 'fib'
        ) {
          setDraft({ ...draft, points: [draft.points[0], point] });
          return;
        }

        if (draft.tool === 'channel') {
          if (draft.stage === 1) {
            setDraft({ ...draft, points: [draft.points[0], point, point] });
          } else {
            setDraft({ ...draft, points: [draft.points[0], draft.points[1], point] });
          }
          return;
        }

        if (draft.tool === 'polygon') {
          setDraft({ ...draft, livePoint: point });
        }
      }
    },
    [drag, draft, handleDrag, plotRect, pushHistory, scales, shapes, updateShape],
  );

  const onPointerUp = useCallback(
    (x: number, y: number, timestamp = Date.now()) => {
      const pointer = pointerRef.current;
      pointerRef.current = null;
      gestureHistoryPushedRef.current = false;

      const point = pxToDataPoint(x, y, scales, plotRect);

      if (pointer?.mode === 'path') {
        if (draft?.tool === 'path' && draft.points.length > 1 && !readOnly) {
          const created: DrawingShape = {
            id: createId(),
            type: 'path',
            points: draft.points,
            ...style,
          };
          setShapesWithHistory((prev) => [...prev, created]);
          setSelectedId(created.id);
        }
        setDraft(null);
      }

      setDrag(null);
      setHandleDrag(null);

      if (!pointer) return;
      const duration = timestamp - pointer.downAt;
      const isTap = !pointer.moved && duration <= TAP_MAX_MS;
      if (!isTap) return;

      const lastTap = lastTapRef.current;
      const isDoubleTap =
        !!lastTap && timestamp - lastTap.at <= DOUBLE_TAP_MS && Math.hypot(lastTap.x - x, lastTap.y - y) <= DOUBLE_TAP_DIST;

      if (isDoubleTap) {
        lastTapRef.current = null;
        commitDoubleTap();
      } else {
        lastTapRef.current = { at: timestamp, x, y };
        commitTap(point);
      }
    },
    [commitDoubleTap, commitTap, draft, plotRect, readOnly, scales, setShapesWithHistory, style],
  );

  const undo = useCallback(() => {
    setShapes((current) => {
      const prev = historyPastRef.current.pop();
      if (!prev) return current;
      historyFutureRef.current.push(current);
      bumpHistoryTick();
      return prev;
    });
    setDraft(null);
    setDrag(null);
    setHandleDrag(null);
    setTextEdit(null);
    setSelectedId(null);
  }, [bumpHistoryTick]);

  const redo = useCallback(() => {
    setShapes((current) => {
      const next = historyFutureRef.current.pop();
      if (!next) return current;
      historyPastRef.current.push(current);
      bumpHistoryTick();
      return next;
    });
    setDraft(null);
    setDrag(null);
    setHandleDrag(null);
    setTextEdit(null);
    setSelectedId(null);
  }, [bumpHistoryTick]);

  const canUndo = historyPastRef.current.length > 0;
  const canRedo = historyFutureRef.current.length > 0;
  void historyTick;

  return {
    shapes,
    activeTool,
    selectedId,
    draft,
    drag,
    handleDrag,
    textEdit,
    readOnly,
    style,
    selectedShape,
    selectedLocked,
    canUndo,
    canRedo,
    setActiveTool,
    setStyle,
    setReadOnly,
    replaceShapes,
    setSelectedId,
    updateShape,
    deleteSelected,
    clearAll,
    duplicateSelected,
    toggleSelectedLock,
    startTextEdit,
    updateTextEdit,
    commitTextEdit,
    cancelTextEdit,
    undo,
    redo,
    share,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
};
