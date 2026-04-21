/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tickers = searchParams.get("tickers")?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  if (!tickers.length) {
    return NextResponse.json({ error: "No tickers provided" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      let q: any = null;
      let s: any = null;

      try { q = await yf.quote(ticker); } catch { /* ignore */ }
      try {
        s = await yf.quoteSummary(ticker, {
          modules: ["summaryDetail", "defaultKeyStatistics", "financialData", "calendarEvents", "earningsTrend"],
        });
      } catch { /* ignore */ }

      const earningsArr = s?.calendarEvents?.earnings?.earningsDate;
      const earningsDate = Array.isArray(earningsArr) && earningsArr.length > 0
        ? String(earningsArr[0])
        : null;

      // FFO/AFFO not directly in Yahoo Finance — use analyst estimates as proxy
      const epsForward = s?.defaultKeyStatistics?.forwardEps ?? null;
      const epsCurrent = s?.defaultKeyStatistics?.trailingEps ?? null;

      return {
        ticker,
        name: q?.longName ?? q?.shortName ?? ticker,
        price: q?.regularMarketPrice ?? null,
        previousClose: q?.regularMarketPreviousClose ?? null,
        change: q?.regularMarketChange ?? null,
        changePercent: q?.regularMarketChangePercent ?? null,
        marketCap: q?.marketCap ?? null,
        dividendYield: s?.summaryDetail?.dividendYield ?? q?.trailingAnnualDividendYield ?? null,
        dividendRate: s?.summaryDetail?.dividendRate ?? null,
        trailingPE: s?.summaryDetail?.trailingPE ?? null,
        forwardPE: s?.summaryDetail?.forwardPE ?? null,
        priceToBook: s?.defaultKeyStatistics?.priceToBook ?? null,
        epsForward,
        epsCurrent,
        fiftyTwoWeekHigh: q?.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: q?.fiftyTwoWeekLow ?? null,
        fiftyDayAverage: q?.fiftyDayAverage ?? null,
        twoHundredDayAverage: q?.twoHundredDayAverage ?? null,
        earningsDate,
        currency: q?.currency ?? "USD",
        totalDebt: s?.financialData?.totalDebt ?? null,
        totalCash: s?.financialData?.totalCash ?? null,
        revenueGrowth: s?.financialData?.revenueGrowth ?? null,
        operatingCashflow: s?.financialData?.operatingCashflow ?? null,
        debtToEquity: s?.financialData?.debtToEquity ?? null,
        recommendationMean: s?.financialData?.recommendationMean ?? null,
        recommendationKey: s?.financialData?.recommendationKey ?? null,
        numberOfAnalystOpinions: s?.financialData?.numberOfAnalystOpinions ?? null,
        targetHighPrice: s?.financialData?.targetHighPrice ?? null,
        targetLowPrice: s?.financialData?.targetLowPrice ?? null,
        targetMeanPrice: s?.financialData?.targetMeanPrice ?? null,
        volume: q?.regularMarketVolume ?? null,
        avgVolume: q?.averageDailyVolume3Month ?? null,
      };
    })
  );

  const data = results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { ticker: tickers[i], error: "Failed to fetch" }
  );

  return NextResponse.json(data);
}
