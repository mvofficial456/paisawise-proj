import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../common/AppSidebar.tsx';
import { AppHeader } from '../common/AppHeader.tsx';
import { BottomNav } from '../common/BottomNav.tsx';
import { AddTransactionModal } from '../common/AddTransactionModal.tsx';
import { TransactionDetailDrawer } from '../common/TransactionDetailDrawer.tsx';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F5FC] text-[#29233A] flex flex-col font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Main Shell Container */}
      <div className="flex-1 flex flex-col md:pl-72 min-h-screen">
        {/* Sticky App Header */}
        <AppHeader />

        {/* Page Content Viewport */}
        <main className="flex-1 w-full pt-16 md:pt-20 pb-24 md:pb-10 px-4 md:px-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals & Drawers */}
      <AddTransactionModal />
      <TransactionDetailDrawer />
    </div>
  );
};
