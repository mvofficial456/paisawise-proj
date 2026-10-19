import React, { useState } from 'react';
import {
  X,
  Users,
  Trash2,
  CheckCircle2,
  Calendar,
  CreditCard,
  FileText,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';

export const TransactionDetailDrawer: React.FC = () => {
  const {
    selectedTransactionForDrawer,
    setSelectedTransactionForDrawer,
    deleteTransaction,
    openEditModal,
  } = useFinance();

  const [splitFeedback, setSplitFeedback] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!selectedTransactionForDrawer) return null;

  const txn = selectedTransactionForDrawer;
  const isIncome = txn.type === 'income';

  const handleSplitClick = () => {
    setSplitFeedback(true);
    setTimeout(() => {
      setSplitFeedback(false);
      setSelectedTransactionForDrawer(null);
    }, 1000);
  };

  const handleDelete = () => {
    deleteTransaction(txn.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={() => setSelectedTransactionForDrawer(null)}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl border border-[#E9E4F2] flex flex-col gap-4 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar for mobile */}
        <div className="sm:hidden w-10 h-1 bg-[#E9E4F2] rounded-full mx-auto -mt-2 mb-1"></div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="inline-flex self-start px-2.5 py-0.5 rounded-full bg-[#EDE7FF] text-[#4C3478] text-xs font-bold mb-1 border border-[#E9E4F2]">
              {txn.category}
            </span>
            <h2 className="font-extrabold text-base md:text-lg text-[#29233A] truncate">
              {txn.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[#777187] mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-[#8B6FE8]" />
              <span>{txn.date} • {txn.time}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTransactionForDrawer(null)}
            className="w-8 h-8 rounded-full bg-[#F7F5FC] hover:bg-[#EDE7FF] text-[#777187] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Big Amount & Mode Banner */}
        <div className="p-4 rounded-2xl bg-[#F7F5FC] border border-[#E9E4F2] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777187]">
              Amount
            </span>
            <div
              className={`font-black text-2xl md:text-3xl tracking-tight mt-0.5 ${
                isIncome ? 'text-[#42CBA5]' : 'text-[#29233A]'
              }`}
            >
              {isIncome ? `+₹${txn.amount.toLocaleString('en-IN')}` : `-₹${txn.amount.toLocaleString('en-IN')}`}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777187]">
              Payment Mode
            </span>
            <div className="font-bold text-xs md:text-sm text-[#29233A] mt-0.5 flex items-center gap-1 justify-end">
              <CreditCard className="w-3.5 h-3.5 text-[#4C3478]" />
              <span>{txn.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Note / Campus Details */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#777187] flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-[#8B6FE8]" />
            <span>Campus Note / Description</span>
          </span>
          <div className="p-3.5 rounded-xl bg-[#EDE7FF] text-xs text-[#29233A] leading-relaxed border border-[#E9E4F2]">
            <p>{txn.locationOrNote || 'Campus spend recorded in student ledger.'}</p>
            {txn.isSplit && txn.splitWith && (
              <div className="mt-2 pt-2 border-t border-[#E9E4F2] text-[#4C3478] font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#4C3478]" />
                <span>Split with: {txn.splitWith.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm ? (
          <div className="p-3.5 rounded-2xl bg-[#FDECEE] border border-[#F8CAD0] flex flex-col gap-2.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-bold text-[#E56B75]">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#E56B75]" />
              <span>Are you sure you want to delete this log?</span>
            </div>
            <p className="text-[11px] text-[#777187]">
              This will remove ₹{txn.amount.toLocaleString('en-IN')} from your records and immediately recalculate your available balance.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-9 rounded-xl bg-white border border-[#E9E4F2] text-xs font-bold text-[#777187] hover:bg-[#EDE7FF] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 h-9 rounded-xl bg-[#E56B75] text-white text-xs font-bold hover:bg-[#D45660] transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        ) : (
          /* Action Buttons */
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setSelectedTransactionForDrawer(null);
                openEditModal(txn);
              }}
              className="h-11 px-3 rounded-full bg-[#EDE7FF] hover:bg-[#E9E4F2] text-[#4C3478] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-[#4C3478]" />
              <span>Edit Transaction</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-11 px-3 rounded-full bg-[#FDECEE] hover:bg-[#fbd0d5] text-[#E56B75] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Log</span>
            </button>
          </div>
        )}

        {/* Done / Dismiss Button */}
        <button
          type="button"
          onClick={() => setSelectedTransactionForDrawer(null)}
          className="h-11 w-full bg-[#4C3478] hover:bg-[#3B275F] text-white rounded-full font-bold text-xs md:text-sm active:scale-98 transition-all shadow-xs"
        >
          Close
        </button>
      </div>
    </div>
  );
};
