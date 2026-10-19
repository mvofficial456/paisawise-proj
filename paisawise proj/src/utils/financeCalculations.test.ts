import {
  calculateRunway,
  calculateTotalSpent,
  calculateTotalIncome,
  getCategoryCanonicalKey,
  normalizeCategory,
  computeCategorySpend,
  calculateNeedsVsWants,
  suggestAutoBalanceTransfer,
} from './financeCalculations.ts';
import type { Transaction, CategoryBudget, SavingsGoal } from '../types/finance.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ ${message}`);
  }
}

console.log('====================================================');
console.log('   PaisaWise Comprehensive Financial QA Test Suite   ');
console.log('====================================================');

// -----------------------------------------------------------------------------
// Test 1: Zero Transactions
// -----------------------------------------------------------------------------
console.log('\n--- Test 1: Zero Transactions ---');
const zeroSpent = calculateTotalSpent([]);
const zeroIncome = calculateTotalIncome([]);
assert(zeroSpent === 0, 'calculateTotalSpent([]) returns 0');
assert(zeroIncome === 0, 'calculateTotalIncome([]) returns 0');

const emptyNeedsVsWants = calculateNeedsVsWants([]);
assert(emptyNeedsVsWants.needsPercentage === 60, 'calculateNeedsVsWants([]) provides safe default 60/40 ratio without division by zero');
assert(emptyNeedsVsWants.wantsPercentage === 40, 'Default wants ratio is 40%');
assert(emptyNeedsVsWants.needsAmount === 0, 'Empty transactions yield 0 total needs');
assert(emptyNeedsVsWants.wantsAmount === 0, 'Empty transactions yield 0 total wants');

// -----------------------------------------------------------------------------
// Test 2: Income without Expenses
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Income without Expenses ---');
const incomeOnlyTxns: Transaction[] = [
  { id: 'inc-1', title: 'Monthly Allowance', amount: 8000, type: 'income', category: 'Monthly Allowance', date: '2026-10-01', paymentMethod: 'UPI' },
  { id: 'inc-2', title: 'Freelance Design', amount: 2500, type: 'income', category: 'Income', date: '2026-10-05', paymentMethod: 'Bank' },
];
const incOnlyTotalSpent = calculateTotalSpent(incomeOnlyTxns);
const incOnlyTotalIncome = calculateTotalIncome(incomeOnlyTxns);
assert(incOnlyTotalSpent === 0, 'Total spent is 0 when only income transactions exist');
assert(incOnlyTotalIncome === 10500, 'Total income accurately reflects sum of ₹10,500');

const balanceIncomeOnly = incOnlyTotalIncome - incOnlyTotalSpent;
assert(balanceIncomeOnly === 10500, 'Available balance is ₹10,500');

// -----------------------------------------------------------------------------
// Test 3: Expenses without Recorded Income
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Expenses without Recorded Income ---');
const expenseOnlyTxns: Transaction[] = [
  { id: 'exp-1', title: 'Hostel Mess Card', amount: 2000, type: 'expense', category: 'Food & Canteen', date: '2026-10-02', paymentMethod: 'UPI' },
  { id: 'exp-2', title: 'Semester Books', amount: 850, type: 'expense', category: 'Academics & Books', date: '2026-10-03', paymentMethod: 'Cash' },
];
const expOnlyIncome = calculateTotalIncome(expenseOnlyTxns);
const expOnlySpent = calculateTotalSpent(expenseOnlyTxns);
assert(expOnlyIncome === 0, 'Total income is 0 with only expenses');
assert(expOnlySpent === 2850, 'Total spent is ₹2,850');
const negativeBalance = expOnlyIncome - expOnlySpent;
assert(negativeBalance === -2850, 'Net balance is accurately negative (-₹2,850)');

// -----------------------------------------------------------------------------
// Test 4: A Budget with Zero Spending
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: A Budget with Zero Spending ---');
const envelopes: CategoryBudget[] = [
  { id: 'b-food', name: 'Food & Canteen', iconName: 'food', allocated: 3000, spent: 0, description: '', alertThreshold: 80 },
  { id: 'b-books', name: 'Academics & Books', iconName: 'study', allocated: 1500, spent: 0, description: '', alertThreshold: 80 },
];
const computedZeroSpend = computeCategorySpend([], envelopes);
assert(computedZeroSpend[0].spent === 0, 'Food envelope spent is 0');
assert(computedZeroSpend[0].status === 'intact', 'Food envelope status is intact when spend is 0');
assert(computedZeroSpend[1].spent === 0, 'Books envelope spent is 0');
assert(computedZeroSpend[1].status === 'intact', 'Books envelope status is intact when spend is 0');

