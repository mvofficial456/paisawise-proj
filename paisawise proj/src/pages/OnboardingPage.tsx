import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Building,
  PieChart,
  PiggyBank,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';
import { PaisaWiseLogo } from '../components/common/PaisaWiseLogo.tsx';
import { CategoryKey } from '../types/finance.ts';

interface FixedExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    updateProfile,
    categories,
    updateMultipleCategoryBudgets,
    addGoal,
  } = useFinance();

  // Active step (1 to 5)
  const [step, setStep] = useState<number>(1);

  // Return to Review helper: when editing a step from Step 5 Review
  const [cameFromReview, setCameFromReview] = useState<boolean>(false);

  // --- Step 1: Allowance State ---
  const [name, setName] = useState<string>(profile.name || '');
  const [allowance, setAllowance] = useState<string>(
    profile.monthlyAllowance > 0 ? String(profile.monthlyAllowance) : '10000'
  );
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'custom'>(
    profile.allowanceFrequency || 'monthly'
  );
  const [customDays, setCustomDays] = useState<number>(15);

  // Default next allowance date: 1st of next month
  const defaultNextDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  }, []);
  const [nextDate, setNextDate] = useState<string>(
    profile.nextAllowanceDate || defaultNextDate
  );

  // --- Step 2: Fixed Expenses State ---
  const [fixedItems, setFixedItems] = useState<FixedExpenseItem[]>([
    { id: 'fix-1', name: 'Hostel / Room Rent', amount: 2000 },
    { id: 'fix-2', name: 'Mess & Food Card', amount: 1500 },
  ]);
  const [newFixedName, setNewFixedName] = useState<string>('');
  const [newFixedAmount, setNewFixedAmount] = useState<string>('');

  // --- Step 3: Category Budgets State ---
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({
    'Food & Canteen': 3000,
    'Travel & Metro': 1000,
    'Academics & Books': 800,
    'Entertainment & OTT': 600,
    'Hostel & Utilities': 500,
  });

  // --- Step 4: Savings Goal State ---
  const [hasGoal, setHasGoal] = useState<boolean>(true);
  const [goalName, setGoalName] = useState<string>('Goa Semester Trip');
  const [goalAmount, setGoalAmount] = useState<string>('6000');
  const [goalDeadline, setGoalDeadline] = useState<string>('Dec 2026');

  // --- Validation Errors ---
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculations
  const numAllowance = Math.max(0, parseFloat(allowance) || 0);
  const totalFixedDues = fixedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalCategoryBudget = Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0);
  const numGoalAmount = hasGoal ? Math.max(0, parseFloat(goalAmount) || 0) : 0;

  // Approximate cycle days remaining
  const cycleDays = useMemo(() => {
    if (frequency === 'weekly') return 7;
    if (frequency === 'custom') return Math.max(1, customDays);
    const today = new Date();
    const next = new Date(nextDate);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 15;
  }, [frequency, customDays, nextDate]);

  const spendablePool = Math.max(0, numAllowance - totalFixedDues);
  const safeDailySpend = cycleDays > 0 ? Math.floor(spendablePool / cycleDays) : 0;

  // Preset Handlers
  const handlePresetAllowance = (val: number) => {
    setAllowance(String(val));
    setErrors((prev) => ({ ...prev, allowance: '' }));
  };

  const handleAddFixedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFixedName.trim()) return;
    const amt = parseFloat(newFixedAmount);
    if (isNaN(amt) || amt < 0) return;

    setFixedItems((prev) => [
      ...prev,
      { id: `fix-${Date.now()}`, name: newFixedName.trim(), amount: amt },
    ]);
    setNewFixedName('');
    setNewFixedAmount('');
  };

  const handleRemoveFixedItem = (id: string) => {
    setFixedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleFixedPreset = (presetName: string, presetAmount: number) => {
    const exists = fixedItems.find((item) => item.name === presetName);
    if (exists) {
      setFixedItems((prev) => prev.filter((item) => item.name !== presetName));
    } else {
      setFixedItems((prev) => [
        ...prev,
        { id: `preset-${Date.now()}`, name: presetName, amount: presetAmount },
      ]);
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!allowance || parseFloat(allowance) <= 0) {
      errs.allowance = 'Please enter a valid allowance greater than ₹0.';
    }
    if (parseFloat(allowance) < 0) {
      errs.allowance = 'Allowance cannot be negative.';
    }
    if (!nextDate) {
      errs.nextDate = 'Please select your next allowance date.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Navigation handlers
  const handleContinue = () => {
    if (step === 1) {
      if (!validateStep1()) return;
    }

    if (cameFromReview) {
      setCameFromReview(false);
      setStep(5);
      return;
    }

    if (step < 5) {
      setStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    if (cameFromReview) {
      setCameFromReview(false);
      setStep(5);
      return;
    }

    if (step === 2) {
      // Clear fixed items if skipping
      setFixedItems([]);
      setStep(3);
    } else if (step === 3) {
      // Keep sensible defaults
      setStep(4);
    } else if (step === 4) {
      setHasGoal(false);
      setStep(5);
    } else if (step < 5) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (cameFromReview) {
      setCameFromReview(false);
      setStep(5);
      return;
    }
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleEditStep = (stepNumber: number) => {
    setCameFromReview(true);
    setStep(stepNumber);
  };

  // Final Action: Create My Plan
  const handleCreatePlan = () => {
    // 1. Update Profile in Context & localStorage
    updateProfile({
      name: name.trim() || 'Aarav Sharma',
      monthlyAllowance: numAllowance,
      fixedDues: totalFixedDues,
      allowanceFrequency: frequency,
      nextAllowanceDate: nextDate,
      monthLabel: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
    });

    // 2. Update category budgets
    updateMultipleCategoryBudgets(categoryBudgets);

    // 3. Add Goal if specified
    if (hasGoal && goalName.trim() && numGoalAmount > 0) {
      addGoal({
        title: goalName.trim(),
        targetAmount: numGoalAmount,
        currentAmount: 0,
        deadline: goalDeadline.trim() || 'Dec 2026',
        category: 'Travel & Vacations',
        iconName: 'beach_access',
        color: '#20a477',
        note: 'Configured during campus onboarding',
      });
    }

    // 4. Navigate directly to Home Dashboard
    navigate('/dashboard');
  };

  // Step Meta info
  const stepTitles = [
    { num: 1, title: 'Allowance', icon: Wallet },
    { num: 2, title: 'Fixed Expenses', icon: Building },
    { num: 3, title: 'Category Budgets', icon: PieChart },
    { num: 4, title: 'Savings Goal', icon: PiggyBank },
    { num: 5, title: 'Review & Confirm', icon: CheckCircle2 },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto py-4 md:py-8 font-sans">
      <div className="flex items-center justify-between mb-6 px-2">
        <PaisaWiseLogo variant="full" />
      </div>
      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-lg border border-[#e1ebe1] flex flex-col gap-6">
        {/* Step Indicator Header */}
        <div className="flex flex-col gap-3 pb-4 border-b border-[#e1ebe1]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-[#006c4c] uppercase tracking-wider">
                Step {step} of 5
              </span>
              <span className="text-xs text-[#69746d]">·</span>
              <span className="text-xs font-semibold text-[#151e18]">
                {stepTitles[step - 1].title}
              </span>
            </div>
            {cameFromReview && (
              <button
                type="button"
                onClick={() => {
                  setCameFromReview(false);
                  setStep(5);
                }}
                className="text-xs font-bold text-[#006c4c] hover:underline"
              >
                Return to Review
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#ecf6ed] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#123d32] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          {/* Step Breadcrumb Icons */}
          <div className="hidden sm:grid grid-cols-5 gap-2 pt-1 text-center">
            {stepTitles.map((item) => {
              const Icon = item.icon;
              const isCurrent = step === item.num;
              const isDone = step > item.num;
              return (
                <button
                  key={item.num}
                  type="button"
                  onClick={() => handleEditStep(item.num)}
                  disabled={step < item.num && !cameFromReview}
                  className={`flex flex-col items-center gap-1 p-1 rounded-xl transition-colors ${
                    isCurrent
                      ? 'text-[#00261e] font-extrabold'
                      : isDone
                      ? 'text-[#006c4c] font-semibold hover:bg-[#f2fcf2]'
                      : 'text-[#9aa49e] cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      isCurrent
                        ? 'bg-[#123d32] text-white shadow-xs'
                        : isDone
                        ? 'bg-[#83f9c5] text-[#002114]'
                        : 'bg-[#f2fcf2] text-[#9aa49e]'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[11px] truncate max-w-full">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ----------------- STEP 1: ALLOWANCE ----------------- */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#00261e] tracking-tight">
                How much is your campus allowance?
              </h2>
              <p className="text-xs md:text-sm text-[#69746d] mt-1">
                Tell us about your pocket money or monthly parental transfer to calculate your safe spending limit.
              </p>
            </div>

            {/* Display Name (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#414845] flex items-center justify-between">
                <span>Display Name</span>
                <span className="text-[#69746d] font-normal">Optional</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full h-11 px-4 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] border border-[#e1ebe1] focus:outline-none focus:ring-2 focus:ring-[#123d32]"
              />
            </div>

            {/* Allowance Amount */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#414845]">
                Allowance Amount (INR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-base text-[#414845]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={allowance}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (parseFloat(val) < 0) return;
                    setAllowance(val);
                    if (errors.allowance) setErrors((prev) => ({ ...prev, allowance: '' }));
                  }}
                  placeholder="10000"
                  className={`w-full h-12 pl-9 pr-4 rounded-xl bg-[#f2fcf2] text-base font-bold text-[#151e18] border ${
                    errors.allowance ? 'border-red-500 bg-red-50/20' : 'border-[#e1ebe1]'
                  } focus:outline-none focus:ring-2 focus:ring-[#123d32] tabular-nums`}
                />
              </div>
              {errors.allowance && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.allowance}</span>
                </p>
              )}

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-[#69746d]">Presets:</span>
                {[5000, 8000, 10000, 15000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetAllowance(amt)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      parseFloat(allowance) === amt
                        ? 'bg-[#123d32] text-white'
                        : 'bg-[#ecf6ed] text-[#006c4c] hover:bg-[#d8edd9]'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Allowance Frequency */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#414845]">Allowance Frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'custom', label: 'Custom' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFrequency(item.id as any)}
                    className={`h-11 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${
                      frequency === item.id
                        ? 'bg-[#123d32] text-white border-[#123d32] shadow-xs'
                        : 'bg-[#f2fcf2] text-[#414845] border-[#e1ebe1] hover:bg-[#e1ebe1]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {frequency === 'custom' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-[#69746d]">Every</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={customDays}
                    onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-9 px-2 rounded-lg bg-[#f2fcf2] border border-[#e1ebe1] text-xs font-bold text-center"
                  />
                  <span className="text-xs text-[#69746d]">days</span>
                </div>
              )}
            </div>

            {/* Next Allowance Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#414845]">
                Next Allowance Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] border border-[#e1ebe1] focus:outline-none focus:ring-2 focus:ring-[#123d32]"
                />
              </div>
              <p className="text-[11px] text-[#69746d]">
                We use this to compute how many survival days you have left in this cycle.
              </p>
            </div>
          </div>
        )}

        {/* ----------------- STEP 2: FIXED EXPENSES ----------------- */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#00261e] tracking-tight">
                  Reserved Fixed Expenses
                </h2>
                <p className="text-xs md:text-sm text-[#69746d] mt-1">
                  Reserve funds for rent, mess card, or subscriptions so you don't accidentally spend them on food.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-bold text-[#69746d] hover:text-[#00261e] px-2 py-1"
              >
                Skip this step
              </button>
            </div>

            {/* Quick College Preset Buttons */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#414845]">Quick Campus Presets:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Hostel / Room Rent', amt: 2000 },
                  { name: 'Mess & Food Card', amt: 1500 },
                  { name: 'WiFi & Mobile SIM', amt: 299 },
                  { name: 'Spotify / OTT', amt: 199 },
                ].map((preset) => {
                  const isAdded = fixedItems.some((item) => item.name === preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleToggleFixedPreset(preset.name, preset.amt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                        isAdded
                          ? 'bg-[#123d32] text-white border-[#123d32]'
                          : 'bg-[#f2fcf2] text-[#414845] border-[#e1ebe1] hover:bg-[#e1ebe1]'
                      }`}
                    >
                      <span>{preset.name}</span>
                      <span className="opacity-80">₹{preset.amt}</span>
                      {isAdded ? <Check className="w-3.5 h-3.5 text-[#83f9c5]" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Fixed List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[#414845]">Your Reserved Dues:</span>
              {fixedItems.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#f2fcf2] border border-dashed border-[#cbe1ce] text-center text-xs text-[#69746d]">
                  No fixed expenses added yet. Tap presets above or add a custom expense below.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {fixedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#f2fcf2] border border-[#e1ebe1]"
                    >
                      <span className="text-xs font-bold text-[#00261e]">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-[#151e18] tabular-nums">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFixedItem(item.id)}
                          className="text-[#69746d] hover:text-red-600 p-1 transition-colors"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#ecf6ed] text-[#00261e] font-extrabold text-xs">
                    <span>Total Fixed Dues Reserved:</span>
                    <span className="text-sm tabular-nums">₹{totalFixedDues.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Add Custom Fixed Item Form */}
            <form onSubmit={handleAddFixedItem} className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                placeholder="Expense name (e.g. Gym Pass)"
                value={newFixedName}
                onChange={(e) => setNewFixedName(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl bg-[#f2fcf2] text-xs text-[#151e18] border border-[#e1ebe1] focus:outline-none focus:ring-2 focus:ring-[#123d32]"
              />
              <div className="relative w-full sm:w-32">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#69746d]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="Amount"
                  value={newFixedAmount}
                  onChange={(e) => setNewFixedAmount(e.target.value)}
                  className="w-full h-10 pl-7 pr-3 rounded-xl bg-[#f2fcf2] text-xs font-bold text-[#151e18] border border-[#e1ebe1] focus:outline-none focus:ring-2 focus:ring-[#123d32]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-[#123d32] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#00261e] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        )}

        {/* ----------------- STEP 3: BUDGET PREFERENCES ----------------- */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#00261e] tracking-tight">
                  Category Budget Preferences
                </h2>
                <p className="text-xs md:text-sm text-[#69746d] mt-1">
                  Allocate your spendable allowance (₹{spendablePool.toLocaleString('en-IN')}) across campus envelopes. You can change these anytime later.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-bold text-[#69746d] hover:text-[#00261e] px-2 py-1"
              >
                Skip &amp; Use Defaults
              </button>
            </div>

            {/* Spendable Pool Summary Pill */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#ecf6ed] border border-[#cbe1ce]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#006c4c]" />
                <span className="text-xs font-bold text-[#00261e]">
                  Available Spendable Money:
                </span>
              </div>
              <span className="text-sm font-black text-[#00261e] tabular-nums">
                ₹{spendablePool.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Category Allocations Slider / Inputs */}
            <div className="flex flex-col gap-3">
              {Object.keys(categoryBudgets).map((catName) => {
                const currentVal = categoryBudgets[catName] || 0;
                return (
                  <div
                    key={catName}
                    className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#00261e]">{catName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#69746d]">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={currentVal}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            setCategoryBudgets((prev) => ({ ...prev, [catName]: val }));
                          }}
                          className="w-24 h-8 px-2 rounded-lg bg-white border border-[#e1ebe1] text-xs font-bold text-right text-[#151e18]"
                        />
                      </div>
                    </div>
                    {/* Visual Progress bar against spendable pool */}
                    <div className="w-full bg-[#e1ebe1] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#20a477] h-full rounded-full transition-all"
                        style={{
                          width: `${
                            spendablePool > 0
                              ? Math.min(100, (currentVal / spendablePool) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#e1ebe1] text-xs font-semibold">
              <span className="text-[#69746d]">Total Allocated:</span>
              <span className="font-extrabold text-[#00261e] tabular-nums">
                ₹{totalCategoryBudget.toLocaleString('en-IN')} / ₹{spendablePool.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* ----------------- STEP 4: SAVINGS GOAL ----------------- */}
        {step === 4 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#00261e] tracking-tight">
                  Set a Semester Savings Goal
                </h2>
                <p className="text-xs md:text-sm text-[#69746d] mt-1">
                  Optional milestone target to keep emergency funds or dream vacation money safely locked away.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-bold text-[#69746d] hover:text-[#00261e] px-2 py-1"
              >
                Skip this step
              </button>
            </div>

            {/* Toggle whether student wants a goal */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
              <span className="text-xs font-bold text-[#00261e]">
                I want to save toward a goal this semester
              </span>
              <button
                type="button"
                onClick={() => setHasGoal(!hasGoal)}
                className={`w-12 h-6 rounded-full p-0.5 flex items-center transition-colors ${
                  hasGoal ? 'bg-[#123d32] justify-end' : 'bg-[#dbe5dc] justify-start'
                }`}
                role="switch"
                aria-checked={hasGoal}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {hasGoal && (
              <div className="flex flex-col gap-4 p-5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
                {/* Goal Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#69746d] font-bold">Suggestions:</span>
                  {[
                    { name: 'Goa Semester Trip', amt: 6000, deadline: 'Dec 2026' },
                    { name: 'New Laptop / Tech', amt: 8000, deadline: 'Jan 2027' },
                    { name: 'Fest & Concert Passes', amt: 2500, deadline: 'Nov 2026' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setGoalName(preset.name);
                        setGoalAmount(String(preset.amt));
                        setGoalDeadline(preset.deadline);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#e1ebe1] text-xs font-semibold text-[#00261e] hover:bg-[#e1ebe1] transition-colors"
                    >
                      {preset.name} (₹{preset.amt})
                    </button>
                  ))}
                </div>

                {/* Goal Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Goal Name</label>
                  <input
                    type="text"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="e.g. Goa Trip Fund"
                    className="w-full h-10 px-3 rounded-xl bg-white text-xs text-[#151e18] border border-[#e1ebe1] focus:outline-none focus:ring-2 focus:ring-[#123d32]"
                  />
                </div>

                {/* Target Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Target Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#69746d]">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={goalAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (parseFloat(val) < 0) return;
                        setGoalAmount(val);
                      }}
                      placeholder="6000"
                      className="w-full h-10 pl-7 pr-3 rounded-xl bg-white text-xs font-bold text-[#151e18] border border-[#e1ebe1] focus:outline-none focus:ring-2 focus:ring-[#123d32]"
                    />
                  </div>
                </div>

                {/* Deadline */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Target Deadline</label>
                  <input
                    type="text"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    placeholder="e.g. Dec 2026 or 2026-12-31"
                    className="w-full h-10 px-3 rounded-xl bg-white text-xs text-[#151e18] border border-[#e1ebe1] focus:outline-none focus:ring-2 focus:ring-[#123d32]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------- STEP 5: REVIEW ----------------- */}
        {step === 5 && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#00261e] tracking-tight">
                Review Your Campus Plan
              </h2>
              <p className="text-xs md:text-sm text-[#69746d] mt-1">
                Everything looks ready. Review your plan details or edit any step before activating your dashboard.
              </p>
            </div>

            {/* Calculated Survival Runway Hero Pill */}
            <div className="bg-gradient-to-br from-[#123d32] to-[#00261e] text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase font-bold tracking-wider text-[#83f9c5]">
                  Calculated Survival Runway
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight tabular-nums">
                    ₹{safeDailySpend}
                  </span>
                  <span className="text-xs text-[#83f9c5] font-semibold">/ day safe spend</span>
                </div>
                <p className="text-[11px] text-[#bfecdc]">
                  Based on ₹{spendablePool.toLocaleString('en-IN')} spendable allowance over {cycleDays} remaining days.
                </p>
              </div>

              <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/15 text-xs flex flex-col gap-0.5">
                <span className="text-[#a4d0c0]">Status</span>
                <span className="font-extrabold text-[#83f9c5]">Optimal Pacing</span>
              </div>
            </div>

            {/* Step 1 Summary */}
            <div className="p-4 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#69746d] uppercase">Step 1 · Allowance</span>
                <div className="text-sm font-black text-[#00261e]">
                  ₹{numAllowance.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-[#69746d]">
                    ({frequency}, next: {nextDate})
                  </span>
                </div>
                <span className="text-xs text-[#414845]">Student: {name || 'Aarav Sharma'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleEditStep(1)}
                className="h-8 px-3 rounded-lg bg-white border border-[#e1ebe1] text-xs font-bold text-[#00261e] hover:bg-[#e1ebe1] flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            {/* Step 2 Summary */}
            <div className="p-4 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#69746d] uppercase">
                  Step 2 · Fixed Expenses
                </span>
                <div className="text-sm font-black text-[#00261e]">
                  ₹{totalFixedDues.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-[#69746d]">
                    ({fixedItems.length} reserved item{fixedItems.length === 1 ? '' : 's'})
                  </span>
                </div>
                <span className="text-xs text-[#414845]">
                  {fixedItems.map((i) => `${i.name} (₹${i.amount})`).join(', ') || 'None reserved'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleEditStep(2)}
                className="h-8 px-3 rounded-lg bg-white border border-[#e1ebe1] text-xs font-bold text-[#00261e] hover:bg-[#e1ebe1] flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            {/* Step 3 Summary */}
            <div className="p-4 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#69746d] uppercase">
                  Step 3 · Category Budgets
                </span>
                <div className="text-sm font-black text-[#00261e]">
                  ₹{totalCategoryBudget.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-[#69746d]">across 5 categories</span>
                </div>
                <span className="text-xs text-[#414845]">
                  Food: ₹{categoryBudgets['Food & Canteen'] || 0} · Travel: ₹
                  {categoryBudgets['Travel & Metro'] || 0} · Books: ₹
                  {categoryBudgets['Academics & Books'] || 0}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleEditStep(3)}
                className="h-8 px-3 rounded-lg bg-white border border-[#e1ebe1] text-xs font-bold text-[#00261e] hover:bg-[#e1ebe1] flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>

            {/* Step 4 Summary */}
            <div className="p-4 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#69746d] uppercase">
                  Step 4 · Savings Goal
                </span>
                {hasGoal ? (
                  <>
                    <div className="text-sm font-black text-[#00261e]">
                      {goalName} · ₹{numGoalAmount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-xs text-[#414845]">Target Deadline: {goalDeadline}</span>
                  </>
                ) : (
                  <span className="text-xs text-[#69746d] italic">No goal set (Skipped)</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleEditStep(4)}
                className="h-8 px-3 rounded-lg bg-white border border-[#e1ebe1] text-xs font-bold text-[#00261e] hover:bg-[#e1ebe1] flex items-center gap-1 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-[#e1ebe1]">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="h-11 px-4 rounded-xl text-xs md:text-sm font-bold text-[#414845] hover:bg-[#f2fcf2] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="h-11 px-4 rounded-xl text-xs md:text-sm font-bold text-[#69746d] hover:bg-[#f2fcf2] transition-colors"
            >
              Cancel
            </button>
          )}

          <div className="flex items-center gap-3">
            {step < 5 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="h-11 px-6 rounded-full bg-[#123d32] hover:bg-[#00261e] text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 text-[#83f9c5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreatePlan}
                className="h-12 px-8 rounded-full bg-[#20a477] hover:bg-[#198762] text-white font-black text-sm md:text-base flex items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <span>Create My Plan</span>
                <CheckCircle2 className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
