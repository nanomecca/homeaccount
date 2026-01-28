import { Pool } from 'pg';
import { Transaction, TransactionFormData } from '@/types/transaction';
import { Category, CategoryFormData } from '@/types/category';
import { TransactionType, TransactionTypeFormData } from '@/types/transaction-type';
import { Asset, AssetFormData } from '@/types/asset';

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
      `INSERT INTO transactions (type, amount, category, main_category, description, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [transaction.type, transaction.amount, transaction.category, transaction.main_category || null, transaction.description || null, transaction.date]
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
        `INSERT INTO transactions (type, amount, category, main_category, description, date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [transaction.type, transaction.amount, transaction.category, transaction.main_category || null, transaction.description || null, transaction.date]
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
       SET type = $1, amount = $2, category = $3, main_category = $4, description = $5, date = $6
       WHERE id = $7
       RETURNING *`,
      [transaction.type, transaction.amount, transaction.category, transaction.main_category || null, transaction.description || null, transaction.date, id]
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
      `INSERT INTO categories (type, main_category, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (type, main_category, name) DO NOTHING
       RETURNING *`,
      [category.type, category.main_category, category.name]
    );
    
    if (result.rows.length === 0) {
      // 이미 존재하는 경우 조회
      const existing = await client.query(
        'SELECT * FROM categories WHERE type = $1 AND main_category = $2 AND name = $3',
        [category.type, category.main_category, category.name]
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

export async function updateCategory(id: string, category: CategoryFormData): Promise<Category> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `UPDATE categories 
       SET type = $1, main_category = $2, name = $3
       WHERE id = $4
       RETURNING *`,
      [category.type, category.main_category, category.name, id]
    );
    return result.rows[0] as Category;
  } finally {
    client.release();
  }
}

// 대분류 이름 변경 (해당 유형의 모든 카테고리와 거래 업데이트)
export async function updateMainCategory(
  type: string,
  oldMainCategory: string,
  newMainCategory: string
): Promise<void> {
  const client = await getPool().connect();
  try {
    // 트랜잭션 시작
    await client.query('BEGIN');
    
    // categories 테이블의 main_category 업데이트
    await client.query(
      `UPDATE categories 
       SET main_category = $1
       WHERE type = $2 AND main_category = $3`,
      [newMainCategory, type, oldMainCategory]
    );

    // transactions 테이블의 main_category 업데이트
    await client.query(
      `UPDATE transactions 
       SET main_category = $1
       WHERE type = $2 AND main_category = $3`,
      [newMainCategory, type, oldMainCategory]
    );

    // 트랜잭션 커밋
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 소분류 이름 변경 (해당 카테고리와 거래 업데이트)
export async function updateSubCategory(
  id: string,
  newName: string
): Promise<void> {
  const client = await getPool().connect();
  try {
    // 카테고리 정보 가져오기
    const categoryResult = await client.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      throw new Error('Category not found');
    }

    const category = categoryResult.rows[0];
    const { type, name: oldName } = category;

    // 트랜잭션 시작
    await client.query('BEGIN');

    // categories 테이블의 name 업데이트
    await client.query(
      `UPDATE categories 
       SET name = $1
       WHERE id = $2`,
      [newName, id]
    );

    // transactions 테이블의 category 업데이트
    await client.query(
      `UPDATE transactions 
       SET category = $1
       WHERE type = $2 AND category = $3`,
      [newName, type, oldName]
    );

    // 트랜잭션 커밋
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Transaction Types
export async function getTransactionTypes(): Promise<TransactionType[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'SELECT * FROM transaction_types ORDER BY name ASC'
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
      `INSERT INTO transaction_types (name, color)
       VALUES ($1, $2)
       RETURNING *`,
      [type.name, type.color || null]
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
       SET name = $1, color = $2
       WHERE id = $3
       RETURNING *`,
      [type.name, type.color || null, id]
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

// Assets
export async function getAssets(): Promise<Asset[]> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `SELECT * FROM assets 
       ORDER BY created_at DESC`
    );
    return result.rows as Asset[];
  } finally {
    client.release();
  }
}

export async function addAsset(asset: AssetFormData): Promise<Asset> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `INSERT INTO assets (type, bank_name, amount, interest_rate, maturity_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [asset.type, asset.bank_name, asset.amount, asset.interest_rate, asset.maturity_date]
    );
    return result.rows[0] as Asset;
  } finally {
    client.release();
  }
}

export async function updateAsset(id: string, asset: AssetFormData): Promise<Asset> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `UPDATE assets 
       SET type = $1, bank_name = $2, amount = $3, interest_rate = $4, maturity_date = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [asset.type, asset.bank_name, asset.amount, asset.interest_rate, asset.maturity_date, id]
    );
    return result.rows[0] as Asset;
  } finally {
    client.release();
  }
}

export async function deleteAsset(id: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('DELETE FROM assets WHERE id = $1', [id]);
  } finally {
    client.release();
  }
}

export async function updateAssetStatus(id: string, status: 'active' | 'matured' | 'closed'): Promise<Asset> {
  const client = await getPool().connect();
  try {
    const result = await client.query(
      `UPDATE assets 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0] as Asset;
  } finally {
    client.release();
  }
}
