import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  PiggyBank,
  Settings,
  MoreVertical,
  Wallet,
  GraduationCap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { PaisaWiseLogo } from './PaisaWiseLogo.tsx';

export const AppSidebar: React.FC = () => {
  const { profile } = useFinance();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/budgets', label: 'Budgets', icon: PieChart },
    { to: '/insights', label: 'Insights & Habits', icon: TrendingUp },
    { to: '/goals', label: 'Savings Goals', icon: PiggyBank },
    { to: '/onboarding', label: 'Campus Setup', icon: GraduationCap },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const isNavActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-white flex-col justify-between py-6 px-4 z-50 shadow-[0_1px_8px_rgba(76,52,120,0.04)] border-r border-[#E9E4F2]">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div
          onClick={() => navigate('/dashboard')}
          className="px-3 cursor-pointer group"
        >
          <PaisaWiseLogo variant="sidebar" className="group-hover:opacity-95 transition-opacity" />
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#4C3478] text-white shadow-xs'
                    : 'text-[#777187] hover:bg-[#EDE7FF] hover:text-[#4C3478]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer Card */}
      <div
        onClick={() => navigate('/settings')}
        className="p-3 rounded-2xl bg-[#F7F5FC] shadow-xs border border-[#E9E4F2] flex items-center justify-between cursor-pointer hover:border-[#8B6FE8]/50 hover:bg-white transition-all"
        title="View Settings"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#4C3478] text-white overflow-hidden shrink-0 flex items-center justify-center font-bold text-sm">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span>{profile.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-[#29233A] truncate">{profile.name}</span>
            <span className="text-xs text-[#777187] truncate">
              {profile.semester} • {profile.major}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Account Settings"
          className="text-[#777187] hover:text-[#29233A] p-1 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
