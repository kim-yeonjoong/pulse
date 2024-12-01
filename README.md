![NPM Version](https://img.shields.io/npm/v/%40yeonjoong%2Fpulse?style=for-the-badge&logo=npm)
![GitHub package.json version](https://img.shields.io/github/package-json/v/kim-yeonjoong/pulse?style=for-the-badge&logo=npm)
![NPM Downloads](https://img.shields.io/npm/dw/@yeonjoong/pulse?style=for-the-badge&logo=npm)


![Codecov](https://img.shields.io/codecov/c/github/kim-yeonjoong/pulse?token=X4MWYF7C3D&style=for-the-badge&logo=codecov)

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/kim-yeonjoong/pulse/checks.yml?style=for-the-badge&logo=github&label=TEST)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/kim-yeonjoong/pulse/release.yml?style=for-the-badge&logo=github&label=RELEASE)

![NPM License](https://img.shields.io/npm/l/@yeonjoong/pulse?style=for-the-badge)

# Pulse CLI Usage Guide

**Pulse** is a CLI tool for monitoring the status of your APIs.

## Quick start

1. To run Pulse CLI from your project directory, use the following command:

```shell
pnpm dlx @yeonjoong/pulse [<path>] [options]
```

2. Example of a basic execution:

```shell
pnpm dlx @yeonjoong/pulse
```

---

## Command Structure

```shell
pnpm dlx @yeonjoong/pulse [options] [<path>]
```

- `<path>`: Specifies the source file directory or file path.
    - **Default**: `./`
    - If `<path>` is a file, only that file will be processed.
    - If `<path>` is a directory, all files in the directory and its subdirectories will be processed.

---

## Features

1. Path-based Execution:

    - If `<path>` is a file, only that file will be processed.
    - If `<path>` is a directory, all files in the directory and its subdirectories will be processed.

2. Environment Variable Replacement:
    - If any environment variables with the PULSE_ prefix are set, the CLI will check the source file for matching text.
    - Environment Variable replacement only works on `data` and `host` fields.
    - If a text in the source file matches the environment variable name (PULSE_ prefix), the value will be replaced with the corresponding environment variable value.
    - Example:
        - Environment variable: `PULSE_API_KEY=my-secret-key`
        - Source file content: `{ "API_KEY": "PULSE_API_KEY" }`
        - After replacement: `{ "API_KEY": "my-secret-key" }`

## Options

| Option                               | Description                                                   | Default          | Environment Variable        |
|--------------------------------------|---------------------------------------------------------------|------------------|-----------------------------|
| `-m, --max <number>`                 | Sets the maximum count of each service's status logs.         | `100`            | `PULSE_STATUS_LOGS_MAX`     |
| `-o, --out <file-path>`              | Sets the output file path.                                    | `./pulse.sqlite` | `PULSE_OUTPUT_PATH`         |
| `-c, --concurrency <number>`         | Sets the number of concurrent file processing tasks.          | `5`              | `PULSE_FILE_CONCURRENCY`    |
| `-e, --execute-concurrency <number>` | Sets the number of concurrent status check requests per file. | `50`             | `PULSE_EXECUTE_CONCURRENCY` |
| `--json`                             | Export result to Json file (using --out value)                | `false`          |                             |

---

## Source File Format

The source file defines the checks and configurations for API monitoring. It can be either a single service configuration or an array of multiple services.

### Example Source File

#### JSON Format

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

#### YAML Format

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

#### Defining Multiple Services in a Single File (JSON Format)

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

#### Defining Multiple Services in a Single File (YAML Format)

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

### Supported Schema

The source file must follow the structure validated by the schema below:

#### Service Configuration

- **`title`**: A non-empty string representing the name of the service.
- **`baseUrl`** *(optional)*: The base URL for the service. Defaults can be applied to checks if provided.
- **`baseHeaders`** *(optional)*: Common headers to be applied to all HTTP checks within the service.
- **`checks`**: An array of check configurations.

#### Check Configuration

- **`name`**: A non-empty string identifying the check.
- **`type`**: Currently supports `"http"`.
- **`host`**: The target URL for the check.
- **`method`** *(optional)*: HTTP method (e.g., GET, POST). Defaults to `"GET"`.
- **`data`** *(optional)*: Request body for methods like POST or PUT / searchParams for method GET.
- **`headers`** *(optional)*: Custom headers specific to the check.
- **`expectedCode`** *(optional)*: The expected HTTP status code (e.g., 200).

## Examples

1. Run with default options:

```bash
pnpm dlx @yeonjoong/pulse
```

2. Specify a custom source file path and output path:

```bash
pnpm dlx @yeonjoong/pulse ./my-source.json -o ./output-data.sqlite
```

3. Use environment variables:

```bash
export PULSE_OUTPUT_PATH=./my-output.sqlite && pnpm dlx @yeonjoong/pulse
```

4. Adjust file concurrency and execution concurrency:

```bash
pnpm dlx @yeonjoong/pulse -c 10 -e 100
```

5. Export to JSON format:

```bash
pnpm dlx @yeonjoong/pulse --json
```

6. Replace keys in a source file using environment variables

```bash
export PULSE_API_HOST=https://example.com/api
export PULSE_API_KEY=my-secret-key
export PULSE_USERNAME=yeonjoong
pnpm dlx @yeonjoong/pulse ./sample.json
```

- If `sample.json` contains:

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

After execution, the CLI will use:

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

## Notes

- The CLI resolves paths based on the current working directory (`process.cwd()`).
- Options such as `--max` and other numeric inputs are parsed as integers, so ensure to input valid numbers.