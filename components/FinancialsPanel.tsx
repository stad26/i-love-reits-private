"use client";
import { useEffect, useState } from "react";
import { fmtMarketCap, fmtPct } from "@/lib/utils";

interface KeyStats {
  enterpriseValue: number | null;
  enterpriseToRevenue: number | null;
  enterpriseToEbitda: number | null;
  priceToBook: number | null;
  beta: number | null;
  sharesOutstanding: number | null;
  bookValue: number | null;
  trailingEps: number | null;
  forwardEps: number | null;
  payoutRatio: number | null;
  shortRatio: number | null;
}

function StatRow({ label, value, fmt = "number" }: {
  label: string;
  value: number | null | undefined;
  fmt?: "number" | "pct" | "cap" | "x" | "shares";
}) {
  if (value == null) return null;
  let display = "";
  if (fmt === "cap")    display = fmtMarketCap(value);
  else if (fmt === "pct")    display = fmtPct(value);
  else if (fmt === "x")      display = `${value.toFixed(2)}x`;
  else if (fmt === "shares") display = `${(value / 1e6).toFixed(1)}M`;
  else display = value.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">{display}</span>
    </div>
  );
}

export function FinancialsPanel({ ticker, compact = false }: { ticker: string; compact?: boolean }) {
  const [stats, setStats] = useState<KeyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/financials?ticker=${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setStats(d.keyStats ?? null);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (compact) {
    if (loading) return <div className="h-4 w-64 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />;
    if (error || !stats) return null;
    const items: { label: string; display: string }[] = [];
    if (stats.priceToBook != null)       items.push({ label: "P/Book",      display: `${stats.priceToBook.toFixed(2)}x` });
    if (stats.beta != null)              items.push({ label: "Beta",         display: stats.beta.toFixed(2) });
    if (stats.enterpriseToEbitda != null) items.push({ label: "EV/EBITDA",  display: `${stats.enterpriseToEbitda.toFixed(1)}x` });
    if (stats.payoutRatio != null)       items.push({ label: "Payout",       display: fmtPct(stats.payoutRatio) });
    if (stats.shortRatio != null)        items.push({ label: "Short Ratio",  display: stats.shortRatio.toFixed(1) });
    if (stats.trailingEps != null)       items.push({ label: "Trailing EPS", display: `$${stats.trailingEps.toFixed(2)}` });
    if (stats.forwardEps != null)        items.push({ label: "Fwd EPS",      display: `$${stats.forwardEps.toFixed(2)}` });
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
        {items.map((item) => (
          <span key={item.label}>
            {item.label}: <span className="font-semibold text-gray-700 dark:text-gray-300 font-mono">{item.display}</span>
          </span>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2 max-w-sm">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-8 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return <div className="text-sm text-red-500">{error || "No data available"}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Key Statistics</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">Source: Yahoo Finance</span>
      </div>
      <div className="max-w-sm">
        <StatRow label="Enterprise Value"    value={stats.enterpriseValue}    fmt="cap" />
        <StatRow label="EV / Revenue"        value={stats.enterpriseToRevenue} fmt="x" />
        <StatRow label="EV / EBITDA"         value={stats.enterpriseToEbitda}  fmt="x" />
        <StatRow label="Price / Book"        value={stats.priceToBook}         fmt="x" />
        <StatRow label="Beta (5Y Monthly)"   value={stats.beta} />
        <StatRow label="Shares Outstanding"  value={stats.sharesOutstanding}   fmt="shares" />
        <StatRow label="Book Value / Share"  value={stats.bookValue} />
        <StatRow label="Trailing EPS"        value={stats.trailingEps} />
        <StatRow label="Forward EPS"         value={stats.forwardEps} />
        <StatRow label="Payout Ratio"        value={stats.payoutRatio}         fmt="pct" />
        <StatRow label="Short Ratio"         value={stats.shortRatio} />
      </div>
    </div>
  );
}
