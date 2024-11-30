# Pulse CLI 사용 가이드

**Pulse**는 API의 상태를 모니터링하기 위한 CLI 도구입니다.

## 빠른 시작

1. 프로젝트 디렉토리에서 Pulse CLI를 실행하려면 다음 명령어를 사용하세요:

```shell
  pnpm dlx @yeonjoong/pulse [<path>] [options]
```

2. 기본 실행 예시:

```shell
  pnpm dlx @yeonjoong/pulse
```

---

## 명령어 구조

```shell
  pnpm dlx @yeonjoong/pulse [options] [<path>]
```

- `<path>`: 소스 파일 디렉토리 또는 파일 경로를 지정합니다.
    - **기본값**: `./`
    - `<path>`가 파일인 경우 해당 파일만 처리됩니다.
    - `<path>`가 디렉토리인 경우 해당 디렉토리와 하위 디렉토리의 모든 파일이 처리됩니다.

---

## 기능

1. 경로 기반 실행:

    - `<path>`가 파일인 경우 해당 파일만 처리됩니다.
    - `<path>`가 디렉토리인 경우 해당 디렉토리와 하위 디렉토리의 모든 파일이 처리됩니다.

2. 환경 변수 대체:
    - PULSE_ 접두사를 가진 환경 변수가 설정된 경우, CLI는 소스 파일에서 일치하는 텍스트를 확인합니다.
    - 환경 변수 대체는 `data` 및 `host` 필드에서만 작동합니다.
    - 소스 파일의 텍스트가 환경 변수 이름(PULSE_ 접두사)과 일치하면, 해당 값을 환경 변수 값으로 대체합니다.
    - 예시:
        - 환경 변수: `PULSE_API_KEY=my-secret-key`
        - 소스 파일 내용: `{ "API_KEY": "PULSE_API_KEY" }`
        - 대체 후: `{ "API_KEY": "my-secret-key" }`

## 옵션

| 옵션                                   | 설명                              | 기본값              | 환경 변수                       |
|--------------------------------------|---------------------------------|------------------|-----------------------------|
| `-m, --max <number>`                 | 각 서비스의 상태 로그 최대 개수를 설정합니다.      | `100`            | `PULSE_STATUS_LOGS_MAX`     |
| `-o, --out <file-path>`              | 출력 파일 경로를 설정합니다.                | `./pulse.sqlite` | `PULSE_OUTPUT_PATH`         |
| `-c, --concurrency <number>`         | 동시에 처리할 파일 작업 수를 설정합니다.         | `5`              | `PULSE_FILE_CONCURRENCY`    |
| `-e, --execute-concurrency <number>` | 파일당 상태 확인 요청의 동시 실행 수를 설정합니다.   | `50`             | `PULSE_EXECUTE_CONCURRENCY` |
| `--json`                             | 결과를 JSON 파일로 내보냅니다 (--out 값 참조) | `false`          |                             |

---

## 소스 파일 형식

소스 파일은 API 모니터링을 위한 검사와 구성을 정의합니다. 단일 서비스 구성 또는 여러 서비스의 배열 형식일 수 있습니다.

### 소스 파일 예시

#### JSON 형식

```json
{
  "title": "Pulse sample",
  "checks": [
    {
      "name": "GitHub Home",
      "type": "http",
      "host": "https://github.com",
      "expectedCode": 200
    },
    {
      "name": "GitHub API",
      "type": "http",
      "host": "https://api.github.com",
      "expectedCode": 200
    }
  ]
}
```

#### YAML 형식

```yaml
title: "Pulse sample"
checks:
  - name: "GitHub Home"
    type: "http"
    host: "https://github.com"
    expectedCode: 200
  - name: "GitHub API"
    type: "http"
    host: "https://api.github.com"
    expectedCode: 200
```

#### 하나의 파일에 여러 서비스 정의 (JSON 형식)

```json
[
  {
    "title": "Pulse sample",
    "checks": [
      {
        "name": "GitHub Home",
        "type": "http",
        "host": "https://github.com",
        "expectedCode": 200
      },
      {
        "name": "GitHub API",
        "type": "http",
        "host": "https://api.github.com",
        "expectedCode": 200
      }
    ]
  },
  {
    "title": "Pulse sample 2",
    "checks": [
      {
        "name": "GitHub Home",
        "type": "http",
        "host": "https://github.com",
        "expectedCode": 200
      },
      {
        "name": "GitHub API",
        "type": "http",
        "host": "https://api.github.com",
        "expectedCode": 200
      }
    ]
  }
]
```

