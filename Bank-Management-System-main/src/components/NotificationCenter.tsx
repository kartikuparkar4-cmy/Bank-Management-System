import React, { useState } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  CreditCard,
  Trash2,
  CheckCheck,
  Filter,
  Sparkles,
  Clock,
  ArrowRight,
  Send,
  Zap,
  RotateCcw,
  Check,
} from "lucide-react";
import { BankNotification, NotificationType, NotificationSeverity } from "../types";

interface NotificationCenterProps {
  notifications: BankNotification[];
  unreadCount: number;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: number) => void;
  onClearAll: () => void;
  onNavigateTab: (tab: "overview" | "accounts" | "transfer" | "transactions" | "cards" | "bills" | "rewards") => void;
  onSimulate: (
    type: NotificationType,
    title: string,
    message: string,
    severity: NotificationSeverity,
    actionTab?: "overview" | "accounts" | "transfer" | "transactions" | "cards" | "bills" | "rewards",
    actionLabel?: string
  ) => Promise<void>;
  loading?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onNavigateTab,
  onSimulate,
  loading = false,
}) => {
  const [filterType, setFilterType] = useState<"ALL" | "UNREAD" | NotificationType>("ALL");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simType, setSimType] = useState<"LOW_BALANCE" | "TRANSFER" | "SECURITY">("LOW_BALANCE");
  const [showSimulateDrawer, setShowSimulateDrawer] = useState(false);

  // Filtered notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filterType === "ALL") return true;
    if (filterType === "UNREAD") return !notif.read;
    return notif.type === filterType;
  });

  const getSeverityStyle = (severity: NotificationSeverity, type: NotificationType) => {
    switch (type) {
      case "LOW_BALANCE":
        return {
          badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          iconBg: "from-amber-500/20 to-amber-700/10 text-amber-400 border-amber-500/30",
          glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
        };
      case "TRANSFER":
        return {
          badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          iconBg: "from-emerald-500/20 to-teal-700/10 text-emerald-400 border-emerald-500/30",
          glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
        };
      case "SECURITY":
        return {
          badgeBg: "bg-[#00f6ff]/10 text-[#00f6ff] border-[#00f6ff]/30",
          iconBg: "from-[#00f6ff]/20 to-blue-700/10 text-[#00f6ff] border-[#00f6ff]/30",
          glow: "shadow-[0_0_15px_rgba(0,246,255,0.15)]",
          icon: <ShieldAlert className="w-5 h-5 text-[#00f6ff] shrink-0" />,
        };
      case "BILL_DUE":
        return {
          badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          iconBg: "from-purple-500/20 to-indigo-700/10 text-purple-400 border-purple-500/30",
          glow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
          icon: <CreditCard className="w-5 h-5 text-purple-400 shrink-0" />,
        };
      default:
        return {
          badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          iconBg: "from-blue-500/20 to-cyan-700/10 text-blue-400 border-blue-500/30",
          glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
          icon: <Bell className="w-5 h-5 text-blue-400 shrink-0" />,
        };
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffSec < 60) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDays === 1) return "Yesterday";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const handleSimulateAlert = async (preset: "LOW_BALANCE" | "TRANSFER" | "SECURITY") => {
    setIsSimulating(true);
    try {
      if (preset === "LOW_BALANCE") {
        await onSimulate(
          "LOW_BALANCE",
          "Low Balance Alert: Savings Account",
          "Your Savings Account (AC0000000001) balance has dropped below the $1,000 threshold. Available balance: $420.50.",
          "warning",
          "transfer",
          "Add Funds Now"
        );
      } else if (preset === "TRANSFER") {
        await onSimulate(
          "TRANSFER",
          "Incoming Wire Transfer: +$3,450.00",
          "A wire transfer of $3,450.00 from Stripe Global Payments has cleared into your Current Account.",
          "success",
          "transactions",
          "View Transaction"
        );
      } else if (preset === "SECURITY") {
        await onSimulate(
          "SECURITY",
          "Security Update: Device Authorization",
          "A new login session was authenticated from Chrome on macOS (IP: 142.250.190.46). 2FA verification passed.",
          "info",
          "overview",
          "Security Settings"
        );
      }
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div id="notification-center-container" className="flex flex-col gap-6 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-[#0e1424] via-[#0b101c] to-[#0e1424] border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00f6ff]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#33bbcf] to-[#def9fa] p-[2px] shadow-[0_0_20px_rgba(0,246,255,0.3)]">
              <div className="w-full h-full bg-[#00040f] rounded-2xl flex items-center justify-center text-[#00f6ff]">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">HooBank Notification Center</h2>
                {unreadCount > 0 ? (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black shadow-[0_0_10px_rgba(0,246,255,0.4)]">
                    {unreadCount} Unread
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    All Caught Up
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                Real-time security telemetry, balance threshold warnings, transfer ledger receipts, and bill alerts.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              id="simulate-alert-toggle-btn"
              onClick={() => setShowSimulateDrawer(!showSimulateDrawer)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-[#00f6ff] border border-[#00f6ff]/30 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(0,246,255,0.2)]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Alert</span>
            </button>

            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/10 transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark All Read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                id="clear-all-notifs-btn"
                onClick={onClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 border border-red-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Simulator Test Tray */}
        {showSimulateDrawer && (
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white/[0.02] p-4 rounded-2xl animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00f6ff]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Test Alert Dispatcher:</span>
              <span className="text-xs text-gray-400">Trigger live notifications to test telemetry & badge sync</span>
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
              <button
                id="sim-low-balance-btn"
                disabled={isSimulating}
                onClick={() => handleSimulateAlert("LOW_BALANCE")}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-medium transition cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Low Balance</span>
              </button>

              <button
                id="sim-transfer-btn"
                disabled={isSimulating}
                onClick={() => handleSimulateAlert("TRANSFER")}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Wire Transfer</span>
              </button>

              <button
                id="sim-security-btn"
                disabled={isSimulating}
                onClick={() => handleSimulateAlert("SECURITY")}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-[#00f6ff] text-xs font-medium transition cursor-pointer"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Security Notice</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-2">
          <button
            id="filter-all"
            onClick={() => setFilterType("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterType === "ALL"
                ? "bg-[#00f6ff] text-black shadow-[0_0_15px_rgba(0,246,255,0.4)]"
                : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10"
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            id="filter-unread"
            onClick={() => setFilterType("UNREAD")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterType === "UNREAD"
                ? "bg-[#00f6ff] text-black shadow-[0_0_15px_rgba(0,246,255,0.4)]"
                : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10"
            }`}
          >
            Unread ({unreadCount})
          </button>

          <button
            id="filter-low-balance"
            onClick={() => setFilterType("LOW_BALANCE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterType === "LOW_BALANCE"
                ? "bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] font-bold"
                : "bg-white/5 hover:bg-white/10 text-amber-400/80 hover:text-amber-400 border border-white/10"
            }`}
          >
            ⚠️ Low Balance
          </button>

          <button
            id="filter-transfers"
            onClick={() => setFilterType("TRANSFER")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterType === "TRANSFER"
                ? "bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] font-bold"
                : "bg-white/5 hover:bg-white/10 text-emerald-400/80 hover:text-emerald-400 border border-white/10"
            }`}
          >
            💸 Transfers
          </button>

          <button
            id="filter-security"
            onClick={() => setFilterType("SECURITY")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterType === "SECURITY"
                ? "bg-[#00f6ff] text-black shadow-[0_0_15px_rgba(0,246,255,0.4)] font-bold"
                : "bg-white/5 hover:bg-white/10 text-[#00f6ff]/80 hover:text-[#00f6ff] border border-white/10"
            }`}
          >
            🛡️ Security
          </button>

          <button
            id="filter-bills"
            onClick={() => setFilterType("BILL_DUE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              filterType === "BILL_DUE"
                ? "bg-purple-400 text-black shadow-[0_0_15px_rgba(168,85,247,0.4)] font-bold"
                : "bg-white/5 hover:bg-white/10 text-purple-400/80 hover:text-purple-400 border border-white/10"
            }`}
          >
            🧾 Bills
          </button>
        </div>
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0e1424] border border-white/10 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-4">
            <Check className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white">No notifications found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {filterType === "ALL"
              ? "You're all caught up! New account alerts, transfers, and security updates will appear here."
              : `No notifications matching the "${filterType}" filter.`}
          </p>
          <button
            onClick={() => handleSimulateAlert("LOW_BALANCE")}
            className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-[#00f6ff] transition cursor-pointer"
          >
            Simulate a Test Notification
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredNotifications.map((notif) => {
            const style = getSeverityStyle(notif.severity, notif.type);

            return (
              <div
                key={notif.id}
                id={`notification-item-${notif.id}`}
                className={`relative group p-4 md:p-5 rounded-2xl transition-all border ${
                  notif.read
                    ? "bg-[#0e1424]/60 border-white/5 opacity-80 hover:opacity-100 hover:border-white/15"
                    : `bg-[#0e1424] border-white/15 ${style.glow} hover:border-[#00f6ff]/40`
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon Indicator */}
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.iconBg} border flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${style.badgeBg}`}>
                          {notif.type.replace("_", " ")}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate max-w-md">{notif.title}</h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#00f6ff] shadow-[0_0_8px_rgba(0,246,255,0.8)] shrink-0 animate-pulse"></span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px] shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(notif.createdAt)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">{notif.message}</p>

                    {/* Footer Actions */}
                    <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {notif.actionTab && (
                          <button
                            id={`notif-action-${notif.id}`}
                            onClick={() => {
                              if (!notif.read) onMarkAsRead(notif.id);
                              if (notif.actionTab) onNavigateTab(notif.actionTab);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00f6ff]/10 hover:bg-[#00f6ff]/20 text-[#00f6ff] text-xs font-semibold border border-[#00f6ff]/30 transition cursor-pointer"
                          >
                            <span>{notif.actionLabel || "View Details"}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {!notif.read && (
                          <button
                            id={`notif-mark-read-${notif.id}`}
                            onClick={() => onMarkAsRead(notif.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-emerald-400 px-2 py-1 rounded-md hover:bg-white/5 transition cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark as read</span>
                          </button>
                        )}
                      </div>

                      <button
                        id={`notif-delete-${notif.id}`}
                        onClick={() => onDeleteNotification(notif.id)}
                        className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
