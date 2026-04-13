import React from 'react';
import { Circle, Ellipse as SvgEllipse, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { DataPoint, Draft, DrawingShape, PlotRect, ScaleContract, ShapeStyle } from './types';
import { clipInfiniteLineToPlot, clipRayToPlot, dataToPxPoint, makePathD, plotBottom, plotRight } from './utils';

export type RenderContext = {
  scales: ScaleContract;
  plotRect: PlotRect;
  handleRadius?: number;
};

const lineCap = 'round';
const lineJoin = 'round';

const renderArrowHead = (a: DataPoint, b: DataPoint, color: string, width: number) => {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const len = Math.max(10, width * 4);
  const spread = Math.PI / 8;
  const p1 = { x: b.x - len * Math.cos(angle - spread), y: b.y - len * Math.sin(angle - spread) };
  const p2 = { x: b.x - len * Math.cos(angle + spread), y: b.y - len * Math.sin(angle + spread) };
  return (
    <>
      <Line x1={b.x} y1={b.y} x2={p1.x} y2={p1.y} stroke={color} strokeWidth={width} />
      <Line x1={b.x} y1={b.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={width} />
    </>
  );
};

const renderShapeBody = (shape: DrawingShape, { scales, plotRect }: RenderContext, isDraft = false) => {
  const strokeDasharray = isDraft ? '6 4' : undefined;
  const opacity = isDraft ? Math.min(shape.opacity, 0.7) : shape.opacity;
  const left = plotRect.left;
  const top = plotRect.top;
  const right = plotRight(plotRect);
  const bottom = plotBottom(plotRect);

  switch (shape.type) {
    case 'segment': {
      const a = dataToPxPoint(shape.a, scales);
      const b = dataToPxPoint(shape.b, scales);
      return (
        <Line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
          strokeLinecap={lineCap}
        />
      );
    }
    case 'ray': {
      const a = dataToPxPoint(shape.a, scales);
      const b = dataToPxPoint(shape.b, scales);
      const clipped = clipRayToPlot(a, b, plotRect);
      if (!clipped) return null;
      return (
        <Line
          x1={clipped[0].x}
          y1={clipped[0].y}
          x2={clipped[1].x}
          y2={clipped[1].y}
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
          strokeLinecap={lineCap}
        />
      );
    }
    case 'xline': {
      const a = dataToPxPoint(shape.a, scales);
      const b = dataToPxPoint(shape.b, scales);
      const clipped = clipInfiniteLineToPlot(a, b, plotRect);
      if (!clipped) return null;
      return (
        <Line
          x1={clipped[0].x}
          y1={clipped[0].y}
          x2={clipped[1].x}
          y2={clipped[1].y}
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
          strokeLinecap={lineCap}
        />
      );
    }
    case 'hline': {
      const y = scales.yToPx(shape.y);
      return (
        <Line
          x1={left}
          y1={y}
          x2={right}
          y2={y}
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
          strokeLinecap={lineCap}
        />
      );
    }
    case 'vline': {
      const x = scales.xToPx(shape.x);
      return (
        <Line
          x1={x}
          y1={top}
          x2={x}
          y2={bottom}
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
          strokeLinecap={lineCap}
        />
      );
    }
    case 'rect': {
      const a = dataToPxPoint(shape.a, scales);
      const b = dataToPxPoint(shape.b, scales);
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const width = Math.abs(a.x - b.x);
      const height = Math.abs(a.y - b.y);
      return (
        <Rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
        />
      );
    }
    case 'ellipse': {
      const a = dataToPxPoint(shape.a, scales);
      const b = dataToPxPoint(shape.b, scales);
      const cx = (a.x + b.x) * 0.5;
      const cy = (a.y + b.y) * 0.5;
      const rx = Math.abs(a.x - b.x) * 0.5;
      const ry = Math.abs(a.y - b.y) * 0.5;
      return (
        <SvgEllipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="transparent"
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
        />
      );
    }
    case 'label': {
      const p = dataToPxPoint(shape.point, scales);
      return (
        <SvgText x={p.x} y={p.y} fill={shape.color} fontSize={shape.fontSize} opacity={opacity} fontWeight="600">
          {shape.text || 'Label'}
        </SvgText>
      );
    }
    case 'arrow': {
      const a = dataToPxPoint(shape.a, scales);
      const b = dataToPxPoint(shape.b, scales);
      return (
        <G opacity={opacity}>
          <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={shape.color} strokeWidth={shape.width} strokeLinecap={lineCap} />
          {renderArrowHead(a, b, shape.color, shape.width)}
        </G>
      );
    }
    case 'channel': {
      const a = dataToPxPoint(shape.a, scales);
      const b = dataToPxPoint(shape.b, scales);
      const c = dataToPxPoint(shape.c, scales);
      const dx = c.x - a.x;
      const dy = c.y - a.y;
      const c2 = { x: b.x + dx, y: b.y + dy };
      return (
        <G opacity={opacity}>
          <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={shape.color} strokeWidth={shape.width} strokeLinecap={lineCap} />
          <Line x1={c.x} y1={c.y} x2={c2.x} y2={c2.y} stroke={shape.color} strokeWidth={shape.width} strokeLinecap={lineCap} />
          <Line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={shape.color} strokeWidth={Math.max(1, shape.width - 0.5)} opacity={0.4} />
        </G>
      );
    }
    case 'fib': {
      const a = dataToPxPoint(shape.a, scales);
      const b = dataToPxPoint(shape.b, scales);
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      return (
        <G opacity={opacity}>
          <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={shape.color} strokeWidth={shape.width} opacity={0.6} />
          {shape.levels.map((lv) => {
            const y = a.y + (b.y - a.y) * lv;
            return (
              <G key={`fib-${shape.id}-${lv}`}>
                <Line
                  x1={minX}
                  y1={y}
                  x2={maxX}
                  y2={y}
                  stroke={shape.color}
                  strokeWidth={Math.max(1, shape.width - 0.5)}
                  strokeDasharray={strokeDasharray}
                />
                <SvgText x={maxX + 4} y={y - 2} fill={shape.color} fontSize={10}>
                  {(lv * 100).toFixed(1)}%
                </SvgText>
              </G>
            );
          })}
        </G>
      );
    }
    case 'path': {
      const d = makePathD(shape.points, scales);
      if (!d) return null;
      return (
        <Path
          d={d}
          fill="none"
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeLinecap={lineCap}
          strokeLinejoin={lineJoin}
          opacity={opacity}
          strokeDasharray={strokeDasharray}
        />
      );
    }
    case 'polygon': {
      if (shape.points.length < 2) return null;
      const d = makePathD([...shape.points, shape.points[0]], scales);
      return (
        <Path
          d={d}
          fill="transparent"
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeLinecap={lineCap}
          strokeLinejoin={lineJoin}
          opacity={opacity}
          strokeDasharray={strokeDasharray}
        />
      );
    }
    default:
      return null;
  }
};

export const renderShape = (shape: DrawingShape, context: RenderContext) => (
  <G key={shape.id}>{renderShapeBody(shape, context, false)}</G>
);

export const renderDraft = (draftShape: DrawingShape | null, context: RenderContext, key = 'draft-shape') =>
  draftShape ? <G key={key}>{renderShapeBody(draftShape, context, true)}</G> : null;

export const renderSelectionHandles = (
  shape: DrawingShape | null,
  { scales, plotRect, handleRadius = 5 }: RenderContext,
  color = '#ffffff',
) => {
  if (!shape) return null;

  const handles = (() => {
    switch (shape.type) {
      case 'segment':
      case 'ray':
      case 'xline':
      case 'arrow':
      case 'fib':
        return [shape.a, shape.b];
      case 'channel':
        return [shape.a, shape.b, shape.c];
      case 'rect':
      case 'ellipse':
        return [shape.a, shape.b];
      case 'hline':
        return [{ x: scales.pxToX(plotRect.left), y: shape.y }];
      case 'vline':
        return [{ x: shape.x, y: scales.pxToY(plotRect.top) }];
      case 'label':
        return [shape.point];
      case 'polygon':
        return shape.points;
      case 'path':
      default:
        return [];
    }
  })();

  return (
    <G key={`handles-${shape.id}`}>
      {handles.map((handlePoint, index) => {
        const px = dataToPxPoint(handlePoint, scales);
        return (
          <Circle
            key={`${shape.id}-h-${index}`}
            cx={px.x}
            cy={px.y}
            r={handleRadius}
            fill={color}
            stroke={shape.color}
            strokeWidth={1.5}
          />
        );
      })}
    </G>
  );
};

export const draftToShape = (draft: Draft, base: ShapeStyle): DrawingShape | null => {
  switch (draft.tool) {
    case 'segment':
    case 'ray':
    case 'xline':
    case 'rect':
    case 'ellipse':
    case 'arrow':
    case 'fib':
      return {
        id: 'draft',
        type: draft.tool,
        ...base,
        a: draft.points[0],
        b: draft.points[1],
        ...(draft.tool === 'fib' ? { levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1] } : null),
      } as DrawingShape;
    case 'channel':
      if (draft.points.length <= 1) {
        return {
          id: 'draft',
          type: 'segment',
          ...base,
          a: draft.points[0],
          b: draft.points[0],
        };
      }
      if (draft.stage === 1 || draft.points.length === 2) {
        return {
          id: 'draft',
          type: 'segment',
          ...base,
          a: draft.points[0],
          b: draft.points[1],
        };
      }
      return {
        id: 'draft',
        type: 'channel',
        ...base,
        a: draft.points[0],
        b: draft.points[1],
        c: draft.points[2],
      };
    case 'polygon':
      return {
        id: 'draft',
        type: 'polygon',
        ...base,
        points: [...draft.points, draft.livePoint],
      };
    case 'path':
      return {
        id: 'draft',
        type: 'path',
        ...base,
        points: draft.points,
      };
    case 'label':
      return {
        id: 'draft',
        type: 'label',
        ...base,
        point: draft.point,
        text: 'Label',
        fontSize: 14,
      };
    default:
      return null;
  }
};
