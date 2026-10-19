import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  Plus,
  Sparkles,
  Shield,
  Plane,
  Laptop,
  BookOpen,
  Keyboard,
  Music,
  Bike,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  X,
  Check,
  Trophy,
  Target,
  Clock,
  Edit3,
  Trash2,
  AlertCircle,
  Filter,
  ArrowUpRight,
  Info,
  RotateCcw,
  Compass,
  PartyPopper,
  Coins,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';
import { SavingsGoal, GoalContribution } from '../types/finance.ts';

// Available categories for goals
const GOAL_CATEGORIES = [
  'Gadgets & Tech',
  'Travel & Vacations',
  'Emergency',
  'Academics & Certifications',
  'Campus Life & Gear',
  'Personal Milestones',
  'Other',
];

// Available icons
const GOAL_ICONS = [
  { name: 'laptop', label: 'Laptop / Tech', Icon: Laptop },
  { name: 'plane', label: 'Travel / Trip', Icon: Plane },
  { name: 'shield', label: 'Emergency Vault', Icon: Shield },
  { name: 'book', label: 'Academics / Books', Icon: BookOpen },
  { name: 'keyboard', label: 'Setup / Gear', Icon: Keyboard },
  { name: 'music', label: 'Concert / Audio', Icon: Music },
  { name: 'bike', label: 'Commute / Bike', Icon: Bike },
  { name: 'piggy', label: 'General Savings', Icon: PiggyBank },
];

// Color palette options
const COLOR_OPTIONS = [
  { label: 'Royal Violet', value: '#4C3478' },
  { label: 'Bright Lavender', value: '#8B6FE8' },
  { label: 'Mint Green', value: '#42CBA5' },
  { label: 'Deep Violet', value: '#3B275F' },
  { label: 'Soft Yellow', value: '#FFE8A3' },
  { label: 'Coral Red', value: '#E56B75' },
];

// Helper to render goal icon
function renderGoalIcon(iconName: string, className = 'w-5 h-5') {
  switch (iconName?.toLowerCase()) {
    case 'laptop':
      return <Laptop className={className} />;
    case 'plane':
    case 'beach_access':
      return <Plane className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'book':
      return <BookOpen className={className} />;
    case 'keyboard':
      return <Keyboard className={className} />;
    case 'music':
      return <Music className={className} />;
    case 'bike':
      return <Bike className={className} />;
    default:
      return <PiggyBank className={className} />;
  }
}

// Student-friendly optional challenges
interface ChallengeItem {
  id: string;
  title: string;
  target: number;
  description: string;
  category: string;
  badge: string;
}

const DEFAULT_CHALLENGES: ChallengeItem[] = [
  {
    id: 'ch-chai',
    title: 'Chai & Snack Swap',
    target: 500,
    description: 'Swap 10 canteen snack runs with hostel mess or home snacks to bank ₹500.',
    category: 'Daily Habit',
    badge: '☕ Snack Master',
  },
  {
    id: 'ch-emergency',
    title: 'Emergency Cushion Starter',
    target: 1000,
    description: 'Build your first ₹1,000 untouchable buffer for urgent lab fees or medicals.',
    category: 'Safety Net',
    badge: '🛡️ Shield Bearer',
  },
  {
    id: 'ch-weekend',
    title: 'Weekend Mindful Spending',
    target: 600,
    description: 'Keep non-essential weekend social outings within bounds for 2 weekends.',
    category: 'Discipline',
    badge: '🎯 Weekend Pro',
  },
  {
    id: 'ch-milestone',
    title: 'Semester Milestone Stash',
    target: 1500,
    description: 'Ring-fence ₹1,500 from project stipend, tutoring, or allowance before exams.',
    category: 'Milestone',
    badge: '🚀 Horizon Builder',
  },
];

