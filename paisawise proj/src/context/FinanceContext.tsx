import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  StudentProfile,
  CategoryBudget,
  SavingsGoal,
  GoalContribution,
  Transaction,
  RunwayCalculation,
  ThemePreference,
  NotificationPreferences,
  UserPreferences,
} from '../types/finance.ts';
import {
  INITIAL_PROFILE,
  INITIAL_CATEGORIES,
  INITIAL_GOALS,
  INITIAL_TRANSACTIONS,
} from '../data/initialData.ts';
import {
  calculateRunway,
  calculateTotalSpent,
  calculateTotalIncome,
  computeCategorySpend,
  calculateNeedsVsWants,
  suggestAutoBalanceTransfer,
} from '../utils/financeCalculations.ts';

interface FinanceContextType {
  profile: StudentProfile;
  setProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  transactions: Transaction[];
  addTransaction: (txn: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  editTransaction: (id: string, updates: Partial<Transaction>) => void;
  categories: CategoryBudget[];
  updateCategoryBudget: (id: string, newAllocated: number) => void;
  updateMultipleCategoryBudgets: (allocations: Record<string, number>) => void;
  addCategoryBudget: (budget: Omit<CategoryBudget, 'id' | 'spent'>) => void;
  editCategoryBudget: (id: string, updates: Partial<CategoryBudget>) => void;
  deleteCategoryBudget: (id: string) => void;
  rebalanceCategories: (fromCategoryName: string, toCategoryName: string, amount: number) => void;
  executeAutoBalance: () => void;
  goals: SavingsGoal[];
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  editGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;
  addGoalContribution: (
    goalId: string,
    contribution: { amount: number; date?: string; note?: string }
  ) => void;
  restoreDemoGoals: () => void;
  safetyBuffer: number;
  setSafetyBuffer: (val: number) => void;
  autoBalanceEnabled: boolean;
  setAutoBalanceEnabled: (val: boolean) => void;
  // Selected period state
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: { value: string; label: string }[];
  periodTransactions: Transaction[];
  // Computed values according to defined accounting model
  totalIncome: number;
  totalSpent: number;
  totalBudget: number;
  budgetRemaining: number;
  availableBalance: number;
  liquidCash: number;
  daysLeft: number;
  runway: RunwayCalculation;
  computedCategories: CategoryBudget[];
  needsVsWants: {
    needsAmount: number;
    wantsAmount: number;
    needsPercentage: number;
    wantsPercentage: number;
  };
  autoBalanceSuggestion: ReturnType<typeof suggestAutoBalanceTransfer>;
  // Global modal/drawer controls
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (txn: Transaction | null) => void;
  openAddModal: () => void;
  openEditModal: (txn: Transaction) => void;
  closeTransactionModal: () => void;
  selectedTransactionForDrawer: Transaction | null;
  setSelectedTransactionForDrawer: (txn: Transaction | null) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  userPreferences: UserPreferences;
  updateUserPreferences: (updates: Partial<UserPreferences>) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'paisawise_profile_v1',
  TRANSACTIONS: 'paisawise_transactions_v1',
  CATEGORIES: 'paisawise_categories_v1',
  GOALS: 'paisawise_goals_v1',
  BUFFER: 'paisawise_buffer_v1',
  AUTOBALANCE: 'paisawise_autobalance_v1',
  THEME: 'paisawise_theme_v1',
  USER_PREFERENCES: 'paisawise_user_preferences_v1',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string') {
          const monthLabel = parsed.monthLabel
            ? parsed.monthLabel.replace(/2024/g, '2026')
            : 'October 2026';
          const nextAllowanceDate = parsed.nextAllowanceDate
            ? parsed.nextAllowanceDate.replace(/^2024-/, '2026-')
            : '2026-11-01';
          return {
            ...INITIAL_PROFILE,
            ...parsed,
            monthLabel,
            nextAllowanceDate,
            monthlyAllowance: Math.max(0, Number(parsed.monthlyAllowance) || 0),
            fixedDues: Math.max(0, Number(parsed.fixedDues) || 0),
            safetyBuffer: Math.max(0, Number(parsed.safetyBuffer) || 0),
            campusDay: Math.max(1, Number(parsed.campusDay) || 1),
          };
        }
      } catch {
        // fallback to INITIAL_PROFILE on corrupted JSON
      }
    }
    return INITIAL_PROFILE;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (t) =>
                t &&
                typeof t.id === 'string' &&
                typeof t.amount === 'number' &&
                !isNaN(t.amount) &&
                typeof t.date === 'string'
            )
            .map((t) => ({
              ...t,
              date: t.date.replace(/^2024-/, '2026-'),
            }));
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<CategoryBudget[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c) => ({
            ...c,
            allocated: Math.max(0, Number(c.allocated ?? c.limit) || 0),
            limit: Math.max(0, Number(c.allocated ?? c.limit) || 0),
            spent: Math.max(0, Number(c.spent) || 0),
          }));
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_CATEGORIES;
  });

  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((g: SavingsGoal) => ({
            ...g,
            deadline: typeof g.deadline === 'string' ? g.deadline.replace(/^2024-/, '2026-') : g.deadline,
            createdAt: typeof g.createdAt === 'string' ? g.createdAt.replace(/^2024-/, '2026-') : g.createdAt,
            targetAmount: Math.max(0, Number(g.targetAmount) || 0),
            currentAmount: Math.max(0, Number(g.currentAmount) || 0),
            contributions: Array.isArray(g.contributions)
              ? g.contributions.map((c) => ({
                  ...c,
                  date: typeof c.date === 'string' ? c.date.replace(/^2024-/, '2026-') : c.date,
                }))
              : [],
          }));
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_GOALS;
  });

  const [safetyBuffer, setSafetyBufferState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUFFER);
    return saved !== null ? Number(saved) : 0;
  });

  const [theme, setThemeState] = useState<ThemePreference>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const DEFAULT_USER_PREFERENCES: UserPreferences = {
    theme: 'system',
    defaultAlertThreshold: 80,
    monthStartPreference: 'calendar',
    notifications: {
      budgetThresholdAlert: true,
      overBudgetAlert: true,
      allowanceReminder: true,
      savingsMilestoneAlert: true,
    },
  };

  const [userPreferences, setUserPreferencesState] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (saved) {
      try {
        return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
    return DEFAULT_USER_PREFERENCES;
  });

  const updateUserPreferences = (updates: Partial<UserPreferences>) => {
    setUserPreferencesState((prev) => {
      const updated: UserPreferences = {
        ...prev,
        ...updates,
        notifications: {
          ...prev.notifications,
          ...(updates.notifications || {}),
        },
      };
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
      return updated;
    });
  };

  const [autoBalanceEnabled, setAutoBalanceEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTOBALANCE);
    return saved !== null ? saved === 'true' : true;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransactionForDrawer, setSelectedTransactionForDrawer] = useState<Transaction | null>(null);

  const openAddModal = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (txn: Transaction) => {
    setEditingTransaction(txn);
    setIsAddModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }, [goals]);

  const setSafetyBuffer = (val: number) => {
    setSafetyBufferState(val);
    setProfile((prev) => ({ ...prev, safetyBuffer: val }));
    localStorage.setItem(STORAGE_KEYS.BUFFER, val.toString());
  };

  const setAutoBalanceEnabled = (val: boolean) => {
    setAutoBalanceEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.AUTOBALANCE, val.toString());
  };

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      return next;
    });
    if (updates.safetyBuffer !== undefined) {
      setSafetyBufferState(updates.safetyBuffer);
      localStorage.setItem(STORAGE_KEYS.BUFFER, updates.safetyBuffer.toString());
    }
  };

  const addTransaction = (txnData: Omit<Transaction, 'id'>) => {
    const newTxn: Transaction = {
      ...txnData,
      id: `txn-${Date.now()}`,
    };
    setTransactions((prev) => [newTxn, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (selectedTransactionForDrawer?.id === id) {
      setSelectedTransactionForDrawer(null);
    }
  };

  const editTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    if (selectedTransactionForDrawer?.id === id) {
      setSelectedTransactionForDrawer((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const updateCategoryBudget = (id: string, newAllocated: number) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, allocated: Math.max(0, newAllocated) } : cat))
    );
  };

  const updateMultipleCategoryBudgets = (allocations: Record<string, number>) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id in allocations) {
          return { ...cat, allocated: Math.max(0, Math.round(allocations[cat.id])) };
        }
        if (cat.name in allocations) {
          return { ...cat, allocated: Math.max(0, Math.round(allocations[cat.name])) };
        }
        return cat;
      })
    );
  };

  const addCategoryBudget = (budgetData: Omit<CategoryBudget, 'id' | 'spent'>) => {
    const newBudget: CategoryBudget = {
      ...budgetData,
      id: `budget-${Date.now()}`,
      spent: 0,
    };
    setCategories((prev) => [...prev, newBudget]);
  };

  const editCategoryBudget = (id: string, updates: Partial<CategoryBudget>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategoryBudget = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  const rebalanceCategories = (
    fromCategoryName: string,
    toCategoryName: string,
    amount: number
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.name === fromCategoryName) {
          return { ...cat, allocated: Math.max(0, cat.allocated - amount) };
        }
        if (cat.name === toCategoryName) {
          return { ...cat, allocated: cat.allocated + amount };
        }
        return cat;
      })
    );
  };

  const addGoal = (goalData: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      createdAt: goalData.createdAt || new Date().toISOString().split('T')[0],
      contributions:
        goalData.contributions ||
        (goalData.currentAmount > 0
          ? [
              {
                id: `contrib-${Date.now()}`,
                amount: goalData.currentAmount,
                date: new Date().toISOString().split('T')[0],
                note: 'Initial deposit',
              },
            ]
          : []),
    };
    setGoals((prev) => [...prev, newGoal]);
  };

  const editGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addGoalContribution = (
    goalId: string,
    contribution: { amount: number; date?: string; note?: string }
  ) => {
    const dateStr = contribution.date || new Date().toISOString().split('T')[0];
    const newContrib: GoalContribution = {
      id: `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount: contribution.amount,
      date: dateStr,
      note: contribution.note || 'Savings contribution',
    };

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const prevContribs = g.contributions || [];
          return {
            ...g,
            currentAmount: g.currentAmount + contribution.amount,
            contributions: [newContrib, ...prevContribs],
          };
        }
        return g;
      })
    );
  };

  const contributeToGoal = (id: string, amount: number) => {
    addGoalContribution(id, { amount, note: 'Quick contribution' });
  };

  const restoreDemoGoals = () => {
    setGoals(INITIAL_GOALS);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(INITIAL_GOALS));
  };

  const resetToDemoData = () => {
    setProfile(INITIAL_PROFILE);
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(INITIAL_CATEGORIES);
    setGoals(INITIAL_GOALS);
    setSafetyBuffer(0);
    setAutoBalanceEnabled(true);
    setSelectedMonth('2026-10');
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.BUFFER);
    localStorage.removeItem(STORAGE_KEYS.AUTOBALANCE);
  };

  const clearAllData = () => {
    setTransactions([]);
    setGoals([]);
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        allocated: 0,
        spent: 0,
        status: 'unfunded' as const,
      }))
    );
    setSafetyBuffer(0);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([]));
    localStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify(
        categories.map((cat) => ({
          ...cat,
          allocated: 0,
          spent: 0,
          status: 'unfunded',
        }))
      )
    );
    localStorage.setItem(STORAGE_KEYS.BUFFER, '0');
  };

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Dynamic available months list centered around 2026
  const availableMonths = useMemo(() => {
    const list = [
      { value: '2026-10', label: 'October 2026' },
      { value: '2026-09', label: 'September 2026' },
      { value: '2026-11', label: 'November 2026' },
      { value: '2026-12', label: 'December 2026' },
      { value: '2026-08', label: 'August 2026' },
      { value: '2026-07', label: 'July 2026' },
      { value: '2026-06', label: 'June 2026' },
      { value: '2026-05', label: 'May 2026' },
      { value: '2026-04', label: 'April 2026' },
      { value: '2026-03', label: 'March 2026' },
      { value: '2026-02', label: 'February 2026' },
      { value: '2026-01', label: 'January 2026' },
    ];
    if (!list.some((m) => m.value === selectedMonth)) {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      const label = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : selectedMonth;
      list.unshift({ value: selectedMonth, label });
    }
    return list;
  }, [selectedMonth]);

  // Period-filtered transactions
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Total income for period (excluding allowance to avoid double counting)
  const periodOtherIncome = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'income' && t.category !== 'Monthly Allowance')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  // Defined accounting model:
  // Base monthly allowance + additional recorded income
  const totalIncome = useMemo(() => {
    const allowanceTxn = periodTransactions.find(
      (t) => t.type === 'income' && t.category === 'Monthly Allowance'
    );
    const baseAllowance = allowanceTxn ? allowanceTxn.amount : profile.monthlyAllowance;
    return baseAllowance + periodOtherIncome;
  }, [periodTransactions, profile.monthlyAllowance, periodOtherIncome]);

  // Total spending = sum of expenses in the selected period
  const totalSpent = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  // Monthly budget allocated across all envelopes
  const totalBudget = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.allocated || 0), 0);
  }, [categories]);

  // Budget remaining = monthly budget - expenses counted against that budget
  const budgetRemaining = useMemo(() => {
    return Math.max(0, totalBudget - totalSpent);
  }, [totalBudget, totalSpent]);

  // Available balance = opening allowance + other income - expenses
  const availableBalance = useMemo(() => {
    return totalIncome - totalSpent;
  }, [totalIncome, totalSpent]);

  const liquidCash = availableBalance;

  // Days remaining in cycle based on selected month
  const daysLeft = useMemo(() => {
    if (selectedMonth === '2026-10') {
      if (profile.nextAllowanceDate) {
        const today = new Date('2026-10-19T00:00:00'); // Real-time campus baseline
        const target = new Date(profile.nextAllowanceDate);
        if (!isNaN(target.getTime())) {
          const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return Math.max(0, diff);
        }
      }
      return 13;
    } else if (selectedMonth < '2026-10') {
      return 0; // Past cycle reached
    } else {
      return 30; // Upcoming cycle
    }
  }, [selectedMonth, profile.nextAllowanceDate]);

  const runway = useMemo(() => {
    return calculateRunway(availableBalance, profile.fixedDues, safetyBuffer, daysLeft);
  }, [availableBalance, profile.fixedDues, safetyBuffer, daysLeft]);

  const computedCategories = useMemo(() => {
    return computeCategorySpend(periodTransactions, categories);
  }, [periodTransactions, categories]);

  const needsVsWants = useMemo(() => {
    return calculateNeedsVsWants(periodTransactions);
  }, [periodTransactions]);

  const autoBalanceSuggestion = useMemo(() => {
    return suggestAutoBalanceTransfer(computedCategories);
  }, [computedCategories]);

  const executeAutoBalance = () => {
    if (autoBalanceSuggestion?.fromCategory && autoBalanceSuggestion?.toCategory) {
      rebalanceCategories(
        autoBalanceSuggestion.fromCategory.name,
        autoBalanceSuggestion.toCategory.name,
        autoBalanceSuggestion.amountNeeded
      );
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        transactions,
        addTransaction,
        deleteTransaction,
        editTransaction,
        categories,
        updateCategoryBudget,
        updateMultipleCategoryBudgets,
        addCategoryBudget,
        editCategoryBudget,
        deleteCategoryBudget,
        rebalanceCategories,
        executeAutoBalance,
        goals,
        addGoal,
        editGoal,
        deleteGoal,
        contributeToGoal,
        addGoalContribution,
        restoreDemoGoals,
        safetyBuffer,
        setSafetyBuffer,
        autoBalanceEnabled,
        setAutoBalanceEnabled,
        selectedMonth,
        setSelectedMonth,
        availableMonths,
        periodTransactions,
        totalIncome,
        totalSpent,
        totalBudget,
        budgetRemaining,
        availableBalance,
        liquidCash,
        daysLeft,
        runway,
        computedCategories,
        needsVsWants,
        autoBalanceSuggestion,
        isAddModalOpen,
        setIsAddModalOpen,
        editingTransaction,
        setEditingTransaction,
        openAddModal,
        openEditModal,
        closeTransactionModal,
        selectedTransactionForDrawer,
        setSelectedTransactionForDrawer,
        resetToDemoData,
        clearAllData,
        theme,
        setTheme,
        userPreferences,
        updateUserPreferences,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
