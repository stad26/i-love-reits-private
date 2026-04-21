"use client";
import { useEffect, useState } from "react";
import { BaseAssumptions, DEFAULT_BASE_ASSUMPTIONS, QuoteData } from "@/lib/types";
import { effectiveFfoYoYGrowthPercent, impliedPriorFfoPerShareFromGrowth } from "@/lib/ffoGrowth";
import { Tooltip } from "./Tooltip";
import { RefreshCw, Calculator, AlertCircle } from "lucide-react";

const STORAGE_KEY = (ticker: string) => `assumptions_v6_${ticker}`;
const LEGACY_STORAGE_KEY = (ticker: string) => `assumptions_v5_${ticker}`;

// ── Field lives outside AssumptionsPanel so it keeps a stable identity across
//    renders. Defining it inside would cause React to unmount/remount the input
//    on every keystroke, losing focus.
interface FieldProps {
  label: string;
  unit: string;
  field: keyof BaseAssumptions;
  tooltip: string;
  prefix?: string;
  suffix?: string;
  step?: string;
  placeholder?: string;
  value: number | null;
  isAutoFilled: boolean;
  onChange: (field: keyof BaseAssumptions, raw: string) => void;
}
function Field({ label, unit, field, tooltip, prefix = "", suffix = "", step = "0.01", placeholder = "—", value, isAutoFilled, onChange }: FieldProps) {
  return (
    <div>
      <label className="flex items-baseline justify-between mb-1 gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Tooltip text={tooltip}>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{label}</span>
          </Tooltip>
          {isAutoFilled && <span className="text-xs text-blue-500 dark:text-blue-400 flex-shrink-0">Yahoo ↓</span>}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{unit}</span>
      </label>
      <div className="relative">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{prefix}</span>}
        <input
          type="number"
          step={step}
          value={value ?? ""}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className={`w-full text-sm border rounded-lg py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isAutoFilled ? "border-blue-300 dark:border-blue-700" : "border-gray-300 dark:border-gray-600"
          } ${prefix ? "pl-5 pr-2" : suffix ? "pl-3 pr-6" : "px-3"}`}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

function load(ticker: string): BaseAssumptions | null {
  if (typeof window === "undefined") return null;
  const raw =
    localStorage.getItem(STORAGE_KEY(ticker)) ??
    localStorage.getItem(LEGACY_STORAGE_KEY(ticker));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<BaseAssumptions>;
    return { ...DEFAULT_BASE_ASSUMPTIONS, ...parsed };
  } catch {
    return null;
  }
}

function save(ticker: string, data: BaseAssumptions) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(ticker), JSON.stringify(data));
}

interface AssumptionsPanelProps {
  ticker: string;
  assumptions: BaseAssumptions;
  onChange: (a: BaseAssumptions) => void;
  onCalculate: (a: BaseAssumptions) => void;
}

interface FinancialsData {
  keyStats: { sharesOutstanding: number | null } | null;
}

