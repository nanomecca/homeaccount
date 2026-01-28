export interface TransactionType {
  id: string;
  name: string;
  display_name: string;
  color?: string;
  created_at?: string;
}

export interface TransactionTypeFormData {
  name: string;
  display_name: string;
  color?: string;
}
