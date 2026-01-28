-- 자산관리 테이블 생성
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('savings', 'deposit')), -- 적금(savings), 예금(deposit)
  bank_name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL, -- 연 이자율 (%)
  maturity_date DATE NOT NULL, -- 만기일
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_maturity_date ON assets(maturity_date);

-- Row Level Security (RLS) 활성화
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정
CREATE POLICY "Allow all operations for all users on assets" ON assets
  FOR ALL
  USING (true)
  WITH CHECK (true);
