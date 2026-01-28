-- 유형코드(영문) 제거 및 표시이름을 유형이름으로 변경하는 마이그레이션 스크립트
-- 기존 데이터베이스에 적용하세요.

-- 주의: 이 스크립트를 실행하기 전에 데이터베이스를 백업하세요.

-- 1. transaction_types 테이블에 display_name 컬럼이 있는지 확인하고 업데이트
-- display_name이 있으면 name을 display_name 값으로 업데이트
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transaction_types' AND column_name = 'display_name'
  ) THEN
    -- name을 display_name 값으로 업데이트
    UPDATE transaction_types 
    SET name = display_name 
    WHERE display_name IS NOT NULL AND display_name != name;
    
    -- categories와 transactions 테이블의 type 컬럼도 업데이트
    UPDATE categories 
    SET type = (
      SELECT display_name 
      FROM transaction_types 
      WHERE transaction_types.name = categories.type
    )
    WHERE EXISTS (
      SELECT 1 
      FROM transaction_types 
      WHERE transaction_types.name = categories.type 
      AND transaction_types.display_name IS NOT NULL
    );

    UPDATE transactions 
    SET type = (
      SELECT display_name 
      FROM transaction_types 
      WHERE transaction_types.name = transactions.type
    )
    WHERE EXISTS (
      SELECT 1 
      FROM transaction_types 
      WHERE transaction_types.name = transactions.type 
      AND transaction_types.display_name IS NOT NULL
    );
    
    -- display_name 컬럼 제거
    ALTER TABLE transaction_types DROP COLUMN display_name;
  END IF;
END $$;

-- 2. 기존 영문 코드('income', 'expense')를 한글('수입', '지출')로 업데이트 (display_name이 없는 경우)
UPDATE transaction_types 
SET name = '수입' 
WHERE name = 'income';

UPDATE transaction_types 
SET name = '지출' 
WHERE name = 'expense';

-- categories와 transactions의 type도 업데이트
UPDATE categories 
SET type = '수입' 
WHERE type = 'income';

UPDATE categories 
SET type = '지출' 
WHERE type = 'expense';

UPDATE transactions 
SET type = '수입' 
WHERE type = 'income';

UPDATE transactions 
SET type = '지출' 
WHERE type = 'expense';

-- 3. 인덱스 재생성 (필요한 경우)
DROP INDEX IF EXISTS idx_transaction_types_name;
CREATE INDEX IF NOT EXISTS idx_transaction_types_name ON transaction_types(name);

-- 완료 메시지
SELECT 'Migration completed successfully! display_name column removed and name updated.' AS message;
