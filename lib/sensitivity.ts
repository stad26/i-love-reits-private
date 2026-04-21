import { SensitivityTable } from "./types";

// Generate a linear range of N values centered around a midpoint
export function makeRange(center: number, step: number, count = 5): number[] {
  const half = Math.floor(count / 2);
  return Array.from({ length: count }, (_, i) => {
    const val = center + (i - half) * step;
    return Math.round(val * 1000) / 1000;
  });
}

// Find the index in an array closest to a target value
function closestIdx(arr: number[], target: number): number {
  return arr.reduce((best, v, i) =>
    Math.abs(v - target) < Math.abs(arr[best] - target) ? i : best, 0);
}

// ─── P/FFO Sensitivity ────────────────────────────────────────────────────────
// rows = FFO growth rates (%)  centered on actual YoY FFO growth
// cols = P/FFO multiples (x)   centered on current implied multiple
// cell = ffoPerShare * (1 + growthRate/100) * multiple

export function buildPFFOTable(opts: {
  baseFfoPerShare: number;
  currentPrice: number | null;
  ffoGrowthRate?: number | null;  // actual YoY FFO growth % — centers the growth axis
  growthRates?: number[];         // manual override (must be 5 values)
  multiples?: number[];           // manual override (must be 5 values)
}): SensitivityTable {
  // Center growth axis on actual YoY growth (or 5% if unknown)
  const growthCenter = opts.ffoGrowthRate != null ? opts.ffoGrowthRate : 5;
  // Center multiple axis on current implied P/FFO (or 17x if no price)
  const impliedMultiple = opts.currentPrice && opts.baseFfoPerShare
    ? opts.currentPrice / opts.baseFfoPerShare
    : 17;

  const growthRates = opts.growthRates ?? makeRange(growthCenter, 2.5, 5);
  const multiples   = opts.multiples   ?? makeRange(Math.round(impliedMultiple / 2) * 2, 2, 5);

  const cells = growthRates.map((g) =>
    multiples.map((m) => {
      const fwd = opts.baseFfoPerShare * (1 + g / 100);
      return Math.round(fwd * m * 100) / 100;
    })
  );

  // "You are here": actual growth rate row × implied multiple col
  const hereRow = closestIdx(growthRates, growthCenter);
  const hereCol = closestIdx(multiples, impliedMultiple);

  return {
    rows: { values: growthRates, label: "FFO Growth (%)" },
    cols: { values: multiples, label: "P/FFO Multiple (x)" },
    cells,
    currentPrice: opts.currentPrice ?? null,
    hereRow,
    hereCol,
  };
}

// ─── Implied Cap Rate Sensitivity ─────────────────────────────────────────────
// rows = NOI growth rates (%)  centered on actual YoY NOI growth
// cols = cap rates (%)         centered on market-implied cap rate
// cell = (baseNoi*(1+g%) / capRate%) - netDebt) / shares
// netDebt = totalDebt - totalCash + preferredEquity

export function buildCapRateTable(opts: {
  baseNoi: number;           // $mm annualized
  sharesOutstanding: number; // mm shares
  netDebt: number;           // $mm (totalDebt - totalCash + preferredEquity)
  currentPrice: number | null;
  currentCapRate: number | null; // market-implied cap rate — centers cap rate axis
  noiGrowthRate?: number | null; // actual YoY NOI growth % — centers growth axis
  growthRates?: number[];        // manual override (5 values)
  capRates?: number[];           // manual override (5 values)
}): SensitivityTable {
  const growthCenter  = opts.noiGrowthRate != null ? opts.noiGrowthRate : 3;
  const capRateCenter = opts.currentCapRate ?? 5.5;

  const growthRates = opts.growthRates ?? makeRange(growthCenter, 2, 5);
  const capRates    = opts.capRates    ?? makeRange(capRateCenter, 0.5, 5);

  const cells = growthRates.map((g) =>
    capRates.map((cr) => {
      if (cr <= 0 || opts.sharesOutstanding <= 0) return null;
      const fwdNoi = opts.baseNoi * (1 + g / 100);
      const impliedEV = (fwdNoi / cr) * 100;
      const equityValue = impliedEV - opts.netDebt;
      const pricePerShare = equityValue / opts.sharesOutstanding;
      return Math.round(pricePerShare * 100) / 100;
    })
  );

  // "You are here": actual NOI growth row × current implied cap rate col
  const hereRow = closestIdx(growthRates, growthCenter);
  const hereCol = opts.currentCapRate != null ? closestIdx(capRates, opts.currentCapRate) : null;

  return {
    rows: { values: growthRates, label: "NOI Growth (%)" },
    cols: { values: capRates, label: "Cap Rate (%)" },
    cells,
    currentPrice: opts.currentPrice ?? null,
    hereRow,
    hereCol,
  };
}

// ─── NAV Sensitivity ──────────────────────────────────────────────────────────
// rows = cap rates (%)   auto-centered on market-implied cap rate ±100bps in 50bps steps
// cols = P/NAV multiples 0.80x → 1.20x in 0.10x steps
// cell = (baseNoi / capRate% − netDebt) / shares × multiple
// "You are here": implied cap rate row × the multiple closest to currentPrice / navAtImpliedCapRate

export function buildNAVTable(opts: {
  baseNoi: number;
  sharesOutstanding: number;
  netDebt: number;
  currentPrice: number | null;
  impliedCapRate: number | null;  // centers the cap rate axis
  currentPNav?: number | null;    // currentPrice / navAtImpliedCapRate — centers the P/NAV axis
  capRates?: number[];            // manual override (5 values)
  multiples?: number[];           // manual override (5 values)
}): SensitivityTable {
  const center   = opts.impliedCapRate ?? 5.5;
  const capRates = opts.capRates ?? makeRange(center, 0.5, 5);
  // P/NAV multiples: 0.80x → 1.20x
  const multiples = opts.multiples ?? [0.80, 0.90, 1.00, 1.10, 1.20];

  const cells = capRates.map((cr) =>
    multiples.map((mult) => {
      if (cr <= 0 || opts.sharesOutstanding <= 0) return null;
      const propValue  = (opts.baseNoi / cr) * 100;
      const navPerShare = (propValue - opts.netDebt) / opts.sharesOutstanding;
      return Math.round(navPerShare * mult * 100) / 100;
    })
  );

  // "You are here": implied cap rate row × closest P/NAV to current price
  const hereRow = opts.impliedCapRate != null ? closestIdx(capRates, opts.impliedCapRate) : null;
  const hereCol = opts.currentPNav != null ? closestIdx(multiples, opts.currentPNav) : closestIdx(multiples, 1.0);

  return {
    rows: { values: capRates,   label: "Cap Rate (%)" },
    cols: { values: multiples,  label: "P/NAV" },
    cells,
    currentPrice: opts.currentPrice ?? null,
    hereRow,
    hereCol,
  };
}

// ─── Color heat-map helper ────────────────────────────────────────────────────
// Returns a Tailwind bg class based on how far the cell price is from current price

export function heatColor(cellPrice: number | null, currentPrice: number | null): string {
  if (cellPrice === null || currentPrice === null) return "bg-gray-50 dark:bg-gray-800/30";
  const pct = (cellPrice - currentPrice) / currentPrice;
  if (pct >= 0.20)  return "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100";
  if (pct >= 0.10)  return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200";
  if (pct >= 0.03)  return "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
  if (pct >= -0.03) return "bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300";
  if (pct >= -0.10) return "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300";
  if (pct >= -0.20) return "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200";
  return "bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100";
}
