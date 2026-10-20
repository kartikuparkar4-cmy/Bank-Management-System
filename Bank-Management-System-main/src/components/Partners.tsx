import React from "react";

export const Partners: React.FC = () => {
  const partners = [
    {
      name: "airbnb",
      logo: (
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-gray-400 group-hover:text-white transition-colors">
          airbnb
        </span>
      ),
    },
    {
      name: "BINANCE",
      logo: (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-xs rotate-45 border-2 border-yellow-500/80 bg-yellow-500/30" />
          <span className="text-xl sm:text-2xl font-black tracking-wider text-gray-400 group-hover:text-white transition-colors">
            BINANCE
          </span>
        </div>
      ),
    },
    {
      name: "coinbase",
      logo: (
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-400 group-hover:text-white transition-colors">
          coinbase
        </span>
      ),
    },
    {
      name: "Dropbox",
      logo: (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
            <div className="bg-blue-400/80 rounded-xs" />
            <div className="bg-blue-400/80 rounded-xs" />
            <div className="bg-blue-400/80 rounded-xs" />
            <div className="bg-blue-400/80 rounded-xs" />
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-gray-400 group-hover:text-white transition-colors">
            Dropbox
          </span>
        </div>
      ),
    },
  ];

  return (
    <section className="w-full py-12 px-6 sm:px-12" id="partners">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-8 md:gap-12 opacity-80 hover:opacity-100 transition-opacity">
        {partners.map((partner, index) => (
          <div
            key={index}
            className="group flex items-center justify-center p-4 hover:scale-105 transition-transform duration-200 cursor-pointer"
          >
            {partner.logo}
          </div>
        ))}
      </div>
    </section>
  );
};
