"use client";
import { useState } from "react";
import { REITSearch } from "@/components/REITSearch";
import { REITDetail } from "@/components/REITDetail";
import { FunWidget } from "@/components/FunWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GuideModal } from "@/components/GuideModal";
import { Heart, BookOpen } from "lucide-react";

const STEPS = [
  {
    n: "1",
    title: "Search a REIT",
    text: "Find any of 60+ U.S. REITs by ticker or company name. We auto-fill share price, shares outstanding, debt, and cash from Yahoo Finance.",
  },
  {
    n: "2",
    title: "Enter financials",
    text: "Add Total FFO and In-Place NOI from the latest earnings press release or supplemental. Annualize quarterly figures by multiplying by 4.",
  },
  {
    n: "3",
    title: "Run the model",
    text: "The tool instantly computes P/FFO, Implied Cap Rate, and NAV per share — then stress-tests every assumption across 5×5 sensitivity tables.",
  },
  {
    n: "4",
    title: "Review performance",
    text: "Check 1W, 1M, 3M, 6M, YTD, and 1Y total returns alongside analyst targets, dividend yield, and key balance sheet stats.",
  },
  {
    n: "5",
    title: "Read the filings",
    text: "Direct links to every 10-K, 10-Q, and 8-K on SEC EDGAR, plus Seeking Alpha transcripts and the company's investor relations page.",
  },
];

export default function Home() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [guideOpen, setGuideOpen]           = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* ── Top nav ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-screen-2xl mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">I ❤️ REITs</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1 hidden sm:inline">U.S. REIT Valuation Tool</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <button
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guide
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-5 py-8 space-y-6">

        <FunWidget />

        {/* ── Landing ── */}
        {!selectedTicker && (
          <div className="space-y-10">

            {/* Hero */}
            <div
              className="relative flex flex-col items-center gap-5 pt-10 pb-8 text-center rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            >
              {/* Gradient blobs */}
              <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-red-100 dark:bg-red-950/30 blur-3xl opacity-60 pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-rose-100 dark:bg-rose-950/20 blur-3xl opacity-50 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center gap-5 px-6">
                <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  Professional-grade REIT valuation · free
                </div>

                <h1 className="text-4xl font-extrabold max-w-2xl leading-tight bg-gradient-to-r from-red-500 via-rose-500 to-orange-400 bg-clip-text text-transparent">
                  Figure out if a REIT is cheap, expensive, or fairly priced.
                </h1>

                <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg">
                  The same math professional investors use — P/FFO, Implied Cap Rate, and NAV per share — in one clean dashboard.
                </p>

                {/* Search */}
                <div className="w-full max-w-sm ring-2 ring-transparent focus-within:ring-red-300 dark:focus-within:ring-red-700 rounded-xl transition-all duration-200">
                  <REITSearch onSelect={setSelectedTicker} />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">60+ U.S. REITs · data from Yahoo Finance &amp; SEC EDGAR</p>
              </div>
            </div>

            {/* How it works — horizontal steps */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-6">How it works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {STEPS.map((step) => (
                  <div key={step.n} className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-red-200 dark:hover:border-red-800 hover:shadow-sm transition-all">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-rose-400 text-white text-xs font-bold flex items-center justify-center mb-3">
                      {step.n}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{step.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-l-4 border-l-blue-500 rounded-2xl p-6 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Metric 1</span>
                  <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">P/FFO</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Price to FFO</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  The REIT version of a P/E ratio — the most common way to compare how expensive one REIT is versus another. A lower P/FFO means you're paying less for every dollar of earnings.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                  Most REITs trade between <strong className="text-gray-600 dark:text-gray-300">12x and 25x</strong> FFO.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-l-4 border-l-emerald-500 rounded-2xl p-6 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Metric 2</span>
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-medium">Cap Rate</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Implied Cap Rate</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  The most important number in real estate — annual NOI divided by what you paid. For a REIT, we apply this to the entire portfolio using enterprise value.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                  Trophy assets: <strong className="text-gray-600 dark:text-gray-300">4–5%</strong> · Mid-quality: <strong className="text-gray-600 dark:text-gray-300">6–7%</strong> · Value-add: <strong className="text-gray-600 dark:text-gray-300">7–9%</strong>
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 border-l-4 border-l-violet-500 rounded-2xl p-6 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Metric 3</span>
                  <span className="text-xs bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded-full font-medium">NAV</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">NAV per Share</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  If we sold every building, paid off all the debt, and divided what's left by shares outstanding — the closest thing to an appraisal value for the stock.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                  Below NAV = buying <strong className="text-gray-600 dark:text-gray-300">$1 of real estate for less than $1</strong>.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* Search bar stays visible while a REIT is open */}
        {selectedTicker && (
          <div className="flex items-center gap-3">
            <REITSearch onSelect={setSelectedTicker} />
          </div>
        )}

        {/* REIT Detail Panel */}
        {selectedTicker && (
          <REITDetail ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
        )}

      </main>

      <footer className="text-center text-xs text-gray-400 dark:text-gray-600 py-6 border-t border-gray-100 dark:border-gray-800 mt-8">
        <div className="h-px w-24 mx-auto mb-4 bg-gradient-to-r from-transparent via-red-300 dark:via-red-800 to-transparent" />
        Data from Yahoo Finance · SEC EDGAR · AI insights by Claude · Built for REIT investors
      </footer>

      {guideOpen && <GuideModal onClose={() => setGuideOpen(false)} />}
    </div>
  );
}
