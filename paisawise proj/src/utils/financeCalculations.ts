import type { Transaction, CategoryBudget, RunwayCalculation } from '../types/finance.ts';

/**
 * Calculates survival runway metrics:
 * Formula: (Liquid Balance - Fixed Dues - Safety Buffer) / Days Remaining
 */
export function calculateRunway(
  liquidCash: number,
  fixedDues: number = 0,
  safetyBuffer: number = 0,
  daysRemaining: number = 15
): RunwayCalculation {
  const isAllowanceDateReached = daysRemaining <= 0;
  const safeDays = Math.max(1, daysRemaining);
  const spendableAmount = Math.max(0, liquidCash - fixedDues - safetyBuffer);
  const safeDailySpend = isAllowanceDateReached ? 0 : Math.max(0, Math.floor(spendableAmount / safeDays));

  let status: 'safe' | 'caution' | 'critical' = 'safe';
  let statusLabel = 'On track';

  if (isAllowanceDateReached) {
    status = 'critical';
    statusLabel = 'Allowance date reached';
  } else if (liquidCash <= 0 || spendableAmount <= 0) {
    status = 'critical';
    statusLabel = liquidCash <= 0 ? 'Balance depleted · Overspent' : 'No spendable buffer left';
  } else if (safeDailySpend < 150) {
    status = 'caution';
    statusLabel = 'Spending faster than planned';
  } else {
    status = 'safe';
    statusLabel = 'On track';
  }

  // Runway ratio relative to nominal student burn pace
  const nominalDailyTarget = 300;
  const runwayRatio = isAllowanceDateReached || liquidCash <= 0
    ? 0
    : Math.min(100, Math.round((safeDailySpend / nominalDailyTarget) * 60));

  const formulaString = isAllowanceDateReached
    ? 'Allowance cycle completed · Ready for next transfer'
    : liquidCash <= 0
    ? 'Available balance depleted · Avoid further expenses until next allowance'
    : `(₹${liquidCash.toLocaleString('en-IN')} available - ₹${fixedDues} dues - ₹${safetyBuffer} buffer) ÷ ${safeDays} days = ₹${safeDailySpend}/day`;

  return {
    totalBalance: liquidCash,
    fixedDues,
    safetyBuffer,
    daysRemaining: Math.max(0, daysRemaining),
    spendableAmount,
    safeDailySpend,
    formulaString,
    status,
    statusLabel,
    runwayRatio,
  };
}

/**
 * Calculates total expenses logged
 */
export function calculateTotalSpent(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculates total income / allowance credited
 */
export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getCategoryCanonicalKey(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('food') || c.includes('canteen')) return 'food';
  if (c.includes('academic') || c.includes('book') || c.includes('education') || c.includes('study')) return 'education';
  if (c.includes('travel') || c.includes('metro') || c.includes('transport')) return 'travel';
  if (c.includes('hostel') || c.includes('rent') || c.includes('utilit')) return 'hostel';
  if (c.includes('entertainment') || c.includes('ott') || c.includes('movie')) return 'entertainment';
  if (c.includes('medic') || c.includes('health') || c.includes('pharm')) return 'health';
  if (c.includes('tech') || c.includes('gadget') || c.includes('shopping')) return 'shopping';
  if (c.includes('subscript') || c.includes('netflix') || c.includes('spotify') || c.includes('prime')) return 'subscriptions';
  if (c.includes('allowance') || c.includes('income')) return 'income';
  return c.trim();
}

export function normalizeCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('food') || c.includes('canteen')) return 'Food & Canteen';
  if (c.includes('academic') || c.includes('book') || c.includes('education') || c.includes('study')) return 'Academics & Books';
  if (c.includes('travel') || c.includes('metro') || c.includes('transport')) return 'Travel & Metro';
  if (c.includes('hostel') || c.includes('rent') || c.includes('utilit')) return 'Hostel & Utilities';
  if (c.includes('entertainment') || c.includes('ott') || c.includes('movie')) return 'Entertainment & OTT';
  if (c.includes('medic') || c.includes('health')) return 'Medical & Health';
  if (c.includes('tech') || c.includes('gadget') || c.includes('shopping')) return 'Tech & Gadgets';
  if (c.includes('allowance') || c.includes('income')) return 'Monthly Allowance';
  return cat;
}

