import * as XLSX from "xlsx";
import { ValuationRow, Assumptions, Scenario } from "./types";

export function exportToExcel(
  ticker: string,
  valuation: ValuationRow[],
  assumptions: Assumptions,
  scenarios: Scenario[]
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Valuation Table
  const valuationData = valuation.map((r) => ({
    Ticker: r.ticker,
    Company: r.name,
    Sector: r.sector,
    "Price ($)": r.price ?? "",
    "Market Cap": r.marketCap ?? "",
    "Div Yield": r.dividendYield != null ? `${(r.dividendYield * 100).toFixed(2)}%` : "",
    "P/FFO": r.pFfo ?? "",
    "P/AFFO": r.pAffo ?? "",
    "Implied Cap Rate": r.impliedCapRate != null ? `${r.impliedCapRate.toFixed(2)}%` : "",
    "NAV Premium/Discount": r.navPremiumDiscount != null ? `${r.navPremiumDiscount.toFixed(1)}%` : "",
  }));
  const ws1 = XLSX.utils.json_to_sheet(valuationData);
  XLSX.utils.book_append_sheet(wb, ws1, "Valuation");

  // Sheet 2: Assumptions
  const assumptionsData = [
    { Assumption: "FFO / Share ($)", Value: assumptions.ffoPerShare ?? "" },
    { Assumption: "AFFO / Share ($)", Value: assumptions.affoPerShare ?? "" },
    { Assumption: "NOI Growth (%)", Value: assumptions.noiGrowth ?? "" },
    { Assumption: "Cap Rate (%)", Value: assumptions.capRate ?? "" },
    { Assumption: "Payout Ratio (%)", Value: assumptions.payoutRatio ?? "" },
    { Assumption: "Cost of Debt (%)", Value: assumptions.costOfDebt ?? "" },
    { Assumption: "Acquisition Amount ($M)", Value: assumptions.acquisitionAmount ?? "" },
    { Assumption: "Yield on Cost (%)", Value: assumptions.yieldOnCost ?? "" },
    { Assumption: "Disposition Amount ($M)", Value: assumptions.dispositionAmount ?? "" },
    { Assumption: "NAV / Share ($)", Value: assumptions.navPerShare ?? "" },
  ];
  const ws2 = XLSX.utils.json_to_sheet(assumptionsData);
  XLSX.utils.book_append_sheet(wb, ws2, "Assumptions");

  // Sheet 3: Scenarios
  const scenarioData = scenarios.map((s) => ({
    Scenario: s.name,
    "FFO Growth (%)": s.ffoGrowth,
    "NOI Growth (%)": s.noiGrowth,
    "Cap Rate Change (bps)": s.capRateChange,
    "Implied Value ($)": s.impliedValue ?? "",
    "Target Price ($)": s.targetPrice ?? "",
    "Upside/Downside (%)": s.upside ?? "",
    "Total Return (%)": s.totalReturn ?? "",
  }));
  const ws3 = XLSX.utils.json_to_sheet(scenarioData);
  XLSX.utils.book_append_sheet(wb, ws3, "Scenarios");

  XLSX.writeFile(wb, `${ticker}_REIT_Analysis.xlsx`);
}
