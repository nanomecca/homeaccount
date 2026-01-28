import { Pool } from 'pg';
import { Transaction, TransactionFormData } from '@/types/transaction';
import { Category, CategoryFormData } from '@/types/category';
import { TransactionType, TransactionTypeFormData } from '@/types/transaction-type';

// PostgreSQL 연결 풀 생성
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DATABASE || 'houseaccount',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `SELECT * FROM transactions 
       ORDER BY date DESC, created_at DESC`
    );
    return result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount),
    })) as Transaction[];
  } finally {
    client.release();
  }
}

export async function addTransaction(transaction: TransactionFormData): Promise<Transaction> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `INSERT INTO transactions (type, amount, category, description, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [transaction.type, transaction.amount, transaction.category, transaction.description || null, transaction.date]
    );
    return {
      ...result.rows[0],
      amount: parseFloat(result.rows[0].amount),
    } as Transaction;
  } finally {
    client.release();
  }
}

export async function addTransactions(transactions: TransactionFormData[]): Promise<Transaction[]> {
  const client = await getPool().connect();
  try {
    const results: Transaction[] = [];
    for (const transaction of transactions) {
      const result = await client.query(
        `INSERT INTO transactions (type, amount, category, description, date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [transaction.type, transaction.amount, transaction.category, transaction.description || null, transaction.date]
      );
      results.push({
        ...result.rows[0],
        amount: parseFloat(result.rows[0].amount),
      } as Transaction);
    }
    return results;
  } finally {
    client.release();
  }
}

export async function updateTransaction(id: string, transaction: TransactionFormData): Promise<Transaction> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `UPDATE transactions 
       SET type = $1, amount = $2, category = $3, description = $4, date = $5
       WHERE id = $6
       RETURNING *`,
      [transaction.type, transaction.amount, transaction.category, transaction.description || null, transaction.date, id]
    );
    return {
      ...result.rows[0],
      amount: parseFloat(result.rows[0].amount),
    } as Transaction;
  } finally {
    client.release();
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('DELETE FROM transactions WHERE id = $1', [id]);
  } finally {
    client.release();
  }
}

export async function getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `SELECT * FROM transactions 
       WHERE date >= $1 AND date <= $2
       ORDER BY date DESC, created_at DESC`,
      [startDate, endDate]
    );
    return result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount),
    })) as Transaction[];
  } finally {
    client.release();
  }
}

// Categories
export async function getCategories(type?: string): Promise<Category[]> {
  const client = await getPool().connect();
  try {
    let query = 'SELECT * FROM categories';
    const params: string[] = [];
    
    if (type) {
      query += ' WHERE type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await client.query(query, params.length > 0 ? params : undefined);
    return result.rows as Category[];
  } finally {
    client.release();
  }
}

export async function addCategory(category: CategoryFormData): Promise<Category> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `INSERT INTO categories (type, name)
       VALUES ($1, $2)
       ON CONFLICT (type, name) DO NOTHING
       RETURNING *`,
      [category.type, category.name]
    );
    
    if (result.rows.length === 0) {
      // 이미 존재하는 경우 조회
      const existing = await client.query(
        'SELECT * FROM categories WHERE type = $1 AND name = $2',
        [category.type, category.name]
      );
      return existing.rows[0] as Category;
    }
    
    return result.rows[0] as Category;
  } finally {
    client.release();
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('DELETE FROM categories WHERE id = $1', [id]);
  } finally {
    client.release();
  }
}

// Transaction Types
export async function getTransactionTypes(): Promise<TransactionType[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'SELECT * FROM transaction_types ORDER BY display_name ASC'
    );
    return result.rows as TransactionType[];
  } finally {
    client.release();
  }
}

export async function addTransactionType(type: TransactionTypeFormData): Promise<TransactionType> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `INSERT INTO transaction_types (name, display_name, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [type.name, type.display_name, type.color || null]
    );
    return result.rows[0] as TransactionType;
  } finally {
    client.release();
  }
}

export async function updateTransactionType(id: string, type: TransactionTypeFormData): Promise<TransactionType> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `UPDATE transaction_types 
       SET name = $1, display_name = $2, color = $3
       WHERE id = $4
       RETURNING *`,
      [type.name, type.display_name, type.color || null, id]
    );
    return result.rows[0] as TransactionType;
  } finally {
    client.release();
  }
}

export async function deleteTransactionType(id: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('DELETE FROM transaction_types WHERE id = $1', [id]);
  } finally {
    client.release();
  }
}
