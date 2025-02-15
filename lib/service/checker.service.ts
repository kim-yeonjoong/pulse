import { isJSONObject, isNil, isNotNil } from 'es-toolkit';
import ky, { Options } from 'ky';
import { defu } from 'defu';
import { getHostWithBase, replaceEnvironmentValue } from '../helper';
import { isJsonSchemaEqual } from '../utils/is-json-schema-equal';

type Adapter<T extends Omit<BaseCheck, 'type'> = BaseCheck> = (
  timeout?: number,
) => (service: T) => Promise<{ status: boolean; response?: unknown }>;

const createHttpAdapter: Adapter<HttpCheck> = () => {
  return async (check: HttpCheck) => {
    const data = isNil(check.data)
      ? undefined
      : replaceEnvironmentValue(check.data || {});
    const method = (check.method || 'GET').toUpperCase();

    try {
      const requestOptions: Options = {
        headers: check.headers,
        method,
        throwHttpErrors: false,
        ...(method === 'GET' ? { searchParams: data } : { json: data }),
      };

      const response = await ky(check.host, requestOptions);
      const responseBody = await response.json();

      let status = response.status === check.expectedCode;

      if (status && isNotNil(check.expectedBody)) {
        status = status && isJsonSchemaEqual(check.expectedBody, responseBody);
      }

      return {
        status,
        response: responseBody,
      };
    } catch {
      return {
        status: false,
        response: undefined,
      };
    }
  };
};

const httpAdapter = createHttpAdapter();

export const checkStatus = <T extends Omit<BaseCheck, 'type'>>(
  service: Service,
  check: T,
): Promise<Awaited<ReturnType<ReturnType<Adapter>>>> => {
  check.host = replaceEnvironmentValue(
    getHostWithBase(check.host, service.baseUrl),
  );

  if (isHttpCheck(check)) {
    check.headers = defu(check.headers, service.baseHeaders, {
      'Content-Type': 'application/json',
    });
    return httpAdapter(check as HttpCheck);
  }

  throw new Error('Unsupported check type');
};

const isHttpCheck = (value: unknown): value is HttpCheck => {
  return (
    isNotNil(value) &&
    isJSONObject(value) &&
    'type' in value &&
    value.type === 'http'
  );
};
