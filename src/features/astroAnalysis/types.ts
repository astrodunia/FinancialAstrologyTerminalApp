export type AstroAnalysisCategory = 'usStocks' | 'indexEtfs' | 'bondEtfs';

export type TermDetail = {
  view: string;
  entry: number | null;
  targetPrice: number | null;
  stopLoss: number | null;
  cause: string;
};

export type AstroAnalysisRow = {
  symbol: string;
  name?: string | null;
  category?: AstroAnalysisCategory | null;
  astroScore?: number | null;
  astroStrength?: number | null;
  score?: number | null;
  rating?: string | null;
  view?: string | null;
  price?: number | null;
  change?: number | null;
  changePercent?: number | null;
  shortTermView?: string | null;
  midTermView?: string | null;
  longTermView?: string | null;
  shortTermDetail?: TermDetail | null;
  midTermDetail?: TermDetail | null;
  longTermDetail?: TermDetail | null;
  [key: string]: any;
};

export type GroupedAstroAnalysis = {
  usStocks: AstroAnalysisRow[];
  indexEtfs: AstroAnalysisRow[];
  bondEtfs: AstroAnalysisRow[];
};

export type AstroAnalysisResponse = {
  ok?: boolean;
  data?: AstroAnalysisRow[];
  rows?: AstroAnalysisRow[];
  items?: AstroAnalysisRow[];
};
