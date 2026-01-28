-- 비밀번호를 해시로 업데이트하는 SQL
-- 'password' 문자열의 bcrypt 해시값으로 업데이트합니다
-- Supabase SQL Editor에서 이 파일을 실행하세요

UPDATE users 
SET password = '$2b$10$OjKC2su86KY3Hq7oS5Omy.5qSSCwAAJ4NAoImC2WuGSaHg/RnV74C'
WHERE username = 'nano';

-- 또는 사용자가 없을 경우를 대비한 INSERT 문
INSERT INTO users (username, password)
VALUES ('nano', '$2b$10$OjKC2su86KY3Hq7oS5Omy.5qSSCwAAJ4NAoImC2WuGSaHg/RnV74C')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;
