import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  PiggyBank,
  Receipt,
  Sparkles,
  Lock,
  ChevronRight,
  PieChart,
  Users,
  Compass,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';
import { PaisaWiseLogo } from '../components/common/PaisaWiseLogo.tsx';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { runway, profile } = useFinance();

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-14 py-4 md:py-8 font-sans">
      {/* Top Brand Banner / Tagline Kicker */}
      <header className="flex items-center justify-between pb-2 border-b border-[#E9E4F2]">
        <div
          onClick={() => navigate('/dashboard')}
          className="cursor-pointer"
        >
          <PaisaWiseLogo variant="full" />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-xs md:text-sm font-bold text-[#777187] hover:text-[#4C3478] px-3 py-1.5 transition-colors"
          >
            Explore Demo
          </button>
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="h-9 px-4 rounded-full bg-[#4C3478] hover:bg-[#3B275F] text-white font-bold text-xs md:text-sm flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>Get Started</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#42CBA5]" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4C3478] via-[#3B275F] to-[#251840] text-white p-8 md:p-14 shadow-2xl">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#8B6FE8]/25 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#42CBA5]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#83f9c5] text-xs font-bold self-start border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#83f9c5] animate-pulse" />
              <span>Campus Money Simplified</span>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                Make your money <br />
                <span className="text-[#83f9c5]">last longer.</span>
              </h1>
              <p className="text-base md:text-lg text-[#bfecdc] leading-relaxed max-w-xl">
                The smart personal finance companion built specifically for college students. Track campus UPI spends, safeguard monthly allowances, keep emergency cash locked, and calculate your exact safe daily burn rate so you never run broke before the next month.
              </p>
            </div>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="h-12 px-7 rounded-full bg-[#83f9c5] text-[#002114] font-black text-sm md:text-base flex items-center gap-2 hover:bg-[#a4d0c0] active:scale-95 transition-all shadow-lg hover:shadow-xl"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="h-12 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm md:text-base transition-all border border-white/20 flex items-center gap-2"
              >
                <span>Explore Demo</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 border-t border-white/15 flex flex-wrap items-center gap-6 text-xs text-[#a4d0c0]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#83f9c5]" />
                <span>Zero bank logins needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#83f9c5]" />
                <span>Instant campus UPI ledger</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#83f9c5]" />
                <span>1-Tap hostel bill split</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Product Mockup */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-[#f2fcf2] text-[#151e18] rounded-3xl p-5 md:p-6 shadow-2xl border border-white/20 flex flex-col gap-4 transform transition-all duration-300 hover:scale-[1.01]">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#e1ebe1]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#123d32] text-white flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <span className="font-extrabold text-xs text-[#00261e]">Survival Runway Meter</span>
                </div>
                <span className="text-[11px] font-bold text-[#006c4c] bg-[#83f9c5]/40 px-2 py-0.5 rounded-full">
                  Day 16 of 31
                </span>
              </div>

              {/* Survival Meter Hero Card inside Mockup */}
              <div className="bg-[#123d32] text-white rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#83f9c5]">
                    Safe Daily Spend
                  </span>
                  <span className="text-xs font-semibold text-[#bfecdc]">15 Days Left</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-black tracking-tight text-white tabular-nums">
                    ₹{runway?.safeDailySpend || 283}
                  </span>
                  <span className="text-xs text-[#83f9c5] font-semibold">/ day</span>
                </div>
                <p className="text-[11px] text-[#bfecdc] mt-2 leading-relaxed">
                  Formula: (₹4,250 Liquid − ₹0 Fixed Dues) ÷ 15 days = ₹283 safe daily pace.
                </p>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-[#83f9c5] h-full w-[65%] rounded-full" />
                </div>
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="bg-white p-3 rounded-xl border border-[#e1ebe1]">
                  <span className="text-[10px] text-[#69746d] font-bold uppercase">Oct Allowance</span>
                  <div className="text-sm font-black text-[#00261e] mt-0.5 tabular-nums">₹10,000</div>
                  <span className="text-[10px] text-[#006c4c] font-semibold">Credited on 1st</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#e1ebe1]">
                  <span className="text-[10px] text-[#69746d] font-bold uppercase">Goa Trip Fund</span>
                  <div className="text-sm font-black text-[#00261e] mt-0.5 tabular-nums">₹1,500</div>
                  <span className="text-[10px] text-[#20a477] font-semibold">25% of Target</span>
                </div>
              </div>

              {/* Recent Campus Spends Preview */}
              <div className="flex flex-col gap-2 pt-1">
                <span className="text-[11px] font-bold text-[#414845]">Recent Campus Spends</span>
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-[#e1ebe1]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#006c4c]" />
                    <span className="font-semibold text-[#151e18]">Canteen Chai &amp; Samosa</span>
                  </div>
                  <span className="font-black text-[#151e18] tabular-nums">−₹40</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-[#e1ebe1]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#20a477]" />
                    <span className="font-semibold text-[#151e18]">Metro SmartCard Recharge</span>
                  </div>
                  <span className="font-black text-[#151e18] tabular-nums">−₹200</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section: 4 Core Student Pillars */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#006c4c] uppercase tracking-wider">
            Engineered for Campus Realities
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-[#00261e] tracking-tight">
            Everything you need to master your monthly allowance
          </h2>
          <p className="text-xs md:text-sm text-[#69746d]">
            Built around the unique rhythms of college semesters, hostel mess schedules, and weekend hangouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Feature 1: Expense Tracking */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#e1ebe1] flex flex-col gap-3 hover:border-[#83f9c5] transition-all group">
            <div className="w-11 h-11 rounded-2xl bg-[#ecf6ed] text-[#006c4c] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-[#00261e]">Campus Expense Tracking</h3>
            <p className="text-xs md:text-sm text-[#414845] leading-relaxed">
              Log daily UPI canteen bills, xerox prints, metro commutes, and hostel expenses in seconds. Includes 1-tap bill splitting with roommates.
            </p>
          </div>

          {/* Feature 2: Survival Meter */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#e1ebe1] flex flex-col gap-3 hover:border-[#83f9c5] transition-all group">
            <div className="w-11 h-11 rounded-2xl bg-[#123d32] text-[#83f9c5] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-[#00261e]">Pocket Money Survival Meter</h3>
            <p className="text-xs md:text-sm text-[#414845] leading-relaxed">
              Dynamically calculates your safe daily spending allowance after reserving fixed hostel rent and emergency safety buffers so you never run out of cash.
            </p>
          </div>

          {/* Feature 3: Spending Insights */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#e1ebe1] flex flex-col gap-3 hover:border-[#83f9c5] transition-all group">
            <div className="w-11 h-11 rounded-2xl bg-[#ecf6ed] text-[#006c4c] flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-[#00261e]">Mid-Semester Insights</h3>
            <p className="text-xs md:text-sm text-[#414845] leading-relaxed">
              Earn a financial discipline report card (Grade B+), analyze Needs vs. Wants, detect weekend dining spikes, and export parent audit reports.
            </p>
          </div>

          {/* Feature 4: Savings Goals */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#e1ebe1] flex flex-col gap-3 hover:border-[#83f9c5] transition-all group">
            <div className="w-11 h-11 rounded-2xl bg-[#ecf6ed] text-[#006c4c] flex items-center justify-center group-hover:scale-110 transition-transform">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-[#00261e]">Milestone Savings Goals</h3>
            <p className="text-xs md:text-sm text-[#414845] leading-relaxed">
              Lock funds safely away from impulse canteen spends to reach milestone goals like the Goa Semester Trip, a new laptop, or festival passes.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy-Focused Trust Section */}
      <section className="bg-[#ecf6ed] rounded-3xl p-8 md:p-10 border border-[#cbe1ce] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4 max-w-xl">
          <div className="w-12 h-12 rounded-2xl bg-[#123d32] text-[#83f9c5] flex items-center justify-center shrink-0 shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg md:text-xl font-black text-[#00261e]">
              Start without connecting a bank account.
            </h3>
            <p className="text-xs md:text-sm text-[#414845] leading-relaxed">
              PaisaWise is completely private and runs on your device. We never ask for your bank account details, net banking credentials, debit card numbers, or SMS permissions. You are in 100% control of your personal data.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="h-11 px-6 rounded-full bg-[#123d32] hover:bg-[#00261e] text-white font-bold text-xs md:text-sm flex items-center gap-2 shrink-0 transition-all shadow-sm active:scale-95"
        >
          <span>Setup My Allowance</span>
          <ArrowRight className="w-4 h-4 text-[#83f9c5]" />
        </button>
      </section>

      {/* Footer */}
      <footer className="pt-6 pb-10 border-t border-[#e1ebe1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#69746d]">
        <div className="flex items-center gap-2">
          <PaisaWiseLogo variant="compact" className="w-5 h-5" />
          <span className="font-bold text-[#00261e]">PaisaWise</span>
          <span>·</span>
          <span>Your money, made clearer.</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="hover:text-[#00261e] transition-colors"
          >
            Dashboard
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="hover:text-[#00261e] transition-colors"
          >
            Onboarding
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="hover:text-[#00261e] transition-colors"
          >
            Settings
          </button>
        </div>
      </footer>
    </div>
  );
};
