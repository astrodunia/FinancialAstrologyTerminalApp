# Astro-Analysis Codebase Search Report

## Executive Summary

Based on comprehensive codebase search, the **astro-analysis feature has NOT been implemented in the frontend** yet. However, related astrology features exist in other parts of the application. The `/api/astro-analysis` endpoint, data grouping for "Top U.S. Stocks", "Top Index ETFs", "Top Bond ETFs", and the dedicated AstroAnalysis screen are **not present in the current codebase**.

---

## 1. Files & Locations

### ✅ Found Files (Related Features)

| Feature | File Path | Status |
|---------|-----------|--------|
| **Market Heatmap Types** | [src/features/marketHeatmap/types.ts](src/features/marketHeatmap/types.ts) | Contains `astroStrength` field |
| **Market Heatmap API** | [src/features/marketHeatmap/api.ts](src/features/marketHeatmap/api.ts) | Fetches heatmap data with astro strength |
| **Market Heatmap Meta** | [src/features/marketHeatmap/heatmapMeta.ts](src/features/marketHeatmap/heatmapMeta.ts) | Static astroStrength values (0-10 scale) |
| **Astrology Calculator** | [src/screens/Calculators/PortfolioAdvancedTools.js](src/screens/Calculators/PortfolioAdvancedTools.js) | Astrology Longevity Score calculation |
| **Transit Analysis (Stocks)** | [src/screens/StockDetail/StockDetailScreen.tsx](src/screens/StockDetail/StockDetailScreen.tsx) | Planetary/Nakshatra transit performance |
| **Transit Analysis (Indices)** | [src/screens/IndexDetail/IndexDetailScreen.tsx](src/screens/IndexDetail/IndexDetailScreen.tsx) | Planetary/Nakshatra transit performance |

### ❌ Missing Files

```
src/screens/AstroAnalysis/  ← EMPTY FOLDER
- page.tsx / AstroAnalysisTable.tsx (NOT FOUND)
- API route for /api/astro-analysis (NOT IMPLEMENTED)
```

---

## 2. Data Structure / Type Definitions

### A. Market Heatmap Data Structure (Current)

**File**: [src/features/marketHeatmap/types.ts](src/features/marketHeatmap/types.ts)

```typescript
export type HeatmapMeta = {
  symbol: string;
  sector: HeatmapSector;
  astroStrength: number;  // Scale: 0-10
  logoUrl?: string;
};

export type HeatmapQuote = {
  symbol: string;
  name: string;
  sector: HeatmapSector;
  astroStrength: number;     // 0-10 scale
  logoUrl?: string;
  price: number | null;
  prevClose: number | null;
  sessionClose: number | null;
  volume: number | null;
  change: number;
  size: number;
};

export type DashboardInfoEnvelope = {
  ok: boolean;
  count?: number;
  data?: Record<string, {
    ok: boolean;
    status: number;
    data?: {
      symbol: string;
      name: string | null;
      price: number | null;
      prevClose: number | null;
      sessionClose: number | null;
      volume: number | null;
    };
  }>;
};
```

### B. Astro Strength Values (Current Implementation)

**File**: [src/features/marketHeatmap/heatmapMeta.ts](src/features/marketHeatmap/heatmapMeta.ts)

```typescript
// Sample values from the codebase:
const HEATMAP_META: HeatmapMeta[] = [
  { symbol: 'NVDA', sector: 'Technology', astroStrength: 9.4 },
  { symbol: 'MSFT', sector: 'Technology', astroStrength: 8.9 },
  { symbol: 'AAPL', sector: 'Technology', astroStrength: 8.3 },
  { symbol: 'AMZN', sector: 'Consumer', astroStrength: 8.7 },
  { symbol: 'TSLA', sector: 'Consumer', astroStrength: 9.1 },
  { symbol: 'JPM', sector: 'Financial', astroStrength: 8.0 },
  { symbol: 'UNH', sector: 'Healthcare', astroStrength: 8.2 },
  // ... more symbols
];
```

