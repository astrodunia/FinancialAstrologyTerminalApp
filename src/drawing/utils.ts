import type {
  DataPoint,
  DrawingShape,
  FibShape,
  HandleKey,
  PlotRect,
  ScaleContract,
  ShapeHandle,
  ShapeStyle,
} from './types';

export const DEFAULT_FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export const DEFAULT_STYLE: ShapeStyle = {
  color: '#4da3ff',
  width: 2,
  opacity: 1,
  locked: false,
};

const EPS = 1e-6;

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const plotRight = (plot: PlotRect) => plot.left + plot.width;

export const plotBottom = (plot: PlotRect) => plot.top + plot.height;

export const clampPxToPlot = (x: number, y: number, plot: PlotRect) => ({
  x: clamp(x, plot.left, plotRight(plot)),
  y: clamp(y, plot.top, plotBottom(plot)),
});

export const pxToDataPoint = (x: number, y: number, scales: ScaleContract, plot: PlotRect): DataPoint => {
  const clamped = clampPxToPlot(x, y, plot);
  return {
    x: scales.pxToX(clamped.x),
    y: scales.pxToY(clamped.y),
  };
};

export const dataToPxPoint = (point: DataPoint, scales: ScaleContract) => ({
  x: scales.xToPx(point.x),
  y: scales.yToPx(point.y),
});

export const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

export const distancePointToSegmentPx = (p: DataPoint, a: DataPoint, b: DataPoint) => {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const denom = abx * abx + aby * aby;
  if (denom <= EPS) return Math.hypot(apx, apy);
  const t = clamp((apx * abx + apy * aby) / denom, 0, 1);
  const cx = a.x + t * abx;
  const cy = a.y + t * aby;
  return Math.hypot(p.x - cx, p.y - cy);
};

const distancePointToInfiniteLinePx = (p: DataPoint, a: DataPoint, b: DataPoint) => {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const mag = Math.hypot(vx, vy);
  if (mag <= EPS) return distance(p, a);
  return Math.abs(vy * p.x - vx * p.y + b.x * a.y - b.y * a.x) / mag;
};

type LineClipPoint = { x: number; y: number; t: number };

const lineRectIntersections = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  plot: PlotRect,
): LineClipPoint[] => {
  const left = plot.left;
  const right = plotRight(plot);
  const top = plot.top;
  const bottom = plotBottom(plot);
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const out: LineClipPoint[] = [];
  const push = (x: number, y: number, t: number) => {
    if (x + EPS < left || x - EPS > right || y + EPS < top || y - EPS > bottom) return;
    const dup = out.some((p) => Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5);
    if (!dup) out.push({ x, y, t });
  };

  if (Math.abs(dx) > EPS) {
    const tLeft = (left - a.x) / dx;
    push(left, a.y + tLeft * dy, tLeft);
    const tRight = (right - a.x) / dx;
    push(right, a.y + tRight * dy, tRight);
  }

  if (Math.abs(dy) > EPS) {
    const tTop = (top - a.y) / dy;
    push(a.x + tTop * dx, top, tTop);
    const tBottom = (bottom - a.y) / dy;
    push(a.x + tBottom * dx, bottom, tBottom);
  }

  return out;
};

export const clipInfiniteLineToPlot = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  plot: PlotRect,
): [DataPoint, DataPoint] | null => {
  const intersections = lineRectIntersections(a, b, plot);
  if (intersections.length < 2) return null;
  intersections.sort((p1, p2) => p1.t - p2.t);
  const first = intersections[0];
  const last = intersections[intersections.length - 1];
  return [
    { x: first.x, y: first.y },
    { x: last.x, y: last.y },
  ];
};

export const clipRayToPlot = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  plot: PlotRect,
): [DataPoint, DataPoint] | null => {
  const intersections = lineRectIntersections(a, b, plot).filter((p) => p.t >= 0);
  if (!intersections.length) return null;
  intersections.sort((p1, p2) => p1.t - p2.t);
  const far = intersections[intersections.length - 1];
  return [
    { x: a.x, y: a.y },
    { x: far.x, y: far.y },
  ];
};

