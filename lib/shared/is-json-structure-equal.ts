export const isJsonStructureEqual = (
  source: unknown,
  target: unknown,
  visited: WeakSet<object> = new WeakSet(),
): boolean => {
  if (source === null || target === null) {
    return source === target; // null은 객체가 아님
  }

  if (typeof source !== typeof target) {
    return false;
  }

  if (Array.isArray(source) || Array.isArray(target)) {
    return (
      Array.isArray(source) &&
      Array.isArray(target) &&
      source.length === target.length &&
      source.every((item, index) =>
        isJsonStructureEqual(item, target[index], visited),
      )
    );
  }

  if (typeof source === 'object' && typeof target === 'object') {
    if (visited.has(source as object) || visited.has(target as object)) {
      return true; // 순환 참조가 동일한지 확인
    }

    visited.add(source as object);
    visited.add(target as object);

    const sourceKeys = Object.keys(source as Record<string, unknown>);
    const targetKeys = Object.keys(target as Record<string, unknown>);

    return (
      sourceKeys.length === targetKeys.length &&
      sourceKeys.every(
        (key) =>
          key in (target as Record<string, unknown>) &&
          isJsonStructureEqual(
            (source as Record<string, unknown>)[key],
            (target as Record<string, unknown>)[key],
            visited,
          ),
      )
    );
  }

  return true;
};
