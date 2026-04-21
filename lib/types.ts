// ─── Market Data (Yahoo Finance) ─────────────────────────────────────────────

export interface QuoteData {
  ticker: string;
  name: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  epsForward: number | null;
  epsCurrent: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;
  earningsDate: string | null;
  currency: string;
  totalDebt: number | null;
  totalCash: number | null;
  revenueGrowth: number | null;
  operatingCashflow: number | null;
  debtToEquity: number | null;
  recommendationMean: number | null;
  recommendationKey: string | null;
  numberOfAnalystOpinions: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  targetMeanPrice: number | null;
  volume: number | null;
  avgVolume: number | null;
  error?: string;
}

// ─── Base Case Assumptions (user-editable, pre-populated from Yahoo Finance) ──

export interface BaseAssumptions {
  // Auto-filled from Yahoo Finance
  sharePrice: number | null;              // $ per share
  sharesOutstanding: number | null;       // millions of shares, fully diluted (incl. OP units)
  totalDebt: number | null;              // $mm — gross debt, all tranches
  totalCash: number | null;              // $mm — unrestricted cash only
  // Current period — user inputs from earnings press release / supplemental
  ffoPerDilutedShare: number | null;     // $ per diluted share — Normalized FFO from press release
  inPlaceNOI: number | null;             // $mm annualized — Cash NOI from supplemental (most recent Q × 4)
  preferredEquity: number | null;        // $mm — liquidation value of preferred (shares × $25 for public pfd); 0 if none
  // Prior year — for computing YoY growth rates (centers sensitivity tables)
  priorYearFFOPerShare: number | null;   // $ per diluted share — same period prior year
  /** Enter YoY growth directly instead of prior FFO (alternative to priorYearFFOPerShare). */
  ffoGrowthInputMode: "prior_ffo" | "growth_pct";
  ffoYoYGrowthPercent: number | null;    // YoY % — used when ffoGrowthInputMode === "growth_pct"
  priorYearNOI: number | null;           // $mm annualized — same period prior year
  sameStoreNOI: number | null;           // $mm annualized — same store only (not used in valuation math)
  sameStoreNOIGrowth: number | null;     // YoY % — pulled directly from disclosure
}

export const DEFAULT_BASE_ASSUMPTIONS: BaseAssumptions = {
  sharePrice: null,
  sharesOutstanding: null,
  totalDebt: null,
  totalCash: null,
  ffoPerDilutedShare: null,
  inPlaceNOI: null,
  preferredEquity: null,
  priorYearFFOPerShare: null,
  ffoGrowthInputMode: "prior_ffo",
  ffoYoYGrowthPercent: null,
  priorYearNOI: null,
  sameStoreNOI: null,
  sameStoreNOIGrowth: null,
};

// ─── Returns ─────────────────────────────────────────────────────────────────

export interface ReturnsData {
  ticker: string;
  return1W: number | null;
  return1M: number | null;
  return3M: number | null;
  return6M: number | null;
  returnYTD: number | null;
  return1Y: number | null;
  error?: string;
}

// ─── Pro-Forma ────────────────────────────────────────────────────────────────

export type CapitalEventType =
  | "equity_issuance"
  | "equity_buyback"
  | "debt_issuance"
  | "debt_paydown"
  | "acquisition"
  | "disposition";

export type ProFormaPeriod = "Q1" | "Q2" | "Q3" | "Q4" | "FY";

export interface CapitalEvent {
  id: string;
  type: CapitalEventType;
  label: string;
  amount: number;          // $M (gross proceeds/cost)
  pricePerShare?: number;  // $ for equity events
  capRate?: number;        // % for acquisitions/dispositions
  interestRate?: number;   // % for debt events
}

export interface PeriodInputs {
  period: ProFormaPeriod;
  noiGrowthRate: number;   // % annualized
  ffoAdjustment: number;   // % manual FFO adj beyond NOI (e.g. fee income, other)
  events: CapitalEvent[];
}

// Computed output for one period
export interface PeriodMetrics {
  period: ProFormaPeriod;
  noi: number;             // $M annualized run-rate
  ffo: number;             // $M annualized
  ffoPerShare: number;
  interestExpense: number; // $M annualized
  totalDebt: number;       // $M
  totalCash: number;       // $M
  sharesOutstanding: number; // M shares
  propertyValue: number;   // $M
  capRate: number;         // %
  navPerShare: number;
  netDebtPerShare: number;
}

export interface ProFormaState {
  mode: "quarterly" | "annual";
  periods: PeriodInputs[];
}

// ─── Valuation / Sensitivity ──────────────────────────────────────────────────

export type ValuationMode = "base" | "proforma";

export interface SensitivityAxis {
  values: number[];
  label: string;
}

export interface SensitivityTable {
  rows: SensitivityAxis;   // e.g. FFO growth rates
  cols: SensitivityAxis;   // e.g. P/FFO multiples
  cells: (number | null)[][];  // implied price
  currentPrice: number | null;
  hereRow: number | null;  // index of row closest to "you are here"
  hereCol: number | null;  // index of col closest to "you are here"
}

// Peer snapshot used in valuation comparisons
export interface PeerSnapshot {
  ticker: string;
  name: string;
  price: number | null;
  pFfo: number | null;
  impliedCapRate: number | null;
  navPremiumDiscount: number | null;
  dividendYield: number | null;
  marketCap: number | null;
}

// ─── Legacy types (kept for InsightsPanel, NotesChat, ScenarioPanel compat) ───

export interface Assumptions {
  ffoPerShare: number | null;
  affoPerShare: number | null;
  noiGrowth: number | null;
  capRate: number | null;
  payoutRatio: number | null;
  costOfDebt: number | null;
  acquisitionAmount: number | null;
  yieldOnCost: number | null;
  dispositionAmount: number | null;
  navPerShare: number | null;
}

export interface Scenario {
  name: "Bull" | "Base" | "Bear";
  ffoGrowth: number;
  noiGrowth: number;
  capRateChange: number;
  impliedValue: number | null;
  targetPrice: number | null;
  upside: number | null;
  totalReturn: number | null;
}

export interface ValuationRow {
  ticker: string;
  name: string;
  sector: string;
  price: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  pFfo: number | null;
  pAffo: number | null;
  impliedCapRate: number | null;
  navPremiumDiscount: number | null;
  leverage: number | null;
}
