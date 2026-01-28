export interface Category {
  id: string;
  type: string;
  name: string;
  created_at?: string;
}

export interface CategoryFormData {
  type: string;
  name: string;
}
