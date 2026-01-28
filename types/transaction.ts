export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at?: string;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date: string;
}
