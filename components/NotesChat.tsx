"use client";
import { useState, useEffect, useRef } from "react";
import { loadNotes, saveNotes } from "@/lib/utils";
import { Send, StickyNote } from "lucide-react";
import { Assumptions } from "@/lib/types";
import { getREITInfo } from "@/lib/reits";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface NotesChatProps {
  ticker: string;
  assumptions: Assumptions;
  currentPrice: number | null;
}

export function NotesChat({ ticker, assumptions, currentPrice }: NotesChatProps) {
  const [notes, setNotes] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"chat" | "notes">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const info = getREITInfo(ticker);

  useEffect(() => {
    setNotes(loadNotes(ticker));
    setMessages([]);
  }, [ticker]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: { ticker, name: info?.name, sector: info?.sector, price: currentPrice, assumptions },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply ?? "Sorry, no response." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Error connecting to Claude. Check your API key." }]);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Notes & Chat</h3>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
          <button
            onClick={() => setTab("chat")}
            className={`px-3 py-1 transition-colors ${tab === "chat" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            Chat
          </button>
          <button
            onClick={() => setTab("notes")}
            className={`px-3 py-1 transition-colors ${tab === "notes" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            Notes
          </button>
        </div>
      </div>

      {tab === "chat" && (
        <div className="flex flex-col h-72 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50">
            {messages.length === 0 && (
              <div className="text-center text-xs text-gray-400 dark:text-gray-500 pt-6">
                Ask anything about {ticker} — valuation, assumptions, risks, comparisons.
                <div className="mt-3 space-y-1">
                  {[
                    `Why does ${ticker} trade at its current multiple?`,
                    "What happens if cap rates widen 50bps?",
                    "What are the key risks to watch?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="block w-full text-left text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      → {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] text-xs rounded-xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-400 animate-pulse">Claude is thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="flex gap-2 p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={`Ask about ${ticker}...`}
              className="flex-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-1.5 rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Private notes for {ticker} — saved locally</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              saveNotes(ticker, e.target.value);
            }}
            placeholder={`Jot down thoughts on ${ticker}...\n\nExamples:\n- "I think rent growth guidance is too aggressive"\n- "Watch Q3 earnings for NOI update"\n- "Compares favorably to peers on P/AFFO"`}
            className="w-full h-56 p-3 text-xs bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
