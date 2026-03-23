export type StockTabKey = 'overview' | 'chart' | 'fundamentals' | 'news' | 'alerts';

export interface StockOfficer {
  name: string;
  title: string;
  age: number | null;
  totalPay: number | null;
}

export interface StockInfo {
  symbol: string;
  shortName: string;
  longName: string;
  exchange: string;
  marketState: string;
  sector: string;
  industry: string;
  currency: string;
  regularMarketPrice: number | null;
  regularMarketChange: number | null;
  regularMarketChangePercent: number | null;
  regularMarketOpen: number | null;
  regularMarketPreviousClose: number | null;
  regularMarketDayHigh: number | null;
  regularMarketDayLow: number | null;
  regularMarketClose: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  marketCap: number | null;
  beta: number | null;
  averageDailyVolume3Month: number | null;
  averageDailyVolume10Day: number | null;
  regularMarketVolume: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  dividendYield: number | null;
  grossMargins: number | null;
  operatingMargins: number | null;
  profitMargins: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  revenueGrowth: number | null;
  dividendRate: number | null;
  trailingAnnualDividendRate: number | null;
  trailingAnnualDividendYield: number | null;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  numberOfAnalystOpinions: number | null;
  averageAnalystRating: string;
  recommendationKey: string;
  fullTimeEmployees: number | null;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  longBusinessSummary: string;
  website: string;
  companyOfficers: StockOfficer[];
}

export interface CompanyProfile {
  name: string;
  sector: string;
  industry: string;
  description: string;
  ceo: string;
  founded: string;
  exchange: string;
  website: string;
}

export interface StockHistoryPoint {
  timestamp: number;
  value: number;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
}

export interface StockNewsItem {
  id: string;
  title: string;
  summary: string;
  provider: string;
  publishedAt: string;
  thumbnail: string;
  url: string;
}

export interface StockAlert {
  id: string;
  symbol: string;
  email: string;
  condition: string;
  targetPrice: number | null;
  enabled: boolean;
  raw: Record<string, unknown>;
}

export interface TickerSearchItem {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  market: string;
  active: boolean | null;
  raw: Record<string, unknown>;
}

export interface FundamentalsBundle {
  info: StockInfo | null;
  balanceSheet: Record<string, unknown>[];
  incomeStatement: Record<string, unknown>[];
  earningsEstimate: Record<string, unknown>[];
  earningsHistory: Record<string, unknown>[];
  recommendations: Record<string, unknown>[];
  revenueEstimate: Record<string, unknown>[];
}