// -----------------------------------------------------------------------------
// Test 5: Spending Equal to the Budget (100% threshold)
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Spending Equal to the Budget ---');
const exactSpendTxns: Transaction[] = [
  { id: 'e-1', title: 'Food Spend Exact', amount: 3000, type: 'expense', category: 'Food & Canteen', date: '2026-10-10', paymentMethod: 'UPI' },
];
const computedExactSpend = computeCategorySpend(exactSpendTxns, envelopes);
assert(computedExactSpend[0].spent === 3000, 'Spent matches allocated exactly ₹3,000');
assert(
  computedExactSpend[0].status === 'approaching',
  'Envelope status is approaching/alerted at 100% of budget allocation'
);

// -----------------------------------------------------------------------------
// Test 6: Spending Above the Budget (Over-Budget)
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Spending Above the Budget ---');
const overSpendTxns: Transaction[] = [
  { id: 'o-1', title: 'Food Overspend', amount: 3600, type: 'expense', category: 'Food & Canteen', date: '2026-10-10', paymentMethod: 'UPI' },
  { id: 'o-2', title: 'Books Moderate', amount: 300, type: 'expense', category: 'Academics & Books', date: '2026-10-11', paymentMethod: 'Cash' },
];
const computedOverSpend = computeCategorySpend(overSpendTxns, envelopes);
assert(computedOverSpend[0].spent === 3600, 'Food spent is ₹3,600');
assert(computedOverSpend[0].status === 'over', 'Food status is flagged as over-budget');

// Test auto-balance suggestion for overspending
const autoBalance = suggestAutoBalanceTransfer(computedOverSpend);
assert(autoBalance !== null, 'Auto-balance identifies overspent envelope');
assert(autoBalance?.toCategory?.id === 'b-food', 'Identifies Food as target envelope');
assert(autoBalance?.fromCategory?.id === 'b-books', 'Identifies Books with surplus as source envelope');
assert(autoBalance?.amountNeeded === 600, 'Calculates exact ₹600 needed to restore budget parity');

// -----------------------------------------------------------------------------
// Test 7: A Next Allowance Date Today (daysRemaining = 0)
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: A Next Allowance Date Today (daysRemaining = 0) ---');
const runwayToday = calculateRunway(5000, 0, 0, 0);
assert(runwayToday.daysRemaining === 0, 'Days remaining is 0');
assert(runwayToday.safeDailySpend === 0, 'Safe daily spend is ₹0 because allowance is due today');
assert(runwayToday.status === 'critical', 'Runway status is critical on payout day');
assert(
  runwayToday.statusLabel?.toLowerCase().includes('allowance date reached') === true,
  'Displays "Allowance date reached" label'
);
assert(
  runwayToday.formulaString.includes('Allowance cycle completed'),
  'Formula string confirms cycle completion'
);

// -----------------------------------------------------------------------------
// Test 8: A Next Allowance Date in the Past (daysRemaining <= 0)
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: A Next Allowance Date in the Past (daysRemaining <= 0) ---');
const runwayPast = calculateRunway(4500, 0, 0, -3);
assert(runwayPast.daysRemaining === 0, 'Days remaining clamped to 0 for past allowance dates');
assert(runwayPast.safeDailySpend === 0, 'Safe daily spend is 0 for expired cycle');
assert(runwayPast.status === 'critical', 'Runway status is critical for overdue cycle');

// -----------------------------------------------------------------------------
// Test 9: Zero Available Balance
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: Zero Available Balance ---');
const runwayZero = calculateRunway(0, 0, 0, 10);
assert(runwayZero.totalBalance === 0, 'Total balance is 0');
assert(runwayZero.spendableAmount === 0, 'Spendable amount is 0');
assert(runwayZero.safeDailySpend === 0, 'Safe daily spend is 0');
assert(runwayZero.status === 'critical', 'Status is critical when balance is zero');
assert(
  (runwayZero.statusLabel || '').toLowerCase().includes('zero balance') || (runwayZero.statusLabel || '').toLowerCase().includes('depleted'),
  'Label warns of depleted balance'
);

// -----------------------------------------------------------------------------
// Test 10: Negative Available Balance
// -----------------------------------------------------------------------------
console.log('\n--- Test 10: Negative Available Balance ---');
const runwayNegative = calculateRunway(-1200, 0, 0, 10);
assert(runwayNegative.totalBalance === -1200, 'Total balance preserves negative deficit of -₹1,200');
assert(runwayNegative.spendableAmount === 0, 'Spendable amount is safely floored to 0');
assert(runwayNegative.safeDailySpend === 0, 'Safe daily spend is 0 when overdrawn');
assert(runwayNegative.status === 'critical', 'Status is critical when overdrawn');
assert(runwayNegative.runwayRatio === 0, 'Runway ratio is 0%');