const pointInRectPx = (p: DataPoint, a: DataPoint, b: DataPoint, tolerance = 0) => {
  const minX = Math.min(a.x, b.x) - tolerance;
  const maxX = Math.max(a.x, b.x) + tolerance;
  const minY = Math.min(a.y, b.y) - tolerance;
  const maxY = Math.max(a.y, b.y) + tolerance;
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
};

const pointInEllipsePx = (p: DataPoint, a: DataPoint, b: DataPoint, tolerance = 0) => {
  const cx = (a.x + b.x) * 0.5;
  const cy = (a.y + b.y) * 0.5;
  const rx = Math.max(Math.abs(b.x - a.x) * 0.5, EPS) + tolerance;
  const ry = Math.max(Math.abs(b.y - a.y) * 0.5, EPS) + tolerance;
  const nx = (p.x - cx) / rx;
  const ny = (p.y - cy) / ry;
  return nx * nx + ny * ny <= 1;
};

const polygonContainsPointPx = (points: DataPoint[], p: DataPoint) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const pi = points[i];
    const pj = points[j];
    const intersects = (pi.y > p.y) !== (pj.y > p.y) && p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y + EPS) + pi.x;
    if (intersects) inside = !inside;
  }
  return inside;
};

export const getShapeHandles = (shape: DrawingShape): ShapeHandle[] => {
  switch (shape.type) {
    case 'segment':
    case 'ray':
    case 'xline':
    case 'arrow':
    case 'fib':
      return [
        { key: 'a', point: shape.a },
        { key: 'b', point: shape.b },
      ];
    case 'channel':
      return [
        { key: 'a', point: shape.a },
        { key: 'b', point: shape.b },
        { key: 'c', point: shape.c },
      ];
    case 'rect':
    case 'ellipse':
      return [
        { key: 'a', point: shape.a },
        { key: 'b', point: shape.b },
      ];
    case 'hline':
      return [{ key: 'hline', point: { x: 0, y: shape.y } }];
    case 'vline':
      return [{ key: 'vline', point: { x: shape.x, y: 0 } }];
    case 'label':
      return [{ key: 'point', point: shape.point }];
    case 'path':
      return [];
    case 'polygon':
      return shape.points.map((point, index) => ({ key: `p-${index}` as HandleKey, point }));
    default:
      return [];
  }
};

export const translateShape = (shape: DrawingShape, dx: number, dy: number): DrawingShape => {
  switch (shape.type) {
    case 'segment':
    case 'ray':
    case 'xline':
    case 'arrow':
    case 'fib':
      return {
        ...shape,
        a: { x: shape.a.x + dx, y: shape.a.y + dy },
        b: { x: shape.b.x + dx, y: shape.b.y + dy },
      };
    case 'channel':
      return {
        ...shape,
        a: { x: shape.a.x + dx, y: shape.a.y + dy },
        b: { x: shape.b.x + dx, y: shape.b.y + dy },
        c: { x: shape.c.x + dx, y: shape.c.y + dy },
      };
    case 'rect':
    case 'ellipse':
      return {
        ...shape,
        a: { x: shape.a.x + dx, y: shape.a.y + dy },
        b: { x: shape.b.x + dx, y: shape.b.y + dy },
      };
    case 'hline':
      return { ...shape, y: shape.y + dy };
    case 'vline':
      return { ...shape, x: shape.x + dx };
    case 'label':
      return { ...shape, point: { x: shape.point.x + dx, y: shape.point.y + dy } };
    case 'path':
      return {
        ...shape,
        points: shape.points.map((point) => ({ x: point.x + dx, y: point.y + dy })),
      };
    case 'polygon':
      return {
        ...shape,
        points: shape.points.map((point) => ({ x: point.x + dx, y: point.y + dy })),
      };
    default:
      return shape;
  }
};

