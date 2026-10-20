import React, { useState } from "react";
import { api, saveSession } from "../lib/api";
import { HooBankLogo } from "./HooBankLogo";
import { X, Lock, Mail, User, Phone, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = "login",
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatAuthError = (message: string) => {
    const normalized = message.toLowerCase();

    if (normalized.includes("already exists") || normalized.includes("already registered")) {
      return "An account with this email already exists. We switched you to sign in, or you can use a different email address.";
    }

    if (normalized.includes("invalid email or password")) {
      return "We couldn’t find a matching account. Please check your email and password.";
    }

    return message;
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await api.login({ email: email.trim(), password });
        saveSession(res);
      } else {
        const res = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
        });
        saveSession(res);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      const formatted = formatAuthError(message);

      if (
        formatted.toLowerCase().includes("already exists") ||
        formatted.toLowerCase().includes("already registered")
      ) {
        setMode("login");
        setPassword("");
        setError(formatted);
        return;
      }

      setError(formatted);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setMode("login");
    setEmail("kartik@example.com");
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" id="auth-modal-overlay">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0e131f] border border-white/15 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(0,246,255,0.15)] z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          id="auth-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <HooBankLogo size="md" />
          <h3 className="mt-4 text-xl font-bold text-white">
            {mode === "login" ? "Welcome Back" : "Create Connected Account"}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {mode === "login"
              ? "Access your balances, cards, and real-time payments"
              : "Includes instant $5,000 savings account & virtual VISA"}
          </p>
        </div>

        {/* 1-Click Quick Demo Login Pill */}
        <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-[#00f6ff]/10 to-[#33bbcf]/5 border border-[#00f6ff]/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#00f6ff]">
            <Sparkles className="w-4 h-4" />
            <span>Test Demo Account (Kartik)</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-3 py-1 text-xs font-semibold text-black bg-[#00f6ff] hover:bg-[#def9fa] rounded-lg shadow-sm transition-all cursor-pointer"
            id="fill-demo-credentials-btn"
          >
            Auto-fill
          </button>
        </div>

        {/* Switch Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "login"
                ? "bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
            id="tab-signin"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === "register"
                ? "bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
            id="tab-signup"
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              {error.toLowerCase().includes("already registered") && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                    setPassword("");
                  }}
                  className="mt-2 inline-flex items-center text-[#00f6ff] font-medium hover:text-[#7af9ff] transition-colors cursor-pointer"
                >
                  Use a different email
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Kartik Uparkar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] focus:ring-1 focus:ring-[#00f6ff] transition-all"
                  id="input-name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] focus:ring-1 focus:ring-[#00f6ff] transition-all"
                id="input-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] focus:ring-1 focus:ring-[#00f6ff] transition-all"
                id="input-password"
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] focus:ring-1 focus:ring-[#00f6ff] transition-all"
                  id="input-phone"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-sm shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="auth-submit-btn"
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In to Banking" : "Open Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
