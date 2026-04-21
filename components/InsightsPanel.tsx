"use client";
import { useState } from "react";
import { Assumptions, Scenario, ValuationRow } from "@/lib/types";
import { QuoteData } from "@/lib/types";
import { getREITInfo } from "@/lib/reits";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface InsightsPanelProps {
  ticker: string;
  quote: QuoteData | null;
  valuation: ValuationRow[];
  quotes: QuoteData[];
  assumptions: Assumptions;
  scenarios: Scenario[];
}

interface Insights {
  summary: string;
  premiumDiscount: string;
  peerContext: string;
  limitations: string[];
  keyAssumptions: string[];
  questionsToTest: string[];
  managementQuestions: string[];
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  bullCase: string;
  bearCase: string;
}

export function InsightsPanel({ ticker, quote, valuation, quotes, assumptions, scenarios }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [swotOpen, setSwotOpen] = useState(false);

  const info = getREITInfo(ticker);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reit: { ticker, name: info?.name, sector: info?.sector, price: quote?.price, marketCap: quote?.marketCap },
          valuation: valuation.slice(0, 8),
          peers: quotes.slice(0, 8).map((q) => ({ ticker: q.ticker, price: q.price, dividendYield: q.dividendYield })),
          assumptions,
          scenarios,
        }),
      });
      const data = await res.json();
      setInsights(data);
    } catch {
      console.error("Failed to generate insights");
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Insights & Commentary</h3>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {loading ? "Generating..." : insights ? "Refresh" : "Generate Insights"}
        </button>
      </div>

      {!insights && !loading && (
        <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          Click &ldquo;Generate Insights&rdquo; to get an AI-powered analysis of {ticker} based on your assumptions and peer data.
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[80, 60, 90, 70].map((w, i) => (
            <div key={i} className={`h-4 w-${w} rounded bg-gray-100 dark:bg-gray-800 animate-pulse`} />
          ))}
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{insights.summary}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{insights.premiumDiscount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insights.peerContext}</p>
          </div>

          {/* Bull / Bear */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Bull Case</div>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{insights.bullCase}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Bear Case</div>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{insights.bearCase}</p>
            </div>
          </div>

          {/* SWOT */}
          <div>
            <button
              onClick={() => setSwotOpen(!swotOpen)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {swotOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              SWOT Analysis
            </button>
            {swotOpen && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["strengths", "weaknesses", "opportunities", "threats"] as const).map((k) => (
                  <div key={k} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize mb-1.5">{k}</div>
                    <ul className="space-y-0.5">
                      {insights.swot[k].map((item, i) => (
                        <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1">
                          <span className="mt-0.5 text-gray-400">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Questions to Test</h4>
              <ul className="space-y-1">
                {insights.questionsToTest.map((q, i) => (
                  <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold mt-0.5">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Ask Management</h4>
              <ul className="space-y-1">
                {insights.managementQuestions.map((q, i) => (
                  <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                    <span className="text-purple-500 font-bold mt-0.5">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Limitations */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">Limitations of This Analysis</h4>
            <ul className="space-y-0.5">
              {insights.limitations.map((l, i) => (
                <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                  <span className="mt-0.5">⚠</span> {l}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
