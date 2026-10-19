import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  SearchX,
  AlertTriangle,
  Receipt,
  Wallet,
  Utensils,
  Train,
  ShoppingBag,
  BookOpen,
  Home,
  Film,
  HeartPulse,
  Tv,
  MoreHorizontal,
  CheckCircle2,
  ArrowUpDown,
  CreditCard,
  FileText,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext.tsx';
import { Transaction, CategoryKey } from '../types/finance.ts';
import { exportTransactionsToCSV } from '../utils/csvExport.ts';

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  Food: { label: 'Food', icon: Utensils, color: '#4C3478', bg: '#EDE7FF' },
  'Food & Canteen': { label: 'Food', icon: Utensils, color: '#4C3478', bg: '#EDE7FF' },
  Travel: { label: 'Travel', icon: Train, color: '#8B6FE8', bg: '#F1EDFA' },
  'Travel & Metro': { label: 'Travel', icon: Train, color: '#8B6FE8', bg: '#F1EDFA' },
  Shopping: { label: 'Shopping', icon: ShoppingBag, color: '#A48BF0', bg: '#EDE7FF' },
  'Tech & Gadgets': { label: 'Shopping', icon: ShoppingBag, color: '#A48BF0', bg: '#EDE7FF' },
  Education: { label: 'Education', icon: BookOpen, color: '#7E57C2', bg: '#EDE7FF' },
  'Academics & Books': { label: 'Education', icon: BookOpen, color: '#7E57C2', bg: '#EDE7FF' },
  'Hostel/Rent': { label: 'Hostel/Rent', icon: Home, color: '#6A4C9C', bg: '#F1EDFA' },
  'Hostel & Utilities': { label: 'Hostel/Rent', icon: Home, color: '#6A4C9C', bg: '#F1EDFA' },
  Entertainment: { label: 'Entertainment', icon: Film, color: '#8B6FE8', bg: '#EDE7FF' },
  'Entertainment & OTT': { label: 'Entertainment', icon: Film, color: '#8B6FE8', bg: '#EDE7FF' },
  Health: { label: 'Health', icon: HeartPulse, color: '#E56B75', bg: '#FDECEE' },
  'Medical & Health': { label: 'Health', icon: HeartPulse, color: '#E56B75', bg: '#FDECEE' },
  Subscriptions: { label: 'Subscriptions', icon: Tv, color: '#5C3E8A', bg: '#EDE7FF' },
  Other: { label: 'Other', icon: MoreHorizontal, color: '#777187', bg: '#F7F5FC' },
  Income: { label: 'Income', icon: Wallet, color: '#42CBA5', bg: '#E5F8F1' },
  'Monthly Allowance': { label: 'Income', icon: Wallet, color: '#42CBA5', bg: '#E5F8F1' },
};

const CATEGORY_FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All Categories' },
  { key: 'Food', label: 'Food' },
  { key: 'Travel', label: 'Travel' },
  { key: 'Shopping', label: 'Shopping' },
  { key: 'Education', label: 'Education' },
  { key: 'Hostel/Rent', label: 'Hostel/Rent' },
  { key: 'Entertainment', label: 'Entertainment' },
  { key: 'Health', label: 'Health' },
  { key: 'Subscriptions', label: 'Subscriptions' },
  { key: 'Other', label: 'Other' },
  { key: 'Income', label: 'Income' },
];

