-- 카테고리 대분류/소분류 구조 업데이트
-- Supabase 대시보드의 SQL Editor에서 이 스크립트를 실행하세요.

-- 1. main_category 컬럼 추가
ALTER TABLE categories ADD COLUMN IF NOT EXISTS main_category TEXT;

-- 2. 기존 카테고리의 main_category를 name과 동일하게 설정 (기존 데이터 마이그레이션)
UPDATE categories SET main_category = name WHERE main_category IS NULL;

-- 3. UNIQUE 제약조건 변경 (type, main_category, name 조합으로)
-- 기존 제약조건 삭제
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_name_key;

-- 새 제약조건 추가
ALTER TABLE categories ADD CONSTRAINT categories_type_main_name_key UNIQUE (type, main_category, name);

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_categories_main_category ON categories(main_category);

-- 5. 기존 카테고리 삭제 후 새 구조로 재삽입 (선택사항 - 기존 데이터를 유지하려면 이 부분 생략)
-- DELETE FROM categories;

-- 6. 새로운 대분류/소분류 구조의 기본 데이터 삽입
-- 수입 카테고리
INSERT INTO categories (type, main_category, name) VALUES
  ('income', '급여', '월급'),
  ('income', '급여', '상여금'),
  ('income', '부수입', '이자'),
  ('income', '부수입', '배당'),
  ('income', '부수입', '부업'),
  ('income', '투자', '주식'),
  ('income', '투자', '부동산'),
  ('income', '기타', '용돈'),
  ('income', '기타', '기타 수입')
ON CONFLICT (type, main_category, name) DO NOTHING;

-- 지출 카테고리
INSERT INTO categories (type, main_category, name) VALUES
  ('expense', '식비', '외식'),
  ('expense', '식비', '배달'),
  ('expense', '식비', '식재료'),
  ('expense', '식비', '간식'),
  ('expense', '교통', '대중교통'),
  ('expense', '교통', '택시'),
  ('expense', '교통', '주유'),
  ('expense', '교통', '주차'),
  ('expense', '주거', '월세'),
  ('expense', '주거', '관리비'),
  ('expense', '주거', '수도/전기'),
  ('expense', '통신', '휴대폰'),
  ('expense', '통신', '인터넷'),
  ('expense', '통신', '구독서비스'),
  ('expense', '의료', '병원'),
  ('expense', '의료', '약국'),
  ('expense', '의료', '건강검진'),
  ('expense', '교육', '학원'),
  ('expense', '교육', '도서'),
  ('expense', '교육', '강의'),
  ('expense', '쇼핑', '의류'),
  ('expense', '쇼핑', '생활용품'),
  ('expense', '쇼핑', '전자기기'),
  ('expense', '여가', '영화'),
  ('expense', '여가', '여행'),
  ('expense', '여가', '취미'),
  ('expense', '기타', '경조사'),
  ('expense', '기타', '기타 지출')
ON CONFLICT (type, main_category, name) DO NOTHING;
