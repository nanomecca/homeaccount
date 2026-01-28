# 로컬 배포 가이드

이 문서는 가계부 애플리케이션을 로컬 환경에서 실행하는 방법을 설명합니다.

## 사전 요구사항

1. **Node.js** (v18 이상)
2. **PostgreSQL** (v12 이상)
3. **npm** 또는 **yarn**

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. PostgreSQL 설치 및 설정

#### Windows
- [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 다운로드 및 설치
- 설치 중 비밀번호를 설정하세요

#### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3. 데이터베이스 생성

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
```

또는 파일을 직접 실행:

```bash
psql -U postgres -d houseaccount -f local-postgres-schema.sql
```

### 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

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
- `POSTGRES_PASSWORD`는 PostgreSQL 설치 시 설정한 비밀번호로 변경하세요.

### 5. 기본 사용자 설정

애플리케이션을 실행한 후, 다음 API를 호출하여 기본 사용자 비밀번호를 해시화하세요:

```bash
# 개발 서버 실행 후
curl -X POST http://localhost:3000/api/auth/init
```

또는 브라우저에서 직접 접속:
```
http://localhost:3000/api/auth/init
```

기본 로그인 정보:
- **아이디**: `nano`
- **비밀번호**: `password`

### 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로덕션 빌드

### 빌드

```bash
npm run build
```

### 프로덕션 서버 실행

```bash
npm start
```

## 문제 해결

### PostgreSQL 연결 오류

1. **PostgreSQL 서비스가 실행 중인지 확인**:
   ```bash
   # Windows
   services.msc에서 PostgreSQL 서비스 확인
   
   # macOS/Linux
   pg_isready
   # 또는
   psql -U postgres
   ```

2. **연결 정보 확인**:
   - `.env.local` 파일의 연결 정보가 올바른지 확인
   - PostgreSQL의 `pg_hba.conf` 파일에서 인증 방식 확인

3. **방화벽 설정**:
   - 로컬 환경에서는 일반적으로 문제가 없지만, 원격 PostgreSQL 사용 시 포트 5432가 열려있는지 확인

### 환경 변수 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (대소문자 구분)
- 서버를 재시작하세요 (`npm run dev`)

### 데이터베이스 스키마 오류

- `local-postgres-schema.sql` 파일이 올바르게 실행되었는지 확인
- 기존 테이블이 있다면 삭제 후 다시 실행:
  ```sql
  DROP TABLE IF EXISTS transactions CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
  DROP TABLE IF EXISTS transaction_types CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  ```
  그 후 `local-postgres-schema.sql`과 `supabase-users.sql`을 실행

## 로컬 배포 vs Supabase 배포

### 로컬 PostgreSQL 사용 시 장점
- 완전한 제어권
- 오프라인 개발 가능
- 데이터베이스 직접 접근 가능

### Supabase 사용 시 장점 (권장)
- 간편한 설정
- 자동 백업
- Vercel 배포 시 더 쉬운 연동
- 무료 티어 제공

## 추가 참고사항

- 로컬 PostgreSQL을 사용하는 경우, `users` 테이블도 생성해야 합니다 (`supabase-users.sql` 참고)
- 프로덕션 환경에서는 Supabase 사용을 권장합니다
