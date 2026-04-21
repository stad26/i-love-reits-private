"use client";
import { Clock, Sparkles } from "lucide-react";

const SAMPLE = {
  header: "Prologis (PLD) – Earnings Call Snapshot",
  sections: [
    {
      title: "1. What Mattered",
      bullets: [
        "Core FFO of $1.37/share beat consensus by $0.03; full-year guidance raised $0.10 at the midpoint",
        "Same-store NOI growth of 7.2% YoY driven by record lease spreads of +68% on new and renewal leases",
        "Net acquisitions of $1.1B in Q1; disposed $380mm of non-core assets at a 4.8% cap rate",
      ],
    },
    {
      title: "2. Key Metrics",
      rows: [
        { label: "NOI", value: "$1.84B annualized (+8.1% YoY)" },
        { label: "Occupancy", value: "96.8% (−30bps QoQ)" },
        { label: "Guidance", value: "Core FFO $5.42–$5.56/sh (raised)" },
        { label: "Leverage", value: "Net Debt/EBITDA 4.6x · $5.8B liquidity" },
        { label: "Acq / Disp", value: "$1.1B acquired · $380mm disposed" },
      ],
    },
    {
      title: "3. Management Tone",
      text: "Confident — upbeat on rent growth durability and e-commerce demand, with measured acknowledgment of occupancy normalization.",
    },
    {
      title: "4. Stock View",
      text: "Bullish: PLD trades at ~22x forward FFO with best-in-class rent growth and a fortress balance sheet — the premium is justified by its global logistics moat. The guidance raise and strong lease spreads support the bull case even at current valuations.",
    },
    {
      title: "5. Watch Next Quarter",
      bullets: [
        "Whether occupancy recovers toward 97%+ or continues to drift — key signal on supply/demand balance",
        "Progress on the $2B+ development pipeline and whether yields on cost hold above 6%",
      ],
    },
  ],
};

export function TranscriptPanel({ ticker }: { ticker: string }) {
  return (
    <div className="space-y-3">
      {/* Coming soon banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
        <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
          AI transcript analysis — coming soon. Sample output below.
        </p>
      </div>

      {/* Illustrative sample — slightly muted */}
      <div className="opacity-80 space-y-1.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3 h-3 text-blue-400" />
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Illustrative Example</p>
        </div>

        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug">{SAMPLE.header}</p>

        {SAMPLE.sections.map((s) => (
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
      </div>
    </div>
  );
}
