import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  X,
  Scale,
  ShieldCheck,
  PartyPopper,
  BookMarked,
  Equal,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Plus,
  Minus,
  Utensils,
  Train,
  ShoppingBag,
  BookOpen,
  Home,
  Film,
  Tv,
  HeartPulse,
  MoreHorizontal,
  Wallet,
} from 'lucide-react';
import { CategoryBudget } from '../../types/finance.ts';
import { getCategoryCanonicalKey, normalizeCategory } from '../../utils/financeCalculations.ts';
import { BUDGET_PRESETS, BudgetPreset } from '../../data/budgetPresets.ts';

const DEFAULT_INITIAL_ENVELOPES: CategoryBudget[] = [
  { id: 'cat-food', name: 'Food', iconName: 'lunch_dining', allocated: 0, spent: 0, description: 'Campus canteen meals & snacks' },
  { id: 'cat-travel', name: 'Travel', iconName: 'subway', allocated: 0, spent: 0, description: 'Metro pass & auto fares' },
  { id: 'cat-study', name: 'Education', iconName: 'menu_book', allocated: 0, spent: 0, description: 'Books, stationery & notes' },
  { id: 'cat-hostel', name: 'Hostel/Rent', iconName: 'apartment', allocated: 0, spent: 0, description: 'Hostel rent & room utilities' },
  { id: 'cat-ent', name: 'Entertainment', iconName: 'movie', allocated: 0, spent: 0, description: 'Outings, movies & cafe meets' },
];

interface AutoDistributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryBudget[];
  monthlyAllowance: number;
  fixedDues: number;
  availableBalance: number;
  totalBudget: number;
  onApply: (allocations: Record<string, number>, mode: 'replace' | 'add') => void;
  selectedMonthLabel?: string;
}

