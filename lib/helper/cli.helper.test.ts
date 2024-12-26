import { describe, it, vi } from 'vitest';
import { initCli } from './cli.helper';
import path from 'node:path';

const mockArgv = (arguments_: string[]) => {
  process.argv = ['node', 'script', ...arguments_];
};

describe.concurrent('initCli', () => {
  it('기본 옵션 값들을 설정해야 한다', ({ expect }) => {
    expect.assertions(1);

    mockArgv([]);
    vi.unstubAllEnvs();
    const options = initCli();

    expect(options).toStrictEqual({
      MAX_STATUS_LOG: 100,
      SOURCE_PATH: path.resolve(process.cwd(), './'),
      OUTPUT_FILE_PATH: path.resolve(process.cwd(), './pulse.sqlite'),
      FILE_CONCURRENCY: 5,
      EXECUTE_CONCURRENCY: 50,
      EXPORT_JSON: false,
    });
  });

  it('cLI 옵션으로 설정한 값을 반환해야 한다', ({ expect }) => {
    expect.assertions(1);

    mockArgv([
      './src',
      '-m',
      '200',
      '-o',
      './output.db',
      '-c',
      '10',
      '-e',
      '100',
      '--json',
    ]);
    vi.unstubAllEnvs();

    const options = initCli();

    expect(options).toStrictEqual({
      MAX_STATUS_LOG: 200,
      SOURCE_PATH: path.resolve(process.cwd(), './src'),
      OUTPUT_FILE_PATH: path.resolve(process.cwd(), './output.db'),
      FILE_CONCURRENCY: 10,
      EXECUTE_CONCURRENCY: 100,
      EXPORT_JSON: true,
    });
  });

  it('환경 변수 값을 사용해야 한다', ({ expect }) => {
    expect.assertions(1);

    mockArgv([]);
    vi.unstubAllEnvs();
    vi.stubEnv('PULSE_STATUS_LOGS_MAX', '300');
    vi.stubEnv('PULSE_OUTPUT_PATH', './env_output.db');
    vi.stubEnv('PULSE_FILE_CONCURRENCY', '15');
    vi.stubEnv('PULSE_EXECUTE_CONCURRENCY', '200');

    const options = initCli();

    expect(options).toStrictEqual({
      MAX_STATUS_LOG: 300,
      SOURCE_PATH: path.resolve(process.cwd(), './'),
      OUTPUT_FILE_PATH: path.resolve(process.cwd(), './env_output.db'),
      FILE_CONCURRENCY: 15,
      EXECUTE_CONCURRENCY: 200,
      EXPORT_JSON: false,
    });
  });

  it('숫자가 아닌 값은 기본값으로 대체해야 한다', ({ expect }) => {
    expect.assertions(1);

    mockArgv([]);
    vi.unstubAllEnvs();
    vi.stubEnv('PULSE_STATUS_LOGS_MAX', 'not-a-number');
    vi.stubEnv('PULSE_FILE_CONCURRENCY', 'not-a-number');
    vi.stubEnv('PULSE_EXECUTE_CONCURRENCY', 'not-a-number');

    const options = initCli();

    expect(options).toStrictEqual({
      MAX_STATUS_LOG: 100,
      SOURCE_PATH: path.resolve(process.cwd(), './'),
      OUTPUT_FILE_PATH: path.resolve(process.cwd(), './pulse.sqlite'),
      FILE_CONCURRENCY: 5,
      EXECUTE_CONCURRENCY: 50,
      EXPORT_JSON: false,
    });
  });
});
