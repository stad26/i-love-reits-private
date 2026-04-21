"use client";
import { useEffect, useState } from "react";
import { FileText, ExternalLink, AlertCircle, Globe, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { getREITInfo } from "@/lib/reits";

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
  "10-K":    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "10-Q":    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  "8-K":     "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "DEF 14A": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const PAGE_SIZE = 5;

export function SourcesPanel({ ticker }: { ticker: string }) {
  const [data, setData]       = useState<FilingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("All");
  const [page, setPage]       = useState(0);
  const info = getREITInfo(ticker);
  const name = info?.name ?? ticker;

  useEffect(() => {
    setLoading(true);
    setPage(0);
    fetch(`/api/filings?ticker=${ticker}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ filings: [], error: "Failed to load filings" }))
      .finally(() => setLoading(false));
  }, [ticker]);

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [filter]);

  const forms    = ["All", "10-K", "10-Q", "8-K", "DEF 14A"];
  const filtered = (data?.filings ?? []).filter((f) => filter === "All" || f.form === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const externalLinks = [
    {
      group: "Earnings & Research",
      links: [
        { label: "Seeking Alpha — Overview",            url: `https://seekingalpha.com/symbol/${ticker}` },
        { label: "Seeking Alpha — Earnings Transcripts", url: `https://seekingalpha.com/symbol/${ticker}/earnings/transcripts` },
        { label: "Seeking Alpha — Filings",             url: `https://seekingalpha.com/symbol/${ticker}/filings` },
      ],
    },
    {
      group: "Market Data",
      links: [
        { label: "Yahoo Finance",    url: `https://finance.yahoo.com/quote/${ticker}` },
        { label: "FINRA Bond Data",  url: `https://finra-markets.morningstar.com/BondCenter/Default.jsp` },
      ],
    },
  ];

  return (
    <div className="space-y-6">

      {/* Company links */}
      {(info?.website || info?.ir) && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{name}</h3>
          <div className="space-y-1.5">
            {info.website && (
              <a href={info.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:underline transition-colors">
                <Globe className="w-3 h-3 flex-shrink-0" />
                Company Website
              </a>
            )}
            {info.ir && (
              <a href={info.ir} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:underline transition-colors">
                <BarChart2 className="w-3 h-3 flex-shrink-0" />
                Investor Relations
              </a>
            )}
          </div>
        </div>
      )}

      {/* External links */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Research Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {externalLinks.map((group) => (
            <div key={group.group}>
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                {group.group}
              </div>
              <div className="space-y-1.5">
                {group.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:underline transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEC Filings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">SEC Filings</h3>
            {data?.companyName && (
              <p className="text-xs text-gray-400 mt-0.5">
                {data.companyName} · CIK {data.cik}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {forms.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && data?.error && (
          <div className="flex items-center gap-2 text-sm text-red-500 py-3">
            <AlertCircle className="w-4 h-4" /> {data.error}
          </div>
        )}

        {!loading && !data?.error && filtered.length === 0 && (
          <div className="text-sm text-gray-400 py-4 text-center">
            No {filter === "All" ? "" : filter + " "}filings found.
          </div>
        )}

        {!loading && paginated.length > 0 && (
          <>
            <div className="space-y-1.5">
              {paginated.map((f) => (
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
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{f.description}</span>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Newer
                </button>
                <span className="text-xs text-gray-400">
                  {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Older <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
