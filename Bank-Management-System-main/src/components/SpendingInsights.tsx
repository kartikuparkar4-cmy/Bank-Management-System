import React, { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  BankTransaction,
  BankBill,
} from "../types";
import {
  PieChart as PieChartIcon,
  TrendingDown,
  ShoppingBag,
  Utensils,
  Zap,
  Film,
  Car,
  Cloud,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
} from "lucide-react";

export interface SpendingCategoryData {
  name: string;
  categoryKey: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
  gradient: string;
  icon: React.ReactNode;
  transactions: BankTransaction[];
}

interface SpendingInsightsProps {
  transactions: BankTransaction[];
  bills?: BankBill[];
  compact?: boolean;
  onNavigateToTransactions?: () => void;
  onNavigateToBills?: () => void;
}

// Categorization helper
export function categorizeExpense(tx: BankTransaction): {
  key: string;
  name: string;
  color: string;
  gradient: string;
  iconName: string;
} {
  const text = `${tx.receiver.name} ${tx.description}`.toLowerCase();

  if (
    text.includes("apple") ||
    text.includes("store") ||
    text.includes("amazon") ||
    text.includes("nike") ||
    text.includes("hardware") ||
    text.includes("shop") ||
    text.includes("dribbble")
  ) {
    return {
      key: "shopping",
      name: "Shopping & Tech",
      color: "#00f6ff",
      gradient: "from-[#00f6ff] to-[#33bbcf]",
      iconName: "shopping",
    };
  }

  if (
    text.includes("whole foods") ||
    text.includes("groceries") ||
    text.includes("bistro") ||
    text.includes("cafe") ||
    text.includes("dining") ||
    text.includes("restaurant") ||
    text.includes("ubereats") ||
    text.includes("food")
  ) {
    return {
      key: "food",
      name: "Food & Dining",
      color: "#10b981",
      gradient: "from-emerald-400 to-teal-500",
      iconName: "food",
    };
  }

  if (
    text.includes("electric") ||
    text.includes("power") ||
    text.includes("utility") ||
    text.includes("fibernet") ||
    text.includes("internet") ||
    text.includes("water") ||
    text.includes("gas") ||
    text.includes("bill")
  ) {
    return {
      key: "utilities",
      name: "Utilities & Bills",
      color: "#f59e0b",
      gradient: "from-amber-400 to-orange-500",
      iconName: "utilities",
    };
  }

  if (
    text.includes("netflix") ||
    text.includes("spotify") ||
    text.includes("entertainment") ||
    text.includes("cinema") ||
    text.includes("media") ||
    text.includes("hulu") ||
    text.includes("music")
  ) {
    return {
      key: "entertainment",
      name: "Entertainment",
      color: "#a855f7",
      gradient: "from-purple-400 to-indigo-500",
      iconName: "entertainment",
    };
  }

  if (
    text.includes("uber") ||
    text.includes("transit") ||
    text.includes("airport") ||
    text.includes("flight") ||
    text.includes("airline") ||
    text.includes("lyft") ||
    text.includes("fuel") ||
    text.includes("gas station")
  ) {
    return {
      key: "transport",
      name: "Travel & Transit",
      color: "#f43f5e",
      gradient: "from-rose-400 to-pink-500",
      iconName: "transport",
    };
  }

  if (
    text.includes("aws") ||
    text.includes("cloud") ||
    text.includes("server") ||
    text.includes("hosting") ||
    text.includes("software") ||
    text.includes("saas")
  ) {
    return {
      key: "software",
      name: "Software & Cloud",
      color: "#3b82f6",
      gradient: "from-blue-400 to-cyan-500",
      iconName: "software",
    };
  }

  return {
    key: "other",
    name: "Transfers & Other",
    color: "#64748b",
    gradient: "from-slate-400 to-gray-500",
    iconName: "other",
  };
}

