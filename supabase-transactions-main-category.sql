-- transactions 테이블에 main_category 컬럼 추가
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS main_category TEXT;

-- 기존 데이터의 main_category 업데이트 (categories 테이블에서 조회)
UPDATE transactions t
SET main_category = (
  SELECT c.main_category
  FROM categories c
  WHERE c.type = t.type AND c.name = t.category
  LIMIT 1
)
WHERE main_category IS NULL;

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_transactions_main_category ON transactions(main_category);
