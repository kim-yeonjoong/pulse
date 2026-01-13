declare interface BaseCheck {
  name: string;
  host: string;
  type: never;
}

declare interface HttpCheck extends BaseCheck {
  type: 'http';
  headers?: Record<string, string | undefined>;
  method?: string;
  expectedCode?: number;
  data?: string | object;
  expectedBody?: object | string;
}

declare interface PortCheck extends BaseCheck {
  type: 'port';
  port: number;
}

declare type Check = HttpCheck | PortCheck;

declare interface ServiceStatusResult {
  name: string;
  status: boolean;
  response?: unknown;
}

declare interface Service {
  title: string;
  baseUrl?: string;
  checks: Check[];
  baseHeaders?: Record<string, string | undefined>;
}

declare interface CliOptions {
  MAX_STATUS_LOG: number;
  SOURCE_PATH: string;
  OUTPUT_FILE_PATH: string;
  FILE_CONCURRENCY: number;
  EXECUTE_CONCURRENCY: number;
  EXPORT_JSON: boolean;
}
