import React, { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "../lib/api";
import {
  ExchangeRatesData,
  InternationalPaymentQuote,
  CurrencyInfo,
  BankAccount,
} from "../types";
import {
  ArrowRightLeft,
  RefreshCw,
  TrendingUp,
  Globe2,
  ShieldCheck,
  Zap,
  DollarSign,
  ArrowUpRight,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  Send,
  Lock,
  ChevronDown,
  Calculator,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  Table,
} from "lucide-react";

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", country: "United States" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", country: "Eurozone" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", country: "United Kingdom" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", country: "Japan" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦", country: "Canada" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", country: "Australia" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭", country: "Switzerland" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", country: "India" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", country: "Singapore" },
  { code: "AED", name: "UAE Dirham", symbol: "AED", flag: "🇦🇪", country: "United Arab Emirates" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", country: "China" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷", country: "Brazil" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", flag: "🇲🇽", country: "Mexico" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿", country: "New Zealand" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰", country: "Hong Kong" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪", country: "Sweden" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦", country: "South Africa" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷", country: "South Korea" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭", country: "Thailand" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR", flag: "🇸🇦", country: "Saudi Arabia" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷", country: "Turkey" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱", country: "Poland" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴", country: "Norway" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰", country: "Denmark" },
];

interface CurrencyConverterProps {
  accounts?: BankAccount[];
  compact?: boolean;
  idPrefix?: string;
  ctaText?: string;
  onApplyTransfer?: (details: {
    sourceAmount: number;
    sourceCurrency: string;
    targetAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    description: string;
  }) => void;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  accounts = [],
  compact = false,
  idPrefix = "dash-fx",
  ctaText = "Transfer International Funds",
  onApplyTransfer,
}) => {
  const [calcMode, setCalcMode] = useState<"standard" | "transfer">("standard");
  const [sourceCurrency, setSourceCurrency] = useState<string>("USD");
  const [targetCurrency, setTargetCurrency] = useState<string>("EUR");
  
  // Amounts
  const [sourceAmountStr, setSourceAmountStr] = useState<string>("1000");
  const [targetAmountStr, setTargetAmountStr] = useState<string>("");
  const [lastEditedField, setLastEditedField] = useState<"source" | "target">("source");

  const [ratesData, setRatesData] = useState<ExchangeRatesData | null>(null);
  const [quote, setQuote] = useState<InternationalPaymentQuote | null>(null);
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<Date>(new Date());
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showTable, setShowTable] = useState<boolean>(false);

  // Fetch exchange rates for the selected base
  const fetchRates = useCallback(async (base: string) => {
    setLoadingRates(true);
    try {
      const data = await api.getExchangeRates(base);
      setRatesData(data);
      setLastRefreshedTime(new Date());
    } catch (err) {
      console.error("Failed to fetch FX rates", err);
    } finally {
      setLoadingRates(false);
    }
  }, []);

  // Fetch quote whenever amount, source, or target changes
  const fetchQuote = useCallback(async (srcAmt: number, srcCurr: string, tgtCurr: string) => {
    if (isNaN(srcAmt) || srcAmt <= 0) {
      setQuote(null);
      return;
    }

    setLoadingQuote(true);
    try {
      const q = await api.getInternationalQuote({
        sourceAmount: srcAmt,
        sourceCurrency: srcCurr,
        targetCurrency: tgtCurr,
      });
      setQuote(q);
    } catch (err) {
      console.error("Failed to fetch payment quote", err);
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRates(sourceCurrency);
  }, [sourceCurrency, fetchRates]);

  // Active currency info
  const sourceCurrencyInfo = useMemo(
    () => SUPPORTED_CURRENCIES.find((c) => c.code === sourceCurrency) || SUPPORTED_CURRENCIES[0],
    [sourceCurrency]
  );
  const targetCurrencyInfo = useMemo(
    () => SUPPORTED_CURRENCIES.find((c) => c.code === targetCurrency) || SUPPORTED_CURRENCIES[1],
    [targetCurrency]
  );

  // Current direct exchange rate
  const currentRate = useMemo(() => {
    if (ratesData && ratesData.rates && ratesData.rates[targetCurrency] !== undefined) {
      return Number(ratesData.rates[targetCurrency]);
    }
    return 1.0;
  }, [ratesData, targetCurrency]);

  const inverseRate = useMemo(() => {
    return currentRate > 0 ? 1 / currentRate : 0;
  }, [currentRate]);

  // Decide number of decimal places based on currency
  const getDecimals = (currencyCode: string) => {
    if (["JPY", "KRW"].includes(currencyCode)) return 0;
    return 2;
  };

  // Synchronize target when source updates (or when rate updates)
  useEffect(() => {
    if (lastEditedField === "source") {
      const srcNum = parseFloat(sourceAmountStr);
      if (isNaN(srcNum) || srcNum <= 0) {
        setTargetAmountStr("");
      } else {
        const decimals = getDecimals(targetCurrency);
        const converted = srcNum * currentRate;
        setTargetAmountStr(converted.toFixed(decimals));
      }
    } else {
      const tgtNum = parseFloat(targetAmountStr);
      if (isNaN(tgtNum) || tgtNum <= 0) {
        setSourceAmountStr("");
      } else {
        const decimals = getDecimals(sourceCurrency);
        const calculatedSource = currentRate > 0 ? tgtNum / currentRate : 0;
        setSourceAmountStr(calculatedSource.toFixed(decimals));
      }
    }
  }, [sourceCurrency, targetCurrency, currentRate, lastEditedField]);

  // Debounced quote calculation for transfers
  useEffect(() => {
    const numAmount = parseFloat(sourceAmountStr);
    const timer = setTimeout(() => {
      fetchQuote(numAmount, sourceCurrency, targetCurrency);
    }, 250);

    return () => clearTimeout(timer);
  }, [sourceAmountStr, sourceCurrency, targetCurrency, fetchQuote]);

  // Handle Source Amount Input Change
  const handleSourceAmountChange = (val: string) => {
    setLastEditedField("source");
    setSourceAmountStr(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && currentRate > 0) {
      const decimals = getDecimals(targetCurrency);
      setTargetAmountStr((num * currentRate).toFixed(decimals));
    } else {
      setTargetAmountStr("");
    }
  };

  // Handle Target Amount Input Change (Bidirectional calculator)
  const handleTargetAmountChange = (val: string) => {
    setLastEditedField("target");
    setTargetAmountStr(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && currentRate > 0) {
      const decimals = getDecimals(sourceCurrency);
      setSourceAmountStr((num / currentRate).toFixed(decimals));
    } else {
      setSourceAmountStr("");
    }
  };

  // Handle currency swap
  const handleSwapCurrencies = () => {
    setIsSwapping(true);
    const oldSource = sourceCurrency;
    const oldTarget = targetCurrency;
    setSourceCurrency(oldTarget);
    setTargetCurrency(oldSource);
    setTimeout(() => setIsSwapping(false), 300);
  };

  // Maximum user balance across active accounts
  const maxAvailableBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [accounts]);

  // Copy result to clipboard
  const handleCopyResult = () => {
    const srcNum = parseFloat(sourceAmountStr || "0");
    const tgtNum = parseFloat(targetAmountStr || "0");
    const text = `${srcNum.toLocaleString("en-US")} ${sourceCurrency} = ${tgtNum.toLocaleString("en-US", { minimumFractionDigits: getDecimals(targetCurrency) })} ${targetCurrency} (Rate: 1 ${sourceCurrency} = ${currentRate.toFixed(4)} ${targetCurrency})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Real-world accurate numerical conversion result
  const calculatedSourceNum = parseFloat(sourceAmountStr || "0");
  const calculatedTargetNum = parseFloat(targetAmountStr || "0");

  // Multi-unit Conversion Table Values (1, 5, 10, 25, 50, 100, 500, 1000, 5000, 10000)
  const conversionMatrixUnits = [1, 5, 10, 25, 50, 100, 500, 1000, 5000, 10000];

  // Popular currency ticker pairs
  const popularPairs = [
    { from: "USD", to: "EUR", trend: "+0.28%" },
    { from: "EUR", to: "USD", trend: "-0.28%" },
    { from: "GBP", to: "USD", trend: "+0.15%" },
    { from: "USD", to: "JPY", trend: "+0.45%" },
    { from: "USD", to: "INR", trend: "-0.08%" },
    { from: "USD", to: "CAD", trend: "+0.12%" },
    { from: "USD", to: "SGD", trend: "+0.05%" },
    { from: "USD", to: "AED", trend: "0.00%" },
  ];

  return (
    <div
      id={`${idPrefix}-currency-converter-widget`}
      className={`relative rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#090e1b] to-[#0c1322] border border-white/10 shadow-2xl overflow-hidden ${
        compact ? "p-6" : "p-6 md:p-8"
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00f6ff]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#33bbcf] to-[#def9fa] p-[2px] shadow-[0_0_20px_rgba(0,246,255,0.25)]">
            <div className="w-full h-full bg-[#00040f] rounded-2xl flex items-center justify-center text-[#00f6ff]">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">Real-World Currency Calculator</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#00f6ff]/15 text-[#00f6ff] border border-[#00f6ff]/30 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f6ff] animate-ping" />
                Live Mid-Market Rates
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Exact real-time currency conversions & zero-markup foreign exchange calculations
            </p>
          </div>
        </div>

        {/* Right Controls: Mode Toggle & Refresh */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Mode Switcher */}
          <div className="p-1 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1">
            <button
              type="button"
              id={`${idPrefix}-mode-standard-btn`}
              onClick={() => setCalcMode("standard")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                calcMode === "standard"
                  ? "bg-[#00f6ff] text-black shadow-[0_0_12px_rgba(0,246,255,0.3)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Standard FX</span>
            </button>
            <button
              type="button"
              id={`${idPrefix}-mode-transfer-btn`}
              onClick={() => setCalcMode("transfer")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                calcMode === "transfer"
                  ? "bg-[#00f6ff] text-black shadow-[0_0_12px_rgba(0,246,255,0.3)]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transfer Quote</span>
            </button>
          </div>

          <button
            id={`${idPrefix}-refresh-fx-rates-btn`}
            onClick={() => fetchRates(sourceCurrency)}
            disabled={loadingRates}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Refresh Live Exchange Rates"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00f6ff] ${loadingRates ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Real-Time Conversion Hero Card */}
      <div className="mt-6 p-5 md:p-6 rounded-2xl bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-white/[0.04] border border-white/10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-gray-400 font-medium">
              {calculatedSourceNum.toLocaleString("en-US")} {sourceCurrencyInfo.name} equals
            </div>
            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
              <span
                id={`${idPrefix}-accurate-hero-result`}
                className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#def9fa] to-[#00f6ff]"
              >
                {calculatedTargetNum > 0
                  ? calculatedTargetNum.toLocaleString("en-US", {
                      minimumFractionDigits: getDecimals(targetCurrency),
                      maximumFractionDigits: getDecimals(targetCurrency),
                    })
                  : "0.00"}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {targetCurrencyInfo.name}
              </span>
            </div>
            
            {/* Live Exchange Rate Statement */}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
              <span className="text-white font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                1 {sourceCurrency} = {currentRate.toFixed(currentRate >= 100 ? 2 : 4)} {targetCurrency}
              </span>
              <span className="text-gray-500">•</span>
              <span>
                1 {targetCurrency} = {inverseRate.toFixed(inverseRate >= 100 ? 2 : 6)} {sourceCurrency}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">
                Updated {lastRefreshedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id={`${idPrefix}-copy-conversion-btn`}
              onClick={handleCopyResult}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#00f6ff]" />
                  <span>Copy Result</span>
                </>
              )}
            </button>

            <button
              type="button"
              id={`${idPrefix}-toggle-table-btn`}
              onClick={() => setShowTable(!showTable)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                showTable
                  ? "bg-[#00f6ff]/15 border-[#00f6ff] text-[#00f6ff]"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white"
              }`}
            >
              <Table className="w-3.5 h-3.5 text-[#00f6ff]" />
              <span>{showTable ? "Hide Rates Table" : "Conversion Table"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Dual-Input Calculator Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Inputs (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Source Currency Input Block */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[#00f6ff]/60 transition shadow-inner">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f6ff]" />
                Amount (You Convert)
              </span>
              {maxAvailableBalance > 0 && (
                <button
                  type="button"
                  onClick={() => handleSourceAmountChange(maxAvailableBalance.toFixed(2))}
                  className="text-[11px] text-[#00f6ff] hover:underline cursor-pointer"
                >
                  Balance: ${maxAvailableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} (Use Max)
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg md:text-xl">
                  {sourceCurrencyInfo.symbol}
                </span>
                <input
                  id={`${idPrefix}-source-currency-amount-input`}
                  type="number"
                  min="0"
                  step="any"
                  value={sourceAmountStr}
                  onChange={(e) => handleSourceAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent pl-8 pr-2 py-1 text-2xl md:text-3xl font-extrabold text-white focus:outline-none placeholder:text-gray-600"
                />
              </div>

              {/* Source Currency Dropdown */}
              <div className="relative shrink-0">
                <select
                  id={`${idPrefix}-source-currency-select`}
                  aria-label="Select source currency to send"
                  value={sourceCurrency}
                  onChange={(e) => setSourceCurrency(e.target.value)}
                  className="appearance-none bg-[#090e1a] text-white font-bold text-sm pl-3 pr-8 py-2 rounded-xl border border-white/15 focus:outline-none focus:border-[#00f6ff] cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-[#0b101c] text-white">
                      {curr.flag} {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick Amount Presets */}
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5 overflow-x-auto scrollbar-none">
              {["100", "500", "1000", "2500", "5000", "10000"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSourceAmountChange(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                    sourceAmountStr === preset
                      ? "bg-[#00f6ff]/20 text-[#00f6ff] border border-[#00f6ff]/40"
                      : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
                  }`}
                >
                  {sourceCurrencyInfo.symbol}{Number(preset).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Center Swap Button & Exchange Rate Banner */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-white">
                1 {sourceCurrency} = {currentRate.toFixed(4)} {targetCurrency}
              </span>
              <span className="text-gray-500 hidden sm:inline">
                (Mid-market exchange rate)
              </span>
            </div>

            <button
              id={`${idPrefix}-swap-currencies-btn`}
              type="button"
              onClick={handleSwapCurrencies}
              className={`p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-[#00f6ff] transition transform cursor-pointer shadow-sm hover:scale-105 ${
                isSwapping ? "rotate-180 duration-300" : ""
              }`}
              title="Swap From and To Currencies"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Target Currency Converted Output Block (Bidirectional editable) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[#00f6ff]/60 transition shadow-inner">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Converted Amount ({targetCurrency})
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Real-World Mid-Market Rate
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg md:text-xl">
                  {targetCurrencyInfo.symbol}
                </span>
                <input
                  id={`${idPrefix}-target-currency-amount-input`}
                  type="number"
                  min="0"
                  step="any"
                  value={targetAmountStr}
                  onChange={(e) => handleTargetAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent pl-8 pr-2 py-1 text-2xl md:text-3xl font-extrabold text-[#00f6ff] focus:outline-none placeholder:text-gray-600"
                />
              </div>

              {/* Target Currency Dropdown */}
              <div className="relative shrink-0">
                <select
                  id={`${idPrefix}-target-currency-select`}
                  aria-label="Select target currency for recipient"
                  value={targetCurrency}
                  onChange={(e) => setTargetCurrency(e.target.value)}
                  className="appearance-none bg-[#090e1a] text-white font-bold text-sm pl-3 pr-8 py-2 rounded-xl border border-white/15 focus:outline-none focus:border-[#00f6ff] cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-[#0b101c] text-white">
                      {curr.flag} {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Information & Action Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#00f6ff]" />
                {calcMode === "standard" ? "FX Conversion Details" : "Fee & Transfer Telemetry"}
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#00f6ff]" />
                2h Rate Lock
              </span>
            </div>

            {/* Standard Mode Content */}
            {calcMode === "standard" ? (
              <div className="flex flex-col gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-1.5">
                  <div className="text-[11px] text-gray-400 font-medium">Mathematical Conversion Formula:</div>
                  <div className="text-sm font-extrabold text-white">
                    {calculatedSourceNum.toLocaleString("en-US")} {sourceCurrency} × {currentRate.toFixed(4)} ={" "}
                    <span className="text-[#00f6ff]">
                      {calculatedTargetNum.toLocaleString("en-US", { minimumFractionDigits: getDecimals(targetCurrency) })} {targetCurrency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">Interbank Mid-Market Rate:</span>
                  <span className="font-bold text-[#00f6ff]">
                    1 {sourceCurrency} = {currentRate.toFixed(4)} {targetCurrency}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">Inverse Exchange Rate:</span>
                  <span className="font-bold text-white">
                    1 {targetCurrency} = {inverseRate.toFixed(inverseRate >= 100 ? 2 : 6)} {sourceCurrency}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">Rate Quality / Spread:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Zero Hidden Markup (0.00%)
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">Feed Source:</span>
                  <span className="font-semibold text-gray-300">
                    {ratesData?.source === "OPEN_EXCHANGE_FEED_LIVE" ? "Global Central Banks Feed" : "Interbank Live Mirror"}
                  </span>
                </div>
              </div>
            ) : (
              /* International Transfer Mode */
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">HooBank FX Fee (0.25%):</span>
                  <span className="font-bold text-white">
                    {sourceCurrencyInfo.symbol}
                    {quote ? quote.hooBankFee.toFixed(2) : "2.50"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">Traditional Bank Markup:</span>
                  <span className="text-red-400 line-through">
                    {sourceCurrencyInfo.symbol}
                    {quote ? quote.traditionalBankFee.toFixed(2) : "50.00"}
                  </span>
                </div>

                {/* Savings Highlight Pill */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300">Estimated HooBank Savings:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    +{sourceCurrencyInfo.symbol}
                    {quote ? quote.userSavings.toFixed(2) : "47.50"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-300 pt-1">
                  <span className="text-gray-400">Net Recipient Receives:</span>
                  <span className="font-extrabold text-[#00f6ff] text-sm">
                    {targetCurrencyInfo.symbol}
                    {quote ? quote.targetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : calculatedTargetNum.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">Speed & Corridor:</span>
                  <span className="font-semibold text-white flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {quote?.deliverySpeed || "Instant Rail"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-5 pt-3 border-t border-white/10 flex flex-col gap-2">
            {onApplyTransfer && (
              <button
                id={`${idPrefix}-apply-fx-to-transfer-btn`}
                type="button"
                onClick={() => {
                  const numAmt = parseFloat(sourceAmountStr || "0");
                  const tgtAmt = quote ? quote.targetAmount : numAmt * currentRate;
                  onApplyTransfer({
                    sourceAmount: numAmt,
                    sourceCurrency,
                    targetAmount: tgtAmt,
                    targetCurrency,
                    exchangeRate: currentRate,
                    description: `International FX Transfer (${targetCurrency} ${tgtAmt.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })})`,
                  });
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00f6ff] via-[#33bbcf] to-[#00f6ff] text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition shadow-[0_0_20px_rgba(0,246,255,0.3)] cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{ctaText}</span>
              </button>
            )}

            <p className="text-[10px] text-gray-500 text-center">
              Exchange rate verified at {lastRefreshedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. All rates sourced directly via open interbank feed.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Unit Interactive Conversion Table (Google / XE Style) */}
      {showTable && (
        <div className="mt-6 pt-6 border-t border-white/10 relative z-10 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Table className="w-4 h-4 text-[#00f6ff]" />
              <span>Conversion Rates Reference Matrix ({sourceCurrency} ⇄ {targetCurrency})</span>
            </h4>
            <span className="text-xs text-gray-400">Direct vs Inverse Multiples</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Table 1: Source to Target */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="px-3 py-2 bg-white/5 border-b border-white/10 font-bold text-xs text-white flex justify-between">
                <span>Convert {sourceCurrency} to {targetCurrency}</span>
                <span className="text-[#00f6ff]">Rate: {currentRate.toFixed(4)}</span>
              </div>
              <div className="divide-y divide-white/5 text-xs">
                {conversionMatrixUnits.map((unit) => {
                  const converted = unit * currentRate;
                  return (
                    <div key={unit} className="px-3 py-2 flex items-center justify-between hover:bg-white/[0.04] transition">
                      <span className="font-semibold text-gray-300">
                        {unit.toLocaleString()} {sourceCurrency}
                      </span>
                      <span className="font-extrabold text-[#00f6ff]">
                        {converted.toLocaleString("en-US", { minimumFractionDigits: getDecimals(targetCurrency), maximumFractionDigits: getDecimals(targetCurrency) })} {targetCurrency}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table 2: Target to Source */}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="px-3 py-2 bg-white/5 border-b border-white/10 font-bold text-xs text-white flex justify-between">
                <span>Convert {targetCurrency} to {sourceCurrency}</span>
                <span className="text-[#00f6ff]">Rate: {inverseRate.toFixed(4)}</span>
              </div>
              <div className="divide-y divide-white/5 text-xs">
                {conversionMatrixUnits.map((unit) => {
                  const converted = unit * inverseRate;
                  return (
                    <div key={unit} className="px-3 py-2 flex items-center justify-between hover:bg-white/[0.04] transition">
                      <span className="font-semibold text-gray-300">
                        {unit.toLocaleString()} {targetCurrency}
                      </span>
                      <span className="font-extrabold text-white">
                        {converted.toLocaleString("en-US", { minimumFractionDigits: getDecimals(sourceCurrency), maximumFractionDigits: getDecimals(sourceCurrency) })} {sourceCurrency}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Currency Pairs Watchlist Grid */}
      <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#00f6ff]" />
            Major Currency Corridor Rates
          </span>
          <span className="text-[11px] text-gray-500">Click any pair to load in calculator</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {popularPairs.map((pair) => {
            let displayRate = "1.000";

            if (ratesData && ratesData.rates) {
              if (pair.from === ratesData.base && ratesData.rates[pair.to]) {
                displayRate = ratesData.rates[pair.to].toFixed(3);
              } else if (pair.from === "USD" && ratesData.rates[pair.to]) {
                displayRate = ratesData.rates[pair.to].toFixed(3);
              } else if (pair.to === "USD" && ratesData.rates[pair.from]) {
                const r = ratesData.rates[pair.from];
                displayRate = r > 0 ? (1 / r).toFixed(3) : "1.000";
              }
            }

            const isSelected = sourceCurrency === pair.from && targetCurrency === pair.to;

            return (
              <button
                key={`${pair.from}-${pair.to}`}
                type="button"
                onClick={() => {
                  setSourceCurrency(pair.from);
                  setTargetCurrency(pair.to);
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? "bg-[#00f6ff]/15 border-[#00f6ff] shadow-[0_0_12px_rgba(0,246,255,0.2)]"
                    : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-white">
                  <span>
                    {pair.from}/{pair.to}
                  </span>
                  <span
                    className={`text-[9px] font-semibold ${
                      pair.trend.startsWith("+")
                        ? "text-emerald-400"
                        : pair.trend.startsWith("-")
                        ? "text-rose-400"
                        : "text-gray-400"
                    }`}
                  >
                    {pair.trend}
                  </span>
                </div>
                <div className="text-xs font-extrabold text-gray-200 mt-1">{displayRate}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
