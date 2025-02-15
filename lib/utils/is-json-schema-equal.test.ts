import { describe, it } from 'vitest';
import { isJsonSchemaEqual } from './is-json-schema-equal';

describe.concurrent('isJsonSchemaEqual', () => {
  it('객체가 아닌 값이 인자로 들어오면 false 를 반환해야 한다.', ({
    expect,
  }) => {
    expect.assertions(6);

    expect(isJsonSchemaEqual(123, {})).toBe(false);
    expect(isJsonSchemaEqual('문자열', {})).toBe(false);
    // eslint-disable-next-line unicorn/no-null
    expect(isJsonSchemaEqual(null, {})).toBe(false);
    expect(isJsonSchemaEqual(undefined, {})).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(isJsonSchemaEqual(() => {}, {})).toBe(false);
    expect(isJsonSchemaEqual(/^0-9/, {})).toBe(false);
  });

  it('빈 객체 두 개가 들어오면 true 를 반환해야 한다.', ({ expect }) => {
    expect.assertions(1);

    expect(isJsonSchemaEqual({}, {})).toBe(true);
  });

  it('키와 타입이 동일한 경우 true 를 반환해야 한다.', ({ expect }) => {
    expect.assertions(1);

    const object1 = { a: 1, b: 'hello' };
    const object2 = { b: 'world', a: 42 };

    expect(isJsonSchemaEqual(object1, object2)).toBe(true);
  });

  it('키의 개수가 다르면 false 를 반환해야 한다.', ({ expect }) => {
    expect.assertions(1);

    const object1 = { a: 1 };
    const object2 = { a: 1, b: 2 };

    expect(isJsonSchemaEqual(object1, object2)).toBe(false);
  });

  it('중첩 객체의 키와 타입이 동일한 경우 true 를 반환해야 한다.', ({
    expect,
  }) => {
    expect.assertions(1);

    const object1 = { a: { b: 1, c: 'test' } };
    const object2 = { a: { b: 2, c: 'another' } };

    expect(isJsonSchemaEqual(object1, object2)).toBe(true);
  });

  it('중첩 객체의 스키마가 다른 경우 false 를 반환해야 한다.', ({ expect }) => {
    expect.assertions(1);

    const object1 = { a: { b: 1, c: 'test' } };
    const object2 = { a: { b: 'wrong', c: 'another' } };

    expect(isJsonSchemaEqual(object1, object2)).toBe(false);
  });
});
