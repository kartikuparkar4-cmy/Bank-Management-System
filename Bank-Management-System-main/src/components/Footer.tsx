import React from "react";
import { HooBankLogo } from "./HooBankLogo";
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";

export const Footer: React.FC = () => {
  const footerLinks = [
    {
      title: "Useful Links",
      links: ["Content", "How it Works", "Create", "Explore", "Terms & Services"],
    },
    {
      title: "Community",
      links: ["Help Center", "Partners", "Suggestions", "Blog", "Newsletters"],
    },
    {
      title: "Partner",
      links: ["Our Partner", "Become a Partner"],
    },
  ];

  return (
    <footer className="w-full pt-16 pb-10 px-6 sm:px-12 bg-[#00040f] border-t border-white/5" id="footer">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          {/* Logo & Info */}
          <div className="md:col-span-5 flex flex-col items-start">
            <HooBankLogo size="lg" />
            <p className="mt-6 text-sm text-gray-400 max-w-xs leading-relaxed">
              A new way to make the payments easy, reliable and secure.
            </p>
          </div>

          {/* Nav link columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {footerLinks.map((group, index) => (
              <div key={index} className="flex flex-col gap-3.5">
                <h4 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                  {group.title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link, lIndex) => (
                    <li key={lIndex}>
                      <button
                        onClick={() => {}}
                        className="text-xs sm:text-sm text-gray-400 hover:text-[#00f6ff] transition-colors text-left"
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            Copyright © {new Date().getFullYear()} HooBank. All Rights Reserved.
          </p>

          <div className="flex items-center gap-5">
            <button className="p-2 rounded-lg text-gray-400 hover:text-[#00f6ff] hover:bg-white/5 transition-colors cursor-pointer">
              <Instagram className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-gray-400 hover:text-[#00f6ff] hover:bg-white/5 transition-colors cursor-pointer">
              <Facebook className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-gray-400 hover:text-[#00f6ff] hover:bg-white/5 transition-colors cursor-pointer">
              <Twitter className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-gray-400 hover:text-[#00f6ff] hover:bg-white/5 transition-colors cursor-pointer">
              <Linkedin className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
