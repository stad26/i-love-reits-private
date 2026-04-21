import {
  BaseAssumptions,
  CapitalEvent,
  PeriodInputs,
  PeriodMetrics,
  ProFormaPeriod,
} from "./types";

// Derive starting state from base assumptions
export interface ProFormaBase {
  noi: number;
  ffoPerShare: number;
  interestExpense: number;
  totalDebt: number;
  totalCash: number;
  sharesOutstanding: number;
  propertyValue: number;
  gna: number;
  weightedAvgCostOfDebt: number;
}

export function deriveBase(a: BaseAssumptions): ProFormaBase | null {
  if (
    a.inPlaceNOI == null ||
    a.sharesOutstanding == null ||
    a.totalDebt == null ||
    a.totalCash == null
  )
    return null;

  const noi = a.inPlaceNOI;
  const shares = a.sharesOutstanding;
  const debt = a.totalDebt;
  const cash = a.totalCash;
  const preferred = a.preferredEquity ?? 0;

  // EV-implied cap rate → property value
  const marketCap = a.sharePrice != null ? a.sharePrice * shares : null;
  const ev = marketCap != null ? marketCap + debt - cash + preferred : null;
  const impliedCapRate = ev != null && ev > 0 ? (noi / ev) * 100 : null;
  const capRate = impliedCapRate ?? 5.5;
  const propValue = (noi / capRate) * 100;

  return {
    noi,
    ffoPerShare: a.ffoPerDilutedShare ?? noi / shares,
    interestExpense: 0,
    totalDebt: debt,
    totalCash: cash,
    sharesOutstanding: shares,
    propertyValue: propValue,
    gna: 0,
    weightedAvgCostOfDebt: 4,
  };
}

// Apply capital events to a state, returning updated state
function applyEvents(
  state: ProFormaBase,
  events: CapitalEvent[]
): ProFormaBase {
  let { noi, totalDebt, totalCash, sharesOutstanding, propertyValue, interestExpense, weightedAvgCostOfDebt } =
    state;

  for (const ev of events) {
    switch (ev.type) {
      case "equity_issuance": {
        const price = ev.pricePerShare ?? 0;
        const newShares = price > 0 ? ev.amount / price : 0;
        sharesOutstanding += newShares;
        totalCash += ev.amount;
        break;
      }
      case "equity_buyback": {
        const price = ev.pricePerShare ?? 0;
        const buyShares = price > 0 ? ev.amount / price : 0;
        sharesOutstanding = Math.max(0, sharesOutstanding - buyShares);
        totalCash -= ev.amount;
        break;
      }
      case "debt_issuance": {
        const rate = ev.interestRate ?? weightedAvgCostOfDebt;
        totalDebt += ev.amount;
        totalCash += ev.amount;
        interestExpense += (ev.amount * rate) / 100;
        // Recalculate weighted avg cost of debt
        weightedAvgCostOfDebt =
          totalDebt > 0 ? (interestExpense / totalDebt) * 100 : weightedAvgCostOfDebt;
        break;
      }
      case "debt_paydown": {
        const payAmount = Math.min(ev.amount, totalDebt);
        interestExpense -= (payAmount * weightedAvgCostOfDebt) / 100;
        totalDebt -= payAmount;
        totalCash -= payAmount;
        interestExpense = Math.max(0, interestExpense);
        break;
      }
      case "acquisition": {
        const capRate = ev.capRate ?? 5;
        propertyValue += ev.amount;
        noi += (ev.amount * capRate) / 100;
        totalCash -= ev.amount;
        break;
      }
      case "disposition": {
        const capRate = ev.capRate ?? 5;
        const removedNoi = (ev.amount * capRate) / 100;
        noi = Math.max(0, noi - removedNoi);
        propertyValue = Math.max(0, propertyValue - ev.amount);
        totalCash += ev.amount;
        break;
      }
    }
  }

  return {
    ...state,
    noi,
    totalDebt,
    totalCash,
    sharesOutstanding,
    propertyValue,
    interestExpense,
    weightedAvgCostOfDebt,
  };
}

