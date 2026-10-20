import React from "react";
import { CurrencyConverter } from "./CurrencyConverter";
import { Globe2, ShieldCheck, Zap, Lock, ArrowUpRight } from "lucide-react";

interface CurrencyExchangeSectionProps {
  onTransfer: (details: {
    sourceAmount: number;
    sourceCurrency: string;
    targetAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    description: string;
  }) => void;
}

export const CurrencyExchangeSection: React.FC<CurrencyExchangeSectionProps> = ({
  onTransfer,
}) => {
  return (
    <section className="w-full py-16 sm:py-20 px-6 sm:px-12 relative overflow-hidden" id="exchange">
      {/* Background ambient lighting */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#00f6ff]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-10 bottom-10 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#00f6ff] mb-4">
              <Globe2 className="w-3.5 h-3.5" />
              <span>Global Payment Infrastructure</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Real-Time Currency Exchange <br />
              <span className="bg-gradient-to-r from-[#33bbcf] to-[#def9fa] bg-clip-text text-transparent">
                With Zero Hidden Markups
              </span>
            </h2>
          </div>

          <div className="max-w-md flex flex-col gap-4">
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              Calculate international payments instantly with live interbank exchange rates. Save up to 8x compared to traditional retail banks with our transparent 0.25% flat fee structure.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Mid-Market Rates
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Instant Rail Routing
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                <Lock className="w-3.5 h-3.5 text-[#00f6ff]" />
                2h Rate Guarantee
              </span>
            </div>
          </div>
        </div>

        {/* Currency Converter Component */}
        <div className="w-full">
          <CurrencyConverter
            idPrefix="home-fx"
            ctaText="Send International Payment"
            onApplyTransfer={onTransfer}
          />
        </div>
      </div>
    </section>
  );
};
