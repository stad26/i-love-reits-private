import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function fmt(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(decimals);
}

export function fmtPct(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

export function fmtPctRaw(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(decimals)}%`;
}

export function fmtCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `$${value.toFixed(2)}`;
}

export function fmtMarketCap(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

export function fmtMultiple(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}x`;
}

export function colorForChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-gray-400";
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

export function colorForUpside(value: number | null | undefined): string {
  if (value === null || value === undefined) return "text-gray-400";
  if (value > 10) return "text-emerald-400";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Storage helpers (localStorage)
export function loadNotes(ticker: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(`notes_${ticker}`) ?? "";
}

export function saveNotes(ticker: string, text: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`notes_${ticker}`, text);
}

export function loadAssumptions(ticker: string) {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`assumptions_${ticker}`);
  return raw ? JSON.parse(raw) : null;
}

export function saveAssumptions(ticker: string, data: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`assumptions_${ticker}`, JSON.stringify(data));
}
