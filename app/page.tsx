"use client";
import { useState } from "react";
import { REITSearch } from "@/components/REITSearch";
import { REITDetail } from "@/components/REITDetail";
import { FunWidget } from "@/components/FunWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GuideModal } from "@/components/GuideModal";
import { Heart, BookOpen } from "lucide-react";

export default function Home() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">

      {/* Header */}
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

        {/* Fun Widget */}
        <FunWidget />

        {/* ── Landing: no REIT selected ── */}
        {!selectedTicker && (
          <div className="space-y-12">

            {/* Welcome + Search */}
            <div className="flex flex-col items-center gap-4 pt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium px-3 py-1.5 rounded-full">
                <Heart className="w-3.5 h-3.5 fill-current" />
                REIT Valuation Tool
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white max-w-xl leading-tight">
                Your cheat sheet for figuring out whether a REIT is cheap, expensive, or fairly priced.
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg">
                Using the same math that professional investors use — P/FFO, Implied Cap Rate, and NAV per share.
              </p>
              <div className="mt-2 w-full max-w-sm">
                <REITSearch onSelect={setSelectedTicker} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Search by ticker or company name · 60+ U.S. REITs</p>
            </div>

            {/* Three metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Metric 1</span>
                  <span className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">P/FFO</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Price to FFO</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  The REIT version of a P/E ratio — the most common way to compare how expensive one REIT is
                  versus another. A lower P/FFO means you're paying less for every dollar of earnings.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                  Most REITs trade between <strong className="text-gray-600 dark:text-gray-300">12x and 25x</strong> FFO.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Metric 2</span>
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-medium">Cap Rate</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Implied Cap Rate</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  The cap rate is the most important number in real estate — annual NOI divided by what you
                  paid. For a REIT, we apply the same logic to the entire portfolio using enterprise value.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                  Trophy assets: <strong className="text-gray-600 dark:text-gray-300">4–5%</strong> · Mid-quality: <strong className="text-gray-600 dark:text-gray-300">6–7%</strong> · Value-add: <strong className="text-gray-600 dark:text-gray-300">7–9%</strong>
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Metric 3</span>
                  <span className="text-xs bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded-full font-medium">NAV</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">NAV per Share</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  If we sold every building, paid off all the debt, and divided what was left by the number
                  of shares — what would each share be worth? The closest thing to an appraisal value.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                  Below NAV = buying <strong className="text-gray-600 dark:text-gray-300">$1 of real estate for less than $1</strong>.
                </p>
              </div>

            </div>

            {/* How to use */}
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-8 py-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">How it works</h2>
              <ol className="space-y-3">
                {[
                  { n: "1", text: "Search for a REIT by ticker or name above." },
                  { n: "2", text: "We auto-fill what we can from Yahoo Finance — share price, shares outstanding, debt, and cash. Verify and override as needed." },
                  { n: "3", text: "Enter Total FFO and Total NOI from the most recent earnings press release or supplemental package. Annualize: Q × 4." },
                  { n: "4", text: "Enter your cap rate assumption for the NAV calculation. We don't auto-fill this — it depends on asset type, market, and your view." },
                  { n: "5", text: "The tool shows P/FFO, Implied Cap Rate, and NAV per share — plus 7×7 sensitivity tables so you can stress-test every assumption." },
                ].map((step) => (
                  <li key={step.n} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{step.n}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{step.text}</span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => setGuideOpen(true)}
                className="mt-5 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Read the full guide with glossary →
              </button>
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

      <footer className="text-center text-xs text-gray-400 dark:text-gray-600 py-6">
        Data from Yahoo Finance · AI insights by Claude · Built for REIT investors
      </footer>

      {/* Guide Modal */}
      {guideOpen && <GuideModal onClose={() => setGuideOpen(false)} />}

    </div>
  );
}
