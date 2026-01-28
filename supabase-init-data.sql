-- =====================================================
-- 초기 데이터 설정 (유형 + 카테고리)
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. 기본 유형(transaction_types) 데이터 추가
INSERT INTO transaction_types (name, color) VALUES
  ('수입', '#22C55E'),
  ('지출', '#EF4444')
ON CONFLICT (name) DO UPDATE SET 
  color = EXCLUDED.color;

-- 2. categories 테이블에 main_category 컬럼 추가 (없으면)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS main_category TEXT;

-- 3. 기존 카테고리의 main_category 업데이트
UPDATE categories SET main_category = name WHERE main_category IS NULL;

-- 4. 기본 카테고리 데이터 추가

-- 수입 카테고리
INSERT INTO categories (type, main_category, name) VALUES
  ('수입', '급여', '급여'),
  ('수입', '급여', '월급'),
  ('수입', '급여', '상여금'),
  ('수입', '부수입', '부수입'),
  ('수입', '부수입', '이자'),
  ('수입', '부수입', '배당'),
  ('수입', '부수입', '부업'),
  ('수입', '투자', '투자'),
  ('수입', '투자', '주식'),
  ('수입', '투자', '부동산'),
  ('수입', '기타', '기타'),
  ('수입', '기타', '용돈'),
  ('수입', '기타', '기타 수입')
ON CONFLICT DO NOTHING;

-- 지출 카테고리
INSERT INTO categories (type, main_category, name) VALUES
  ('지출', '식비', '식비'),
  ('지출', '식비', '외식'),
  ('지출', '식비', '배달'),
  ('지출', '식비', '식재료'),
  ('지출', '식비', '간식'),
  ('지출', '교통', '교통'),
  ('지출', '교통', '대중교통'),
  ('지출', '교통', '택시'),
  ('지출', '교통', '주유'),
  ('지출', '교통', '주차'),
  ('지출', '주거', '주거'),
  ('지출', '주거', '월세'),
  ('지출', '주거', '관리비'),
  ('지출', '주거', '수도/전기'),
  ('지출', '통신', '통신'),
  ('지출', '통신', '휴대폰'),
  ('지출', '통신', '인터넷'),
  ('지출', '통신', '구독서비스'),
  ('지출', '의료', '의료'),
  ('지출', '의료', '병원'),
  ('지출', '의료', '약국'),
  ('지출', '의료', '건강검진'),
  ('지출', '교육', '교육'),
  ('지출', '교육', '학원'),
  ('지출', '교육', '도서'),
  ('지출', '교육', '강의'),
  ('지출', '쇼핑', '쇼핑'),
  ('지출', '쇼핑', '의류'),
  ('지출', '쇼핑', '생활용품'),
  ('지출', '쇼핑', '전자기기'),
  ('지출', '여가', '여가'),
  ('지출', '여가', '영화'),
  ('지출', '여가', '여행'),
  ('지출', '여가', '취미'),
  ('지출', '기타', '기타'),
  ('지출', '기타', '경조사'),
  ('지출', '기타', '기타 지출')
ON CONFLICT DO NOTHING;

-- 5. 확인 쿼리
SELECT 'transaction_types' as table_name, COUNT(*) as count FROM transaction_types
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as count FROM categories;
