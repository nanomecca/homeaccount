-- 유형 관리 기능을 위한 스키마 업데이트
-- 기존 스키마에 추가로 실행하세요.

-- transaction_types 테이블 생성
CREATE TABLE IF NOT EXISTS transaction_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기본 유형 데이터 삽입
INSERT INTO transaction_types (name, color) VALUES
  ('수입', '#10B981'),
  ('지출', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- transactions 테이블의 CHECK 제약조건 제거 (동적 유형 지원)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- categories 테이블의 CHECK 제약조건 제거 (동적 유형 지원)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_transaction_types_name ON transaction_types(name);

-- Row Level Security (RLS) 활성화
ALTER TABLE transaction_types ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정 (이미 존재하면 건너뜀)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transaction_types' 
    AND policyname = 'Allow all operations for all users on transaction_types'
  ) THEN
    CREATE POLICY "Allow all operations for all users on transaction_types" ON transaction_types
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
