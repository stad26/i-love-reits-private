"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Calendar, DollarSign } from "lucide-react";
import { QuoteData } from "@/lib/types";
import { REIT_UNIVERSE, getREITInfo } from "@/lib/reits";
import { colorForChange, fmtCurrency, fmtMarketCap, fmtPct } from "@/lib/utils";

interface DashboardProps {
  onSelect: (ticker: string) => void;
  selectedTicker: string | null;
}

export function Dashboard({ onSelect, selectedTicker }: DashboardProps) {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState("All");

  const sectors = ["All", ...Array.from(new Set(REIT_UNIVERSE.map((r) => r.sector)))];
  const tickers = REIT_UNIVERSE.map((r) => r.ticker);

  useEffect(() => {
    async function fetchQuotes() {
      setLoading(true);
      try {
        const res = await fetch(`/api/quote?tickers=${tickers.join(",")}`);
        const data = await res.json();
        setQuotes(data);
      } catch {
        console.error("Failed to load quotes");
      }
      setLoading(false);
    }
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = quotes.filter((q) => {
    if (sectorFilter === "All") return true;
    const info = getREITInfo(q.ticker);
    return info?.sector === sectorFilter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">REIT Universe</h2>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((q) => {
            const info = getREITInfo(q.ticker);
            const isSelected = q.ticker === selectedTicker;
            const changeColor = colorForChange(q.changePercent);
            return (
              <button
                key={q.ticker}
                onClick={() => onSelect(q.ticker)}
                className={`text-left p-3 rounded-xl border transition-all hover:shadow-md ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{q.ticker}</span>
                  {q.changePercent != null && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${changeColor}`}>
                      {q.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(q.changePercent).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 truncate">{info?.name ?? q.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {q.price != null ? fmtCurrency(q.price) : "—"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-0.5">
                    <DollarSign className="w-3 h-3" />
                    {fmtMarketCap(q.marketCap)}
                  </span>
                  {q.dividendYield != null && (
                    <span>{fmtPct(q.dividendYield)} yield</span>
                  )}
                </div>
                {q.earningsDate && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(q.earningsDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
