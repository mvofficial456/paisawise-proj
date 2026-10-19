import { Transaction } from '../types/finance.ts';

/**
 * Exports transactions as an RFC 4180 compliant CSV file.
 * Handles commas, double-quotes, newlines, and Indian Rupee amounts properly.
 */
export const exportTransactionsToCSV = (transactions: Transaction[], filename?: string): void => {
  const headers = [
    'Transaction ID',
    'Date',
    'Time',
    'Title',
    'Type',
    'Category',
    'Amount (INR)',
    'Payment Method',
    'Split With',
    'Split Amount Per Person',
    'Notes / Location',
    'Tags',
  ];

  const escapeCSV = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) {
      return '""';
    }
    const stringValue = String(value);
    // RFC 4180: If field contains comma, quote, or newline, escape inner quotes with double quotes and wrap in quotes
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = transactions.map((t) => [
    escapeCSV(t.id),
    escapeCSV(t.date),
    escapeCSV(t.time || ''),
    escapeCSV(t.title),
    escapeCSV(t.type),
    escapeCSV(t.category),
    escapeCSV(t.amount),
    escapeCSV(t.paymentMethod),
    escapeCSV(t.splitWith && t.splitWith.length > 0 ? t.splitWith.join('; ') : ''),
    escapeCSV(t.splitAmountPerPerson !== undefined ? t.splitAmountPerPerson : ''),
    escapeCSV(t.locationOrNote || ''),
    escapeCSV(t.tags && t.tags.length > 0 ? t.tags.join('; ') : ''),
  ]);

  const csvRows = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((r) => r.join(',')),
  ];

  const csvContent = '\uFEFF' + csvRows.join('\r\n'); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');

  const defaultFilename = `PaisaWise_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
  downloadLink.setAttribute('href', url);
  downloadLink.setAttribute('download', filename || defaultFilename);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
};
