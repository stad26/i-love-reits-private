/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "No ticker provided" }, { status: 400 });
  }

  try {
    const [summary, timeSeries] = await Promise.allSettled([
      yf.quoteSummary(ticker, {
        modules: [
          "incomeStatementHistory",
          "cashflowStatementHistory",
          "balanceSheetHistory",
          "incomeStatementHistoryQuarterly",
          "cashflowStatementHistoryQuarterly",
          "balanceSheetHistoryQuarterly",
          "earningsHistory",
          "financialData",
          "defaultKeyStatistics",
        ],
      }),
      Promise.resolve(null), // placeholder for future timeseries
    ]);

    const s: any = summary.status === "fulfilled" ? summary.value : {};
    const ts: any = timeSeries.status === "fulfilled" ? timeSeries.value : null;

    // Annual income statements
    const annualIncome = (s?.incomeStatementHistory?.incomeStatementHistory ?? []).map((r: any) => ({
      date: r.endDate ? new Date(r.endDate).getFullYear() : null,
      totalRevenue: r.totalRevenue ?? null,
      grossProfit: r.grossProfit ?? null,
      operatingIncome: r.operatingIncome ?? null,
      netIncome: r.netIncome ?? null,
      ebit: r.ebit ?? null,
      interestExpense: r.interestExpense ?? null,
    }));

    // Annual cash flow
    const annualCashflow = (s?.cashflowStatementHistory?.cashflowStatements ?? []).map((r: any) => ({
      date: r.endDate ? new Date(r.endDate).getFullYear() : null,
      operatingCashflow: r.totalCashFromOperatingActivities ?? null,
      capex: r.capitalExpenditures ?? null,
      freeCashflow: r.totalCashFromOperatingActivities != null && r.capitalExpenditures != null
        ? r.totalCashFromOperatingActivities + r.capitalExpenditures
        : null,
      dividendsPaid: r.dividendsPaid ?? null,
    }));

    // Annual balance sheet
    const annualBalance = (s?.balanceSheetHistory?.balanceSheetStatements ?? []).map((r: any) => ({
      date: r.endDate ? new Date(r.endDate).getFullYear() : null,
      totalAssets: r.totalAssets ?? null,
      totalLiab: r.totalLiab ?? null,
      totalStockholderEquity: r.totalStockholderEquity ?? null,
      longTermDebt: r.longTermDebt ?? null,
      cash: r.cash ?? null,
      shortLongTermDebt: r.shortLongTermDebt ?? null,
    }));

    // Quarterly income (last 8 quarters)
    const quarterlyIncome = (s?.incomeStatementHistoryQuarterly?.incomeStatementHistory ?? []).map((r: any) => ({
      date: r.endDate ? r.endDate : null,
      totalRevenue: r.totalRevenue ?? null,
      netIncome: r.netIncome ?? null,
      operatingIncome: r.operatingIncome ?? null,
    }));

    // Quarterly cash flow
    const quarterlyCashflow = (s?.cashflowStatementHistoryQuarterly?.cashflowStatements ?? []).map((r: any) => ({
      date: r.endDate ? r.endDate : null,
      operatingCashflow: r.totalCashFromOperatingActivities ?? null,
      capex: r.capitalExpenditures ?? null,
      dividendsPaid: r.dividendsPaid ?? null,
    }));

    return NextResponse.json({
      annualIncome,
      annualCashflow,
      annualBalance,
      quarterlyIncome,
      quarterlyCashflow,
      keyStats: {
        enterpriseValue: s?.defaultKeyStatistics?.enterpriseValue ?? null,
        enterpriseToRevenue: s?.defaultKeyStatistics?.enterpriseToRevenue ?? null,
        enterpriseToEbitda: s?.defaultKeyStatistics?.enterpriseToEbitda ?? null,
        beta: s?.defaultKeyStatistics?.beta ?? null,
        sharesOutstanding: s?.defaultKeyStatistics?.sharesOutstanding ?? null,
        bookValue: s?.defaultKeyStatistics?.bookValue ?? null,
        priceToBook: s?.defaultKeyStatistics?.priceToBook ?? null,
        netIncomeToCommon: s?.defaultKeyStatistics?.netIncomeToCommon ?? null,
        trailingEps: s?.defaultKeyStatistics?.trailingEps ?? null,
        forwardEps: s?.defaultKeyStatistics?.forwardEps ?? null,
        pegRatio: s?.defaultKeyStatistics?.pegRatio ?? null,
        payoutRatio: s?.defaultKeyStatistics?.payoutRatio ?? null,
        shortRatio: s?.defaultKeyStatistics?.shortRatio ?? null,
      },
      timeSeries: ts,
    });
  } catch (err: any) {
    console.error("Financials error:", err?.message);
    return NextResponse.json({ error: "Failed to fetch financials" }, { status: 500 });
  }
}
