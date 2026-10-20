import React from "react";
import { ArrowUpRight, Percent, Sparkles, CreditCard, ShieldCheck, Zap } from "lucide-react";
import { HooBankLogo } from "./HooBankLogo";

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative w-full pt-10 pb-20 px-6 sm:px-12 overflow-hidden" id="hero">
      {/* Background ambient neon glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#00f6ff]/15 via-[#33bbcf]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-white/5 via-[#00f6ff]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headline & Value Proposition */}
        <div className="lg:col-span-7 flex flex-col items-start z-10">
          {/* Discount Pill Badge */}
          <div
            className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-white/10 mb-8 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            id="hero-discount-pill"
          >
            <div className="w-5 h-5 rounded-full bg-[#33bbcf]/20 flex items-center justify-center text-[#33bbcf]">
              <Percent className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs sm:text-sm font-normal text-gray-300">
              <span className="text-white font-semibold">20%</span> DISCOUNT FOR{" "}
              <span className="text-white font-semibold">1 MONTH</span> ACCOUNT
            </p>
          </div>

          {/* Large Display Typography with Circular Get Started button */}
          <div className="relative w-full">
            <div className="flex items-center justify-between">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.15]">
                The Next
              </h1>

              {/* Circular "Get Started" Badge Button */}
              <button
                onClick={onGetStarted}
                className="group relative flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[2px] bg-gradient-to-tr from-[#33bbcf] via-[#00f6ff] to-[#def9fa] hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(0,246,255,0.25)] cursor-pointer"
                id="hero-get-started-circle"
              >
                <div className="w-full h-full rounded-full bg-[#00040f] flex flex-col items-center justify-center p-3 text-left transition-all group-hover:bg-[#00040f]/90">
                  <div className="flex items-center gap-1">
                    <span className="text-sm sm:text-base font-semibold bg-gradient-to-r from-[#33bbcf] to-[#def9fa] bg-clip-text text-transparent">
                      Get
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-[#00f6ff] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold bg-gradient-to-r from-[#33bbcf] to-[#def9fa] bg-clip-text text-transparent">
                    Started
                  </span>
                </div>
              </button>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-[#33bbcf] via-[#00f6ff] to-[#def9fa] bg-clip-text text-transparent leading-[1.15] mt-1 sm:mt-2">
              Generation
            </h1>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.15] mt-1 sm:mt-2">
              Payment Method
            </h1>
          </div>

          <p className="mt-8 text-base sm:text-lg text-gray-400 font-normal leading-relaxed max-w-xl">
            Our team of experts uses a methodology to identify the credit cards most likely to fit your needs. We examine annual percentage rates, annual fees.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-base shadow-[0_0_25px_rgba(0,246,255,0.4)] hover:brightness-110 hover:shadow-[0_0_35px_rgba(0,246,255,0.6)] transition-all cursor-pointer"
              id="hero-cta-btn"
            >
              Get Started Now
            </button>
            {/* Security badge - hidden */}
            {false && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
                <ShieldCheck className="w-4 h-4 text-[#00f6ff]" />
                <span>Spring Boot 3.5 & JWT Secured</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 3D Visual Cards & Cybernetic Payment Graphic */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[440px] sm:min-h-[500px]">
          {/* Glowing background circles */}
          <div className="absolute w-72 h-72 rounded-full border border-[#00f6ff]/20 animate-pulse pointer-events-none" />
          <div className="absolute w-96 h-96 rounded-full border border-white/5 pointer-events-none" />

          {/* Floating Cyan Spheres */}
          <div className="absolute -top-4 right-12 w-14 h-14 rounded-full bg-gradient-to-br from-[#def9fa] via-[#00f6ff] to-[#33bbcf] shadow-[0_0_25px_#00f6ff] opacity-90 animate-bounce duration-1000" />
          <div className="absolute bottom-10 left-4 w-9 h-9 rounded-full bg-gradient-to-br from-[#def9fa] via-[#00f6ff] to-[#0a4650] shadow-[0_0_15px_#00f6ff] opacity-80" />
          <div className="absolute top-1/2 -left-6 w-6 h-6 rounded-full bg-[#00f6ff] shadow-[0_0_10px_#00f6ff] opacity-75" />

          {/* Layered Glassmorphic Credit Cards Stacking */}
          <div className="relative w-full max-w-sm flex flex-col items-center">
            {/* Card 3 (Bottom Layer) */}
            <div className="w-[88%] h-44 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-md transform -rotate-12 translate-y-12 opacity-40 shadow-2xl transition-transform hover:-rotate-10" />

            {/* Card 2 (Middle Layer) */}
            <div className="w-[94%] h-48 rounded-2xl bg-gradient-to-br from-[#14101d] via-[#1b233a] to-[#0d1f2d] border border-white/20 backdrop-blur-xl transform -rotate-6 translate-y-6 opacity-70 shadow-2xl transition-transform hover:-rotate-4" />

            {/* Card 1 (Top Hero Glass Card) */}
            <div className="relative w-full h-56 rounded-2xl bg-gradient-to-tr from-[#11101d]/90 via-[#1a233e]/90 to-[#0e2738]/90 border border-[#00f6ff]/40 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(0,246,255,0.25)] backdrop-blur-2xl transform rotate-0 hover:scale-105 transition-all duration-300 z-10 flex flex-col justify-between">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 p-0.5 shadow-md flex items-center justify-center">
                    <div className="w-full h-full border border-amber-600/40 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                      <div className="bg-amber-500/50 rounded-xs" />
                      <div className="bg-amber-500/50 rounded-xs" />
                      <div className="bg-amber-500/50 rounded-xs" />
                      <div className="bg-amber-500/50 rounded-xs" />
                    </div>
                  </div>
                  <Zap className="w-4 h-4 text-[#00f6ff]" />
                </div>
                <HooBankLogo size="sm" />
              </div>

              {/* Masked Card Number */}
              <div className="my-2">
                <p className="font-mono text-base sm:text-lg tracking-widest text-white drop-shadow-md">
                  1833 7163 3892 1028
                </p>
              </div>

              {/* Card Footer Details */}
              <div className="flex items-end justify-between text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Card Holder</p>
                  <p className="font-semibold text-white tracking-wide mt-0.5">WAK SUNARI</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Expires</p>
                  <p className="font-semibold text-white tracking-wide mt-0.5">08/2028</p>
                </div>
                <div className="flex items-center -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-red-500/80 backdrop-blur-sm" />
                  <div className="w-7 h-7 rounded-full bg-amber-400/80 backdrop-blur-sm" />
                </div>
              </div>
            </div>

            {/* Cybernetic Cyber Hand Visual Base Effect */}
            <div className="w-full mt-4 flex items-center justify-between px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-xs text-gray-300">
              <span className="flex items-center gap-1.5 text-[#00f6ff] font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Instant Contactless
              </span>
              <span className="font-mono text-gray-400">Zero Transaction Fee</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
