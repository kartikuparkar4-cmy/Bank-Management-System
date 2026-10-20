import React from "react";

interface HooBankLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const HooBankLogo: React.FC<HooBankLogoProps> = ({ className = "", size = "md" }) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-3 select-none cursor-pointer ${className}`} id="hoobank-logo">
      <div className={`relative flex items-center justify-center ${iconSizes[size]}`}>
        {/* Outer glowing gradient arc */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#33bbcf] via-[#00f6ff] to-[#def9fa] p-[2.5px] shadow-[0_0_15px_rgba(0,246,255,0.4)]">
          <div className="w-full h-full bg-[#00040f] rounded-full flex items-center justify-center">
            {/* Inner cyan orb */}
            <div className="w-2/5 h-2/5 rounded-full bg-gradient-to-br from-[#00f6ff] to-[#33bbcf] shadow-[0_0_8px_#00f6ff]" />
          </div>
        </div>
        {/* Crescent accent */}
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#def9fa] blur-[0.5px]" />
      </div>
      <span className={`font-bold tracking-tight font-['Poppins'] ${textSizes[size]}`}>
        <span className="text-white">Hoo</span>
        <span className="bg-gradient-to-r from-[#33bbcf] to-[#def9fa] bg-clip-text text-transparent">Bank</span>
      </span>
    </div>
  );
};
