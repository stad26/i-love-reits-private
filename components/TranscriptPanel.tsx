"use client";
import { useRef, useState } from "react";
import { Upload, FileText, Loader2, AlertCircle, X } from "lucide-react";

interface ParsedSnapshot {
  header: string;
  sections: { title: string; content: string }[];
}

function parseSnapshot(raw: string): ParsedSnapshot {
  const lines = raw.split("\n");
  const header = lines[0]?.trim() ?? "";
  const sections: { title: string; content: string }[] = [];
  let current: { title: string; lines: string[] } | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const sectionMatch = line.match(/^(\d+\.\s+.+)$/);
    if (sectionMatch) {
      if (current) sections.push({ title: current.title, content: current.lines.join("\n").trim() });
      current = { title: sectionMatch[1], lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push({ title: current.title, content: current.lines.join("\n").trim() });

  return { header, sections };
}

function SectionCard({ title, content }: { title: string; content: string }) {
  const lines = content.split("\n").filter((l) => l.trim());

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2.5">
      <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">{title}</p>
      <div className="space-y-0.5">
        {lines.map((line, i) => {
          if (line.trim().startsWith("-")) {
            return (
              <div key={i} className="flex gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <span className="text-blue-400 flex-shrink-0">•</span>
                <span>{line.replace(/^-\s*/, "")}</span>
              </div>
            );
          }
          if (line.includes(":") && !line.trim().startsWith("(")) {
            const colonIdx = line.indexOf(":");
            const label = line.slice(0, colonIdx);
            const val = line.slice(colonIdx + 1).trim();
            return (
              <div key={i} className="flex gap-1 text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">{label}:</span>
                <span className="text-gray-700 dark:text-gray-300">{val || "—"}</span>
              </div>
            );
          }
          return (
            <p key={i} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              {line.replace(/^\(|\)$/g, "")}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export function TranscriptPanel({ ticker }: { ticker: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(f: File) {
    const ok =
      f.type === "application/pdf" || f.name.endsWith(".pdf") ||
      f.type === "text/plain" || f.name.endsWith(".txt");
    if (!ok) { setError("Only PDF or TXT files are supported."); return; }
    setFile(f);
    setResult(null);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/analyze-transcript", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const parsed = result ? parseSnapshot(result) : null;

  return (
    <div className="space-y-2">
      {/* Drop zone — shown when no file and no result */}
      {!file && !result && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all"
        >
          <Upload className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto mb-1.5" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Drop transcript or click to browse</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">PDF or TXT</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {/* File selected */}
      {file && !result && !loading && (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{file.name}</span>
          <button onClick={clear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Analyze button */}
      {file && !result && (
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
        >
          {loading
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing…</>
            : "Analyze Transcript"}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {parsed && (
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-snug">{parsed.header}</p>
            <button onClick={clear} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-0.5 flex-shrink-0">
              <X className="w-2.5 h-2.5" /> Clear
            </button>
          </div>
          {parsed.sections.map((s) => (
            <SectionCard key={s.title} title={s.title} content={s.content} />
          ))}
        </div>
      )}
    </div>
  );
}
