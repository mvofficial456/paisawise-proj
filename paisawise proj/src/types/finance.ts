export type TransactionType = 'expense' | 'income';

export type CategoryKey = 
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Education'
  | 'Hostel/Rent'
  | 'Entertainment'
  | 'Health'
  | 'Subscriptions'
  | 'Other'
  | 'Income'
  | 'Food & Canteen'
  | 'Academics & Books'
  | 'Travel & Metro'
  | 'Hostel & Utilities'
  | 'Entertainment & OTT'
  | 'Medical & Health'
  | 'Tech & Gadgets'
  | 'Monthly Allowance';

export interface Transaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: TransactionType;
  category: CategoryKey;
  paymentMethod: string; // 'GPay UPI' | 'PhonePe' | 'Paytm UPI' | 'Cash' | 'SBI Bank Transfer' | 'Auto-Debit'
  date: string; // YYYY-MM-DD
  time?: string; // e.g. '01:40 PM'
  locationOrNote?: string;
  notes?: string;
  isSplit?: boolean;
  splitWith?: string[]; // ['Kabir', 'Aryan']
  splitAmountPerPerson?: number;
  tags?: string[];
}

export interface CategoryBudget {
  id: string;
  name: CategoryKey;
  category?: CategoryKey;
  iconName: string;
  allocated: number;
  limit?: number;
  spent: number;
  description?: string;
  period?: 'monthly' | 'weekly' | 'custom';
  startDate?: string;
  alertThreshold?: number; // e.g. 80 for 80%
  month?: string; // e.g. '2026-10'
  isLocked?: boolean;
  status?: 'optimal' | 'healthy' | 'approaching' | 'over' | 'intact' | 'unfunded';
}

export type Budget = CategoryBudget;

export interface GoalContribution {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  paymentMethod?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  name?: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  targetDate?: string;
  category: string;
  iconName: string;
  color: string;
  note?: string;
  isDemo?: boolean;
  createdAt?: string;
  status?: 'active' | 'completed';
  contributions?: GoalContribution[];
}

export interface StudentProfile {
  name: string;
  semester: string;
  major: string;
  college: string;
  campusDay: number;
  monthlyAllowance: number;
  allowanceDayOfMonth: number;
  allowanceFrequency?: 'monthly' | 'weekly' | 'custom';
  nextAllowanceDate?: string;
  fixedDues: number;
  safetyBuffer: number;
  monthLabel: string;
  avatarUrl?: string;
}

export type AppSettings = StudentProfile;

export interface RunwayCalculation {
  totalBalance: number;
  fixedDues: number;
  safetyBuffer: number;
  daysRemaining: number;
  spendableAmount: number;
  safeDailySpend: number;
  formulaString: string;
  status: 'safe' | 'caution' | 'critical';
  statusLabel?: string;
  runwayRatio: number;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface NotificationPreferences {
  budgetThresholdAlert: boolean;
  overBudgetAlert: boolean;
  allowanceReminder: boolean;
  savingsMilestoneAlert: boolean;
}

export interface UserPreferences {
  theme: ThemePreference;
  defaultAlertThreshold: number;
  monthStartPreference: 'calendar' | 'allowance_day' | 'weekly';
  notifications: NotificationPreferences;
}
