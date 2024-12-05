/* eslint-disable @typescript-eslint/no-explicit-any,unicorn/no-null */
import { describe, it } from 'vitest';
import { isJsonStructureEqual } from './is-json-structure-equal';

describe.concurrent('isJsonStructureEqual', () => {
  describe.concurrent('객체', () => {
    it('두 객체의 구조가 같다면 같아야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = { a: 1, b: { c: 2 } };
      const target = { a: 3, b: { c: 4 } };

      expect(isJsonStructureEqual(source, target)).toBe(true);
    });

    it('두 객체의 구조가 다르다면 달라야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = { a: 1, b: { c: 2 } };
      const target = { a: 1, b: { d: 2 } };

      expect(isJsonStructureEqual(source, target)).toBe(false);
    });

    it('비어 있는 객체는 구조가 같아야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = {};
      const target = {};

      expect(isJsonStructureEqual(source, target)).toBe(true);
    });
  });

  describe.concurrent('배열', () => {
    it('배열 요소의 값만 다른 경우에는 같아야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = [1, { a: 1 }, [2]];
      const target = [0, { a: 2 }, [3]];

      expect(isJsonStructureEqual(source, target)).toBe(true);
    });

    it('배열 요소의 타입이 다르다면 달라야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = [1, { a: 1 }, [2]];
      const target = [1, { b: 1 }, [2]];

      expect(isJsonStructureEqual(source, target)).toBe(false);
    });
  });

  describe.concurrent('순환참조', () => {
    it('순환 참조를 가진 객체들의 최종 형태가 동일하다면 같아야 한다', ({
      expect,
    }) => {
      expect.assertions(1);

      const source: any = {};
      source.self = source;

      const target: any = {};
      target.self = target;

      expect(isJsonStructureEqual(source, target)).toBe(true);
    });

    it('일부만 순환참조여도 최종적으로 구조가 같다면 같아야 한다', ({
      expect,
    }) => {
      expect.assertions(1);

      const source: any = {};
      source.self = source;

      const target = { self: {} };

      expect(isJsonStructureEqual(source, target)).toBe(true);
    });
  });

  describe.concurrent('다른 타입', () => {
    it('객체와 배열은 달라야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = { a: 1 };
      const target = [1];

      expect(isJsonStructureEqual(source, target)).toBe(false);
    });

    it('null 과 객체는 달라야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = null;
      const target = {};

      expect(isJsonStructureEqual(source, target)).toBe(false);
    });

    it('undefined 와 객체는 달라야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = undefined;
      const target = {};

      expect(isJsonStructureEqual(source, target)).toBe(false);
    });

    it('null 과 undefined 는 달라야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = 1;
      const target = '1';

      expect(isJsonStructureEqual(source, target)).toBe(false);
    });

    it('다른 타입의 값은 달라야 한다', ({ expect }) => {
      expect.assertions(1);

      const source = 1;
      const target = '1';

      expect(isJsonStructureEqual(source, target)).toBe(false);
    });
  });
});
