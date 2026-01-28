import { supabase } from './supabase';
import { Transaction, TransactionFormData } from '@/types/transaction';
import { Category, CategoryFormData } from '@/types/category';
import { TransactionType, TransactionTypeFormData } from '@/types/transaction-type';

export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

export async function addTransaction(transaction: TransactionFormData) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function addTransactions(transactions: TransactionFormData[]) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactions)
    .select();

  if (error) throw error;
  return data as Transaction[];
}

export async function updateTransaction(id: string, transaction: TransactionFormData) {
  const { data, error } = await supabase
    .from('transactions')
    .update(transaction)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getTransactionsByDateRange(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

// 카테고리 관련 함수
export async function getCategories(type?: string) {
  let query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

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

// 유형 관련 함수
export async function getTransactionTypes() {
  const { data, error } = await supabase
    .from('transaction_types')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) throw error;
  return data as TransactionType[];
}

export async function addTransactionType(type: TransactionTypeFormData) {
  const { data, error } = await supabase
    .from('transaction_types')
    .insert([type])
    .select()
    .single();

  if (error) throw error;
  return data as TransactionType;
}

export async function updateTransactionType(id: string, type: TransactionTypeFormData) {
  const { data, error } = await supabase
    .from('transaction_types')
    .update(type)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TransactionType;
}

export async function deleteTransactionType(id: string) {
  const { error } = await supabase
    .from('transaction_types')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
