import type { AstroAnalysisResponse, AstroAnalysisRow, AstroAnalysisCategory, GroupedAstroAnalysis, TermDetail } from './types';

type Fetcher = (path: string, init?: RequestInit) => Promise<Response>;

const RATING_THRESHOLDS = { high: 70, medium: 45 };

const BOND_ETF_SYMBOLS = new Set([
  'TLT', 'IEF', 'SHY', 'HYG', 'LQD', 'BND', 'AGG', 'BLV', 'VCIT', 'VCSH',
  'VWOB', 'PCY', 'EMB', 'ANGL', 'JNK', 'HYD', 'HYLD', 'FAGX', 'FBND',
]);

const INDEX_ETF_SYMBOLS = new Set([
  'SPY', 'VOO', 'IVV', 'VTI', 'SPLG', 'SCHX', 'SCHB',
  'QQQ', 'QQQM', 'TQQQ', 'PSCD', 'SPLV', 'SCHV',
  'DIA', 'IWM', 'RUT', 'EFA', 'VEA', 'IEFA', 'EEM', 'VWO',
  'ARKG', 'ARKQ', 'ARKW', 'ICLN', 'TAN', 'BOTZ', 'FINX', 'HACK', 'LIT', 'MJ',
]);

const categorizeSymbol = (symbol: string): AstroAnalysisCategory => {
  const norm = (symbol || '').toUpperCase();
  if (BOND_ETF_SYMBOLS.has(norm)) return 'bondEtfs';
  if (INDEX_ETF_SYMBOLS.has(norm)) return 'indexEtfs';
  return 'usStocks';
};

const computeRating = (score?: number | null): string => {
  if (score == null || !Number.isFinite(score)) return 'Neutral';
  if (score >= RATING_THRESHOLDS.high) return 'Strong';
  if (score >= RATING_THRESHOLDS.medium) return 'Moderate';
  return 'Weak';
};

const computeView = (score?: number | null): string => {
  const rating = computeRating(score);
  if (rating === 'Strong') return 'Bullish';
  if (rating === 'Moderate') return 'Mixed';
  if (rating === 'Weak') return 'Bearish';
  return 'Neutral';
};

const normalizeRowScore = (row: AstroAnalysisRow): number | null => {
  const score = row?.astroScore ?? row?.score ?? row?.astroStrength ?? null;
  if (score == null) return null;
  const num = Number(score);
  return Number.isFinite(num) ? num : null;
};

const toNum = (v: any): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const resolveTermDetail = (termValue: any, row: AstroAnalysisRow, prefix: string): TermDetail | null => {
  if (!termValue && !row?.[`${prefix}Entry`] && !row?.[`${prefix}Target`]) return null;

  if (termValue && typeof termValue === 'object') {
    return {
      view: String(termValue.view || termValue.outlook || termValue.status || ''),
      entry: toNum(termValue.entry ?? termValue.entryPrice ?? termValue.entry_price),
      targetPrice: toNum(termValue.target ?? termValue.targetPrice ?? termValue.target_price),
      stopLoss: toNum(termValue.stopLoss ?? termValue.stop_loss ?? termValue.stoploss),
      cause: String(termValue.cause || termValue.reason || termValue.tradingIdea || termValue.idea || ''),
    };
  }

  return {
    view: typeof termValue === 'string' ? termValue : '',
    entry: toNum(row?.[`${prefix}Entry`] ?? row?.[`${prefix}EntryPrice`]),
    targetPrice: toNum(row?.[`${prefix}Target`] ?? row?.[`${prefix}TargetPrice`]),
    stopLoss: toNum(row?.[`${prefix}StopLoss`] ?? row?.[`${prefix}Stop`]),
    cause: String(row?.[`${prefix}Cause`] || row?.[`${prefix}Reason`] || row?.[`${prefix}Idea`] || ''),
  };
};

const mapAstroAnalysisRow = (row: AstroAnalysisRow): AstroAnalysisRow => {
  const score = normalizeRowScore(row);

  const shortTermRaw = row?.shortTerm ?? row?.shortTermView ?? row?.short_term ?? null;
  const midTermRaw = row?.midTerm ?? row?.midTermView ?? row?.mid_term ?? null;
  const longTermRaw = row?.longTerm ?? row?.longTermView ?? row?.long_term ?? null;

  const shortTermDetail = resolveTermDetail(shortTermRaw, row, 'shortTerm');
  const midTermDetail = resolveTermDetail(midTermRaw, row, 'midTerm');
  const longTermDetail = resolveTermDetail(longTermRaw, row, 'longTerm');

  const shortTermView = shortTermDetail?.view || (typeof shortTermRaw === 'string' ? shortTermRaw : '') || '';
  const midTermView = midTermDetail?.view || (typeof midTermRaw === 'string' ? midTermRaw : '') || '';
  const longTermView = longTermDetail?.view || (typeof longTermRaw === 'string' ? longTermRaw : '') || '';

  const computed = ['Strong', 'Moderate', 'Weak', 'Neutral'];
  const rawRating = row?.rating ?? row?.analysisRating ?? null;
  const apiRating = typeof rawRating === 'string' && !computed.includes(rawRating) ? rawRating : null;

  return {
    ...row,
    symbol: String(row?.symbol || '').toUpperCase(),
    name: String(row?.name || row?.shortName || row?.companyName || ''),
    category: row?.category || categorizeSymbol(String(row?.symbol || '')),
    astroScore: score,
    rating: apiRating || computeRating(score),
    view: computeView(score),
    price: toNum(row?.price),
    change: toNum(row?.change ?? row?.priceChange),
    changePercent: toNum(row?.changePercent ?? row?.priceChangePercent),
    shortTermView,
    midTermView,
    longTermView,
    shortTermDetail,
    midTermDetail,
    longTermDetail,
  };
};

const groupRowsByCategory = (rows: AstroAnalysisRow[]): GroupedAstroAnalysis => {
  const grouped: GroupedAstroAnalysis = { usStocks: [], indexEtfs: [], bondEtfs: [] };
  rows.forEach((row) => {
    const mapped = mapAstroAnalysisRow(row);
    const category = mapped.category || 'usStocks';
    grouped[category].push(mapped);
  });
  return grouped;
};

const parseAstroResponse = (payload: unknown): AstroAnalysisRow[] => {
  if (Array.isArray(payload)) return payload as AstroAnalysisRow[];
  if (Array.isArray((payload as any)?.data)) return (payload as any).data as AstroAnalysisRow[];
  if (Array.isArray((payload as any)?.rows)) return (payload as any).rows as AstroAnalysisRow[];
  if (Array.isArray((payload as any)?.items)) return (payload as any).items as AstroAnalysisRow[];
  if (Array.isArray((payload as any)?.result)) return (payload as any).result as AstroAnalysisRow[];
  return [];
};

const requestJson = async (path: string, fetcher: Fetcher, signal?: AbortSignal) => {
  const response = await fetcher(path, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  try { return await response.json(); } catch { throw new Error('Invalid JSON response'); }
};

export const fetchAstroAnalysis = async (
  fetcher: Fetcher,
  signal?: AbortSignal,
): Promise<GroupedAstroAnalysis> => {
  try {
    const payload = await requestJson('/api/astro-analysis', fetcher, signal);
    const rows = parseAstroResponse(payload);
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('No astro-analysis data available');
    return groupRowsByCategory(rows);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch astro-analysis');
  }
};

export { computeRating, computeView, normalizeRowScore };
