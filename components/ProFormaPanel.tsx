"use client";
import { useState, useMemo } from "react";
import {
  BaseAssumptions, CapitalEvent, CapitalEventType,
  PeriodInputs, PeriodMetrics, ProFormaPeriod,
} from "@/lib/types";
import { deriveBase, computeProForma, makeDefaultPeriods, impliedGrowthRate } from "@/lib/proforma";
import { fmtCurrency, fmtMarketCap } from "@/lib/utils";
import { Plus, Trash2, TrendingUp, AlertCircle } from "lucide-react";

const EVENT_LABELS: Record<CapitalEventType, string> = {
  equity_issuance: "Equity Issuance",
  equity_buyback: "Equity Buyback",
  debt_issuance: "Debt Issuance",
  debt_paydown: "Debt Paydown",
  acquisition: "Acquisition",
  disposition: "Disposition",
};

const EVENT_COLORS: Record<CapitalEventType, string> = {
  equity_issuance: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  equity_buyback: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  debt_issuance: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  debt_paydown: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  acquisition: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  disposition: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

interface ProFormaPanelProps {
  ticker: string;
  assumptions: BaseAssumptions;
  currentPrice: number | null;
  onMetricsChange?: (metrics: PeriodMetrics[]) => void;
}

function newEvent(type: CapitalEventType): CapitalEvent {
  return {
    id: Math.random().toString(36).slice(2),
    type,
    label: EVENT_LABELS[type],
    amount: 0,
    pricePerShare: type === "equity_issuance" || type === "equity_buyback" ? undefined : undefined,
    capRate: type === "acquisition" || type === "disposition" ? 5 : undefined,
    interestRate: type === "debt_issuance" ? 5 : undefined,
  };
}

function EventRow({
  event, onChange, onDelete,
}: {
  event: CapitalEvent;
  onChange: (e: CapitalEvent) => void;
  onDelete: () => void;
}) {
  const needsPrice = event.type === "equity_issuance" || event.type === "equity_buyback";
  const needsCapRate = event.type === "acquisition" || event.type === "disposition";
  const needsRate = event.type === "debt_issuance";

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${EVENT_COLORS[event.type]}`}>
        {EVENT_LABELS[event.type]}
      </span>
      <input
        type="text"
        value={event.label}
        onChange={(e) => onChange({ ...event, label: e.target.value })}
        placeholder="Label"
        className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-32 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400">$</span>
        <input
          type="number"
          value={event.amount || ""}
          onChange={(e) => onChange({ ...event, amount: parseFloat(e.target.value) || 0 })}
          placeholder="Amount $M"
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-24 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-400">M</span>
      </div>
      {needsPrice && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">@ $</span>
          <input
            type="number"
            value={event.pricePerShare ?? ""}
            onChange={(e) => onChange({ ...event, pricePerShare: parseFloat(e.target.value) || undefined })}
            placeholder="Price/sh"
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-20 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">/sh</span>
        </div>
      )}
      {needsCapRate && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">cap rate</span>
          <input
            type="number"
            value={event.capRate ?? ""}
            onChange={(e) => onChange({ ...event, capRate: parseFloat(e.target.value) || undefined })}
            placeholder="5.0"
            step="0.1"
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-16 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      )}
      {needsRate && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">rate</span>
          <input
            type="number"
            value={event.interestRate ?? ""}
            onChange={(e) => onChange({ ...event, interestRate: parseFloat(e.target.value) || undefined })}
            placeholder="5.0"
            step="0.1"
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-16 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      )}
      <button onClick={onDelete} className="ml-auto text-gray-400 hover:text-red-500 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function PeriodCard({
  input, onChange, isQuarterly,
}: {
  input: PeriodInputs;
  onChange: (p: PeriodInputs) => void;
  isQuarterly: boolean;
}) {
  const [addType, setAddType] = useState<CapitalEventType>("acquisition");

  function updateEvent(id: string, updated: CapitalEvent) {
    onChange({ ...input, events: input.events.map((e) => (e.id === id ? updated : e)) });
  }

  function deleteEvent(id: string) {
    onChange({ ...input, events: input.events.filter((e) => e.id !== id) });
  }

  function addEvent() {
    onChange({ ...input, events: [...input.events, newEvent(addType)] });
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {isQuarterly ? input.period : "Full Year"}
        </span>
      </div>
      <div className="p-4 space-y-4">
        {/* Growth rates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              NOI Growth Rate <span className="text-gray-400">(annualized %)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={input.noiGrowthRate}
                onChange={(e) => onChange({ ...input, noiGrowthRate: parseFloat(e.target.value) || 0 })}
                step="0.5"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 pr-6 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              FFO Adjustment <span className="text-gray-400">(% beyond NOI)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={input.ffoAdjustment}
                onChange={(e) => onChange({ ...input, ffoAdjustment: parseFloat(e.target.value) || 0 })}
                step="0.5"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 pr-6 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
          </div>
        </div>

        {/* Capital events */}
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Capital Events</div>
          {input.events.length === 0 && (
            <div className="text-xs text-gray-400 dark:text-gray-500 italic mb-2">No events — add below</div>
          )}
          {input.events.map((ev) => (
            <EventRow
              key={ev.id}
              event={ev}
              onChange={(e) => updateEvent(ev.id, e)}
              onDelete={() => deleteEvent(ev.id)}
            />
          ))}
          <div className="flex items-center gap-2 mt-2">
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value as CapitalEventType)}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
            >
              {(Object.keys(EVENT_LABELS) as CapitalEventType[]).map((t) => (
                <option key={t} value={t}>{EVENT_LABELS[t]}</option>
              ))}
            </select>
            <button
              onClick={addEvent}
              className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProFormaPanel({ assumptions, currentPrice, onMetricsChange }: ProFormaPanelProps) {
  const [mode, setMode] = useState<"quarterly" | "annual">("annual");
  const [periods, setPeriods] = useState<PeriodInputs[]>(() => makeDefaultPeriods("annual"));
  const [activeTab, setActiveTab] = useState<ProFormaPeriod>("FY");

  // Sync periods when mode changes
  function switchMode(m: "quarterly" | "annual") {
    setMode(m);
    setPeriods(makeDefaultPeriods(m));
    setActiveTab(m === "quarterly" ? "Q1" : "FY");
  }

  const base = useMemo(() => deriveBase(assumptions), [assumptions]);

  const metrics: PeriodMetrics[] = useMemo(() => {
    if (!base) return [];
    const result = computeProForma(base, periods, mode);
    onMetricsChange?.(result);
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, periods, mode]);

  const finalMetrics = metrics[metrics.length - 1] ?? null;

  // "What do you have to believe" — implied FFO growth at current price
  const impliedGrowth = useMemo(() => {
    if (!currentPrice || !base?.ffoPerShare || !finalMetrics) return null;
    // Use current trailing P/FFO multiple as exit multiple assumption
    const impliedMultiple = currentPrice / base.ffoPerShare;
    return impliedGrowthRate(currentPrice, base.ffoPerShare, impliedMultiple, 1);
  }, [currentPrice, base, finalMetrics]);

  function updatePeriod(period: ProFormaPeriod, updated: PeriodInputs) {
    setPeriods(periods.map((p) => (p.period === period ? updated : p)));
  }

  if (!base) {
    return (
      <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Assumptions required.</strong> Fill in at least NOI, Shares Outstanding, Total Debt, and Total Cash in the Assumptions tab before building the pro-forma.
        </div>
      </div>
    );
  }

  const summaryRows: { label: string; base: string; cols: string[] }[] = [
    {
      label: "NOI ($M)",
      base: base.noi.toFixed(1),
      cols: metrics.map((m) => m.noi.toFixed(1)),
    },
    {
      label: "FFO / Share",
      base: `$${base.ffoPerShare.toFixed(2)}`,
      cols: metrics.map((m) => `$${m.ffoPerShare.toFixed(2)}`),
    },
    {
      label: "Cap Rate",
      base: `${((base.noi / base.propertyValue) * 100).toFixed(2)}%`,
      cols: metrics.map((m) => `${m.capRate.toFixed(2)}%`),
    },
    {
      label: "NAV / Share",
      base: `$${((base.propertyValue - (base.totalDebt - base.totalCash)) / base.sharesOutstanding).toFixed(2)}`,
      cols: metrics.map((m) => `$${m.navPerShare.toFixed(2)}`),
    },
    {
      label: "Shares (M)",
      base: base.sharesOutstanding.toFixed(1),
      cols: metrics.map((m) => m.sharesOutstanding.toFixed(1)),
    },
    {
      label: "Total Debt ($M)",
      base: fmtMarketCap(base.totalDebt * 1e6),
      cols: metrics.map((m) => fmtMarketCap(m.totalDebt * 1e6)),
    },
  ];

  const currentTabPeriod = periods.find((p) => p.period === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Pro-Forma Model</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Forward look based on capital events. Feeds Valuation tab.
          </p>
        </div>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
          <button
            onClick={() => switchMode("annual")}
            className={`px-3 py-1.5 transition-colors ${mode === "annual" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50"}`}
          >
            Full Year
          </button>
          <button
            onClick={() => switchMode("quarterly")}
            className={`px-3 py-1.5 transition-colors ${mode === "quarterly" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50"}`}
          >
            By Quarter
          </button>
        </div>
      </div>

      {/* "What do you have to believe" banner */}
      {impliedGrowth !== null && currentPrice && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-blue-800 dark:text-blue-200">
              What you have to believe:
            </span>{" "}
            <span className="text-gray-700 dark:text-gray-300">
              At <span className="font-mono font-semibold">{fmtCurrency(currentPrice)}</span>, the market is implying{" "}
              <span className={`font-semibold font-mono ${impliedGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                {impliedGrowth > 0 ? "+" : ""}{impliedGrowth.toFixed(1)}% FFO growth
              </span>{" "}
              at the current trailing multiple.
            </span>
          </div>
        </div>
      )}

      {/* Period tabs */}
      {mode === "quarterly" && (
        <div className="flex gap-1">
          {(["Q1", "Q2", "Q3", "Q4"] as ProFormaPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setActiveTab(p)}
              className={`text-sm px-4 py-1.5 rounded-lg transition-colors ${activeTab === p ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Period editor */}
      <PeriodCard
        input={currentTabPeriod}
        onChange={(updated) => updatePeriod(currentTabPeriod.period, updated)}
        isQuarterly={mode === "quarterly"}
      />

      {/* Summary table */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Pro-Forma Output</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400">Metric</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">Base (T-12)</th>
                {metrics.map((m) => (
                  <th key={m.period} className="text-right py-2 px-3 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {m.period === "FY" ? "Fwd Year" : m.period}
                  </th>
                ))}
                {metrics.length > 1 && (
                  <th className="text-right py-2 px-3 text-xs font-medium text-purple-600 dark:text-purple-400">
                    Change
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => {
                const baseVal = parseFloat(row.base.replace(/[$%,BM]/g, ""));
                const finalVal = row.cols.length > 0
                  ? parseFloat(row.cols[row.cols.length - 1].replace(/[$%,BM]/g, ""))
                  : null;
                const delta = finalVal !== null && !isNaN(baseVal) && !isNaN(finalVal)
                  ? ((finalVal - baseVal) / Math.abs(baseVal)) * 100
                  : null;

                return (
                  <tr key={row.label} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 text-gray-500 dark:text-gray-400 text-xs">{row.label}</td>
                    <td className="text-right py-2 px-3 font-mono text-gray-700 dark:text-gray-300">{row.base}</td>
                    {row.cols.map((val, i) => (
                      <td key={i} className="text-right py-2 px-3 font-mono font-semibold text-blue-700 dark:text-blue-300">
                        {val}
                      </td>
                    ))}
                    {metrics.length > 1 && delta !== null && (
                      <td className={`text-right py-2 px-3 text-xs font-semibold ${delta > 0 ? "text-emerald-600 dark:text-emerald-400" : delta < 0 ? "text-red-500" : "text-gray-400"}`}>
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
