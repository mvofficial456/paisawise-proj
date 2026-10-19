import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sliders,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { PaisaWiseLogo } from './PaisaWiseLogo.tsx';

interface AppHeaderProps {
  pageTitle?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ pageTitle }) => {
  const {
    profile,
    updateProfile,
    setIsAddModalOpen,
    runway,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    computedCategories,
  } = useFinance();
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(2026);

  // Derive route label
  const getRouteLabel = () => {
    if (pageTitle) return pageTitle;
    switch (location.pathname) {
      case '/dashboard':
        return 'Home Dashboard';
      case '/transactions':
        return 'Transactions Ledger';
      case '/budgets':
        return 'Budgets & Survival Meter';
      case '/insights':
        return 'Insights & Habits';
      case '/goals':
        return 'Savings Goals';
      case '/settings':
        return 'Settings & Preferences';
      case '/onboarding':
        return 'Student Onboarding';
      case '/landing':
        return 'Welcome to PaisaWise';
      default:
        return 'Home Dashboard';
    }
  };

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

  const notifications = useMemo(() => {
    const list = [];
    const over = computedCategories.find((c) => c.allocated > 0 && c.spent > c.allocated);
    if (over) {
      list.push({
        id: 'notif-over',
        title: `${over.name} Limit Exceeded`,
        message: `Spent ₹${over.spent.toLocaleString('en-IN')} against ₹${over.allocated.toLocaleString('en-IN')} envelope.`,
        type: 'warning',
        time: 'Active',
      });
    }

    const approaching = computedCategories.find(
      (c) => c.allocated > 0 && c.spent <= c.allocated && c.spent / c.allocated >= 0.8
    );
    if (approaching) {
      list.push({
        id: 'notif-approaching',
        title: `${approaching.name} Approaching Limit`,
        message: `${Math.round((approaching.spent / approaching.allocated) * 100)}% of envelope used (₹${approaching.spent}/₹${approaching.allocated}).`,
        type: 'warning',
        time: 'Today',
      });
    }

    list.push({
      id: 'notif-runway',
      title: 'Daily Spending Runway',
      message: `₹${runway.safeDailySpend.toLocaleString('en-IN')}/day safe pacing (${runway.statusLabel || 'On track'}).`,
      type: 'success',
      time: 'Live',
    });

    return list;
  }, [computedCategories, runway]);

  return (
    <>
      <header className="fixed top-0 inset-x-0 md:left-72 z-40 h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-[#E9E4F2] shadow-[0_1px_6px_rgba(76,52,120,0.03)] px-4 md:px-8 flex items-center justify-between">
        {/* Left: Mobile Brand & Title / Desktop Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Logo */}
          <div
            onClick={() => navigate('/dashboard')}
            className="flex md:hidden items-center cursor-pointer shrink-0"
          >
            <PaisaWiseLogo variant="compact" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm md:text-base text-[#29233A] tracking-tight truncate">
                {getRouteLabel()}
              </span>
              <button
                type="button"
                onClick={() => {
                  const currentYearFromSelected = parseInt(selectedMonth.split('-')[0], 10);
                  if (!isNaN(currentYearFromSelected)) {
                    setPickerYear(currentYearFromSelected);
                  }
                  setShowMonthDropdown(!showMonthDropdown);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C3478] hover:bg-[#3B275F] text-white text-xs font-black transition-all shadow-sm border border-[#3B275F] active:scale-95 cursor-pointer"
                title="Change Academic Financial Month & Year"
              >
                <Calendar className="w-3.5 h-3.5 text-[#42CBA5]" />
                <span className="font-extrabold text-white tracking-wide">{activeMonthLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#42CBA5]" />
              </button>
            </div>
            <span className="text-[11px] md:text-xs text-[#777187] truncate">
              Campus Day {profile.campusDay} • {profile.semester} ({profile.major})
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Runway Simulator quick jump (Desktop) */}
          <button
            type="button"
            onClick={() => navigate('/budgets')}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5F8F1] hover:bg-[#d5f3e9] text-[#186851] border border-[#b8ecd9] text-xs font-bold transition-all shadow-2xs"
            title="Open Survival Runway Simulator"
          >
            <Sliders className="w-3.5 h-3.5 text-[#42CBA5]" />
            <span>Runway: ₹{runway.safeDailySpend}/d</span>
          </button>

          {/* Quick Record Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 md:h-10 px-3.5 md:px-4 rounded-xl bg-[#4C3478] hover:bg-[#3B275F] text-white text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            aria-label="Add Expense"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white hover:bg-[#EDE7FF] border border-[#E9E4F2] flex items-center justify-center text-[#29233A] transition-colors shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-[#4C3478]" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E56B75] ring-2 ring-white"></span>
            </button>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl bg-white shadow-xl border border-[#E9E4F2] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#E9E4F2] px-1">
                  <span className="font-bold text-xs text-[#29233A] uppercase tracking-wider">Campus Alerts</span>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-[#777187] hover:text-[#29233A] rounded-lg transition-colors"
                    aria-label="Close Alerts"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-[#E9E4F2] max-h-64 overflow-y-auto pt-1">
                  {notifications.map((n: { id: string; title: string; message: string; type: string; time: string }) => (
                    <div key={n.id} className="py-2.5 px-2 hover:bg-[#F7F5FC] rounded-xl transition-colors">
                      <div className="flex items-start gap-2">
                        {n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-[#D99B00] shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[#42CBA5] shrink-0 mt-0.5" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[#29233A] leading-snug">{n.title}</span>
                          <span className="text-[11px] text-[#777187] leading-tight mt-0.5">{n.message}</span>
                          <span className="text-[10px] text-[#777187] mt-1">{n.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu Avatar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full ring-2 ring-[#4C3478]/20 overflow-hidden cursor-pointer"
              aria-label="Profile Menu"
            >
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#4C3478] text-white flex items-center justify-center font-bold text-xs">
                  {profile.name.charAt(0)}
                </div>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-white shadow-xl border border-[#E9E4F2] p-3 z-50">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#E9E4F2]">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[#4C3478] text-white flex items-center justify-center font-bold text-xs">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{profile.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-[#29233A] truncate">{profile.name}</span>
                    <span className="text-[11px] text-[#777187] truncate">{profile.major} • {profile.semester}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#777187] hover:bg-[#EDE7FF] hover:text-[#4C3478] transition-colors"
                  >
                    Settings &amp; Preferences
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/onboarding');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#777187] hover:bg-[#EDE7FF] hover:text-[#4C3478] transition-colors"
                  >
                    Rerun Onboarding
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Month & Year Picker Modal */}
      {showMonthDropdown && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowMonthDropdown(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-[#E9E4F2]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E4F2]">
              <div>
                <span className="font-extrabold text-sm text-[#29233A] block">Academic Financial Period</span>
                <span className="text-[11px] text-[#777187]">Switch month or year to track budgets &amp; runway</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMonthDropdown(false)}
                className="text-[#777187] hover:text-[#29233A] p-1.5 rounded-xl hover:bg-[#F7F5FC] transition-colors"
                aria-label="Close Month Selector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Year Selector */}
            <div className="flex items-center justify-between my-3 px-2 py-1.5 rounded-2xl bg-[#F7F5FC] border border-[#E9E4F2]">
              <button
                type="button"
                onClick={() => setPickerYear((y) => Math.max(2023, y - 1))}
                className="p-1 rounded-lg hover:bg-white text-[#4C3478] transition-colors cursor-pointer"
                title="Previous Year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                {[2025, 2026, 2027].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setPickerYear(yr)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      pickerYear === yr
                        ? 'bg-[#4C3478] text-white shadow-xs'
                        : 'text-[#777187] hover:text-[#29233A] hover:bg-white/80'
                    }`}
                  >
                    {yr}
                    {yr === 2026 && <span className="ml-1 text-[9px] text-[#42CBA5]">● Current</span>}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPickerYear((y) => Math.min(2030, y + 1))}
                className="p-1 rounded-lg hover:bg-white text-[#4C3478] transition-colors cursor-pointer"
                title="Next Year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 12-Month Grid for Selected Year */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { name: 'January', short: 'Jan', num: '01' },
                { name: 'February', short: 'Feb', num: '02' },
                { name: 'March', short: 'Mar', num: '03' },
                { name: 'April', short: 'Apr', num: '04' },
                { name: 'May', short: 'May', num: '05' },
                { name: 'June', short: 'Jun', num: '06' },
                { name: 'July', short: 'Jul', num: '07' },
                { name: 'August', short: 'Aug', num: '08' },
                { name: 'September', short: 'Sep', num: '09' },
                { name: 'October', short: 'Oct', num: '10' },
                { name: 'November', short: 'Nov', num: '11' },
                { name: 'December', short: 'Dec', num: '12' },
              ].map((m) => {
                const targetKey = `${pickerYear}-${m.num}`;
                const isSelected = selectedMonth === targetKey;
                const isCurrentRealMonth = pickerYear === 2026 && m.num === '10';

                return (
                  <button
                    key={targetKey}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(targetKey);
                      updateProfile({ monthLabel: `${m.name} ${pickerYear}` });
                      setShowMonthDropdown(false);
                    }}
                    className={`px-2.5 py-2.5 rounded-2xl text-xs font-bold text-center transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                      isSelected
                        ? 'bg-[#4C3478] text-white shadow-sm ring-2 ring-[#42CBA5]'
                        : isCurrentRealMonth
                        ? 'bg-[#E5F8F1] text-[#004D36] border border-[#A3E8D0] hover:bg-[#d4f4e7]'
                        : 'bg-[#F7F5FC] text-[#554D68] hover:bg-[#EDE7FF] hover:text-[#4C3478]'
                    }`}
                  >
                    <span>{m.short}</span>
                    <span className="text-[10px] opacity-75 font-normal">{pickerYear}</span>
                    {isCurrentRealMonth && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#18A074] absolute top-1.5 right-1.5" title="Current Real Month"></span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#42CBA5] absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div className="pt-3 border-t border-[#E9E4F2] mt-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#777187]">Quick jump:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth('2026-10');
                    updateProfile({ monthLabel: 'October 2026' });
                    setPickerYear(2026);
                    setShowMonthDropdown(false);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#E5F8F1] text-[#004D36] hover:bg-[#cbeede] transition-colors cursor-pointer"
                >
                  Oct 2026 (Live)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth('2026-11');
                    updateProfile({ monthLabel: 'November 2026' });
                    setPickerYear(2026);
                    setShowMonthDropdown(false);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F7F5FC] text-[#4C3478] hover:bg-[#EDE7FF] transition-colors cursor-pointer"
                >
                  Nov 2026
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
