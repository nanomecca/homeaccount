// 데이터베이스 어댑터 - Supabase 또는 로컬 PostgreSQL 선택
import { Transaction, TransactionFormData } from '@/types/transaction';
import { Category, CategoryFormData } from '@/types/category';
import { TransactionType, TransactionTypeFormData } from '@/types/transaction-type';
import { Asset, AssetFormData } from '@/types/asset';

// Supabase 함수들
import * as supabaseDb from './db';
// PostgreSQL 함수들
import * as postgresDb from './postgres';

const USE_LOCAL_POSTGRES = process.env.USE_LOCAL_POSTGRES === 'true';

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.getTransactions();
  }
  return supabaseDb.getTransactions();
}

export async function addTransaction(transaction: TransactionFormData): Promise<Transaction> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.addTransaction(transaction);
  }
  return supabaseDb.addTransaction(transaction);
}

export async function addTransactions(transactions: TransactionFormData[]): Promise<Transaction[]> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.addTransactions(transactions);
  }
  return supabaseDb.addTransactions(transactions);
}

export async function updateTransaction(id: string, transaction: TransactionFormData): Promise<Transaction> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.updateTransaction(id, transaction);
  }
  return supabaseDb.updateTransaction(id, transaction);
}

export async function deleteTransaction(id: string): Promise<void> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.deleteTransaction(id);
  }
  return supabaseDb.deleteTransaction(id);
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.getTransactionsByDateRange(startDate, endDate);
  }
  return supabaseDb.getTransactionsByDateRange(startDate, endDate);
}

// Categories
export async function getCategories(type?: string): Promise<Category[]> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.getCategories(type);
  }
  return supabaseDb.getCategories(type);
}

export async function addCategory(category: CategoryFormData): Promise<Category> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.addCategory(category);
  }
  return supabaseDb.addCategory(category);
}

export async function deleteCategory(id: string): Promise<void> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.deleteCategory(id);
  }
  return supabaseDb.deleteCategory(id);
}

export async function updateCategory(id: string, category: CategoryFormData): Promise<Category> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.updateCategory(id, category);
  }
  return supabaseDb.updateCategory(id, category);
}

export async function updateMainCategory(
  type: string,
  oldMainCategory: string,
  newMainCategory: string
): Promise<void> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.updateMainCategory(type, oldMainCategory, newMainCategory);
  }
  return supabaseDb.updateMainCategory(type, oldMainCategory, newMainCategory);
}

export async function updateSubCategory(id: string, newName: string): Promise<void> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.updateSubCategory(id, newName);
  }
  return supabaseDb.updateSubCategory(id, newName);
}

// Transaction Types
export async function getTransactionTypes(): Promise<TransactionType[]> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.getTransactionTypes();
  }
  return supabaseDb.getTransactionTypes();
}

export async function addTransactionType(type: TransactionTypeFormData): Promise<TransactionType> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.addTransactionType(type);
  }
  return supabaseDb.addTransactionType(type);
}

export async function updateTransactionType(id: string, type: TransactionTypeFormData): Promise<TransactionType> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.updateTransactionType(id, type);
  }
  return supabaseDb.updateTransactionType(id, type);
}

export async function deleteTransactionType(id: string): Promise<void> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.deleteTransactionType(id);
  }
  return supabaseDb.deleteTransactionType(id);
}

// Assets
export async function getAssets(): Promise<Asset[]> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.getAssets();
  }
  return supabaseDb.getAssets();
}

export async function addAsset(asset: AssetFormData): Promise<Asset> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.addAsset(asset);
  }
  return supabaseDb.addAsset(asset);
}

export async function updateAsset(id: string, asset: AssetFormData): Promise<Asset> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.updateAsset(id, asset);
  }
  return supabaseDb.updateAsset(id, asset);
}

export async function deleteAsset(id: string): Promise<void> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.deleteAsset(id);
  }
  return supabaseDb.deleteAsset(id);
}

export async function updateAssetStatus(id: string, status: 'active' | 'matured' | 'closed'): Promise<Asset> {
  if (USE_LOCAL_POSTGRES) {
    return postgresDb.updateAssetStatus(id, status);
  }
  return supabaseDb.updateAssetStatus(id, status);
}
