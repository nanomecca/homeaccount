-- 로컬 PostgreSQL 데이터베이스 스키마
-- 로컬 PostgreSQL에서 이 스크립트를 실행하세요.

-- transaction_types 테이블 생성 (유형 관리)
CREATE TABLE IF NOT EXISTS transaction_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- categories 테이블 생성 (카테고리 관리)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  main_category TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(type, main_category, name)
);

-- transactions 테이블 생성
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_transaction_types_name ON transaction_types(name);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_main_category ON categories(main_category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- 기본 유형 데이터 삽입
INSERT INTO transaction_types (name, display_name, color) VALUES
  ('income', '수입', '#10B981'),
  ('expense', '지출', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- 기본 카테고리 데이터 삽입 (대분류/소분류 구조)
-- 수입 카테고리
INSERT INTO categories (type, main_category, name) VALUES
  ('income', '급여', '급여'),
  ('income', '급여', '월급'),
  ('income', '급여', '상여금'),
  ('income', '부수입', '부수입'),
  ('income', '부수입', '이자'),
  ('income', '부수입', '배당'),
  ('income', '기타', '용돈'),
  ('income', '기타', '기타 수입')
ON CONFLICT (type, main_category, name) DO NOTHING;

-- 지출 카테고리
INSERT INTO categories (type, main_category, name) VALUES
  ('expense', '식비', '식비'),
  ('expense', '식비', '외식'),
  ('expense', '식비', '배달'),
  ('expense', '식비', '식재료'),
  ('expense', '교통', '교통비'),
  ('expense', '교통', '대중교통'),
  ('expense', '교통', '택시'),
  ('expense', '주거', '월세'),
  ('expense', '주거', '관리비'),
  ('expense', '통신', '통신비'),
  ('expense', '통신', '휴대폰'),
  ('expense', '통신', '인터넷'),
  ('expense', '의료', '의료비'),
  ('expense', '의료', '병원'),
  ('expense', '의료', '약국'),
  ('expense', '교육', '교육비'),
  ('expense', '교육', '학원'),
  ('expense', '교육', '도서'),
  ('expense', '쇼핑', '쇼핑'),
  ('expense', '쇼핑', '의류'),
  ('expense', '쇼핑', '생활용품'),
  ('expense', '기타', '기타 지출')
ON CONFLICT (type, main_category, name) DO NOTHING;
