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

/** YoY same store NOI growth % — from either prior/current SS NOI or direct %. Centers cap rate table. */
export function effectiveSameStoreNOIGrowthPercent(a: BaseAssumptions): number | null {
  if (a.sameStoreNOIInputMode === "growth_pct") {
    return a.sameStoreNOIGrowth ?? null;
  }
  if (a.sameStoreNOI != null && a.priorYearSameStoreNOI != null && a.priorYearSameStoreNOI > 0) {
    return ((a.sameStoreNOI - a.priorYearSameStoreNOI) / a.priorYearSameStoreNOI) * 100;
  }
  return null;
}

/** Prior SS NOI implied by current SS NOI and entered growth % (for display in growth_pct mode). */
export function impliedPriorSameStoreNOIFromGrowth(a: BaseAssumptions): number | null {
  if (a.sameStoreNOIInputMode !== "growth_pct" || a.sameStoreNOI == null || a.sameStoreNOIGrowth == null) return null;
  const g = a.sameStoreNOIGrowth / 100;
  if (g <= -1) return null;
  return a.sameStoreNOI / (1 + g);
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
