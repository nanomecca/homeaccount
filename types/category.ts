export interface Category {
  id: string;
  type: 'income' | 'expense';
  name: string;
  created_at?: string;
}

export interface CategoryFormData {
  type: 'income' | 'expense';
  name: string;
}
