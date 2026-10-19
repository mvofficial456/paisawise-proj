/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FinanceProvider } from './context/FinanceContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { TransactionsPage } from './pages/TransactionsPage.tsx';
import { BudgetsPage } from './pages/BudgetsPage.tsx';
import { InsightsPage } from './pages/InsightsPage.tsx';
import { GoalsPage } from './pages/GoalsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <FinanceProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="landing" element={<Navigate to="/dashboard" replace />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </FinanceProvider>
    </BrowserRouter>
  );
}