#### 하나의 파일에 여러 서비스 정의 (YAML 형식)

```yaml
- title: "Pulse sample"
  checks:
    - name: "GitHub Home"
      type: "http"
      host: "https://github.com"
      expectedCode: 200
    - name: "GitHub API"
      type: "http"
      host: "https://api.github.com"
      expectedCode: 200

- title: "Pulse sample 2"
  checks:
    - name: "GitHub Home"
      type: "http"
      host: "https://github.com"
      expectedCode: 200
    - name: "GitHub API"
      type: "http"
      host: "https://api.github.com"
      expectedCode: 200
```

### 지원되는 스키마

소스 파일은 아래 스키마에 따라 구조가 검증되어야 합니다:

#### 서비스 구성

- **`title`**: 서비스의 이름을 나타내는 비어 있지 않은 문자열입니다.
- **`baseUrl`** *(선택 사항)*: 서비스의 기본 URL입니다. 제공된 경우 검사에 기본값으로 적용될 수 있습니다.
- **`baseHeaders`** *(선택 사항)*: 서비스 내 모든 HTTP 검사에 적용될 공통 헤더입니다.
- **`checks`**: 검사 구성을 나타내는 배열입니다.

#### 검사 구성

- **`name`**: 검사를 식별하는 비어 있지 않은 문자열입니다.
- **`type`**: 현재는 `"http"`를 지원합니다.
- **`host`**: 검사의 대상 URL입니다.
- **`method`** *(선택 사항)*: HTTP 메서드 (예: GET, POST). 기본값은 `"GET"`입니다.
- **`data`** *(선택 사항)*: POST나 PUT 메서드의 요청 본문 또는 GET 메서드의 검색 매개변수입니다.
- **`headers`** *(선택 사항)*: 검사에 특정한 사용자 지정 헤더입니다.
- **`expectedCode`** *(선택 사항)*: 예상되는 HTTP 상태 코드 (예: 200).

## 예시

1. 기본 옵션으로 실행:

```bash
  pnpm dlx @yeonjoong/pulse
```

2. 사용자 지정 소스 파일 경로와 출력 경로 지정:

```bash
  pnpm dlx @yeonjoong/pulse ./my-source.json -o ./output-data.sqlite
```

3. 환경 변수 사용:

```bash
  export PULSE_OUTPUT_PATH=./my-output.sqlite && pnpm dlx @yeonjoong/pulse
```

4. 파일 동시 처리와 실행 동시성 조정:

```bash
  pnpm dlx @yeonjoong/pulse -c 10 -e 100
```

5. JSON 파일로 내보내기:

```bash
  pnpm dlx @yeonjoong/pulse --json
```

6환경 변수를 사용하여 소스 파일의 키 대체하기

```bash
  export PULSE_API_HOST=https://example.com/api
  export PULSE_API_KEY=my-secret-key
  export PULSE_USERNAME=yeonjoong
  pnpm dlx @yeonjoong/pulse ./sample.json
```

- `sample.json`에 다음과 같은 내용이 있는 경우:

```json
{
  "title": "Pulse sample",
  "checks": [
    {
      "name": "My tiny API",
      "type": "http",
      "method": "post",
      "host": "PULSE_API_HOST/PULSE_API_KEY",
      "data": { "name" : "PULSE_USERNAME" },
      "expectedCode": 201
    }
  ]
}
```

실행 후, CLI는 다음과 같이 사용합니다:

```json
{
  "title": "Pulse sample",
  "checks": [
    {
      "name": "My tiny API",
      "type": "http",
      "method": "post",
      "host": "https://example.com/api/my-secret-key",
      "data": {"name" : "yeonjoong"},
      "expectedCode": 201
    }
  ]
}
```

---

## 참고 사항

- CLI는 현재 작업 디렉토리(`process.cwd()`)를 기준으로 경로를 해석합니다.
- `--max`와 같은 옵션 및 기타 숫자 입력은 정수로 파싱되므로, 유효한 숫자를 입력해야 합니다.