/**
 * Computes spend by category and updates envelope statuses
 */
export function computeCategorySpend(
  transactions: Transaction[],
  envelopes: CategoryBudget[]
): CategoryBudget[] {
  const canonicalSpend: Record<string, number> = {};
  const exactSpend: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type === 'expense') {
      const canonicalKey = getCategoryCanonicalKey(t.category);
      canonicalSpend[canonicalKey] = (canonicalSpend[canonicalKey] || 0) + (Number(t.amount) || 0);
      const exactKey = (t.category || '').toLowerCase().trim();
      exactSpend[exactKey] = (exactSpend[exactKey] || 0) + (Number(t.amount) || 0);
    }
  }

  return envelopes.map((env) => {
    const canonicalKey = getCategoryCanonicalKey(env.name || env.category || '');
    const exactKey = (env.name || env.category || '').toLowerCase().trim();
    const spent = canonicalSpend[canonicalKey] ?? exactSpend[exactKey] ?? 0;
    const allocated = Math.max(0, Number(env.allocated ?? env.limit) || 0);
    const ratio = allocated > 0 ? spent / allocated : 0;

    const threshold = (env.alertThreshold !== undefined ? env.alertThreshold : 80) / 100;

    let status: CategoryBudget['status'] = 'healthy';
    if (allocated === 0) {
      status = 'unfunded';
    } else if (spent === 0) {
      status = 'intact';
    } else if (ratio > 1) {
      status = 'over';
    } else if (ratio >= threshold) {
      status = 'approaching';
    } else if (ratio <= 0.6) {
      status = 'optimal';
    }

    return {
      ...env,
      allocated,
      limit: allocated,
      category: env.name || env.category,
      spent,
      status,
    };
  });
}

/**
 * Student 60/40 rule breakdown:
 * Needs: Hostel & Mess, Travel & Metro, Academics & Books, Medical & Health
 * Wants: Food & Canteen (outside mess / treats), Entertainment & OTT, Tech & Gadgets, Other
 */
export function calculateNeedsVsWants(transactions: Transaction[]): {
  needsAmount: number;
  wantsAmount: number;
  needsPercentage: number;
  wantsPercentage: number;
} {
  const needsCategories = new Set([
    'Hostel & Utilities',
    'Academics & Books',
    'Travel & Metro',
    'Medical & Health',
    'Hostel/Rent',
    'Education',
    'Travel',
    'Health',
  ]);

  let needsAmount = 0;
  let wantsAmount = 0;

  for (const t of transactions) {
    if (t.type === 'expense') {
      if (needsCategories.has(t.category) || needsCategories.has(normalizeCategory(t.category))) {
        needsAmount += t.amount;
      } else {
        wantsAmount += t.amount;
      }
    }
  }

  const total = needsAmount + wantsAmount;
  if (total === 0) {
    return { needsAmount: 0, wantsAmount: 0, needsPercentage: 60, wantsPercentage: 40 };
  }

  const needsPercentage = Math.round((needsAmount / total) * 100);
  const wantsPercentage = 100 - needsPercentage;

  return {
    needsAmount,
    wantsAmount,
    needsPercentage,
    wantsPercentage,
  };
}

/**
 * Suggests an auto-balance cushion transfer from a surplus category to an over-budget category
 */
export function suggestAutoBalanceTransfer(envelopes: CategoryBudget[]): {
  fromCategory?: CategoryBudget;
  toCategory?: CategoryBudget;
  amountNeeded: number;
  surplusAvailable: number;
} | null {
  const overBudget = envelopes.find((e) => e.allocated > 0 && e.spent > e.allocated);
  if (!overBudget) return null;

  const amountNeeded = overBudget.spent - overBudget.allocated;
  
  // Find category with largest surplus
  const surplusCategory = envelopes
    .filter((e) => e.allocated > e.spent)
    .sort((a, b) => (b.allocated - b.spent) - (a.allocated - a.spent))[0];

  if (!surplusCategory) return null;

  const surplusAvailable = surplusCategory.allocated - surplusCategory.spent;

  return {
    fromCategory: surplusCategory,
    toCategory: overBudget,
    amountNeeded,
    surplusAvailable,
  };
}
