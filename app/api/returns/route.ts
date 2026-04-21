/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "No ticker" }, { status: 400 });

  try {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const hist: any[] = await yf.historical(ticker, {
      period1: dateStr(oneYearAgo),
      period2: dateStr(now),
      interval: "1d",
    });

    if (!hist.length) return NextResponse.json({ error: "No historical data" });

    // Ensure ascending order by date
    hist.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const latest = hist[hist.length - 1];
    const currentPrice: number = latest.adjClose ?? latest.close;

    // Find the last bar on or before N calendar days ago
    function priceNDaysAgo(n: number): number | null {
      const target = new Date(now);
      target.setDate(target.getDate() - n);
      const targetMs = target.getTime();
      let best: any = null;
      for (const bar of hist) {
        if (new Date(bar.date).getTime() <= targetMs) best = bar;
        else break;
      }
      return best ? (best.adjClose ?? best.close) : null;
    }

    function ret(past: number | null): number | null {
      if (!past || past <= 0 || !currentPrice) return null;
      return ((currentPrice - past) / past) * 100;
    }

    // YTD: price on Dec 31 of prior year (first available bar on or before Jan 1)
    const dec31 = new Date(now.getFullYear(), 0, 1); // midnight Jan 1 = last moment of Dec 31
    const ytdDays = Math.floor((now.getTime() - dec31.getTime()) / (1000 * 60 * 60 * 24));

    const payload = {
      ticker,
      return1W:  ret(priceNDaysAgo(7)),
      return1M:  ret(priceNDaysAgo(30)),
      return3M:  ret(priceNDaysAgo(91)),
      return6M:  ret(priceNDaysAgo(182)),
      returnYTD: ret(priceNDaysAgo(ytdDays)),
      return1Y:  ret(hist[0].adjClose ?? hist[0].close),
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch returns" });
  }
}