function computeMetrics(state: ProFormaBase, period: ProFormaPeriod): PeriodMetrics {
  const { noi, totalDebt, totalCash, sharesOutstanding, propertyValue, interestExpense, gna } = state;
  const ffoTotal = Math.max(0, noi - interestExpense - gna);
  const ffoPerShare = sharesOutstanding > 0 ? ffoTotal / sharesOutstanding : 0;
  const capRate = propertyValue > 0 ? (noi / propertyValue) * 100 : 0;
  const nav = propertyValue - (totalDebt - totalCash);
  const navPerShare = sharesOutstanding > 0 ? nav / sharesOutstanding : 0;
  const netDebtPerShare = sharesOutstanding > 0 ? (totalDebt - totalCash) / sharesOutstanding : 0;

  return {
    period,
    noi,
    ffo: ffoTotal,
    ffoPerShare,
    interestExpense,
    totalDebt,
    totalCash,
    sharesOutstanding,
    propertyValue,
    capRate,
    navPerShare,
    netDebtPerShare,
  };
}

export function computeProForma(
  base: ProFormaBase,
  periods: PeriodInputs[],
  mode: "quarterly" | "annual"
): PeriodMetrics[] {
  const results: PeriodMetrics[] = [];
  let state = { ...base };

  for (const p of periods) {
    // Apply NOI growth (annualized rate prorated for quarterly)
    const growthFactor = mode === "quarterly"
      ? 1 + p.noiGrowthRate / 100 / 4
      : 1 + p.noiGrowthRate / 100;

    state = { ...state, noi: state.noi * growthFactor };

    // Apply capital events
    state = applyEvents(state, p.events);

    // Apply any manual FFO adjustment percentage
    if (p.ffoAdjustment !== 0) {
      // Store as a note — we'll reflect this in ffoPerShare after computing
    }

    const metrics = computeMetrics(state, p.period);

    // Apply FFO adjustment on top
    const adjFfoPerShare = metrics.ffoPerShare * (1 + p.ffoAdjustment / 100);

    results.push({ ...metrics, ffoPerShare: adjFfoPerShare, ffo: adjFfoPerShare * state.sharesOutstanding });
  }

  return results;
}

// What growth rate in FFO/share is implied by the current stock price?
// price = ffoPerShare * (1 + g)^periods * multiple
// Solve for g given a P/FFO multiple
export function impliedGrowthRate(
  currentPrice: number,
  baseFfoPerShare: number,
  multipleAssumption: number,
  periods = 1
): number | null {
  if (!baseFfoPerShare || !multipleAssumption || !currentPrice) return null;
  // implied ffo = price / multiple
  const impliedFfo = currentPrice / multipleAssumption;
  // impliedFfo = baseFfo * (1+g)^periods
  const g = Math.pow(impliedFfo / baseFfoPerShare, 1 / periods) - 1;
  return g * 100; // return as percentage
}

// What NOI growth is implied at current price given a cap rate?
export function impliedNoiGrowth(
  currentPrice: number,
  baseNoi: number,
  shares: number,
  netDebtPerShare: number,
  capRateAssumption: number
): number | null {
  if (!baseNoi || !shares || !capRateAssumption || !currentPrice) return null;
  // equity_value = noi / capRate - netDebt (total)
  const impliedEquityValue = (currentPrice + netDebtPerShare) * shares;
  const impliedNoi = impliedEquityValue * (capRateAssumption / 100);
  return ((impliedNoi / baseNoi) - 1) * 100;
}

export const PERIOD_LABELS: Record<string, string> = {
  Q1: "Q1",
  Q2: "Q2",
  Q3: "Q3",
  Q4: "Q4",
  FY: "Full Year",
};

export function makeDefaultPeriods(mode: "quarterly" | "annual"): PeriodInputs[] {
  if (mode === "annual") {
    return [{
      period: "FY",
      noiGrowthRate: 3,
      ffoAdjustment: 0,
      events: [],
    }];
  }
  return (["Q1", "Q2", "Q3", "Q4"] as ProFormaPeriod[]).map((p) => ({
    period: p,
    noiGrowthRate: 3,
    ffoAdjustment: 0,
    events: [],
  }));
}
