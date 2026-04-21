"use client";
import { useState, useEffect } from "react";
import { Scenario, Assumptions } from "@/lib/types";
import { fmtCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ScenarioPanelProps {
  currentPrice: number | null;
  assumptions: Assumptions;
  onScenariosChange?: (s: Scenario[]) => void;
}

type ScenarioKey = "Bull" | "Base" | "Bear";

const defaults: Record<ScenarioKey, Omit<Scenario, "impliedValue" | "targetPrice" | "upside" | "totalReturn">> = {
  Bull: { name: "Bull", ffoGrowth: 8, noiGrowth: 5, capRateChange: -25 },
  Base: { name: "Base", ffoGrowth: 4, noiGrowth: 3, capRateChange: 0 },
  Bear: { name: "Bear", ffoGrowth: 0, noiGrowth: -1, capRateChange: 50 },
};

function computeScenario(
  def: typeof defaults[ScenarioKey],
  price: number | null,
  assumptions: Assumptions
): Scenario {
  const ffo = assumptions.ffoPerShare;
  const div = assumptions.affoPerShare && assumptions.payoutRatio
    ? (assumptions.affoPerShare * (assumptions.payoutRatio / 100))
    : null;

  let targetPrice: number | null = null;
  let impliedValue: number | null = null;

  if (ffo && price) {
    const currentMultiple = price / ffo;
    const adjustedMultiple = currentMultiple + (def.capRateChange > 0 ? -1 : def.capRateChange < 0 ? 1 : 0);
    const nextYearFfo = ffo * (1 + def.ffoGrowth / 100);
    targetPrice = nextYearFfo * adjustedMultiple;
    impliedValue = targetPrice;
  }

  const upside = targetPrice && price ? ((targetPrice - price) / price) * 100 : null;
  const divYield = div && price ? (div / price) * 100 : null;
  const totalReturn = upside != null && divYield != null ? upside + divYield : upside;

  return {
    ...def,
    impliedValue,
    targetPrice,
    upside,
    totalReturn,
  };
}

export function ScenarioPanel({ currentPrice, assumptions, onScenariosChange }: ScenarioPanelProps) {
  const [inputs, setInputs] = useState(defaults);

  const scenarios: Scenario[] = (["Bull", "Base", "Bear"] as ScenarioKey[]).map((k) =>
    computeScenario(inputs[k], currentPrice, assumptions)
  );

  useEffect(() => {
    onScenariosChange?.(scenarios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, currentPrice, assumptions]);

  function update(scenario: ScenarioKey, field: string, value: string) {
    setInputs((prev) => ({
      ...prev,
      [scenario]: { ...prev[scenario], [field]: parseFloat(value) || 0 },
    }));
  }

  const cards = [
    { key: "Bull" as ScenarioKey, color: "emerald", icon: TrendingUp, label: "Bull Case" },
    { key: "Base" as ScenarioKey, color: "blue", icon: Minus, label: "Base Case" },
    { key: "Bear" as ScenarioKey, color: "red", icon: TrendingDown, label: "Bear Case" },
  ];

  const colorMap = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-800",
      header: "text-emerald-700 dark:text-emerald-400",
      upside: "text-emerald-600 dark:text-emerald-400",
      ring: "focus:ring-emerald-500",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-800",
      header: "text-blue-700 dark:text-blue-400",
      upside: "text-blue-600 dark:text-blue-400",
      ring: "focus:ring-blue-500",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
      header: "text-red-700 dark:text-red-400",
      upside: "text-red-600 dark:text-red-400",
      ring: "focus:ring-red-500",
    },
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Next-12-Month Scenarios</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Adjust growth and cap rate assumptions per scenario. Target prices require FFO/Share in Assumptions.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ key, color, icon: Icon, label }) => {
          const s = scenarios.find((sc) => sc.name === key)!;
          const c = colorMap[color as keyof typeof colorMap];
          return (
            <div key={key} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
              <div className={`flex items-center gap-2 mb-3 font-semibold ${c.header}`}>
                <Icon className="w-4 h-4" />
                {label}
              </div>
              <div className="space-y-2 mb-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">FFO Growth (%)</label>
                  <input
                    type="number"
                    value={inputs[key].ffoGrowth}
                    onChange={(e) => update(key, "ffoGrowth", e.target.value)}
                    className={`w-full mt-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${c.ring}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">NOI Growth (%)</label>
                  <input
                    type="number"
                    value={inputs[key].noiGrowth}
                    onChange={(e) => update(key, "noiGrowth", e.target.value)}
                    className={`w-full mt-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${c.ring}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">Cap Rate Δ (bps)</label>
                  <input
                    type="number"
                    value={inputs[key].capRateChange}
                    onChange={(e) => update(key, "capRateChange", e.target.value)}
                    className={`w-full mt-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${c.ring}`}
                  />
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Current Price</span>
                  <span className="font-mono text-gray-900 dark:text-white">{fmtCurrency(currentPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Target Price</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {s.targetPrice ? fmtCurrency(s.targetPrice) : <span className="text-xs text-gray-400">set FFO ↑</span>}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Upside/Downside</span>
                  <span className={`font-semibold ${c.upside}`}>
                    {s.upside != null ? `${s.upside > 0 ? "+" : ""}${s.upside.toFixed(1)}%` : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Return</span>
                  <span className={`font-semibold ${c.upside}`}>
                    {s.totalReturn != null ? `${s.totalReturn > 0 ? "+" : ""}${s.totalReturn.toFixed(1)}%` : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
