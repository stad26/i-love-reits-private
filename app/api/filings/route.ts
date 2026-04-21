import { NextRequest, NextResponse } from "next/server";

// SEC EDGAR full-text search API — free, no key required
// Returns recent 10-K, 10-Q, 8-K filings for a given ticker

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "No ticker provided" }, { status: 400 });
  }

  try {
    // Step 1: Get CIK from ticker via EDGAR company search
    const lookupRes = await fetch(
      `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&dateRange=custom&startdt=2020-01-01&forms=10-K`,
      { headers: { "User-Agent": "i-love-reits research@example.com" } }
    );

    // Use the company tickers JSON (faster and more reliable)
    const tickerRes = await fetch(
      "https://www.sec.gov/files/company_tickers.json",
      { headers: { "User-Agent": "i-love-reits research@example.com" }, next: { revalidate: 86400 } }
    );

    if (!tickerRes.ok) {
      throw new Error("Failed to fetch SEC ticker list");
    }

    const tickerMap: Record<string, { cik_str: number; ticker: string; title: string }> =
      await tickerRes.json();

    const match = Object.values(tickerMap).find(
      (c) => c.ticker.toUpperCase() === ticker.toUpperCase()
    );

    if (!match) {
      return NextResponse.json({ filings: [], error: "Ticker not found in SEC EDGAR" });
    }

    const cik = String(match.cik_str).padStart(10, "0");

    // Step 2: Fetch recent filings via EDGAR submissions API
    const subRes = await fetch(
      `https://data.sec.gov/submissions/CIK${cik}.json`,
      { headers: { "User-Agent": "i-love-reits research@example.com" } }
    );

    if (!subRes.ok) {
      throw new Error("Failed to fetch EDGAR submissions");
    }

    const sub = await subRes.json();

    const recent = sub.filings?.recent;
    if (!recent) {
      return NextResponse.json({ filings: [], cik, companyName: sub.name });
    }

    const { form, filingDate, accessionNumber, primaryDocument, reportDate } = recent;

    type Filing = {
      form: string;
      filingDate: string;
      reportDate: string;
      accessionNumber: string;
      url: string;
      description: string;
    };

    const filings: Filing[] = [];
    const targetForms = ["10-K", "10-Q", "8-K", "DEF 14A"];

    for (let i = 0; i < form.length && filings.length < 30; i++) {
      if (!targetForms.includes(form[i])) continue;
      const acc = accessionNumber[i].replace(/-/g, "");
      const doc = primaryDocument[i] ?? "index.htm";
      const url = `https://www.sec.gov/Archives/edgar/data/${match.cik_str}/${acc}/${doc}`;

      filings.push({
        form: form[i],
        filingDate: filingDate[i],
        reportDate: reportDate[i] ?? filingDate[i],
        accessionNumber: accessionNumber[i],
        url,
        description: formDescription(form[i]),
      });
    }

    void lookupRes; // suppress unused warning

    return NextResponse.json({
      cik,
      companyName: sub.name,
      filings,
    });
  } catch (err) {
    console.error("Filings error:", err);
    return NextResponse.json({ error: "Failed to fetch filings" }, { status: 500 });
  }
}

function formDescription(form: string): string {
  const map: Record<string, string> = {
    "10-K": "Annual Report",
    "10-Q": "Quarterly Report",
    "8-K": "Current Report",
    "DEF 14A": "Proxy Statement",
  };
  return map[form] ?? form;
}