export const GoalsPage: React.FC = () => {
  const {
    goals,
    addGoal,
    editGoal,
    deleteGoal,
    addGoalContribution,
    restoreDemoGoals,
    liquidCash,
  } = useFinance();

  // Filter & sort states
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'target' | 'progress' | 'recent'>('deadline');

  // Modals & drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoalData, setEditingGoalData] = useState<SavingsGoal | null>(null);
  const [selectedGoalForDetails, setSelectedGoalForDetails] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  // Contribution modal state
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);
  const [contributeAmount, setContributeAmount] = useState<number>(500);
  const [contributeDate, setContributeDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [contributeNote, setContributeNote] = useState<string>('');
  const [contributionStep, setContributionStep] = useState<'input' | 'confirm'>('input');

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(
    null
  );

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Form states for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formTargetAmount, setFormTargetAmount] = useState<number>(5000);
  const [formInitialSaved, setFormInitialSaved] = useState<number>(0);
  const [formDeadline, setFormDeadline] = useState('');
  const [formCategory, setFormCategory] = useState(GOAL_CATEGORIES[0]);
  const [formIcon, setFormIcon] = useState('laptop');
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0].value);
  const [formNote, setFormNote] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Optional savings challenges local progress
  const [joinedChallenges, setJoinedChallenges] = useState<{ [key: string]: number }>(() => {
    try {
      const saved = localStorage.getItem('paisawise_challenges_v1');
      return saved ? JSON.parse(saved) : { 'ch-chai': 250, 'ch-emergency': 1000 };
    } catch {
      return { 'ch-chai': 250, 'ch-emergency': 1000 };
    }
  });

  const handleJoinOrProgressChallenge = (chId: string, increment: number) => {
    setJoinedChallenges((prev) => {
      const current = prev[chId] || 0;
      const ch = DEFAULT_CHALLENGES.find((c) => c.id === chId);
      const target = ch ? ch.target : 1000;
      const updated = Math.min(target, current + increment);
      const next = { ...prev, [chId]: updated };
      localStorage.setItem('paisawise_challenges_v1', JSON.stringify(next));
      return next;
    });
    showToast(`Progress logged toward challenge! Keep it up! 🌟`, 'success');
  };

  // Keep selected goal synchronized with context goals
  const activeDetailsGoal = useMemo(() => {
    if (!selectedGoalForDetails) return null;
    return goals.find((g) => g.id === selectedGoalForDetails.id) || selectedGoalForDetails;
  }, [goals, selectedGoalForDetails]);

  // Calculations for summary bar
  const totalSaved = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [goals]);

  const totalTarget = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  }, [goals]);

  const activeGoalsCount = useMemo(() => {
    return goals.filter((g) => g.currentAmount < g.targetAmount).length;
  }, [goals]);

  const completedGoalsCount = useMemo(() => {
    return goals.filter((g) => g.currentAmount >= g.targetAmount).length;
  }, [goals]);

  const overallProgressPercentage = useMemo(() => {
    if (totalTarget <= 0) return 0;
    return Math.min(100, Math.round((totalSaved / totalTarget) * 100));
  }, [totalSaved, totalTarget]);

  const hasDemoGoals = useMemo(() => {
    return goals.some((g) => g.isDemo);
  }, [goals]);

  // Filtered & Sorted goals
  const filteredGoals = useMemo(() => {
    return goals
      .filter((g) => {
        const isCompleted = g.currentAmount >= g.targetAmount;
        if (statusFilter === 'active' && isCompleted) return false;
        if (statusFilter === 'completed' && !isCompleted) return false;
        if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline') {
          const dateA = new Date(a.deadline).getTime() || 0;
          const dateB = new Date(b.deadline).getTime() || 0;
          return dateA - dateB;
        }
        if (sortBy === 'target') {
          return b.targetAmount - a.targetAmount;
        }
        if (sortBy === 'progress') {
          const ratioA = a.targetAmount > 0 ? a.currentAmount / a.targetAmount : 0;
          const ratioB = b.targetAmount > 0 ? b.currentAmount / b.targetAmount : 0;
          return ratioB - ratioA;
        }
        // recent
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [goals, statusFilter, categoryFilter, sortBy]);

  // Compute days left and suggested weekly/monthly contributions
  const getGoalTimeMetrics = (goal: SavingsGoal) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(goal.deadline);
    const isValidDate = !isNaN(deadlineDate.getTime());

    let daysLeft = 0;
    if (isValidDate) {
      const diffTime = deadlineDate.getTime() - today.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    const isCompleted = remainingAmount === 0;

    let suggestedWeekly = 0;
    let suggestedMonthly = 0;

    if (!isCompleted && daysLeft > 0) {
      const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
      const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
      suggestedWeekly = Math.ceil(remainingAmount / weeksLeft);
      suggestedMonthly = Math.ceil(remainingAmount / monthsLeft);
    }

    return {
      daysLeft,
      isValidDate,
      remainingAmount,
      isCompleted,
      suggestedWeekly,
      suggestedMonthly,
    };
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormTitle('');
    setFormTargetAmount(5000);
    setFormInitialSaved(0);
    // default deadline: 3 months from now
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    setFormDeadline(d.toISOString().split('T')[0]);
    setFormCategory(GOAL_CATEGORIES[0]);
    setFormIcon('laptop');
    setFormColor(COLOR_OPTIONS[0].value);
    setFormNote('');
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (goal: SavingsGoal) => {
    setEditingGoalData(goal);
    setFormTitle(goal.title);
    setFormTargetAmount(goal.targetAmount);
    setFormInitialSaved(goal.currentAmount);
    // Format deadline if valid
    const parsed = new Date(goal.deadline);
    if (!isNaN(parsed.getTime())) {
      setFormDeadline(parsed.toISOString().split('T')[0]);
    } else {
      setFormDeadline(goal.deadline);
    }
    setFormCategory(goal.category || GOAL_CATEGORIES[0]);
    setFormIcon(goal.iconName || 'piggy');
    setFormColor(goal.color || COLOR_OPTIONS[0].value);
    setFormNote(goal.note || '');
    setFormErrors({});
  };

  // Validate form
  const validateGoalForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formTitle.trim()) {
      errors.title = 'Please enter a goal name.';
    }
    if (!formTargetAmount || Number(formTargetAmount) <= 0) {
      errors.targetAmount = 'Target amount must be a positive number greater than ₹0.';
    }
    if (!formDeadline) {
      errors.deadline = 'Please choose a target date.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save new goal
  const handleSaveNewGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGoalForm()) return;

    addGoal({
      title: formTitle.trim(),
      targetAmount: Number(formTargetAmount),
      currentAmount: Math.max(0, Number(formInitialSaved) || 0),
      deadline: formDeadline,
      category: formCategory,
      iconName: formIcon,
      color: formColor,
      note: formNote.trim() || undefined,
      isDemo: false,
      createdAt: new Date().toISOString().split('T')[0],
      contributions:
        Number(formInitialSaved) > 0
          ? [
              {
                id: `contrib-${Date.now()}`,
                amount: Number(formInitialSaved),
                date: new Date().toISOString().split('T')[0],
                note: 'Initial saved amount',
              },
            ]
          : [],
    });

    setIsCreateModalOpen(false);
    showToast(`Created savings goal "${formTitle.trim()}"!`);
  };

  // Save edited goal
  const handleSaveEditGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoalData || !validateGoalForm()) return;

    editGoal(editingGoalData.id, {
      title: formTitle.trim(),
      targetAmount: Number(formTargetAmount),
      deadline: formDeadline,
      category: formCategory,
      iconName: formIcon,
      color: formColor,
      note: formNote.trim() || undefined,
    });

    setEditingGoalData(null);
    showToast(`Updated savings goal "${formTitle.trim()}".`);
  };

  // Delete goal
  const handleConfirmDelete = () => {
    if (!goalToDelete) return;
    deleteGoal(goalToDelete.id);
    if (selectedGoalForDetails?.id === goalToDelete.id) {
      setSelectedGoalForDetails(null);
    }
    showToast(`Deleted goal "${goalToDelete.title}".`, 'info');
    setGoalToDelete(null);
  };

  // Open Contribution Modal
  const handleOpenContributeModal = (goal: SavingsGoal, defaultAmt = 500) => {
    setContributeGoal(goal);
    setContributeAmount(defaultAmt);
    setContributeDate(new Date().toISOString().split('T')[0]);
    setContributeNote('');
    setContributionStep('input');
  };

  // Step 1 -> Step 2 (Confirmation)
  const handleProceedToConfirmContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal || contributeAmount <= 0) return;
    setContributionStep('confirm');
  };

  // Execute contribution
  const handleExecuteContribution = () => {
    if (!contributeGoal || contributeAmount <= 0) return;

    addGoalContribution(contributeGoal.id, {
      amount: Number(contributeAmount),
      date: contributeDate,
      note: contributeNote.trim() || 'Savings deposit',
    });

    showToast(
      `Deposited ₹${contributeAmount.toLocaleString('en-IN')} to "${contributeGoal.title}"! 🎉`
    );
    setContributeGoal(null);
    setContributionStep('input');
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-8 pb-16 px-4 sm:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#00261e] text-white shadow-2xl border border-[#83f9c5]/30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#83f9c5]" />
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-[#00261e] tracking-tight">
              Savings Goals & Vaults
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#83f9c5] text-[#002114] text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-[#006c4c]" />
              <span>Campus Targets</span>
            </span>
            {hasDemoGoals && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdf9e]/80 text-[#473300] text-xs font-bold border border-[#ffdf9e]">
                <Info className="w-3.5 h-3.5" />
                <span>Demo Data Active</span>
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-[#505d54] max-w-2xl leading-relaxed">
            Ring-fence funds for your tech upgrades, semester trips, and emergency buffers away
            from daily canteen temptation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {hasDemoGoals ? (
            <button
              type="button"
              onClick={restoreDemoGoals}
              title="Reset demo goals to default student examples"
              className="h-10 px-3.5 rounded-xl border border-[#d2ddd3] hover:border-[#006c4c] bg-white text-[#505d54] hover:text-[#00261e] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={restoreDemoGoals}
              className="h-10 px-3.5 rounded-xl border border-[#E9E4F2] hover:border-[#4C3478] bg-white text-[#4C3478] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Demo Goals</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-10 px-5 rounded-full bg-[#4C3478] hover:bg-[#3B275F] text-white font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#42CBA5]" />
            <span>New Savings Goal</span>
          </button>
        </div>
      </div>

      {/* Demo Data Disclaimer Banner */}
      {hasDemoGoals && (
        <div className="p-4 rounded-2xl bg-[#FFF9E6] border border-[#FFE8A3] text-xs text-[#735000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FFE8A3] flex items-center justify-center shrink-0">
              <Info className="w-4 h-4 text-[#946300]" />
            </div>
            <div>
              <p className="font-extrabold text-[#946300]">
                Preloaded with 3 student-focused demo goals:
              </p>
              <p className="text-[#735000]">
                <strong>New Laptop for Coding</strong>, <strong>College Trip to Goa</strong>, and{' '}
                <strong>Hostel Emergency Fund</strong>. Deposits remain safely tracked in your browser.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#4C3478] hover:bg-[#3B275F] text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
          >
            Create Your Real Goal
          </button>
        </div>
      )}

      {/* Savings Dashboard Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Saved */}
        <div className="bg-white rounded-3xl p-5 border border-[#E9E4F2] shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777187] uppercase tracking-wider">
              Total Saved
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#E5F8F1] text-[#42CBA5] flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-[#29233A] tracking-tight tabular-nums">
              ₹{totalSaved.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[#777187] mt-1 flex items-center gap-1">
              <span>Target: ₹{totalTarget.toLocaleString('en-IN')}</span>
              <span className="font-bold text-[#42CBA5]">({overallProgressPercentage}%)</span>
            </p>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E9E4F2] overflow-hidden">
            <div
              className="h-full bg-[#42CBA5] rounded-full transition-all duration-500"
              style={{ width: `${overallProgressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Active Goals */}
        <div className="bg-white rounded-3xl p-5 border border-[#E9E4F2] shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777187] uppercase tracking-wider">
              Active Targets
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EDE7FF] text-[#4C3478] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-[#29233A] tracking-tight tabular-nums">
              {activeGoalsCount}
            </div>
            <p className="text-xs text-[#777187] mt-1">In-progress savings milestones</p>
          </div>
          <div className="text-xs font-bold text-[#4C3478] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#42CBA5]" />
            <span>Regular deposits keep you ahead</span>
          </div>
        </div>

        {/* Card 3: Completed Goals */}
        <div className="bg-white rounded-3xl p-5 border border-[#E9E4F2] shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777187] uppercase tracking-wider">
              Completed Vaults
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF9E6] text-[#946300] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#B27B00]" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-[#29233A] tracking-tight tabular-nums">
              {completedGoalsCount}
            </div>
            <p className="text-xs text-[#777187] mt-1">100% funded & ready to deploy</p>
          </div>
          <div className="text-xs font-bold text-[#42CBA5] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{completedGoalsCount > 0 ? 'Milestones unlocked!' : 'First milestone in reach'}</span>
          </div>
        </div>

        {/* Card 4: Liquid Available Reference */}
        <div className="bg-white rounded-3xl p-5 border border-[#E9E4F2] shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#777187] uppercase tracking-wider">
              Liquid Cash Reference
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EDE7FF] text-[#4C3478] flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-black text-[#29233A] tracking-tight tabular-nums">
              ₹{liquidCash.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[#777187] mt-1">Free balance for day-to-day & savings</p>
          </div>
          <p className="text-[11px] text-[#777187] leading-tight">
            *Deposits are tracked independently so canteen expenses are never double-counted.
          </p>
        </div>
      </section>

      {/* Filter Tabs and Sort Controls */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E9E4F2] shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F7F5FC] rounded-xl self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#4C3478] text-white shadow-2xs'
                : 'text-[#777187] hover:text-[#29233A]'
            }`}
          >
            All Goals ({goals.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-[#4C3478] text-white shadow-2xs'
                : 'text-[#777187] hover:text-[#29233A]'
            }`}
          >
            Active ({activeGoalsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'completed'
                ? 'bg-[#4C3478] text-white shadow-2xs'
                : 'text-[#777187] hover:text-[#29233A]'
            }`}
          >
            Completed ({completedGoalsCount})
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-end">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-[#F7F5FC] border border-[#E9E4F2] text-xs font-bold text-[#29233A] focus:outline-none focus:ring-2 focus:ring-[#4C3478]"
          >
            <option value="all">All Categories</option>
            {GOAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-xl bg-[#F7F5FC] border border-[#E9E4F2] text-xs font-bold text-[#29233A] focus:outline-none focus:ring-2 focus:ring-[#4C3478]"
          >
            <option value="deadline">Sort: Deadline</option>
            <option value="target">Sort: Target Amount</option>
            <option value="progress">Sort: % Progress</option>
            <option value="recent">Sort: Recently Added</option>
          </select>
        </div>
      </section>

      {/* Goal Cards Grid or Empty State */}
      {filteredGoals.length === 0 ? (
        <section className="bg-white rounded-3xl p-10 border border-[#E9E4F2] text-center flex flex-col items-center justify-center gap-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-[#EDE7FF] text-[#4C3478] flex items-center justify-center shadow-xs">
            <PiggyBank className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-[#29233A]">No savings goals found</h3>
            <p className="text-xs text-[#777187] mt-1 leading-relaxed">
              {goals.length === 0
                ? 'You do not have any active or completed goals yet. Create your first goal to lock money away from daily temptations, or reload the demo student goals.'
                : 'No goals match your active filters. Try switching filters or resetting category selection.'}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            {goals.length === 0 && (
              <button
                type="button"
                onClick={restoreDemoGoals}
                className="h-10 px-5 rounded-full border border-[#E9E4F2] text-[#29233A] hover:bg-[#F7F5FC] font-bold text-xs transition-colors"
              >
                Reload Demo Goals
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="h-10 px-6 rounded-full bg-[#4C3478] hover:bg-[#3B275F] text-white font-bold text-xs transition-all shadow-sm"
            >
              + Create New Goal
            </button>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => {
            const ratio =
              goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;
            const { daysLeft, isValidDate, remainingAmount, isCompleted, suggestedWeekly } =
              getGoalTimeMetrics(goal);

            return (
              <div
                key={goal.id}
                className="bg-white rounded-3xl p-6 border border-[#E9E4F2] hover:border-[#8B6FE8]/50 hover:shadow-md transition-all flex flex-col justify-between gap-5 relative group"
              >
                {/* Card Top: Icon, Tag & Badges */}
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: `${goal.color || '#4C3478'}15`,
                          color: goal.color || '#4C3478',
                        }}
                      >
                        {renderGoalIcon(goal.iconName, 'w-5 h-5')}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-[#777187] uppercase tracking-wider block">
                          {goal.category || 'Savings Goal'}
                        </span>
                        <h3 className="font-extrabold text-base text-[#29233A] line-clamp-1">
                          {goal.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {goal.isDemo && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF9E6] text-[#735000] border border-[#FFE8A3] text-[10px] font-extrabold">
                          Demo
                        </span>
                      )}
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E5F8F1] text-[#186851] text-[11px] font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#42CBA5]" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F7F5FC] text-[#29233A] text-[11px] font-bold">
                          {ratio}%
                        </span>
                      )}
                    </div>
                  </div>

                  {goal.note && (
                    <p className="text-xs text-[#777187] line-clamp-2 leading-relaxed">
                      {goal.note}
                    </p>
                  )}

                  {/* Progress & Target numbers */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <div>
                        <span className="font-extrabold text-sm text-[#29233A]">
                          ₹{goal.currentAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[#777187] text-[11px] ml-1">saved</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#777187] text-[11px]">of </span>
                        <span className="font-bold text-[#29233A]">
                          ₹{goal.targetAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-[#F7F5FC] overflow-hidden border border-[#E9E4F2]/50">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${ratio}%`,
                          backgroundColor: isCompleted ? '#42CBA5' : goal.color || '#4C3478',
                        }}
                      ></div>
                    </div>

                    {/* Deadline and suggested contribution */}
                    <div className="flex items-center justify-between text-[11px] text-[#777187] pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-[#777187]" />
                        <span>
                          {isValidDate
                            ? new Date(goal.deadline).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : goal.deadline}
                        </span>
                      </span>

                      {isCompleted ? (
                        <span className="text-[#42CBA5] font-bold flex items-center gap-1">
                          <PartyPopper className="w-3 h-3" />
                          <span>Fully Funded!</span>
                        </span>
                      ) : daysLeft > 0 ? (
                        <span className="text-[#29233A] font-semibold">
                          {daysLeft} days left (~₹{suggestedWeekly.toLocaleString('en-IN')}/wk)
                        </span>
                      ) : (
                        <span className="text-[#E56B75] font-bold">Target date passed</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Actions */}
                <div className="pt-3 border-t border-[#E9E4F2] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => handleOpenContributeModal(goal, 500)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#4C3478] hover:bg-[#3B275F] text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#42CBA5]" />
                      <span>Deposit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGoalForDetails(goal)}
                      className="py-2 px-3 rounded-xl bg-[#F7F5FC] hover:bg-[#EDE7FF] text-[#29233A] font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      title="View contributions and breakdown"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3 text-[#777187]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(goal)}
                      title="Edit Goal"
                      className="p-2 rounded-xl text-[#777187] hover:text-[#29233A] hover:bg-[#F7F5FC] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalToDelete(goal)}
                      title="Delete Goal"
                      className="p-2 rounded-xl text-[#777187] hover:text-[#E56B75] hover:bg-[#FDECEE] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Optional Student Savings Challenges Section */}
      <section className="bg-gradient-to-br from-[#4C3478] to-[#3B275F] text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg mt-4">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#8B6FE8]/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFE8A3] text-[#735000] text-xs font-black">
                  Zero Stress • Non-Punitive
                </span>
                <span className="text-xs text-[#EDE7FF] font-semibold">Student Habit Builders</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                Campus Savings Challenges
              </h2>
              <p className="text-xs text-[#EDE7FF]/90 max-w-xl">
                Gentle milestones designed around real student choices. No punitive streaks, no
                public shaming—just easy wins for your wallet.
              </p>
            </div>
            <div className="text-xs font-bold text-[#42CBA5] bg-white/10 px-3 py-1.5 rounded-xl self-start md:self-auto flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FFE8A3]" />
              <span>Small daily trims lead to massive semester freedom</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEFAULT_CHALLENGES.map((ch) => {
              const userProgress = joinedChallenges[ch.id] || 0;
              const chRatio = Math.min(100, Math.round((userProgress / ch.target) * 100));
              const isChDone = chRatio >= 100;

              return (
                <div
                  key={ch.id}
                  className="bg-white/10 hover:bg-white/15 backdrop-blur-xs border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#a4d0c0]">{ch.category}</span>
                      <span className="text-xs font-black text-[#ffdf9e]">{ch.badge}</span>
                    </div>
                    <h4 className="font-extrabold text-sm text-white">{ch.title}</h4>
                    <p className="text-[11px] text-[#bfecdc] leading-relaxed">{ch.description}</p>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-2">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-[#83f9c5]">₹{userProgress} saved</span>
                      <span className="text-white/70">Target: ₹{ch.target}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                      <div
                        className="h-full bg-[#83f9c5] rounded-full transition-all"
                        style={{ width: `${chRatio}%` }}
                      ></div>
                    </div>

                    <div className="pt-2">
                      {isChDone ? (
                        <div className="py-1.5 px-3 rounded-lg bg-[#83f9c5] text-[#002114] text-xs font-black text-center flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Challenge Completed!</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoinOrProgressChallenge(ch.id, 100)}
                          className="w-full py-1.5 px-3 rounded-lg bg-white text-[#00261e] hover:bg-[#83f9c5] text-xs font-bold transition-all text-center flex items-center justify-center gap-1 active:scale-95 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Log +₹100 Saved</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Goal Details Drawer / Modal */}
      {activeDetailsGoal && (
        <div
          className="fixed inset-0 z-50 bg-[#00261e]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedGoalForDetails(null)}
        >
          <div
            className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl flex flex-col gap-6 my-auto animate-in fade-in zoom-in-95 duration-150 border border-[#e1ebe1]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#e1ebe1]">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${activeDetailsGoal.color || '#123d32'}15`,
                    color: activeDetailsGoal.color || '#123d32',
                  }}
                >
                  {renderGoalIcon(activeDetailsGoal.iconName, 'w-6 h-6')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#69746d] uppercase tracking-wider">
                      {activeDetailsGoal.category}
                    </span>
                    {activeDetailsGoal.isDemo && (
                      <span className="px-2 py-0.5 rounded-full bg-[#ffdf9e] text-[#473300] text-[10px] font-extrabold">
                        Demo Goal
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-[#00261e]">
                    {activeDetailsGoal.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGoalForDetails(null)}
                className="p-1.5 rounded-full text-[#69746d] hover:text-[#00261e] hover:bg-[#f2f6f2] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Breakdown & Metrics */}
            {(() => {
              const ratio =
                activeDetailsGoal.targetAmount > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (activeDetailsGoal.currentAmount / activeDetailsGoal.targetAmount) * 100
                      )
                    )
                  : 0;
              const {
                daysLeft,
                isValidDate,
                remainingAmount,
                isCompleted,
                suggestedWeekly,
                suggestedMonthly,
              } = getGoalTimeMetrics(activeDetailsGoal);

              return (
                <div className="flex flex-col gap-5">
                  {/* Big stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#d2edd2]">
                      <span className="text-[11px] font-bold text-[#505d54] uppercase block">
                        Saved So Far
                      </span>
                      <span className="text-lg sm:text-xl font-black text-[#006c4c]">
                        ₹{activeDetailsGoal.currentAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#f7faf7] border border-[#e1ebe1]">
                      <span className="text-[11px] font-bold text-[#505d54] uppercase block">
                        Target Total
                      </span>
                      <span className="text-lg sm:text-xl font-black text-[#00261e]">
                        ₹{activeDetailsGoal.targetAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#f7faf7] border border-[#e1ebe1]">
                      <span className="text-[11px] font-bold text-[#505d54] uppercase block">
                        Remaining
                      </span>
                      <span className="text-lg sm:text-xl font-black text-[#123d32]">
                        ₹{remainingAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & percentage */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#00261e]">{ratio}% Achieved</span>
                      <span className="text-[#505d54]">
                        {isCompleted ? 'Goal Fully Achieved! 🎉' : `₹${remainingAmount.toLocaleString('en-IN')} left`}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#edf3ed] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${ratio}%`,
                          backgroundColor: isCompleted ? '#006c4c' : activeDetailsGoal.color || '#123d32',
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Time & Suggested Contribution Breakdown */}
                  <div className="p-4 rounded-2xl bg-[#f2f6f2] border border-[#d2ddd3] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#00261e] flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#006c4c]" />
                        <span>Target Date:</span>
                      </span>
                      <span className="font-semibold text-[#505d54]">
                        {isValidDate
                          ? new Date(activeDetailsGoal.deadline).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : activeDetailsGoal.deadline}
                      </span>
                    </div>

                    {!isCompleted && daysLeft > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#d2ddd3]">
                        <div className="bg-white p-2.5 rounded-xl border border-[#e1ebe1]">
                          <span className="text-[10px] text-[#69746d] font-bold uppercase block">
                            Suggested Weekly
                          </span>
                          <span className="text-sm font-black text-[#00261e]">
                            ₹{suggestedWeekly.toLocaleString('en-IN')} / week
                          </span>
                          <span className="text-[10px] text-[#505d54] block mt-0.5">
                            Over ~{Math.ceil(daysLeft / 7)} weeks
                          </span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-[#e1ebe1]">
                          <span className="text-[10px] text-[#69746d] font-bold uppercase block">
                            Suggested Monthly
                          </span>
                          <span className="text-sm font-black text-[#00261e]">
                            ₹{suggestedMonthly.toLocaleString('en-IN')} / month
                          </span>
                          <span className="text-[10px] text-[#505d54] block mt-0.5">
                            Over ~{Math.ceil(daysLeft / 30)} months
                          </span>
                        </div>
                      </div>
                    )}

                    {activeDetailsGoal.note && (
                      <p className="text-xs text-[#505d54] italic pt-1">
                        "{activeDetailsGoal.note}"
                      </p>
                    )}
                  </div>

                  {/* Contribution History Log */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-[#00261e] uppercase tracking-wider">
                        Contribution History ({activeDetailsGoal.contributions?.length || 0})
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOpenContributeModal(activeDetailsGoal)}
                        className="text-xs font-bold text-[#006c4c] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Deposit</span>
                      </button>
                    </div>

                    {(!activeDetailsGoal.contributions ||
                      activeDetailsGoal.contributions.length === 0) ? (
                      <div className="p-4 rounded-2xl bg-[#fafcfa] border border-dashed border-[#d2ddd3] text-center text-xs text-[#69746d]">
                        No deposits logged yet. Click below to add your first deposit!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                        {activeDetailsGoal.contributions.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl bg-white border border-[#e1ebe1] flex items-center justify-between text-xs hover:border-[#bfecdc] transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#83f9c5]/30 text-[#006c4c] flex items-center justify-center font-bold">
                                +
                              </div>
                              <div>
                                <span className="font-bold text-[#00261e] block">
                                  {c.note || 'Savings Deposit'}
                                </span>
                                <span className="text-[11px] text-[#69746d]">
                                  {new Date(c.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                            <span className="font-extrabold text-sm text-[#006c4c]">
                              +₹{c.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#e1ebe1]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditModal(activeDetailsGoal);
                    setSelectedGoalForDetails(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#d2ddd3] text-[#505d54] hover:text-[#00261e] hover:bg-[#f2f6f2] font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Goal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGoalToDelete(activeDetailsGoal);
                    setSelectedGoalForDetails(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#fee2e2] text-[#b34045] hover:bg-[#fee2e2]/40 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleOpenContributeModal(activeDetailsGoal)}
                className="px-6 py-2.5 rounded-full bg-[#123d32] hover:bg-[#00261e] text-white font-black text-xs md:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Deposit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contribution Modal with Two-step Confirmation */}
      {contributeGoal && (
        <div
          className="fixed inset-0 z-50 bg-[#00261e]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setContributeGoal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 border border-[#e1ebe1]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#e1ebe1]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#83f9c5]/30 text-[#006c4c] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#00261e]">
                    {contributionStep === 'input' ? 'Add Deposit to Vault' : 'Confirm Contribution'}
                  </h3>
                  <span className="text-[11px] text-[#69746d] font-bold">
                    {contributeGoal.title}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContributeGoal(null)}
                className="p-1 rounded-full text-[#69746d] hover:text-[#00261e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {contributionStep === 'input' ? (
              <form onSubmit={handleProceedToConfirmContribution} className="flex flex-col gap-4">
                {/* Amount input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#505d54]">
                    Contribution Amount (₹) <span className="text-[#b34045]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-[#505d54]">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="10"
                      step="10"
                      required
                      value={contributeAmount || ''}
                      onChange={(e) => setContributeAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-[#f7faf7] text-base font-extrabold text-[#00261e] border border-[#d2ddd3] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[11px] text-[#69746d] font-semibold">Quick add:</span>
                    {[250, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setContributeAmount(amt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          contributeAmount === amt
                            ? 'bg-[#123d32] text-white'
                            : 'bg-[#edf3ed] text-[#00261e] hover:bg-[#d2ddd3]'
                        }`}
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#505d54]">Date</label>
                  <input
                    type="date"
                    required
                    value={contributeDate}
                    onChange={(e) => setContributeDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f7faf7] text-sm text-[#00261e] border border-[#d2ddd3] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  />
                </div>

                {/* Optional Note */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#505d54]">
                    Optional Note / Source
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saved on weekend chai, stipend bonus"
                    value={contributeNote}
                    onChange={(e) => setContributeNote(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f7faf7] text-sm text-[#00261e] border border-[#d2ddd3] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#f2fcf2] border border-[#83f9c5]/60 text-[11px] text-[#002114] leading-relaxed">
                  💡 <strong>Safe Accounting:</strong> This deposit updates your savings goal and
                  vault history directly. It does not count as a normal expense against your canteen
                  budget.
                </div>

                {/* Modal Buttons */}
                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setContributeGoal(null)}
                    className="h-10 px-4 rounded-full bg-[#f2f6f2] text-[#505d54] font-bold text-xs hover:bg-[#e6eee6] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contributeAmount <= 0}
                    className="h-10 px-6 rounded-full bg-[#123d32] hover:bg-[#00261e] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Next: Review Deposit
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Confirmation */
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-[#f7faf7] border border-[#d2ddd3] flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-[#69746d] uppercase tracking-wider">
                    Deposit Summary
                  </span>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#505d54]">Goal:</span>
                    <span className="font-bold text-[#00261e]">{contributeGoal.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#505d54]">Deposit Amount:</span>
                    <span className="font-black text-lg text-[#006c4c]">
                      ₹{contributeAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#505d54]">Date:</span>
                    <span className="font-medium text-[#00261e]">{contributeDate}</span>
                  </div>
                  {contributeNote && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#505d54]">Note:</span>
                      <span className="font-medium text-[#00261e] italic">"{contributeNote}"</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#e1ebe1] text-xs">
                    <div className="flex justify-between font-semibold">
                      <span>New Progress:</span>
                      <span className="text-[#00261e]">
                        ₹{(contributeGoal.currentAmount + contributeAmount).toLocaleString('en-IN')} / ₹
                        {contributeGoal.targetAmount.toLocaleString('en-IN')} (
                        {Math.min(
                          100,
                          Math.round(
                            ((contributeGoal.currentAmount + contributeAmount) /
                              contributeGoal.targetAmount) *
                              100
                          )
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setContributionStep('input')}
                    className="h-10 px-4 rounded-full bg-[#f2f6f2] text-[#505d54] font-bold text-xs hover:bg-[#e6eee6] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteContribution}
                    className="h-10 px-6 rounded-full bg-[#006c4c] hover:bg-[#00261e] text-white font-black text-xs md:text-sm shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Deposit</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      {(isCreateModalOpen || editingGoalData) && (
        <div
          className="fixed inset-0 z-50 bg-[#00261e]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setIsCreateModalOpen(false);
            setEditingGoalData(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl flex flex-col gap-4 my-auto animate-in fade-in zoom-in-95 duration-150 border border-[#e1ebe1]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#e1ebe1]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#83f9c5]/30 text-[#006c4c] flex items-center justify-center">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-[#00261e]">
                  {editingGoalData ? 'Edit Savings Goal' : 'Create New Savings Goal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingGoalData(null);
                }}
                className="p-1 rounded-full text-[#69746d] hover:text-[#00261e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingGoalData ? handleSaveEditGoal : handleSaveNewGoal}
              className="flex flex-col gap-3.5"
            >
              {/* Goal Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#505d54]">
                  Goal Name <span className="text-[#b34045]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Coding Laptop, Semester Trip, Emergency Fund"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#f7faf7] text-sm text-[#00261e] border border-[#d2ddd3] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                />
                {formErrors.title && (
                  <span className="text-[11px] text-[#b34045] font-semibold">
                    {formErrors.title}
                  </span>
                )}
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#505d54]">
                    Target Amount (₹) <span className="text-[#b34045]">*</span>
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={formTargetAmount || ''}
                    onChange={(e) => setFormTargetAmount(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f7faf7] text-sm font-bold text-[#00261e] border border-[#d2ddd3] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  />
                  {formErrors.targetAmount && (
                    <span className="text-[11px] text-[#b34045] font-semibold">
                      {formErrors.targetAmount}
                    </span>
                  )}
                </div>

                {!editingGoalData ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#505d54]">
                      Initial Saved (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder="0"
                      value={formInitialSaved || ''}
                      onChange={(e) => setFormInitialSaved(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#f7faf7] text-sm text-[#00261e] border border-[#d2ddd3] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#505d54]">Current Saved (₹)</label>
                    <input
                      type="text"
                      disabled
                      value={`₹${editingGoalData.currentAmount.toLocaleString('en-IN')}`}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#f2f6f2] text-sm text-[#69746d] border border-[#d2ddd3] cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              {/* Deadline & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#505d54]">
                    Target Date <span className="text-[#b34045]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f7faf7] text-sm text-[#00261e] border border-[#d2ddd3] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  />
                  {formErrors.deadline && (
                    <span className="text-[11px] text-[#b34045] font-semibold">
                      {formErrors.deadline}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#505d54]">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#f7faf7] text-sm text-[#00261e] border border-[#d2ddd3] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  >
                    {GOAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Icon & Color Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#505d54]">Icon Style</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {GOAL_ICONS.map((item) => {
                    const isSelected = formIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormIcon(item.name)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 shrink-0 transition-all ${
                          isSelected
                            ? 'bg-[#123d32] text-white border-[#123d32] shadow-xs'
                            : 'bg-white text-[#505d54] border-[#d2ddd3] hover:border-[#00261e]'
                        }`}
                        title={item.label}
                      >
                        <item.Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color accent */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#505d54]">Color Accent</label>
                <div className="flex items-center gap-2.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormColor(c.value)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formColor === c.value ? 'scale-125 ring-2 ring-[#00261e] ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Motivation / Note */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#505d54]">
                  Motivation Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Upgrading for ML coursework, hackathons, or booking group hostel stay."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#f7faf7] text-sm text-[#00261e] border border-[#d2ddd3] focus:ring-2 focus:ring-[#123d32] focus:outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-2.5 border-t border-[#e1ebe1]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingGoalData(null);
                  }}
                  className="h-10 px-4 rounded-full bg-[#f2f6f2] text-[#505d54] font-bold text-xs hover:bg-[#e6eee6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-full bg-[#123d32] hover:bg-[#00261e] text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  {editingGoalData ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {goalToDelete && (
        <div
          className="fixed inset-0 z-50 bg-[#00261e]/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setGoalToDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 border border-[#e1ebe1]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-2xl bg-[#fee2e2] text-[#b34045] flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#00261e]">
                Delete "{goalToDelete.title}"?
              </h3>
              <p className="text-xs text-[#69746d] mt-1 leading-relaxed">
                Are you sure you want to remove this savings goal? Any logged deposits will be
                cleared. This action cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setGoalToDelete(null)}
                className="h-10 px-4 rounded-full bg-[#f2f6f2] text-[#505d54] font-bold text-xs hover:bg-[#e6eee6] transition-colors"
              >
                Keep Goal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-10 px-5 rounded-full bg-[#b34045] hover:bg-[#912d31] text-white font-bold text-xs shadow-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
