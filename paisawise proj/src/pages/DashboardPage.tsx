import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  QrCode,
  Users,
  Plus,
  Shield,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  FileText,
  Sliders,
  Utensils,
  BookOpen,
  Train,
  Wifi,
  Coffee,
  Check,
  Calendar,
  Bell,
  MoreVertical,
  ChevronDown,
  Clock,
  Layers,
  HelpCircle,
  PiggyBank,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';
import { CategoryKey, Transaction } from '../types/finance.ts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    runway,
    totalSpent,
    totalBudget,
    budgetRemaining,
    availableBalance,
    liquidCash,
    periodTransactions,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    computedCategories,
    safetyBuffer,
    setSafetyBuffer,
    setIsAddModalOpen,
    setSelectedTransactionForDrawer,
    rebalanceCategories,
    executeAutoBalance,
    autoBalanceSuggestion,
    needsVsWants,
    goals,
  } = useFinance();

  const featuredGoal = useMemo(() => {
    return goals.find((g) => g.currentAmount < g.targetAmount) || goals[0] || null;
  }, [goals]);

  // Local UI states
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'food' | 'study' | 'hostel'>('all');
  const [weeklyBurnTab, setWeeklyBurnTab] = useState<'this' | 'last' | 'month'>('this');
  const [selectedBarItem, setSelectedBarItem] = useState<string | null>(null);
  const [rebalanceDone, setRebalanceDone] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showExplanationTooltip, setShowExplanationTooltip] = useState(false);

  // Derive active month label
  const activeMonthLabel = useMemo(() => {
    const found = availableMonths.find((m) => m.value === selectedMonth);
    if (found) return found.label;
    if (selectedMonth) {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    }
    return profile.monthLabel ? profile.monthLabel.replace(/2024/g, '2026') : 'October 2026';
  }, [availableMonths, selectedMonth, profile.monthLabel]);

  // Current formatted date string
  const currentDateStr = useMemo(() => {
    if (selectedMonth === '2026-10') return 'Monday, Oct 19, 2026';
    if (selectedMonth === '2026-09') return 'Wednesday, Sep 30, 2026';
    if (selectedMonth === '2026-11') return 'Sunday, Nov 1, 2026';
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedMonth]);

  // Notifications list
  const notifications = [
    {
      id: 'notif-1',
      title: 'Chai & Canteen Spike',
      message: 'You spent 20% more on tea & snacks this week.',
      type: 'warning',
      time: '2h ago',
    },
    {
      id: 'notif-2',
      title: 'Safe Daily Limit On Track',
      message: `₹${runway.safeDailySpend}/day pacing preserves your savings reserve.`,
      type: 'success',
      time: '5h ago',
    },
    {
      id: 'notif-3',
      title: 'Wi-Fi Split Settled',
      message: 'Kabir confirmed ₹250 share for Room 304 Fiber.',
      type: 'info',
      time: '1d ago',
    },
  ];

  // Filtered transactions for recent activity list
  const recentTransactions = useMemo(() => {
    return periodTransactions
      .filter((t) => {
        if (activeCategoryFilter === 'food') return t.category === 'Food & Canteen';
        if (activeCategoryFilter === 'study') return t.category === 'Academics & Books';
        if (activeCategoryFilter === 'hostel') return t.category === 'Hostel & Utilities' || t.isSplit;
        return true;
      })
      .slice(0, 5);
  }, [periodTransactions, activeCategoryFilter]);

  // Category Icon helper
  const getCategoryIcon = (category: CategoryKey) => {
    switch (category) {
      case 'Food':
      case 'Food & Canteen':
        return <Utensils className="w-4 h-4 text-[#4C3478]" />;
      case 'Education':
      case 'Academics & Books':
        return <BookOpen className="w-4 h-4 text-[#7E57C2]" />;
      case 'Travel':
      case 'Travel & Metro':
        return <Train className="w-4 h-4 text-[#8B6FE8]" />;
      case 'Hostel/Rent':
      case 'Hostel & Utilities':
        return <Wifi className="w-4 h-4 text-[#6A4C9C]" />;
      case 'Entertainment':
      case 'Entertainment & OTT':
        return <Coffee className="w-4 h-4 text-[#A48BF0]" />;
      case 'Shopping':
      case 'Tech & Gadgets':
        return <ShoppingBag className="w-4 h-4 text-[#C5B4E3]" />;
      default:
        return <Wallet className="w-4 h-4 text-[#42CBA5]" />;
    }
  };

  // Rebalance Handler
  const handleRebalanceClick = () => {
    executeAutoBalance();
    setRebalanceDone(true);
    setTimeout(() => setRebalanceDone(false), 2500);
  };

  // --- Chart 1: Spending Pace Data (Mon to Sun or Weekly Cadence) ---
  const weeklyChartData = useMemo(() => {
    if (weeklyBurnTab === 'month') {
      const weeks = [
        { key: 'Week 1', label: 'Week 1 (1–7)', start: 1, end: 7 },
        { key: 'Week 2', label: 'Week 2 (8–14)', start: 8, end: 14 },
        { key: 'Week 3', label: 'Week 3 (15–21)', start: 15, end: 21 },
        { key: 'Week 4', label: 'Week 4+ (22–End)', start: 22, end: 31 },
      ];
      const totals: Record<string, number> = {
        'Week 1': 0,
        'Week 2': 0,
        'Week 3': 0,
        'Week 4': 0,
      };

      periodTransactions
        .filter((t) => t.type === 'expense')
        .forEach((t) => {
          if (!t.date) return;
          const d = new Date(t.date);
          const dayOfMonth = d.getDate();
          if (dayOfMonth <= 7) totals['Week 1'] += t.amount;
          else if (dayOfMonth <= 14) totals['Week 2'] += t.amount;
          else if (dayOfMonth <= 21) totals['Week 3'] += t.amount;
          else totals['Week 4'] += t.amount;
        });

      const weeklySafeLimit = runway.safeDailySpend * 7;
      return weeks.map((w) => ({
        day: w.key,
        displayLabel: w.label,
        spend: totals[w.key] || 0,
        isSpike: (totals[w.key] || 0) > weeklySafeLimit,
        targetLimit: weeklySafeLimit,
      }));
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totals: Record<string, number> = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!t.date) return;
        const d = new Date(t.date);
        const dayIdx = (d.getDay() + 6) % 7; // Monday = 0, Sunday = 6
        const dayName = days[dayIdx];
        if (dayName) {
          totals[dayName] += t.amount;
        }
      });

    return days.map((day) => ({
      day,
      displayLabel: day,
      spend: totals[day],
      isSpike: totals[day] > runway.safeDailySpend,
      targetLimit: runway.safeDailySpend,
    }));
  }, [periodTransactions, runway.safeDailySpend, weeklyBurnTab]);

  const hasWeeklyData = weeklyChartData.some((d) => d.spend > 0);

  // Derive transactions and stats for currently selected bar item
  const selectedBarTransactions = useMemo(() => {
    if (!selectedBarItem) return [];
    if (weeklyBurnTab === 'month') {
      return periodTransactions.filter((t) => {
        if (t.type !== 'expense' || !t.date) return false;
        const day = new Date(t.date).getDate();
        if (selectedBarItem === 'Week 1') return day >= 1 && day <= 7;
        if (selectedBarItem === 'Week 2') return day >= 8 && day <= 14;
        if (selectedBarItem === 'Week 3') return day >= 15 && day <= 21;
        if (selectedBarItem === 'Week 4') return day >= 22;
        return false;
      });
    }

    const dayNameMap: Record<number, string> = {
      0: 'Sun',
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat',
    };

    return periodTransactions.filter((t) => {
      if (t.type !== 'expense' || !t.date) return false;
      const d = new Date(t.date);
      return dayNameMap[d.getDay()] === selectedBarItem;
    });
  }, [selectedBarItem, weeklyBurnTab, periodTransactions]);

  const selectedBarStats = useMemo(() => {
    if (!selectedBarItem) return null;
    const item = weeklyChartData.find((d) => d.day === selectedBarItem);
    if (!item) return null;
    const diff = item.spend - item.targetLimit;
    return {
      name: item.displayLabel || item.day,
      spend: item.spend,
      limit: item.targetLimit,
      isOver: diff > 0,
      diff: Math.abs(diff),
      transactions: selectedBarTransactions,
    };
  }, [selectedBarItem, weeklyChartData, selectedBarTransactions]);

  // --- Chart 2: Category Distribution Data (Donut/Pie) ---
  const categoryColors: Record<string, string> = {
    'Food': '#4C3478',
    'Food & Canteen': '#4C3478',
    'Hostel/Rent': '#6A4C9C',
    'Hostel & Utilities': '#6A4C9C',
    'Travel': '#8B6FE8',
    'Travel & Metro': '#8B6FE8',
    'Education': '#7E57C2',
    'Academics & Books': '#7E57C2',
    'Entertainment': '#A48BF0',
    'Entertainment & OTT': '#A48BF0',
    'Health': '#B39DDB',
    'Medical & Health': '#B39DDB',
    'Shopping': '#C5B4E3',
    'Tech & Gadgets': '#C5B4E3',
    'Subscriptions': '#5C3E8A',
    'Other': '#9E8EB8',
    'Income': '#42CBA5',
    'Monthly Allowance': '#42CBA5',
  };

  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name] || '#20a477',
    }));
  }, [periodTransactions]);

  const hasCategoryData = categoryChartData.length > 0;

  // Percentage calculations
  const burnPercentage =
    profile.monthlyAllowance > 0
      ? Math.min(100, Math.round((totalSpent / profile.monthlyAllowance) * 100))
      : 0;

  const budgetUsedPercentage =
    totalBudget > 0
      ? Math.min(100, Math.round((totalSpent / totalBudget) * 100))
      : 0;

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-8 pb-14 font-sans">
      {/* 1. Header with Greeting, Date, Month Selector, Notifications & Profile */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#e1ebe1]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-black text-[#151e18] tracking-tight">
              Hey {profile.name ? profile.name.split(' ')[0] : 'Aarav'}{' '}
              <span className="inline-block hover:rotate-12 transition-transform cursor-pointer">👋</span>
            </h1>

            {/* Informative Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                runway.status === 'safe'
                  ? 'bg-[#83f9c5] text-[#002114]'
                  : runway.status === 'caution'
                  ? 'bg-[#ffdf9e] text-[#553800]'
                  : 'bg-[#ffdad6] text-[#93000a]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  runway.status === 'safe'
                    ? 'bg-[#006c4c] animate-pulse'
                    : runway.status === 'caution'
                    ? 'bg-[#ba7500]'
                    : 'bg-[#ba1a1a]'
                }`}
              />
              <span>{runway.statusLabel || 'On track'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs md:text-sm text-[#69746d] flex-wrap">
            <span className="font-semibold text-[#151e18]">{currentDateStr}</span>
            <span>·</span>
            <span>Campus Day {profile.campusDay}</span>
            <span>·</span>
            <span>
              {profile.semester} ({profile.major})
            </span>
            <span>·</span>
            <span className="font-bold text-[#006c4c]">
              {runway.daysRemaining > 0 ? `${runway.daysRemaining} days remaining in cycle` : 'Allowance cycle ended'}
            </span>
          </div>
        </div>

        {/* Right Header Controls: Month Selector, Notifications, Add Transaction */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          {/* Month Selector Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="h-10 px-3.5 rounded-full bg-white hover:bg-[#e1ebe1] text-[#00261e] border border-[#e1ebe1] text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-[#006c4c]" />
              <span>{activeMonthLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#69746d]" />
            </button>

            {showMonthDropdown && (
              <div className="absolute right-0 top-12 w-52 rounded-2xl bg-white shadow-xl border border-[#e1ebe1] p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[11px] font-bold text-[#69746d] uppercase tracking-wider">
                  Select Period
                </div>
                {availableMonths.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m.value);
                      setShowMonthDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedMonth === m.value
                        ? 'bg-[#123d32] text-white'
                        : 'text-[#414845] hover:bg-[#f2fcf2] hover:text-[#00261e]'
                    }`}
                  >
                    <span>{m.label}</span>
                    {selectedMonth === m.value && <Check className="w-3.5 h-3.5 text-[#83f9c5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Modal Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotificationsModal(!showNotificationsModal)}
              className="w-10 h-10 rounded-full bg-white hover:bg-[#e1ebe1] border border-[#e1ebe1] flex items-center justify-center text-[#414845] relative transition-colors shadow-xs"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-[#006c4c]" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ba1a1a]" />
            </button>

            {showNotificationsModal && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl bg-white shadow-2xl border border-[#e1ebe1] p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-[#e1ebe1]">
                  <span className="font-bold text-xs text-[#00261e]">Campus Money Alerts</span>
                  <span className="text-[10px] font-semibold text-[#006c4c] bg-[#83f9c5]/30 px-2 py-0.5 rounded-full">
                    3 New
                  </span>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-[#f2fcf2] hover:bg-[#e1ebe1] transition-colors flex flex-col gap-0.5 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#00261e]">{n.title}</span>
                        <span className="text-[10px] text-[#717975]">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[#414845] leading-tight">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 11. Prominent Add Transaction Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 px-5 rounded-full bg-[#123d32] hover:bg-[#00261e] text-white text-xs md:text-sm font-extrabold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#83f9c5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </section>

      {/* 2, 3, 4, 5. Primary Financial Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Balance */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e1ebe1] flex flex-col justify-between hover:border-[#bfecdc] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-[#69746d]">Available Balance</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${availableBalance < 0 ? 'bg-[#FDECEE] text-[#E56B75]' : 'bg-[#83f9c5]/40 text-[#006c4c]'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`font-black text-2xl md:text-3xl tabular-nums tracking-tight ${availableBalance < 0 ? 'text-[#E56B75]' : 'text-[#006c4c]'}`}>
              {availableBalance < 0 ? `−₹${Math.abs(availableBalance).toLocaleString('en-IN')}` : `₹${availableBalance.toLocaleString('en-IN')}`}
            </div>
            <p className="mt-2 flex items-center">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight border transition-colors ${
                  availableBalance < 0
                    ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4ab]'
                    : 'bg-[#ecf6ed] text-[#006c4c] border-[#cbe1ce]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    availableBalance < 0 ? 'bg-[#ba1a1a] animate-pulse' : 'bg-[#006c4c]'
                  }`}
                />
                <span>{availableBalance < 0 ? 'Overspent · Needs allowance' : 'Opening + Income − Expenses'}</span>
              </span>
            </p>
          </div>
        </div>

        {/* Card 2: Monthly Allowance / Income Summary */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e1ebe1] flex flex-col justify-between hover:border-[#bfecdc] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-[#69746d]">{activeMonthLabel} Allowance</span>
            <div className="w-8 h-8 rounded-xl bg-[#ecf6ed] flex items-center justify-center text-[#006c4c]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-black text-2xl md:text-3xl text-[#00261e] tabular-nums tracking-tight">
              ₹{profile.monthlyAllowance.toLocaleString('en-IN')}
            </div>
            <p className="mt-2 flex items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight bg-[#ecf6ed] text-[#006c4c] border border-[#cbe1ce]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006c4c] shrink-0" />
                <span>Parental allowance base</span>
              </span>
            </p>
          </div>
        </div>

        {/* Card 3: Total Spending */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e1ebe1] flex flex-col justify-between hover:border-[#bfecdc] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-[#69746d]">Total Spending</span>
            <div className="w-8 h-8 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-black text-2xl md:text-3xl text-[#00261e] tabular-nums tracking-tight">
              ₹{totalSpent.toLocaleString('en-IN')}
            </div>
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight bg-[#ecf6ed] text-[#006c4c] border border-[#cbe1ce]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006c4c] shrink-0" />
              <span>{burnPercentage}% of allowance burned</span>
            </span>
          </div>
        </div>

        {/* Card 4: Monthly Budget Remaining (Distinct from Available Balance) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e1ebe1] flex flex-col justify-between hover:border-[#bfecdc] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-[#69746d]">Budget Remaining</span>
            <div className="w-8 h-8 rounded-xl bg-[#ecf6ed] flex items-center justify-center text-[#006c4c]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-black text-2xl md:text-3xl text-[#00261e] tabular-nums tracking-tight">
              ₹{budgetRemaining.toLocaleString('en-IN')}
            </div>
            <div className="w-full bg-[#e1ebe1] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-[#20a477] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, 100 - budgetUsedPercentage))}%` }}
              />
            </div>
            <p className="mt-2 flex items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight bg-[#ecf6ed] text-[#006c4c] border border-[#cbe1ce] truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006c4c] shrink-0" />
                <span className="truncate">₹{totalBudget.toLocaleString('en-IN')} envelope cap</span>
              </span>
              <span className="font-extrabold text-[#006c4c] shrink-0 text-[10px] bg-[#ecf6ed] border border-[#cbe1ce] px-2 py-0.5 rounded-full">
                {Math.max(0, 100 - budgetUsedPercentage)}% left
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 6. Survival Meter Hero Section */}
      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e1ebe1] flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#83f9c5]/20 blur-3xl pointer-events-none" />

        {/* Meter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#123d32] text-[#83f9c5] flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-[#00261e]">
                  Pocket Money Survival Meter
                </h2>
                <button
                  type="button"
                  onClick={() => setShowExplanationTooltip(!showExplanationTooltip)}
                  className="text-[#69746d] hover:text-[#00261e]"
                  title="How is this calculated?"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#69746d]">
                Safe daily limit preventing end-of-month broke days before next pocket money.
              </p>
            </div>
          </div>

          {/* Status Capsule */}
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs border ${
                runway.status === 'critical'
                  ? 'bg-[#FDECEE] text-[#E56B75] border-[#F8CAD0]'
                  : runway.status === 'caution'
                  ? 'bg-[#FFE8A3] text-[#735100] border-[#F6D884]'
                  : 'bg-[#E5F8F1] text-[#186851] border-[#b8ecd9]'
              }`}
            >
              {runway.status === 'safe' ? (
                <CheckCircle2 className="w-4 h-4 text-[#42CBA5]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-current" />
              )}
              <span>{runway.statusLabel || 'On track'}</span>
            </div>
          </div>
        </div>

        {/* Suggested Daily Spending Limit & Formula */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          <div className="md:col-span-5 flex flex-col gap-1">
            <span className="text-xs uppercase font-extrabold tracking-wider text-[#69746d]">
              Suggested Daily Spending Limit
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-[#00261e] tabular-nums tracking-tight">
                ₹{runway.safeDailySpend}
              </span>
              <span className="text-sm font-bold text-[#006c4c]">/ day safe limit</span>
            </div>
            <p className="text-xs text-[#414845] mt-1 leading-relaxed">
              {runway.formulaString}
            </p>
          </div>

          {/* 3 Survival Factors Strip */}
          <div className="md:col-span-7 grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex flex-col">
              <span className="text-[11px] font-bold text-[#69746d]">Available Money</span>
              <span className="font-black text-lg md:text-xl text-[#00261e] mt-0.5 tabular-nums">
                ₹{availableBalance.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-[#006c4c] font-semibold mt-0.5">UPI &amp; Cash</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex flex-col">
              <span className="text-[11px] font-bold text-[#69746d]">Reserved Dues</span>
              <span className="font-black text-lg md:text-xl text-[#00261e] mt-0.5 tabular-nums">
                ₹{((profile.fixedDues || 0) + safetyBuffer).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-[#717975] font-semibold mt-0.5">
                Hostel + Buffer
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex flex-col">
              <span className="text-[11px] font-bold text-[#69746d]">Days Remaining</span>
              <span className="font-black text-lg md:text-xl text-[#00261e] mt-0.5 tabular-nums">
                {runway.daysRemaining}
              </span>
              <span className="text-[10px] text-[#006c4c] font-semibold mt-0.5">Until Allowance</span>
            </div>
          </div>
        </div>

        {/* Explanation Callout if toggled */}
        {showExplanationTooltip && (
          <div className="p-4 rounded-2xl bg-[#ecf6ed] border border-[#cbe1ce] text-xs text-[#151e18] flex flex-col gap-1 relative z-10 animate-in fade-in">
            <div className="font-extrabold text-[#00261e]">Survival Meter Accounting Math:</div>
            <p>
              Daily Spending Limit = (Available Balance − Reserved Expenses) ÷ Days Until Next Allowance.
            </p>
            <p className="text-[#414845]">
              Currently: (₹{availableBalance.toLocaleString('en-IN')} − ₹{(profile.fixedDues || 0) + safetyBuffer}) ÷ {runway.daysRemaining || 1} days = ₹{runway.safeDailySpend}/day. If you stay under this number, your money will last until the 1st without touching emergency savings!
            </p>
          </div>
        )}

        {/* Safety Buffer Reserve Simulator Slider */}
        <div className="pt-4 border-t border-[#e1ebe1] flex flex-col gap-2.5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#151e18]">
              <Sliders className="w-3.5 h-3.5 text-[#006c4c]" />
              <span>Simulate Emergency Safety Buffer Reserve: ₹{safetyBuffer}</span>
            </div>
            <span className="text-xs font-extrabold text-[#006c4c]">
              ₹{runway.safeDailySpend} / day adjusted pace
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1500"
            step="50"
            value={safetyBuffer}
            onChange={(e) => setSafetyBuffer(Number(e.target.value))}
            className="w-full h-4 bg-[#EDE7FF] rounded-full appearance-none cursor-pointer accent-[#4C3478] font-black border-2 border-[#4C3478] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4C3478] transition-all"
            aria-label="Adjust Emergency Safety Buffer"
          />
          <div className="flex justify-between text-[11px] text-[#717975]">
            <span>₹0 (Max spend)</span>
            <span>₹500 (Moderate cushion)</span>
            <span>₹1,000 (Strong reserve)</span>
            <span>₹1,500 (Super safe)</span>
          </div>
        </div>
      </section>

      {/* 7 & 8. Charts Section: Weekly Spending Bar Chart + Category Spending Donut Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 7. Weekly Spending Bar Chart (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-[#e1ebe1] flex flex-col justify-between">
          {/* Header & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e1ebe1]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#ecf6ed] text-[#006c4c] border border-[#cbe1ce]">
                  Daily Burn Rate
                </span>
                {selectedBarItem && (
                  <span className="text-[10px] font-bold text-[#006c4c] bg-[#83f9c5]/30 border border-[#b8ecd9] px-2 py-0.5 rounded-full animate-in fade-in">
                    Selected: {selectedBarItem}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-base md:text-lg text-[#00261e] tracking-tight">
                Spending Burn Rate
              </h3>
              <p className="text-xs text-[#69746d]">
                {weeklyBurnTab === 'this'
                  ? `Comparing daily burn against your ₹${runway.safeDailySpend} safe limit`
                  : `4-week spending pacing for ${activeMonthLabel} (Weekly safe quota: ₹${runway.safeDailySpend * 7})`}
              </p>
            </div>

            {/* Segmented Tab Selector matching website theme */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f2fcf2] rounded-xl border border-[#cbe1ce] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setWeeklyBurnTab('this');
                  setSelectedBarItem(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  weeklyBurnTab === 'this'
                    ? 'bg-[#123d32] text-white shadow-xs font-bold'
                    : 'text-[#69746d] hover:text-[#00261e] hover:bg-white/60 font-medium'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    weeklyBurnTab === 'this' ? 'bg-[#83f9c5] shadow-[0_0_6px_#83f9c5]' : 'bg-[#cbe1ce]'
                  }`}
                />
                <span>Mon–Sun View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeeklyBurnTab('month');
                  setSelectedBarItem(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  weeklyBurnTab === 'month'
                    ? 'bg-[#123d32] text-white shadow-xs font-bold'
                    : 'text-[#69746d] hover:text-[#00261e] hover:bg-white/60 font-medium'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    weeklyBurnTab === 'month' ? 'bg-[#83f9c5] shadow-[0_0_6px_#83f9c5]' : 'bg-[#cbe1ce]'
                  }`}
                />
                <span>Weekly Cadence</span>
              </button>
            </div>
          </div>

          {/* Recharts Bar Chart Container */}
          <div className="w-full h-64 pt-4">
            {hasWeeklyData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyChartData}
                  margin={{ top: 12, right: 10, left: -15, bottom: 0 }}
                  onClick={(state) => {
                    if (state && state.activeLabel) {
                      setSelectedBarItem((prev) => (prev === state.activeLabel ? null : String(state.activeLabel)));
                    }
                  }}
                >
                  <XAxis
                    dataKey="day"
                    stroke="#69746d"
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#69746d"
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 108, 76, 0.05)', radius: 8 }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                    labelFormatter={(label) => `${label} Spend`}
                    contentStyle={{
                      backgroundColor: '#123d32',
                      borderColor: '#123d32',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(18, 61, 50, 0.15)',
                    }}
                  />
                  <ReferenceLine
                    y={weeklyBurnTab === 'month' ? runway.safeDailySpend * 7 : runway.safeDailySpend}
                    stroke="#20a477"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Safe ₹${weeklyBurnTab === 'month' ? (runway.safeDailySpend * 7).toLocaleString('en-IN') : runway.safeDailySpend}${weeklyBurnTab === 'month' ? '/wk' : '/d'}`,
                      fill: '#006c4c',
                      fontSize: 10,
                      fontWeight: 700,
                      position: 'top',
                    }}
                  />
                  <Bar
                    dataKey="spend"
                    radius={[6, 6, 2, 2]}
                    cursor="pointer"
                  >
                    {weeklyChartData.map((entry, index) => {
                      const isSelected = selectedBarItem === entry.day;
                      const isDimmed = selectedBarItem !== null && !isSelected;
                      const target = entry.targetLimit;
                      const isOver = entry.spend > target;

                      let barFill = isOver ? '#E56B75' : '#20a477';
                      if (isSelected) {
                        barFill = '#006c4c';
                      }

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={barFill}
                          opacity={isDimmed ? 0.35 : 1}
                          stroke={isSelected ? '#00261e' : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                          className="transition-all duration-200"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#69746d] bg-[#f2fcf2] rounded-2xl border border-dashed border-[#cbe1ce]">
                <Clock className="w-6 h-6 text-[#006c4c] mb-1" />
                <span className="font-bold text-[#00261e]">No transaction activity in {activeMonthLabel}</span>
                <span className="text-[11px]">Click "Add Transaction" to log an expense for this period.</span>
              </div>
            )}
          </div>

          {/* Interactive Inspection Banner for Selected Bar/Day */}
          {selectedBarStats && (
            <div className="mt-3 p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#cbe1ce] flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006c4c] shadow-[0_0_6px_#83f9c5]" />
                  <span className="font-extrabold text-xs text-[#00261e]">
                    {selectedBarStats.name} Spend Breakdown:
                  </span>
                  <span className="font-black text-sm text-[#006c4c] tabular-nums">
                    ₹{selectedBarStats.spend.toLocaleString('en-IN')}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedBarStats.isOver
                        ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4ab]'
                        : 'bg-[#ecf6ed] text-[#006c4c] border-[#cbe1ce]'
                    }`}
                  >
                    {selectedBarStats.isOver
                      ? `+₹${selectedBarStats.diff.toLocaleString('en-IN')} over quota`
                      : `₹${selectedBarStats.diff.toLocaleString('en-IN')} within safe quota`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBarItem(null)}
                  className="text-[11px] font-bold text-[#69746d] hover:text-[#00261e] bg-white px-2.5 py-1 rounded-lg border border-[#cbe1ce] hover:bg-[#ecf6ed] transition-colors"
                >
                  Clear Selection ✕
                </button>
              </div>

              {/* Day's Transactions Micro-Chips */}
              {selectedBarStats.transactions.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-[#69746d]">Transactions:</span>
                  {selectedBarStats.transactions.slice(0, 4).map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#cbe1ce] text-[11px] font-semibold text-[#151e18]"
                    >
                      <span className="text-[#69746d]">{t.category}:</span>
                      <span className="font-bold text-[#006c4c]">₹{t.amount}</span>
                    </span>
                  ))}
                  {selectedBarStats.transactions.length > 4 && (
                    <span className="text-[10px] font-bold text-[#69746d] bg-white px-1.5 py-0.5 rounded-md border border-[#cbe1ce]">
                      +{selectedBarStats.transactions.length - 4} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-[#69746d]">No individual expense transactions logged on this day.</p>
              )}
            </div>
          )}

          {/* Card Legend & Helpful Guide */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#e1ebe1] text-[11px] text-[#69746d]">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#20a477]" />
                <span className="font-semibold text-[#151e18]">Within Safe Limit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E56B75]" />
                <span className="font-semibold text-[#151e18]">Above Safe Limit</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-[#006c4c]">
                <span className="w-4 border-t-2 border-dashed border-[#20a477]" />
                <span>
                  Safe Target (₹{weeklyBurnTab === 'month' ? (runway.safeDailySpend * 7).toLocaleString('en-IN') : runway.safeDailySpend}
                  {weeklyBurnTab === 'month' ? '/wk' : '/day'})
                </span>
              </div>
            </div>

            <span className="text-[10px] font-bold text-[#006c4c] bg-[#ecf6ed] border border-[#cbe1ce] px-2 py-0.5 rounded-md self-start sm:self-auto">
              {selectedBarItem ? 'Click bar again to deselect' : '💡 Tip: Click any bar to inspect'}
            </span>
          </div>
        </div>

        {/* 8. Category-wise Spending Chart (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-[#e1ebe1] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[#e1ebe1]">
            <div>
              <h3 className="font-extrabold text-base text-[#00261e]">Category-wise Spending</h3>
              <p className="text-xs text-[#69746d]">Actual distribution for {activeMonthLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/budgets')}
              className="text-xs font-bold text-[#006c4c] hover:underline"
            >
              Envelopes
            </button>
          </div>

          {/* Recharts Pie / Donut Chart */}
          <div className="w-full h-64 flex items-center justify-center">
            {hasCategoryData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Spent']}
                    contentStyle={{
                      backgroundColor: '#123d32',
                      borderColor: '#123d32',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-[11px] font-semibold text-[#151e18]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#69746d] bg-[#f2fcf2] rounded-2xl border border-dashed border-[#cbe1ce]">
                <ShoppingBag className="w-6 h-6 text-[#006c4c] mb-1" />
                <span className="font-bold text-[#00261e]">No category expenses recorded</span>
                <span className="text-[11px]">All budgets remain 100% intact</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-center text-[11px] text-[#69746d]">
            Total Period Expenses: <span className="font-bold text-[#00261e]">₹{totalSpent.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </section>

      {/* 9 & 10. Recent Transactions List + Personalized Money Insight Card */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 9. Recent Transactions List (Col 8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm border border-[#e1ebe1] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e1ebe1]">
            <div>
              <h3 className="font-extrabold text-base text-[#00261e]">Recent Campus Ledger</h3>
              <p className="text-xs text-[#69746d]">Latest UPI, Cash, and shared canteen records</p>
            </div>

            {/* Filter Tabs + View All Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 bg-[#f2fcf2] rounded-xl border border-[#e1ebe1]">
                {(['all', 'food', 'study', 'hostel'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveCategoryFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                      activeCategoryFilter === filter
                        ? 'bg-white text-[#00261e] shadow-xs'
                        : 'text-[#69746d] hover:text-[#00261e]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate('/transactions')}
                className="text-xs font-bold text-[#006c4c] hover:underline px-2 py-1 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List of items */}
          <div className="flex flex-col gap-2">
            {recentTransactions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#f2fcf2] border border-dashed border-[#cbe1ce] text-center text-xs text-[#69746d] flex flex-col items-center justify-center gap-1">
                <FileText className="w-6 h-6 text-[#006c4c]" />
                <span className="font-bold text-[#00261e]">No matching transactions in {activeMonthLabel}</span>
                <span>Click "Add Transaction" above to record a new payment.</span>
              </div>
            ) : (
              recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  onClick={() => setSelectedTransactionForDrawer(txn)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f2fcf2] hover:bg-[#e1ebe1] border border-[#e1ebe1] cursor-pointer transition-all hover:scale-[1.005] group"
                  title="Click to view details or edit"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#e1ebe1] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getCategoryIcon(txn.category)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs md:text-sm text-[#00261e] truncate group-hover:text-[#006c4c] transition-colors">
                        {txn.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#69746d] truncate">
                        <span>{txn.category}</span>
                        <span>·</span>
                        <span>{txn.date}</span>
                        <span>·</span>
                        <span>{txn.paymentMethod}</span>
                        {txn.isSplit && (
                          <span className="text-[#006c4c] font-bold">· Split</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-black text-sm md:text-base tabular-nums ${
                        txn.type === 'income' ? 'text-[#006c4c]' : 'text-[#151e18]'
                      }`}
                    >
                      {txn.type === 'income' ? '+' : '−'}₹{txn.amount.toLocaleString('en-IN')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#69746d] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 10. Personalized Money Insight Card (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-gradient-to-br from-[#123d32] to-[#00261e] text-white rounded-3xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[#83f9c5]/15 blur-2xl pointer-events-none" />

            <div className="flex flex-col gap-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#83f9c5]" />
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#83f9c5]">
                    Campus Intelligence
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#bfecdc] bg-white/10 px-2 py-0.5 rounded-full">
                  Live Insight
                </span>
              </div>

              <h4 className="text-base font-black text-white leading-tight">
                {autoBalanceSuggestion?.fromCategory && autoBalanceSuggestion?.toCategory
                  ? `Shift ₹${autoBalanceSuggestion.amountNeeded} from ${autoBalanceSuggestion.fromCategory.name}?`
                  : 'Needs vs. Wants Balanced'}
              </h4>

              <p className="text-xs text-[#bfecdc] leading-relaxed">
                {autoBalanceSuggestion?.fromCategory && autoBalanceSuggestion?.toCategory
                  ? `Your ${autoBalanceSuggestion.toCategory.name} envelope is tight. Rebalancing surplus from ${autoBalanceSuggestion.fromCategory.name} prevents breaking your safe daily limit.`
                  : `Currently, ${needsVsWants.needsPercentage}% of your spending is on essential needs (mess & books) and ${needsVsWants.wantsPercentage}% on discretionary treats.`}
              </p>

              {rebalanceDone && (
                <div className="p-2.5 rounded-xl bg-[#83f9c5] text-[#002114] text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#006c4c]" />
                  <span>Envelopes rebalanced successfully!</span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                {autoBalanceSuggestion && !rebalanceDone && (
                  <button
                    type="button"
                    onClick={handleRebalanceClick}
                    className="h-10 px-4 rounded-xl bg-[#83f9c5] text-[#002114] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#a4d0c0] transition-colors shadow-xs active:scale-95"
                  >
                    <span>Auto-Balance Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/insights')}
                  className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/15"
                >
                  <span>View Full Habits &amp; Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Savings Goal Mini Capsule */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e1ebe1] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#ecf6ed] text-[#006c4c] flex items-center justify-center shrink-0">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                {featuredGoal ? (
                  <>
                    <span className="font-extrabold text-xs text-[#00261e] truncate">{featuredGoal.title}</span>
                    <span className="text-[11px] text-[#69746d] truncate">
                      ₹{featuredGoal.currentAmount.toLocaleString('en-IN')} of ₹{featuredGoal.targetAmount.toLocaleString('en-IN')} saved ({Math.min(100, Math.round((featuredGoal.currentAmount / (featuredGoal.targetAmount || 1)) * 100))}%)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-extrabold text-xs text-[#00261e]">Campus Savings Goals</span>
                    <span className="text-[11px] text-[#69746d]">Set your first campus target</span>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/goals')}
              className="text-xs font-bold text-[#006c4c] hover:underline shrink-0 ml-2"
            >
              {featuredGoal ? 'Deposit' : 'Set Goal'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
