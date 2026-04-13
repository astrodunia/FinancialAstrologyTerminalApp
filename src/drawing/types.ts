export type DrawingTool =
  | 'select'
  | 'segment'
  | 'ray'
  | 'xline'
  | 'hline'
  | 'vline'
  | 'rect'
  | 'ellipse'
  | 'label'
  | 'arrow'
  | 'channel'
  | 'fib'
  | 'path'
  | 'polygon';

export type DataPoint = {
  x: number;
  y: number;
};

export type PlotRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ScaleContract = {
  xToPx: (x: number) => number;
  yToPx: (y: number) => number;
  pxToX: (px: number) => number;
  pxToY: (py: number) => number;
};

export type ShapeStyle = {
  color: string;
  width: number;
  opacity: number;
  locked: boolean;
  note?: string;
};

export type ShapeBase<T extends DrawingTool> = ShapeStyle & {
  id: string;
  type: T;
};

export type SegmentShape = ShapeBase<'segment'> & {
  a: DataPoint;
  b: DataPoint;
};

export type RayShape = ShapeBase<'ray'> & {
  a: DataPoint;
  b: DataPoint;
};

export type XLineShape = ShapeBase<'xline'> & {
  a: DataPoint;
  b: DataPoint;
};

export type HLineShape = ShapeBase<'hline'> & {
  y: number;
};

export type VLineShape = ShapeBase<'vline'> & {
  x: number;
};

export type RectShape = ShapeBase<'rect'> & {
  a: DataPoint;
  b: DataPoint;
};

export type EllipseShape = ShapeBase<'ellipse'> & {
  a: DataPoint;
  b: DataPoint;
};

export type LabelShape = ShapeBase<'label'> & {
  point: DataPoint;
  text: string;
  fontSize: number;
};

export type ArrowShape = ShapeBase<'arrow'> & {
  a: DataPoint;
  b: DataPoint;
};

export type ChannelShape = ShapeBase<'channel'> & {
  a: DataPoint;
  b: DataPoint;
  c: DataPoint;
};

export type FibShape = ShapeBase<'fib'> & {
  a: DataPoint;
  b: DataPoint;
  levels: number[];
};

export type PathShape = ShapeBase<'path'> & {
  points: DataPoint[];
};

export type PolygonShape = ShapeBase<'polygon'> & {
  points: DataPoint[];
};

export type DrawingShape =
  | SegmentShape
  | RayShape
  | XLineShape
  | HLineShape
  | VLineShape
  | RectShape
  | EllipseShape
  | LabelShape
  | ArrowShape
  | ChannelShape
  | FibShape
  | PathShape
  | PolygonShape;

export type HandleKey =
  | 'a'
  | 'b'
  | 'c'
  | 'point'
  | 'hline'
  | 'vline'
  | `p-${number}`;

export type ShapeHandle = {
  key: HandleKey;
  point: DataPoint;
};

export type Draft =
  | {
      tool: 'segment' | 'ray' | 'xline' | 'rect' | 'ellipse' | 'arrow' | 'fib';
      points: [DataPoint, DataPoint];
    }
  | {
      tool: 'channel';
      points: DataPoint[];
      stage: 1 | 2;
    }
  | {
      tool: 'polygon';
      points: DataPoint[];
      livePoint: DataPoint;
    }
  | {
      tool: 'path';
      points: DataPoint[];
    }
  | {
      tool: 'label';
      point: DataPoint;
    };

export type DragState = {
  shapeId: string;
  start: DataPoint;
  original: DrawingShape;
};

export type HandleDragState = {
  shapeId: string;
  handle: HandleKey;
  original: DrawingShape;
};

export type TextEditState = {
  point: DataPoint;
  value: string;
  targetId?: string;
};

export type SharePayload = {
  shapes: DrawingShape[];
  xDomain?: [number, number] | null;
};
