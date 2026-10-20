import React, { useState } from "react";
import { Scan, TrendingUp, ChevronDown, Check } from "lucide-react";

interface CardDealsProps {
  onGetStarted: () => void;
}

export const CardDeals: React.FC<CardDealsProps> = ({ onGetStarted }) => {
  const [selectedMonth, setSelectedMonth] = useState("Mar");
  const [activePaymentMethod, setActivePaymentMethod] = useState("VISA");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

  return (
    <section className="w-full py-16 sm:py-24 px-6 sm:px-12 relative overflow-hidden" id="card-deals">
      {/* Ambient background ring */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-[#00f6ff]/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column */}
        <div className="lg:col-span-6 flex flex-col items-start">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Find a better card deal <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#33bbcf] to-[#def9fa] bg-clip-text text-transparent">
              in few easy steps.
            </span>
          </h2>

          <p className="mt-6 text-base sm:text-lg text-gray-400 font-normal leading-relaxed max-w-lg">
            Arcu tortor, purus in mattis at sed integer faucibus. Aliquet quis aliquet eget mauris tortor.c Aliquet ultrices ac, ametau.
          </p>

          <button
            onClick={onGetStarted}
            className="mt-8 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-semibold text-base shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 transition-all cursor-pointer"
            id="card-deals-get-started-btn"
          >
            Get Started
          </button>
        </div>

        {/* Right Column: Interactive Widgets */}
        <div className="lg:col-span-6 relative flex flex-col items-center">
          <div className="relative w-full max-w-lg grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Scan Credit Cards Card */}
            <div className="sm:col-span-6 rounded-2xl bg-[#14101d]/90 border border-white/10 p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#00f6ff]/10 border border-[#00f6ff]/30 flex items-center justify-center text-[#00f6ff] mb-3">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">Scan Credit Cards</h4>
                <p className="mt-1 text-xs text-gray-400">Scan your credit card in 4 minutes.</p>
              </div>
            </div>

            {/* Online Analysis Card */}
            <div className="sm:col-span-6 sm:row-span-2 rounded-2xl bg-[#14101d]/90 border border-white/10 p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Online Analysis</h4>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                  <span>1 Month</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              <div className="my-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400">Income</span>
                  <p className="text-sm font-bold text-[#00f6ff]">$ 2,334,67</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400">Expenses</span>
                  <p className="text-sm font-bold text-sky-400">$ 5.31M</p>
                </div>
              </div>

              {/* Interactive Smooth Curve SVG */}
              <div className="w-full my-2">
                <svg viewBox="0 0 200 60" className="w-full h-16 overflow-visible">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#33bbcf" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#00f6ff" stopOpacity="1" />
                      <stop offset="100%" stopColor="#def9fa" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,35 C 30,32 50,55 80,48 C 110,40 130,58 160,30 C 180,15 190,32 200,20"
                    fill="none"
                    stroke="url(#chartGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="80" cy="48" r="4" fill="#00f6ff" className="animate-ping" />
                  <circle cx="80" cy="48" r="3" fill="#ffffff" />
                </svg>
              </div>

              {/* Month Selector Pills */}
              <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 pt-2 border-t border-white/5">
                {months.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-1.5 py-0.5 rounded-md transition-all ${
                      selectedMonth === m
                        ? "bg-[#00f6ff] text-black font-bold shadow-[0_0_8px_#00f6ff]"
                        : "hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Pay Method Card */}
            <div className="sm:col-span-6 rounded-2xl bg-[#14101d]/90 border border-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-white">Pay Method</h4>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {/* PayPal */}
                <button
                  onClick={() => setActivePaymentMethod("PayPal")}
                  className={`p-2 rounded-xl bg-white flex items-center justify-center transition-all ${
                    activePaymentMethod === "PayPal" ? "ring-2 ring-[#00f6ff] scale-105" : "opacity-90 hover:opacity-100"
                  }`}
                >
                  <span className="font-extrabold text-[#003087] text-xs italic">P</span>
                </button>

                {/* Apple Pay */}
                <button
                  onClick={() => setActivePaymentMethod("Apple")}
                  className={`p-2 rounded-xl bg-white flex items-center justify-center transition-all ${
                    activePaymentMethod === "Apple" ? "ring-2 ring-[#00f6ff] scale-105" : "opacity-90 hover:opacity-100"
                  }`}
                >
                  <span className="text-black text-xs font-bold"></span>
                </button>

                {/* VISA */}
                <button
                  onClick={() => setActivePaymentMethod("VISA")}
                  className={`p-2 rounded-xl bg-white flex items-center justify-center transition-all ${
                    activePaymentMethod === "VISA" ? "ring-2 ring-[#00f6ff] scale-105" : "opacity-90 hover:opacity-100"
                  }`}
                >
                  <span className="text-[#1a1f71] text-[10px] font-black italic tracking-tighter">VISA</span>
                </button>

                {/* Shopify */}
                <button
                  onClick={() => setActivePaymentMethod("Shopify")}
                  className={`p-2 rounded-xl bg-white flex items-center justify-center transition-all ${
                    activePaymentMethod === "Shopify" ? "ring-2 ring-[#00f6ff] scale-105" : "opacity-90 hover:opacity-100"
                  }`}
                >
                  <span className="text-[#95bf47] text-xs font-black">S</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
