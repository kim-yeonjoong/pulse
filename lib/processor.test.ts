import { describe, it, expect, vi } from 'vitest';
import { execute } from './processor';
import { readSourceFile } from './helper';
import { getSpinnerInstance } from './shared/spinner';
import { SourceFileSchema } from './shared/validate-schema';
import * as service from './service';
import { z } from 'zod';

vi.mock('./service', () => ({
  checkStatus: vi.fn<() => void>(),
  updateResult: vi.fn<() => void>(),
}));

vi.mock('./helper', () => ({
  readSourceFile: vi.fn<() => void>(),
}));

vi.mock('ora', () => {
  return {
    default: vi.fn<() => void>(() => ({
      start: vi.fn<() => void>(),
      info: vi.fn<() => void>(),
      fail: vi.fn<() => void>(),
      warn: vi.fn<() => void>(),
    })),
  };
});

const DUMMY_VALID_SOURCE = [
  {
    title: 'Pulse sample',
    checks: [
      {
        name: 'GitHub Home',
        type: 'http',
        host: 'https://github.com',
        expectedCode: 200,
      },
      {
        name: 'GitHub API',
        type: 'http',
        host: 'https://api.github.com',
        expectedCode: 200,
      },
    ],
  },
];

type SourceFile = z.infer<typeof SourceFileSchema>;

describe('execute 함수', () => {
  it('유효한 소스 파일은 정상처리 해야 한다', async () => {
    expect.assertions(1);

    vi.mocked(readSourceFile).mockResolvedValueOnce(
      DUMMY_VALID_SOURCE as unknown as Service[],
    );
    vi.mocked(service.checkStatus).mockResolvedValue({
      status: true,
      response: 'success',
    });
    vi.spyOn(service, 'updateResult');

    await execute('invalid/path', { EXECUTE_CONCURRENCY: 2 } as CliOptions);

    expect(service.updateResult).toHaveBeenCalledWith(
      'Pulse sample',
      [
        {
          name: 'GitHub Home',
          response: 'success',
          status: true,
          url: 'https://github.com',
        },
        {
          name: 'GitHub API',
          response: 'success',
          status: true,
          url: 'https://api.github.com',
        },
      ],
      {
        EXECUTE_CONCURRENCY: 2,
      },
    );
  });

  it('체크에 실패하면 오류 메시지를 출력해야 한다', async () => {
    expect.assertions(1);

    vi.mocked(readSourceFile).mockResolvedValueOnce(
      DUMMY_VALID_SOURCE as unknown as Service[],
    );
    vi.mocked(service.checkStatus).mockResolvedValue({
      status: false,
      response: 'success',
    });
    vi.spyOn(service, 'updateResult');
    const spinner = getSpinnerInstance();
    vi.spyOn(spinner, 'fail');

    await execute('invalid/path', { EXECUTE_CONCURRENCY: 2 } as CliOptions);

    expect(spinner.fail).toHaveBeenCalledWith('GitHub Home');
  });

  it('유효하지 않은 소스 파일은 경고처리 한다', async () => {
    expect.assertions(1);

    const mockSource = [
      {
        title: 'Failed Service',
        checks: [{ type: 'http', name: 'Failed check' }],
      },
    ] as SourceFile;

    vi.mocked(readSourceFile).mockResolvedValueOnce(
      mockSource as unknown as Service[],
    );

    vi.spyOn(SourceFileSchema, 'safeParse');

    const spinner = getSpinnerInstance();

    await execute('invalid/path', { EXECUTE_CONCURRENCY: 2 } as CliOptions);

    expect(spinner.warn).toHaveBeenCalledWith(
      `Invalid source file: invalid/path`,
    );
  });

  it('체크가 실패한 경우에도 처리해야 한다', async () => {
    expect.assertions(2);

    const mockSource: SourceFile = [
      {
        title: 'Failed Service',
        checks: [{ type: 'http', name: 'Failed check', host: 'string' }],
      },
    ];

    vi.mocked(readSourceFile).mockResolvedValueOnce(
      mockSource as unknown as Service[],
    );

    vi.spyOn(SourceFileSchema, 'safeParse').mockReturnValueOnce({
      success: true,
      data: mockSource,
    });

    vi.mocked(service.checkStatus).mockRejectedValueOnce(
      new Error('Check failed'),
    );

    const spinner = getSpinnerInstance();
    vi.spyOn(spinner, 'fail');
    vi.spyOn(service, 'updateResult');

    await execute('valid/path', { EXECUTE_CONCURRENCY: 1 } as CliOptions);

    expect(spinner.fail).toHaveBeenCalledWith(
      'Failed to check status for Failed check',
    );
    expect(service.updateResult).toHaveBeenCalledOnce();
  });
});
