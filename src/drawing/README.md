# Drawing System Integration

## Files
- `types.ts`: strict shape/tool unions and engine contract
- `utils.ts`: geometry, hit-testing, clipping, shape transforms
- `useDrawingEngine.ts`: full interaction state machine
- `shapeRenderers.ts`: renderer exports (`shapeRenderersImpl.tsx` implementation)
- `Toolbar.tsx`: TradingView-style tool picker + clear/share actions
- `Overlay.tsx`: SVG overlay + gesture handling + label text editor

## Scale Contract
Pass these functions from your chart:

```ts
type ScaleContract = {
  xToPx: (x: number) => number;
  yToPx: (y: number) => number;
  pxToX: (px: number) => number;
  pxToY: (py: number) => number;
};
```

`plotRect` must describe the drawable plot area:

```ts
type PlotRect = { left: number; top: number; width: number; height: number };
```

All shapes are stored in data coordinates.

## Minimal ChartScreen Example

```tsx
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { DrawingOverlay } from '../drawing/Overlay';
import { DrawingToolbar } from '../drawing/Toolbar';
import { useDrawingEngine } from '../drawing/useDrawingEngine';
import type { DrawingShape, PlotRect, ScaleContract } from '../drawing/types';

export function ChartScreen() {
  const [savedShapes, setSavedShapes] = useState<DrawingShape[]>([]);
  const xMin = 0;
  const xMax = 100;
  const yMin = 0;
  const yMax = 200;
  const plotRect: PlotRect = { left: 12, top: 10, width: 340, height: 220 };

  const scales = useMemo<ScaleContract>(
    () => ({
      xToPx: (x) => plotRect.left + ((x - xMin) / (xMax - xMin || 1)) * plotRect.width,
      yToPx: (y) => plotRect.top + (1 - (y - yMin) / (yMax - yMin || 1)) * plotRect.height,
      pxToX: (px) => xMin + ((px - plotRect.left) / (plotRect.width || 1)) * (xMax - xMin),
      pxToY: (py) => yMin + (1 - (py - plotRect.top) / (plotRect.height || 1)) * (yMax - yMin),
    }),
    [plotRect.height, plotRect.left, plotRect.top, plotRect.width, xMax, xMin, yMax, yMin],
  );

  const drawing = useDrawingEngine({
    scales,
    plotRect,
    initialShapes: savedShapes,
    onChange: setSavedShapes, // persistence callback
    onShare: ({ shapes, xDomain }) => {
      // API-agnostic share hook
      console.log('share payload', { shapes, xDomain });
    },
    xDomain: [xMin, xMax],
  });

  return (
    <View style={{ flex: 1 }}>
      <DrawingToolbar
        activeTool={drawing.activeTool}
        onToolChange={drawing.setActiveTool}
        onClear={drawing.clearAll}
        onShare={drawing.share}
      />

      <View style={{ flex: 1 }}>
        {/* your existing chart svg/canvas here */}
        <DrawingOverlay engine={drawing} scales={scales} plotRect={plotRect} />
      </View>
    </View>
  );
}
```

## Notes
- Tool order matches: `select, segment, ray, xline, hline, vline, rect, ellipse, label, arrow, channel, fib, path, polygon`
- Polygon finish is double-tap.
- Freehand path commits on release if enough points.
- Infinite line and ray are clipped to the plot rect.
- Default fib levels are `[0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]`.
- `readOnly` mode is supported by engine/tooling.
