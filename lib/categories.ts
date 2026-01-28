import { supabase } from './supabase';
import { Category, CategoryFormData } from '@/types/category';

export async function getCategories(type?: 'income' | 'expense') {
  let query = supabase.from('categories').select('*').order('name', { ascending: true });
  
  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Category[];
}

export async function addCategory(category: CategoryFormData) {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
