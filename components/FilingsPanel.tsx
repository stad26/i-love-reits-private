"use client";
import { useEffect, useState } from "react";
import { FileText, ExternalLink, AlertCircle } from "lucide-react";

interface Filing {
  form: string;
  filingDate: string;
  reportDate: string;
  accessionNumber: string;
  url: string;
  description: string;
}

interface FilingsData {
  cik?: string;
  companyName?: string;
  filings: Filing[];
  error?: string;
}

const FORM_COLORS: Record<string, string> = {
  "10-K": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "10-Q": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "8-K":  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "DEF 14A": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

interface FilingsPanelProps {
  ticker: string;
  companyName?: string;
}

export function FilingsPanel({ ticker, companyName }: FilingsPanelProps) {
  const [data, setData] = useState<FilingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/filings?ticker=${ticker}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ filings: [], error: "Failed to load filings" }))
      .finally(() => setLoading(false));
  }, [ticker]);

  const forms = ["All", "10-K", "10-Q", "8-K", "DEF 14A"];
  const filtered = (data?.filings ?? []).filter((f) => filter === "All" || f.form === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">SEC Filings</h3>
          {data?.companyName && (
            <p className="text-xs text-gray-400 mt-0.5">
              {data.companyName} · CIK {data.cik} ·{" "}
              <a
                href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${data.cik}&type=10-K&dateb=&owner=include&count=10`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View on EDGAR ↗
              </a>
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {forms.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data?.error && (
        <div className="flex items-center gap-2 text-sm text-red-500 py-4">
          <AlertCircle className="w-4 h-4" /> {data.error}
        </div>
      )}

      {!loading && !data?.error && filtered.length === 0 && (
        <div className="text-sm text-gray-400 py-6 text-center">No {filter === "All" ? "" : filter + " "}filings found.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-1.5">
          {filtered.map((f) => (
            <a
              key={f.accessionNumber}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
            >
              <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${FORM_COLORS[f.form] ?? "bg-gray-100 text-gray-700"}`}>
                    {f.form}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{f.description}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Filed {new Date(f.filingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {f.reportDate && f.reportDate !== f.filingDate && (
                    <> · Period ending {new Date(f.reportDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                  )}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
        Source: SEC EDGAR · Filings open directly from the SEC website ·{" "}
        <a
          href={`https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&forms=10-K,10-Q,8-K`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          Search EDGAR full text ↗
        </a>
      </p>

      {companyName && (
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
          Earnings call transcripts:{" "}
          <a
            href={`https://seekingalpha.com/symbol/${ticker}/earnings/transcripts`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Seeking Alpha ↗
          </a>
          {" · "}
          <a
            href={`https://www.fool.com/earnings-call-transcripts/?search=${encodeURIComponent(companyName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Motley Fool ↗
          </a>
        </p>
      )}
    </div>
  );
}
