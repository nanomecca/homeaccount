-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 접근 허용 (간단한 인증용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow all operations for all users on users'
  ) THEN
    CREATE POLICY "Allow all operations for all users on users" ON users
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 기본 사용자 추가 (nano / password)
-- 이미 존재하면 무시
INSERT INTO users (username, password) 
VALUES ('nano', 'password')
ON CONFLICT (username) DO NOTHING;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
