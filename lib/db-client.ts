// 클라이언트에서 사용할 데이터베이스 함수들
// 로컬 PostgreSQL을 사용할 때는 API 라우트를 통해 접근
import { Transaction, TransactionFormData } from '@/types/transaction';
import { Category, CategoryFormData } from '@/types/category';

const USE_LOCAL_POSTGRES = process.env.NEXT_PUBLIC_USE_LOCAL_POSTGRES === 'true';
const API_BASE = '/api';

// 로컬 PostgreSQL 사용 시 API 라우트를 통해 접근
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Supabase 사용 시 직접 호출
import * as supabaseDb from './db';

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  if (USE_LOCAL_POSTGRES) {
    return apiRequest<Transaction[]>('/transactions');
  }
  return supabaseDb.getTransactions();
}

export async function addTransaction(transaction: TransactionFormData): Promise<Transaction> {
  if (USE_LOCAL_POSTGRES) {
    return apiRequest<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }
  return supabaseDb.addTransaction(transaction);
}

export async function addTransactions(transactions: TransactionFormData[]): Promise<Transaction[]> {
  if (USE_LOCAL_POSTGRES) {
    return apiRequest<Transaction[]>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactions),
    });
  }
  return supabaseDb.addTransactions(transactions);
}

export async function deleteTransaction(id: string): Promise<void> {
  if (USE_LOCAL_POSTGRES) {
    await apiRequest('/transactions?id=' + encodeURIComponent(id), {
      method: 'DELETE',
    });
    return;
  }
  return supabaseDb.deleteTransaction(id);
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  if (USE_LOCAL_POSTGRES) {
    return apiRequest<Transaction[]>(
      `/transactions?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );
  }
  return supabaseDb.getTransactionsByDateRange(startDate, endDate);
}

// Categories
export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  if (USE_LOCAL_POSTGRES) {
    const url = type ? `/categories?type=${encodeURIComponent(type)}` : '/categories';
    return apiRequest<Category[]>(url);
  }
  return supabaseDb.getCategories(type);
}

export async function addCategory(category: CategoryFormData): Promise<Category> {
  if (USE_LOCAL_POSTGRES) {
    return apiRequest<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }
  return supabaseDb.addCategory(category);
}

export async function deleteCategory(id: string): Promise<void> {
  if (USE_LOCAL_POSTGRES) {
    await apiRequest('/categories?id=' + encodeURIComponent(id), {
      method: 'DELETE',
    });
    return;
  }
  return supabaseDb.deleteCategory(id);
}
