import { describe, it, expect } from 'vitest';
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

describe.concurrent('SourceFileSchema', () => {
  it('유효한 양식인 경우 검증에 성공해야 한다', () => {
    const result = SourceFileSchema.safeParse(DUMMY);
    expect(result.success).toBe(true);
  });

  it('유효한 양식의 배열인 경우 검증에 성공해야 한다', () => {
    const result = SourceFileSchema.safeParse(ANOTHER_DUMMY);
    expect(result.success).toBe(true);
  });

  it('유효하지 않은 객체의 경우 검증 실패해야 한다', () => {
    const result = SourceFileSchema.safeParse(INVALID_DUMMY);
    expect(result.success).toBe(false);
  });

  describe.concurrent('필수값이 없으면 검증에 실패해야 한다', () => {
    it('title 이 없으면 실패해야 한다', () => {
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
      expect(result.success).toBe(false);
    });

    it('checks 가 없으면 실패해야 한다', () => {
      const result = SourceFileSchema.safeParse({
        title: 'Test Service',
        baseUrl: 'https://example.com',
        baseHeaders: { 'x-library-name': 'pulse' },
      });
      expect(result.success).toBe(false);
    });

    it('checks 안에 type 이 없으면 실패해야 한다', () => {
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
      expect(result.success).toBe(false);
    });

    it('checks 안에 name 이 없으면 실패해야 한다', () => {
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
      expect(result.success).toBe(false);
    });

    it('checks 안에 host 가 없으면 실패해야 한다', () => {
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
      expect(result.success).toBe(false);
    });
    it('빈 객체는 실패해야 한다', () => {
      const result = SourceFileSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  it('필수값만 있어도 검증에 성공해야 한다', () => {
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
    expect(result.success).toBe(true);
  });
});
