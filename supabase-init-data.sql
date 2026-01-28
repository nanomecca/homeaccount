-- =====================================================
-- 초기 데이터 설정 (유형 + 카테고리)
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 기본 유형(transaction_types) 데이터 추가
INSERT INTO transaction_types (name, display_name, color) VALUES
  ('income', '수입', '#22C55E'),
  ('expense', '지출', '#EF4444')
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  color = EXCLUDED.color;

-- 2. categories 테이블에 main_category 컬럼 추가 (없으면)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS main_category TEXT;

-- 3. 기존 카테고리의 main_category 업데이트
UPDATE categories SET main_category = name WHERE main_category IS NULL;

-- 4. 기본 카테고리 데이터 추가

-- 수입 카테고리
INSERT INTO categories (type, main_category, name) VALUES
  ('income', '급여', '급여'),
  ('income', '급여', '월급'),
  ('income', '급여', '상여금'),
  ('income', '부수입', '부수입'),
  ('income', '부수입', '이자'),
  ('income', '부수입', '배당'),
  ('income', '부수입', '부업'),
  ('income', '투자', '투자'),
  ('income', '투자', '주식'),
  ('income', '투자', '부동산'),
  ('income', '기타', '기타'),
  ('income', '기타', '용돈'),
  ('income', '기타', '기타 수입')
ON CONFLICT DO NOTHING;

-- 지출 카테고리
INSERT INTO categories (type, main_category, name) VALUES
  ('expense', '식비', '식비'),
  ('expense', '식비', '외식'),
  ('expense', '식비', '배달'),
  ('expense', '식비', '식재료'),
  ('expense', '식비', '간식'),
  ('expense', '교통', '교통'),
  ('expense', '교통', '대중교통'),
  ('expense', '교통', '택시'),
  ('expense', '교통', '주유'),
  ('expense', '교통', '주차'),
  ('expense', '주거', '주거'),
  ('expense', '주거', '월세'),
  ('expense', '주거', '관리비'),
  ('expense', '주거', '수도/전기'),
  ('expense', '통신', '통신'),
  ('expense', '통신', '휴대폰'),
  ('expense', '통신', '인터넷'),
  ('expense', '통신', '구독서비스'),
  ('expense', '의료', '의료'),
  ('expense', '의료', '병원'),
  ('expense', '의료', '약국'),
  ('expense', '의료', '건강검진'),
  ('expense', '교육', '교육'),
  ('expense', '교육', '학원'),
  ('expense', '교육', '도서'),
  ('expense', '교육', '강의'),
  ('expense', '쇼핑', '쇼핑'),
  ('expense', '쇼핑', '의류'),
  ('expense', '쇼핑', '생활용품'),
  ('expense', '쇼핑', '전자기기'),
  ('expense', '여가', '여가'),
  ('expense', '여가', '영화'),
  ('expense', '여가', '여행'),
  ('expense', '여가', '취미'),
  ('expense', '기타', '기타'),
  ('expense', '기타', '경조사'),
  ('expense', '기타', '기타 지출')
ON CONFLICT DO NOTHING;

-- 5. 확인 쿼리
SELECT 'transaction_types' as table_name, COUNT(*) as count FROM transaction_types
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as count FROM categories;
