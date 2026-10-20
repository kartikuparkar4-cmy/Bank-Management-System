import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Stats } from "./components/Stats";
import { BusinessFeatures } from "./components/BusinessFeatures";
import { BillingInvoicing } from "./components/BillingInvoicing";
import { CardDeals } from "./components/CardDeals";
import { Testimonials } from "./components/Testimonials";
import { CurrencyExchangeSection } from "./components/CurrencyExchangeSection";
import { Partners } from "./components/Partners";
import { CTABanner } from "./components/CTABanner";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";
import { FeedbackModal } from "./components/FeedbackModal";
import { BankingDashboard } from "./components/BankingDashboard";
import { isLoggedIn } from "./lib/api";

export default function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [pendingTransferData, setPendingTransferData] = useState<{
    sourceAmount: number;
    sourceCurrency: string;
    targetAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    description: string;
  } | null>(null);

  useEffect(() => {
    // If already logged in, we keep state in sync
    const handleAuth = () => {
      if (!isLoggedIn()) {
        setIsDashboardOpen(false);
      }
    };
    window.addEventListener("bank_auth_change", handleAuth);
    return () => window.removeEventListener("bank_auth_change", handleAuth);
  }, []);

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleGetStarted = () => {
    if (isLoggedIn()) {
      setIsDashboardOpen(true);
    } else {
      handleOpenAuth("register");
    }
  };

  const handleTransferFromHome = (transferDetails: {
    sourceAmount: number;
    sourceCurrency: string;
    targetAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    description: string;
  }) => {
    setPendingTransferData(transferDetails);
    if (isLoggedIn()) {
      setIsDashboardOpen(true);
    } else {
      handleOpenAuth("login");
    }
  };

  const handleAuthSuccess = () => {
    setIsDashboardOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#00040f] text-white flex flex-col selection:bg-[#00f6ff] selection:text-black overflow-x-hidden">
      {/* Navigation Header */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onToggleDashboard={() => {
          if (!isLoggedIn()) {
            handleOpenAuth("login");
          } else {
            setIsDashboardOpen(!isDashboardOpen);
          }
        }}
        isDashboardOpen={isDashboardOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {isDashboardOpen ? (
          <BankingDashboard
            onBackToHome={() => setIsDashboardOpen(false)}
            initialTransferData={pendingTransferData}
          />
        ) : (
          <div className="w-full flex flex-col">
            <Hero onGetStarted={handleGetStarted} />
            <Stats />
            <BusinessFeatures onGetStarted={handleGetStarted} />
            <BillingInvoicing onQuickPay={handleGetStarted} />
            <CardDeals onGetStarted={handleGetStarted} />
            <Testimonials onOpenFeedbackModal={() => setFeedbackModalOpen(true)} />
            <CurrencyExchangeSection onTransfer={handleTransferFromHome} />
            <Partners />
            <CTABanner onGetStarted={handleGetStarted} />
          </div>
        )}
      </main>

      {/* Footer */}
      {!isDashboardOpen && <Footer />}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Feedback / Review Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
