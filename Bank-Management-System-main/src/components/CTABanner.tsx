import React from "react";

interface CTABannerProps {
  onGetStarted: () => void;
}

export const CTABanner: React.FC<CTABannerProps> = ({ onGetStarted }) => {
  return (
    <section className="w-full py-12 px-6 sm:px-12 my-8" id="cta-banner">
      <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-white/[0.02] border border-white/10 p-8 sm:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#00f6ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-start max-w-xl z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Let's try our service now!
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 font-normal leading-relaxed">
            Everything you need to accept card payments and grow your business anywhere on the planet.
          </p>
        </div>

        <div className="flex items-center z-10 flex-shrink-0">
          <button
            onClick={onGetStarted}
            className="px-8 sm:px-10 py-4 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-base shadow-[0_0_25px_rgba(0,246,255,0.4)] hover:brightness-110 hover:shadow-[0_0_35px_rgba(0,246,255,0.6)] transition-all cursor-pointer"
            id="cta-get-started-btn"
          >
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
};
