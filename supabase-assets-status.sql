-- assets 테이블에 status 컬럼 추가
ALTER TABLE assets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matured', 'closed'));

-- 기존 데이터는 모두 active로 설정
UPDATE assets SET status = 'active' WHERE status IS NULL;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
