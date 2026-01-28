import { supabase } from './supabase';
import { Transaction, TransactionFormData } from '@/types/transaction';
import { Category, CategoryFormData } from '@/types/category';
import { TransactionType, TransactionTypeFormData } from '@/types/transaction-type';
import { Asset, AssetFormData } from '@/types/asset';

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
    .order('main_category', { ascending: true })
    .order('name', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Category[];
}

// 대분류 목록 가져오기
export async function getMainCategories(type?: string) {
  let query = supabase
    .from('categories')
    .select('main_category, type')
    .order('main_category', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  // 중복 제거
  const uniqueMainCategories = [...new Set(data?.map(d => d.main_category) || [])];
  return uniqueMainCategories;
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

// 사용자 인증 관련 함수
import bcrypt from 'bcryptjs';

export async function loginUser(username: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, password')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 사용자를 찾을 수 없음
      return null;
    }
    throw error;
  }

  // 비밀번호 검증 (해시 비교)
  const isValidPassword = await bcrypt.compare(password, data.password);
  if (!isValidPassword) {
    return null;
  }

  return { id: data.id, username: data.username };
}

export async function changePassword(username: string, currentPassword: string, newPassword: string) {
  // 사용자 정보 가져오기
  const { data: user, error: checkError } = await supabase
    .from('users')
    .select('id, password')
    .eq('username', username)
    .single();

  if (checkError || !user) {
    return { success: false, message: '사용자를 찾을 수 없습니다.' };
  }

  // 현재 비밀번호 확인
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    return { success: false, message: '현재 비밀번호가 올바르지 않습니다.' };
  }

  // 새 비밀번호 해시화
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 비밀번호 업데이트
  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashedPassword, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (updateError) throw updateError;
  return { success: true, message: '비밀번호가 변경되었습니다.' };
}

// 비밀번호 해시화 함수 (초기 사용자 생성용)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Assets
export async function getAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Asset[];
}

export async function addAsset(asset: AssetFormData): Promise<Asset> {
  const { data, error } = await supabase
    .from('assets')
    .insert([asset])
    .select()
    .single();

  if (error) throw error;
  return data as Asset;
}

export async function updateAsset(id: string, asset: AssetFormData): Promise<Asset> {
  const { data, error } = await supabase
    .from('assets')
    .update({ ...asset, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Asset;
}

export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
