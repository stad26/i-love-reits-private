"use client";
import { useState } from "react";
import { X, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

interface GuideModalProps {
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-3 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
}

function GlossaryTerm({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{term}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{definition}</p>
    </div>
  );
}

export function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl my-8">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-base font-bold text-gray-900 dark:text-white">Guide</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          <Section title="What is a REIT?">
            <p>
              A REIT — short for Real Estate Investment Trust — is just a company that owns real estate
              and trades on the stock market like any other stock.
            </p>
            <p>
              Instead of buying a building yourself, you buy a small piece of a company that owns hundreds
              of buildings. REITs can own all kinds of real estate — apartment buildings, shopping malls,
              office towers, warehouses, hospitals, senior housing, and more.
            </p>
            <p>
              The best part? REITs are required by law to pay out at least 90% of their taxable income as
              dividends to shareholders. So owning a REIT is a bit like owning a rental property — except
              someone else handles the tenants, the maintenance, and the midnight calls about broken boilers.
            </p>
          </Section>

          <Section title="Metric 1: P/FFO — Price to Funds From Operations">
            <p>
              P/FFO is the REIT version of a P/E ratio — the most common way to compare how expensive
              one REIT is versus another.
            </p>
            <p>
              FFO stands for Funds From Operations. It's basically the REIT's rental income after paying
              its bills, but before accounting for depreciation — which we ignore because real estate
              doesn't actually lose value the way a car or a piece of machinery does. In fact, it usually
              goes up in value over time.
            </p>
            <p>
              Think of it this way: if a REIT earns $1 per share in FFO and its stock trades at $20, the
              P/FFO is 20x. If a similar REIT trades at 15x, the second one is cheaper — all else equal.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Lower P/FFO</strong> = you're paying less for every dollar of earnings.</li>
              <li><strong>Higher P/FFO</strong> = the market expects faster growth, or the asset quality is better.</li>
            </ul>
            <p className="text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-lg px-3 py-2">
              As a rough guide, most REITs trade between 12x and 25x FFO. Above 30x usually means the market
              is pricing in a lot of growth.
            </p>
          </Section>

          <Section title="Metric 2: Implied Cap Rate">
            <p>
              The cap rate is the most important number in real estate. Every real estate investor uses it
              — whether they own one rental house or a hundred office buildings.
            </p>
            <p>
              <strong>Cap rate = the annual rent a property generates divided by what you paid for it.</strong>
            </p>
            <p>
              If you buy a building for $1,000,000 and it generates $70,000 of net rent per year, your cap
              rate is 7%.
            </p>
            <p>
              For a REIT, we do the same math — but instead of one building, we use the entire portfolio.
              We take the total NOI (net operating income — basically all the rent, minus operating costs)
              and divide it by the enterprise value (what the whole company is worth, including its debt).
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Higher implied cap rate</strong> = you're getting more income per dollar of value. Can mean the stock is cheap, or the market thinks the assets are lower quality or riskier.</li>
              <li><strong>Lower implied cap rate</strong> = the market is paying a premium, usually because it expects NOI to grow significantly.</li>
            </ul>
            <p className="text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-lg px-3 py-2">
              As a rough guide: Trophy assets in gateway cities: 4–5% · Mid-quality in good markets: 6–7% · Value-add or operationally intensive: 7–9%
            </p>
          </Section>

          <Section title="Metric 3: NAV per Share">
            <p>
              NAV stands for Net Asset Value. It answers one simple question: if we sold every building this
              REIT owns at today's market prices, paid off all the debt, and divided what was left by the
              number of shares — what would each share be worth?
            </p>
            <p>It's the closest thing to an appraisal value for a REIT.</p>
            <p className="font-medium text-gray-700 dark:text-gray-200">Here's the math in plain English:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Take all the rent the buildings generate (NOI)</li>
              <li>Divide by a cap rate to get what the buildings are worth — if a building earns $70,000 at a 7% cap rate, it's worth $1,000,000</li>
              <li>Subtract all the debt the company owes</li>
              <li>Add back any cash sitting on the balance sheet</li>
              <li>Subtract the value of any preferred stock — which gets paid back before common shareholders</li>
              <li>Divide by the number of shares</li>
            </ol>
            <p>
              If the stock price is <strong>below NAV</strong>, the REIT is trading at a discount — you're
              buying $1 of real estate for less than $1. If it's <strong>above NAV</strong>, you're paying
              a premium — usually justified by a great management team, a growing portfolio, or both.
            </p>
            <p className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg px-3 py-2">
              The cap rate you choose is your single biggest assumption. That's why we show you a range —
              small changes in cap rate can move NAV per share significantly.
            </p>
          </Section>

          <Section title="A Note on Cap Rates">
            <p>We don't auto-fill the cap rate for you. Here's why:</p>
            <p>
              The right cap rate depends on the type of real estate, the location, the quality of the tenants,
              and current market conditions. A cap rate that's right for a senior housing portfolio in the
              Midwest is different from one for a trophy office tower in Manhattan.
            </p>
            <p>
              We trust you to know your market. Use recent transaction data, broker opinions, or comparable
              public REIT implied cap rates as your guide. The sensitivity table will show you how much your
              NAV changes if you're off by 50 or 100 basis points — which helps you understand how much your
              conclusion depends on that single assumption.
            </p>
          </Section>

          <Section title="How to Use This Tool">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Enter the company name or ticker in the search bar</li>
              <li>Fill in the financial inputs — we auto-fill what we can from Yahoo Finance and tell you exactly where to find each one from the earnings press release or supplemental package</li>
              <li>Enter your cap rate assumption for the NAV calculation</li>
              <li>The tool shows P/FFO, Implied Cap Rate, and NAV per share — plus sensitivity tables so you can stress-test your assumptions</li>
            </ol>
            <p>
              You can manually override any auto-filled number — for example, if the most recent quarter was
              unusually strong or weak and you want to use a normalized figure instead.
            </p>
          </Section>

          {/* Glossary */}
          <Section title="Glossary">
            <div>
              <GlossaryTerm
                term="NOI — Net Operating Income"
                definition="The rent a property generates after paying operating expenses like maintenance, insurance, and property taxes — but before paying interest on debt or income taxes. Think of it as the building's gross profit."
              />
              <GlossaryTerm
                term="FFO — Funds From Operations"
                definition="The REIT equivalent of earnings per share. It starts with net income and adds back depreciation, because real estate doesn't depreciate the way accounting rules suggest it does."
              />
              <GlossaryTerm
                term="AFFO — Adjusted FFO"
                definition="FFO minus the cost of maintaining the properties — things like painting, replacing roofs, and upgrading HVAC systems. It's a more conservative measure of what a REIT actually earns in cash."
              />
              <GlossaryTerm
                term="Enterprise Value"
                definition="The total price tag of the company — not just the stock market value, but also including all the debt it owes, minus any cash it holds. It's what you'd actually have to pay to own the whole company outright."
              />
              <GlossaryTerm
                term="Cap Rate — Capitalization Rate"
                definition="Annual NOI divided by property value. The higher the cap rate, the more income you're getting per dollar spent. Used by every real estate investor to compare deals and value properties."
              />
              <GlossaryTerm
                term="NAV — Net Asset Value"
                definition="What the real estate is worth on paper if you sold everything, paid off the debt, and divided what's left among shareholders. The closest thing to an appraisal value for a REIT stock."
              />
              <GlossaryTerm
                term="Preferred Equity"
                definition="A class of ownership that gets paid back before common shareholders if the company is sold or wound down. Like a first-lien lender but with an equity label. Always subtract it when calculating what common shareholders are actually worth."
              />
              <GlossaryTerm
                term="OP Units — Operating Partnership Units"
                definition="A special type of ownership interest in a REIT's operating partnership, often held by the original property owners who contributed buildings to the REIT in exchange for units instead of cash. They're economically equivalent to common shares and should always be included in your share count."
              />
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