**Scale Range**: 0-10 (decimal precision)

---

## 3. API Endpoints Found

### A. Market Heatmap Endpoint (Current)

**Endpoint**: `GET /api/tagx/dashboard/info`

```typescript
// From: src/features/marketHeatmap/api.ts
export const buildHeatmapUrl = (tickersCsv: string) =>
  `${BACKEND_BASE_URL}/api/tagx/dashboard/info?tickers=${encodeURIComponent(tickersCsv)}`;

// Usage:
// GET /api/tagx/dashboard/info?tickers=NVDA,MSFT,AAPL,...
```

**Request Structure**:
```typescript
fetch(`${BACKEND_BASE_URL}/api/tagx/dashboard/info?tickers=NVDA,MSFT,AAPL`, {
  method: 'GET',
  headers: { Accept: 'application/json' }
})
```

**Response Structure**:
```typescript
{
  ok: boolean;
  count?: number;
  data?: {
    [symbol: string]: {
      ok: boolean;
      status: number;
      data?: {
        symbol: string;
        name: string | null;
        price: number | null;
        prevClose: number | null;
        sessionClose: number | null;
        volume: number | null;
      };
    }
  }
}
```

### B. Transit Analysis Endpoint (Current)

**Endpoint**: `GET /api/transits`

```typescript
// From: src/screens/StockDetail/StockDetailScreen.tsx & IndexDetailScreen.tsx
async function fetchPlanetaryTransitRows(
  authFetch: any,
  years: number[],
  signal?: AbortSignal
): Promise<TransitRow[]> {
  const response = await authFetch(`/api/transits?year=${year}`, {
    method: 'GET',
    signal,
  });
  // ...
}
```

---

## 4. Grouping & Rating Logic

### A. Astrology Score Calculation

