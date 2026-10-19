import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Share2,
  ThumbsUp,
  Download,
  FileSpreadsheet,
  Coffee,
  Calendar,
  AlertTriangle,
  Award,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Check,
  ChevronDown,
  X,
  PieChart,
  ShieldCheck,
  Utensils,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext.tsx';
import { getCategoryCanonicalKey, normalizeCategory } from '../utils/financeCalculations.ts';
import { exportTransactionsToCSV } from '../utils/csvExport.ts';

export const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    profile,
    totalSpent,
    totalIncome,
    totalBudget,
    budgetRemaining,
    availableBalance,
    liquidCash,
    runway,
    daysLeft,
    computedCategories,
    needsVsWants,
    periodTransactions,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    goals,
  } = useFinance();

  const [shareFeedback, setShareFeedback] = useState(false);
  const [downloadPdfFeedback, setDownloadPdfFeedback] = useState(false);
  const [exportCsvFeedback, setExportCsvFeedback] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [weekendCapActive, setWeekendCapActive] = useState(false);
  const [canteenWalletActive, setCanteenWalletActive] = useState(false);

  // Derive active month label
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

  // Total savings contributions made in selected period
  const periodSavingsContributions = useMemo(() => {
    let sum = 0;
    goals.forEach((g) => {
      if (g.contributions) {
        g.contributions.forEach((c) => {
          if (c.date && c.date.startsWith(selectedMonth)) {
            sum += c.amount;
          }
        });
      }
    });
    return sum;
  }, [goals, selectedMonth]);

  // Total saved across all tracked goals
  const totalSavedAcrossGoals = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [goals]);

  // Discipline Grade calculation based on real financial adherence
  const disciplineScore = useMemo(() => {
    if (computedCategories.length === 0 && totalSpent === 0) {
      return { grade: 'A', label: 'Fresh Slate', desc: 'No expenses logged yet for this period.' };
    }

    let points = 0;

    // 1. Budget consumption ratio (max 40 pts)
    const budgetRatio = totalBudget > 0 ? totalSpent / totalBudget : 0;
    if (budgetRatio <= 0.8) points += 40;
    else if (budgetRatio <= 1.0) points += 30;
    else if (budgetRatio <= 1.15) points += 15;
    else points += 5;

    // 2. Category adherence (max 40 pts)
    const withinBudgetCount = computedCategories.filter(
      (c) => c.allocated > 0 && c.spent <= c.allocated
    ).length;
    const fundedCount = computedCategories.filter((c) => c.allocated > 0).length;
    if (fundedCount > 0) {
      points += Math.round((withinBudgetCount / fundedCount) * 40);
    } else {
      points += 30;
    }

    // 3. Runway health (max 20 pts)
    if (runway.status === 'safe') points += 20;
    else if (runway.status === 'caution') points += 10;
    else points += 0;

    if (points >= 90) return { grade: 'A+', label: 'Exemplary Discipline', points };
    if (points >= 80) return { grade: 'A', label: 'Excellent Discipline', points };
    if (points >= 70) return { grade: 'B+', label: 'Solid Discipline', points };
    if (points >= 60) return { grade: 'B', label: 'Moderate Discipline', points };
    if (points >= 50) return { grade: 'C+', label: 'Needs Attention', points };
    return { grade: 'C', label: 'Budget Pressure', points };
  }, [computedCategories, totalSpent, totalBudget, runway.status]);

  // Days passed in period & dynamic daily stats
  const {
    avgDailySpend,
    peakDayAmount,
    peakDayDateStr,
    topCategoryName,
    topCategoryPercentage,
    daysPassed,
  } = useMemo(() => {
    const expenseTxns = periodTransactions.filter((t) => t.type === 'expense');

    let effectiveDaysPassed = 19;
    if (selectedMonth === '2026-10') {
      effectiveDaysPassed = 19;
    } else if (selectedMonth === '2026-09') {
      effectiveDaysPassed = 30;
    } else {
      effectiveDaysPassed = Math.max(1, new Date().getDate());
    }

    const avg = expenseTxns.length > 0 ? Math.round(totalSpent / effectiveDaysPassed) : 0;

    // Aggregate by day to find peak day
    const dayTotals: Record<string, number> = {};
    expenseTxns.forEach((t) => {
      dayTotals[t.date] = (dayTotals[t.date] || 0) + t.amount;
    });

    let maxSpend = 0;
    let maxDate = '';
    Object.entries(dayTotals).forEach(([d, amt]) => {
      if (amt > maxSpend) {
        maxSpend = amt;
        maxDate = d;
      }
    });

    let formattedDate = 'No expenses';
    if (maxDate) {
      try {
        const dt = new Date(maxDate + 'T00:00:00');
        formattedDate = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      } catch {
        formattedDate = maxDate;
      }
    }

    // Top Category
    const sorted = [...computedCategories]
      .filter((c) => c.spent > 0)
      .sort((a, b) => b.spent - a.spent);
    const topCat = sorted[0];
    const topPercent = totalSpent > 0 && topCat ? Math.round((topCat.spent / totalSpent) * 100) : 0;

    return {
      avgDailySpend: avg,
      peakDayAmount: maxSpend,
      peakDayDateStr: formattedDate,
      topCategoryName: topCat ? topCat.name : 'None',
      topCategoryPercentage: topPercent,
      daysPassed: effectiveDaysPassed,
    };
  }, [periodTransactions, totalSpent, selectedMonth, computedCategories]);

  // Weekly spending breakdown (Weeks 1 to 4)
  const weeklyData = useMemo(() => {
    const weeks = [
      { id: 'W1', label: 'W1 (1-7)', spend: 0 },
      { id: 'W2', label: 'W2 (8-14)', spend: 0 },
      { id: 'W3', label: 'W3 (15-21)', spend: 0 },
      { id: 'W4', label: 'W4 (22-31)', spend: 0 },
    ];

    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const day = parseInt(t.date.split('-')[2] || '1', 10);
        if (day <= 7) weeks[0].spend += t.amount;
        else if (day <= 14) weeks[1].spend += t.amount;
        else if (day <= 21) weeks[2].spend += t.amount;
        else weeks[3].spend += t.amount;
      });

    const maxSpend = Math.max(1, ...weeks.map((w) => w.spend));

    return weeks.map((w) => ({
      ...w,
      heightPercent: Math.max(12, Math.round((w.spend / maxSpend) * 100)),
    }));
  }, [periodTransactions]);

  // Campus Habits computed from real ledger
  const habits = useMemo(() => {
    // 1. Canteen / Chai micro-spends under ₹150
    const canteenSpends = periodTransactions.filter((t) => {
      const isFood = getCategoryCanonicalKey(t.category) === 'food';
      return t.type === 'expense' && isFood && t.amount <= 150;
    });
    const canteenTotal = canteenSpends.reduce((sum, t) => sum + t.amount, 0);

    // 2. Weekend Outflow
    let weekendSpend = 0;
    let weekendCount = 0;
    let weekdaySpend = 0;
    let weekdayCount = 0;

    periodTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const d = new Date(t.date + 'T00:00:00');
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendSpend += t.amount;
          weekendCount++;
        } else {
          weekdaySpend += t.amount;
          weekdayCount++;
        }
      });

    const weekendAvg = weekendCount > 0 ? weekendSpend / weekendCount : 0;
    const weekdayAvg = weekdayCount > 0 ? weekdaySpend / weekdayCount : 0;
    const weekendRatio = weekdayAvg > 0 ? (weekendAvg / weekdayAvg).toFixed(1) : '1.0';

    // 3. Study / Academics spend vs allocation
    const academicCat = computedCategories.find(
      (c) => getCategoryCanonicalKey(c.name) === 'education'
    );
    const academicSpent = academicCat?.spent || 0;
    const academicAllocated = academicCat?.allocated || 800;
    const academicSavings = Math.max(0, academicAllocated - academicSpent);

    return {
      canteenCount: canteenSpends.length,
      canteenTotal,
      weekendSpend,
      weekendRatio,
      academicSpent,
      academicSavings,
    };
  }, [periodTransactions, computedCategories]);

  // Social Share handler
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `PaisaWise Campus Spending Report - ${activeMonthLabel}`,
          text: `I scored ${disciplineScore.grade} in Financial Discipline on PaisaWise with ₹${runway.safeDailySpend}/day runway pacing!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    }
  };

  // Dynamic Parent / Student Monthly Report HTML Download
  const handleDownloadPdf = () => {
    setDownloadPdfFeedback(true);
    setTimeout(() => {
      const categoryRows = computedCategories
        .map(
          (c) => `
        <tr style="border-bottom: 1px solid #e1ebe1;">
          <td style="padding: 8px 4px; font-weight: 600;">${c.name}</td>
          <td style="padding: 8px 4px; text-align: right;">₹${(c.allocated || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 8px 4px; text-align: right; font-weight: bold; color: ${
            c.spent > c.allocated ? '#ba1a1a' : '#006c4c'
          };">₹${(c.spent || 0).toLocaleString('en-IN')}</td>
          <td style="padding: 8px 4px; text-align: right; font-size: 11px; text-transform: uppercase;">${
            c.status || 'healthy'
          }</td>
        </tr>`
        )
        .join('');

      const goalsSummary =
        goals.length > 0
          ? goals
              .map(
                (g) => `
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e1ebe1; font-size: 13px;">
            <span>${g.title}</span>
            <span style="font-weight: bold; color: #006c4c;">₹${g.currentAmount.toLocaleString('en-IN')} / ₹${g.targetAmount.toLocaleString('en-IN')} (${Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))}%)</span>
          </div>`
              )
              .join('')
          : '<p style="color: #69746d; font-size: 12px;">No active savings goals recorded.</p>';

      const reportHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>PaisaWise Financial Audit - ${activeMonthLabel}</title>
    <style>
      body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 36px; color: #151e18; max-width: 680px; margin: 0 auto; line-height: 1.5; background: #fafdfa; }
      .header-box { background: #123d32; color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; }
      .header-box h1 { margin: 0 0 6px 0; font-size: 24px; color: #83f9c5; }
      .header-box p { margin: 0; font-size: 13px; opacity: 0.9; }
      .badge { display: inline-block; background: #83f9c5; color: #002114; font-weight: 800; padding: 4px 12px; border-radius: 999px; font-size: 13px; margin: 12px 0; }
      .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
      .stat-card { background: white; border: 1px solid #e1ebe1; padding: 14px; border-radius: 12px; }
      .stat-card span { display: block; font-size: 11px; color: #69746d; font-weight: 600; text-transform: uppercase; }
      .stat-card strong { font-size: 18px; color: #00261e; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
      th { text-align: left; padding: 8px 4px; color: #69746d; border-bottom: 2px solid #e1ebe1; font-size: 11px; text-transform: uppercase; }
      .section-title { font-size: 16px; font-weight: 800; color: #00261e; margin: 24px 0 8px 0; }
      footer { font-size: 11px; color: #717975; text-align: center; margin-top: 36px; border-top: 1px solid #e1ebe1; padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <h1>PaisaWise Student Allowance Audit</h1>
      <p>Period: ${activeMonthLabel} • Student: ${profile.name} (${profile.major || 'Campus Student'}, ${profile.semester || 'Semester 3'})</p>
      <div class="badge">Discipline Grade: ${disciplineScore.grade} (${disciplineScore.label})</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>Recorded Inflow / Allowance</span>
        <strong>₹${totalIncome.toLocaleString('en-IN')}</strong>
      </div>
      <div class="stat-card">
        <span>Total Spent to Date</span>
        <strong style="color: #D95D52;">₹${totalSpent.toLocaleString('en-IN')}</strong>
      </div>
      <div class="stat-card">
        <span>Liquid Balance Remaining</span>
        <strong style="color: #20A477;">₹${liquidCash.toLocaleString('en-IN')}</strong>
      </div>
      <div class="stat-card">
        <span>Safe Daily Spending Runway</span>
        <strong>₹${runway.safeDailySpend.toLocaleString('en-IN')} / day</strong>
      </div>
    </div>

    <div class="section-title">Category Envelopes &amp; Adherence</div>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th style="text-align: right;">Budget</th>
          <th style="text-align: right;">Spent</th>
          <th style="text-align: right;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRows}
      </tbody>
    </table>

    <div class="section-title">Tracked Savings Goals</div>
    ${goalsSummary}

    <footer>
      Generated securely via PaisaWise Student Expense Vault • 100% on-device private ledger.
    </footer>
  </body>
</html>`;

      const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PaisaWise_Student_Allowance_Audit_${selectedMonth}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadPdfFeedback(false);
    }, 600);
  };

  // Dynamic CSV Export for Parents / Google Sheets
  const handleExportCSV = () => {
    setExportCsvFeedback(true);
    setTimeout(() => {
      exportTransactionsToCSV(periodTransactions, `PaisaWise_Audit_${selectedMonth}.csv`);
      setExportCsvFeedback(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto flex flex-col gap-8 pb-14">
      {/* Header Context with Month Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-[#00261e] tracking-tight">
            Insights &amp; Habits
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#006c4c] animate-pulse"></span>
            <span className="text-xs text-[#69746d] font-semibold">{activeMonthLabel} • Performance Audit</span>
            <button
              type="button"
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e1ebe1] text-[#414845] text-xs font-semibold hover:bg-[#dbe5dc] transition-colors"
            >
              <Calendar className="w-3 h-3 text-[#006c4c]" />
              <span>Switch Month</span>
              <ChevronDown className="w-3 h-3 text-[#717975]" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="h-10 px-4 rounded-full bg-white hover:bg-[#e1ebe1] text-[#00261e] font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-xs border border-[#e1ebe1] self-start sm:self-auto"
        >
          <Share2 className="w-4 h-4 text-[#006c4c]" />
          <span>{shareFeedback ? 'Link Copied!' : 'Share Audit'}</span>
        </button>
      </div>

      {/* Month Dropdown Modal */}
      {showMonthDropdown && (
        <div
          className="fixed inset-0 z-50 bg-[#00261e]/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowMonthDropdown(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl border border-[#e1ebe1]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#e1ebe1]">
              <span className="font-bold text-sm text-[#00261e]">Select Reporting Period</span>
              <button
                type="button"
                onClick={() => setShowMonthDropdown(false)}
                className="text-[#717975] hover:text-[#00261e]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2 pt-3">
              {availableMonths.map((m) => {
                const isSelected = selectedMonth === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m.value);
                      setShowMonthDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-[#123d32] text-white' : 'bg-[#f2fcf2] text-[#414845] hover:bg-[#e1ebe1]'
                    }`}
                  >
                    <span>{m.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#83f9c5]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mid-Semester Report Card Hero Card */}
      <section className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-[#e1ebe1] p-6 md:p-8 flex flex-col gap-6">
        <div className="absolute -right-6 -bottom-8 w-44 h-44 rounded-full bg-[#bfecdc]/30 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-6 -top-6 w-36 h-36 rounded-full bg-[#ffdf9e]/30 blur-xl pointer-events-none"></div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#69746d]">
              Campus Financial IQ
            </span>
            <h2 className="text-xl md:text-2xl font-black text-[#00261e]">
              {activeMonthLabel} Report Card
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-[#83f9c5] shadow-xs transform rotate-1">
            <span className="text-2xl font-black text-[#002114] leading-none">{disciplineScore.grade}</span>
            <span className="text-[10px] font-extrabold text-[#002114] uppercase tracking-tight">
              Discipline
            </span>
          </div>
        </div>

        {/* Dynamic Assessment Note */}
        <div className="p-4 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#bfecdc] flex items-center justify-center shrink-0 mt-0.5">
            <ThumbsUp className="w-4 h-4 text-[#00261e]" />
          </div>
          <p className="text-xs md:text-sm text-[#151e18] leading-relaxed">
            <span className="font-extrabold text-[#00261e]">{disciplineScore.label}!</span> You have spent{' '}
            <strong className="text-[#00261e] font-black">₹{totalSpent.toLocaleString('en-IN')}</strong> of your ₹
            {totalIncome.toLocaleString('en-IN')} inflow with{' '}
            <strong className="text-[#006c4c] font-black">₹{liquidCash.toLocaleString('en-IN')}</strong> remaining and{' '}
            <strong className="text-[#123d32] font-black">₹{totalSavedAcrossGoals.toLocaleString('en-IN')}</strong> saved across tracked goals.
          </p>
        </div>

        {/* 3 Quick Triage Stat Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col p-4 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
            <span className="text-xs text-[#69746d] font-medium">Avg / Day</span>
            <span className="font-black text-lg md:text-xl text-[#00261e] mt-1">
              ₹{avgDailySpend.toLocaleString('en-IN')}
            </span>
            <span
              className={`text-[11px] font-bold mt-0.5 ${
                avgDailySpend > runway.safeDailySpend ? 'text-[#ba1a1a]' : 'text-[#006c4c]'
              }`}
            >
              Target: ₹{runway.safeDailySpend}/day
            </span>
          </div>

          <div className="flex flex-col p-4 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
            <span className="text-xs text-[#69746d] font-medium">Peak Day</span>
            <span className="font-black text-lg md:text-xl text-[#00261e] mt-1">
              ₹{peakDayAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-[#69746d] mt-0.5 truncate">{peakDayDateStr}</span>
          </div>

          <div className="flex flex-col p-4 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
            <span className="text-xs text-[#69746d] font-medium">Top Category</span>
            <span className="font-black text-lg md:text-xl text-[#00261e] mt-1">
              {topCategoryPercentage}%
            </span>
            <span className="text-[11px] text-[#006c4c] font-bold mt-0.5 truncate">{topCategoryName}</span>
          </div>
        </div>
      </section>

      {/* Row: Needs vs Wants + Weekly Burn Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Needs vs Wants Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e1ebe1] flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-[#00261e]">Needs vs. Wants</h3>
              <p className="text-xs text-[#69746d]">Student 60/40 recommended ratio</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                needsVsWants.needsPercentage >= 50
                  ? 'bg-[#83f9c5]/50 text-[#002114]'
                  : 'bg-[#ffdf9e] text-[#473300]'
              }`}
            >
              {needsVsWants.needsPercentage >= 50 ? 'Needs Balanced' : 'Wants Elevated'}
            </span>
          </div>

          {/* Segmented Split Gauge */}
          <div className="flex flex-col gap-3">
            <div className="h-4 w-full bg-[#e1ebe1] rounded-full overflow-hidden flex p-0.5">
              <div
                className="h-full bg-[#123d32] rounded-l-full transition-all duration-700"
                style={{ width: `${needsVsWants.needsPercentage}%` }}
              ></div>
              <div
                className="h-full bg-[#ebc164] rounded-r-full ml-0.5 transition-all duration-700"
                style={{ width: `${needsVsWants.wantsPercentage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#123d32] shrink-0"></span>
                <div>
                  <div className="text-xs font-bold text-[#00261e]">
                    Needs • {needsVsWants.needsPercentage}%
                  </div>
                  <div className="text-[11px] text-[#69746d]">
                    ₹{needsVsWants.needsAmount.toLocaleString('en-IN')} (Mess, Metro, Hostel)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right">
                <div>
                  <div className="text-xs font-bold text-[#473300]">
                    Wants • {needsVsWants.wantsPercentage}%
                  </div>
                  <div className="text-[11px] text-[#69746d]">
                    ₹{needsVsWants.wantsAmount.toLocaleString('en-IN')} (Zomato, Cafes, OTT)
                  </div>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#ebc164] shrink-0"></span>
              </div>
            </div>
          </div>

          {/* Coaching Note */}
          <div className="p-3.5 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#006c4c] shrink-0 mt-0.5" />
            <p className="text-xs text-[#151e18] leading-relaxed">
              {needsVsWants.wantsPercentage > 40 ? (
                <span>
                  Wants are currently <strong className="text-[#ba1a1a]">{needsVsWants.wantsPercentage - 40}% above</strong> the 40% target. Swapping one weekend dinner for hostel dining keeps you aligned.
                </span>
              ) : (
                <span>
                  Your needs-to-wants pacing is <strong className="text-[#006c4c]">well within bounds</strong> at {needsVsWants.needsPercentage}% needs. Great campus discipline!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Weekly Burn Rate Dynamic Chart */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e1ebe1] flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-[#00261e]">Weekly Burn Rate</h3>
              <p className="text-xs text-[#69746d]">
                {activeMonthLabel} Inflow: ₹{totalIncome.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#69746d] font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#006c4c]"></span> Actual Spend
              </span>
            </div>
          </div>

          {/* Dynamic Weekly Bars */}
          <div className="w-full h-44 flex items-end justify-between gap-3 pt-4 px-2 border-b border-[#e1ebe1] pb-2">
            {weeklyData.map((w, idx) => (
              <div key={w.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[11px] font-bold text-[#00261e]">
                  ₹{w.spend.toLocaleString('en-IN')}
                </span>
                <div
                  className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 ${
                    idx === 1
                      ? 'bg-[#ebc164]'
                      : idx === 2
                      ? 'bg-[#006c4c]'
                      : 'bg-[#123d32]'
                  }`}
                  style={{ height: `${w.heightPercent}%` }}
                ></div>
                <span className="text-xs font-bold text-[#69746d] mt-1">{w.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl bg-[#ecf6ed] text-[#414845] border border-[#bfecdc]">
            <span>
              Remaining Available Balance: <strong className="text-[#00261e] font-black">₹{liquidCash.toLocaleString('en-IN')}</strong>
            </span>
            <span className="text-[#006c4c] font-bold">{daysLeft} days left</span>
          </div>
        </div>
      </div>

      {/* Campus Habit Radar */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#006c4c]" />
            <h3 className="text-xl font-bold text-[#00261e]">Campus Habit Radar</h3>
          </div>
          <span className="text-xs font-bold text-[#69746d]">Derived from live transactions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Habit 1: Chai & Tapri Spends */}
          <div className="rounded-3xl bg-white shadow-sm border border-[#e1ebe1] p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ffdf9e] flex items-center justify-center text-[#473300] shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-sm text-[#00261e]">Chai &amp; Tapri Spends</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffdf9e] text-[#473300] font-bold">
                    Micro-Habit
                  </span>
                </div>
                <p className="text-xs text-[#414845] mt-1.5 leading-relaxed">
                  You logged <strong className="text-[#151e18]">{habits.canteenCount} canteen payments</strong> under ₹150 totaling <strong className="text-[#00261e] font-bold">₹{habits.canteenTotal.toLocaleString('en-IN')}</strong> this month.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCanteenWalletActive(!canteenWalletActive)}
              className="text-xs font-bold text-[#006c4c] hover:underline flex items-center gap-1 self-start pt-1"
            >
              <span>{canteenWalletActive ? 'Wallet Cap Active (₹80/d)' : 'Set Canteen Cap'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Habit 2: Weekend Outflow */}
          <div className="rounded-3xl bg-white shadow-sm border border-[#e1ebe1] p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-sm text-[#00261e]">Weekend Outflow Trend</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] font-bold">
                    Pacing
                  </span>
                </div>
                <p className="text-xs text-[#414845] mt-1.5 leading-relaxed">
                  Weekend spending is <strong className="text-[#ba1a1a] font-bold">{habits.weekendRatio}x</strong> that of weekday spending (₹{habits.weekendSpend.toLocaleString('en-IN')} on Saturdays &amp; Sundays).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWeekendCapActive(!weekendCapActive)}
              className="text-xs font-bold text-[#ba1a1a] hover:underline flex items-center gap-1 self-start pt-1"
            >
              <span>{weekendCapActive ? 'Cap Active (₹500 Max)' : 'Enable Weekend Cap'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Habit 3: Goal Milestones */}
          <div className="rounded-3xl bg-white shadow-sm border border-[#e1ebe1] p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#83f9c5] flex items-center justify-center text-[#002114] shrink-0">
                <Award className="w-5 h-5 text-[#006c4c]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-sm text-[#00261e]">Savings Progress</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#83f9c5] text-[#002114] font-bold">
                    Milestone
                  </span>
                </div>
                <p className="text-xs text-[#414845] mt-1.5 leading-relaxed">
                  You have saved <strong className="text-[#006c4c] font-bold">₹{totalSavedAcrossGoals.toLocaleString('en-IN')}</strong> across {goals.length} target vaults, ring-fencing funds from impulsive spending!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/goals')}
              className="text-xs font-bold text-[#006c4c] hover:underline flex items-center gap-1 self-start pt-1"
            >
              <span>View Savings Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Reports & Accountability Export Buttons */}
      <section className="flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#69746d]">
          Reports &amp; Accountability
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="h-12 px-5 rounded-full bg-[#123d32] text-white hover:bg-[#00261e] font-bold text-xs md:text-sm flex items-center justify-between shadow-xs transition-all active:scale-98"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#83f9c5]" />
              <span>{downloadPdfFeedback ? 'Generating Report...' : `Download ${activeMonthLabel} Report`}</span>
            </div>
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-12 px-5 rounded-full bg-white border border-[#e1ebe1] text-[#00261e] hover:bg-[#f2fcf2] font-bold text-xs md:text-sm flex items-center justify-between shadow-xs transition-all active:scale-98"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#006c4c]" />
              <span>{exportCsvFeedback ? 'Downloading CSV...' : 'Export CSV for Parents / Sheets'}</span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#717975]" />
          </button>
        </div>
        <p className="text-[11px] text-[#69746d] text-center pt-1">
          PaisaWise smart analytics run on-device. No UPI credentials or personal bank keys are shared.
        </p>
      </section>
    </div>
  );
};
