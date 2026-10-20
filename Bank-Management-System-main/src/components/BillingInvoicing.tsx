import React, { useState } from "react";
import { CheckCircle2, Apple, Play } from "lucide-react";

interface BillingInvoicingProps {
  onQuickPay?: () => void;
}

export const BillingInvoicing: React.FC<BillingInvoicingProps> = ({ onQuickPay }) => {
  const [paymentSuccess, setPaymentSuccess] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulatedPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      if (onQuickPay) onQuickPay();
    }, 600);
  };

  return (
    <section className="w-full py-16 sm:py-24 px-6 sm:px-12 relative overflow-hidden" id="product">
      {/* Background glow */}
      <div className="absolute top-1/2 -left-20 w-96 h-96 bg-[#00f6ff]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Interactive UI Visual Cards */}
        <div className="lg:col-span-6 relative flex flex-col items-center lg:items-start">
          <div className="relative w-full max-w-md">
            {/* PayPal Checkout Card */}
            <div className="relative w-full sm:w-80 ml-auto mr-auto sm:mr-0 rounded-2xl bg-[#14101d]/90 border border-white/10 p-5 shadow-2xl backdrop-blur-xl z-20 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#003087] flex items-center justify-center font-bold text-white text-lg italic shadow-md">
                  P
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white">Paypal</h4>
                  <p className="text-xs text-gray-400">Checkout</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <span className="text-[11px] text-gray-400">Total</span>
                  <p className="text-xl font-bold text-white">$210.00</p>
                </div>
                <button
                  onClick={handleSimulatedPayment}
                  className="px-3 py-1 text-xs text-gray-300 border border-white/20 rounded-md hover:bg-white/10 transition-colors"
                >
                  Change
                </button>
              </div>

              <button
                onClick={handleSimulatedPayment}
                disabled={isProcessing}
                className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-semibold text-xs tracking-wide shadow-[0_0_15px_rgba(0,246,255,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                id="paypal-make-payment-btn"
              >
                {isProcessing ? "Processing..." : "Make Payment"}
              </button>
            </div>

            {/* Last Transaction Card */}
            <div className="relative sm:-mt-12 w-full sm:w-84 rounded-2xl bg-[#14101d]/90 border border-white/10 p-5 shadow-2xl backdrop-blur-xl z-10">
              <h4 className="text-sm font-semibold text-white mb-4">Last Transaction</h4>

              <div className="flex flex-col gap-3.5">
                {/* Dribbble */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#ea4c89] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      D
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">Dribbble Pro</p>
                      <p className="text-[10px] text-gray-400">15 Days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-red-400">
                    <span>▼</span>
                    <span>-$250,93</span>
                  </div>
                </div>

                {/* Netflix */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#e50914] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      N
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">Netflix</p>
                      <p className="text-[10px] text-gray-400">4 Days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-red-400">
                    <span>▼</span>
                    <span>-$250,93</span>
                  </div>
                </div>

                {/* Manulife Cash */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#00a758] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      M
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">Manulife Cash</p>
                      <p className="text-[10px] text-gray-400">4 Days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#00f6ff]">
                    <span>▲</span>
                    <span>+$250,93</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Success Banner Badge */}
            {paymentSuccess && (
              <div className="w-full mt-4 flex items-center gap-2.5 p-3 rounded-xl bg-white text-black font-semibold text-xs shadow-[0_10px_25px_rgba(0,0,0,0.5)] animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Great! Your Payment is successfully.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Headline & Description */}
        <div className="lg:col-span-6 flex flex-col items-start">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Easily control your <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#33bbcf] to-[#def9fa] bg-clip-text text-transparent">
              billing & invoicing
            </span>
          </h2>

          <p className="mt-6 text-base sm:text-lg text-gray-400 font-normal leading-relaxed max-w-lg">
            Elit enim sed massa etiam. Mauris eu adipiscing ultrices ametodio aenean neque. Fusce ipsum orci rhoncus aliporttitor integer platea placerat.
          </p>

          {/* App Store / Google Play Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => alert("HooBank iOS App available soon on the Apple App Store!")}
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black/60 hover:bg-black/90 border border-white/20 transition-all cursor-pointer"
              id="app-store-btn"
            >
              <Apple className="w-6 h-6 text-white" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase leading-none">Download on the</p>
                <p className="text-sm font-semibold text-white leading-tight">App Store</p>
              </div>
            </button>

            <button
              onClick={() => alert("HooBank Android App available soon on Google Play Store!")}
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black/60 hover:bg-black/90 border border-white/20 transition-all cursor-pointer"
              id="google-play-btn"
            >
              <Play className="w-5 h-5 text-[#00f6ff] fill-[#00f6ff]" />
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase leading-none">GET IT ON</p>
                <p className="text-sm font-semibold text-white leading-tight">Google Play</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
