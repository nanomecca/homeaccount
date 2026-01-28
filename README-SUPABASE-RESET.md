# Supabase 데이터베이스 초기화 가이드

기존 Supabase 데이터베이스의 테이블과 데이터를 모두 삭제하고 새로 시작하는 방법입니다.

## ⚠️ 주의사항

**이 작업은 모든 데이터를 영구적으로 삭제합니다!** 
삭제하기 전에 중요한 데이터가 있는지 확인하세요.

## 방법 1: 완전 초기화 (권장)

### 1단계: 기존 데이터 삭제 및 새로 생성

`supabase-reset.sql` 파일을 사용하면 한 번에 삭제하고 새로 생성할 수 있습니다.

1. Supabase 대시보드에 로그인
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. `supabase-reset.sql` 파일의 내용을 복사하여 붙여넣기
4. **RUN** 버튼 클릭

이 스크립트는:
- 기존 테이블과 데이터를 모두 삭제
- 새로운 테이블 생성
- 기본 카테고리 데이터 삽입
- RLS 정책 설정

## 방법 2: 단계별 실행

### 1단계: 기존 데이터 삭제만

1. Supabase 대시보드 → **SQL Editor**
2. `supabase-drop-all.sql` 파일의 내용을 복사하여 실행
3. 모든 테이블과 데이터가 삭제됩니다

### 2단계: 새로 생성

1. 같은 **SQL Editor**에서
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행
3. 테이블과 기본 데이터가 생성됩니다

## 방법 3: Supabase 대시보드에서 직접 삭제

### Table Editor에서 삭제

1. Supabase 대시보드 → **Table Editor**
2. 각 테이블(`transactions`, `categories`)을 선택
3. 테이블 설정에서 **Delete table** 클릭

### SQL Editor에서 직접 실행

```sql
-- 모든 데이터 삭제
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE categories CASCADE;

-- 또는 테이블 자체를 삭제
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
```

## 확인 방법

삭제가 완료되었는지 확인:

1. **Table Editor**에서 테이블 목록 확인
2. 또는 SQL Editor에서 실행:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

## 문제 해결

### 오류: "policy already exists"
정책이 이미 존재하는 경우, `supabase-drop-all.sql`을 먼저 실행한 후 `supabase-schema.sql`을 실행하세요.

### 오류: "table already exists"
`CREATE TABLE IF NOT EXISTS`를 사용했기 때문에 이 오류는 무시해도 됩니다. 하지만 완전히 새로 시작하려면 `supabase-reset.sql`을 사용하세요.

### 오류: "cannot drop table because other objects depend on it"
`CASCADE` 옵션을 사용하면 의존성 있는 객체도 함께 삭제됩니다. `supabase-drop-all.sql`에는 이미 포함되어 있습니다.
