"use client";
import { useState, useEffect, useMemo } from "react";
import { BaseAssumptions, SensitivityTable } from "@/lib/types";
import { effectiveFfoYoYGrowthPercent, effectiveSameStoreNOIGrowthPercent } from "@/lib/ffoGrowth";
import { getREITInfo, getPeersBySector, REIT_UNIVERSE } from "@/lib/reits";
import { QuoteData } from "@/lib/types";
import { buildPFFOTable, buildCapRateTable, buildNAVTable, heatColor } from "@/lib/sensitivity";
import { fmtCurrency, fmtMarketCap, fmtPct } from "@/lib/utils";
import { Tooltip } from "./Tooltip";
import { AlertCircle, Edit2, X, Plus, Users } from "lucide-react";

const PEER_KEY = (ticker: string) => `peers_v1_${ticker}`;

function loadPeers(ticker: string, defaultPeers: string[]): string[] {
  if (typeof window === "undefined") return defaultPeers;
  const raw = localStorage.getItem(PEER_KEY(ticker));
  return raw ? JSON.parse(raw) : defaultPeers;
}
function savePeers(ticker: string, peers: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PEER_KEY(ticker), JSON.stringify(peers));
}

// ─── Axis editor ──────────────────────────────────────────────────────────────

function AxisEditor({ label, values, onChange }: {
  label: string; values: number[]; onChange: (v: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const count = values.length;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 underline">
        Edit {label}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-64">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{count} values, comma-separated</p>
          <input
            type="text"
            defaultValue={values.join(", ")}
            onBlur={(e) => {
              const parsed = e.target.value.split(",").map((v) => parseFloat(v.trim())).filter((v) => !isNaN(v)).slice(0, count);
              if (parsed.length === count) onChange(parsed);
              setOpen(false);
            }}
            className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1.5">Tab or click away to apply. Must be exactly {count} values.</p>
        </div>
      )}
    </div>
  );
}

// ─── Sensitivity table renderer ───────────────────────────────────────────────

