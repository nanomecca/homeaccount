-- Supabase 데이터베이스 초기화 스크립트
-- 이 스크립트는 기존 데이터를 모두 삭제하고 새로 생성합니다.
-- Supabase 대시보드의 SQL Editor에서 실행하세요.

-- ============================================
-- 1단계: 기존 데이터 삭제
-- ============================================

-- Row Level Security (RLS) 정책 삭제
DROP POLICY IF EXISTS "Allow all operations for all users on categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations for all users on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow all operations for all users on transaction_types" ON transaction_types;
DROP POLICY IF EXISTS "Allow authenticated users on categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated users on transaction_types" ON transaction_types;

-- 인덱스 삭제
DROP INDEX IF EXISTS idx_transaction_types_name;
DROP INDEX IF EXISTS idx_categories_type;
DROP INDEX IF EXISTS idx_categories_name;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_transactions_created_at;

-- 테이블 삭제
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS transaction_types CASCADE;

-- ============================================
-- 2단계: 새로 생성
-- ============================================

-- transaction_types 테이블 생성 (유형 관리)
CREATE TABLE transaction_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- categories 테이블 생성 (카테고리 관리)
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(type, name)
);

-- transactions 테이블 생성
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_transaction_types_name ON transaction_types(name);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- 기본 유형 데이터 삽입
INSERT INTO transaction_types (name, color) VALUES
  ('수입', '#10B981'),
  ('지출', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- 기본 카테고리 데이터 삽입
INSERT INTO categories (type, name) VALUES
  ('수입', '급여'),
  ('수입', '용돈'),
  ('수입', '부수입'),
  ('수입', '기타 수입'),
  ('지출', '식비'),
  ('지출', '교통비'),
  ('지출', '쇼핑'),
  ('지출', '의료비'),
  ('지출', '통신비'),
  ('지출', '교육비'),
  ('지출', '기타 지출')
ON CONFLICT (type, name) DO NOTHING;

-- Row Level Security (RLS) 활성화
ALTER TABLE transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정
CREATE POLICY "Allow all operations for all users on transaction_types" ON transaction_types
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users on categories" ON categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for all users on transactions" ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 완료 메시지
SELECT 'Database reset completed successfully!' AS message;
