-- Supabase 데이터베이스 스키마
-- Supabase 대시보드의 SQL Editor에서 이 스크립트를 실행하세요.

-- transactions 테이블 생성
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Row Level Security (RLS) 활성화
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정 (인증이 필요 없는 경우)
-- 실제 프로덕션 환경에서는 인증 기반 정책을 사용하는 것을 권장합니다.
CREATE POLICY "Allow all operations for all users" ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 또는 인증된 사용자만 접근 가능하도록 설정하려면:
-- CREATE POLICY "Allow authenticated users" ON transactions
--   FOR ALL
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');
