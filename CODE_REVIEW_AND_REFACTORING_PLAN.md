# Pulse CLI - 코드리뷰 및 리팩토링 계획서

## 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [코드리뷰 결과](#코드리뷰-결과)
3. [리팩토링 계획](#리팩토링-계획)
4. [우선순위 및 영향도 분석](#우선순위-및-영향도-분석)

---

## 프로젝트 개요

**Pulse**는 API 상태를 모니터링하는 CLI 도구로, JSON/YAML 설정 파일을 읽어 API 헬스체크를 수행하고 결과를 SQLite 데이터베이스에 저장합니다.

### 기술 스택
- **런타임**: Node.js (>=22.21.1)
- **언어**: TypeScript (Strict Mode)
- **빌드**: tsup (ESM)
- **데이터베이스**: SQLite (Drizzle ORM + libSQL)
- **HTTP 클라이언트**: Ky
- **유효성 검사**: Zod
- **테스트**: Vitest

### 코드베이스 규모
- 총 ~1,150 라인의 TypeScript 코드
- 8개의 테스트 파일

---

## 코드리뷰 결과

### 1. 긍정적인 측면

#### 1.1 잘 정리된 프로젝트 구조
```
lib/
├── index.ts              # 메인 진입점
├── processor.ts          # 핵심 실행 로직
├── helper/               # 유틸리티 (CLI, 파일, 값 치환)
├── service/              # 비즈니스 로직 (체커, 데이터베이스)
├── schema/               # 데이터베이스 스키마
├── shared/               # 공유 유틸리티 (스피너, 유효성 검사)
└── utils/                # 헬퍼 유틸리티
```

#### 1.2 타입 안전성
- TypeScript strict 모드 활성화
- Zod를 활용한 런타임 유효성 검사
- 전역 타입 선언 파일 (`types/type.d.ts`)

#### 1.3 코드 품질 도구
- ESLint + TypeScript-ESLint (strict/stylistic)
- Prettier
- SonarJS (코드 스멜 감지)
- Unicorn (모범 사례)
- Husky + lint-staged (pre-commit 검사)
- Commitlint (커밋 메시지 규약)

#### 1.4 모던 JavaScript/TypeScript 패턴
- ESM 모듈 시스템
- async/await 패턴
- 배럴 익스포트 (`index.ts`)
- 함수형 프로그래밍 패턴 활용

---

### 2. 개선이 필요한 부분

#### 2.1 버그 및 오류

##### BUG-001: 중복 필터 호출 (Critical)
**위치**: `lib/helper/file.helper.ts:26-27`
```typescript
// 현재 코드 - 동일한 조건으로 두 번 필터링
.filter((file) => FILE_EXTENSIONS.has(path.extname(file)))
.filter((file) => FILE_EXTENSIONS.has(path.extname(file)))  // 중복!
```
**영향**: 성능 저하 (불필요한 반복)
**수정**: 중복된 `.filter()` 호출 제거

---

##### BUG-002: 파라미터 직접 변경 (불변성 위반)
**위치**: `lib/service/checker.service.ts:54-62`
```typescript
export const checkStatus = <T extends Omit<BaseCheck, 'type'>>(
  service: Service,
  check: T,
): Promise<...> => {
  // 파라미터를 직접 변경함!
  check.host = replaceEnvironmentValue(...);

  if (isHttpCheck(check)) {
    check.headers = defu(...);  // 파라미터 직접 변경!
    return httpAdapter(check as HttpCheck);
  }
  ...
};
```
**영향**: 예상치 못한 사이드 이펙트, 디버깅 어려움
**수정**: 스프레드 연산자로 새 객체 생성

---

##### BUG-003: 스키마 필드명 불일치
**위치**: `lib/shared/validate-schema.ts:14-16`
```typescript
// 스키마 정의
expectedResponse: z.union([z.string(), z.object({}).catchall(z.any())]).optional(),
```
**위치**: `lib/service/checker.service.ts:31`
```typescript
// 실제 사용
if (status && isNotNil(check.expectedBody)) {  // expectedBody 사용
```
**영향**: 스키마 유효성 검사와 실제 동작 불일치
**수정**: 스키마에서 `expectedResponse`를 `expectedBody`로 변경하거나 일관성 유지

---

##### BUG-004: replaceEnvironmentValue 반환 타입 문제
**위치**: `lib/helper/replacer.helper.ts:4-16`
```typescript
export const replaceEnvironmentValue = (value: string | object): string => {
  // object를 받으면 JSON.stringify하고 환경변수를 치환하지만
  // 결과는 항상 string을 반환
  let result = isString(value) ? value : JSON.stringify(value);
  ...
  return result;
};
```
**위치**: `lib/service/checker.service.ts:13-14`
```typescript
const data = isNil(check.data)
  ? undefined
  : replaceEnvironmentValue(check.data || {});
// data는 string이 되지만, 원래 object여야 할 수 있음
```
**영향**: 타입 불일치, 예상치 못한 동작
**수정**: 반환 타입을 적절히 처리하거나 오버로드 사용

---

#### 2.2 아키텍처 개선 필요

##### ARCH-001: 데이터베이스 연결 관리 비효율
**위치**: `lib/service/database.service.ts`
```typescript
// 매 함수 호출마다 새 연결 생성 및 해제
export const updateResult = async (...) => {
  const database = drizzle(`file:${OUTPUT_FILE_PATH}`);
  // ... 작업 수행 ...
  database.$client.close();
};

export const exportLatestResult = async (...) => {
  const database = drizzle(`file:${OUTPUT_FILE_PATH}`);
  // ... 작업 수행 ...
  // close() 호출 누락!
};
```
**문제점**:
- 매 요청마다 연결 생성/해제로 인한 오버헤드
- `exportLatestResult`에서 연결 해제 누락 (리소스 누수)
- 연결 관리 중앙화 부재

**권장 수정**:
```typescript
// 커넥션 매니저 패턴 적용
class DatabaseManager {
  private static instance: ReturnType<typeof drizzle> | null = null;

  static getConnection(filePath: string) {
    if (!this.instance) {
      this.instance = drizzle(`file:${filePath}`);
    }
    return this.instance;
  }

  static close() {
    this.instance?.$client.close();
    this.instance = null;
  }
}
```

---

##### ARCH-002: 전역 스피너 인스턴스
**위치**: `lib/shared/spinner.ts`
```typescript
let spinnerInstance: Ora;  // 전역 변수

export const getSpinnerInstance = (): Ora => {
  if (!spinnerInstance) {
    spinnerInstance = ora({ prefixText: '[PULSE]', spinner: 'dots' });
  }
  return spinnerInstance;
};
```
**문제점**:
- 테스트 격리 어려움
- 의존성 주입 불가
- 상태 공유로 인한 예상치 못한 동작

**권장 수정**: 의존성 주입 패턴 또는 팩토리 패턴 적용

---

##### ARCH-003: 에러 핸들링 일관성 부재
**현재 상황**:
- `lib/index.ts`: try-catch + process.exit(1)
- `lib/processor.ts:processCheck`: try-catch + 기본값 반환
- `lib/service/checker.service.ts:createHttpAdapter`: try-catch + 기본값 반환

**문제점**: 에러 처리 방식이 파일마다 다름

**권장 수정**: 커스텀 에러 클래스 및 중앙화된 에러 핸들러 구현

---

#### 2.3 코드 품질 개선

##### QUAL-001: 함수명과 실제 동작 불일치
**위치**: `lib/utils/is-json-schema-equal.ts`
```typescript
export const isJsonSchemaEqual = (
  object1: unknown,
  object2: unknown,
): boolean => {
  // 실제로는 "구조"를 비교하는 것이지 "스키마"를 비교하는 것이 아님
  // 값 자체는 비교하지 않고 키와 타입만 비교
};
```
**권장 수정**: `isJsonStructureEqual` 또는 `hasMatchingStructure`로 이름 변경

---

##### QUAL-002: 타입 정의와 실제 코드 불일치
**위치**: `types/type.d.ts`
```typescript
declare interface HttpCheck extends BaseCheck {
  type: 'http';
  headers?: Record<string, string | undefined>;
  method?: string;
  expectedCode: number;  // required
  data?: string | object;
  expectedBody?: object;
}
```
**위치**: `lib/shared/validate-schema.ts`
```typescript
const HttpCheckSchema = BaseCheckSchema.extend({
  type: z.literal('http'),
  method: z.string().optional(),
  data: z.object({}).passthrough().optional(),
  headers: z.object({}).catchall(z.any()).optional(),
  expectedCode: z.number().int().min(100).max(599).optional(),  // optional!
  expectedResponse: z  // expectedBody가 아님!
    .union([z.string(), z.object({}).catchall(z.any())])
    .optional(),
});
```
**문제점**: TypeScript 타입과 Zod 스키마 간 불일치

---

##### QUAL-003: 매직 넘버 사용
**위치**: `lib/helper/cli.helper.ts`
```typescript
.default(100)    // 매직 넘버
.default(5)      // 매직 넘버
.default(50)     // 매직 넘버
```
**권장 수정**: 상수로 정의
```typescript
const DEFAULT_MAX_STATUS_LOG = 100;
const DEFAULT_FILE_CONCURRENCY = 5;
const DEFAULT_EXECUTE_CONCURRENCY = 50;
```

---

#### 2.4 성능 개선

##### PERF-001: 비효율적인 로그 삭제 쿼리
**위치**: `lib/service/database.service.ts:91-114`
```typescript
// 현재 구현: 두 번의 쿼리 실행
const serviceLogCount = await transaction.$count(...);

if (serviceLogCount > MAX_STATUS_LOG) {
  const targetIds = await transaction.select(...).offset(...).all();
  await transaction.delete(Log).where(inArray(...)).run();
}
```
**권장 수정**: 단일 쿼리로 최적화
```sql
DELETE FROM log
WHERE id IN (
  SELECT id FROM log
  WHERE service_id = ?
  ORDER BY timestamp DESC
  LIMIT -1 OFFSET ?
)
```

---

##### PERF-002: 동기적 파일 작업
**위치**: `lib/helper/file.helper.ts`
```typescript
const rawContent = fs.readFileSync(filePath, 'utf8');  // 동기 읽기
```
**위치**: `lib/service/database.service.ts`
```typescript
fs.writeFileSync(exportFilePath, JSON.stringify(exportResult));  // 동기 쓰기
```
**권장 수정**: `fs/promises` 사용하여 비동기 처리

---

#### 2.5 테스트 개선

##### TEST-001: checker.service.ts 테스트 부재
**현재 상황**: `lib/service/checker.service.test.ts` 파일이 존재하지 않음
**영향**: 핵심 비즈니스 로직에 대한 테스트 커버리지 부족

---

##### TEST-002: 테스트 격리 부족
**위치**: `lib/service/database.service.test.ts`
```typescript
// 실제 파일 시스템에 테스트 DB 생성
const TEST_DB_PATH = path.join(import.meta.dirname, 'test.db');
```
**권장 수정**: 인메모리 SQLite 또는 임시 디렉토리 사용

---

##### TEST-003: 테스트 데이터 상수화
**현재 상황**: 테스트 파일마다 더미 데이터 중복 정의
**권장 수정**: 테스트 픽스처 파일로 분리

---

## 리팩토링 계획

### Phase 1: Critical Bug Fixes (긴급)

| ID | 작업 | 파일 | 영향도 |
|----|------|------|--------|
| BUG-001 | 중복 필터 호출 제거 | `file.helper.ts` | Low |
| BUG-002 | 불변성 위반 수정 | `checker.service.ts` | Medium |
| BUG-003 | 스키마 필드명 일치 | `validate-schema.ts` | Medium |

### Phase 2: Architecture Improvements (중요)

| ID | 작업 | 파일 | 영향도 |
|----|------|------|--------|
| ARCH-001 | 데이터베이스 연결 관리자 구현 | `database.service.ts` | High |
| ARCH-002 | 스피너 의존성 주입 | `spinner.ts`, `processor.ts` | Medium |
| ARCH-003 | 에러 핸들링 표준화 | 전체 | High |

### Phase 3: Code Quality (개선)

| ID | 작업 | 파일 | 영향도 |
|----|------|------|--------|
| QUAL-001 | 함수명 변경 | `is-json-schema-equal.ts` | Low |
| QUAL-002 | 타입/스키마 일치 | `type.d.ts`, `validate-schema.ts` | Medium |
| QUAL-003 | 매직 넘버 상수화 | `cli.helper.ts` | Low |

### Phase 4: Performance (최적화)

| ID | 작업 | 파일 | 영향도 |
|----|------|------|--------|
| PERF-001 | 로그 삭제 쿼리 최적화 | `database.service.ts` | Low |
| PERF-002 | 비동기 파일 작업 전환 | `file.helper.ts`, `database.service.ts` | Medium |

### Phase 5: Test Coverage (품질)

| ID | 작업 | 파일 | 영향도 |
|----|------|------|--------|
| TEST-001 | checker.service 테스트 추가 | 신규 파일 | High |
| TEST-002 | 테스트 격리 개선 | 테스트 파일들 | Medium |
| TEST-003 | 테스트 픽스처 분리 | 신규 파일 | Low |

---

## 우선순위 및 영향도 분석

### 우선순위 매트릭스

```
영향도 ↑
High   │ ARCH-001, ARCH-003  │  TEST-001
       │ (긴급 처리 필요)     │  (중요)
       ├─────────────────────┼─────────────────────
Medium │ BUG-002, BUG-003    │  QUAL-002, PERF-002
       │ ARCH-002            │  TEST-002
       ├─────────────────────┼─────────────────────
Low    │ BUG-001, QUAL-001   │  QUAL-003, PERF-001
       │                     │  TEST-003
       └─────────────────────┴─────────────────────→ 복잡도
                 낮음                  높음
```

### 권장 실행 순서

1. **즉시 수정 (1일)**
   - BUG-001: 중복 필터 제거
   - BUG-003: 스키마 필드명 수정

2. **단기 수정 (1주)**
   - BUG-002: 불변성 위반 수정
   - QUAL-003: 매직 넘버 상수화
   - ARCH-001: 데이터베이스 연결 관리자

3. **중기 개선 (2주)**
   - ARCH-003: 에러 핸들링 표준화
   - QUAL-002: 타입/스키마 일치
   - TEST-001: checker.service 테스트 추가

4. **장기 개선 (1개월)**
   - ARCH-002: 스피너 의존성 주입
   - PERF-001, PERF-002: 성능 최적화
   - TEST-002, TEST-003: 테스트 인프라 개선

---

## 부록: 리팩토링 코드 예시

### A. 데이터베이스 연결 관리자 (ARCH-001)

```typescript
// lib/service/database-manager.ts
import { drizzle } from 'drizzle-orm/libsql';

type DrizzleClient = ReturnType<typeof drizzle>;

class DatabaseManager {
  private static connections: Map<string, DrizzleClient> = new Map();

  static getConnection(filePath: string): DrizzleClient {
    const key = filePath;

    if (!this.connections.has(key)) {
      this.connections.set(key, drizzle(`file:${filePath}`));
    }

    return this.connections.get(key)!;
  }

  static closeConnection(filePath: string): void {
    const connection = this.connections.get(filePath);
    if (connection) {
      connection.$client.close();
      this.connections.delete(filePath);
    }
  }

  static closeAll(): void {
    for (const [key, connection] of this.connections) {
      connection.$client.close();
      this.connections.delete(key);
    }
  }
}

export { DatabaseManager };
```

### B. 커스텀 에러 클래스 (ARCH-003)

```typescript
// lib/errors/index.ts
export class PulseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PulseError';
  }
}

export class ConfigurationError extends PulseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', context);
    this.name = 'ConfigurationError';
  }
}

export class NetworkError extends PulseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', context);
    this.name = 'NetworkError';
  }
}

export class DatabaseError extends PulseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', context);
    this.name = 'DatabaseError';
  }
}
```

### C. 불변성 유지 수정 (BUG-002)

```typescript
// lib/service/checker.service.ts - 수정 후
export const checkStatus = <T extends Omit<BaseCheck, 'type'>>(
  service: Service,
  check: T,
): Promise<Awaited<ReturnType<ReturnType<Adapter>>>> => {
  // 새 객체 생성으로 불변성 유지
  const processedCheck = {
    ...check,
    host: replaceEnvironmentValue(
      getHostWithBase(check.host, service.baseUrl),
    ),
  };

  if (isHttpCheck(processedCheck)) {
    const httpCheck: HttpCheck = {
      ...processedCheck,
      headers: defu(processedCheck.headers, service.baseHeaders, {
        'Content-Type': 'application/json',
      }),
    };
    return httpAdapter(httpCheck);
  }

  throw new Error('Unsupported check type');
};
```

---

## 결론

Pulse 프로젝트는 전반적으로 잘 구조화되어 있으며, 현대적인 TypeScript 패턴과 도구를 활용하고 있습니다. 그러나 몇 가지 버그와 아키텍처 개선 사항이 발견되었습니다.

**핵심 권장사항:**
1. 즉시 수정이 필요한 버그 (BUG-001, BUG-003) 먼저 처리
2. 데이터베이스 연결 관리 개선으로 리소스 누수 방지
3. 에러 핸들링 표준화로 유지보수성 향상
4. checker.service 테스트 추가로 핵심 로직 보호

이 계획을 단계적으로 실행하면 코드 품질, 안정성, 유지보수성이 크게 향상될 것입니다.

---

*작성일: 2026-01-12*
*작성자: Claude Code Review*
