/* eslint-disable vitest/require-mock-type-parameters */
import { describe, expect, it, vi, type Mock } from 'vitest';
import { checkStatus } from './checker.service';
import type ky from 'ky';

type KyMock = Mock<typeof ky>;

vi.mock('ky', () => ({
  default: vi.fn(),
}));

describe('checker.service', () => {
  describe(checkStatus, () => {
    it('hTTP 체크 타입에 대해 올바르게 처리해야 한다', async () => {
      expect.assertions(1);

      vi.clearAllMocks();
      const { default: kyDefault } = await import('ky');
      const mockKy = kyDefault as unknown as KyMock;

      mockKy.mockResolvedValue({
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true }),
      } as unknown as Response);

      const service: Service = {
        title: 'Test Service',
        checks: [],
      };

      const check: HttpCheck = {
        name: 'Test Check',
        host: 'https://api.example.com',
        type: 'http',
        expectedCode: 200,
      };

      const result = await checkStatus(service, check);

      expect(result.status).toBe(true);
    });

    it('예상 상태 코드가 일치하지 않으면 실패해야 한다', async () => {
      expect.assertions(1);

      vi.clearAllMocks();
      const { default: kyDefault } = await import('ky');
      const mockKy = kyDefault as unknown as KyMock;

      mockKy.mockResolvedValue({
        status: 500,
        json: vi.fn().mockResolvedValue({ error: 'Internal Server Error' }),
      } as unknown as Response);

      const service: Service = {
        title: 'Test Service',
        checks: [],
      };

      const check: HttpCheck = {
        name: 'Test Check',
        host: 'https://api.example.com',
        type: 'http',
        expectedCode: 200,
      };

      const result = await checkStatus(service, check);

      expect(result.status).toBe(false);
    });

    it('expectedBody가 있을 때 구조가 일치하면 성공해야 한다', async () => {
      expect.assertions(1);

      vi.clearAllMocks();
      const { default: kyDefault } = await import('ky');
      const mockKy = kyDefault as unknown as KyMock;

      mockKy.mockResolvedValue({
        status: 200,
        json: vi.fn().mockResolvedValue({ id: 123, name: 'test' }),
      } as unknown as Response);

      const service: Service = {
        title: 'Test Service',
        checks: [],
      };

      const check: HttpCheck = {
        name: 'Test Check',
        host: 'https://api.example.com',
        type: 'http',
        expectedCode: 200,
        expectedBody: { id: 0, name: '' },
      };

      const result = await checkStatus(service, check);

      expect(result.status).toBe(true);
    });

    it('expectedBody가 있을 때 구조가 일치하지 않으면 실패해야 한다', async () => {
      expect.assertions(1);

      vi.clearAllMocks();
      const { default: kyDefault } = await import('ky');
      const mockKy = kyDefault as unknown as KyMock;

      mockKy.mockResolvedValue({
        status: 200,
        json: vi.fn().mockResolvedValue({ id: 123 }),
      } as unknown as Response);

      const service: Service = {
        title: 'Test Service',
        checks: [],
      };

      const check: HttpCheck = {
        name: 'Test Check',
        host: 'https://api.example.com',
        type: 'http',
        expectedCode: 200,
        expectedBody: { id: 0, name: '' },
      };

      const result = await checkStatus(service, check);

      expect(result.status).toBe(false);
    });

    it('baseUrl이 있으면 호스트에 결합해야 한다', async () => {
      expect.assertions(1);

      vi.clearAllMocks();
      const { default: kyDefault } = await import('ky');
      const mockKy = kyDefault as unknown as KyMock;

      mockKy.mockResolvedValue({
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response);

      const service: Service = {
        title: 'Test Service',
        baseUrl: 'https://api.example.com',
        checks: [],
      };

      const check: HttpCheck = {
        name: 'Test Check',
        host: '/users',
        type: 'http',
        expectedCode: 200,
      };

      await checkStatus(service, check);

      expect(mockKy).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object),
      );
    });

    it('baseHeaders가 있으면 헤더에 병합해야 한다', async () => {
      expect.assertions(1);

      vi.clearAllMocks();
      const { default: kyDefault } = await import('ky');
      const mockKy = kyDefault as unknown as KyMock;

      mockKy.mockResolvedValue({
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response);

      const service: Service = {
        title: 'Test Service',
        baseHeaders: { Authorization: 'Bearer token' },
        checks: [],
      };

      const check: HttpCheck = {
        name: 'Test Check',
        host: 'https://api.example.com',
        type: 'http',
        expectedCode: 200,
      };

      await checkStatus(service, check);

      expect(mockKy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('네트워크 오류 발생 시 실패를 반환해야 한다', async () => {
      expect.assertions(2);

      vi.clearAllMocks();
      const { default: kyDefault } = await import('ky');
      const mockKy = kyDefault as unknown as KyMock;

      mockKy.mockRejectedValue(new Error('Network Error'));

      const service: Service = {
        title: 'Test Service',
        checks: [],
      };

      const check: HttpCheck = {
        name: 'Test Check',
        host: 'https://api.example.com',
        type: 'http',
        expectedCode: 200,
      };

      const result = await checkStatus(service, check);

      expect(result.status).toBe(false);
      expect(result.response).toBeUndefined();
    });

    it('지원하지 않는 체크 타입에 대해 에러를 throw해야 한다', () => {
      expect.assertions(1);

      const service: Service = {
        title: 'Test Service',
        checks: [],
      };

      const check = {
        name: 'Test Check',
        host: 'localhost',
        type: 'unsupported',
      } as unknown as Check;

      expect(() => checkStatus(service, check)).toThrow(
        'Unsupported check type',
      );
    });

    it('원본 check 객체를 변경하지 않아야 한다 (불변성)', async () => {
      expect.assertions(2);

      vi.clearAllMocks();
      const { default: kyDefault } = await import('ky');
      const mockKy = kyDefault as unknown as KyMock;

      mockKy.mockResolvedValue({
        status: 200,
        json: vi.fn().mockResolvedValue({}),
      } as unknown as Response);

      const service: Service = {
        title: 'Test Service',
        baseUrl: 'https://api.example.com',
        checks: [],
      };

      const originalHost = '/users';
      const check: HttpCheck = {
        name: 'Test Check',
        host: originalHost,
        type: 'http',
        expectedCode: 200,
      };

      await checkStatus(service, check);

      expect(check.host).toBe(originalHost);
      expect(check.headers).toBeUndefined();
    });
  });
});