export const updateShapeHandle = (shape: DrawingShape, handle: HandleKey, point: DataPoint): DrawingShape => {
  switch (shape.type) {
    case 'segment':
    case 'ray':
    case 'xline':
    case 'arrow':
    case 'fib':
      if (handle === 'a') return { ...shape, a: point };
      if (handle === 'b') return { ...shape, b: point };
      return shape;
    case 'channel':
      if (handle === 'a') return { ...shape, a: point };
      if (handle === 'b') return { ...shape, b: point };
      if (handle === 'c') return { ...shape, c: point };
      return shape;
    case 'rect':
    case 'ellipse':
      if (handle === 'a') return { ...shape, a: point };
      if (handle === 'b') return { ...shape, b: point };
      return shape;
    case 'hline':
      if (handle === 'hline') return { ...shape, y: point.y };
      return shape;
    case 'vline':
      if (handle === 'vline') return { ...shape, x: point.x };
      return shape;
    case 'label':
      if (handle === 'point') return { ...shape, point };
      return shape;
    case 'polygon': {
      if (!handle.startsWith('p-')) return shape;
      const index = Number(handle.slice(2));
      if (!Number.isFinite(index) || index < 0 || index >= shape.points.length) return shape;
      const points = shape.points.slice();
      points[index] = point;
      return { ...shape, points };
    }
    default:
      return shape;
  }
};

const getShapePointsPx = (shape: DrawingShape, scales: ScaleContract): DataPoint[] => {
  switch (shape.type) {
    case 'segment':
    case 'ray':
    case 'xline':
    case 'arrow':
    case 'fib':
      return [dataToPxPoint(shape.a, scales), dataToPxPoint(shape.b, scales)];
    case 'channel':
      return [dataToPxPoint(shape.a, scales), dataToPxPoint(shape.b, scales), dataToPxPoint(shape.c, scales)];
    case 'rect':
    case 'ellipse':
      return [dataToPxPoint(shape.a, scales), dataToPxPoint(shape.b, scales)];
    case 'hline':
      return [{ x: 0, y: scales.yToPx(shape.y) }];
    case 'vline':
      return [{ x: scales.xToPx(shape.x), y: 0 }];
    case 'label':
      return [dataToPxPoint(shape.point, scales)];
    case 'path':
    case 'polygon':
      return shape.points.map((point) => dataToPxPoint(point, scales));
    default:
      return [];
  }
};

export const hitTestShapePx = (
  shape: DrawingShape,
  pointerPx: DataPoint,
  scales: ScaleContract,
  plot: PlotRect,
  tolerancePx = 10,
): boolean => {
  const pts = getShapePointsPx(shape, scales);
  switch (shape.type) {
    case 'segment':
      return distancePointToSegmentPx(pointerPx, pts[0], pts[1]) <= tolerancePx;
    case 'ray': {
      const a = pts[0];
      const b = pts[1];
      const vx = b.x - a.x;
      const vy = b.y - a.y;
      const wx = pointerPx.x - a.x;
      const wy = pointerPx.y - a.y;
      const dot = vx * wx + vy * wy;
      if (dot < 0) return distance(pointerPx, a) <= tolerancePx;
      return distancePointToInfiniteLinePx(pointerPx, a, b) <= tolerancePx;
    }
    case 'xline':
      return distancePointToInfiniteLinePx(pointerPx, pts[0], pts[1]) <= tolerancePx;
    case 'hline':
      return Math.abs(pointerPx.y - pts[0].y) <= tolerancePx;
    case 'vline':
      return Math.abs(pointerPx.x - pts[0].x) <= tolerancePx;
    case 'rect': {
      const [a, b] = pts;
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      const nearEdge =
        Math.abs(pointerPx.x - minX) <= tolerancePx ||
        Math.abs(pointerPx.x - maxX) <= tolerancePx ||
        Math.abs(pointerPx.y - minY) <= tolerancePx ||
        Math.abs(pointerPx.y - maxY) <= tolerancePx;
      return nearEdge && pointInRectPx(pointerPx, a, b, tolerancePx);
    }
    case 'ellipse': {
      const [a, b] = pts;
      if (!pointInEllipsePx(pointerPx, a, b, tolerancePx + 1.5)) return false;
      return !pointInEllipsePx(pointerPx, a, b, Math.max(tolerancePx - 2, 0));
    }
    case 'label':
      return distance(pointerPx, pts[0]) <= tolerancePx * 1.8;
    case 'arrow':
      return distancePointToSegmentPx(pointerPx, pts[0], pts[1]) <= tolerancePx;
    case 'channel': {
      const [a, b, c] = pts;
      const dx = c.x - a.x;
      const dy = c.y - a.y;
      const c2 = { x: b.x + dx, y: b.y + dy };
      return (
        distancePointToSegmentPx(pointerPx, a, b) <= tolerancePx ||
        distancePointToSegmentPx(pointerPx, c, c2) <= tolerancePx
      );
    }
    case 'fib': {
      const fib = shape as FibShape;
      const a = pts[0];
      const b = pts[1];
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      const matches = fib.levels.some((lv) => {
        const y = a.y + (b.y - a.y) * lv;
        return Math.abs(pointerPx.y - y) <= tolerancePx && pointerPx.x >= minX - tolerancePx && pointerPx.x <= maxX + tolerancePx;
      });
      return matches || distance(pointerPx, a) <= tolerancePx || distance(pointerPx, b) <= tolerancePx;
    }
    case 'path':
      for (let i = 0; i < pts.length - 1; i += 1) {
        if (distancePointToSegmentPx(pointerPx, pts[i], pts[i + 1]) <= tolerancePx) return true;
      }
      return false;
    case 'polygon':
      for (let i = 0; i < pts.length; i += 1) {
        const next = pts[(i + 1) % pts.length];
        if (distancePointToSegmentPx(pointerPx, pts[i], next) <= tolerancePx) return true;
      }
      return polygonContainsPointPx(pts, pointerPx);
    default:
      return false;
  }
};

