"use client";
import { useEffect, useState } from "react";
import { ValuationRow } from "@/lib/types";
import { Assumptions } from "@/lib/types";
import { REIT_UNIVERSE, getPeersBySector, getREITInfo } from "@/lib/reits";
import { fmtCurrency, fmtMarketCap, fmtMultiple, fmtPct } from "@/lib/utils";
import { Tooltip } from "./Tooltip";
import { QuoteData } from "@/lib/types";

interface ValuationTableProps {
  ticker: string;
  assumptions: Assumptions;
  onDataLoaded?: (rows: ValuationRow[], quotes: QuoteData[]) => void;
}

function buildRow(q: QuoteData, assumptions: Assumptions | null): ValuationRow {
  const info = getREITInfo(q.ticker);
  const ffo = assumptions?.ffoPerShare ?? null;
  const affo = assumptions?.affoPerShare ?? null;
  const nav = assumptions?.navPerShare ?? null;

  return {
    ticker: q.ticker,
    name: info?.name ?? q.name,
    sector: info?.sector ?? "Unknown",
    price: q.price,
    marketCap: q.marketCap,
    dividendYield: q.dividendYield,
    pFfo: ffo && q.price ? q.price / ffo : null,
    pAffo: affo && q.price ? q.price / affo : null,
    impliedCapRate: assumptions?.capRate ?? null,
    navPremiumDiscount: nav && q.price ? ((q.price - nav) / nav) * 100 : null,
    leverage: null,
  };
}

export function ValuationTable({ ticker, assumptions, onDataLoaded }: ValuationTableProps) {
  const [rows, setRows] = useState<ValuationRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [peerSet, setPeerSet] = useState<string[]>([]);
  const [addTicker, setAddTicker] = useState("");

  const info = getREITInfo(ticker);

  useEffect(() => {
    if (!info) return;
    const peers = getPeersBySector(info.sector);
    const initial = Array.from(new Set([ticker, ...peers]));
    setPeerSet(initial);
  }, [ticker, info]);

  useEffect(() => {
    if (!peerSet.length) return;
    setLoading(true);
    fetch(`/api/quote?tickers=${peerSet.join(",")}`)
      .then((r) => r.json())
      .then((data: QuoteData[]) => {
        setQuotes(data);
        const built = data.map((q) =>
          buildRow(q, q.ticker === ticker ? assumptions : null)
        );
        setRows(built);
        onDataLoaded?.(built, data);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerSet]);

  useEffect(() => {
    // Rebuild the selected REIT's row when assumptions change
    setRows((prev) =>
      prev.map((r) => (r.ticker === ticker ? buildRow(quotes.find((q) => q.ticker === ticker)!, assumptions) : r))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assumptions]);

  const avgPFfo = rows.filter((r) => r.pFfo).reduce((a, b, _, arr) => a + (b.pFfo ?? 0) / arr.length, 0) || null;
  const avgYield = rows.filter((r) => r.dividendYield).reduce((a, b, _, arr) => a + (b.dividendYield ?? 0) / arr.length, 0) || null;

  function addPeer() {
    const t = addTicker.toUpperCase().trim();
    if (t && !peerSet.includes(t)) {
      setPeerSet([...peerSet, t]);
    }
    setAddTicker("");
  }

  function removePeer(t: string) {
    if (t === ticker) return;
    setPeerSet(peerSet.filter((p) => p !== t));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Peer Valuation Table</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={addTicker}
            onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addPeer()}
            placeholder="Add ticker..."
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addPeer}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-3 text-xs font-medium text-gray-500 dark:text-gray-400">Ticker</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Price</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Mkt Cap</th>
                <th className="text-right py-2 px-3">
                  <Tooltip text="Dividend yield based on trailing 12-month dividends divided by share price.">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Div Yield</span>
                  </Tooltip>
                </th>
                <th className="text-right py-2 px-3">
                  <Tooltip text="Price-to-FFO: share price divided by Funds From Operations per share. The REIT equivalent of P/E. Lower = cheaper relative to earnings.">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">P/FFO</span>
                  </Tooltip>
                </th>
                <th className="text-right py-2 px-3">
                  <Tooltip text="Price-to-AFFO: share price divided by Adjusted FFO per share. Removes capital expenditure estimates for a cleaner picture of cash available for dividends.">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">P/AFFO</span>
                  </Tooltip>
                </th>
                <th className="text-right py-2 px-3">
                  <Tooltip text="Implied cap rate: NOI / property value, expressed as a percentage. Higher = cheaper or higher risk. Used to compare asset values across REITs.">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cap Rate</span>
                  </Tooltip>
                </th>
                <th className="text-right py-2 px-3">
                  <Tooltip text="Premium or discount to NAV (Net Asset Value): how the stock price compares to your estimated value of the underlying assets per share.">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">NAV ±</span>
                  </Tooltip>
                </th>
                <th className="py-2 pl-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isTarget = r.ticker === ticker;
                return (
                  <tr
                    key={r.ticker}
                    className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      isTarget ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1.5">
                        {isTarget && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                        <span className={`font-medium ${isTarget ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                          {r.ticker}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 truncate max-w-[120px]">{r.name}</div>
                    </td>
                    <td className="text-right py-2 px-3 font-mono text-gray-900 dark:text-white">{fmtCurrency(r.price)}</td>
                    <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-300">{fmtMarketCap(r.marketCap)}</td>
                    <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-300">{fmtPct(r.dividendYield)}</td>
                    <td className={`text-right py-2 px-3 font-mono ${isTarget && r.pFfo ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-600 dark:text-gray-300"}`}>
                      {r.pFfo ? fmtMultiple(r.pFfo) : <span className="text-gray-400 text-xs">set FFO ↓</span>}
                    </td>
                    <td className={`text-right py-2 px-3 font-mono ${isTarget && r.pAffo ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-600 dark:text-gray-300"}`}>
                      {r.pAffo ? fmtMultiple(r.pAffo) : <span className="text-gray-400 text-xs">set AFFO ↓</span>}
                    </td>
                    <td className="text-right py-2 px-3 text-gray-600 dark:text-gray-300">
                      {r.impliedCapRate ? `${r.impliedCapRate.toFixed(2)}%` : "—"}
                    </td>
                    <td className="text-right py-2 px-3">
                      {r.navPremiumDiscount != null ? (
                        <span className={r.navPremiumDiscount > 0 ? "text-emerald-500" : "text-red-500"}>
                          {r.navPremiumDiscount > 0 ? "+" : ""}
                          {r.navPremiumDiscount.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-2 pl-3">
                      {!isTarget && (
                        <button
                          onClick={() => removePeer(r.ticker)}
                          className="text-gray-400 hover:text-red-500 text-xs transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length > 0 && (
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30">
                  <td className="py-2 pr-3 text-xs font-medium text-gray-500 dark:text-gray-400">Peer Avg</td>
                  <td className="py-2 px-3" />
                  <td className="py-2 px-3" />
                  <td className="text-right py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300">{fmtPct(avgYield)}</td>
                  <td className="text-right py-2 px-3 text-xs font-medium text-gray-700 dark:text-gray-300">{fmtMultiple(avgPFfo)}</td>
                  <td className="py-2 px-3" />
                  <td className="py-2 px-3" />
                  <td className="py-2 px-3" />
                  <td className="py-2 pl-3" />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
