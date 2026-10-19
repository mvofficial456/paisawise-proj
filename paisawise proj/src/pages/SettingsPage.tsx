import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Wallet,
  Sliders,
  Bell,
  Database,
  RotateCcw,
  Download,
  CheckCircle2,
  Save,
  Shield,
  GraduationCap,
  Moon,
  Sun,
  Monitor,
  AlertTriangle,
  Trash2,
  Calendar,
  FileSpreadsheet,
  Lock,
  Sparkles,
  Check,
  ArrowRight,
  Info,
  Layers,
  ChevronDown,
  X,
  RefreshCw,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';
import { ThemePreference } from '../types/finance.ts';
import { exportTransactionsToCSV } from '../utils/csvExport.ts';
import { AutoDistributeModal } from '../components/common/AutoDistributeModal.tsx';

// Pre-defined student avatar options
const AVATAR_PRESETS = [
  {
    id: 'aarav',
    label: 'Aarav (Default)',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnzqh8QrA-hxdl9AknWUA9hBcyqUcrEdxfK0ld3WEksF6wpY1fsSOkIYFj1_qL99PogCJSmu8R3-zl82Foh_FgSzmB7rz4iTXoa1Dexe4wcSlbLk_BodCv9y-3vaCF9gP0-3nuUzM8sgyb49MLK5ZNc0PN6NL1_7GAJcaLMVTdIZB3d6a5hvJmMaPJ5Txcm1w0e9qmjZx43OIZWfhLuAiF7IPvzl40y4NFVzMwnT-xtfpEbBS6M18',
  },
  {
    id: 'student-tech',
    label: 'Campus Coder',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'student-lib',
    label: 'Library Scholar',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'student-art',
    label: 'Design Fellow',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
  },
];