export function AssumptionsPanel({ ticker, assumptions, onChange, onCalculate }: AssumptionsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [sourced, setSourced] = useState<Set<keyof BaseAssumptions>>(new Set());
  const [dirty, setDirty] = useState(false); // unsaved changes since last Calculate

  useEffect(() => {
    const saved = load(ticker);
    if (saved) {
      onChange(saved);
      setSourced(new Set());
      setDirty(false);
    } else {
      onChange({ ...DEFAULT_BASE_ASSUMPTIONS });
      prefill(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  async function prefill(autoCalculate = false) {
    setLoading(true);
    try {
      const [quoteRes, finRes] = await Promise.all([
        fetch(`/api/quote?tickers=${ticker}`).then((r) => r.json()),
        fetch(`/api/financials?ticker=${ticker}`).then((r) => r.json()),
      ]);
      const q: QuoteData = quoteRes[0];
      const fin: FinancialsData = finRes;

      const derived: Partial<BaseAssumptions> = {};
      const newSourced = new Set<keyof BaseAssumptions>();

      if (q.price != null) { derived.sharePrice = q.price; newSourced.add("sharePrice"); }

      const sharesM = fin?.keyStats?.sharesOutstanding
        ? fin.keyStats.sharesOutstanding / 1e6 : null;
      if (sharesM != null) {
        derived.sharesOutstanding = Math.round(sharesM * 10) / 10;
        newSourced.add("sharesOutstanding");
      }
      if (q.totalDebt) { derived.totalDebt = Math.round(q.totalDebt / 1e6); newSourced.add("totalDebt"); }
      if (q.totalCash) { derived.totalCash = Math.round(q.totalCash / 1e6); newSourced.add("totalCash"); }
      derived.preferredEquity = 0; newSourced.add("preferredEquity");

      setSourced(newSourced);
      setDirty(false);

      const next = { ...DEFAULT_BASE_ASSUMPTIONS, ...derived };
      onChange(next);
      save(ticker, next);
      if (autoCalculate) onCalculate(next);
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  function update(key: keyof BaseAssumptions, raw: string) {
    const val = raw === "" ? null : parseFloat(raw);
    const next = { ...assumptions, [key]: isNaN(val as number) ? null : val };
    onChange(next);
    save(ticker, next);
    setDirty(true);
  }

  function setFfoGrowthInputMode(mode: "prior_ffo" | "growth_pct") {
    if (mode === assumptions.ffoGrowthInputMode) return;
    let next: BaseAssumptions = { ...assumptions, ffoGrowthInputMode: mode };
    if (mode === "growth_pct") {
      const cur = assumptions.ffoPerDilutedShare;
      const prior = assumptions.priorYearFFOPerShare;
      if (cur != null && prior != null && prior > 0) {
        next.ffoYoYGrowthPercent = Math.round((((cur - prior) / prior) * 100) * 1000) / 1000;
      }
    } else {
      const cur = assumptions.ffoPerDilutedShare;
      const g = assumptions.ffoYoYGrowthPercent;
      if (cur != null && g != null && g > -100) {
        next.priorYearFFOPerShare = Math.round((cur / (1 + g / 100)) * 1000) / 1000;
      }
    }
    onChange(next);
    save(ticker, next);
    setDirty(true);
  }

  function handleCalculate() {
    onCalculate(assumptions);
    setDirty(false);
  }

  // ── Computed intermediates (live, for display only) ───────────────────────────
  const ffoGrowth = effectiveFfoYoYGrowthPercent(assumptions);
  const impliedPriorFfo = impliedPriorFfoPerShareFromGrowth(assumptions);

  const sameStoreWarning =
    assumptions.sameStoreNOI != null &&
    assumptions.inPlaceNOI != null &&
    assumptions.sameStoreNOI > assumptions.inPlaceNOI;

  const hasEnoughToCalculate =
    assumptions.sharePrice != null &&
    assumptions.sharesOutstanding != null &&
    (assumptions.ffoPerDilutedShare != null || assumptions.inPlaceNOI != null);

  // Convenience alias so JSX stays terse
  const af = (f: keyof BaseAssumptions) => sourced.has(f) && assumptions[f] != null;

  return (
    <div>
      {/* Header + action buttons */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Inputs</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <span className="text-blue-500">Yahoo ↓</span> = auto-filled
          </p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => prefill(false)}
            disabled={loading}
            title="Re-pull Yahoo Finance data"
            className="flex items-center gap-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleCalculate}
            disabled={!hasEnoughToCalculate}
            title="Run valuation with current inputs"
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
              dirty
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            {dirty ? "Calculate ●" : "Calculate"}
          </button>
        </div>
      </div>

      {dirty && (
        <div className="mb-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Inputs changed — click Calculate to update valuation.
        </div>
      )}

      <div className="space-y-5">

        {/* ── Market Data (Yahoo) ── */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Market Data <span className="text-blue-400 normal-case font-normal">Yahoo ↓</span>
          </p>
          <Field label="Share Price" unit="$ / share" field="sharePrice"
            tooltip="Current share price. Auto-filled from Yahoo; override to use a specific as-of date." prefix="$" step="0.01"
            value={assumptions.sharePrice} isAutoFilled={af("sharePrice")} onChange={update} />
          <Field label="Shares Outstanding" unit="millions" field="sharesOutstanding"
            tooltip="Fully diluted shares in millions — must include OP units. Source: earnings press release or 10-Q. Look for 'weighted average diluted shares + OP units'." step="0.1"
            value={assumptions.sharesOutstanding} isAutoFilled={af("sharesOutstanding")} onChange={update} />
        </div>

        {/* ── FFO / Share ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            FFO per Diluted Share
          </p>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 gap-0.5 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={() => setFfoGrowthInputMode("prior_ffo")}
              className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-colors ${
                assumptions.ffoGrowthInputMode === "prior_ffo"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Prior period FFO
            </button>
            <button
              type="button"
              onClick={() => setFfoGrowthInputMode("growth_pct")}
              className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-colors ${
                assumptions.ffoGrowthInputMode === "growth_pct"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              YoY growth %
            </button>
          </div>
          <Field label="Current Period" unit="$ / diluted share" field="ffoPerDilutedShare"
            tooltip="Normalized FFO per diluted share from the earnings press release non-GAAP table. Annualize if quarterly: Q × 4. Use Normalized FFO if available; NAREIT FFO as fallback."
            prefix="$" step="0.01" placeholder="Enter from press release"
            value={assumptions.ffoPerDilutedShare} isAutoFilled={af("ffoPerDilutedShare")} onChange={update} />
          {assumptions.ffoGrowthInputMode === "prior_ffo" ? (
            <Field label="Prior Year (same period)" unit="$ / diluted share" field="priorYearFFOPerShare"
              tooltip="FFO per diluted share for the same period one year ago — used to compute YoY growth rate, which centers the P/FFO sensitivity table."
              prefix="$" step="0.01" placeholder="For YoY growth rate"
              value={assumptions.priorYearFFOPerShare} isAutoFilled={af("priorYearFFOPerShare")} onChange={update} />
          ) : (
            <Field label="YoY FFO Growth" unit="%" field="ffoYoYGrowthPercent"
              tooltip="Year-over-year growth in normalized FFO per share. Centers the P/FFO sensitivity rows — use when you know the growth rate but not the prior-period FFO."
              step="0.1" suffix="%" placeholder="e.g. 4.5"
              value={assumptions.ffoYoYGrowthPercent} isAutoFilled={af("ffoYoYGrowthPercent")} onChange={update} />
          )}
          {ffoGrowth != null && (
            <div className={`text-xs px-2 py-1 rounded-lg font-medium ${ffoGrowth >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"}`}>
              YoY FFO growth: <strong>{ffoGrowth >= 0 ? "+" : ""}{ffoGrowth.toFixed(1)}%</strong>
              <span className="font-normal ml-1 opacity-75">— P/FFO table centered here</span>
            </div>
          )}
          {assumptions.ffoGrowthInputMode === "growth_pct" && impliedPriorFfo != null && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Implied prior-period FFO/sh:{" "}
              <span className="font-mono font-medium text-gray-700 dark:text-gray-300">${impliedPriorFfo.toFixed(2)}</span>
              <span className="ml-1 opacity-80">(from current FFO and growth %)</span>
            </p>
          )}
        </div>

        {/* ── In-Place NOI ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            In-Place Cash NOI
          </p>
          <Field label="Current Period" unit="$mm, annualized" field="inPlaceNOI"
            tooltip="Used for cap rate and NAV calculations. Reflects total portfolio earnings power today. Cash NOI from supplemental earnings package — strips straight-line rent and lease intangible amortization. Annualize: most recent Q × 4."
            step="1" placeholder="Enter from supplemental"
            value={assumptions.inPlaceNOI} isAutoFilled={af("inPlaceNOI")} onChange={update} />
          {assumptions.inPlaceNOI != null && (
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Quarterly source: <span className="font-mono font-medium text-gray-600 dark:text-gray-400">${(assumptions.inPlaceNOI / 4).toFixed(1)}mm</span>
              <span className="ml-1 opacity-75">(annualized ÷ 4)</span>
            </p>
          )}
          {assumptions.inPlaceNOI != null && assumptions.inPlaceNOI < 0 && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-2 py-1">
              NOI must be positive.
            </div>
          )}
        </div>

        {/* ── Same Store NOI (Growth Context) ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Growth Context
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-1">Not used in valuation math — organic growth benchmarking only.</p>
          <Field label="Same Store Cash NOI" unit="$mm, annualized" field="sameStoreNOI"
            tooltip="Not used in valuation math. Shows how the existing portfolio is growing organically. Properties owned for full comparative period — excludes acquisitions, dispositions, redevelopments. Annualize: most recent Q × 4."
            step="1" placeholder="From supplemental"
            value={assumptions.sameStoreNOI} isAutoFilled={af("sameStoreNOI")} onChange={update} />
          {sameStoreWarning && (
            <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1">
              Same Store NOI should be ≤ In-Place NOI — verify inputs.
            </div>
          )}
          <Field label="Same Store NOI Growth (YoY)" unit="%" field="sameStoreNOIGrowth"
            tooltip="Year-over-year same store NOI growth. Pull directly from earnings disclosure — do not calculate from the NOI fields above as the timing may differ. Flag if company does not disclose on a cash basis."
            step="0.1" suffix="%" placeholder="From press release"
            value={assumptions.sameStoreNOIGrowth} isAutoFilled={af("sameStoreNOIGrowth")} onChange={update} />
          {assumptions.sameStoreNOIGrowth != null && (
            <div className={`text-xs px-2 py-1 rounded-lg font-medium ${assumptions.sameStoreNOIGrowth >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"}`}>
              SS NOI growth: <strong>{assumptions.sameStoreNOIGrowth >= 0 ? "+" : ""}{assumptions.sameStoreNOIGrowth.toFixed(1)}%</strong>
              <span className="font-normal ml-1 opacity-75">— Cap rate table centered here</span>
            </div>
          )}
        </div>

        {/* ── Balance Sheet ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Balance Sheet <span className="text-blue-400 normal-case font-normal">Yahoo ↓</span>
          </p>
          <Field label="Total Debt" unit="$mm" field="totalDebt"
            tooltip="Gross debt in millions — all tranches: revolver, term loans, mortgages, secured debt. Period-end balance. Exclude preferred stock." step="1"
            value={assumptions.totalDebt} isAutoFilled={af("totalDebt")} onChange={update} />
          <Field label="Total Cash" unit="$mm" field="totalCash"
            tooltip="Unrestricted cash only in millions. Exclude restricted cash held for reserves or security deposits." step="1"
            value={assumptions.totalCash} isAutoFilled={af("totalCash")} onChange={update} />
          <Field label="Preferred Equity" unit="$mm" field="preferredEquity"
            tooltip="Liquidation value of preferred stock in millions. Public REIT preferred is almost always $25/share — multiply preferred shares by $25. Enter 0 if none." step="1"
            value={assumptions.preferredEquity} isAutoFilled={af("preferredEquity")} onChange={update} />
        </div>

      </div>
    </div>
  );
}
