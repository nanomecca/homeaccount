-- Supabase에서 모든 테이블과 데이터를 삭제하는 스크립트
-- 주의: 이 스크립트는 모든 데이터를 영구적으로 삭제합니다!
-- Supabase 대시보드의 SQL Editor에서 실행하세요.

-- 1. Row Level Security (RLS) 정책 삭제
DROP POLICY IF EXISTS "Allow all operations for all users on categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations for all users on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated users on categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users on transactions" ON transactions;

-- 2. 인덱스 삭제
DROP INDEX IF EXISTS idx_categories_type;
DROP INDEX IF EXISTS idx_categories_name;
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_transactions_created_at;

-- 3. 테이블 삭제 (CASCADE로 외래키 제약조건도 함께 삭제)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 4. 확인 메시지
-- 위의 명령들이 성공적으로 실행되면 "DROP TABLE" 또는 "DROP INDEX" 메시지가 표시됩니다.
-- 오류가 없다면 모든 테이블과 데이터가 삭제된 것입니다.
