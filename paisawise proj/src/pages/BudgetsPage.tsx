import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Plus,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit2,
  X,
  Wallet,
  Utensils,
  Train,
  ShoppingBag,
  BookOpen,
  Home,
  Film,
  Tv,
  HeartPulse,
  MoreHorizontal,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Percent,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';
import { CategoryBudget, CategoryKey } from '../types/finance.ts';
import { normalizeCategory, getCategoryCanonicalKey } from '../utils/financeCalculations.ts';
import { AutoDistributeModal } from '../components/common/AutoDistributeModal.tsx';

export const SUGGESTED_BUDGET_CATEGORIES: {
  key: CategoryKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  description: string;
}[] = [
  { key: 'Food', label: 'Food', icon: Utensils, color: '#4C3478', bg: '#EDE7FF', description: 'Canteen meals, chai, snacks & hostel mess extras' },
  { key: 'Travel', label: 'Travel', icon: Train, color: '#8B6FE8', bg: '#F1EDFA', description: 'Metro tokens, bus pass, auto fares & bike fuel' },
  { key: 'Shopping', label: 'Shopping', icon: ShoppingBag, color: '#A48BF0', bg: '#EDE7FF', description: 'Clothes, electronics, essentials & campus shopping' },
  { key: 'Education', label: 'Education', icon: BookOpen, color: '#7E57C2', bg: '#EDE7FF', description: 'Books, stationery, photocopy notes & exam fees' },
  { key: 'Hostel/Rent', label: 'Hostel/Rent', icon: Home, color: '#6A4C9C', bg: '#F1EDFA', description: 'Hostel rent, laundry, wifi & room utilities' },
  { key: 'Entertainment', label: 'Entertainment', icon: Film, color: '#8B6FE8', bg: '#EDE7FF', description: 'Cinema tickets, cafe hangs, outings & parties' },
  { key: 'Subscriptions', label: 'Subscriptions', icon: Tv, color: '#5C3E8A', bg: '#EDE7FF', description: 'Spotify, Prime, Netflix & digital subscriptions' },
  { key: 'Health', label: 'Health', icon: HeartPulse, color: '#E56B75', bg: '#FDECEE', description: 'Pharmacy, medical checkups & sports supplements' },
  { key: 'Other', label: 'Other', icon: MoreHorizontal, color: '#777187', bg: '#F7F5FC', description: 'Miscellaneous student personal expenses' },
];