function SensTable({ table, rowLabel, colLabel, isRowPct = true, isColPct = false }: {
  table: SensitivityTable; rowLabel: string; colLabel: string; isRowPct?: boolean; isColPct?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left pr-3 py-1.5 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap text-xs">
              {rowLabel} ↓ &nbsp; {colLabel} →
            </th>
            {table.cols.values.map((c, ci) => (
              <th key={ci} className={`text-right px-2 py-1.5 font-medium whitespace-nowrap text-xs ${ci === table.hereCol ? "text-blue-600 dark:text-blue-400 underline decoration-dotted" : "text-gray-500 dark:text-gray-400"}`}>
                {isColPct ? `${c.toFixed(1)}%` : `${c % 1 === 0 ? c.toFixed(0) : c.toFixed(1)}x`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.values.map((r, ri) => (
            <tr key={ri}>
              <td className={`pr-3 py-1.5 font-medium whitespace-nowrap text-xs ${ri === table.hereRow ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}>
                {isRowPct ? `${r > 0 ? "+" : ""}${r.toFixed(1)}%` : `${r.toFixed(2)}%`}
              </td>
              {table.cols.values.map((_, ci) => {
                const val = table.cells[ri]?.[ci] ?? null;
                const isHere = ri === table.hereRow && ci === table.hereCol;
                return (
                  <td key={ci} className={`text-right px-2 py-1.5 font-mono rounded ${heatColor(val, table.currentPrice)} ${isHere ? "ring-2 ring-blue-500 ring-inset font-bold" : ""}`}>
                    {val !== null ? `$${val.toFixed(2)}` : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Peer editor ──────────────────────────────────────────────────────────────

function PeerEditor({ peers, onChange }: { peers: string[]; onChange: (p: string[]) => void }) {
  const [input, setInput] = useState("");
  const allTickers = REIT_UNIVERSE.map((r) => r.ticker);

  function add() {
    const t = input.trim().toUpperCase();
    if (t && !peers.includes(t) && allTickers.includes(t)) {
      onChange([...peers, t]);
      setInput("");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {peers.map((t) => (
          <span key={t} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-lg">
            {t}
            <button onClick={() => onChange(peers.filter((p) => p !== t))} className="text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add ticker…"
          list="reit-list"
          className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <datalist id="reit-list">
          {allTickers.filter((t) => !peers.includes(t)).map((t) => <option key={t} value={t} />)}
        </datalist>
        <button onClick={add} className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <p className="text-xs text-gray-400">Only tickers in the REIT universe are supported.</p>
    </div>
  );
}

// ─── 52W range bar ────────────────────────────────────────────────────────────

function RangeBar({ price, low, high }: { price: number | null; low: number | null; high: number | null }) {
  if (!price || !low || !high || high <= low) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-blue-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-1.5 w-24">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full relative">
        <div className={`absolute top-0 h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-7 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

// ─── Peer metrics table ───────────────────────────────────────────────────────

function PeerTable({ quotes, loading, subjectTicker }: { quotes: QuoteData[]; loading: boolean; subjectTicker: string }) {
  if (loading) return <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse mt-3" />;
  if (!quotes.length) return null;

  const valid = quotes.filter((q) => !q.error && q.price);
  if (!valid.length) return null;

  // Compute medians for relative shading (peers only, exclude subject)
  const peers = valid.filter((q) => q.ticker !== subjectTicker);
  const yields = peers.map((q) => q.dividendYield).filter((v): v is number => v != null);
  const books  = peers.map((q) => q.priceToBook).filter((v): v is number => v != null);
  const medianYield = yields.sort((a, b) => a - b)[Math.floor(yields.length / 2)] ?? 0;
  const medianBook  = books.sort((a, b) => a - b)[Math.floor(books.length / 2)] ?? 1;

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-1.5 pr-2 font-medium text-gray-500 dark:text-gray-400">Ticker</th>
            <th className="text-right py-1.5 px-2 font-medium text-gray-500 dark:text-gray-400">Price</th>
            <th className="text-right py-1.5 px-2 font-medium text-gray-500 dark:text-gray-400">Mkt Cap</th>
            <th className="text-right py-1.5 px-2 font-medium text-gray-500 dark:text-gray-400">Div Yield</th>
            <th className="text-right py-1.5 px-2 font-medium text-gray-500 dark:text-gray-400">P/Book</th>
            <th className="text-right py-1.5 px-2 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">52W Range</th>
          </tr>
        </thead>
        <tbody>
          {valid.map((q) => {
            const isSubject = q.ticker === subjectTicker;
            const yieldAboveMedian = q.dividendYield != null && q.dividendYield > medianYield;
            const bookAboveMedian  = q.priceToBook  != null && q.priceToBook  > medianBook;
            return (
              <tr key={q.ticker} className={`border-b border-gray-100 dark:border-gray-800 ${isSubject ? "bg-blue-50 dark:bg-blue-950/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
                <td className="py-2 pr-2 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  {q.ticker}
                  {isSubject && <span className="ml-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1 py-0.5 rounded">you</span>}
                </td>
                <td className="py-2 px-2 text-right font-mono text-gray-700 dark:text-gray-300">{fmtCurrency(q.price)}</td>
                <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">{fmtMarketCap(q.marketCap)}</td>
                <td className={`py-2 px-2 text-right font-medium ${yieldAboveMedian ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-gray-400"}`}>
                  {q.dividendYield != null ? fmtPct(q.dividendYield) : "—"}
                </td>
                <td className={`py-2 px-2 text-right font-medium ${bookAboveMedian ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"}`}>
                  {q.priceToBook != null ? `${q.priceToBook.toFixed(2)}x` : "—"}
                </td>
                <td className="py-2 px-2 flex justify-end">
                  <RangeBar price={q.price} low={q.fiftyTwoWeekLow} high={q.fiftyTwoWeekHigh} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
        <span><span className="text-emerald-500 font-medium">Green yield</span> = above peer median</span>
        <span><span className="text-amber-500 font-medium">Amber P/Book</span> = above peer median (pricier vs book)</span>
        <span>52W bar: left = 52W low, right = high</span>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type SubTab = "pffo" | "caprate" | "nav" | "peers";

interface ValuationPanelProps {
  ticker: string;
  assumptions: BaseAssumptions;  // committedAssumptions — only updates on Calculate
  currentPrice: number | null;
}

export function ValuationPanel({ ticker, assumptions, currentPrice }: ValuationPanelProps) {
  const [subTab, setSubTab] = useState<SubTab>("pffo");
  const [peerQuotes, setPeerQuotes] = useState<QuoteData[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(false);
  const [editingPeers, setEditingPeers] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);

  const [pffoGrowthAxis, setPffoGrowthAxis]     = useState<number[]>([]);
  const [pffoMultipleAxis, setPffoMultipleAxis] = useState<number[]>([]);
  const [crGrowthAxis, setCrGrowthAxis]         = useState<number[]>([]);
  const [crCapRateAxis, setCrCapRateAxis]       = useState<number[]>([]);
  const [navCapRateAxis, setNavCapRateAxis]     = useState<number[]>([]);
  const [navMultipleAxis, setNavMultipleAxis]   = useState<number[]>([]);

  const info = getREITInfo(ticker);

  // Initialize peer list
  useEffect(() => {
    const defaultPeers = info
      ? getPeersBySector(info.sector).filter((t) => t !== ticker).slice(0, 6)
      : [];
    const stored = loadPeers(ticker, defaultPeers);
    setPeers(stored);
  }, [ticker, info]);

  // Fetch subject + peer quotes whenever peer list changes (subject always first)
  useEffect(() => {
    setLoadingPeers(true);
    const tickers = [ticker, ...peers.filter((p) => p !== ticker)];
    fetch(`/api/quote?tickers=${tickers.join(",")}`)
      .then((r) => r.json())
      .then(setPeerQuotes)
      .finally(() => setLoadingPeers(false));
  }, [ticker, peers]);

  function updatePeers(newPeers: string[]) {
    setPeers(newPeers);
    savePeers(ticker, newPeers);
  }

  // ── Derived base metrics (from committedAssumptions) ─────────────────────────
  const ffoPerShare = assumptions.ffoPerDilutedShare;

  const marketCap = useMemo(() =>
    assumptions.sharePrice != null && assumptions.sharesOutstanding != null
      ? assumptions.sharePrice * assumptions.sharesOutstanding : null,
  [assumptions]);

  const ev = useMemo(() =>
    marketCap != null
      ? marketCap + (assumptions.totalDebt ?? 0) - (assumptions.totalCash ?? 0) + (assumptions.preferredEquity ?? 0)
      : null,
  [assumptions, marketCap]);

  const impliedCapRate = useMemo(() =>
    assumptions.inPlaceNOI != null && ev != null && ev > 0
      ? (assumptions.inPlaceNOI / ev) * 100 : null,
  [assumptions, ev]);

  const effectiveNetDebt = (assumptions.totalDebt ?? 0) - (assumptions.totalCash ?? 0) + (assumptions.preferredEquity ?? 0);

  // YoY growth rates — center the sensitivity tables
  const ffoGrowthRate = useMemo(
    () => effectiveFfoYoYGrowthPercent(assumptions),
    [assumptions],
  );

  // SS NOI growth centers the cap rate table rows; computed from either prior NOI or direct %
  const noiGrowthRate = useMemo(() => effectiveSameStoreNOIGrowthPercent(assumptions), [assumptions]);

  // ── Sensitivity tables ──────────────────────────────────────────────────────
  const pffoTable = useMemo((): SensitivityTable | null => {
    if (!ffoPerShare) return null;
    return buildPFFOTable({
      baseFfoPerShare: ffoPerShare,
      currentPrice,
      ffoGrowthRate,
      growthRates: pffoGrowthAxis.length === 5 ? pffoGrowthAxis : undefined,
      multiples:   pffoMultipleAxis.length === 5 ? pffoMultipleAxis : undefined,
    });
  }, [ffoPerShare, currentPrice, ffoGrowthRate, pffoGrowthAxis, pffoMultipleAxis]);

  const capRateTable = useMemo((): SensitivityTable | null => {
    if (!assumptions.inPlaceNOI || !assumptions.sharesOutstanding) return null;
    return buildCapRateTable({
      baseNoi:           assumptions.inPlaceNOI,
      sharesOutstanding: assumptions.sharesOutstanding,
      netDebt:           effectiveNetDebt,
      currentPrice,
      currentCapRate:    impliedCapRate,
      noiGrowthRate,
      growthRates: crGrowthAxis.length === 5 ? crGrowthAxis : undefined,
      capRates:    crCapRateAxis.length === 5 ? crCapRateAxis : undefined,
    });
  }, [assumptions, effectiveNetDebt, currentPrice, impliedCapRate, noiGrowthRate, crGrowthAxis, crCapRateAxis]);

  const navAtImpliedCapRate = useMemo(() =>
    assumptions.inPlaceNOI != null && impliedCapRate != null && impliedCapRate > 0 && assumptions.sharesOutstanding != null
      ? (assumptions.inPlaceNOI / (impliedCapRate / 100) - effectiveNetDebt) / assumptions.sharesOutstanding
      : null,
  [assumptions, impliedCapRate, effectiveNetDebt]);

  const impliedPNav = useMemo(() =>
    currentPrice != null && navAtImpliedCapRate != null && navAtImpliedCapRate > 0
      ? currentPrice / navAtImpliedCapRate
      : null,
  [currentPrice, navAtImpliedCapRate]);

  const navTable = useMemo((): SensitivityTable | null => {
    if (!assumptions.inPlaceNOI || !assumptions.sharesOutstanding) return null;
    return buildNAVTable({
      baseNoi:           assumptions.inPlaceNOI,
      sharesOutstanding: assumptions.sharesOutstanding,
      netDebt:           effectiveNetDebt,
      currentPrice,
      impliedCapRate,
      currentPNav:  impliedPNav,
      capRates:     navCapRateAxis.length === 5 ? navCapRateAxis   : undefined,
      multiples:    navMultipleAxis.length === 5 ? navMultipleAxis : undefined,
    });
  }, [assumptions, effectiveNetDebt, currentPrice, impliedCapRate, impliedPNav, navCapRateAxis, navMultipleAxis]);

  const hasData = !!ffoPerShare || !!assumptions.inPlaceNOI;
  const isEmpty = !assumptions.sharePrice && !ffoPerShare && !assumptions.inPlaceNOI;

  const subTabs: { id: SubTab; label: string; tooltip: string }[] = [
    { id: "pffo",    label: "P/FFO",           tooltip: "5×5 price sensitivity. Rows = FFO growth centered on actual YoY. Cols = P/FFO multiple centered on current implied multiple." },
    { id: "caprate", label: "Implied Cap Rate", tooltip: "5×5 price sensitivity. Rows = SS NOI growth centered on actual YoY. Cols = cap rate centered on market-implied (NOI÷EV)." },
    { id: "nav",     label: "NAV",              tooltip: "5×5 implied stock price sensitivity. Rows = cap rate ±100bps around implied. Cols = P/NAV multiple (0.80x → 1.20x)." },
    { id: "peers",   label: "Peers",            tooltip: "Editable peer set with Div Yield, Price/Book, and 52W range comparison." },
  ];

  const legend = (
    <div className="text-xs bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-blue-800 dark:text-blue-200">
      Green = above current price · Red = below · <strong>Blue ring = current conditions (you are here)</strong>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Sub-tab row */}
      <div className="flex gap-1 flex-wrap">
        {subTabs.map((t) => (
          <Tooltip key={t.id} text={t.tooltip}>
            <button
              onClick={() => setSubTab(t.id)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${subTab === t.id ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              {t.id === "peers" ? <><Users className="w-3.5 h-3.5 inline mr-1" />{t.label}</> : t.label}
            </button>
          </Tooltip>
        ))}
      </div>

      {isEmpty && (
        <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
          Fill in the Inputs panel and click <strong>Calculate</strong> to build the sensitivity tables.
        </div>
      )}

      {/* ── P/FFO ── */}
      {subTab === "pffo" && !isEmpty && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
              <p>Implied price = FFO/share × (1 + growth%) × P/FFO multiple.</p>
              <p className="flex gap-3 flex-wrap">
                {currentPrice && ffoPerShare && (
                  <span>Current P/FFO: <span className="font-semibold text-blue-600 dark:text-blue-400">{(currentPrice / ffoPerShare).toFixed(1)}x</span></span>
                )}
                {ffoGrowthRate != null && (
                  <span>YoY FFO growth: <span className={`font-semibold ${ffoGrowthRate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>{ffoGrowthRate >= 0 ? "+" : ""}{ffoGrowthRate.toFixed(1)}%</span> <span className="opacity-70">(centers rows)</span></span>
                )}
                {!ffoGrowthRate && (
                  <span className="opacity-60">
                    Enter prior-period FFO/sh or YoY growth % (Inputs) to center rows on actual growth.
                  </span>
                )}
              </p>
            </div>
            {pffoTable && (
              <div className="flex gap-3 text-xs">
                <AxisEditor label="Growth Rates" values={pffoTable.rows.values} onChange={setPffoGrowthAxis} />
                <AxisEditor label="Multiples"    values={pffoTable.cols.values} onChange={setPffoMultipleAxis} />
              </div>
            )}
          </div>
          {pffoTable ? (
            <>{legend}<SensTable table={pffoTable} rowLabel="FFO Growth" colLabel="P/FFO Multiple" isRowPct isColPct={false} /></>
          ) : (
            <p className="text-sm text-gray-400">Enter FFO per Diluted Share and click Calculate.</p>
          )}
        </div>
      )}

      {/* ── Implied Cap Rate ── */}
      {subTab === "caprate" && !isEmpty && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
              <p>Implied price = (NOI × (1+g%) ÷ cap rate − Net Debt − Preferred) ÷ Shares.</p>
              <p className="flex gap-3 flex-wrap">
                {impliedCapRate != null && (
                  <span>Market-implied cap rate: <span className="font-semibold text-blue-600 dark:text-blue-400">{impliedCapRate.toFixed(2)}%</span> <span className="opacity-70">(centers cols)</span></span>
                )}
                {noiGrowthRate != null && (
                  <span>SS NOI growth: <span className={`font-semibold ${noiGrowthRate >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>{noiGrowthRate >= 0 ? "+" : ""}{noiGrowthRate.toFixed(1)}%</span> <span className="opacity-70">(centers rows)</span></span>
                )}
                {!noiGrowthRate && <span className="opacity-60">Enter Same Store NOI Growth % to center rows on actual growth.</span>}
              </p>
            </div>
            {capRateTable && (
              <div className="flex gap-3 text-xs">
                <AxisEditor label="NOI Growth Rates" values={capRateTable.rows.values} onChange={setCrGrowthAxis} />
                <AxisEditor label="Cap Rates"         values={capRateTable.cols.values} onChange={setCrCapRateAxis} />
              </div>
            )}
          </div>
          {capRateTable ? (
            <>{legend}<SensTable table={capRateTable} rowLabel="NOI Growth" colLabel="Cap Rate" isRowPct isColPct /></>
          ) : (
            <p className="text-sm text-gray-400">Enter In-Place NOI, Shares, Debt, and Cash and click Calculate.</p>
          )}
        </div>
      )}

      {/* ── NAV ── */}
      {subTab === "nav" && !isEmpty && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
              <p>Implied price = (In-Place NOI ÷ cap rate − Net Debt) ÷ Shares × P/NAV multiple.</p>
              <p className="flex gap-3 flex-wrap">
                {impliedCapRate != null && (
                  <span>Implied cap rate: <span className="font-semibold text-blue-600 dark:text-blue-400">{impliedCapRate.toFixed(2)}%</span> <span className="opacity-70">(rows ±100bps)</span></span>
                )}
                {navAtImpliedCapRate != null && (
                  <span>NAV/share: <span className="font-semibold text-blue-600 dark:text-blue-400">{fmtCurrency(navAtImpliedCapRate)}</span></span>
                )}
                {impliedPNav != null && (
                  <span>Current P/NAV: <span className="font-semibold text-blue-600 dark:text-blue-400">{impliedPNav.toFixed(2)}x</span> <span className="opacity-70">(centers cols)</span></span>
                )}
              </p>
            </div>
            {navTable && (
              <div className="flex gap-3 text-xs">
                <AxisEditor label="Cap Rates"      values={navTable.rows.values} onChange={setNavCapRateAxis} />
                <AxisEditor label="P/NAV Multiples" values={navTable.cols.values} onChange={setNavMultipleAxis} />
              </div>
            )}
          </div>
          {navTable ? (
            <>{legend}<SensTable table={navTable} rowLabel="Cap Rate" colLabel="P/NAV" isRowPct={false} isColPct={false} /></>
          ) : (
            <p className="text-sm text-gray-400">Enter In-Place NOI, Shares, Debt, and Cash and click Calculate.</p>
          )}
        </div>
      )}

      {/* ── Peers ── */}
      {subTab === "peers" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Subject + {peers.length} peers · Div Yield and P/Book shaded relative to peer median.
              </p>
            </div>
            <button
              onClick={() => setEditingPeers((e) => !e)}
              className="flex items-center gap-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              {editingPeers ? "Done" : "Edit Peers"}
            </button>
          </div>

          {editingPeers && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
              <PeerEditor peers={peers} onChange={updatePeers} />
            </div>
          )}

          <PeerTable quotes={peerQuotes} loading={loadingPeers} subjectTicker={ticker} />
        </div>
      )}

    </div>
  );
}
