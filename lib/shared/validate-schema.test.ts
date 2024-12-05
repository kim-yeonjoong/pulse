import { describe, it } from 'vitest';
import { SourceFileSchema } from './validate-schema';

const DUMMY = {
  title: 'Test Service',
  baseUrl: 'https://example.com',
  baseHeaders: {
    'x-library-name': 'pulse',
  },
  checks: [
    {
      type: 'http',
      name: 'Health Check',
      host: 'https://example.com/health',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      expectedCode: 200,
    },
  ],
};

const ANOTHER_DUMMY = [DUMMY, { ...DUMMY, title: 'Another Service' }];

const INVALID_DUMMY = {
  title: '',
  checks: [
    {
      type: 'http',
      name: '',
      host: '',
    },
  ],
};

describe.concurrent('sourceFileSchema', () => {
  it('유효한 양식인 경우 검증에 성공해야 한다', ({ expect }) => {
    expect.assertions(1);

    const result = SourceFileSchema.safeParse(DUMMY);

    expect(result.success).toBeTruthy();
  });

  it('유효한 양식의 배열인 경우 검증에 성공해야 한다', ({ expect }) => {
    expect.assertions(1);

    const result = SourceFileSchema.safeParse(ANOTHER_DUMMY);

    expect(result.success).toBeTruthy();
  });

  it('유효하지 않은 객체의 경우 검증 실패해야 한다', ({ expect }) => {
    expect.assertions(1);

    const result = SourceFileSchema.safeParse(INVALID_DUMMY);

    expect(result.success).toBeFalsy();
  });

  describe.concurrent('필수값이 없으면 검증에 실패해야 한다', () => {
    it('title 이 없으면 실패해야 한다', ({ expect }) => {
      expect.assertions(1);

      const result = SourceFileSchema.safeParse({
        baseUrl: 'https://example.com',
        baseHeaders: { 'x-library-name': 'pulse' },
        checks: [
          {
            type: 'http',
            name: 'Health Check',
            host: 'https://example.com/health',
          },
        ],
      });

      expect(result.success).toBeFalsy();
    });

    it('checks 가 없으면 실패해야 한다', ({ expect }) => {
      expect.assertions(1);

      const result = SourceFileSchema.safeParse({
        title: 'Test Service',
        baseUrl: 'https://example.com',
        baseHeaders: { 'x-library-name': 'pulse' },
      });

      expect(result.success).toBeFalsy();
    });

    it('checks 안에 type 이 없으면 실패해야 한다', ({ expect }) => {
      expect.assertions(1);

      const result = SourceFileSchema.safeParse({
        title: 'Test Service',
        baseUrl: 'https://example.com',
        baseHeaders: { 'x-library-name': 'pulse' },
        checks: [
          {
            name: 'Health Check',
            host: 'https://example.com/health',
          },
        ],
      });

      expect(result.success).toBeFalsy();
    });

    it('checks 안에 name 이 없으면 실패해야 한다', ({ expect }) => {
      expect.assertions(1);

      const result = SourceFileSchema.safeParse({
        title: 'Test Service',
        baseUrl: 'https://example.com',
        baseHeaders: { 'x-library-name': 'pulse' },
        checks: [
          {
            type: 'http',
            host: 'https://example.com/health',
          },
        ],
      });

      expect(result.success).toBeFalsy();
    });

    it('checks 안에 host 가 없으면 실패해야 한다', ({ expect }) => {
      expect.assertions(1);

      const result = SourceFileSchema.safeParse({
        title: 'Test Service',
        baseUrl: 'https://example.com',
        baseHeaders: { 'x-library-name': 'pulse' },
        checks: [
          {
            type: 'http',
            name: 'Health Check',
          },
        ],
      });

      expect(result.success).toBeFalsy();
    });

    it('빈 객체는 실패해야 한다', ({ expect }) => {
      expect.assertions(1);

      const result = SourceFileSchema.safeParse({});

      expect(result.success).toBeFalsy();
    });
  });

  it('필수값만 있어도 검증에 성공해야 한다', ({ expect }) => {
    expect.assertions(1);

    const minimalService = {
      title: 'Minimal Service',
      checks: [
        {
          type: 'http',
          name: 'Minimal Check',
          host: 'https://example.com',
        },
      ],
    };

    const result = SourceFileSchema.safeParse(minimalService);

    expect(result.success).toBeTruthy();
  });
});
