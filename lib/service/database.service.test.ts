import { afterAll, describe, expect, it } from 'vitest';
import {
  exportLatestResult,
  initDatabase,
  updateResult,
} from './database.service';
import fs from 'node:fs';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/libsql';
import { isJsonStructureEqual } from '../shared/is-json-structure-equal';
import { Service, Log } from '../schema';
import { eq } from 'drizzle-orm';

const TEST_DB_PATH = path.join(import.meta.dirname, 'test.db');
const TEST_JSON_PATH = path.join(import.meta.dirname, 'test.json');

const DUMMY_SERVICE_NAME = 'Pulse';
const DUMMY_PULSE_CHECK_RESULTS = [
  { name: 'Service A', status: true, response: 'OK' },
  { name: 'Service B', status: false, response: undefined },
];

const JSON_RESULT = {
  Pulse: [
    {
      name: 'Service B',
      response: 'undefined',
      logs: [
        { status: false, timestamp: '2024-12-05 02:11:49' },
        { status: false, timestamp: '2024-12-05 02:11:49' },
        { status: false, timestamp: '2024-12-05 02:11:49' },
      ],
    },
    {
      name: 'Service A',
      response: '"OK"',
      logs: [
        { status: false, timestamp: '2024-12-05 02:11:49' },
        { status: true, timestamp: '2024-12-05 02:11:49' },
        { status: true, timestamp: '2024-12-05 02:11:49' },
        { status: true, timestamp: '2024-12-05 02:11:49' },
      ],
    },
  ],
};

describe.sequential('database.service', () => {
  // eslint-disable-next-line vitest/no-hooks
  afterAll(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (fs.existsSync(TEST_JSON_PATH)) {
      fs.unlinkSync(TEST_JSON_PATH);
    }
  });

  it('데이터베이스가 없으면 생성해야 한다', async () => {
    expect.assertions(1);

    await initDatabase(TEST_DB_PATH);

    expect(fs.existsSync(TEST_DB_PATH)).toBeTruthy();
  });

  it('데이터베이스가 있으면 생성하지 않아야 한다', async () => {
    expect.assertions(1);

    await initDatabase(TEST_DB_PATH);

    expect(fs.existsSync(TEST_DB_PATH)).toBeTruthy();
  });

  it('서비스 상태를 업데이트해야 한다', async () => {
    expect.assertions(2);

    await updateResult(DUMMY_SERVICE_NAME, DUMMY_PULSE_CHECK_RESULTS, {
      OUTPUT_FILE_PATH: TEST_DB_PATH,
    } as CliOptions);

    const database = drizzle(`file:${TEST_DB_PATH}`);

    await expect(database.select().from(Service).all()).resolves.toHaveLength(
      2,
    );
    await expect(database.select().from(Log).all()).resolves.toHaveLength(2);
  });

  it('중복된 서비스 이름을 처리해야 한다', async () => {
    expect.assertions(2);

    const duplicateResults = [
      { name: 'Service A', status: true, response: 'OK' },
      { name: 'Service A', status: false, response: 'Error' },
    ];

    await updateResult(DUMMY_SERVICE_NAME, duplicateResults, {
      OUTPUT_FILE_PATH: TEST_DB_PATH,
    } as CliOptions);

    const database = drizzle(`file:${TEST_DB_PATH}`);

    await expect(database.select().from(Service).all()).resolves.toHaveLength(
      2,
    );
    await expect(database.select().from(Log).all()).resolves.toHaveLength(4);
  });

  it('빈 결과를 처리할 수 있어야 한다', async () => {
    expect.assertions(2);

    await updateResult(DUMMY_SERVICE_NAME, [], {
      OUTPUT_FILE_PATH: TEST_DB_PATH,
    } as CliOptions);
    const database = drizzle(`file:${TEST_DB_PATH}`);

    await expect(database.select().from(Log).all()).resolves.toHaveLength(4);
    await expect(database.select().from(Service).all()).resolves.toHaveLength(
      2,
    );
  });

  it('각 서비스의 로그가 최대치를 초과한 경우 오래된 로그를 삭제해야 한다', async () => {
    expect.assertions(3);

    await updateResult(
      DUMMY_SERVICE_NAME,
      [
        ...DUMMY_PULSE_CHECK_RESULTS,
        { ...DUMMY_PULSE_CHECK_RESULTS[0], response: 'latest' },
      ],
      {
        OUTPUT_FILE_PATH: TEST_DB_PATH,
        MAX_STATUS_LOG: 3,
      } as CliOptions,
    );

    const database = drizzle(`file:${TEST_DB_PATH}`);

    await expect(database.select().from(Log).all()).resolves.toHaveLength(5);

    const service = await database
      .select()
      .from(Service)
      .where(eq(Service.name, DUMMY_PULSE_CHECK_RESULTS[0].name))
      .get();

    const log = await database.select().from(Log).orderBy(Log.timestamp).get();

    expect(service?.last_response).toBe('"latest"');
    expect(service?.id).toStrictEqual(log?.service_id);
  });

  it('결과를 JSON 으로 내보낼 수 있어야 한다', async () => {
    expect.assertions(3);

    await updateResult(DUMMY_SERVICE_NAME, DUMMY_PULSE_CHECK_RESULTS, {
      OUTPUT_FILE_PATH: TEST_DB_PATH,
    } as CliOptions);

    await exportLatestResult({ OUTPUT_FILE_PATH: TEST_DB_PATH } as CliOptions);

    expect(fs.existsSync(TEST_JSON_PATH)).toBeTruthy();

    const exportedData = JSON.parse(
      fs.readFileSync(TEST_JSON_PATH, 'utf8'),
    ) as Record<string, unknown>;

    expect(exportedData[DUMMY_SERVICE_NAME]).toHaveLength(2);
    expect(isJsonStructureEqual(exportedData, JSON_RESULT)).toBeTruthy();
  });
});
