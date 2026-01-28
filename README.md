# 가계부 (House Account)

웹 기반 가계부 애플리케이션입니다.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase 또는 로컬 PostgreSQL
- **배포**: Vercel

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 데이터베이스 선택

이 애플리케이션은 **Supabase** 또는 **로컬 PostgreSQL** 중 하나를 선택하여 사용할 수 있습니다.

---

## 방법 1: Supabase 사용 (권장)

### 2-1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2-2. Supabase 데이터베이스 설정

1. [Supabase](https://supabase.com)에서 프로젝트를 생성합니다.
2. Supabase 대시보드의 SQL Editor에서 `supabase-schema.sql` 파일의 내용을 실행합니다.

### 2-3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

---

## 방법 2: 로컬 PostgreSQL 사용

자세한 로컬 배포 가이드는 [README-LOCAL-DEPLOYMENT.md](./README-LOCAL-DEPLOYMENT.md)를 참고하세요.

### 2-1. PostgreSQL 설치

로컬에 PostgreSQL이 설치되어 있어야 합니다. 설치되어 있지 않다면:

- **Windows**: [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 다운로드
- **macOS**: `brew install postgresql@14` 또는 [공식 사이트](https://www.postgresql.org/download/macosx/)
- **Linux**: `sudo apt-get install postgresql` (Ubuntu/Debian) 또는 배포판에 맞는 방법 사용

### 2-2. 데이터베이스 생성

PostgreSQL에 접속하여 데이터베이스를 생성합니다:

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE houseaccount;

# 데이터베이스에 접속
\c houseaccount

# 스키마 실행
\i local-postgres-schema.sql

# 사용자 테이블 생성 (supabase-users.sql 참고)
```

또는 파일을 직접 실행:

```bash
psql -U postgres -d houseaccount -f local-postgres-schema.sql
```

### 2-3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 로컬 PostgreSQL 사용 활성화
USE_LOCAL_POSTGRES=true
NEXT_PUBLIC_USE_LOCAL_POSTGRES=true

# PostgreSQL 연결 정보
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=houseaccount
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_SSL=false
```

**중요**: 
- `USE_LOCAL_POSTGRES=true`는 서버 사이드에서 사용됩니다.
- `NEXT_PUBLIC_USE_LOCAL_POSTGRES=true`는 클라이언트 사이드에서 사용됩니다.
- 두 값을 모두 설정해야 합니다.

### 2-4. 기본 사용자 설정

개발 서버 실행 후 다음 API를 호출하여 기본 사용자 비밀번호를 해시화하세요:

```bash
curl -X POST http://localhost:3000/api/auth/init
```

기본 로그인 정보:
- **아이디**: `nano`
- **비밀번호**: `password`

### 2-5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

---

## 주요 기능

- ✅ 수입/지출 거래 추가 및 관리
- ✅ 대분류/소분류 카테고리 관리
- ✅ 일괄 입력 (엑셀 형태)
- ✅ 거래 내역 필터링 (유형, 대분류, 소분류, 날짜)
- ✅ 거래 내역 조회, 수정, 삭제
- ✅ 월간 리포트 (유형별 분포, 지출 카테고리별 분석)
- ✅ 카테고리 리포트 (기간별 총합, TOP 3 달)
- ✅ 엑셀 다운로드 (한글 인코딩)
- ✅ 사용자 인증 및 비밀번호 관리

## 배포

### Vercel에 배포

1. GitHub에 프로젝트를 푸시합니다
2. [Vercel](https://vercel.com)에 로그인하고 프로젝트를 가져옵니다
3. 환경 변수를 Vercel 대시보드에 추가합니다:
   - **Supabase 사용 시**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **로컬 PostgreSQL 사용 시**: 모든 `POSTGRES_*` 변수와 `USE_LOCAL_POSTGRES`, `NEXT_PUBLIC_USE_LOCAL_POSTGRES`
4. 배포가 자동으로 시작됩니다

**참고**: Vercel에서 로컬 PostgreSQL을 사용하려면 외부에서 접근 가능한 PostgreSQL 서버가 필요합니다. 일반적으로는 Supabase를 사용하는 것을 권장합니다.

## 문제 해결

### 로컬 PostgreSQL 연결 오류

- PostgreSQL 서비스가 실행 중인지 확인하세요: `pg_isready` 또는 `psql -U postgres`
- 방화벽 설정을 확인하세요
- 연결 정보(호스트, 포트, 사용자명, 비밀번호)가 올바른지 확인하세요

### 환경 변수 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인하세요
- 환경 변수 이름이 정확한지 확인하세요 (대소문자 구분)
- 서버를 재시작하세요 (`npm run dev`)
