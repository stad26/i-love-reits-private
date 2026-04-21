"use client";
import { useState } from "react";

const DOGS = [
  { emoji: "🐶", fact: "Dogs can smell your feelings. Your portfolio anxiety is not a secret." },
  { emoji: "🐕", fact: "A dog named Gidget was the face of Taco Bell. She understood brand real estate." },
  { emoji: "🦮", fact: "Labrador Retrievers are the most popular dog breed in the US. Diversification works." },
  { emoji: "🐩", fact: "Poodles are actually one of the smartest dog breeds. Smart money, indeed." },
  { emoji: "🐕‍🦺", fact: "Dogs dream. Sometimes about chasing squirrels. Sometimes about cap rate compression." },
  { emoji: "🦴", fact: "A dog's nose print is unique, like a fingerprint. Or like a good investment thesis." },
  { emoji: "🐾", fact: "Dogs can learn up to 250 words. They've never learned 'overvalued' — they love unconditionally." },
  { emoji: "🌭", fact: "A Dachshund was once given a hot dog for a commercial. Method acting at its finest." },
];

export function FunWidget() {
  const [current, setCurrent] = useState(() => Math.floor(Math.random() * DOGS.length));

  function next() {
    setCurrent((c) => (c + 1) % DOGS.length);
  }

  const dog = DOGS[current];

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
      <span className="text-3xl select-none">{dog.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Break time</div>
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{dog.fact}</p>
      </div>
      <button
        onClick={next}
        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors flex-shrink-0 font-medium"
      >
        Next →
      </button>
    </div>
  );
}