const ITEMS_PER_PAGE = 8;

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    openAddModal,
    openEditModal,
    deleteTransaction,
    selectedMonth,
  } = useFinance();

  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [dateRangePreset, setDateRangePreset] = useState<'all-time' | 'this-month' | 'last-30' | 'this-week' | 'custom'>('all-time');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Deletion Confirmation modal state
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState(false);

  // Helper to match category tabs with transactions (handling legacy names)
  const isCategoryMatch = (txnCat: string, filterKey: string): boolean => {
    if (filterKey === 'all') return true;
    const norm = (CATEGORY_MAP[txnCat]?.label || txnCat).toLowerCase();
    const target = filterKey.toLowerCase();
    if (norm === target) return true;
    if (target === 'food' && (norm.includes('food') || norm.includes('canteen'))) return true;
    if (target === 'travel' && (norm.includes('travel') || norm.includes('metro'))) return true;
    if (target === 'shopping' && (norm.includes('shopping') || norm.includes('tech'))) return true;
    if (target === 'education' && (norm.includes('education') || norm.includes('academic') || norm.includes('book'))) return true;
    if (target === 'hostel/rent' && (norm.includes('hostel') || norm.includes('rent') || norm.includes('utilities'))) return true;
    if (target === 'entertainment' && (norm.includes('entertainment') || norm.includes('ott'))) return true;
    if (target === 'health' && (norm.includes('health') || norm.includes('medic'))) return true;
    if (target === 'income' && (norm.includes('income') || norm.includes('allowance'))) return true;
    return false;
  };

  // Date range filter helper
  const isDateInRange = (dateStr: string): boolean => {
    if (dateRangePreset === 'all-time') return true;
    const txnTime = new Date(dateStr).getTime();
    if (isNaN(txnTime)) return true;

    // Use campus calendar October 2026 as reference baseline
    const referenceDate = new Date('2026-10-19T23:59:59');

    if (dateRangePreset === 'this-month') {
      return dateStr.startsWith(selectedMonth);
    }

    if (dateRangePreset === 'this-week') {
      // Oct 13 to Oct 20, 2026
      const weekStart = new Date('2026-10-13T00:00:00').getTime();
      const weekEnd = new Date('2026-10-20T23:59:59').getTime();
      return txnTime >= weekStart && txnTime <= weekEnd;
    }

    if (dateRangePreset === 'last-30') {
      const past30 = referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000;
      return txnTime >= past30 && txnTime <= referenceDate.getTime();
    }

    if (dateRangePreset === 'custom') {
      if (customStartDate && dateStr < customStartDate) return false;
      if (customEndDate && dateStr > customEndDate) return false;
      return true;
    }

    return true;
  };

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((t) => {
      // 1. Type Filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // 2. Category Filter
      if (!isCategoryMatch(t.category, selectedCategory)) return false;

      // 3. Date Range
      if (!isDateInRange(t.date)) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesNote = (t.locationOrNote || '').toLowerCase().includes(q);
        const matchesPayment = (t.paymentMethod || '').toLowerCase().includes(q);
        const matchesAmount = t.amount.toString().includes(q);
        return matchesTitle || matchesCategory || matchesNote || matchesPayment || matchesAmount;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return list;
  }, [
    transactions,
    selectedType,
    selectedCategory,
    dateRangePreset,
    customStartDate,
    customEndDate,
    searchQuery,
    sortBy,
  ]);

  // Financial summary for the currently filtered period/range
  const filteredMetrics = useMemo(() => {
    let expenses = 0;
    let income = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'expense') {
        expenses += t.amount;
      } else if (t.type === 'income') {
        income += t.amount;
      }
    }
    const net = income - expenses;
    return {
      expenses,
      income,
      net,
      count: filteredTransactions.length,
      expenseCount: filteredTransactions.filter((t) => t.type === 'expense').length,
      incomeCount: filteredTransactions.filter((t) => t.type === 'income').length,
    };
  }, [filteredTransactions]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setDateRangePreset('all-time');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  // CSV Export
  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 2000);
  };

  // Delete Handlers
  const confirmDelete = () => {
    if (!transactionToDelete) return;
    const title = transactionToDelete.title;
    deleteTransaction(transactionToDelete.id);
    setTransactionToDelete(null);
    setDeleteToast(`Deleted "${title}"`);
    setTimeout(() => setDeleteToast(null), 2500);
  };

  const cancelDelete = () => {
    setTransactionToDelete(null);
  };

  const renderCategoryBadge = (category: string) => {
    const config = CATEGORY_MAP[category] || {
      label: category,
      icon: MoreHorizontal,
      color: '#475569',
      bg: '#f1f5f9',
    };
    const Icon = config.icon;
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto flex flex-col gap-6 pb-12">
      {/* Toast Notification */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#4C3478] text-white text-xs font-bold flex items-center gap-2 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#42CBA5]" />
          <span>{deleteToast}</span>
        </div>
      )}

      {/* Header & Primary CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-[#29233A] tracking-tight">
              Transactions
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5F8F1] text-[#186851] text-xs font-bold border border-[#42CBA5]/30">
              <span className="w-2 h-2 rounded-full bg-[#42CBA5] animate-pulse"></span>
              <span>{transactions.length} Total Logs</span>
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#777187]">
            View, search, edit, and categorize your student expenses and monthly pocket money.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-10 px-4 rounded-xl bg-white border border-[#E9E4F2] text-[#777187] hover:text-[#4C3478] hover:bg-[#EDE7FF] text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-[#4C3478]" />
            <span>{exportNotice ? 'Exported!' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="h-10 px-5 rounded-full bg-[#4C3478] text-white font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-[#3B275F] transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#42CBA5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Bento Grid for Selected Period */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Expenses */}
        <div className="p-6 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777187]">
                Total Expenses
              </span>
              <span className="font-black text-3xl text-[#E56B75] mt-1 tracking-tight">
                −₹{filteredMetrics.expenses.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FDECEE] text-[#E56B75] flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#777187]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F7F5FC] font-semibold text-[#29233A]">
              {filteredMetrics.expenseCount} Debits
            </span>
            <span>
              Avg. ₹
              {filteredMetrics.expenseCount > 0
                ? Math.round(filteredMetrics.expenses / filteredMetrics.expenseCount).toLocaleString('en-IN')
                : 0}{' '}
              / entry
            </span>
          </div>
        </div>

        {/* Total Income */}
        <div className="p-6 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777187]">
                Total Income / Inflow
              </span>
              <span className="font-black text-3xl text-[#42CBA5] mt-1 tracking-tight">
                +₹{filteredMetrics.income.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E5F8F1] text-[#186851] flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-[#42CBA5]" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#777187]">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E5F8F1] text-[#186851] font-bold border border-[#42CBA5]/30">
              {filteredMetrics.incomeCount} Inflows
            </span>
            <span>Allowance &amp; stipends</span>
          </div>
        </div>

        {/* Net Period Cash Flow */}
        <div className="p-6 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-[#777187]">
                Period Net Cash Flow
              </span>
              <span
                className={`font-black text-3xl mt-1 tracking-tight ${
                  filteredMetrics.net >= 0 ? 'text-[#29233A]' : 'text-[#E56B75]'
                }`}
              >
                {filteredMetrics.net >= 0 ? '+' : '−'}₹
                {Math.abs(filteredMetrics.net).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#EDE7FF] text-[#4C3478] flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                filteredMetrics.net >= 0
                  ? 'bg-[#E5F8F1] text-[#186851] border border-[#42CBA5]/30'
                  : 'bg-[#FDECEE] text-[#E56B75]'
              }`}
            >
              {filteredMetrics.net >= 0 ? 'Surplus Cashflow' : 'Deficit Cashflow'}
            </span>
            <span className="text-[#777187]">
              {filteredMetrics.count} transactions in selection
            </span>
          </div>
        </div>
      </div>

      {/* Filter, Search & Sort Control Panel */}
      <div className="p-5 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col gap-4">
        {/* Top Controls: Search, Type, Date Preset, Sort */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Search by Description (Col 5) */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777187]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by description, merchant, note, or amount..."
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#F7F5FC] text-xs md:text-sm text-[#29233A] placeholder:text-[#777187] focus:outline-none focus:ring-2 focus:ring-[#8B6FE8] border border-[#E9E4F2] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777187] hover:text-[#29233A]"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter: All / Expense / Income (Col 3) */}
          <div className="lg:col-span-3 flex items-center p-1 rounded-xl bg-[#F7F5FC] border border-[#E9E4F2] text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setSelectedType('all');
                setCurrentPage(1);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                selectedType === 'all'
                  ? 'bg-[#4C3478] text-white shadow-xs'
                  : 'text-[#777187] hover:text-[#29233A]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType('expense');
                setCurrentPage(1);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                selectedType === 'expense'
                  ? 'bg-[#4C3478] text-white shadow-xs'
                  : 'text-[#777187] hover:text-[#29233A]'
              }`}
            >
              Expenses
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType('income');
                setCurrentPage(1);
              }}
              className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                selectedType === 'income'
                  ? 'bg-[#4C3478] text-white shadow-xs'
                  : 'text-[#777187] hover:text-[#29233A]'
              }`}
            >
              Income
            </button>
          </div>

          {/* Date Range Selection (Col 2) */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#4C3478] pointer-events-none" />
              <select
                value={dateRangePreset}
                onChange={(e) => {
                  setDateRangePreset(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#F7F5FC] border border-[#E9E4F2] text-xs font-bold text-[#29233A] focus:outline-none focus:ring-2 focus:ring-[#8B6FE8]"
                aria-label="Filter by date range"
              >
                <option value="all-time">All Dates</option>
                <option value="this-month">This Month (Oct 2026)</option>
                <option value="this-week">This Week</option>
                <option value="last-30">Last 30 Days</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>
          </div>

          {/* Sort Selection (Col 2) */}
          <div className="lg:col-span-2">
            <div className="relative">
              <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#4C3478] pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#F7F5FC] border border-[#E9E4F2] text-xs font-bold text-[#29233A] focus:outline-none focus:ring-2 focus:ring-[#8B6FE8]"
                aria-label="Sort transactions"
              >
                <option value="date-desc">Date: Newest First</option>
                <option value="date-asc">Date: Oldest First</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Date Pickers (Shown if Custom selected) */}
        {dateRangePreset === 'custom' && (
          <div className="p-3 rounded-2xl bg-[#F7F5FC] border border-[#E9E4F2] flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
            <span className="font-bold text-[#29233A]">Custom Range:</span>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-start" className="text-[11px] text-[#777187]">
                From:
              </label>
              <input
                id="custom-start"
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded-lg bg-white border border-[#E9E4F2] text-xs font-semibold text-[#29233A]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="custom-end" className="text-[11px] text-[#777187]">
                To:
              </label>
              <input
                id="custom-end"
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 rounded-lg bg-white border border-[#E9E4F2] text-xs font-semibold text-[#29233A]"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setCurrentPage(1);
                }}
                className="text-[11px] font-bold text-[#E56B75] hover:underline"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}

        {/* Category Filters Carousel/Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {CATEGORY_FILTER_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#4C3478] text-white shadow-xs'
                    : 'bg-[#F7F5FC] text-[#777187] hover:bg-[#EDE7FF] hover:text-[#4C3478]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Transactions Content Area */}
      {/* Edge Case 1: No Transactions at all in database */}
      {transactions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#EDE7FF] text-[#4C3478] flex items-center justify-center shadow-xs">
            <Receipt className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#29233A]">No transactions recorded yet</h2>
          <p className="text-xs md:text-sm text-[#777187] max-w-md">
            Your student ledger is clean and ready. Start by recording your daily canteen chai, xerox printouts, or monthly pocket money inflow.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-2 h-11 px-6 rounded-full bg-[#4C3478] text-white font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-[#3B275F] shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[#42CBA5]" />
            <span>Add Your First Transaction</span>
          </button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        /* Edge Case 2: No search results or filter match */
        <div className="p-12 rounded-3xl bg-white border border-[#E9E4F2] shadow-xs flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#FDECEE] text-[#E56B75] flex items-center justify-center">
            <SearchX className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#29233A]">No matching transactions found</h2>
          <p className="text-xs md:text-sm text-[#777187] max-w-md">
            We couldn't find any transactions matching your search query &ldquo;{searchQuery}&rdquo; or filter criteria.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-2 h-10 px-5 rounded-full bg-[#F7F5FC] hover:bg-[#EDE7FF] text-[#29233A] font-bold text-xs border border-[#E9E4F2] transition-colors"
          >
            Reset Filters &amp; Search
          </button>
        </div>
      ) : (
        /* Transactions Table & Mobile Cards */
        <div className="rounded-3xl bg-white border border-[#E9E4F2] shadow-xs overflow-hidden flex flex-col">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F5FC] text-[#777187] text-[11px] uppercase tracking-wider font-extrabold border-b border-[#E9E4F2]">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Payment Mode</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E4F2] text-sm text-[#29233A]">
                {paginatedTransactions.map((t) => {
                  const isIncome = t.type === 'income';
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-[#F7F5FC] transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-[#29233A]">{t.date}</span>
                          <span className="text-[11px] text-[#777187]">{t.time || 'Logged'}</span>
                        </div>
                      </td>

                      {/* Description & Note */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col min-w-0 max-w-sm">
                          <span className="font-bold text-xs md:text-sm text-[#29233A] truncate group-hover:text-[#4C3478] transition-colors">
                            {t.title}
                          </span>
                          {t.locationOrNote && (
                            <span className="text-[11px] text-[#777187] truncate">
                              {t.locationOrNote}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {renderCategoryBadge(t.category)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F7F5FC] border border-[#E9E4F2] text-xs font-semibold text-[#777187]">
                          <CreditCard className="w-3 h-3 text-[#4C3478]" />
                          <span>{t.paymentMethod || 'UPI'}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <span
                          className={`font-black text-sm md:text-base tabular-nums ${
                            isIncome ? 'text-[#42CBA5]' : 'text-[#E56B75]'
                          }`}
                        >
                          {isIncome ? `+₹${t.amount.toLocaleString('en-IN')}` : `−₹${t.amount.toLocaleString('en-IN')}`}
                        </span>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(t)}
                            className="w-8 h-8 rounded-lg hover:bg-[#EDE7FF] text-[#4C3478] flex items-center justify-center transition-colors"
                            title="Edit Transaction"
                            aria-label={`Edit ${t.title}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTransactionToDelete(t)}
                            className="w-8 h-8 rounded-lg hover:bg-[#FDECEE] text-[#E56B75] flex items-center justify-center transition-colors"
                            title="Delete Transaction"
                            aria-label={`Delete ${t.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col divide-y divide-[#E9E4F2]">
            {paginatedTransactions.map((t) => {
              const isIncome = t.type === 'income';
              const config = CATEGORY_MAP[t.category] || {
                label: t.category,
                icon: MoreHorizontal,
                color: '#777187',
                bg: '#F7F5FC',
              };
              const Icon = config.icon;

              return (
                <div
                  key={t.id}
                  className="p-4 flex flex-col gap-3 active:bg-[#F7F5FC] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: config.bg, color: config.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs md:text-sm text-[#29233A] truncate">
                          {t.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#777187] truncate">
                          <span>{t.date}</span>
                          <span>•</span>
                          <span>{t.paymentMethod || 'UPI'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`font-black text-sm md:text-base ${
                          isIncome ? 'text-[#42CBA5]' : 'text-[#E56B75]'
                        }`}
                      >
                        {isIncome ? `+₹${t.amount.toLocaleString('en-IN')}` : `−₹${t.amount.toLocaleString('en-IN')}`}
                      </div>
                      <span className="text-[10px] text-[#777187] uppercase font-bold tracking-wider">
                        {isIncome ? 'Credit' : 'Debit'}
                      </span>
                    </div>
                  </div>

                  {t.locationOrNote && (
                    <p className="text-xs text-[#777187] bg-[#F7F5FC] px-3 py-1.5 rounded-lg border border-[#E9E4F2]">
                      {t.locationOrNote}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {renderCategoryBadge(t.category)}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="h-8 px-3 rounded-lg bg-[#EDE7FF] text-[#4C3478] hover:bg-[#E9E4F2] text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionToDelete(t)}
                        className="h-8 px-3 rounded-lg bg-[#FDECEE] text-[#E56B75] hover:bg-[#fbd0d5] text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination & Footer Controls */}
          <div className="px-6 py-4 bg-[#F7F5FC] border-t border-[#E9E4F2] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#777187]">
              Showing{' '}
              <strong className="text-[#29233A]">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}
              </strong>{' '}
              of <strong className="text-[#29233A]">{filteredTransactions.length}</strong> matching records
            </span>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-white border border-[#E9E4F2] text-[#777187] flex items-center justify-center hover:bg-[#EDE7FF] hover:text-[#4C3478] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-colors ${
                      currentPage === page
                        ? 'bg-[#4C3478] text-white shadow-xs'
                        : 'bg-white border border-[#E9E4F2] text-[#777187] hover:bg-[#EDE7FF] hover:text-[#4C3478]'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg bg-white border border-[#E9E4F2] text-[#777187] flex items-center justify-center hover:bg-[#EDE7FF] hover:text-[#4C3478] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Edge Case: User cancels deletion or confirms) */}
      {transactionToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={cancelDelete}
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
                  Delete Transaction?
                </h3>
                <p className="text-xs text-[#777187]">
                  This action will update your available balance and runway.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F5FC] border border-[#E9E4F2] text-xs text-[#29233A] flex flex-col gap-1">
              <span className="font-bold text-[#29233A]">{transactionToDelete.title}</span>
              <div className="flex items-center justify-between text-[11px] text-[#777187]">
                <span>
                  {transactionToDelete.category} • {transactionToDelete.date}
                </span>
                <span className="font-black text-[#29233A]">
                  {transactionToDelete.type === 'income' ? '+' : '−'}₹
                  {transactionToDelete.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="h-10 px-4 rounded-xl bg-[#F7F5FC] hover:bg-[#EDE7FF] text-[#777187] hover:text-[#4C3478] font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="h-10 px-5 rounded-xl bg-[#E56B75] hover:bg-[#d65761] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
