import { isJSONObject } from 'es-toolkit';

export const isJsonStructureEqual = (
  object1: unknown,
  object2: unknown,
): boolean => {
  if (!(isJSONObject(object1) && isJSONObject(object2))) {
    return false;
  }

  const object1Keys = Object.keys(object1).sort();
  const object2Keys = Object.keys(object2).sort();

  if (
    object1Keys.length !== object2Keys.length ||
    object1Keys.some((value, index) => value !== object2Keys[index])
  ) {
    return false;
  }

  return object1Keys.every((key) => {
    const value1 = object1[key];
    const value2 = object2[key];

    if (typeof value1 !== typeof value2) {
      return false;
    }

    if (isJSONObject(value1) && isJSONObject(value2)) {
      return isJsonStructureEqual(value1, value2);
    }

    return true;
  });
};
