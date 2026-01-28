export interface Category {
  id: string;
  type: string;
  main_category: string;
  name: string;
  created_at?: string;
}

export interface CategoryFormData {
  type: string;
  main_category: string;
  name: string;
}
