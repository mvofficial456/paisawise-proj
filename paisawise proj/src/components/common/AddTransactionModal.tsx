import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  FileText,
  Tag,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Train,
  ShoppingBag,
  BookOpen,
  Home,
  Film,
  HeartPulse,
  Tv,
  MoreHorizontal,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { CategoryKey, TransactionType } from '../../types/finance.ts';

export const CATEGORY_OPTIONS: {
  key: CategoryKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}[] = [
  { key: 'Food', label: 'Food', icon: Utensils, color: '#4C3478', bg: '#EDE7FF' },
  { key: 'Travel', label: 'Travel', icon: Train, color: '#8B6FE8', bg: '#F1EDFA' },
  { key: 'Shopping', label: 'Shopping', icon: ShoppingBag, color: '#A48BF0', bg: '#EDE7FF' },
  { key: 'Education', label: 'Education', icon: BookOpen, color: '#7E57C2', bg: '#EDE7FF' },
  { key: 'Hostel/Rent', label: 'Hostel/Rent', icon: Home, color: '#6A4C9C', bg: '#F1EDFA' },
  { key: 'Entertainment', label: 'Entertainment', icon: Film, color: '#8B6FE8', bg: '#EDE7FF' },
  { key: 'Health', label: 'Health', icon: HeartPulse, color: '#E56B75', bg: '#FDECEE' },
  { key: 'Subscriptions', label: 'Subscriptions', icon: Tv, color: '#5C3E8A', bg: '#EDE7FF' },
  { key: 'Other', label: 'Other', icon: MoreHorizontal, color: '#777187', bg: '#F7F5FC' },
  { key: 'Income', label: 'Income', icon: Wallet, color: '#42CBA5', bg: '#E5F8F1' },
];

export const PAYMENT_METHOD_OPTIONS = [
  'UPI / QR (GPay / PhonePe / Paytm)',
  'Cash',
  'Debit Card',
  'SBI / Net Banking',
  'Auto-Debit',
  'Other',
];