export const hitTestTopShape = (
  shapes: DrawingShape[],
  pointerPx: DataPoint,
  scales: ScaleContract,
  plot: PlotRect,
  tolerancePx = 10,
): DrawingShape | undefined => {
  for (let i = shapes.length - 1; i >= 0; i -= 1) {
    if (hitTestShapePx(shapes[i], pointerPx, scales, plot, tolerancePx)) return shapes[i];
  }
  return undefined;
};

export const hitTestHandle = (
  shape: DrawingShape,
  pointerPx: DataPoint,
  scales: ScaleContract,
  plot?: PlotRect,
  tolerancePx = 12,
): ShapeHandle | null => {
  if (shape.type === 'hline') {
    const x = plot ? plot.left : pointerPx.x;
    const y = scales.yToPx(shape.y);
    if (Math.hypot(pointerPx.x - x, pointerPx.y - y) <= tolerancePx) {
      return { key: 'hline', point: { x: scales.pxToX(x), y: shape.y } };
    }
    return null;
  }

  if (shape.type === 'vline') {
    const x = scales.xToPx(shape.x);
    const y = plot ? plot.top : pointerPx.y;
    if (Math.hypot(pointerPx.x - x, pointerPx.y - y) <= tolerancePx) {
      return { key: 'vline', point: { x: shape.x, y: scales.pxToY(y) } };
    }
    return null;
  }

  const handles = getShapeHandles(shape);
  for (const handle of handles) {
    const px = dataToPxPoint(handle.point, scales);
    if (distance(px, pointerPx) <= tolerancePx) return handle;
  }
  return null;
};

export const createId = () => `shp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const makePathD = (points: DataPoint[], scales: ScaleContract) => {
  if (!points.length) return '';
  return points
    .map((point, index) => {
      const px = dataToPxPoint(point, scales);
      return `${index === 0 ? 'M' : 'L'} ${px.x.toFixed(2)} ${px.y.toFixed(2)}`;
    })
    .join(' ');
};

export const addPointIfFar = (points: DataPoint[], next: DataPoint, minDataDistance: number) => {
  if (!points.length) return [next];
  const last = points[points.length - 1];
  if (Math.hypot(next.x - last.x, next.y - last.y) < minDataDistance) return points;
  return [...points, next];
};