**File**: [src/screens/Calculators/PortfolioAdvancedTools.js](src/screens/Calculators/PortfolioAdvancedTools.js#L26)

```javascript
const ASTRO_SCORE_MAP = {
  // Vitality indicators (Ascendant)
  ascVitality: { 
    weak: -8, 
    neutral: 0, 
    strong: 8 
  },
  
  // House indicators (negative correlates)
  eighthHouse: { 
    weak: -6, 
    neutral: 0, 
    strong: 6 
  },
  sixthHouse: { 
    weak: -5, 
    neutral: 0, 
    strong: 5 
  },
  twelfthHouse: { 
    weak: -4, 
    neutral: 0, 
    strong: 4 
  },
  
  // Saturn tone
  saturnTone: { 
    weak: -4, 
    neutral: 0, 
    strong: 4 
  },
  
  // Mars risk
  marsRisk: { 
    low: 4, 
    moderate: 0, 
    high: -6 
  },
  
  // Moon stability
  moonStability: { 
    stable: 4, 
    variable: -2 
  },
  
  // Dasha flavor
  dashaFlavor: { 
    benefic: 5, 
    neutral: 0, 
    challenging: -5 
  },
};
```

### B. Score Computation Logic

**File**: [src/screens/Calculators/PortfolioAdvancedTools.js#L552](src/screens/Calculators/PortfolioAdvancedTools.js#L552)

```javascript
const out = useMemo(() => {
  // Base score
  const base = 48;
  
  // Contribution from each astrological factor
  const contributions = [
    { key: 'Ascendant vitality', value: ASTRO_SCORE_MAP.ascVitality[ascVitality] ?? 0 },
    { key: '8th house', value: ASTRO_SCORE_MAP.eighthHouse[eighthHouse] ?? 0 },
    { key: '6th (illness)', value: ASTRO_SCORE_MAP.sixthHouse[sixthHouse] ?? 0 },
    { key: '12th (loss/retreat)', value: ASTRO_SCORE_MAP.twelfthHouse[twelfthHouse] ?? 0 },
    { key: 'Saturn tone', value: ASTRO_SCORE_MAP.saturnTone[saturnTone] ?? 0 },
    { key: 'Mars risk', value: ASTRO_SCORE_MAP.marsRisk[marsRisk] ?? 0 },
    { key: 'Moon stability', value: ASTRO_SCORE_MAP.moonStability[moonStability] ?? 0 },
    { key: 'Dasa flavor', value: ASTRO_SCORE_MAP.dashaFlavor[dashaFlavor] ?? 0 },
  ];

  // Input bonus (higher for complete data)
  const inputBonus =
    (name.trim() ? 2 : 0) +
    (birthPlace.trim() ? 2 : 0) +
    (birthDate.trim() ? 3 : 0) +
    (birthTime.trim() ? 3 : 0) +
    (nakshatra.trim() ? 2 : 0);

  // Final score calculation
  const scoreRaw = base + contributions.reduce((sum, c) => sum + c.value, 0) + inputBonus;
  const composite = Math.max(0, Math.min(100, Math.round(scoreRaw)));

  return {
    composite,      // 0-100 scale
    inputBonus,
    contributions,
    summary: interpretScore(composite),
    tip: 'Educational tool only. Not medical advice.'
  };
}, [ascVitality, eighthHouse, sixthHouse, /* ... */]);
```

### C. Score Rating Thresholds

```javascript
// Interpretation logic:
const summary = composite >= 70
  ? 'Higher composite score reflects steadier vitality indicators in this educational framework.'
  : composite >= 45
    ? 'Balanced profile. Improve input accuracy before interpretation.'
    : 'Lower composite score indicates mixed or stress-sensitive signals in this educational model.';

// Rating breakdown:
// ≥ 70: High composite score
// 45-69: Balanced/Medium score
// < 45: Lower composite score
```

---

## 5. View & Rating Score Thresholds

### A. Market Heatmap Colors (Change Percent based)

**File**: [src/screens/Overview/Overview.js#L200](src/screens/Overview/Overview.js#L200)

```javascript
const getTilePalette = (changePercent) => {
  if (changePercent == null || Math.abs(changePercent) < 0.000001) {
    return { fill: '#8F98A3', border: '#A7B0BA', text: '#FFFFFF' }; // Neutral
  }

  if (changePercent >= 2) {
    return { fill: '#0F7A43', border: '#1FE07C', text: '#FFFFFF' }; // Strong bull
  }

  if (changePercent > 0) {
    return { fill: '#22C55E', border: '#7AF0A8', text: '#052714' }; // Mild bull
  }

  if (changePercent <= -2) {
    return { fill: '#8F1233', border: '#FF6B8C', text: '#FFFFFF' }; // Strong bear
  }

  // -2 < changePercent < 0
  return { fill: '#F43F5E', border: '#FF98AA', text: '#FFFFFF' }; // Mild bear
};
```

**Thresholds**:
| Change % | Rating | Color | Meaning |
|----------|--------|-------|---------|
| ≥ 2% | Strong Bullish | #0F7A43 (Dark Green) | Strong uptrend |
| 0 to 2% | Mild Bullish | #22C55E (Light Green) | Mild uptrend |
| ≈ 0% | Neutral | #8F98A3 (Gray) | No movement |
| -2% to 0% | Mild Bearish | #F43F5E (Red) | Mild downtrend |
| ≤ -2% | Strong Bearish | #8F1233 (Dark Red) | Strong downtrend |

### B. Astro Strength Scale (Heatmap)

**Scale**: 0-10 (continuous)

```
0-3:    Low astro strength (unfavorable)
3-6:    Medium astro strength (neutral)
6-8:    High astro strength (favorable)
8-10:   Very high astro strength (highly favorable)
```

---

## 6. Transit Performance Analysis

### A. Transit Data Structure

**File**: [src/screens/IndexDetail/IndexDetailScreen.tsx#L137](src/screens/IndexDetail/IndexDetailScreen.tsx#L137)

```typescript
type TransitRow = {
  planet: string;
  rashi: string;
  start: string;
  end: string | null;
  metadata?: {
    calendarYear?: number;
    timezone?: string;
    source?: string;
  };
  extras?: {
    nakshatra?: string | null;
    motion?: string | null;
    comment?: string | null;
  };
};

type TransitPerformance = {
  key: string;
  mode: TransitMode;              // 'planetary' | 'nakshatra'
  planet: string;
  label: string;
  subLabel: string;
  start: string;
  end: string | null;
  startClose: number;
  endClose: number;
  absChange: number;              // Absolute price change
  pctChange: number;              // Percentage change
  isActive: boolean;              // Is transit currently active?
};
```

### B. Planet Mapping

**File**: [src/screens/IndexDetail/IndexDetailScreen.tsx#L175](src/screens/IndexDetail/IndexDetailScreen.tsx#L175)

```typescript
const DRIK_PLANET_MAP: Record<string, string> = {
  surya: 'Sun',
  chandra: 'Moon',
  mangal: 'Mars',
  budha: 'Mercury',
  guru: 'Jupiter',
  shukra: 'Venus',
  shani: 'Saturn',
  rahu: 'Rahu',
  ketu: 'Ketu',
  arun: 'Uranus',
  varun: 'Neptune',
  yama: 'Pluto',
};
```

---

## 7. Missing Implementation (Needs to be Built)

### A. Required Astro-Analysis Endpoint

```typescript
// Proposed structure for /api/astro-analysis
interface AstroAnalysisResponse {
  ok: boolean;
  data: {
    topUSStocks: StockAnalysis[];
    topIndexETFs: ETFAnalysis[];
    topBondETFs: ETFAnalysis[];
  };
}

interface StockAnalysis {
  symbol: string;
  name: string;
  price: number;
  change: number;
  astroRating: number;        // 0-100
  viewScore: number;          // 0-10
  transitStatus: string;      // e.g., "Favorable", "Neutral", "Challenging"
  keyPlanets: string[];
  ratingThreshold: 'high' | 'medium' | 'low';
}
```

### B. Required Frontend Components

1. **Page/Screen**: `src/screens/AstroAnalysis/page.tsx`
2. **Table Component**: `src/screens/AstroAnalysis/AstroAnalysisTable.tsx`
3. **Grouping Logic**: Data grouping by category (Top U.S. Stocks, ETFs, etc.)
4. **API Integration**: Function to call `/api/astro-analysis`

---

## Summary Table

| Item | Status | Location |
|------|--------|----------|
| Astro-Analysis Screen | ❌ NOT FOUND | `src/screens/AstroAnalysis/` (empty) |
| Astro-Analysis Table | ❌ NOT FOUND | N/A |
| `/api/astro-analysis` Endpoint | ❌ NOT IMPLEMENTED | N/A |
| Data Grouping Logic | ❌ NOT FOUND | N/A |
| Astro Strength Values | ✅ FOUND | `src/features/marketHeatmap/heatmapMeta.ts` |
| Rating/Score Calculation | ✅ FOUND (partial) | `src/screens/Calculators/PortfolioAdvancedTools.js` |
| Heatmap API | ✅ FOUND | `src/features/marketHeatmap/api.ts` |
| Transit Analysis | ✅ FOUND | `src/screens/StockDetail/StockDetailScreen.tsx` |

--- 

## Recommendations

1. **Check Backend**: Verify if `/api/astro-analysis` is implemented on the backend
2. **Feature Flags**: Look for feature flags or development branches
3. **Design Review**: Define the exact data structure and grouping logic before implementation
4. **Start Implementation**: Create the Astro Analysis screen and components in `src/screens/AstroAnalysis/`