export const AutoDistributeModal: React.FC<AutoDistributeModalProps> = ({
  isOpen,
  onClose,
  categories,
  monthlyAllowance,
  fixedDues,
  availableBalance,
  totalBudget,
  onApply,
  selectedMonthLabel = 'October 2026',
}) => {
  // Use existing categories or provide foundational campus envelopes if empty
  const effectiveCategories = useMemo(
    () => (categories.length > 0 ? categories : DEFAULT_INITIAL_ENVELOPES),
    [categories]
  );
  // Spendable allowance after fixed dues (e.g. ₹10,000 - ₹0 = ₹10,000)
  const spendableAllowance = Math.max(0, monthlyAllowance - fixedDues);

  // Unbudgeted allowance = spendable allowance - currently allocated
  const unbudgetedAllowance = Math.max(0, spendableAllowance - totalBudget);

  // Pool Selection State: 'unallocated' | 'allowance' | 'available' | 'custom'
  const [poolType, setPoolType] = useState<'unallocated' | 'allowance' | 'available' | 'custom'>(
    unbudgetedAllowance > 0 ? 'unallocated' : 'allowance'
  );
  const [customAmount, setCustomAmount] = useState<string>(
    unbudgetedAllowance > 0 ? unbudgetedAllowance.toString() : spendableAllowance.toString()
  );

  // Active preset ID
  const [activePresetId, setActivePresetId] = useState<string>('preset-balanced');

  // Distribution Mode: 'replace' replaces existing envelope targets; 'add' adds to existing
  const [distributionMode, setDistributionMode] = useState<'replace' | 'add'>(
    unbudgetedAllowance > 0 ? 'add' : 'replace'
  );

  // Per-category percentage mapping (category ID -> percentage)
  const [percentages, setPercentages] = useState<Record<string, number>>({});

  // Error / validation state
  const [customError, setCustomError] = useState<string | null>(null);

  // Category Icon & Color Helper
  const getCategoryTheme = (name: string) => {
    const key = getCategoryCanonicalKey(name);
    switch (key) {
      case 'food':
        return { icon: Utensils, color: '#4C3478', bg: '#EDE7FF', barColor: '#8B6FE8' };
      case 'travel':
        return { icon: Train, color: '#8B6FE8', bg: '#F1EDFA', barColor: '#A48BF0' };
      case 'shopping':
        return { icon: ShoppingBag, color: '#A48BF0', bg: '#EDE7FF', barColor: '#8B6FE8' };
      case 'education':
        return { icon: BookOpen, color: '#4C3478', bg: '#EDE7FF', barColor: '#7E57C2' };
      case 'hostel':
        return { icon: Home, color: '#6A4C9C', bg: '#F1EDFA', barColor: '#8B6FE8' };
      case 'entertainment':
        return { icon: Film, color: '#8B6FE8', bg: '#EDE7FF', barColor: '#A48BF0' };
      case 'subscriptions':
        return { icon: Tv, color: '#5C3E8A', bg: '#EDE7FF', barColor: '#8B6FE8' };
      case 'health':
        return { icon: HeartPulse, color: '#E56B75', bg: '#FDECEE', barColor: '#E56B75' };
      default:
        return { icon: MoreHorizontal, color: '#777187', bg: '#F7F5FC', barColor: '#8B6FE8' };
    }
  };

  // Compute the current active pool in INR
  const activePoolAmount = useMemo(() => {
    if (poolType === 'unallocated') return unbudgetedAllowance > 0 ? unbudgetedAllowance : spendableAllowance;
    if (poolType === 'allowance') return spendableAllowance;
    if (poolType === 'available') return availableBalance;
    const parsed = parseFloat(customAmount);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [poolType, unbudgetedAllowance, spendableAllowance, availableBalance, customAmount]);

  // Compute percentages according to preset and user's actual categories
  const computePercentagesForPreset = (preset: BudgetPreset, cats: CategoryBudget[]) => {
    if (cats.length === 0) return {};

    if (preset.id === 'preset-equal') {
      const equalShare = Math.floor(100 / cats.length);
      const remainder = 100 - equalShare * cats.length;
      const res: Record<string, number> = {};
      cats.forEach((cat, index) => {
        res[cat.id] = equalShare + (index === 0 ? remainder : 0);
      });
      return res;
    }

    // Map each category to preset weights by canonical key
    const rawWeights: Record<string, number> = {};
    let totalWeight = 0;

    cats.forEach((cat) => {
      const canonical = getCategoryCanonicalKey(cat.name);
      const weight = preset.percentages[canonical] !== undefined ? preset.percentages[canonical] : 5;
      rawWeights[cat.id] = weight;
      totalWeight += weight;
    });

    if (totalWeight <= 0) {
      // Fallback equal
      const equalShare = Math.floor(100 / cats.length);
      const remainder = 100 - equalShare * cats.length;
      const res: Record<string, number> = {};
      cats.forEach((cat, index) => {
        res[cat.id] = equalShare + (index === 0 ? remainder : 0);
      });
      return res;
    }

    // Normalize weights so they sum to exactly 100
    const normalized: Record<string, number> = {};
    let runningSum = 0;

    cats.forEach((cat, idx) => {
      if (idx === cats.length - 1) {
        normalized[cat.id] = Math.max(0, 100 - runningSum);
      } else {
        const val = Math.round((rawWeights[cat.id] / totalWeight) * 100);
        normalized[cat.id] = val;
        runningSum += val;
      }
    });

    return normalized;
  };

  // Initialize or re-populate percentages when modal opens or preset changes
  useEffect(() => {
    if (isOpen && categories.length > 0) {
      const preset = BUDGET_PRESETS.find((p) => p.id === activePresetId) || BUDGET_PRESETS[0];
      const initialMap = computePercentagesForPreset(preset, categories);
      setPercentages(initialMap);
    }
  }, [isOpen, activePresetId, categories]);

  // Switch preset
  const handleSelectPreset = (presetId: string) => {
    setActivePresetId(presetId);
    const preset = BUDGET_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const newMap = computePercentagesForPreset(preset, categories);
      setPercentages(newMap);
    }
  };

  // User manually edits a slider or input for a specific category
  const handlePercentageChange = (catId: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    setPercentages((prev) => ({
      ...prev,
      [catId]: clamped,
    }));
  };

  // Normalize percentages so sum equals exactly 100%
  const handleNormalizeTo100 = () => {
    const total = Object.values(percentages).reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      // Even split
      const equalShare = Math.floor(100 / categories.length);
      const remainder = 100 - equalShare * categories.length;
      const res: Record<string, number> = {};
      categories.forEach((cat, i) => {
        res[cat.id] = equalShare + (i === 0 ? remainder : 0);
      });
      setPercentages(res);
      return;
    }

    let runningSum = 0;
    const res: Record<string, number> = {};
    categories.forEach((cat, idx) => {
      const cur = percentages[cat.id] || 0;
      if (idx === categories.length - 1) {
        res[cat.id] = Math.max(0, 100 - runningSum);
      } else {
        const scaled = Math.round((cur / total) * 100);
        res[cat.id] = scaled;
        runningSum += scaled;
      }
    });
    setPercentages(res);
  };

  // Total allocated percentage
  const totalAllocatedPercentage = useMemo(() => {
    return Object.values(percentages).reduce((sum, val) => sum + val, 0);
  }, [percentages]);

  const percentageDelta = 100 - totalAllocatedPercentage;
  const isPercentageValid = totalAllocatedPercentage === 100;

  // Calculate distributed amounts in INR per category
  const calculatedCategoryAmounts = useMemo(() => {
    const result: Record<string, { shareAmount: number; newTotal: number; diff: number }> = {};
    let distributedSum = 0;

    // First pass: basic rounding
    categories.forEach((cat) => {
      const pct = percentages[cat.id] || 0;
      const share = Math.round((pct / 100) * activePoolAmount);
      distributedSum += share;
      result[cat.id] = {
        shareAmount: share,
        newTotal: distributionMode === 'replace' ? share : cat.allocated + share,
        diff: distributionMode === 'replace' ? share - cat.allocated : share,
      };
    });

    // Adjust for ₹1-₹5 rounding discrepancy if sum doesn't match poolAmount
    if (isPercentageValid && activePoolAmount > 0 && categories.length > 0) {
      const discrepancy = activePoolAmount - distributedSum;
      if (discrepancy !== 0) {
        // Find category with highest percentage
        let maxCatId = categories[0].id;
        let maxPct = -1;
        categories.forEach((cat) => {
          if ((percentages[cat.id] || 0) > maxPct) {
            maxPct = percentages[cat.id] || 0;
            maxCatId = cat.id;
          }
        });
        if (result[maxCatId]) {
          result[maxCatId].shareAmount += discrepancy;
          result[maxCatId].newTotal += discrepancy;
          result[maxCatId].diff += discrepancy;
        }
      }
    }

    return result;
  }, [categories, percentages, activePoolAmount, distributionMode, isPercentageValid]);

  // Total resulting budget across all categories
  const resultingTotalBudget = useMemo(() => {
    return Object.values(calculatedCategoryAmounts).reduce((sum, item) => sum + item.newTotal, 0);
  }, [calculatedCategoryAmounts]);

  // Preset icon renderer
  const renderPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scale':
        return <Scale className="w-4 h-4 text-[#006c4c]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-[#1d4ed8]" />;
      case 'PartyPopper':
        return <PartyPopper className="w-4 h-4 text-[#c2410c]" />;
      case 'BookMarked':
        return <BookMarked className="w-4 h-4 text-[#6b21a8]" />;
      case 'Equal':
        return <Equal className="w-4 h-4 text-[#0f766e]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#006c4c]" />;
    }
  };

  // Submit Handler
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPercentageValid) {
      return;
    }

    if (activePoolAmount <= 0) {
      setCustomError('Please choose or enter an allowance pool greater than ₹0');
      return;
    }

    // Build allocation map: cat.id -> new allocated limit
    const allocations: Record<string, number> = {};
    categories.forEach((cat) => {
      const data = calculatedCategoryAmounts[cat.id];
      if (data) {
        allocations[cat.id] = data.newTotal;
      }
    });

    onApply(allocations, distributionMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col my-6 border border-[#E9E4F2] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#E9E4F2] bg-gradient-to-r from-[#EDE7FF]/60 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#4C3478] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#42CBA5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-[#29233A] tracking-tight">
                  Smart Allowance Distributor
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#E5F8F1] text-[#186851] text-[10px] font-black uppercase tracking-wider border border-[#42CBA5]/30">
                  Presets
                </span>
              </div>
              <p className="text-xs text-[#777187]">
                Automatically allocate your allowance across category envelopes with research-backed student presets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F7F5FC] text-[#777187] hover:text-[#29233A] hover:bg-[#EDE7FF] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleApply} className="p-6 flex flex-col gap-5 text-xs max-h-[82vh] overflow-y-auto">
          {/* STEP 1: Select Allowance Pool to Distribute */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#777187] flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#4C3478]" />
                <span>Step 1: Select Allowance Pool to Distribute</span>
              </label>
              <span className="text-[11px] font-extrabold text-[#42CBA5]">
                Pool: ₹{activePoolAmount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Pool Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Option 1: Unallocated Pool */}
              <button
                type="button"
                onClick={() => {
                  setPoolType('unallocated');
                  setDistributionMode('add');
                  setCustomError(null);
                }}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  poolType === 'unallocated'
                    ? 'border-[#4C3478] bg-[#EDE7FF] text-[#29233A] ring-2 ring-[#8B6FE8]/30 shadow-xs'
                    : 'border-[#E9E4F2] bg-white text-[#777187] hover:bg-[#F7F5FC]'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777187]">
                  Unbudgeted
                </span>
                <span className="text-sm font-black text-[#29233A] mt-0.5">
                  ₹{unbudgetedAllowance.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-[#777187] mt-1 line-clamp-1">
                  Allowance buffer
                </span>
              </button>

              {/* Option 2: Full Monthly Allowance */}
              <button
                type="button"
                onClick={() => {
                  setPoolType('allowance');
                  setDistributionMode('replace');
                  setCustomError(null);
                }}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  poolType === 'allowance'
                    ? 'border-[#4C3478] bg-[#EDE7FF] text-[#29233A] ring-2 ring-[#8B6FE8]/30 shadow-xs'
                    : 'border-[#E9E4F2] bg-white text-[#777187] hover:bg-[#F7F5FC]'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777187]">
                  Full Allowance
                </span>
                <span className="text-sm font-black text-[#29233A] mt-0.5">
                  ₹{spendableAllowance.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-[#777187] mt-1 line-clamp-1">
                  Monthly cash inflow
                </span>
              </button>

              {/* Option 3: Liquid Balance */}
              <button
                type="button"
                onClick={() => {
                  setPoolType('available');
                  setDistributionMode('replace');
                  setCustomError(null);
                }}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  poolType === 'available'
                    ? 'border-[#4C3478] bg-[#EDE7FF] text-[#29233A] ring-2 ring-[#8B6FE8]/30 shadow-xs'
                    : 'border-[#E9E4F2] bg-white text-[#777187] hover:bg-[#F7F5FC]'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777187]">
                  Liquid Balance
                </span>
                <span className="text-sm font-black text-[#29233A] mt-0.5">
                  ₹{availableBalance.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-[#777187] mt-1 line-clamp-1">
                  Live cash in hand
                </span>
              </button>

              {/* Option 4: Custom Amount */}
              <button
                type="button"
                onClick={() => {
                  setPoolType('custom');
                  setCustomError(null);
                }}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  poolType === 'custom'
                    ? 'border-[#4C3478] bg-[#EDE7FF] text-[#29233A] ring-2 ring-[#8B6FE8]/30 shadow-xs'
                    : 'border-[#E9E4F2] bg-white text-[#777187] hover:bg-[#F7F5FC]'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#777187]">
                  Custom Amount
                </span>
                <span className="text-sm font-black text-[#29233A] mt-0.5">
                  Custom ₹
                </span>
                <span className="text-[9px] text-[#777187] mt-1 line-clamp-1">
                  User defined pool
                </span>
              </button>
            </div>

            {/* Custom Amount Field when selected */}
            {poolType === 'custom' && (
              <div className="flex flex-col gap-1 p-3 rounded-2xl bg-[#F7F5FC] border border-[#E9E4F2] animate-in fade-in duration-100">
                <label htmlFor="custom-allowance-pool" className="text-[11px] font-bold text-[#29233A]">
                  Enter Custom Allowance Amount (INR):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#777187]">
                    ₹
                  </span>
                  <input
                    id="custom-allowance-pool"
                    type="number"
                    min="100"
                    step="100"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setCustomError(null);
                    }}
                    placeholder="10000"
                    className="w-full h-10 pl-8 pr-4 rounded-xl bg-white border border-[#E9E4F2] text-xs font-bold text-[#29233A] focus:outline-none focus:ring-2 focus:ring-[#8B6FE8]"
                  />
                </div>
                {customError && (
                  <span className="text-[11px] text-[#E56B75] font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {customError}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Choose Percentage-Based Preset */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#777187] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#4C3478]" />
                <span>Step 2: Choose Percentage-Based Preset</span>
              </label>
              <span className="text-[11px] text-[#777187]">
                Tailored for college living
              </span>
            </div>

            {/* Preset Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {BUDGET_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all ${
                      isSelected
                        ? 'border-[#4C3478] bg-[#EDE7FF] ring-2 ring-[#8B6FE8]/30 shadow-xs'
                        : 'border-[#E9E4F2] bg-white hover:bg-[#F7F5FC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#4C3478] text-white' : 'bg-[#F7F5FC] text-[#4C3478]'
                          }`}
                        >
                          {renderPresetIcon(preset.iconName)}
                        </div>
                        <span className="font-extrabold text-xs text-[#29233A] leading-snug">
                          {preset.name}
                        </span>
                      </div>
                      {preset.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${
                            isSelected
                              ? 'bg-[#4C3478] text-white'
                              : 'bg-[#E9E4F2] text-[#777187]'
                          }`}
                        >
                          {preset.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#777187] line-clamp-2">
                      {preset.description}
                    </p>

                    <div className="pt-2 border-t border-[#E9E4F2] flex items-center justify-between text-[10px] text-[#4C3478] font-bold">
                      <span>{preset.tagline}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#42CBA5] shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Category Percentage Breakdown & Custom Adjustment */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[#E9E4F2]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#777187]">
                  Step 3: Fine-Tune Category Allocations
                </label>
                {/* Total Percentage Status Badge */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    isPercentageValid
                      ? 'bg-[#E5F8F1] text-[#186851] border border-[#42CBA5]/30'
                      : totalAllocatedPercentage < 100
                      ? 'bg-[#FFE8A3] text-[#684800] border border-[#FFE8A3]'
                      : 'bg-[#FDECEE] text-[#E56B75] border border-[#F8CAD0]'
                  }`}
                >
                  {isPercentageValid ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#42CBA5]" />
                      <span>100% Allocated</span>
                    </>
                  ) : totalAllocatedPercentage < 100 ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-[#D99B00]" />
                      <span>{totalAllocatedPercentage}% / 100% ({percentageDelta}% Unassigned)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-[#E56B75]" />
                      <span>{totalAllocatedPercentage}% / 100% (+{totalAllocatedPercentage - 100}% Exceeds)</span>
                    </>
                  )}
                </span>
              </div>

              {/* Quick Auto-Normalize Button */}
              {!isPercentageValid && (
                <button
                  type="button"
                  onClick={handleNormalizeTo100}
                  className="h-7 px-3 rounded-lg bg-[#4C3478] text-white text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#3B275F] transition-colors self-start sm:self-auto shadow-xs active:scale-95"
                >
                  <RefreshCw className="w-3 h-3 text-[#42CBA5]" />
                  <span>Auto-Normalize to 100%</span>
                </button>
              )}
            </div>

            {/* Segmented Percentage Distribution Bar */}
            <div className="w-full h-3 rounded-full bg-[#F7F5FC] border border-[#E9E4F2] overflow-hidden flex">
              {categories.map((cat) => {
                const pct = percentages[cat.id] || 0;
                if (pct <= 0) return null;
                const { barColor } = getCategoryTheme(cat.name);
                return (
                  <div
                    key={`bar-${cat.id}`}
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                    className="h-full transition-all duration-300 relative group"
                    title={`${cat.name}: ${pct}%`}
                  />
                );
              })}
            </div>

            {/* Category Sliders List */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const pct = percentages[cat.id] || 0;
                const data = calculatedCategoryAmounts[cat.id] || { shareAmount: 0, newTotal: 0, diff: 0 };
                const { icon: Icon, color, bg } = getCategoryTheme(cat.name);

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-white border border-[#E9E4F2] hover:border-[#8B6FE8]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    {/* Left: Icon, Name, Current Budget */}
                    <div className="flex items-center gap-3 min-w-[170px]">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: bg, color: color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-xs text-[#29233A] truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-[#777187]">
                          Current: ₹{cat.allocated.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Slider with Quick Buttons */}
                    <div className="flex-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePercentageChange(cat.id, pct - 5)}
                        className="w-6 h-6 rounded-md bg-[#F7F5FC] text-[#777187] hover:bg-[#EDE7FF] hover:text-[#4C3478] flex items-center justify-center transition-colors shrink-0"
                        title="Reduce by 5%"
                        aria-label={`Reduce ${cat.name} percentage`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={pct}
                        onChange={(e) => handlePercentageChange(cat.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-[#E9E4F2] rounded-lg appearance-none cursor-pointer accent-[#4C3478]"
                        aria-label={`${cat.name} percentage slider`}
                      />

                      <button
                        type="button"
                        onClick={() => handlePercentageChange(cat.id, pct + 5)}
                        className="w-6 h-6 rounded-md bg-[#F7F5FC] text-[#777187] hover:bg-[#EDE7FF] hover:text-[#4C3478] flex items-center justify-center transition-colors shrink-0"
                        title="Increase by 5%"
                        aria-label={`Increase ${cat.name} percentage`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Right: Percentage Input & Resulting INR */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 min-w-[170px] shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E9E4F2]">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={pct}
                          onChange={(e) => handlePercentageChange(cat.id, Number(e.target.value))}
                          className="w-12 h-7 px-1.5 rounded-lg bg-[#F7F5FC] border border-[#E9E4F2] text-xs font-bold text-center text-[#29233A] focus:outline-none focus:ring-1 focus:ring-[#8B6FE8]"
                          aria-label={`${cat.name} percentage input`}
                        />
                        <span className="text-xs font-bold text-[#777187]">%</span>
                      </div>

                      <div className="flex flex-col text-right">
                        <span className="font-extrabold text-xs text-[#29233A]">
                          ₹{data.newTotal.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            data.diff > 0
                              ? 'text-[#42CBA5]'
                              : data.diff < 0
                              ? 'text-[#E56B75]'
                              : 'text-[#777187]'
                          }`}
                        >
                          {data.diff > 0 ? `+₹${data.diff.toLocaleString('en-IN')}` : data.diff < 0 ? `-₹${Math.abs(data.diff).toLocaleString('en-IN')}` : 'No change'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 4: Distribution Mode Choice */}
          <div className="p-3.5 rounded-2xl bg-[#F7F5FC] border border-[#E9E4F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="font-bold text-xs text-[#29233A]">
                Application Mode
              </span>
              <span className="text-[11px] text-[#777187]">
                {distributionMode === 'replace'
                  ? 'Replaces all existing category limits with these calculated amounts.'
                  : 'Adds the calculated allowance share on top of your existing envelope limits.'}
              </span>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-white border border-[#E9E4F2] text-xs font-bold self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setDistributionMode('replace')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  distributionMode === 'replace'
                    ? 'bg-[#4C3478] text-white shadow-xs'
                    : 'text-[#777187] hover:text-[#29233A]'
                }`}
              >
                Set New Limits (Replace)
              </button>
              <button
                type="button"
                onClick={() => setDistributionMode('add')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  distributionMode === 'add'
                    ? 'bg-[#4C3478] text-white shadow-xs'
                    : 'text-[#777187] hover:text-[#29233A]'
                }`}
              >
                Top-Up (Add to Current)
              </button>
            </div>
          </div>

          {/* Impact Summary & Live Pacing Preview */}
          <div className="p-4 rounded-2xl bg-[#4C3478] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#42CBA5] text-[#29233A] flex items-center justify-center shrink-0 font-black">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[#E5F8F1] tracking-wider">
                  Resulting Monthly Budget
                </span>
                <span className="text-xl font-black text-white">
                  ₹{resultingTotalBudget.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-[#EDE7FF]">
                  for {selectedMonthLabel} across {categories.length} envelopes
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isPercentageValid || activePoolAmount <= 0}
                className={`h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                  isPercentageValid && activePoolAmount > 0
                    ? 'bg-[#42CBA5] hover:bg-[#36b08e] text-[#29233A] cursor-pointer'
                    : 'bg-white/20 text-white/50 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Auto-Distribution</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
