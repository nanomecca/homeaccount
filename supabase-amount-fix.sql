-- amount 필드 크기 확장 (numeric field overflow 해결)
-- DECIMAL(10, 2) -> DECIMAL(15, 2)로 변경하여 최대 999,999,999,999,999.99까지 저장 가능

ALTER TABLE transactions 
ALTER COLUMN amount TYPE DECIMAL(15, 2);
