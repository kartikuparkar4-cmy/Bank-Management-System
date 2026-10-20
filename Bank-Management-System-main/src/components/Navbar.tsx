import React, { useState, useEffect, useRef } from "react";
import { HooBankLogo } from "./HooBankLogo";
import { api, isLoggedIn, getCurrentUser, clearSession } from "../lib/api";
import { PublicHealth } from "../types";
import { LayoutDashboard, LogIn, LogOut, Activity, Menu, X, ShieldCheck, User, Mail, ChevronDown } from "lucide-react";

interface NavbarProps {
  onOpenAuth: (mode: "login" | "register") => void;
  onToggleDashboard: () => void;
  isDashboardOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onToggleDashboard, isDashboardOpen }) => {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [user, setUser] = useState(getCurrentUser());
  const [health, setHealth] = useState<PublicHealth | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkStatus = async () => {
    try {
      const h = await api.health();
      setHealth(h);
    } catch {
      setHealth(null);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);

    const handleAuthChange = () => {
      setLoggedIn(isLoggedIn());
      setUser(getCurrentUser());
    };

    window.addEventListener("bank_auth_change", handleAuthChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener("bank_auth_change", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    clearSession();
    if (isDashboardOpen) {
      onToggleDashboard();
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (isDashboardOpen) {
      onToggleDashboard();
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="w-full sticky top-0 z-40 bg-[#00040f]/85 backdrop-blur-md border-b border-white/5 py-4 px-6 sm:px-12 transition-all" id="navbar">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div onClick={() => isDashboardOpen && onToggleDashboard()}>
          <HooBankLogo />
        </div>

        {/* Desktop Nav Links */}
        {!isDashboardOpen && (
          <div className="hidden md:flex items-center gap-10 text-[15px] font-normal text-gray-300">
            <button
              onClick={() => scrollToSection("hero")}
              className="hover:text-[#def9fa] transition-colors cursor-pointer text-white font-medium"
              id="nav-home-btn"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="hover:text-[#def9fa] transition-colors cursor-pointer text-gray-300 hover:text-white"
              id="nav-features-btn"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("product")}
              className="hover:text-[#def9fa] transition-colors cursor-pointer text-gray-300 hover:text-white"
              id="nav-product-btn"
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection("exchange")}
              className="hover:text-[#def9fa] transition-colors cursor-pointer text-gray-300 hover:text-white"
              id="nav-exchange-btn"
            >
              Exchange
            </button>
            <button
              onClick={() => scrollToSection("clients")}
              className="hover:text-[#def9fa] transition-colors cursor-pointer text-gray-300 hover:text-white"
              id="nav-clients-btn"
            >
              Clients
            </button>
          </div>
        )}

        {/* Right action block */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Backend Status indicator */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400"
            title="Spring REST API Sync Status"
            id="backend-health-badge"
          >
            <span className={`w-2 h-2 rounded-full ${health ? "bg-[#00f6ff] shadow-[0_0_8px_#00f6ff]" : "bg-yellow-500 animate-pulse"}`} />
            <span className="font-mono text-[11px]">{health ? "API ONLINE" : "CONNECTING..."}</span>
          </div>

          {loggedIn ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onToggleDashboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isDashboardOpen
                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/15"
                    : "bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-semibold shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110"
                }`}
                id="toggle-dashboard-btn"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{isDashboardOpen ? "View Landing" : "Connected Banking"}</span>
              </button>

              {/* Professional Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                  id="profile-menu-btn"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#33bbcf] to-[#def9fa] flex items-center justify-center text-black font-bold text-sm shadow-lg">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  
                  {/* Name (Desktop only) */}
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium text-white leading-none">
                      {user?.name || "User"}
                    </span>
                    <span className="text-[10px] text-gray-400 leading-none mt-0.5">
                      View Profile
                    </span>
                  </div>

                  {/* Dropdown Arrow */}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#00040f] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50">
                    {/* Profile Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-[#00f6ff]/10 to-[#33bbcf]/10 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#33bbcf] to-[#def9fa] flex items-center justify-center text-black font-bold text-lg shadow-lg">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user?.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {/* User Info Item */}
                      <div className="px-4 py-2 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-sm">
                          <User className="w-4 h-4 text-[#00f6ff]" />
                          <div>
                            <p className="text-white font-medium">{user?.name || "User"}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.role || "USER"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Email Item */}
                      <div className="px-4 py-2 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-[#00f6ff]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400">Email Address</p>
                            <p className="text-white text-xs truncate">{user?.email || "user@example.com"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="my-2 border-t border-white/10"></div>

                      {/* Sign Out Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 text-gray-300 hover:text-red-400 transition-colors group"
                        id="dropdown-logout-btn"
                      >
                        <LogOut className="w-4 h-4 group-hover:animate-pulse" />
                        <span className="text-sm font-medium">Sign Out</span>
                      </button>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-white/5 border-t border-white/10">
                      <p className="text-[10px] text-gray-500 text-center">
                        Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => onOpenAuth("login")}
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white transition-colors cursor-pointer"
                id="nav-signin-btn"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth("register")}
                className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-semibold text-sm shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 transition-all cursor-pointer"
                id="nav-signup-btn"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/10 flex flex-col gap-4 text-sm font-medium text-gray-300">
          <button onClick={() => scrollToSection("hero")} className="text-left py-1 hover:text-white">Home</button>
          <button onClick={() => scrollToSection("features")} className="text-left py-1 hover:text-white">Features</button>
          <button onClick={() => scrollToSection("product")} className="text-left py-1 hover:text-white">Product</button>
          <button onClick={() => scrollToSection("exchange")} className="text-left py-1 hover:text-white">Exchange</button>
          <button onClick={() => scrollToSection("clients")} className="text-left py-1 hover:text-white">Clients</button>
          <div className="flex items-center gap-2 pt-2 text-xs text-gray-400">
            <span className={`w-2 h-2 rounded-full ${health ? "bg-[#00f6ff]" : "bg-yellow-500"}`} />
            <span>{health ? "REST API Connected (Spring Boot 3.5)" : "Connecting to API..."}</span>
          </div>
        </div>
      )}
    </nav>
  );
};