export const BudgetsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    categories,
    computedCategories,
    totalBudget,
    totalSpent,
    budgetRemaining,
    availableBalance,
    runway,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    addCategoryBudget,
    editCategoryBudget,
    deleteCategoryBudget,
    updateMultipleCategoryBudgets,
  } = useFinance();

  // Auto-distribute allowance modal state
  const [isAutoDistributeOpen, setIsAutoDistributeOpen] = useState(false);

  // Month selector dropdown toggle
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Filter tabs for categories list
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'warning' | 'over' | 'healthy'>('all');

  // Modal State for Create / Edit Budget
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState<CategoryKey>('Food');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formPeriod, setFormPeriod] = useState<'monthly' | 'weekly' | 'custom'>('monthly');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formAlertThreshold, setFormAlertThreshold] = useState<number>(80);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Deletion Confirmation Modal State
  const [budgetToDelete, setBudgetToDelete] = useState<CategoryBudget | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active month label
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
    return 'October 2026';
  }, [availableMonths, selectedMonth]);

  // Overall budget percentage used
  const overallPercentage = useMemo(() => {
    if (totalBudget <= 0) return 0;
    return Math.min(150, Math.round((totalSpent / totalBudget) * 100));
  }, [totalSpent, totalBudget]);

  // Active Alerts dynamically computed from actual transactions
  const { overBudgetList, approachingList } = useMemo(() => {
    const over: CategoryBudget[] = [];
    const approaching: CategoryBudget[] = [];

    for (const cat of computedCategories) {
      if (cat.allocated <= 0) continue;
      const threshold = cat.alertThreshold !== undefined ? cat.alertThreshold : 80;
      const ratio = cat.spent / cat.allocated;
      const percent = Math.round(ratio * 100);

      if (cat.spent > cat.allocated) {
        over.push(cat);
      } else if (percent >= threshold) {
        approaching.push(cat);
      }
    }

    return { overBudgetList: over, approachingList: approaching };
  }, [computedCategories]);

  // Filtered categories based on filter tab
  const filteredCategoryCards = useMemo(() => {
    return computedCategories.filter((cat) => {
      const threshold = cat.alertThreshold !== undefined ? cat.alertThreshold : 80;
      const percent = cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0;

      if (activeFilterTab === 'over') return cat.spent > cat.allocated;
      if (activeFilterTab === 'warning') return percent >= threshold && cat.spent <= cat.allocated;
      if (activeFilterTab === 'healthy') return percent < threshold && cat.spent <= cat.allocated;
      return true;
    });
  }, [computedCategories, activeFilterTab]);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingBudget(null);
    // Find first unused suggested category if possible
    const existingKeys = new Set(categories.map((c) => getCategoryCanonicalKey(c.name)));
    const firstUnused = SUGGESTED_BUDGET_CATEGORIES.find((s) => !existingKeys.has(getCategoryCanonicalKey(s.key)));

    setFormCategory(firstUnused ? firstUnused.key : 'Food');
    setFormAmount('1500');
    setFormPeriod('monthly');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormAlertThreshold(80);
    setFormDescription(firstUnused ? firstUnused.description : 'Monthly envelope spending limit');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (budget: CategoryBudget) => {
    setEditingBudget(budget);
    setFormCategory(budget.name);
    setFormAmount(budget.allocated.toString());
    setFormPeriod(budget.period || 'monthly');
    setFormStartDate(budget.startDate || new Date().toISOString().split('T')[0]);
    setFormAlertThreshold(budget.alertThreshold !== undefined ? budget.alertThreshold : 80);
    setFormDescription(budget.description || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  // Form Validation & Submit
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const amountNum = parseFloat(formAmount);
    if (!formAmount.trim() || isNaN(amountNum) || amountNum <= 0) {
      errors.amount = 'Please enter a valid budget amount greater than ₹0';
    }

    // Check for duplicate category budget in the same period
    const targetKey = getCategoryCanonicalKey(formCategory);
    if (!editingBudget) {
      const isDuplicate = categories.some(
        (c) => getCategoryCanonicalKey(c.name) === targetKey
      );
      if (isDuplicate) {
        errors.category = `A budget for "${formCategory}" already exists. Please edit that envelope instead.`;
      }
    } else {
      // If editing and changed category to another existing category
      const isDuplicate = categories.some(
        (c) => c.id !== editingBudget.id && getCategoryCanonicalKey(c.name) === targetKey
      );
      if (isDuplicate) {
        errors.category = `Another budget for "${formCategory}" already exists.`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingBudget) {
      editCategoryBudget(editingBudget.id, {
        name: formCategory,
        allocated: amountNum,
        period: formPeriod,
        startDate: formStartDate || undefined,
        alertThreshold: formAlertThreshold,
        description: formDescription.trim() || `${formCategory} envelope`,
      });
      setToastMessage(`Updated ${formCategory} budget to ₹${amountNum.toLocaleString('en-IN')}`);
    } else {
      addCategoryBudget({
        name: formCategory,
        iconName: formCategory.toLowerCase(),
        allocated: amountNum,
        description: formDescription.trim() || `${formCategory} campus envelope`,
        period: formPeriod,
        startDate: formStartDate || undefined,
        alertThreshold: formAlertThreshold,
      });
      setToastMessage(`Created ${formCategory} budget with ₹${amountNum.toLocaleString('en-IN')} limit`);
    }

    closeModal();
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auto-Distribute allowance handler
  const handleApplyDistribution = (allocations: Record<string, number>, mode: 'replace' | 'add') => {
    updateMultipleCategoryBudgets(allocations);
    setToastMessage(
      mode === 'replace'
        ? 'Applied percentage preset budget distribution across envelopes!'
        : 'Distributed allowance top-up to category envelopes!'
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Allowance distribution metrics
  const spendableAllowance = useMemo(() => {
    return Math.max(0, (profile?.monthlyAllowance || 10000) - (profile?.fixedDues || 0));
  }, [profile?.monthlyAllowance, profile?.fixedDues]);

  const unbudgetedAllowance = useMemo(() => {
    return Math.max(0, spendableAllowance - totalBudget);
  }, [spendableAllowance, totalBudget]);

  // Delete Handlers
  const confirmDelete = () => {
    if (!budgetToDelete) return;
    const name = budgetToDelete.name;
    deleteCategoryBudget(budgetToDelete.id);
    setBudgetToDelete(null);
    setToastMessage(`Deleted ${name} budget envelope`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Category Icon helper
  const getCategoryIcon = (name: string) => {
    const found = SUGGESTED_BUDGET_CATEGORIES.find(
      (s) => normalizeCategory(s.key) === normalizeCategory(name)
    );
    if (found) {
      const Icon = found.icon;
      return <Icon className="w-5 h-5" />;
    }
    return <Wallet className="w-5 h-5" />;
  };

  const getCategoryColor = (name: string) => {
    const found = SUGGESTED_BUDGET_CATEGORIES.find(
      (s) => normalizeCategory(s.key) === normalizeCategory(name)
    );
    return found ? { color: found.color, bg: found.bg } : { color: '#006c4c', bg: '#ecf6ed' };
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto flex flex-col gap-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#4C3478] text-white text-xs font-bold flex items-center gap-2 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#42CBA5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-[#29233A] tracking-tight">
              Budgets &amp; Envelopes
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F8F1] text-[#186851] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#42CBA5] animate-pulse"></span>
              <span>Live Campus Limits</span>
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#777187]">
            Allocate monthly spending caps per category, track actual burn rate, and receive proactive limit alerts.
          </p>
        </div>

        {/* Right Action: Month Selector + Create Budget Button */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="h-10 px-3.5 rounded-xl bg-white border border-[#E9E4F2] text-xs font-bold text-[#29233A] flex items-center gap-2 hover:bg-[#F7F5FC] transition-colors shadow-xs"
              aria-label="Select budget month"
            >
              <Calendar className="w-4 h-4 text-[#4C3478]" />
              <span>{activeMonthLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#777187]" />
            </button>

            {showMonthDropdown && (
              <div className="absolute right-0 top-12 z-40 w-48 rounded-2xl bg-white border border-[#E9E4F2] shadow-xl p-1.5 flex flex-col gap-1 animate-in fade-in duration-100">
                {availableMonths.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m.value);
                      setShowMonthDropdown(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors ${
                      selectedMonth === m.value
                        ? 'bg-[#4C3478] text-white shadow-xs'
                        : 'text-[#29233A] hover:bg-[#F7F5FC]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto-Distribute Allowance Button */}
          <button
            type="button"
            onClick={() => setIsAutoDistributeOpen(true)}
            className="h-10 px-4 rounded-full bg-[#EDE7FF] text-[#4C3478] border border-[#E9E4F2] font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-[#E5F8F1] transition-all shadow-xs active:scale-95"
            title="Automatically distribute allowance with percentage presets"
          >
            <Sliders className="w-4 h-4 text-[#4C3478]" />
            <span>Auto-Distribute</span>
          </button>

          {/* Create Budget Button */}
          <button
            type="button"
            onClick={openCreateModal}
            className="h-10 px-5 rounded-full bg-[#4C3478] text-white font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-[#3B275F] transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#42CBA5]" />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {/* Unbudgeted Allowance Quick Distribution Helper Banner */}
      {unbudgetedAllowance > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#EDE7FF] via-[#F7F5FC] to-white border border-[#E9E4F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4C3478] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-[#42CBA5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-[#29233A]">
                  Unbudgeted Allowance Available
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5F8F1] text-[#186851] text-[10px] font-black uppercase">
                  ₹{unbudgetedAllowance.toLocaleString('en-IN')} Unassigned
                </span>
              </div>
              <p className="text-xs text-[#777187]">
                You have ₹{unbudgetedAllowance.toLocaleString('en-IN')} of your ₹{spendableAllowance.toLocaleString('en-IN')} monthly allowance waiting to be allocated across your envelopes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoDistributeOpen(true)}
            className="h-9 px-4 rounded-full bg-[#4C3478] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#3B275F] transition-all self-start sm:self-center shadow-xs shrink-0 active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-[#42CBA5]" />
            <span>Distribute with Presets</span>
          </button>
        </div>
      )}

      {/* Over-Allocated Allowance Warning & Rebalance Banner */}
      {totalBudget > spendableAllowance && (
        <div className="p-4 rounded-3xl bg-[#FFF9E6] border border-[#FFE8A3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFE8A3] text-[#946300] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-[#946300]">
                Combined Envelopes Exceed Monthly Allowance
              </span>
              <p className="text-xs text-[#735000]">
                Your total envelope targets (₹{totalBudget.toLocaleString('en-IN')}) exceed your monthly allowance (₹{spendableAllowance.toLocaleString('en-IN')}) by ₹{(totalBudget - spendableAllowance).toLocaleString('en-IN')}. Use percentage presets to rebalance within your allowance limit.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoDistributeOpen(true)}
            className="h-9 px-4 rounded-full bg-[#4C3478] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#3B275F] transition-all self-start sm:self-center shadow-xs shrink-0 active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5 text-[#42CBA5]" />
            <span>Rebalance Allowance</span>
          </button>
        </div>
      )}

      {/* Top 3 Summary Cards: Overall Budget, Total Spent, Remaining */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Overall Monthly Spending Budget */}
        <div className="p-6 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777187]">
                Overall Monthly Budget
              </span>
              <span className="font-black text-3xl text-[#29233A] mt-1 tracking-tight">
                ₹{totalBudget.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EDE7FF] text-[#4C3478] flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-[#777187]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F7F5FC] font-semibold text-[#29233A]">
              {categories.length} Active Envelopes
            </span>
            <span className="font-semibold text-[#4C3478]">Allocated for {activeMonthLabel}</span>
          </div>
        </div>

        {/* 2. Total Spent Against Budget */}
        <div className="p-6 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777187]">
                Total Spent Against Budget
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-black text-3xl text-[#29233A] tracking-tight">
                  ₹{totalSpent.toLocaleString('en-IN')}
                </span>
                <span
                  className={`text-xs font-bold ${
                    overallPercentage > 100
                      ? 'text-[#E56B75]'
                      : overallPercentage >= 80
                      ? 'text-[#946300]'
                      : 'text-[#42CBA5]'
                  }`}
                >
                  ({overallPercentage}% used)
                </span>
              </div>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                overallPercentage > 100
                  ? 'bg-[#FDECEE] text-[#E56B75]'
                  : overallPercentage >= 80
                  ? 'bg-[#FFF9E6] text-[#946300]'
                  : 'bg-[#E5F8F1] text-[#42CBA5]'
              }`}
            >
              {overallPercentage > 100 ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="w-full h-2.5 rounded-full bg-[#F7F5FC] overflow-hidden border border-[#E9E4F2]/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage > 100
                    ? 'bg-[#E56B75]'
                    : overallPercentage >= 80
                    ? 'bg-[#FFE8A3]'
                    : 'bg-[#42CBA5]'
                }`}
                style={{ width: `${Math.min(100, overallPercentage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#777187]">
              <span>0%</span>
              <span className="font-bold">
                {overallPercentage > 100
                  ? `Over budget by ₹${(totalSpent - totalBudget).toLocaleString('en-IN')}`
                  : `₹${(totalBudget - totalSpent).toLocaleString('en-IN')} unspent`}
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* 3. Remaining Budget */}
        <div className="p-6 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777187]">
                Remaining Budget
              </span>
              <span
                className={`font-black text-3xl mt-1 tracking-tight ${
                  budgetRemaining > 0 ? 'text-[#42CBA5]' : 'text-[#E56B75]'
                }`}
              >
                ₹{budgetRemaining.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E5F8F1] text-[#186851] flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#42CBA5]" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-[#4C3478] text-white font-bold text-[11px]">
              Daily Limit
            </span>
            <span className="font-bold text-[#42CBA5]">₹{runway.safeDailySpend}/day safe spend pacing</span>
          </div>
        </div>
      </div>

      {/* Dynamic Alerts Banner Section: Over-Budget & Approaching Limit */}
      {(overBudgetList.length > 0 || approachingList.length > 0) && (
        <div className="flex flex-col gap-3">
          {/* Over-Budget Alert Cards */}
          {overBudgetList.map((cat) => {
            const overAmount = cat.spent - cat.allocated;
            const percent = Math.round((cat.spent / cat.allocated) * 100);
            return (
              <div
                key={`over-${cat.id}`}
                className="p-4 rounded-2xl bg-[#FDECEE] border border-[#E56B75]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FDECEE] text-[#E56B75] flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#C53B47]">
                        Over-Budget Alert: {cat.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#E56B75] text-white text-[10px] font-black uppercase">
                        {percent}% Used
                      </span>
                    </div>
                    <p className="text-xs text-[#777187]">
                      You spent ₹{cat.spent.toLocaleString('en-IN')} of your ₹{cat.allocated.toLocaleString('en-IN')} cap (exceeded by ₹{overAmount.toLocaleString('en-IN')}).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => navigate(`/transactions?category=${encodeURIComponent(cat.name)}`)}
                    className="h-8 px-3 rounded-lg bg-white border border-[#E56B75]/40 text-[#C53B47] text-xs font-bold hover:bg-[#FDECEE] transition-colors"
                  >
                    View Logs
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="h-8 px-3 rounded-lg bg-[#E56B75] text-white text-xs font-bold hover:bg-[#C53B47] transition-colors"
                  >
                    Adjust Budget
                  </button>
                </div>
              </div>
            );
          })}

          {/* Approaching-Limit Alert Cards */}
          {approachingList.map((cat) => {
            const remaining = cat.allocated - cat.spent;
            const threshold = cat.alertThreshold !== undefined ? cat.alertThreshold : 80;
            const percent = Math.round((cat.spent / cat.allocated) * 100);
            return (
              <div
                key={`warn-${cat.id}`}
                className="p-4 rounded-2xl bg-[#FFF9E6] border border-[#FFE8A3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFE8A3] text-[#946300] flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#946300]">
                        Approaching Limit: {cat.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#FFE8A3] text-[#735000] text-[10px] font-black uppercase">
                        {percent}% Used • Alert at {threshold}%
                      </span>
                    </div>
                    <p className="text-xs text-[#735000]">
                      Spent ₹{cat.spent.toLocaleString('en-IN')} of ₹{cat.allocated.toLocaleString('en-IN')}. Only ₹{remaining.toLocaleString('en-IN')} remaining before cap is reached.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => navigate(`/transactions?category=${encodeURIComponent(cat.name)}`)}
                    className="h-8 px-3 rounded-lg bg-white border border-[#FFE8A3] text-[#946300] text-xs font-bold hover:bg-[#FFE8A3]/40 transition-colors"
                  >
                    View Logs
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="h-8 px-3 rounded-lg bg-[#4C3478] text-white text-xs font-bold hover:bg-[#3B275F] transition-colors"
                  >
                    Edit Limit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Budget Cards Section */}
      <div className="flex flex-col gap-4">
        {/* Section Subheader & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-black text-[#29233A]">
              Category Budget Envelopes
            </h2>
            <p className="text-xs text-[#777187]">
              Live tracking against actual student expenses recorded for {activeMonthLabel}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-white border border-[#E9E4F2] text-xs font-bold overflow-x-auto shadow-xs">
            <button
              type="button"
              onClick={() => setActiveFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeFilterTab === 'all'
                  ? 'bg-[#4C3478] text-white shadow-xs'
                  : 'text-[#777187] hover:text-[#29233A]'
              }`}
            >
              All ({computedCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('over')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeFilterTab === 'over'
                  ? 'bg-[#4C3478] text-white shadow-xs'
                  : 'text-[#777187] hover:text-[#29233A]'
              }`}
            >
              Over Budget ({overBudgetList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('warning')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeFilterTab === 'warning'
                  ? 'bg-[#4C3478] text-white shadow-xs'
                  : 'text-[#777187] hover:text-[#29233A]'
              }`}
            >
              Approaching ({approachingList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('healthy')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeFilterTab === 'healthy'
                  ? 'bg-[#4C3478] text-white shadow-xs'
                  : 'text-[#777187] hover:text-[#29233A]'
              }`}
            >
              Healthy
            </button>
          </div>
        </div>

        {/* Empty State: If no budgets configured at all */}
        {categories.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#EDE7FF] text-[#4C3478] flex items-center justify-center shadow-xs">
              <PieChart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-[#29233A]">No category budgets configured</h3>
            <p className="text-xs md:text-sm text-[#777187] max-w-md">
              Create envelope budgets for Food, Travel, Shopping, and Academics to keep your monthly cash flow disciplined.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-2 h-11 px-6 rounded-full bg-[#4C3478] text-white font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-[#3B275F] shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 text-[#42CBA5]" />
              <span>Create Your First Budget</span>
            </button>
          </div>
        ) : filteredCategoryCards.length === 0 ? (
          /* Empty tab filter match */
          <div className="p-10 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col items-center justify-center text-center gap-2">
            <ShieldCheck className="w-8 h-8 text-[#42CBA5]" />
            <h4 className="text-base font-bold text-[#29233A]">No envelopes in this filter view</h4>
            <p className="text-xs text-[#777187]">
              All budgets are in other states. Switch back to "All" to inspect your envelopes.
            </p>
            <button
              type="button"
              onClick={() => setActiveFilterTab('all')}
              className="mt-2 text-xs font-bold text-[#4C3478] hover:underline"
            >
              Show All Envelopes
            </button>
          </div>
        ) : (
          /* Category Budget Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategoryCards.map((cat) => {
              const allocated = cat.allocated || 0;
              const spent = cat.spent || 0;
              const remaining = Math.max(0, allocated - spent);
              const percent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
              const threshold = cat.alertThreshold !== undefined ? cat.alertThreshold : 80;
              const isOver = spent > allocated;
              const isApproaching = percent >= threshold && !isOver;
              const { color, bg } = getCategoryColor(cat.name);

              return (
                <div
                  key={cat.id}
                  className="p-5 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col justify-between gap-4 hover:shadow-md transition-shadow group"
                >
                  {/* Card Top: Icon, Name, Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: bg, color: color }}
                      >
                        {getCategoryIcon(cat.name)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-sm md:text-base text-[#29233A] truncate">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-[#777187] capitalize">
                          {cat.period || 'Monthly'} Cap
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isOver ? (
                      <span className="px-2.5 py-1 rounded-full bg-[#FDECEE] text-[#E56B75] text-[10px] font-black uppercase whitespace-nowrap">
                        Over ({percent}%)
                      </span>
                    ) : isApproaching ? (
                      <span className="px-2.5 py-1 rounded-full bg-[#FFF9E6] text-[#946300] text-[10px] font-black uppercase whitespace-nowrap border border-[#FFE8A3]">
                        Alert ({percent}%)
                      </span>
                    ) : spent === 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-[#F7F5FC] text-[#777187] text-[10px] font-bold uppercase whitespace-nowrap">
                        Intact
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-[#E5F8F1] text-[#186851] text-[10px] font-black uppercase whitespace-nowrap">
                        On Track ({percent}%)
                      </span>
                    )}
                  </div>

                  {/* Description if present */}
                  {cat.description && (
                    <p className="text-xs text-[#777187] line-clamp-1">
                      {cat.description}
                    </p>
                  )}

                  {/* Financial Metrics */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-[#F7F5FC]">
                    <div className="flex items-baseline justify-between text-xs">
                      <div>
                        <span className="text-[11px] text-[#777187]">Spent: </span>
                        <span className="font-black text-sm text-[#29233A]">
                          ₹{spent.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#777187]">Limit: </span>
                        <span className="font-bold text-xs text-[#29233A]">
                          ₹{allocated.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar with Alert Threshold Indicator */}
                    <div className="relative w-full h-2.5 rounded-full bg-[#F7F5FC] overflow-hidden border border-[#E9E4F2]/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver
                            ? 'bg-[#E56B75]'
                            : isApproaching
                            ? 'bg-[#FFE8A3]'
                            : 'bg-[#42CBA5]'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`font-bold ${
                          isOver ? 'text-[#E56B75]' : 'text-[#42CBA5]'
                        }`}
                      >
                        {isOver
                          ? `Exceeded by ₹${(spent - allocated).toLocaleString('en-IN')}`
                          : `₹${remaining.toLocaleString('en-IN')} remaining`}
                      </span>
                      <span className="text-[#777187] text-[10px]">
                        Alert at {threshold}%
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: View Logs, Edit, Delete */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E9E4F2] text-xs">
                    <button
                      type="button"
                      onClick={() => navigate(`/transactions?category=${encodeURIComponent(cat.name)}`)}
                      className="font-bold text-[#4C3478] hover:underline flex items-center gap-1 group/btn"
                    >
                      <span>View Logs</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="w-8 h-8 rounded-lg hover:bg-[#EDE7FF] text-[#4C3478] flex items-center justify-center transition-colors"
                        title="Edit Budget"
                        aria-label={`Edit ${cat.name} budget`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBudgetToDelete(cat)}
                        className="w-8 h-8 rounded-lg hover:bg-[#FDECEE] text-[#E56B75] flex items-center justify-center transition-colors"
                        title="Delete Budget"
                        aria-label={`Delete ${cat.name} budget`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Budget Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 my-6 border border-[#E9E4F2]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#E9E4F2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4C3478] text-white flex items-center justify-center shadow-xs">
                  <PieChart className="w-5 h-5 text-[#42CBA5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#29233A] tracking-tight">
                    {editingBudget ? 'Edit Category Budget' : 'Create Category Budget'}
                  </h3>
                  <p className="text-xs text-[#777187]">
                    {editingBudget
                      ? `Update cap and threshold for ${editingBudget.name}`
                      : 'Set a disciplined spending cap for your student envelope'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-9 h-9 rounded-full bg-[#F7F5FC] text-[#777187] hover:text-[#29233A] hover:bg-[#EDE7FF] flex items-center justify-center transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="px-6 py-4 flex flex-col gap-4 text-xs">
              {/* Category Picker */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="budget-category" className="text-[11px] font-bold uppercase tracking-wider text-[#777187]">
                  Category*
                </label>
                <select
                  id="budget-category"
                  value={formCategory}
                  onChange={(e) => {
                    const nextCat = e.target.value as CategoryKey;
                    setFormCategory(nextCat);
                    const found = SUGGESTED_BUDGET_CATEGORIES.find((s) => s.key === nextCat);
                    if (found && !formDescription) {
                      setFormDescription(found.description);
                    }
                    if (formErrors.category) {
                      setFormErrors((prev) => ({ ...prev, category: '' }));
                    }
                  }}
                  className={`w-full h-11 px-3.5 rounded-xl bg-[#F7F5FC] text-xs md:text-sm font-semibold text-[#29233A] focus:outline-none focus:ring-2 focus:ring-[#4C3478] border transition-all ${
                    formErrors.category ? 'border-[#E56B75] bg-[#FDECEE]/50' : 'border-[#E9E4F2]'
                  }`}
                >
                  {SUGGESTED_BUDGET_CATEGORIES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label} — {s.description}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <span className="text-[11px] font-semibold text-[#E56B75] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {formErrors.category}
                  </span>
                )}
              </div>

              {/* Budget Amount (INR) with Quick Presets */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="budget-amount" className="text-[11px] font-bold uppercase tracking-wider text-[#777187]">
                    Budget Amount (INR)*
                  </label>
                  <div className="flex items-center gap-1">
                    {[500, 1000, 2000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          const current = parseFloat(formAmount) || 0;
                          setFormAmount((current + val).toString());
                          if (formErrors.amount) setFormErrors((prev) => ({ ...prev, amount: '' }));
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#EDE7FF] hover:bg-[#E9E4F2] text-[#4C3478] text-[10px] font-bold border border-[#E9E4F2] transition-colors"
                      >
                        +₹{val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-[#777187]">
                    ₹
                  </span>
                  <input
                    id="budget-amount"
                    type="number"
                    min="1"
                    step="50"
                    value={formAmount}
                    onChange={(e) => {
                      setFormAmount(e.target.value);
                      if (formErrors.amount) setFormErrors((prev) => ({ ...prev, amount: '' }));
                    }}
                    placeholder="1500"
                    className={`w-full h-11 pl-8 pr-4 rounded-xl bg-[#F7F5FC] text-sm font-bold text-[#29233A] placeholder:text-[#777187] focus:outline-none focus:ring-2 focus:ring-[#4C3478] border transition-all ${
                      formErrors.amount ? 'border-[#E56B75] bg-[#FDECEE]/50' : 'border-[#E9E4F2]'
                    }`}
                  />
                </div>
                {formErrors.amount && (
                  <span className="text-[11px] font-semibold text-[#E56B75] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {formErrors.amount}
                  </span>
                )}
              </div>

              {/* Budget Period & Optional Start Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Budget Period */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="budget-period" className="text-[11px] font-bold uppercase tracking-wider text-[#777187]">
                    Budget Period
                  </label>
                  <select
                    id="budget-period"
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-[#F7F5FC] text-xs font-semibold text-[#29233A] focus:outline-none focus:ring-2 focus:ring-[#4C3478] border border-[#E9E4F2]"
                  >
                    <option value="monthly">Monthly Cycle</option>
                    <option value="weekly">Weekly Cycle</option>
                    <option value="custom">Custom Date Period</option>
                  </select>
                </div>

                {/* Optional Start Date */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="budget-date" className="text-[11px] font-bold uppercase tracking-wider text-[#777187]">
                    Start Date (Optional)
                  </label>
                  <input
                    id="budget-date"
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#F7F5FC] text-xs font-semibold text-[#29233A] focus:outline-none focus:ring-2 focus:ring-[#4C3478] border border-[#E9E4F2]"
                  />
                </div>
              </div>

              {/* Alert Threshold (Default 80%) */}
              <div className="p-3.5 rounded-2xl bg-[#F7F5FC] border border-[#E9E4F2] flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#29233A] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#4C3478]" />
                    <span>Alert Warning Threshold:</span>
                  </span>
                  <span className="font-black text-[#4C3478] bg-white px-2 py-0.5 rounded-md border border-[#E9E4F2]">
                    {formAlertThreshold}% of budget
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={formAlertThreshold}
                  onChange={(e) => setFormAlertThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-[#E9E4F2] rounded-lg appearance-none cursor-pointer accent-[#4C3478]"
                  aria-label="Set alert threshold"
                />
                <div className="flex justify-between text-[10px] text-[#777187]">
                  <span>50% (Early warning)</span>
                  <span>80% (Recommended)</span>
                  <span>95% (Near limit)</span>
                </div>
              </div>

              {/* Optional Description / Memo */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="budget-desc" className="text-[11px] font-bold uppercase tracking-wider text-[#777187]">
                  Envelope Description / Note
                </label>
                <input
                  id="budget-desc"
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Canteen lunch, coffee & late-night library tea"
                  className="w-full h-10 px-3 rounded-xl bg-[#F7F5FC] text-xs text-[#29233A] placeholder:text-[#777187] focus:outline-none focus:ring-2 focus:ring-[#4C3478] border border-[#E9E4F2]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E9E4F2]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 px-4 rounded-xl bg-[#F7F5FC] hover:bg-[#EDE7FF] text-[#777187] font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-xl bg-[#4C3478] hover:bg-[#3B275F] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  {editingBudget ? (
                    <>
                      <Sparkles className="w-4 h-4 text-[#42CBA5]" />
                      <span>Update Envelope</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#42CBA5]" />
                      <span>Create Envelope</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {budgetToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setBudgetToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#E9E4F2] flex flex-col gap-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FDECEE] text-[#E56B75] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-extrabold text-base text-[#29233A]">
                  Delete {budgetToDelete.name} Budget?
                </h3>
                <p className="text-xs text-[#777187]">
                  Are you sure you want to remove this envelope limit?
                </p>
              </div>
            </div>

            <p className="text-xs text-[#777187] bg-[#F7F5FC] p-3 rounded-2xl border border-[#E9E4F2]">
              Deleting this envelope removes the <strong>₹{budgetToDelete.allocated.toLocaleString('en-IN')}</strong> limit for {budgetToDelete.name}. Your actual transaction history will not be deleted, but spending in this category will no longer be capped.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                className="h-10 px-4 rounded-xl bg-[#F7F5FC] hover:bg-[#EDE7FF] text-[#777187] font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-10 px-5 rounded-xl bg-[#E56B75] hover:bg-[#C53B47] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Distribute Allowance Modal */}
      <AutoDistributeModal
        isOpen={isAutoDistributeOpen}
        onClose={() => setIsAutoDistributeOpen(false)}
        categories={categories}
        monthlyAllowance={profile?.monthlyAllowance || 10000}
        fixedDues={profile?.fixedDues || 0}
        availableBalance={availableBalance}
        totalBudget={totalBudget}
        onApply={handleApplyDistribution}
        selectedMonthLabel={activeMonthLabel}
      />
    </div>
  );
};
