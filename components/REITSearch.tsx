"use client";
import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { REIT_UNIVERSE } from "@/lib/reits";

interface REITSearchProps {
  onSelect: (ticker: string) => void;
}

export function REITSearch({ onSelect }: REITSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length === 0
    ? []
    : REIT_UNIVERSE.filter((r) => {
        const q = query.toLowerCase();
        return r.ticker.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
      }).slice(0, 10);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(ticker: string) {
    onSelect(ticker);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); setQuery(""); }
            if (e.key === "Enter" && results.length === 1) select(results[0].ticker);
          }}
          placeholder="Search by ticker or company name..."
          className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={r.ticker}
              onMouseDown={() => select(r.ticker)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-gray-900 dark:text-white w-12">{r.ticker}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{r.name}</span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{r.sector}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
