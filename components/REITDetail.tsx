"use client";
import { useState, useEffect } from "react";
import { BaseAssumptions, DEFAULT_BASE_ASSUMPTIONS, QuoteData, ReturnsData } from "@/lib/types";
import { getREITInfo } from "@/lib/reits";
import { colorForChange, fmtCurrency, fmtMarketCap, fmtPct } from "@/lib/utils";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { ValuationPanel } from "./ValuationPanel";
import { FinancialsPanel } from "./FinancialsPanel";
import { InsightsPanel } from "./InsightsPanel";
import { SourcesPanel } from "./SourcesPanel";
import { TranscriptPanel } from "./TranscriptPanel";
import {
  TrendingUp, TrendingDown, X, ChevronDown, ChevronUp,
} from "lucide-react";

interface REITDetailProps {
  ticker: string;
  onClose: () => void;
}

const fmtMm = (v: number | null) => v != null ? `$${Math.round(v).toLocaleString()}mm` : null;

function MetricRow({ label, unit, value, highlight = false }: {
  label: string; unit?: string; value: string | null; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        {unit && <span className="text-xs text-gray-300 dark:text-gray-600">{unit}</span>}
      </div>
      <span className={`text-xs font-semibold font-mono ${highlight ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
        {value ?? <span className="font-normal text-gray-300 dark:text-gray-600">—</span>}
      </span>
    </div>
  );
}

export function REITDetail({ ticker, onClose }: REITDetailProps) {
  const [quote, setQuote]                   = useState<QuoteData | null>(null);
  const [returns, setReturns]               = useState<ReturnsData | null>(null);
  const [returnsLoading, setReturnsLoading] = useState(true);
  const [assumptions, setAssumptions]       = useState<BaseAssumptions>(DEFAULT_BASE_ASSUMPTIONS);
  const [committedAssumptions, setCommittedAssumptions] = useState<BaseAssumptions>(DEFAULT_BASE_ASSUMPTIONS);
  const [insightsOpen, setInsightsOpen]     = useState(false);
  const [loading, setLoading]               = useState(true);

  function handleCalculate(a: BaseAssumptions) {
    setCommittedAssumptions(a);
  }

  const info = getREITInfo(ticker);

  useEffect(() => {
    setLoading(true);
    setInsightsOpen(false);
    fetch(`/api/quote?tickers=${ticker}`)
      .then((r) => r.json())
      .then((data) => setQuote(data[0] ?? null))
      .finally(() => setLoading(false));
  }, [ticker]);

  useEffect(() => {
    setReturns(null);
    setReturnsLoading(true);
    fetch(`/api/returns?ticker=${ticker}`)
      .then((r) => r.json())
      .then((data) => setReturns(data.error ? null : data))
      .catch(() => setReturns(null))
      .finally(() => setReturnsLoading(false));
  }, [ticker]);

  const changeColor = colorForChange(quote?.changePercent);
  const recMap: Record<string, { label: string; color: string }> = {
    strongBuy:    { label: "Strong Buy",   color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    buy:          { label: "Buy",          color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    hold:         { label: "Hold",         color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    underperform: { label: "Underperform", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
    sell:         { label: "Sell",         color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  };
  const rec = quote?.recommendationKey ? recMap[quote.recommendationKey] : null;

  // Bridge to legacy Assumptions interface used by InsightsPanel
  const legacyAssumptions = {
    ffoPerShare: committedAssumptions.ffoPerDilutedShare,
    affoPerShare: null,
    noiGrowth: null,
    capRate: null,
    payoutRatio: null,
    costOfDebt: null,
    acquisitionAmount: null,
    yieldOnCost: null,
    dispositionAmount: null,
    navPerShare: null,
  };

  // Live EV build-up (from current assumptions — updates as user types)
  const liveMarketCap =
    assumptions.sharePrice != null && assumptions.sharesOutstanding != null
      ? assumptions.sharePrice * assumptions.sharesOutstanding : null;
  const liveNetDebt =
    (assumptions.totalDebt ?? 0) - (assumptions.totalCash ?? 0);
  const liveEV =
    liveMarketCap != null
      ? liveMarketCap + liveNetDebt + (assumptions.preferredEquity ?? 0) : null;
  const liveImpliedCapRate =
    assumptions.inPlaceNOI != null && liveEV != null && liveEV > 0
      ? (assumptions.inPlaceNOI / liveEV) * 100 : null;
  const livePFFO =
    assumptions.sharePrice != null &&
    assumptions.ffoPerDilutedShare != null &&
    assumptions.ffoPerDilutedShare > 0
      ? assumptions.sharePrice / assumptions.ffoPerDilutedShare : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">

      {/* ── Header ── */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4 space-y-3">

        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-start gap-5 min-w-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ticker}</h2>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  {info?.sector}
                </span>
                {rec && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rec.color}`}>{rec.label}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{info?.name ?? quote?.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Market data */}
        <div className="space-y-2">
            {loading && <div className="h-10 w-56 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />}

            {!loading && quote && !quote.error && (
              <>
                <div className="flex flex-wrap items-start gap-5">
                  <div>
                    <div className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{fmtCurrency(quote.price)}</div>
                    <div className={`text-sm flex items-center gap-1 mt-0.5 ${changeColor}`}>
                      {(quote.changePercent ?? 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {quote.change != null ? `${quote.change > 0 ? "+" : ""}${quote.change.toFixed(2)}` : ""}
                      {" "}({quote.changePercent != null ? `${quote.changePercent > 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%` : ""})
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    <div>Mkt Cap: <span className="text-gray-900 dark:text-white font-medium">{fmtMarketCap(quote.marketCap)}</span></div>
                    <div>Div Yield: <span className="text-gray-900 dark:text-white font-medium">{quote.dividendYield != null ? fmtPct(quote.dividendYield) : "—"}</span></div>
                    <div>Div/Yr: <span className="text-gray-900 dark:text-white font-medium">{quote.dividendRate != null ? `$${quote.dividendRate.toFixed(2)}` : "—"}</span></div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    <div>52W High: <span className="text-gray-900 dark:text-white font-medium">{fmtCurrency(quote.fiftyTwoWeekHigh)}</span></div>
                    <div>52W Low: <span className="text-gray-900 dark:text-white font-medium">{fmtCurrency(quote.fiftyTwoWeekLow)}</span></div>
                    <div>50D Avg: <span className="text-gray-900 dark:text-white font-medium">{fmtCurrency(quote.fiftyDayAverage)}</span></div>
                  </div>

                  {quote.targetMeanPrice != null && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      <div>
                        Target: <span className="text-gray-900 dark:text-white font-medium">{fmtCurrency(quote.targetMeanPrice)}</span>
                        {quote.price && (
                          <span className={`ml-1 font-semibold ${quote.targetMeanPrice > quote.price ? "text-emerald-500" : "text-red-500"}`}>
                            ({((quote.targetMeanPrice - quote.price) / quote.price * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                      <div>Hi/Lo: <span className="text-gray-900 dark:text-white font-medium">{fmtCurrency(quote.targetHighPrice)} / {fmtCurrency(quote.targetLowPrice)}</span></div>
                      {quote.numberOfAnalystOpinions && <div className="text-gray-400">{quote.numberOfAnalystOpinions} analysts</div>}
                    </div>
                  )}

                  {quote.earningsDate && (
                    <div className="text-xs">
                      <div className="text-gray-500 dark:text-gray-400">Next Earnings</div>
                      <div className="text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                        {new Date(quote.earningsDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Key stats strip */}
                <FinancialsPanel ticker={ticker} compact />

                {/* Returns strip */}
                {returnsLoading
                  ? <div className="h-4 w-80 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  : returns && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      {(
                        [
                          { label: "1W",  value: returns.return1W  },
                          { label: "1M",  value: returns.return1M  },
                          { label: "3M",  value: returns.return3M  },
                          { label: "6M",  value: returns.return6M  },
                          { label: "YTD", value: returns.returnYTD },
                          { label: "1Y",  value: returns.return1Y  },
                        ] as { label: string; value: number | null }[]
                      ).filter((r) => r.value != null).map(({ label, value }) => {
                        const pos = (value as number) >= 0;
                        return (
                          <span key={label} className="flex items-center gap-1">
                            <span className="text-gray-400 dark:text-gray-500">{label}:</span>
                            <span className={`font-semibold font-mono ${pos ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                              {pos ? "+" : ""}{(value as number).toFixed(1)}%
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )
                }
              </>
            )}
          </div>
      </div>

      {/* ── Three-column body ── */}
      <div className="flex" style={{ minHeight: 560 }}>

        {/* ── Left: Assumptions ── */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Assumptions</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">T-12 base case · <span className="text-blue-500">Yahoo ↓</span> = auto-filled</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <AssumptionsPanel
              ticker={ticker}
              assumptions={assumptions}
              onChange={setAssumptions}
              onCalculate={handleCalculate}
            />
          </div>
        </div>

        {/* ── Center: EV Build-up + Metrics + Insights + Valuation ── */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-gray-700">

          {/* EV Build-up + Current Metrics — live from inputs */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-4">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Enterprise Value Build-up</p>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-1">
                  <MetricRow label="Market Cap" unit="Price × Shares" value={fmtMm(liveMarketCap)} />
                  <MetricRow label="(+) Net Debt" unit="Debt − Cash" value={fmtMm(liveNetDebt !== 0 ? liveNetDebt : null)} />
                  <MetricRow label="(+) Preferred" unit="liq. value" value={fmtMm(assumptions.preferredEquity)} />
                  <MetricRow label="Enterprise Value" value={fmtMm(liveEV)} highlight />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Current Metrics</p>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-1">
                  <MetricRow label="P/FFO" unit="Price ÷ FFO/sh" value={livePFFO != null ? `${livePFFO.toFixed(1)}x` : null} highlight />
                  <MetricRow label="Implied Cap Rate" unit="NOI ÷ EV" value={liveImpliedCapRate != null ? `${liveImpliedCapRate.toFixed(2)}%` : null} highlight />
                </div>
                {liveImpliedCapRate != null && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 leading-relaxed">
                    NAV table centers on <strong className="text-gray-600 dark:text-gray-300">{liveImpliedCapRate.toFixed(2)}%</strong> ±100bps.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Insights — collapsible */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setInsightsOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Insights</span>
              {insightsOpen
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {insightsOpen && (
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 space-y-5">
                <InsightsPanel
                  ticker={ticker}
                  quote={quote}
                  valuation={[]}
                  quotes={[]}
                  assumptions={legacyAssumptions}
                  scenarios={[]}
                />
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Earnings Call Analysis</p>
                  <TranscriptPanel ticker={ticker} />
                </div>
              </div>
            )}
          </div>

          {/* Valuation — fills remaining space */}
          <div className="flex-1 overflow-y-auto p-5">
            <ValuationPanel
              ticker={ticker}
              assumptions={committedAssumptions}
              currentPrice={quote?.price ?? null}
            />
          </div>
        </div>

        {/* ── Right: Sources ── */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Sources</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SourcesPanel ticker={ticker} />
          </div>
        </div>

      </div>
    </div>
  );
}
