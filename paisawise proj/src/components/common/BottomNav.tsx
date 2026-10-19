import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  TrendingUp,
  PiggyBank,
  Plus,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';

export const BottomNav: React.FC = () => {
  const { setIsAddModalOpen } = useFinance();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/transactions', label: 'Activity', icon: Receipt },
    { to: '/budgets', label: 'Budgets', icon: PieChart },
    { to: '/insights', label: 'Insights', icon: TrendingUp },
    { to: '/goals', label: 'Goals', icon: PiggyBank },
  ];

  const isNavActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="h-12 px-4 rounded-full bg-[#4C3478] text-white shadow-[0_8px_20px_rgba(76,52,120,0.35)] flex items-center gap-1.5 font-bold text-sm hover:bg-[#3B275F] active:scale-95 transition-all"
          aria-label="Quick Add Expense"
        >
          <Plus className="w-5 h-5 text-[#42CBA5]" />
          <span>Add</span>
        </button>
      </div>

      {/* Fixed Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[#E9E4F2] shadow-[0_-1px_12px_rgba(76,52,120,0.04)] pb-safe"
        aria-label="Mobile Navigation"
      >
        <div className="flex justify-around items-center h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? 'text-[#4C3478] font-bold'
                    : 'text-[#777187] hover:text-[#4C3478] font-medium'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] leading-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};
