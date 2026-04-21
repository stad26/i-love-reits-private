import type { BaseAssumptions } from "./types";

/** YoY FFO growth % used for P/FFO sensitivity centering — from either prior FFO or direct %. */
export function effectiveFfoYoYGrowthPercent(a: BaseAssumptions): number | null {
  if (a.ffoGrowthInputMode === "growth_pct") {
    if (a.ffoYoYGrowthPercent == null) return null;
    return a.ffoYoYGrowthPercent;
  }
  if (
    a.ffoPerDilutedShare != null &&
    a.priorYearFFOPerShare != null &&
    a.priorYearFFOPerShare > 0
  ) {
    return ((a.ffoPerDilutedShare - a.priorYearFFOPerShare) / a.priorYearFFOPerShare) * 100;
  }
  return null;
}

/** Prior-period FFO/sh implied by current FFO and entered YoY growth % (for display in growth_pct mode). */
export function impliedPriorFfoPerShareFromGrowth(a: BaseAssumptions): number | null {
  if (
    a.ffoGrowthInputMode !== "growth_pct" ||
    a.ffoPerDilutedShare == null ||
    a.ffoYoYGrowthPercent == null
  ) {
    return null;
  }
  const g = a.ffoYoYGrowthPercent / 100;
  if (g <= -1) return null;
  return a.ffoPerDilutedShare / (1 + g);
}
