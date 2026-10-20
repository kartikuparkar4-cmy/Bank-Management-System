import React from "react";
import { Star, ShieldCheck, Send } from "lucide-react";

interface BusinessFeaturesProps {
  onGetStarted: () => void;
}

export const BusinessFeatures: React.FC<BusinessFeaturesProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: <Star className="w-6 h-6 text-[#00f6ff]" />,
      title: "Rewards",
      description: "The best credit cards offer some tantalizing combinations of promotions and prizes",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#00f6ff]" />,
      title: "100% Secured",
      description: "We take proactive steps make sure your information and transactions are secure.",
    },
    {
      icon: <Send className="w-6 h-6 text-[#00f6ff]" />,
      title: "Balance Transfer",
      description: "A balance transfer credit card can save you a lot of money in interest charges.",
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-6 sm:px-12" id="features">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column */}
        <div className="lg:col-span-6 flex flex-col items-start">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            You do the business, <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#33bbcf] to-[#def9fa] bg-clip-text text-transparent">
              we'll handle the money.
            </span>
          </h2>

          <p className="mt-6 text-base sm:text-lg text-gray-400 font-normal leading-relaxed max-w-lg">
            With the right credit card, you can improve your financial life by building credit, earning rewards and saving money. But with hundreds of credit cards on the market.
          </p>

          <button
            onClick={onGetStarted}
            className="mt-8 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-semibold text-base shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 transition-all cursor-pointer"
            id="features-get-started-btn"
          >
            Get Started
          </button>
        </div>

        {/* Right Column: Feature Cards */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group flex items-start gap-5 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-white/[0.03] to-transparent hover:from-white/[0.07] hover:to-white/[0.02] border border-white/5 hover:border-[#00f6ff]/30 transition-all duration-300 backdrop-blur-sm cursor-pointer shadow-lg hover:shadow-[0_10px_30px_rgba(0,246,255,0.1)]"
              id={`feature-card-${index}`}
            >
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-full bg-[#092e3b]/80 border border-[#00f6ff]/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_15px_#00f6ff] transition-all">
                {feature.icon}
              </div>

              {/* Content */}
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-[#def9fa] transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
