import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  api,
  getCurrentUser,
  clearSession,
} from "../lib/api";
import {
  UserProfile,
  BankAccount,
  BankCard,
  BankBill,
  BankReward,
  BankTransaction,
  BankNotification,
  NotificationType,
  NotificationSeverity,
  TransferPayload,
  BillPaymentPayload,
} from "../types";
import { NotificationCenter } from "./NotificationCenter";
import { SpendingInsights } from "./SpendingInsights";
import { CurrencyConverter } from "./CurrencyConverter";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Receipt,
  Gift,
  History,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  TrendingUp,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Bell,
  Check,
  Trash2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  PieChart as PieChartIcon,
  Globe2,
  Plus,
  HelpCircle,
  Shield,
  FileText,
  Droplet,
  Wifi,
  Smartphone,
  X,
} from "lucide-react";

interface BankingDashboardProps {
  onBackToHome: () => void;
  initialTransferData?: {
    sourceAmount: number;
    sourceCurrency: string;
    targetAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    description: string;
  } | null;
}

export const BankingDashboard: React.FC<BankingDashboardProps> = ({
  onBackToHome,
  initialTransferData,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "accounts" | "insights" | "currency" | "transfer" | "transactions" | "cards" | "bills" | "rewards" | "notifications"
  >("overview");

  // Banking State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [cards, setCards] = useState<BankCard[]>([]);
  const [bills, setBills] = useState<BankBill[]>([]);
  const [reward, setReward] = useState<BankReward>({ id: 0, points: 0 });
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [notifications, setNotifications] = useState<BankNotification[]>([]);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Applied Currency FX Quote for Transfers
  const [appliedFxQuote, setAppliedFxQuote] = useState<{
    sourceAmount: number;
    sourceCurrency: string;
    targetAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    description: string;
  } | null>(null);

  // Transfer Form State
  const [transferSenderAccId, setTransferSenderAccId] = useState<number | "">("");
  const [transferReceiverAcc, setTransferReceiverAcc] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Bill Payment Form State
  const [selectedBill, setSelectedBill] = useState<BankBill | null>(null);
  const [billPayAccountId, setBillPayAccountId] = useState<number | "">("");
  const [billPaying, setBillPaying] = useState(false);

  // Card Request Modal State
  const [showCardRequestModal, setShowCardRequestModal] = useState(false);
  const [cardRequestType, setCardRequestType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [cardRequestSubmitting, setCardRequestSubmitting] = useState(false);

  // Add Bill Modal State
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [newBillProvider, setNewBillProvider] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("");
  const [newBillDueDate, setNewBillDueDate] = useState("");
  const [newBillType, setNewBillType] = useState<"ELECTRICITY" | "WATER" | "INTERNET" | "GAS" | "MOBILE">("ELECTRICITY");
  const [addBillSubmitting, setAddBillSubmitting] = useState(false);

  // Bill History & Payment Modal State
  const [showBillPaymentModal, setShowBillPaymentModal] = useState(false);
  const [billHistoryMode, setBillHistoryMode] = useState(false);

  // Transaction Search & Filter
  const [txSearch, setTxSearch] = useState("");
  const [txFilter, setTxFilter] = useState<"ALL" | "DEBIT" | "CREDIT">("ALL");

  // Load all banking data from REST API endpoints
  const loadBankingData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [profData, accsData, cardsData, billsData, rewData, txsData, notifsData] = await Promise.all([
        api.profile().catch(() => null),
        api.accounts().catch(() => []),
        api.cards().catch(() => []),
        api.bills().catch(() => []),
        api.rewards().catch(() => ({ id: 0, points: 0 })),
        api.transactions().catch(() => []),
        api.getNotifications().catch(() => []),
      ]);

      if (profData) setProfile(profData);
      if (accsData) {
        setAccounts(accsData);
        if (accsData.length > 0 && !transferSenderAccId) {
          setTransferSenderAccId(accsData[0].id);
          setBillPayAccountId(accsData[0].id);
        }
      }
      if (cardsData) setCards(cardsData);
      if (billsData) setBills(billsData);
      if (rewData) setReward(rewData);
      if (txsData) setTransactions(txsData);
      if (notifsData) setNotifications(notifsData);
    } catch (err) {
      console.error("Failed to load banking data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transferSenderAccId]);

  useEffect(() => {
    loadBankingData();
    // Real-time synchronization poll every 10 seconds
    const interval = setInterval(() => {
      loadBankingData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [loadBankingData]);

  // If initial transfer data was passed from Home Page or external action
  useEffect(() => {
    if (initialTransferData) {
      setActiveTab("transfer");
      setTransferAmount(initialTransferData.sourceAmount.toFixed(2));
      setTransferDesc(initialTransferData.description);
      setAppliedFxQuote(initialTransferData);
    }
  }, [initialTransferData]);

  // Click outside listener for Bell Popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notification Action Handlers
  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const handleSimulateNotification = async (
    type: NotificationType,
    title: string,
    message: string,
    severity: NotificationSeverity,
    actionTab?: "overview" | "accounts" | "insights" | "currency" | "transfer" | "transactions" | "cards" | "bills" | "rewards",
    actionLabel?: string
  ) => {
    try {
      const newNotif = await api.simulateNotification({
        type,
        title,
        message,
        severity,
        actionTab,
        actionLabel,
      });
      setNotifications((prev) => [newNotif, ...prev]);
      setFeedbackNotice({
        type: "success",
        msg: `Simulated Alert Triggered: "${title}"`,
      });
    } catch (err) {
      console.error("Failed to simulate notification", err);
    }
  };

  // Total balance sum
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // Handle Transfer Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSenderAccId || !transferReceiverAcc || !transferAmount) return;

    setTransferSubmitting(true);
    setFeedbackNotice(null);

    try {
      const payload: TransferPayload = {
        senderAccountId: Number(transferSenderAccId),
        receiverAccountNumber: transferReceiverAcc.trim(),
        amount: Number(transferAmount),
        description: transferDesc.trim() || "Funds Transfer",
      };

      const result = await api.transfer(payload);
      setFeedbackNotice({
        type: "success",
        msg: `Transferred $${Number(transferAmount).toFixed(2)} successfully! Tx ID: #${result.id}`,
      });
      setTransferAmount("");
      setTransferDesc("");
      setAppliedFxQuote(null);
      // Real-time sync update
      await loadBankingData(true);
    } catch (err: unknown) {
      setFeedbackNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Transfer transaction failed.",
      });
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Handle Apply from Currency Converter
  const handleApplyTransfer = (details: {
    sourceAmount: number;
    sourceCurrency: string;
    targetAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    description: string;
  }) => {
    setTransferAmount(details.sourceAmount.toFixed(2));
    setTransferDesc(details.description);
    setAppliedFxQuote(details);
    if (accounts.length > 0 && !transferSenderAccId) {
      setTransferSenderAccId(accounts[0].id);
    }
    setActiveTab("transfer");
    setFeedbackNotice({
      type: "success",
      msg: `International FX quote applied: Sending ${details.sourceCurrency} ${details.sourceAmount.toLocaleString()} (${details.targetCurrency} ${details.targetAmount.toLocaleString()} guaranteed at ${details.exchangeRate.toFixed(4)})`,
    });
  };

  // Handle Bill Payment Submit
  const handleBillPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !billPayAccountId) return;

    setBillPaying(true);
    setFeedbackNotice(null);

    try {
      const payload: BillPaymentPayload = {
        billId: selectedBill.id,
        amount: selectedBill.amount,
        accountId: Number(billPayAccountId),
      };

      const result = await api.payBill(payload);
      
      setFeedbackNotice({
        type: "success",
        msg: `✅ Bill for ${selectedBill.provider} ($${selectedBill.amount.toFixed(2)}) paid successfully! +${Math.max(5, Math.floor(selectedBill.amount / 5))} rewards points earned.`,
      });

      // Clear form and close modal
      setSelectedBill(null);
      setBillPayAccountId("");
      setShowBillPaymentModal(false);
      
      // Real-time sync update
      await loadBankingData(true);
    } catch (err: unknown) {
      setFeedbackNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Bill payment failed.",
      });
    } finally {
      setBillPaying(false);
    }
  };

  // Handle Card Request Submit
  const handleCardRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardRequestSubmitting(true);
    setFeedbackNotice(null);

    try {
      // Simulate card request (in production, this would call a real API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setFeedbackNotice({
        type: "success",
        msg: `${cardRequestType} card request submitted successfully! You'll receive your card details within 2-3 business days.`,
      });
      setShowCardRequestModal(false);
      setCardRequestType("DEBIT");
      
      // In production, reload cards data
      // await loadBankingData(true);
    } catch (err: unknown) {
      setFeedbackNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Card request failed.",
      });
    } finally {
      setCardRequestSubmitting(false);
    }
  };

  // Handle Add Bill Submit
  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddBillSubmitting(true);
    setFeedbackNotice(null);

    try {
      if (!newBillProvider || !newBillAmount || !newBillDueDate) {
        throw new Error("Please fill in all required fields");
      }

      // Create the bill
      const newBill = await api.addBill({
        billType: newBillType,
        provider: newBillProvider,
        amount: parseFloat(newBillAmount),
        dueDate: newBillDueDate,
      });

      setFeedbackNotice({
        type: "success",
        msg: `Bill for ${newBillProvider} ($${parseFloat(newBillAmount).toFixed(2)}) added successfully! Redirecting to pay...`,
      });

      // Reset form
      setNewBillProvider("");
      setNewBillAmount("");
      setNewBillDueDate("");
      setNewBillType("ELECTRICITY");
      setShowAddBillModal(false);

      // Reload bills
      await loadBankingData(true);

      // Auto-redirect to pay bill with the newly created bill
      setTimeout(() => {
        setSelectedBill(newBill);
        setBillHistoryMode(false);
        setShowBillPaymentModal(true);
      }, 500);
    } catch (err: unknown) {
      setFeedbackNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to add bill.",
      });
    } finally {
      setAddBillSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.receiver.name.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.sender.name.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.receiver.accountNumber.includes(txSearch);

    if (txFilter === "DEBIT") return matchesSearch && t.type === "DEBIT";
    if (txFilter === "CREDIT") return matchesSearch && t.type === "CREDIT";
    return matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-[#00040f] text-white pt-4 pb-20 px-4 sm:px-8" id="banking-dashboard-container">
      <div className="max-w-7xl mx-auto">
        {/* Top Banking Command Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#0d1424] via-[#101b30] to-[#0d1424] border border-white/10 shadow-2xl mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#33bbcf] to-[#def9fa] flex items-center justify-center text-black font-extrabold text-2xl shadow-[0_0_20px_rgba(0,246,255,0.4)]">
              {profile?.name?.[0] || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {profile?.name || "Connected Banking User"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00f6ff]/15 text-[#00f6ff] text-[11px] font-semibold border border-[#00f6ff]/30">
                  {profile?.role || "USER"}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {profile?.email} • Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "2026"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Notification Center Bell Popover */}
            <div className="relative" ref={bellRef}>
              <button
                id="header-notification-bell-btn"
                onClick={() => setIsBellOpen(!isBellOpen)}
                className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(0,246,255,0.2)]"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-[#00f6ff]" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-amber-400 to-[#00f6ff] text-black font-extrabold text-[10px] flex items-center justify-center shadow-[0_0_10px_rgba(0,246,255,0.7)] animate-pulse">
                    {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Quick Notification Dropdown */}
              {isBellOpen && (
                <div
                  id="header-notification-dropdown"
                  className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0b101c] border border-white/15 shadow-2xl p-4 z-50 animate-fade-in text-left"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#00f6ff]" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent Alerts</h4>
                      {unreadNotificationsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00f6ff]/20 text-[#00f6ff] font-semibold">
                          {unreadNotificationsCount} new
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={handleMarkAllNotificationsRead}
                          className="text-[11px] text-gray-400 hover:text-emerald-400 font-medium cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scrollbar-thin">
                    {notifications.slice(0, 4).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read) handleMarkNotificationRead(notif.id);
                          if (notif.actionTab) {
                            setActiveTab(notif.actionTab);
                            setIsBellOpen(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                          notif.read
                            ? "bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100"
                            : notif.type === "LOW_BALANCE"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : notif.type === "SECURITY"
                            ? "bg-cyan-500/10 border-cyan-500/30 text-[#00f6ff]"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {notif.type === "LOW_BALANCE" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                          {notif.type === "TRANSFER" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {notif.type === "SECURITY" && <ShieldAlert className="w-3.5 h-3.5 text-[#00f6ff]" />}
                          {notif.type === "BILL_DUE" && <CreditCard className="w-3.5 h-3.5 text-purple-400" />}
                          {notif.type === "SYSTEM" && <Bell className="w-3.5 h-3.5 text-blue-400" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate text-xs">{notif.title}</p>
                          <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5">{notif.message}</p>
                        </div>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <p className="text-xs text-gray-400 py-4 text-center">No alerts at this time.</p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveTab("notifications");
                        setIsBellOpen(false);
                      }}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-xs text-center hover:brightness-110 transition cursor-pointer"
                    >
                      Open Full Notification Center ({notifications.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => loadBankingData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition-all cursor-pointer"
              title="Sync with REST API"
              id="dashboard-sync-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00f6ff] ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Syncing..." : "Live Sync"}</span>
            </button>

            <button
              onClick={() => setActiveTab("transfer")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-semibold text-xs shadow-[0_0_15px_rgba(0,246,255,0.3)] hover:brightness-110 transition-all cursor-pointer"
              id="dashboard-quick-transfer-btn"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Money</span>
            </button>

            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <span>Landing Page</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackNotice && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm animate-fade-in ${
              feedbackNotice.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedbackNotice.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              )}
              <span>{feedbackNotice.msg}</span>
            </div>
            <button
              onClick={() => setFeedbackNotice(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "currency", label: "Currency Exchange", icon: <Globe2 className="w-4 h-4" /> },
            { id: "insights", label: "Spending Insights", icon: <PieChartIcon className="w-4 h-4" /> },
            { id: "accounts", label: "Accounts & Balance", icon: <Wallet className="w-4 h-4" /> },
            { id: "transfer", label: "Transfer Funds", icon: <Send className="w-4 h-4" /> },
            { id: "transactions", label: "Transactions", icon: <History className="w-4 h-4" /> },
            { id: "cards", label: "Cards", icon: <CreditCard className="w-4 h-4" /> },
            { id: "bills", label: "Pay Bills", icon: <Receipt className="w-4 h-4" /> },
            { id: "rewards", label: "Rewards", icon: <Gift className="w-4 h-4" /> },
            {
              id: "notifications",
              label: "Notification Center",
              icon: <Bell className="w-4 h-4" />,
              badge: unreadNotificationsCount,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setFeedbackNotice(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#00f6ff] text-black shadow-[0_0_15px_rgba(0,246,255,0.4)]"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
              id={`dashboard-tab-${tab.id}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id
                      ? "bg-black text-[#00f6ff]"
                      : "bg-gradient-to-r from-amber-400 to-[#00f6ff] text-black shadow-[0_0_8px_rgba(0,246,255,0.5)]"
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Top Stat Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Balance Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#101b30] to-[#0a0f1d] border border-[#00f6ff]/30 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f6ff]/10 rounded-full blur-2xl pointer-events-none" />
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Net Balance</span>
                <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                  ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-[#00f6ff] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> +12.4% this month
                  </span>
                  <span className="text-gray-400">{accounts.length} Active Accounts</span>
                </div>
              </div>

              {/* Active Cards Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#101b30] to-[#0a0f1d] border border-white/10 shadow-xl">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Managed Cards</span>
                <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                  {cards.length} Cards
                </h3>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>Available Credit:</span>
                  <span className="text-white font-semibold">
                    ${cards.reduce((sum, c) => sum + c.availableLimit, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Pending Bills Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#101b30] to-[#0a0f1d] border border-white/10 shadow-xl">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Pending Invoices</span>
                <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                  {bills.filter((b) => b.status === "PENDING").length} Bills
                </h3>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>Due Total:</span>
                  <span className="text-amber-400 font-semibold">
                    ${bills.filter((b) => b.status === "PENDING").reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Reward Points Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#101b30] to-[#0a0f1d] border border-white/10 shadow-xl">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">HooBank Rewards</span>
                <h3 className="text-3xl font-extrabold text-[#00f6ff] mt-2 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#00f6ff]" />
                  <span>{reward.points} PTS</span>
                </h3>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>Tier: Platinum VIP</span>
                  <span className="text-[#00f6ff] font-semibold">Redeemable</span>
                </div>
              </div>
            </div>

            {/* Spending Insights Widget on Overview */}
            <SpendingInsights
              transactions={transactions}
              bills={bills}
              onNavigateToTransactions={() => setActiveTab("transactions")}
              onNavigateToBills={() => setActiveTab("bills")}
            />

            {/* Real-time Currency Converter on Overview */}
            <CurrencyConverter
              accounts={accounts}
              compact
              onApplyTransfer={handleApplyTransfer}
            />

            {/* Middle Section: Quick Actions & Primary Accounts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Accounts List */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-[#00f6ff]" />
                    <span>Your Connected Accounts</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("accounts")}
                    className="text-xs text-[#00f6ff] hover:underline"
                  >
                    Manage All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold text-gray-300 tracking-wider">
                          {acc.accountType}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <p className="font-mono text-xs text-gray-400 mt-3">{acc.accountNumber}</p>
                      <h4 className="text-2xl font-bold text-white mt-1">
                        ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </h4>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-emerald-400">Instant Transfers Enabled</span>
                        <button
                          onClick={() => {
                            setTransferSenderAccId(acc.id);
                            setActiveTab("transfer");
                          }}
                          className="text-[#00f6ff] hover:underline font-semibold"
                        >
                          Transfer →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Primary Card Graphic */}
                {cards.length > 0 && (
                  <div className="mt-4 p-6 rounded-3xl bg-gradient-to-r from-[#121626] via-[#1a233e] to-[#0e2738] border border-[#00f6ff]/30 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#00f6ff]" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                          Primary Virtual Card
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#00f6ff]">{cards[0].cardType}</span>
                    </div>
                    <p className="font-mono text-xl tracking-widest text-white">{cards[0].maskedNumber}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-300">
                      <div>
                        <span className="text-[10px] text-gray-400 block">CARD HOLDER</span>
                        <span className="font-semibold text-white">{cards[0].cardHolder || profile?.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">EXPIRES</span>
                        <span className="font-semibold text-white">{cards[0].expiry || "08/28"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">AVAILABLE CREDIT</span>
                        <span className="font-semibold text-[#00f6ff]">${cards[0].availableLimit.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Transactions Widget */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-[#00f6ff]" />
                    <span>Real-Time Activity</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="text-xs text-[#00f6ff] hover:underline"
                  >
                    View All ({transactions.length})
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            tx.type === "CREDIT"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {tx.type === "CREDIT" ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-[160px]">
                            {tx.type === "CREDIT" ? tx.sender.name : tx.receiver.name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[150px]">
                            {tx.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-xs sm:text-sm font-bold ${
                            tx.type === "CREDIT" ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {tx.type === "CREDIT" ? "+" : "-"}${tx.amount.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  {transactions.length === 0 && (
                    <p className="text-xs text-gray-400 p-6 text-center bg-white/[0.02] rounded-2xl">
                      No transaction history found. Send a transfer to see real-time updates.
                    </p>
                  )}
                </div>

                {/* Notifications & Security Feed Widget */}
                <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#070b14] border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#00f6ff]" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">System & Security Alerts</h4>
                    </div>
                    <button
                      onClick={() => setActiveTab("notifications")}
                      className="text-xs text-[#00f6ff] hover:underline cursor-pointer"
                    >
                      Open Center ({notifications.length})
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read) handleMarkNotificationRead(n.id);
                          if (n.actionTab) setActiveTab(n.actionTab);
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start gap-3 ${
                          n.read
                            ? "bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100"
                            : n.type === "LOW_BALANCE"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : n.type === "SECURITY"
                            ? "bg-[#00f6ff]/10 border-[#00f6ff]/30 text-[#00f6ff]"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.type === "LOW_BALANCE" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          {n.type === "TRANSFER" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {n.type === "SECURITY" && <ShieldAlert className="w-4 h-4 text-[#00f6ff]" />}
                          {n.type === "BILL_DUE" && <CreditCard className="w-4 h-4 text-purple-400" />}
                          {n.type === "SYSTEM" && <Bell className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-white truncate text-xs">{n.title}</p>
                            <span className="text-[10px] text-gray-500">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-2">No active alerts.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CURRENCY & FX */}
        {activeTab === "currency" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-[#00f6ff]" />
                  <span>Real-Time Currency Exchange & International Rails</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Live interbank market feeds, transparent 0.25% FX fee, and instant payment calculator
                </p>
              </div>
            </div>

            <CurrencyConverter
              accounts={accounts}
              onApplyTransfer={handleApplyTransfer}
            />
          </div>
        )}

        {/* TAB 3: SPENDING INSIGHTS */}
        {activeTab === "insights" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-[#00f6ff]" />
                  <span>Spending Insights & Analytics</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Real-time algorithmic breakdown of debits, bills, and categorical cash outflow
                </p>
              </div>
            </div>

            <SpendingInsights
              transactions={transactions}
              bills={bills}
              onNavigateToTransactions={() => setActiveTab("transactions")}
              onNavigateToBills={() => setActiveTab("bills")}
            />
          </div>
        )}

        {/* TAB 4: ACCOUNTS & BALANCE */}
        {activeTab === "accounts" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Accounts & Balances</h3>
                <p className="text-xs text-gray-400">
                  Full list of savings and checking accounts registered with HooBank REST API
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-6 rounded-3xl bg-[#0e1424] border border-white/10 shadow-2xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full bg-[#00f6ff]/10 text-[#00f6ff] text-xs font-semibold border border-[#00f6ff]/30">
                        {acc.accountType} ACCOUNT
                      </span>
                      <span className="text-xs text-emerald-400 font-mono">STATUS: ACTIVE</span>
                    </div>
                    <span className="text-xs text-gray-400">Account Number</span>
                    <p className="font-mono text-lg font-bold text-white tracking-wider mt-0.5">
                      {acc.accountNumber}
                    </p>
                    <div className="mt-6">
                      <span className="text-xs text-gray-400">Available Balance</span>
                      <h2 className="text-4xl font-black text-white mt-1">
                        ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setTransferSenderAccId(acc.id);
                        setActiveTab("transfer");
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#00f6ff] text-black font-bold text-xs hover:brightness-110 transition-all cursor-pointer text-center"
                    >
                      Transfer from this Account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: TRANSFER FUNDS */}
        {activeTab === "transfer" && (
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-[#0e1424] border border-white/15 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00f6ff]/10 border border-[#00f6ff]/30 flex items-center justify-center text-[#00f6ff]">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Transfer Funds</h3>
                  <p className="text-xs text-gray-400">Instant domestic & international cross-border transfer</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("currency")}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#00f6ff] font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Calculate FX Rate</span>
              </button>
            </div>

            {/* Applied FX Quote Banner if present */}
            {appliedFxQuote && (
              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#00f6ff]/15 via-emerald-500/10 to-[#00f6ff]/15 border border-[#00f6ff]/30 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#00f6ff] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Guaranteed International Exchange Rate Applied
                    </span>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Sending <strong className="text-white">${appliedFxQuote.sourceAmount.toLocaleString()} {appliedFxQuote.sourceCurrency}</strong> → Recipient gets <strong className="text-[#00f6ff]">{appliedFxQuote.targetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {appliedFxQuote.targetCurrency}</strong> (Rate: 1 {appliedFxQuote.sourceCurrency} = {appliedFxQuote.exchangeRate.toFixed(4)} {appliedFxQuote.targetCurrency})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedFxQuote(null)}
                  className="text-xs text-gray-400 hover:text-white underline cursor-pointer shrink-0"
                >
                  Clear FX
                </button>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="mt-2 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Select Source Account
                </label>
                <select
                  required
                  value={transferSenderAccId}
                  onChange={(e) => setTransferSenderAccId(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] transition-all cursor-pointer"
                  id="transfer-source-select"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-[#0e1424] text-white">
                      {acc.accountType} - {acc.accountNumber} (Bal: ${acc.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Recipient Account Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC0000000002 or AC0000000099"
                  value={transferReceiverAcc}
                  onChange={(e) => setTransferReceiverAcc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-[#00f6ff] transition-all"
                  id="transfer-receiver-input"
                />
                <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
                  <span>Quick demo recipients:</span>
                  <button
                    type="button"
                    onClick={() => setTransferReceiverAcc("AC0000000002")}
                    className="text-[#00f6ff] underline"
                  >
                    AC0000000002
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setTransferReceiverAcc("AC0000000099")}
                    className="text-[#00f6ff] underline"
                  >
                    HooBank Global (AC0000000099)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Transfer Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold focus:outline-none focus:border-[#00f6ff] transition-all"
                  id="transfer-amount-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Consulting payment, rent, dinner share"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] transition-all"
                  id="transfer-desc-input"
                />
              </div>

              <button
                type="submit"
                disabled={transferSubmitting}
                className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-sm shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="transfer-submit-btn"
              >
                {transferSubmitting ? (
                  <span>Executing Transfer...</span>
                ) : (
                  <>
                    <span>Confirm & Send Payment</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: TRANSACTIONS HISTORY */}
        {activeTab === "transactions" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Transactions Ledger</h3>
                <p className="text-xs text-gray-400">All debit and credit transactions with atomic settlement</p>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#00f6ff]"
                  />
                </div>

                <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <button
                    onClick={() => setTxFilter("ALL")}
                    className={`px-3 py-1 rounded-lg ${txFilter === "ALL" ? "bg-[#00f6ff] text-black font-bold" : "text-gray-400"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTxFilter("DEBIT")}
                    className={`px-3 py-1 rounded-lg ${txFilter === "DEBIT" ? "bg-[#00f6ff] text-black font-bold" : "text-gray-400"}`}
                  >
                    Debits
                  </button>
                  <button
                    onClick={() => setTxFilter("CREDIT")}
                    className={`px-3 py-1 rounded-lg ${txFilter === "CREDIT" ? "bg-[#00f6ff] text-black font-bold" : "text-gray-400"}`}
                  >
                    Credits
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#0e1424] border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-gray-400 uppercase tracking-wider font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-4 px-6">ID & Date</th>
                      <th className="py-4 px-6">Sender</th>
                      <th className="py-4 px-6">Recipient</th>
                      <th className="py-4 px-6">Description</th>
                      <th className="py-4 px-6 text-right">Amount</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-200">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-mono text-white font-semibold">#{tx.id}</p>
                          <p className="text-[10px] text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-white">{tx.sender.name}</p>
                          <p className="font-mono text-[10px] text-gray-400">{tx.sender.accountNumber}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-white">{tx.receiver.name}</p>
                          <p className="font-mono text-[10px] text-gray-400">{tx.receiver.accountNumber}</p>
                        </td>
                        <td className="py-4 px-6 text-gray-300">{tx.description}</td>
                        <td className="py-4 px-6 text-right">
                          <span
                            className={`font-mono text-sm font-bold ${
                              tx.type === "CREDIT" ? "text-emerald-400" : "text-white"
                            }`}
                          >
                            {tx.type === "CREDIT" ? "+" : "-"}${tx.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No matching transactions found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CARDS */}
        {activeTab === "cards" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-white">Cards & Credit Limits</h3>
              <p className="text-xs text-gray-400">Virtual & physical payment cards attached to your user ID</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="relative aspect-[1.586] min-h-[250px] overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-[#131b2e] to-[#0a1020] border border-[#00f6ff]/30 shadow-2xl flex flex-col justify-between"
                >
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                    <div className="absolute -top-16 -right-10 h-40 w-80 rotate-[-10deg] rounded-3xl border border-cyan-300/10 bg-cyan-300/[0.03]" />
                    <div className="absolute -bottom-24 -left-8 h-48 w-96 rotate-[-8deg] rounded-3xl border border-indigo-300/10 bg-indigo-300/[0.04]" />
                    <div className="absolute -right-16 top-8 h-64 w-64 rounded-full border border-cyan-300/10" />
                    <div className="absolute -right-4 top-20 h-48 w-48 rounded-full border border-cyan-300/[0.06]" />
                  </div>

                  <img
                    src={card.id === 1 ? "/cards/bob-debit.png" : "/cards/sbi-rupay.png"}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                    onLoad={(event) => { event.currentTarget.style.opacity = "0.95"; }}
                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full bg-white/10 text-[#00f6ff] text-xs font-semibold">
                        {card.cardType}
                      </span>
                      <span className="text-xs text-emerald-400">● Active</span>
                    </div>

                    <p className="font-mono text-2xl tracking-widest text-white my-4">
                      {card.maskedNumber}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <div>
                        <span className="text-[10px] text-gray-400 block">CARD HOLDER</span>
                        <span className="font-semibold text-white">{card.cardHolder || profile?.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">EXPIRY</span>
                        <span className="font-semibold text-white">{card.expiry || "09/29"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-400">Available Credit</span>
                      <span className="font-bold text-[#00f6ff]">${card.availableLimit.toFixed(2)} / ${card.creditLimit.toFixed(2)}</span>
                    </div>
                    {/* Progress limit bar */}
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] rounded-full"
                        style={{
                          width: `${Math.min(100, (card.availableLimit / Math.max(1, card.creditLimit)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {!loading && cards.length === 0 && (
                <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-[#0e1424] to-[#060a14] border border-white/10 overflow-hidden">
                  {/* Enhanced Empty State */}
                  <div className="relative p-12 text-center">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#00f6ff] rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#33bbcf] rounded-full blur-3xl"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Card Icon */}
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00f6ff]/20 to-[#33bbcf]/20 border border-[#00f6ff]/30 mb-6">
                        <CreditCard className="w-10 h-10 text-[#00f6ff]" />
                      </div>

                      {/* Title & Description */}
                      <h4 className="text-xl font-bold text-white mb-3">No Cards Available</h4>
                      <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">
                        You don't have any payment cards yet. Request a virtual or physical card to start making purchases with enhanced security and rewards.
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                          onClick={() => setShowCardRequestModal(true)}
                          className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-semibold text-sm shadow-lg hover:shadow-[0_0_30px_rgba(0,246,255,0.5)] transition-all duration-300 hover:scale-105"
                        >
                          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                          Request New Card
                        </button>
                        
                        <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-medium text-sm transition-all">
                          <HelpCircle className="w-4 h-4" />
                          Learn More
                        </button>
                      </div>

                      {/* Features List */}
                      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00f6ff]/10 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-[#00f6ff]" />
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-white mb-1">Secure Payments</h5>
                            <p className="text-xs text-gray-500">Bank-grade encryption</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00f6ff]/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-[#00f6ff]" />
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-white mb-1">Instant Approval</h5>
                            <p className="text-xs text-gray-500">Get started in minutes</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00f6ff]/10 flex items-center justify-center">
                            <Gift className="w-4 h-4 text-[#00f6ff]" />
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-white mb-1">Earn Rewards</h5>
                            <p className="text-xs text-gray-500">Cashback on purchases</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: BILLS & UTILITIES */}
        {activeTab === "bills" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Bills & Utility Payments</h3>
                <p className="text-xs text-gray-400">Pay utility bills seamlessly with automatic balance deduction</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAddBillModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-semibold text-sm shadow-lg hover:shadow-[0_0_20px_rgba(0,246,255,0.4)] transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Add Bill
                </button>
                
                <button 
                  onClick={() => {
                    setBillHistoryMode(false);
                    setShowBillPaymentModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-medium text-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                  Pay Bill
                </button>

                <button 
                  onClick={() => {
                    setBillHistoryMode(true);
                    setShowBillPaymentModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-medium text-sm transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Bill History
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-6 rounded-3xl bg-[#0e1424] border border-white/10 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase">{bill.billType}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          bill.status === "PAID"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white">{bill.provider}</h4>
                    <p className="text-xs text-gray-400 mt-1">Due by {bill.dueDate}</p>

                    <h2 className="text-3xl font-extrabold text-white mt-4">
                      ${bill.amount.toFixed(2)}
                    </h2>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    {bill.status === "PENDING" ? (
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-xs hover:brightness-110 transition-all cursor-pointer text-center"
                      >
                        Pay Bill Now
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Paid & Settled</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!loading && bills.length === 0 && (
                <div className="md:col-span-3 rounded-3xl bg-gradient-to-br from-[#0e1424] to-[#060a14] border border-white/10 overflow-hidden">
                  {/* Enhanced Bills Empty State */}
                  <div className="relative p-12 text-center">
                    {/* Background decoration */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#00f6ff] rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#33bbcf] rounded-full blur-3xl"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Receipt Icon */}
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00f6ff]/20 to-[#33bbcf]/20 border border-[#00f6ff]/30 mb-6">
                        <Receipt className="w-10 h-10 text-[#00f6ff]" />
                      </div>

                      {/* Title & Description */}
                      <h4 className="text-xl font-bold text-white mb-3">No Bills to Pay</h4>
                      <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">
                        You don't have any pending bills. Add your utility bills to pay them seamlessly with automatic balance deduction and earn rewards.
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                        <button 
                          onClick={() => setShowAddBillModal(true)}
                          className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-semibold text-sm shadow-lg hover:shadow-[0_0_30px_rgba(0,246,255,0.5)] transition-all duration-300 hover:scale-105"
                        >
                          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                          Add New Bill
                        </button>
                        
                        <button 
                          onClick={() => {
                            setBillHistoryMode(true);
                            setShowBillPaymentModal(true);
                          }}
                          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-medium text-sm transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          Bill History
                        </button>

                        <button 
                          onClick={() => {
                            setBillHistoryMode(false);
                            setShowBillPaymentModal(true);
                          }}
                          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-medium text-sm transition-all"
                        >
                          <Send className="w-4 h-4" />
                          Pay Bill
                        </button>
                      </div>

                      {/* Popular Bill Categories */}
                      <div className="mb-10">
                        <h5 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Popular Bill Categories</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <button 
                            onClick={() => {
                              setNewBillType("ELECTRICITY");
                              setShowAddBillModal(true);
                            }}
                            className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
                          >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                              <Zap className="w-6 h-6 text-yellow-400" />
                            </div>
                            <p className="text-xs font-medium text-white">Electricity</p>
                          </button>

                          <button 
                            onClick={() => {
                              setNewBillType("WATER");
                              setShowAddBillModal(true);
                            }}
                            className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
                          >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                              <Droplet className="w-6 h-6 text-blue-400" />
                            </div>
                            <p className="text-xs font-medium text-white">Water</p>
                          </button>

                          <button 
                            onClick={() => {
                              setNewBillType("INTERNET");
                              setShowAddBillModal(true);
                            }}
                            className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
                          >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                              <Wifi className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="text-xs font-medium text-white">Internet</p>
                          </button>

                          <button 
                            onClick={() => {
                              setNewBillType("MOBILE");
                              setShowAddBillModal(true);
                            }}
                            className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
                          >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                              <Smartphone className="w-6 h-6 text-green-400" />
                            </div>
                            <p className="text-xs font-medium text-white">Mobile</p>
                          </button>
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00f6ff]/10 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-[#00f6ff]" />
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-white mb-1">Auto-Pay</h5>
                            <p className="text-xs text-gray-500">Set & forget payments</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00f6ff]/10 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-[#00f6ff]" />
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-white mb-1">Reminders</h5>
                            <p className="text-xs text-gray-500">Never miss due dates</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#00f6ff]/10 flex items-center justify-center">
                            <Gift className="w-4 h-4 text-[#00f6ff]" />
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-white mb-1">Earn Points</h5>
                            <p className="text-xs text-gray-500">Rewards on payments</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bill Payment Modal */}
            {selectedBill && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="relative w-full max-w-md rounded-3xl bg-[#0e1424] border border-white/15 p-6 shadow-2xl">
                  <h3 className="text-lg font-bold text-white mb-1">Pay Utility Bill</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Confirm payment of ${selectedBill.amount.toFixed(2)} to {selectedBill.provider}
                  </p>

                  <form onSubmit={handleBillPayment} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Pay from Account</label>
                      <select
                        required
                        value={billPayAccountId}
                        onChange={(e) => setBillPayAccountId(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff]"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id} className="bg-[#0e1424] text-white">
                            {acc.accountType} - ${acc.balance.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedBill(null)}
                        className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={billPaying}
                        className="flex-1 py-2.5 rounded-xl bg-[#00f6ff] text-black font-bold text-xs hover:brightness-110"
                      >
                        {billPaying ? "Paying..." : "Confirm Payment"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: REWARDS */}
        {activeTab === "rewards" && (
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-[#0e1424] border border-white/15 shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#33bbcf] to-[#def9fa] p-[2px] mx-auto mb-4 shadow-[0_0_25px_rgba(0,246,255,0.4)]">
              <div className="w-full h-full bg-[#00040f] rounded-full flex items-center justify-center text-[#00f6ff]">
                <Gift className="w-8 h-8" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white">HooBank Rewards Club</h3>
            <p className="text-xs text-gray-400 mt-1">Earn 1 point for every $10 transferred and 5 points per bill payment.</p>

            <div className="my-8 p-6 rounded-2xl bg-white/5 border border-white/10 max-w-sm mx-auto">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Current Points</span>
              <h1 className="text-5xl font-black text-[#00f6ff] mt-2">{reward.points}</h1>
              <p className="text-xs text-gray-300 mt-2">Value: ${(reward.points * 0.05).toFixed(2)} USD Cashback</p>
            </div>

            <button
              onClick={() => alert(`Congratulations! You have redeemed ${reward.points} points for cashback credit.`)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-sm shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 transition-all cursor-pointer"
            >
              Redeem Points for Cashback
            </button>
          </div>
        )}

        {/* TAB 8: NOTIFICATION CENTER */}
        {activeTab === "notifications" && (
          <NotificationCenter
            notifications={notifications}
            unreadCount={unreadNotificationsCount}
            onMarkAsRead={handleMarkNotificationRead}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onDeleteNotification={handleDeleteNotification}
            onClearAll={handleClearAllNotifications}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSimulate={handleSimulateNotification}
          />
        )}
      </div>

      {/* Card Request Modal */}
      {showCardRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0e1424] border border-white/15 shadow-2xl p-6 animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setShowCardRequestModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#00f6ff]/10 border border-[#00f6ff]/30 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[#00f6ff]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Request New Card</h3>
                <p className="text-xs text-gray-400">Choose your card type</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCardRequest} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Card Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCardRequestType("DEBIT")}
                    className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
                      cardRequestType === "DEBIT"
                        ? "bg-[#00f6ff]/10 border-[#00f6ff] text-[#00f6ff]"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-2" />
                    Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardRequestType("CREDIT")}
                    className={`p-4 rounded-xl border text-sm font-semibold transition-all ${
                      cardRequestType === "CREDIT"
                        ? "bg-[#00f6ff]/10 border-[#00f6ff] text-[#00f6ff]"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-2" />
                    Credit Card
                  </button>
                </div>
              </div>

              {/* Card Features */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-xs font-semibold text-white mb-3">Features</h4>
                <div className="flex flex-col gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Instant virtual card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Physical card in 3-5 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Worldwide acceptance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Earn rewards on every purchase</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCardRequestModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cardRequestSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-sm shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {cardRequestSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0e1424] border border-white/15 shadow-2xl p-6 animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setShowAddBillModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#00f6ff]/10 border border-[#00f6ff]/30 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-[#00f6ff]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add New Bill</h3>
                <p className="text-xs text-gray-400">Set up automatic payment</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddBill} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Bill Type
                </label>
                <select
                  required
                  value={newBillType}
                  onChange={(e) => setNewBillType(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] transition-all"
                >
                  <option value="ELECTRICITY" className="bg-[#0e1424]">Electricity</option>
                  <option value="WATER" className="bg-[#0e1424]">Water</option>
                  <option value="INTERNET" className="bg-[#0e1424]">Internet</option>
                  <option value="GAS" className="bg-[#0e1424]">Gas</option>
                  <option value="MOBILE" className="bg-[#0e1424]">Mobile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Service Provider
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City Power, AT&T, Verizon"
                  value={newBillProvider}
                  onChange={(e) => setNewBillProvider(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Bill Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={newBillDueDate}
                  onChange={(e) => setNewBillDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] transition-all"
                />
              </div>

              {/* Info Note */}
              <div className="p-3 rounded-xl bg-[#00f6ff]/5 border border-[#00f6ff]/20 text-xs text-gray-400">
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-[#00f6ff] mt-0.5 flex-shrink-0" />
                  <span>You'll receive reminders before the due date and earn rewards points when you pay through HooBank.</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBillModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBillSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-sm shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {addBillSubmitting ? "Adding..." : "Add Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Payment & History Modal */}
      {showBillPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0e1424] border border-white/15 shadow-2xl p-6 max-h-[80vh] overflow-y-auto animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowBillPaymentModal(false);
                setSelectedBill(null);
              }}
              className="sticky top-0 right-0 float-right p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mode Tabs */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setBillHistoryMode(false)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  !billHistoryMode
                    ? "bg-[#00f6ff] text-black shadow-[0_0_20px_rgba(0,246,255,0.3)]"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <Send className="w-4 h-4 inline mr-2" />
                Pay Bill
              </button>
              <button
                onClick={() => setBillHistoryMode(true)}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  billHistoryMode
                    ? "bg-[#00f6ff] text-black shadow-[0_0_20px_rgba(0,246,255,0.3)]"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Bill History
              </button>
            </div>

            {/* PAY BILL MODE */}
            {!billHistoryMode ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#00f6ff]/10 border border-[#00f6ff]/30 flex items-center justify-center">
                    <Send className="w-6 h-6 text-[#00f6ff]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Pay Your Bills</h3>
                    <p className="text-xs text-gray-400">Select a pending bill and pay it now</p>
                  </div>
                </div>

                {/* Pending Bills List */}
                {bills.filter(b => b.status === "PENDING").length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {bills.filter(b => b.status === "PENDING").map((bill) => (
                      <button
                        key={bill.id}
                        onClick={() => setSelectedBill(bill)}
                        className={`w-full p-4 rounded-xl border transition-all text-left ${
                          selectedBill?.id === bill.id
                            ? "bg-[#00f6ff]/10 border-[#00f6ff] shadow-[0_0_15px_rgba(0,246,255,0.3)]"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{bill.provider}</p>
                            <p className="text-xs text-gray-400">{bill.billType} • Due: {bill.dueDate}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#00f6ff]">${bill.amount.toFixed(2)}</p>
                            <p className="text-xs text-amber-300">{bill.status}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center mb-6">
                    <p className="text-sm text-gray-400">No pending bills to pay.</p>
                  </div>
                )}

                {/* Payment Form */}
                {selectedBill && (
                  <form
                    onSubmit={handleBillPayment}
                    className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Pay from Account
                      </label>
                      <select
                        required
                        value={billPayAccountId}
                        onChange={(e) => setBillPayAccountId(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] transition-all"
                      >
                        <option value="" className="bg-[#0e1424]">Select Account</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id} className="bg-[#0e1424]">
                            {acc.accountType} - {acc.accountNumber} (${acc.balance.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-[#00f6ff]/5 border border-[#00f6ff]/20">
                      <p className="text-xs text-gray-400 mb-2">Bill Summary:</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">{selectedBill.provider}</span>
                        <span className="font-bold text-[#00f6ff]">${selectedBill.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Rewards Earned</span>
                        <span className="text-amber-300">+{Math.max(5, Math.floor(selectedBill.amount / 5))} pts</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={billPaying || !billPayAccountId}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-sm shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      {billPaying ? "Processing Payment..." : "Pay Bill Now"}
                    </button>
                  </form>
                )}
              </>
            ) : (
              // BILL HISTORY MODE
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#00f6ff]/10 border border-[#00f6ff]/30 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#00f6ff]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Bill History</h3>
                    <p className="text-xs text-gray-400">View all your bills (paid and pending)</p>
                  </div>
                </div>

                {bills.length > 0 ? (
                  <div className="space-y-3">
                    {bills.map((bill) => (
                      <div
                        key={bill.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                bill.status === "PAID"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-amber-500/15 text-amber-400"
                              }`}
                            >
                              {bill.status === "PAID" ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <AlertTriangle className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{bill.provider}</p>
                              <p className="text-xs text-gray-400">{bill.billType}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">${bill.amount.toFixed(2)}</p>
                            <p
                              className={`text-xs font-semibold ${
                                bill.status === "PAID" ? "text-emerald-400" : "text-amber-300"
                              }`}
                            >
                              {bill.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 px-13">
                          <span>Due: {bill.dueDate}</span>
                          <span>ID: #{bill.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-sm text-gray-400">No bills found.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