export const SpendingInsights: React.FC<SpendingInsightsProps> = ({
  transactions,
  bills = [],
  compact = false,
  onNavigateToTransactions,
  onNavigateToBills,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null);
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null);

  // Extract available months from transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.createdAt) {
        const d = new Date(tx.createdAt);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthsSet.add(key);
        }
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions]);

  // Format month key for display
  const formatMonthLabel = (mKey: string) => {
    if (mKey === "ALL") return "All Time";
    const [year, month] = mKey.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  // Filter debit / expense transactions only
  const expenseTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Must be a debit / outgoing expense
      const isDebit = tx.type === "DEBIT" || (tx.type !== "CREDIT" && tx.amount > 0);
      if (!isDebit) return false;

      // Check month filter
      if (selectedMonth !== "ALL" && tx.createdAt) {
        const d = new Date(tx.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key !== selectedMonth) return false;
      }
      return true;
    });
  }, [transactions, selectedMonth]);

  // Calculate categorized data
  const { categories, totalExpense, topCategory, avgDailySpend } = useMemo(() => {
    let total = 0;
    const categoryMap = new Map<
      string,
      {
        name: string;
        categoryKey: string;
        amount: number;
        count: number;
        color: string;
        gradient: string;
        iconName: string;
        transactions: BankTransaction[];
      }
    >();

    expenseTransactions.forEach((tx) => {
      total += tx.amount;
      const cat = categorizeExpense(tx);
      if (!categoryMap.has(cat.key)) {
        categoryMap.set(cat.key, {
          name: cat.name,
          categoryKey: cat.key,
          amount: 0,
          count: 0,
          color: cat.color,
          gradient: cat.gradient,
          iconName: cat.iconName,
          transactions: [],
        });
      }
      const entry = categoryMap.get(cat.key)!;
      entry.amount += tx.amount;
      entry.count += 1;
      entry.transactions.push(tx);
    });

    const getIcon = (iconName: string) => {
      switch (iconName) {
        case "shopping":
          return <ShoppingBag className="w-4 h-4" />;
        case "food":
          return <Utensils className="w-4 h-4" />;
        case "utilities":
          return <Zap className="w-4 h-4" />;
        case "entertainment":
          return <Film className="w-4 h-4" />;
        case "transport":
          return <Car className="w-4 h-4" />;
        case "software":
          return <Cloud className="w-4 h-4" />;
        default:
          return <ArrowUpRight className="w-4 h-4" />;
      }
    };

    const categoryList: SpendingCategoryData[] = Array.from(categoryMap.values())
      .map((entry) => ({
        ...entry,
        percentage: total > 0 ? (entry.amount / total) * 100 : 0,
        icon: getIcon(entry.iconName),
      }))
      .sort((a, b) => b.amount - a.amount);

    const top = categoryList.length > 0 ? categoryList[0] : null;
    const avgDaily = total > 0 ? total / 30 : 0;

    return {
      categories: categoryList,
      totalExpense: total,
      topCategory: top,
      avgDailySpend: avgDaily,
    };
  }, [expenseTransactions]);

  // Recharts pie chart data
  const chartData = useMemo(() => {
    return categories.map((cat) => ({
      name: cat.name,
      value: Number(cat.amount.toFixed(2)),
      percentage: Number(cat.percentage.toFixed(1)),
      color: cat.color,
      count: cat.count,
      categoryKey: cat.categoryKey,
    }));
  }, [categories]);

  // Monthly Budget Target (Demo setting: $5,000 limit)
  const monthlyBudget = 5000;
  const budgetUsagePercent = Math.min(Math.round((totalExpense / monthlyBudget) * 100), 100);

  // Filtered transactions for drill-down modal/section
  const activeCategory = useMemo(() => {
    if (!activeCategoryKey) return null;
    return categories.find((c) => c.categoryKey === activeCategoryKey) || null;
  }, [activeCategoryKey, categories]);

  // Custom Pie Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3.5 rounded-2xl bg-[#080d1a]/95 border border-[#00f6ff]/30 shadow-2xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-white text-sm">{data.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-gray-300">
            <span>Amount Spent:</span>
            <span className="font-bold text-[#00f6ff] text-sm">
              ${data.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-gray-400 mt-1">
            <span>Share of Expenses:</span>
            <span className="font-semibold text-white">{data.percentage}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-gray-400 mt-0.5">
            <span>Transactions:</span>
            <span className="text-gray-300">{data.count} txns</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="spending-insights-widget"
      className={`relative rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#090e1b] to-[#0c1322] border border-white/10 shadow-2xl overflow-hidden transition-all ${
        compact ? "p-6" : "p-6 md:p-8"
      }`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00f6ff]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#33bbcf] to-[#def9fa] p-[2px] shadow-[0_0_20px_rgba(0,246,255,0.25)]">
            <div className="w-full h-full bg-[#00040f] rounded-2xl flex items-center justify-center text-[#00f6ff]">
              <PieChartIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">Spending Insights</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#00f6ff]/15 text-[#00f6ff] border border-[#00f6ff]/30 uppercase tracking-wider">
                Monthly Breakdown
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Automated expense categorization & visual outflow telemetry
            </p>
          </div>
        </div>

        {/* Month Selector Filter */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-[#00f6ff]" />
            <select
              id="spending-month-select"
              aria-label="Filter spending by month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-[#0b101c] text-white">
                All Months ({availableMonths.length > 0 ? "Latest" : "All Time"})
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-[#0b101c] text-white">
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {activeCategoryKey && (
            <button
              onClick={() => setActiveCategoryKey(null)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-gray-300 border border-white/10 transition cursor-pointer"
              title="Reset Category Filter"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Insights Content Grid */}
      {expenseTransactions.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-4">
            <TrendingDown className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="text-base font-bold text-white">No Expense Transactions Found</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {selectedMonth !== "ALL"
              ? `No outgoing expenses recorded for ${formatMonthLabel(selectedMonth)}. Try selecting 'All Months'.`
              : "Outgoing transfers and settled bills will automatically calculate your spending breakdown here."}
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6 relative z-10">
          {/* Top Quick Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Expense Outflow */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Total Expenses</span>
                <h4 className="text-2xl font-extrabold text-white mt-1">
                  ${totalExpense.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  {expenseTransactions.length} recorded debits
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            {/* Top Spending Category */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Top Category</span>
                <h4 className="text-lg font-bold text-white mt-1 truncate max-w-[150px]">
                  {topCategory?.name || "None"}
                </h4>
                <span className="text-[11px] text-[#00f6ff] font-semibold mt-0.5 block">
                  {topCategory ? `$${topCategory.amount.toFixed(2)} (${topCategory.percentage.toFixed(0)}%)` : "$0.00"}
                </span>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${topCategory?.color || "#00f6ff"}15`,
                  borderColor: `${topCategory?.color || "#00f6ff"}30`,
                  color: topCategory?.color || "#00f6ff",
                }}
              >
                {topCategory?.icon || <ShoppingBag className="w-5 h-5" />}
              </div>
            </div>

            {/* Budget Health / Daily Avg */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Monthly Budget</span>
                  <span className="text-[11px] font-bold text-[#00f6ff]">{budgetUsagePercent}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] transition-all duration-500"
                    style={{ width: `${budgetUsagePercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                  <span>Target: ${monthlyBudget.toLocaleString()}</span>
                  <span>Avg: ${avgDailySpend.toFixed(1)}/day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart and Category Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Recharts Pie Chart View */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative min-h-[300px]">
              <div className="w-full h-[260px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={98}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredSliceIndex(index)}
                      onMouseLeave={() => setHoveredSliceIndex(null)}
                      onClick={(entry: any) => {
                        const key = entry?.payload?.categoryKey || entry?.categoryKey;
                        if (key) {
                          setActiveCategoryKey(activeCategoryKey === key ? null : key);
                        }
                      }}
                      cursor="pointer"
                    >
                      {chartData.map((entry, index) => {
                        const isHovered = hoveredSliceIndex === index;
                        const isSelected = activeCategoryKey === entry.categoryKey;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#0b101c"
                            strokeWidth={isSelected || isHovered ? 3 : 2}
                            style={{
                              filter:
                                isSelected || isHovered
                                  ? `drop-shadow(0 0 10px ${entry.color}80)`
                                  : "none",
                              transition: "all 0.3s ease",
                              transformOrigin: "center",
                            }}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Total Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                    {activeCategory ? activeCategory.name : "Total Outflow"}
                  </span>
                  <span className="text-xl md:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                    ${(activeCategory ? activeCategory.amount : totalExpense).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-[10px] text-[#00f6ff] font-medium mt-0.5">
                    {activeCategory ? `${activeCategory.percentage.toFixed(1)}% of total` : `${chartData.length} Categories`}
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-gray-400 mt-2 text-center">
                Click any slice or category item to filter transaction details
              </span>
            </div>

            {/* Category Breakdown Progress List */}
            <div className="lg:col-span-6 flex flex-col gap-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Category Breakdown
                </span>
                <span className="text-xs text-gray-400">Share of Total</span>
              </div>

              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {categories.map((cat) => {
                  const isSelected = activeCategoryKey === cat.categoryKey;

                  return (
                    <div
                      key={cat.categoryKey}
                      id={`category-bar-${cat.categoryKey}`}
                      onClick={() =>
                        setActiveCategoryKey(
                          activeCategoryKey === cat.categoryKey ? null : cat.categoryKey
                        )
                      }
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white/10 border-[#00f6ff]/50 shadow-[0_0_15px_rgba(0,246,255,0.15)]"
                          : "bg-white/[0.03] hover:bg-white/[0.06] border-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${cat.color}15`,
                              borderColor: `${cat.color}30`,
                              color: cat.color,
                            }}
                          >
                            {cat.icon}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{cat.name}</p>
                            <span className="text-[10px] text-gray-400">
                              {cat.count} {cat.count === 1 ? "transaction" : "transactions"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold text-white">
                            ${cat.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                          <span className="text-[10px] font-semibold" style={{ color: cat.color }}>
                            {cat.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(cat.percentage, 3)}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Drill-down Category Transactions View (when a category is clicked) */}
          {activeCategory && (
            <div className="mt-2 p-5 rounded-2xl bg-white/[0.02] border border-[#00f6ff]/30 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#00f6ff]" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {activeCategory.name} Transactions ({activeCategory.transactions.length})
                  </h4>
                </div>
                <button
                  onClick={() => setActiveCategoryKey(null)}
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  Close Filter ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeCategory.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-white truncate">{tx.receiver.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{tx.description}</p>
                      <span className="text-[9px] text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-white">-${tx.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart AI Financial Suggestion Footer */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#00f6ff]/10 via-[#33bbcf]/5 to-transparent border border-[#00f6ff]/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#00f6ff]/20 flex items-center justify-center text-[#00f6ff] shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-200">
                <strong className="text-white">Smart HooBank Advisory: </strong>
                Your highest spend is in <span className="text-[#00f6ff] font-semibold">{topCategory?.name}</span> (
                {topCategory?.percentage.toFixed(0)}% of expenses). You are currently{" "}
                <span className="text-emerald-400 font-semibold">{100 - budgetUsagePercent}% under</span> your monthly
                spending ceiling.
              </p>
            </div>

            {onNavigateToTransactions && (
              <button
                onClick={onNavigateToTransactions}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#00f6ff] hover:underline whitespace-nowrap cursor-pointer shrink-0"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