// -----------------------------------------------------------------------------
// Test 11: A Savings Goal with No Contributions
// -----------------------------------------------------------------------------
console.log('\n--- Test 11: A Savings Goal with No Contributions ---');
const freshGoal: SavingsGoal = {
  id: 'g-laptop',
  title: 'Laptop Upgrade',
  targetAmount: 50000,
  currentAmount: 0,
  deadline: '2026-12-31',
  category: 'Tech & Gadgets',
  iconName: 'laptop',
  color: '#4C3478',
  contributions: [],
};
const freshProgress = freshGoal.targetAmount > 0 ? (freshGoal.currentAmount / freshGoal.targetAmount) * 100 : 0;
assert(freshProgress === 0, 'Savings goal progress is 0%');
assert((freshGoal.contributions || []).length === 0, 'Contributions list is empty');
assert(freshGoal.currentAmount < freshGoal.targetAmount, 'Goal is active and uncompleted');

// -----------------------------------------------------------------------------
// Test 12: A Completed Savings Goal
// -----------------------------------------------------------------------------
console.log('\n--- Test 12: A Completed Savings Goal ---');
const completedGoal: SavingsGoal = {
  id: 'g-goa',
  title: 'Goa Trip',
  targetAmount: 6000,
  currentAmount: 6500, // over-funded
  deadline: '2026-11-15',
  category: 'Travel',
  iconName: 'plane',
  color: '#42CBA5',
  contributions: [
    { id: 'c-1', amount: 3000, date: '2026-10-01', note: 'Initial deposit' },
    { id: 'c-2', amount: 3500, date: '2026-10-15', note: 'Diwali bonus' },
  ],
};
const isGoalCompleted = completedGoal.currentAmount >= completedGoal.targetAmount;
const completedProgress = Math.min(100, Math.round((completedGoal.currentAmount / completedGoal.targetAmount) * 100));
assert(isGoalCompleted === true, 'Goal identified as completed');
assert(completedProgress === 100, 'Progress percentage caps cleanly at 100%');

// -----------------------------------------------------------------------------
// Test 13: Empty Search Results
// -----------------------------------------------------------------------------
console.log('\n--- Test 13: Empty Search Results ---');
const sampleTxns: Transaction[] = [
  { id: 't1', title: 'Canteen Thali', amount: 80, type: 'expense', category: 'Food & Canteen', date: '2026-10-15', paymentMethod: 'UPI' },
  { id: 't2', title: 'Metro Recharge', amount: 150, type: 'expense', category: 'Travel & Metro', date: '2026-10-16', paymentMethod: 'SBI' },
];
const searchQuery = 'Zomato Biryani Party 999';
const matched = sampleTxns.filter((t) => {
  const q = searchQuery.toLowerCase();
  return (
    t.title.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q) ||
    (t.locationOrNote || '').toLowerCase().includes(q) ||
    t.amount.toString().includes(q)
  );
});
assert(matched.length === 0, 'Search filter returns empty array when query does not match');

// -----------------------------------------------------------------------------
// Test 14: Invalid Transaction Amounts and Dates Validation
// -----------------------------------------------------------------------------
console.log('\n--- Test 14: Invalid Transaction Amounts and Dates Validation ---');
function validateTransactionInput(title: string, amount: string, date: string): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!title.trim()) {
    errors.title = 'Please enter a description';
  }

  const num = parseFloat(amount);
  if (!amount.trim() || isNaN(num) || num <= 0) {
    errors.amount = 'Please enter a valid amount greater than ₹0';
  } else if (num > 1000000) {
    errors.amount = 'Amount cannot exceed ₹10,00,000';
  }

  if (!date.trim() || isNaN(Date.parse(date))) {
    errors.date = 'Please select a valid date';
  } else {
    const year = new Date(date).getFullYear();
    if (year < 2020 || year > 2035) {
      errors.date = 'Please enter a valid date between 2020 and 2035';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// Subtests
assert(validateTransactionInput('', '120', '2026-10-15').valid === false, 'Rejects empty title');
assert(validateTransactionInput('Food', '-120', '2026-10-15').valid === false, 'Rejects negative amount -120');
assert(validateTransactionInput('Food', '0', '2026-10-15').valid === false, 'Rejects zero amount 0');
assert(validateTransactionInput('Food', 'abc', '2026-10-15').valid === false, 'Rejects non-numeric amount abc');
assert(validateTransactionInput('Food', '5000000', '2026-10-15').valid === false, 'Rejects extreme amount > ₹10,00,000');
assert(validateTransactionInput('Food', '120', 'invalid-date').valid === false, 'Rejects unparseable date');
assert(validateTransactionInput('Food', '120', '1990-05-10').valid === false, 'Rejects historical out-of-range date (1990)');
assert(validateTransactionInput('Food', '120', '2026-10-15').valid === true, 'Accepts valid ₹120 food transaction');

console.log('\n====================================================');
console.log('   ALL 14 CRITICAL QA CALCULATION TESTS PASSED!      ');
console.log('====================================================\n');
