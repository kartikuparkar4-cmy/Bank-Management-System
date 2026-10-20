import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { PublicStats } from "../types";

export const Stats: React.FC = () => {
  const [stats, setStats] = useState<PublicStats>({
    uptime: "available",
    secure: true,
    currency: "USD",
    activeUsers: "3800+",
    trustedCompanies: "230+",
    totalTransactionVolume: "$230M+",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.stats();
        setStats(data);
      } catch {
        // Fallback default stats matching UI design
      }
    };
    fetchStats();
  }, []);

  const statItems = [
    { value: stats.activeUsers, label: "USER ACTIVE" },
    { value: stats.trustedCompanies, label: "TRUSTED BY COMPANY" },
    { value: stats.totalTransactionVolume, label: "TRANSACTION" },
  ];

  return (
    <section className="w-full py-8 px-6 sm:px-12 my-6" id="stats">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6 md:gap-0 bg-white/[0.02] border border-white/5 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        {statItems.map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-[240px] justify-center md:justify-start">
              <h4 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                {item.value}
              </h4>
              <p className="text-xs sm:text-sm font-medium tracking-wider uppercase bg-gradient-to-r from-[#33bbcf] to-[#def9fa] bg-clip-text text-transparent">
                {item.label}
              </p>
            </div>
            {index < statItems.length - 1 && (
              <div className="hidden lg:block w-[1px] h-12 bg-white/10 mx-6" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};
