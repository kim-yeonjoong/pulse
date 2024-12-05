import { isObject } from 'es-toolkit/compat';

export const compareJsonStructure = (
  json1: unknown,
  json2: unknown,
): boolean => {
  if (Array.isArray(json1) && Array.isArray(json2)) {
    return json1.every((item, index) =>
      compareJsonStructure(item, json2[index]),
    );
  }

  if (isObject(json1) && isObject(json2)) {
    return Object.keys(json1).every(
      (key) => key in json2 && compareJsonStructure(json1[key], json2[key]),
    );
  }

  return true;
};
