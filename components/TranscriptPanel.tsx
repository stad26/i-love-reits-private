"use client";
import { useState } from "react";
import { Clock, Sparkles, Eye } from "lucide-react";

const WELLTOWER_SAMPLE = {
  header: "Welltower (WELL) – Earnings Call Snapshot",
  sections: [
    {
      title: "1. What Mattered",
      bullets: [
        "Normalized FFO of $1.12/share beat consensus by $0.04; full-year guidance raised to $4.44–$4.52/share",
        "Senior housing operating (SHO) same-store NOI surged 22.3% YoY on occupancy recovery and strong rate growth",
        "Deployed $1.8B into senior housing and outpatient medical assets at a blended 5.9% yield; disposed $220mm at 5.4% cap rate",
      ],
    },
    {
      title: "2. Key Metrics",
      rows: [
        { label: "NOI",             value: "$1.1B annualized (+15.2% YoY)" },
        { label: "Occupancy",       value: "SHO 83.4% (+320bps YoY) · Outpatient 94.1%" },
        { label: "Guidance",        value: "Normalized FFO $4.44–$4.52/sh (raised $0.08)" },
        { label: "Leverage",        value: "Net Debt/EBITDA 5.2x · $4.1B liquidity" },
        { label: "Acq / Disp",      value: "$1.8B acquired · $220mm disposed" },
      ],
    },
    {
      title: "3. Management Tone",
      text: "Confident — strong conviction on senior housing fundamentals, citing unprecedented baby boomer demand against constrained new supply; emphasized depth of acquisition pipeline.",
    },
    {
      title: "4. Stock View",
      text: "Bullish: WELL's 22%+ SHO NOI growth is among the fastest in the REIT universe, and occupancy remains well below pre-COVID peaks — a long runway of organic upside remains. At ~26x FFO the premium is real, which limits appeal for value buyers but is justified by scarcity of this growth profile.",
    },
    {
      title: "5. Watch Next Quarter",
      bullets: [
        "SHO occupancy trajectory — bull case requires continued 200–300bps annual recovery toward 87–88%",
        "Acquisition pace and yield sustainability given rising competition for high-quality senior housing assets",
      ],
    },
  ],
};

export function TranscriptPanel({ ticker }: { ticker: string }) {
  const [showSample, setShowSample] = useState(false);

  return (
    <div className="space-y-3">
      {/* Coming soon banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
        <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
          AI transcript analysis — coming soon.
        </p>
      </div>

      {!showSample ? (
        <button
          onClick={() => setShowSample(true)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          Preview sample output
        </button>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Illustrative Example · Welltower</p>
          </div>

          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug">{WELLTOWER_SAMPLE.header}</p>

          {WELLTOWER_SAMPLE.sections.map((s) => (
            <div key={s.title} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2.5">
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">{s.title}</p>

              {"bullets" in s && s.bullets && (
                <div className="space-y-0.5">
                  {s.bullets.map((b, i) => (
                    <div key={i} className="flex gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                      <span className="text-blue-400 flex-shrink-0">•</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              {"rows" in s && s.rows && (
                <div className="space-y-0.5">
                  {s.rows.map((r, i) => (
                    <div key={i} className="flex gap-1 text-xs">
                      <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">{r.label}:</span>
                      <span className="text-gray-700 dark:text-gray-300">{r.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {"text" in s && s.text && (
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{s.text}</p>
              )}
            </div>
          ))}

          <button
            onClick={() => setShowSample(false)}
            className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Hide sample
          </button>
        </div>
      )}
    </div>
  );
}
