export interface BudgetPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  iconName: string;
  percentages: Record<string, number>;
}

export const BUDGET_PRESETS: BudgetPreset[] = [
  {
    id: 'preset-balanced',
    name: 'Balanced Student',
    tagline: '50/30/20 Campus Edition',
    description: 'A well-rounded budget balancing canteen meals, metro travel, coursework essentials, and weekend leisure.',
    badge: 'Recommended',
    iconName: 'Scale',
    percentages: {
      food: 35,
      travel: 20,
      education: 15,
      hostel: 15,
      entertainment: 10,
      other: 5,
    },
  },
  {
    id: 'preset-frugal',
    name: 'Campus Saver',
    tagline: 'Essentials & Mess First',
    description: 'Prioritizes daily food and essential study materials while keeping discretionary outings and shopping strictly minimal.',
    badge: 'Max Savings',
    iconName: 'ShieldCheck',
    percentages: {
      food: 45,
      education: 25,
      travel: 15,
      hostel: 10,
      entertainment: 5,
      other: 0,
    },
  },
  {
    id: 'preset-social',
    name: 'Active Campus Life',
    tagline: 'Clubs, Events & Hangouts',
    description: 'Allocates extra breathing room for campus club activities, hackathon travel, cafe group work, and weekend outings.',
    badge: 'Social & Events',
    iconName: 'PartyPopper',
    percentages: {
      food: 30,
      travel: 25,
      entertainment: 20,
      education: 15,
      hostel: 10,
      other: 0,
    },
  },
  {
    id: 'preset-exam',
    name: 'Exam & Project Sprint',
    tagline: 'Mid-terms & Lab Submissions',
    description: 'Shifts resources toward photocopies, reference textbooks, stationery, software subscriptions, and late-night study chai.',
    badge: 'Exam Season',
    iconName: 'BookMarked',
    percentages: {
      education: 35,
      food: 35,
      travel: 10,
      hostel: 10,
      entertainment: 5,
      other: 5,
    },
  },
  {
    id: 'preset-equal',
    name: 'Equal Division',
    tagline: 'Even Split Across All Categories',
    description: 'Distributes 100% of the allowance uniformly across all your active category envelopes for an unbiased baseline.',
    badge: 'Uniform',
    iconName: 'Equal',
    percentages: {},
  },
];