export const AddTransactionModal: React.FC = () => {
  const {
    isAddModalOpen,
    closeTransactionModal,
    editingTransaction,
    addTransaction,
    editTransaction,
  } = useFinance();

  const isEditing = Boolean(editingTransaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<CategoryKey>('Food');
  const [date, setDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHOD_OPTIONS[0]);
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or editing target changes
  useEffect(() => {
    if (isAddModalOpen) {
      setSuccessMsg(null);
      setErrors({});
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmount(editingTransaction.amount.toString());
        setTitle(editingTransaction.title);
        setCategory(editingTransaction.category);
        setDate(editingTransaction.date);
        setPaymentMethod(editingTransaction.paymentMethod || PAYMENT_METHOD_OPTIONS[0]);
        setNotes(editingTransaction.locationOrNote || '');
      } else {
        // Defaults for adding
        setType('expense');
        setAmount('');
        setTitle('');
        setCategory('Food');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod(PAYMENT_METHOD_OPTIONS[0]);
        setNotes('');
      }
    }
  }, [isAddModalOpen, editingTransaction]);

  if (!isAddModalOpen) return null;

  const handleAmountPreset = (increment: number) => {
    const current = parseFloat(amount) || 0;
    const next = current + increment;
    setAmount(next.toString());
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: '' }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = 'Please enter a description (e.g., Canteen Thali, Metro Recharge)';
    }

    const numAmount = parseFloat(amount);
    if (!amount.trim() || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than ₹0';
    } else if (numAmount > 1000000) {
      errs.amount = 'Amount cannot exceed ₹10,00,000';
    }

    if (!date.trim() || isNaN(Date.parse(date))) {
      errs.date = 'Please select a valid date';
    } else {
      const year = new Date(date).getFullYear();
      if (year < 2020 || year > 2035) {
        errs.date = 'Please enter a valid date between 2020 and 2035';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedAmount = parseFloat(amount);

    if (isEditing && editingTransaction) {
      editTransaction(editingTransaction.id, {
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: type === 'income' && category !== 'Income' ? 'Income' : category,
        date,
        paymentMethod,
        locationOrNote: notes.trim() || undefined,
      });
      setSuccessMsg('Transaction updated successfully!');
    } else {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      addTransaction({
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: type === 'income' && category !== 'Income' ? 'Income' : category,
        paymentMethod,
        date,
        time: timeStr,
        locationOrNote: notes.trim() || undefined,
        tags: [category, type === 'income' ? 'Income' : 'Expense'],
      });
      setSuccessMsg('Transaction recorded successfully!');
    }

    setTimeout(() => {
      setSuccessMsg(null);
      closeTransactionModal();
    }, 450);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#00261e]/50 backdrop-blur-sm overflow-y-auto"
      onClick={closeTransactionModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-form-title"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 my-6 border border-[#e1ebe1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#f2fcf2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#123d32] text-white flex items-center justify-center shadow-xs">
              {type === 'income' ? (
                <ArrowDownLeft className="w-5 h-5 text-[#83f9c5]" />
              ) : (
                <IndianRupee className="w-5 h-5 text-[#83f9c5]" />
              )}
            </div>
            <div>
              <h2 id="transaction-form-title" className="font-extrabold text-lg text-[#00261e] tracking-tight">
                {isEditing ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <p className="text-xs text-[#69746d]">
                {isEditing
                  ? 'Update transaction record in your campus ledger'
                  : 'Record campus expenses or pocket money inflows'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeTransactionModal}
            className="w-9 h-9 rounded-full bg-[#f2fcf2] text-[#414845] hover:text-[#00261e] hover:bg-[#e1ebe1] flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-[#ecf6ed] border border-[#83f9c5] text-[#006c4c] flex items-center gap-2.5 text-xs font-bold animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#006c4c]" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4 text-xs">
          {/* 1. Transaction Type Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#69746d]">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#f2fcf2] border border-[#e1ebe1]">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  if (category === 'Income') setCategory('Food');
                }}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  type === 'expense'
                    ? 'bg-white text-[#ba1a1a] shadow-xs'
                    : 'text-[#414845] hover:text-[#00261e]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-[#ba1a1a]" />
                <span>Expense (Spend)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('Income');
                }}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  type === 'income'
                    ? 'bg-white text-[#006c4c] shadow-xs'
                    : 'text-[#414845] hover:text-[#00261e]'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-[#006c4c]" />
                <span>Income (Inflow)</span>
              </button>
            </div>
          </div>

          {/* 2. Amount in INR */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="txn-amount" className="text-[11px] font-bold uppercase tracking-wider text-[#69746d]">
                Amount (INR)*
              </label>
              {/* Quick Presets for Expense */}
              {type === 'expense' && (
                <div className="flex items-center gap-1">
                  {[50, 100, 200, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleAmountPreset(val)}
                      className="px-2 py-0.5 rounded-md bg-[#f2fcf2] hover:bg-[#e1ebe1] text-[#006c4c] text-[10px] font-bold border border-[#e1ebe1] transition-colors"
                    >
                      +₹{val}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-[#69746d]">
                ₹
              </span>
              <input
                id="txn-amount"
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                placeholder="0.00"
                className={`w-full h-11 pl-8 pr-4 rounded-xl bg-[#f2fcf2] text-sm font-bold text-[#151e18] placeholder:text-[#717975] focus:outline-none focus:ring-2 focus:ring-[#123d32] border transition-all ${
                  errors.amount ? 'border-[#ba1a1a] bg-[#ffdad6]/20' : 'border-[#e1ebe1]'
                }`}
              />
            </div>
            {errors.amount && (
              <span className="text-[11px] font-semibold text-[#ba1a1a] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.amount}
              </span>
            )}
          </div>

          {/* 3. Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="txn-desc" className="text-[11px] font-bold uppercase tracking-wider text-[#69746d]">
              Description / Title*
            </label>
            <input
              id="txn-desc"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder={type === 'expense' ? 'e.g. Canteen Lunch, Xerox prints, Metro pass' : 'e.g. Monthly Pocket Money from Dad, Freelance stiped'}
              className={`w-full h-11 px-3.5 rounded-xl bg-[#f2fcf2] text-xs md:text-sm text-[#151e18] placeholder:text-[#717975] focus:outline-none focus:ring-2 focus:ring-[#123d32] border transition-all ${
                errors.title ? 'border-[#ba1a1a] bg-[#ffdad6]/20' : 'border-[#e1ebe1]'
              }`}
            />
            {errors.title && (
              <span className="text-[11px] font-semibold text-[#ba1a1a] flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.title}
              </span>
            )}
          </div>

          {/* 4. Category Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#69746d]">
              Category*
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setCategory(cat.key);
                      if (cat.key === 'Income') setType('income');
                      else if (type === 'income') setType('expense');
                    }}
                    className={`p-2 rounded-xl flex items-center gap-2 border text-left transition-all ${
                      isSelected
                        ? 'bg-[#123d32] text-white border-[#123d32] shadow-xs'
                        : 'bg-[#f2fcf2] text-[#414845] border-[#e1ebe1] hover:bg-[#e1ebe1]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#83f9c5]' : 'text-[#006c4c]'}`} />
                    <span className="text-[11px] font-bold truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="txn-date" className="text-[11px] font-bold uppercase tracking-wider text-[#69746d] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#006c4c]" />
                <span>Date*</span>
              </label>
              <input
                id="txn-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                }}
                className={`w-full h-10 px-3 rounded-xl bg-[#f2fcf2] text-xs font-semibold text-[#151e18] focus:outline-none focus:ring-2 focus:ring-[#123d32] border transition-all ${
                  errors.date ? 'border-[#ba1a1a]' : 'border-[#e1ebe1]'
                }`}
              />
              {errors.date && (
                <span className="text-[10px] font-semibold text-[#ba1a1a]">
                  {errors.date}
                </span>
              )}
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="txn-method" className="text-[11px] font-bold uppercase tracking-wider text-[#69746d] flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#006c4c]" />
                <span>Payment Method</span>
              </label>
              <select
                id="txn-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f2fcf2] text-xs font-semibold text-[#151e18] focus:outline-none focus:ring-2 focus:ring-[#123d32] border border-[#e1ebe1]"
              >
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 6. Optional Notes */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="txn-notes" className="text-[11px] font-bold uppercase tracking-wider text-[#69746d] flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#006c4c]" />
              <span>Optional Notes / Location</span>
            </label>
            <input
              id="txn-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Campus North Canteen, Split with Kabir, UPI ref 4098"
              className="w-full h-10 px-3 rounded-xl bg-[#f2fcf2] text-xs text-[#151e18] placeholder:text-[#717975] focus:outline-none focus:ring-2 focus:ring-[#123d32] border border-[#e1ebe1]"
            />
          </div>

          {/* Action Buttons: Cancel & Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f2fcf2]">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="h-10 px-4 rounded-xl bg-[#f2fcf2] hover:bg-[#e1ebe1] text-[#414845] font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-6 rounded-xl bg-[#123d32] hover:bg-[#00261e] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95"
            >
              {isEditing ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#83f9c5]" />
                  <span>Update Transaction</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#83f9c5]" />
                  <span>Save Transaction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
