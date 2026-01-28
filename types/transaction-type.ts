export interface TransactionType {
  id: string;
  name: string;
  color?: string;
  created_at?: string;
}

export interface TransactionTypeFormData {
  name: string;
  color?: string;
}