type SettingsTab = 'profile' | 'allowance' | 'budgets' | 'appearance' | 'notifications' | 'data';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    updateProfile,
    resetToDemoData,
    clearAllData,
    autoBalanceEnabled,
    setAutoBalanceEnabled,
    transactions,
    categories,
    updateCategoryBudget,
    updateMultipleCategoryBudgets,
    goals,
    theme,
    setTheme,
    userPreferences,
    updateUserPreferences,
    totalBudget,
    availableBalance,
    runway,
    daysLeft,
  } = useFinance();

  // Active navigation section tab
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile section form state
  const [name, setName] = useState(profile.name);
  const [semester, setSemester] = useState(profile.semester);
  const [major, setMajor] = useState(profile.major);
  const [college, setCollege] = useState(profile.college);
  const [campusDay, setCampusDay] = useState(profile.campusDay);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);

  // Allowance & cash flow form state
  const [monthlyAllowance, setMonthlyAllowance] = useState<number>(profile.monthlyAllowance);
  const [allowanceFrequency, setAllowanceFrequency] = useState<'monthly' | 'weekly' | 'custom'>(
    profile.allowanceFrequency || 'monthly'
  );
  const [nextAllowanceDate, setNextAllowanceDate] = useState<string>(
    profile.nextAllowanceDate || '2026-11-01'
  );
  const [fixedDues, setFixedDues] = useState<number>(profile.fixedDues);
  const [safetyBuffer, setSafetyBufferInput] = useState<number>(profile.safetyBuffer || 0);

  // Budget preferences state
  const [alertThreshold, setAlertThreshold] = useState<number>(
    userPreferences?.defaultAlertThreshold || 80
  );
  const [monthStartPref, setMonthStartPref] = useState<'calendar' | 'allowance_day' | 'weekly'>(
    userPreferences?.monthStartPreference || 'calendar'
  );
  const [categoryEdits, setCategoryEdits] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.allocated;
    });
    return map;
  });
  const [isAutoDistributeOpen, setIsAutoDistributeOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState({
    budgetThresholdAlert: userPreferences?.notifications?.budgetThresholdAlert ?? true,
    overBudgetAlert: userPreferences?.notifications?.overBudgetAlert ?? true,
    allowanceReminder: userPreferences?.notifications?.allowanceReminder ?? true,
    savingsMilestoneAlert: userPreferences?.notifications?.savingsMilestoneAlert ?? true,
  });

  // UI state & modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState('');
  const [financialValidationError, setFinancialValidationError] = useState<string | null>(null);

  // Display toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Compute spendable allowance & safe daily spend live preview
  const livePreview = useMemo(() => {
    const allowanceNum = Number(monthlyAllowance) || 0;
    const duesNum = Number(fixedDues) || 0;
    const bufferNum = Number(safetyBuffer) || 0;
    const spendable = Math.max(0, allowanceNum - duesNum - bufferNum);
    const effectiveDays = Math.max(1, daysLeft || 15);
    const safeDaily = Math.round(spendable / effectiveDays);

    let status: 'safe' | 'caution' | 'critical' = 'safe';
    if (spendable <= 0 || safeDaily < 100) {
      status = 'critical';
    } else if (safeDaily < 250) {
      status = 'caution';
    }

    return {
      spendable,
      safeDaily,
      status,
      effectiveDays,
      isExcessiveReserved: duesNum + bufferNum >= allowanceNum && allowanceNum > 0,
    };
  }, [monthlyAllowance, fixedDues, safetyBuffer, daysLeft]);

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Student name cannot be empty');
      return;
    }
    updateProfile({
      name: name.trim(),
      semester: semester.trim(),
      major: major.trim(),
      college: college.trim(),
      campusDay: Number(campusDay) || 1,
      avatarUrl: avatarUrl.trim() || undefined,
    });
    showToast('Campus profile identity saved successfully!');
  };

  // Handle Allowance & Cash Flow Save
  const handleSaveAllowance = (e: React.FormEvent) => {
    e.preventDefault();
    const allowanceNum = Number(monthlyAllowance);
    const duesNum = Number(fixedDues);
    const bufferNum = Number(safetyBuffer);

    if (isNaN(allowanceNum) || allowanceNum <= 0) {
      setFinancialValidationError('Please enter a valid monthly allowance greater than ₹0.');
      return;
    }
    if (isNaN(duesNum) || duesNum < 0) {
      setFinancialValidationError('Fixed campus dues cannot be negative.');
      return;
    }
    if (isNaN(bufferNum) || bufferNum < 0) {
      setFinancialValidationError('Safety emergency buffer cannot be negative.');
      return;
    }
    if (duesNum + bufferNum > allowanceNum) {
      setFinancialValidationError(
        'Fixed dues and safety buffer combined exceed your total allowance. Please adjust amounts.'
      );
      return;
    }

    setFinancialValidationError(null);
    updateProfile({
      monthlyAllowance: allowanceNum,
      fixedDues: duesNum,
      safetyBuffer: bufferNum,
      allowanceFrequency,
      nextAllowanceDate,
    });
    showToast('Allowance and cash flow parameters updated! Survival meter recalculated.');
  };

  // Handle Category Budget Allocation Changes in Settings
  const handleSaveCategoryBudgets = () => {
    updateMultipleCategoryBudgets(categoryEdits);
    updateUserPreferences({
      defaultAlertThreshold: alertThreshold,
      monthStartPreference: monthStartPref,
    });
    showToast('Default category envelopes and thresholds updated!');
  };

  // Handle Notification Toggles Save
  const handleToggleNotification = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    updateUserPreferences({
      notifications: updated,
    });
    showToast(`Updated notification preference: ${key}`);
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      showToast('No transactions recorded yet to export.');
      return;
    }
    exportTransactionsToCSV(transactions);
    showToast(`Exported ${transactions.length} transactions as RFC 4180 CSV!`);
  };

  // Handle Full JSON Backup
  const handleExportJSON = () => {
    const backupData = {
      appName: 'PaisaWise',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile,
      categories,
      goals,
      transactions,
      userPreferences,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PaisaWise_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Downloaded complete JSON data vault backup!');
  };

  // Handle Reset to Demo
  const handleConfirmResetDemo = () => {
    resetToDemoData();
    setShowResetConfirmModal(false);
    // Refresh local form inputs
    setName('Aarav Sharma');
    setSemester('Semester 3');
    setMajor('CSE');
    setCollege('Delhi Technological University');
    setCampusDay(42);
    setMonthlyAllowance(10000);
    setFixedDues(0);
    setSafetyBufferInput(0);
    showToast('Restored Aarav Sharma demo dataset (October 2026)!');
  };

  // Handle Clear All Data
  const handleConfirmClearData = () => {
    clearAllData();
    setShowClearConfirmModal(false);
    setClearConfirmationText('');
    setCategoryEdits({});
    showToast('Cleared all transactions, budgets, and goals from local storage.');
  };

  // Student Initials fallback
  const studentInitials = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return 'PW';
    const parts = trimmed.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  // Total allocated from category inputs
  const sumAllocatedCategories = useMemo(() => {
    return Object.values(categoryEdits).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [categoryEdits]);

  // Tab definitions
  const tabs: { id: SettingsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'profile', label: 'Student Profile', icon: User },
    { id: 'allowance', label: 'Allowance & Cash Flow', icon: Wallet },
    { id: 'budgets', label: 'Budget Envelopes', icon: Sliders },
    { id: 'appearance', label: 'Appearance & Theme', icon: Sun },
    { id: 'notifications', label: 'Alerts & Reminders', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-16">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 md:right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#123d32] text-white shadow-xl border border-[#83f9c5]/30 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-[#83f9c5] shrink-0" />
          <span className="text-xs md:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-[#00261e] tracking-tight">
              Settings &amp; Preferences
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#ecf6ed] text-[#006c4c] text-[11px] font-bold border border-[#bfecdc]">
              v1.0 Local Vault
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#69746d]">
            Personalize campus identity, monthly pocket money parameters, envelope rules, and local storage.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-[#ecf6ed] text-[#006c4c] text-xs font-bold border border-[#e1ebe1] shadow-xs flex items-center gap-1.5 transition-colors"
            title="Export all transactions as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setShowResetConfirmModal(true)}
            className="h-9 px-3 rounded-xl bg-white hover:bg-[#ffdad6]/40 text-[#ba1a1a] text-xs font-semibold border border-[#e1ebe1] shadow-xs flex items-center gap-1.5 transition-colors"
            title="Reset to default demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Demo Reset</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#e1ebe1]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-10 px-4 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-[#123d32] text-white shadow-xs'
                  : 'text-[#414845] hover:bg-white hover:text-[#00261e]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#83f9c5]' : 'text-[#69746d]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
            {/* Identity & Avatar Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e1ebe1] flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e1ebe1]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ecf6ed] flex items-center justify-center text-[#006c4c] shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#00261e]">Student Identity &amp; Avatar</h2>
                    <p className="text-xs text-[#69746d]">How you appear across your campus ledger and survival meter</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#ecf6ed] text-[#006c4c] text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>On-Device Only</span>
                </div>
              </div>

              {/* Avatar Chooser / Initials Preview */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
                {/* Active Avatar Bubble */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-4 ring-white shadow-md bg-[#123d32] text-white flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarUrl('')}
                      />
                    ) : (
                      <span className="text-2xl font-black tracking-wider text-[#83f9c5]">
                        {studentInitials}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#123d32] text-white text-[10px] font-bold shadow-xs">
                    {avatarUrl ? 'Photo' : 'Initials'}
                  </span>
                </div>

                {/* Avatar Presets & Option to Use Initials */}
                <div className="flex-1 flex flex-col gap-3 min-w-0 text-center sm:text-left">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-[#00261e]">Profile Picture or Initials</span>
                    <span className="text-xs text-[#69746d]">
                      Choose a student avatar preset, enter a custom URL, or switch to your student initials.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                          avatarUrl === preset.url
                            ? 'bg-[#123d32] text-white border-[#123d32] shadow-xs'
                            : 'bg-white text-[#414845] border-[#e1ebe1] hover:bg-[#ecf6ed]'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        </div>
                        <span>{preset.label}</span>
                      </button>
                    ))}

                    {/* Use Initials Button */}
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                        !avatarUrl
                          ? 'bg-[#123d32] text-white border-[#123d32] shadow-xs'
                          : 'bg-white text-[#414845] border-[#e1ebe1] hover:bg-[#ecf6ed]'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#006c4c] text-white flex items-center justify-center text-[10px] font-bold">
                        {studentInitials}
                      </span>
                      <span>Use Initials</span>
                    </button>
                  </div>

                  {/* Toggle Custom Image URL */}
                  <div className="pt-1">
                    {!showCustomAvatarInput ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomAvatarInput(true)}
                        className="text-xs font-bold text-[#006c4c] hover:underline inline-flex items-center gap-1"
                      >
                        <span>+ Custom Image URL</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 max-w-md">
                        <input
                          type="url"
                          placeholder="https://example.com/my-photo.jpg"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="flex-1 h-9 px-3 rounded-xl bg-white text-xs border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCustomAvatarInput(false)}
                          className="h-9 px-2.5 rounded-xl bg-[#e1ebe1] text-[#414845] text-xs font-medium hover:bg-[#dbe5dc]"
                        >
                          Hide
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-medium border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  />
                  <span className="text-[11px] text-[#69746d]">Displayed in greeting and reports</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Semester Stage *</label>
                  <input
                    type="text"
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="e.g. Semester 3 / Final Year"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-medium border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  />
                  <span className="text-[11px] text-[#69746d]">Helps contextualize your college cycle</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Major / Branch</label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="e.g. Computer Science Engineering"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-medium border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">College / University Name</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Delhi Technological University"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-medium border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Campus Day Count</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={campusDay}
                    onChange={(e) => setCampusDay(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-medium border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  />
                  <span className="text-[11px] text-[#69746d]">Day number within the current academic semester</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="h-11 px-6 rounded-full bg-[#123d32] hover:bg-[#00261e] text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Save className="w-4 h-4 text-[#83f9c5]" />
                  <span>Save Student Profile</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ALLOWANCE & CASH FLOW */}
      {/* ========================================================================= */}
      {activeTab === 'allowance' && (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleSaveAllowance} className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e1ebe1] flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e1ebe1]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#ecf6ed] flex items-center justify-center text-[#006c4c] shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#00261e]">Allowance &amp; Cash Flow Parameters</h2>
                    <p className="text-xs text-[#69746d]">
                      These financial rules determine your daily safe spending rate and runway
                    </p>
                  </div>
                </div>
              </div>

              {/* Validation alert banner */}
              {financialValidationError && (
                <div className="p-4 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-xs font-semibold text-[#93000a] flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-bold">Input Error:</span>
                    <span>{financialValidationError}</span>
                  </div>
                </div>
              )}

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Monthly Allowance Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Monthly Allowance (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#69746d]">₹</span>
                    <input
                      type="number"
                      required
                      min="500"
                      step="100"
                      value={monthlyAllowance}
                      onChange={(e) => setMonthlyAllowance(Number(e.target.value))}
                      className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-bold border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-[#69746d]">
                    Your primary pocket money or stipend deposited each cycle
                  </span>
                </div>

                {/* Allowance Frequency */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Allowance Frequency</label>
                  <select
                    value={allowanceFrequency}
                    onChange={(e) =>
                      setAllowanceFrequency(e.target.value as 'monthly' | 'weekly' | 'custom')
                    }
                    className="w-full h-11 px-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-semibold border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                  >
                    <option value="monthly">Monthly (1st of Month)</option>
                    <option value="weekly">Weekly (Every Monday)</option>
                    <option value="custom">Bi-Weekly / Custom Schedule</option>
                  </select>
                  <span className="text-[11px] text-[#69746d]">Controls pacing and calculation period</span>
                </div>

                {/* Next Scheduled Allowance Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Next Allowance Arrival Date *</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={nextAllowanceDate}
                      onChange={(e) => setNextAllowanceDate(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-medium border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-[#69746d]">
                    Used to compute exact days remaining ({livePreview.effectiveDays} days left)
                  </span>
                </div>

                {/* Locked Fixed Campus Dues */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Locked Fixed Campus Dues (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#69746d]">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={fixedDues}
                      onChange={(e) => setFixedDues(Number(e.target.value))}
                      className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-bold border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-[#69746d]">
                    Hostel, PG rent, mess fees, Wi-Fi split (locked before daily spend)
                  </span>
                </div>

                {/* Emergency Safety Buffer */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414845]">Emergency Safety Buffer (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#69746d]">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={safetyBuffer}
                      onChange={(e) => setSafetyBufferInput(Number(e.target.value))}
                      className="w-full h-11 pl-8 pr-3.5 rounded-xl bg-[#f2fcf2] text-sm text-[#151e18] font-bold border border-[#e1ebe1] focus:ring-2 focus:ring-[#123d32] focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-[#69746d]">
                    Untouchable reserve for medical emergencies or exam fees
                  </span>
                </div>
              </div>

              {/* Live Survival Meter & Runway Impact Calculator */}
              <div className="p-5 rounded-2xl bg-[#ecf6ed] border border-[#bfecdc] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#006c4c]" />
                    <span className="text-xs font-bold text-[#00261e] uppercase tracking-wider">
                      Live Survival Meter Impact
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      livePreview.status === 'safe'
                        ? 'bg-[#83f9c5]/40 text-[#002114] border-[#83f9c5]'
                        : livePreview.status === 'caution'
                        ? 'bg-[#ffdf9e]/40 text-[#473300] border-[#ebc164]'
                        : 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]'
                    }`}
                  >
                    Runway: {livePreview.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
                  <div className="p-3 rounded-xl bg-white border border-[#e1ebe1]">
                    <span className="text-[10px] font-bold text-[#69746d] block">Total Inflow</span>
                    <span className="text-sm md:text-base font-extrabold text-[#00261e]">
                      ₹{monthlyAllowance.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#e1ebe1]">
                    <span className="text-[10px] font-bold text-[#69746d] block">Reserved (Dues + Buffer)</span>
                    <span className="text-sm md:text-base font-extrabold text-[#ba1a1a]">
                      -₹{(fixedDues + safetyBuffer).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[#e1ebe1]">
                    <span className="text-[10px] font-bold text-[#69746d] block">Spendable Allowance</span>
                    <span className="text-sm md:text-base font-extrabold text-[#006c4c]">
                      ₹{livePreview.spendable.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#123d32] text-white">
                    <span className="text-[10px] font-medium text-[#a4d0c0] block">Safe Daily Spend</span>
                    <span className="text-sm md:text-base font-black text-[#83f9c5]">
                      ₹{livePreview.safeDaily.toLocaleString('en-IN')}/day
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#414845] leading-relaxed">
                  Formula applied: <code className="font-mono bg-white px-1.5 py-0.5 rounded text-[#00261e]">(Allowance ₹{monthlyAllowance} - Fixed Dues ₹{fixedDues} - Buffer ₹{safetyBuffer}) ÷ {livePreview.effectiveDays} days = ₹{livePreview.safeDaily}/day</code>
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="h-11 px-6 rounded-full bg-[#123d32] hover:bg-[#00261e] text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Save className="w-4 h-4 text-[#83f9c5]" />
                  <span>Update Cash Flow &amp; Survival Runway</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: BUDGET PREFERENCES */}
      {/* ========================================================================= */}
      {activeTab === 'budgets' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e1ebe1] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e1ebe1]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ecf6ed] flex items-center justify-center text-[#006c4c] shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#00261e]">Category Budget Envelopes &amp; Limits</h2>
                  <p className="text-xs text-[#69746d]">
                    Configure default envelope limits and warning threshold triggers
                  </p>
                </div>
              </div>

              {/* Auto-distribute trigger button */}
              <button
                type="button"
                onClick={() => setIsAutoDistributeOpen(true)}
                className="h-9 px-3.5 rounded-full bg-[#ecf6ed] hover:bg-[#bfecdc] text-[#006c4c] font-bold text-xs flex items-center gap-1.5 border border-[#bfecdc] transition-all"
              >
                <Coins className="w-3.5 h-3.5 text-[#006c4c]" />
                <span>Auto-Distribute Presets</span>
              </button>
            </div>

            {/* Threshold & Month Start Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
              {/* Alert Threshold Selector */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#00261e]">Warning Alert Threshold</label>
                  <span className="text-xs font-extrabold text-[#006c4c] px-2 py-0.5 rounded-md bg-white border border-[#e1ebe1]">
                    {alertThreshold}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[70, 75, 80, 85, 90].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAlertThreshold(val)}
                      className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-all ${
                        alertThreshold === val
                          ? 'bg-[#123d32] text-white border-[#123d32]'
                          : 'bg-white text-[#414845] border-[#e1ebe1] hover:bg-[#ecf6ed]'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-[#69746d]">
                  Category cards flag in warning amber once spending crosses {alertThreshold}% of limit.
                </span>
              </div>

              {/* Month Start Preference */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#00261e]">Academic Cycle Start Day</label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'calendar', label: '1st of Month' },
                    { id: 'allowance_day', label: 'Allowance Day' },
                    { id: 'weekly', label: 'Weekly (Mon)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMonthStartPref(p.id as any)}
                      className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-all ${
                        monthStartPref === p.id
                          ? 'bg-[#123d32] text-white border-[#123d32]'
                          : 'bg-white text-[#414845] border-[#e1ebe1] hover:bg-[#ecf6ed]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-[#69746d]">
                  Resets monthly budgets and report cycles according to your preferred timeline.
                </span>
              </div>
            </div>

            {/* Category Budgets Grid */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#414845] uppercase tracking-wider">
                  Default Envelope Allocations ({categories.length} Categories)
                </span>
                <span className="text-xs font-bold text-[#00261e]">
                  Allocated: ₹{sumAllocatedCategories.toLocaleString('en-IN')} / Allowance: ₹
                  {profile.monthlyAllowance.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#e1ebe1] shadow-2xs flex flex-col gap-2 hover:border-[#bfecdc] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#00261e] truncate">{cat.name}</span>
                      <span className="text-[10px] text-[#69746d] font-semibold">
                        Spent: ₹{cat.spent || 0}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#69746d]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={categoryEdits[cat.id] ?? cat.allocated}
                        onChange={(e) =>
                          setCategoryEdits({
                            ...categoryEdits,
                            [cat.id]: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-full h-9 pl-7 pr-3 rounded-lg bg-[#f2fcf2] text-xs font-bold text-[#151e18] border border-[#e1ebe1] focus:ring-1 focus:ring-[#123d32] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => navigate('/budgets')}
                className="text-xs font-bold text-[#006c4c] hover:underline flex items-center gap-1"
              >
                <span>View Full Budgets &amp; Runway Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleSaveCategoryBudgets}
                className="h-11 px-6 rounded-full bg-[#123d32] hover:bg-[#00261e] text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Save className="w-4 h-4 text-[#83f9c5]" />
                <span>Save Budget Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: APPEARANCE & THEME */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e1ebe1] flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#e1ebe1]">
              <div className="w-10 h-10 rounded-2xl bg-[#ecf6ed] flex items-center justify-center text-[#006c4c] shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#00261e]">Appearance &amp; Theme</h2>
                <p className="text-xs text-[#69746d]">
                  Customize PaisaWise visual styling for late-night study sessions or bright classrooms
                </p>
              </div>
            </div>

            {/* Theme Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Theme Card */}
              <div
                onClick={() => {
                  setTheme('light');
                  showToast('Switched to Light theme');
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer flex flex-col gap-3 transition-all ${
                  theme === 'light'
                    ? 'border-[#006c4c] bg-[#ecf6ed] shadow-sm ring-2 ring-[#006c4c]/20'
                    : 'border-[#e1ebe1] bg-white hover:border-[#bfecdc]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#e1ebe1] flex items-center justify-center text-[#006c4c]">
                    <Sun className="w-5 h-5" />
                  </div>
                  {theme === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-[#006c4c] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-3" />
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#00261e]">Light Theme</span>
                  <span className="text-xs text-[#69746d]">
                    Lavender &amp; Mint 2.0 with soft lavender canvas, white cards, and royal violet accents
                  </span>
                </div>
              </div>

              {/* Dark Theme Card */}
              <div
                onClick={() => {
                  setTheme('dark');
                  showToast('Switched to Dark theme');
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer flex flex-col gap-3 transition-all ${
                  theme === 'dark'
                    ? 'border-[#006c4c] bg-[#ecf6ed] shadow-sm ring-2 ring-[#006c4c]/20'
                    : 'border-[#e1ebe1] bg-white hover:border-[#bfecdc]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#121f1b] text-[#83f9c5] border border-[#223830] flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                  </div>
                  {theme === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-[#006c4c] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-3" />
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#00261e]">Dark Theme</span>
                  <span className="text-xs text-[#69746d]">
                    Deep violet obsidian &amp; mint surfaces for low-light study sessions and OLED battery saving
                  </span>
                </div>
              </div>

              {/* System Preference Card */}
              <div
                onClick={() => {
                  setTheme('system');
                  showToast('Theme set to follow system preference');
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer flex flex-col gap-3 transition-all ${
                  theme === 'system'
                    ? 'border-[#006c4c] bg-[#ecf6ed] shadow-sm ring-2 ring-[#006c4c]/20'
                    : 'border-[#e1ebe1] bg-white hover:border-[#bfecdc]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#f2fcf2] border border-[#e1ebe1] flex items-center justify-center text-[#414845]">
                    <Monitor className="w-5 h-5" />
                  </div>
                  {theme === 'system' && (
                    <span className="w-5 h-5 rounded-full bg-[#006c4c] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-3" />
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#00261e]">System Match</span>
                  <span className="text-xs text-[#69746d]">
                    Automatically synchronizes with your device OS dark or light mode
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex items-center gap-3">
              <Info className="w-4 h-4 text-[#006c4c] shrink-0" />
              <span className="text-xs text-[#414845]">
                Theme preferences apply instantly across all dashboard views, modals, ledgers, and charts.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: NOTIFICATIONS & REMINDERS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e1ebe1] flex flex-col gap-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#e1ebe1]">
              <div className="w-10 h-10 rounded-2xl bg-[#ecf6ed] flex items-center justify-center text-[#006c4c] shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#00261e]">Notification &amp; Alert Preferences</h2>
                <p className="text-xs text-[#69746d]">
                  Configure campus survival alerts, threshold warnings, and deposit milestones
                </p>
              </div>
            </div>

            <div className="flex flex-col divide-y divide-[#e1ebe1]">
              {/* Approaching Budget Alert */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-[#00261e]">
                    Budget Threshold Warnings ({alertThreshold}%)
                  </span>
                  <span className="text-xs text-[#69746d]">
                    Flag categories in warning amber once expenses reach {alertThreshold}% of allocated envelope
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('budgetThresholdAlert')}
                  className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                    notifications.budgetThresholdAlert ? 'bg-[#123d32] justify-end' : 'bg-[#dbe5dc] justify-start'
                  }`}
                  role="switch"
                  aria-checked={notifications.budgetThresholdAlert}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-[10px] text-[#006c4c]">
                    {notifications.budgetThresholdAlert ? '✓' : ''}
                  </span>
                </button>
              </div>

              {/* Over-Budget Alert */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-[#00261e]">Over-Budget Alerts</span>
                  <span className="text-xs text-[#69746d]">
                    Display distinct coral alert state and overspend amount when limits are exceeded
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('overBudgetAlert')}
                  className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                    notifications.overBudgetAlert ? 'bg-[#123d32] justify-end' : 'bg-[#dbe5dc] justify-start'
                  }`}
                  role="switch"
                  aria-checked={notifications.overBudgetAlert}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-[10px] text-[#006c4c]">
                    {notifications.overBudgetAlert ? '✓' : ''}
                  </span>
                </button>
              </div>

              {/* Allowance Arrival Reminder */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-[#00261e]">Allowance Arrival Reminders</span>
                  <span className="text-xs text-[#69746d]">
                    Show in-app countdown banner 2 days before your scheduled allowance deposit ({nextAllowanceDate})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('allowanceReminder')}
                  className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                    notifications.allowanceReminder ? 'bg-[#123d32] justify-end' : 'bg-[#dbe5dc] justify-start'
                  }`}
                  role="switch"
                  aria-checked={notifications.allowanceReminder}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-[10px] text-[#006c4c]">
                    {notifications.allowanceReminder ? '✓' : ''}
                  </span>
                </button>
              </div>

              {/* Savings Milestone Reminders */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-[#00261e]">Savings Milestone Celebrations</span>
                  <span className="text-xs text-[#69746d]">
                    Acknowledge progress when tracked goals (Goa Trip, Laptop) hit 50% or 100% completion
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleNotification('savingsMilestoneAlert')}
                  className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                    notifications.savingsMilestoneAlert ? 'bg-[#123d32] justify-end' : 'bg-[#dbe5dc] justify-start'
                  }`}
                  role="switch"
                  aria-checked={notifications.savingsMilestoneAlert}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-[10px] text-[#006c4c]">
                    {notifications.savingsMilestoneAlert ? '✓' : ''}
                  </span>
                </button>
              </div>

              {/* Smart Auto-Balance Engine */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#ecf6ed] flex items-center justify-center text-[#006c4c] shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-[#00261e]">Smart Auto-Balance Engine</span>
                    <span className="text-xs text-[#69746d]">
                      Automatically propose shuffling surplus funds from healthy envelopes to cover deficits
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoBalanceEnabled(!autoBalanceEnabled)}
                  className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                    autoBalanceEnabled ? 'bg-[#123d32] justify-end' : 'bg-[#dbe5dc] justify-start'
                  }`}
                  role="switch"
                  aria-checked={autoBalanceEnabled}
                >
                  <span className="w-6 h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-[10px] text-[#006c4c]">
                    {autoBalanceEnabled ? '✓' : ''}
                  </span>
                </button>
              </div>
            </div>

            {/* Privacy Disclaimer Card */}
            <div className="p-4 rounded-2xl bg-[#ecf6ed] border border-[#bfecdc] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#006c4c] shrink-0 mt-0.5" />
              <div className="flex flex-col text-xs text-[#414845] leading-relaxed">
                <span className="font-bold text-[#00261e]">No External Push Spam</span>
                <span>
                  All notification toggles govern alerts displayed natively within your PaisaWise in-app notification center and header bell. PaisaWise does not send unsolicited browser push notifications or third-party marketing messages.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: DATA MANAGEMENT & PRIVACY */}
      {/* ========================================================================= */}
      {activeTab === 'data' && (
        <div className="flex flex-col gap-6">
          {/* Storage & Privacy Badge */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e1ebe1] flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e1ebe1]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ecf6ed] flex items-center justify-center text-[#006c4c] shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#00261e]">Data Management &amp; Privacy Vault</h2>
                  <p className="text-xs text-[#69746d]">
                    Full portability, export capabilities, and complete local privacy control
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#ecf6ed] text-[#006c4c] text-xs font-bold border border-[#bfecdc]">
                100% Client-Side
              </span>
            </div>

            {/* Quick Metrics of Local Vault */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
              <div className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
                <span className="text-[10px] font-bold text-[#69746d] block">Transactions Stored</span>
                <span className="text-lg font-black text-[#00261e]">{transactions.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
                <span className="text-[10px] font-bold text-[#69746d] block">Category Envelopes</span>
                <span className="text-lg font-black text-[#00261e]">{categories.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
                <span className="text-[10px] font-bold text-[#69746d] block">Savings Goals</span>
                <span className="text-lg font-black text-[#00261e]">{goals.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
                <span className="text-[10px] font-bold text-[#69746d] block">Storage Engine</span>
                <span className="text-xs font-bold text-[#006c4c] mt-1 block">localStorage Sandbox</span>
              </div>
            </div>

            {/* Privacy Explainer Section */}
            <div className="p-5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#006c4c]" />
                <h3 className="font-bold text-sm text-[#00261e]">What is stored locally?</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#414845]">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#bfecdc] text-[#00261e] flex items-center justify-center shrink-0 font-bold text-[11px]">
                    ✓
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[#00261e]">100% On-Device Browser Memory</span>
                    <span>All transactions, split debts, and envelope goals live solely in your browser's localStorage.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#bfecdc] text-[#00261e] flex items-center justify-center shrink-0 font-bold text-[11px]">
                    ✓
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[#00261e]">Zero Remote Server Sync</span>
                    <span>No external server or database receives your financial records or campus details.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#bfecdc] text-[#00261e] flex items-center justify-center shrink-0 font-bold text-[11px]">
                    ✓
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[#00261e]">No Bank Passwords or PINs</span>
                    <span>PaisaWise operates as a privacy ledger. It never asks for UPI PINs, net banking logins, or cards.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#bfecdc] text-[#00261e] flex items-center justify-center shrink-0 font-bold text-[11px]">
                    ✓
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[#00261e]">Total Portability &amp; Self-Destruct</span>
                    <span>Download your complete ledger anytime in standard CSV/JSON, or wipe data instantly below.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export & Data Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-xs font-bold text-[#414845] uppercase tracking-wider">
                Export &amp; Portability Actions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="h-12 px-4 rounded-2xl bg-[#123d32] hover:bg-[#00261e] text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-98"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#83f9c5]" />
                  <span>Export Transactions as CSV (Excel Compatible)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="h-12 px-4 rounded-2xl bg-[#ecf6ed] hover:bg-[#dbe5dc] text-[#00261e] font-bold text-xs flex items-center justify-center gap-2.5 border border-[#bfecdc] transition-all"
                >
                  <Download className="w-4 h-4 text-[#006c4c]" />
                  <span>Export Full JSON State Backup</span>
                </button>
              </div>
            </div>

            {/* Destructive Actions with Safeguards */}
            <div className="flex flex-col gap-3 pt-4 border-t border-[#e1ebe1]">
              <span className="text-xs font-bold text-[#ba1a1a] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Danger Zone &amp; Data Reset</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  className="h-12 px-4 rounded-2xl bg-[#ffdad6]/40 hover:bg-[#ffdad6] text-[#ba1a1a] font-bold text-xs flex items-center justify-center gap-2 border border-[#ffdad6] transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-[#ba1a1a]" />
                  <span>Restore Demo Dataset (Aarav Sharma)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowClearConfirmModal(true)}
                  className="h-12 px-4 rounded-2xl bg-white hover:bg-[#ffdad6]/60 text-[#ba1a1a] font-bold text-xs flex items-center justify-center gap-2 border border-[#ffdad6] transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-[#ba1a1a]" />
                  <span>Clear All Local Application Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RESET DEMO DATA CONFIRMATION */}
      {/* ========================================================================= */}
      {showResetConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-[#00261e]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowResetConfirmModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-[#e1ebe1] flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] self-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="flex flex-col text-center gap-1.5">
              <h3 className="text-lg font-black text-[#00261e]">Reset to Campus Demo State?</h3>
              <p className="text-xs text-[#69746d] leading-relaxed">
                This will restore Aarav Sharma's sample October 2026 campus transactions, category budgets, and initial savings goals (New Laptop &amp; Goa Trip).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#f2fcf2] text-[11px] text-[#414845] border border-[#e1ebe1]">
              Tip: If you've logged your own transactions, you can export a CSV or JSON backup before proceeding.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 h-11 rounded-xl bg-white text-[#414845] font-bold text-xs border border-[#e1ebe1] hover:bg-[#f2fcf2] transition-colors"
              >
                Keep Current Data
              </button>
              <button
                type="button"
                onClick={handleConfirmResetDemo}
                className="flex-1 h-11 rounded-xl bg-[#123d32] text-white font-bold text-xs hover:bg-[#00261e] shadow-sm transition-all"
              >
                Yes, Restore Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CLEAR ALL LOCAL DATA CONFIRMATION (SAFE 2-STEP) */}
      {/* ========================================================================= */}
      {showClearConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-[#00261e]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowClearConfirmModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-[#ffdad6] flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] self-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="flex flex-col text-center gap-1.5">
              <h3 className="text-lg font-black text-[#93000a]">Permanently Wipe All Data?</h3>
              <p className="text-xs text-[#69746d] leading-relaxed">
                This is a destructive action that will permanently erase all your logged transactions, custom category budgets, and savings goals from your device's browser memory.
              </p>
            </div>

            {/* Type confirmation safeguard */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[#ffdad6]/30 border border-[#ffdad6]">
              <label className="text-[11px] font-bold text-[#93000a]">
                To confirm deletion, please type <span className="font-mono underline">CLEAR</span> below:
              </label>
              <input
                type="text"
                value={clearConfirmationText}
                onChange={(e) => setClearConfirmationText(e.target.value)}
                placeholder="Type CLEAR"
                className="w-full h-10 px-3 rounded-xl bg-white text-xs font-bold text-[#ba1a1a] border border-[#ffdad6] focus:ring-2 focus:ring-[#ba1a1a] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirmModal(false);
                  setClearConfirmationText('');
                }}
                className="flex-1 h-11 rounded-xl bg-white text-[#414845] font-bold text-xs border border-[#e1ebe1] hover:bg-[#f2fcf2] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearConfirmationText.trim().toUpperCase() !== 'CLEAR'}
                onClick={handleConfirmClearData}
                className="flex-1 h-11 rounded-xl bg-[#ba1a1a] disabled:bg-[#ba1a1a]/40 text-white font-bold text-xs hover:bg-[#93000a] disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Permanently Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTO-DISTRIBUTE ALLOWANCE MODAL (PRESETS) */}
      {/* ========================================================================= */}
      <AutoDistributeModal
        isOpen={isAutoDistributeOpen}
        onClose={() => setIsAutoDistributeOpen(false)}
        categories={categories}
        monthlyAllowance={profile?.monthlyAllowance || 10000}
        fixedDues={profile?.fixedDues || 0}
        availableBalance={availableBalance}
        totalBudget={totalBudget}
        onApply={(allocations) => {
          updateMultipleCategoryBudgets(allocations);
          setCategoryEdits((prev) => ({ ...prev, ...allocations }));
          showToast('Applied percentage-based allowance preset to category envelopes!');
        }}
      />
    </div>
  );
};
