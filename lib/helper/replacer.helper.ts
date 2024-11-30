import { isNil, isString } from 'es-toolkit';
import { hasProtocol, joinURL } from 'ufo';

export const replaceEnvironmentValue = (value: string | object): string => {
  const environments = Object.entries(process.env)
    .filter(([key, value_]) => key.startsWith('PULSE_') && value_ != undefined)
    .map(([key, value_]) => [key, String(value_)]);

  let result = isString(value) ? value : JSON.stringify(value);

  for (const [key, environmentValue] of environments) {
    result = result.replaceAll(key, environmentValue);
  }

  return result;
};

export const getHostWithBase = (host: string, baseUrl?: string) => {
  if (isNil(baseUrl)) {
    return host;
  }
  return hasProtocol(host) ? host : joinURL(baseUrl, host);
};
