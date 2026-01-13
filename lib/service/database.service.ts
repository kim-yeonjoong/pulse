import { isNil } from 'es-toolkit';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Log, Service } from '../schema';
import { stringifyJSON } from 'confbox';
import { DatabaseManager } from './database-manager';

interface ExportLog {
  status: boolean;
  timestamp: string;
}
type ExportJson = Record<
  string,
  {
    name: string;
    response: string;
    logs: ExportLog[];
  }[]
>;

export const initDatabase = async (filePath: string): Promise<void> => {
  const database = DatabaseManager.getConnection(filePath);

  await database.run(`CREATE TABLE IF NOT EXISTS service (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          name TEXT NOT NULL,
          last_response TEXT,
          UNIQUE (title, name));`);

  await database.run(
    `CREATE TABLE IF NOT EXISTS log (
          id TEXT PRIMARY KEY,
          service_id INTEGER NOT NULL,
          status BOOLEAN NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES service (id)
        );`,
  );
};

export const updateResult = async (
  title: string,
  results: ServiceStatusResult[],
  { OUTPUT_FILE_PATH, MAX_STATUS_LOG }: CliOptions,
): Promise<void> => {
  const database = DatabaseManager.getConnection(OUTPUT_FILE_PATH);

  for (const serviceStatus of results) {
    await database.transaction(async (transaction) => {
      let serviceId: string;

      const service = await transaction
        .select()
        .from(Service)
        .where(
          and(eq(Service.title, title), eq(Service.name, serviceStatus.name)),
        )
        .get();

      if (isNil(service)) {
        const [createdService] = await transaction
          .insert(Service)
          .values({ title, name: serviceStatus.name })
          .returning({ insertedId: Service.id });

        serviceId = createdService.insertedId;
      } else {
        serviceId = service.id;
      }

      await transaction
        .insert(Log)
        .values({
          service_id: serviceId,
          status: serviceStatus.status,
        })
        .run();

      await transaction
        .update(Service)
        .set({
          last_response: stringifyJSON(serviceStatus.response),
        })
        .where(eq(Service.id, serviceId))
        .run();

      const serviceLogCount = await transaction.$count(
        Log,
        eq(Log.service_id, serviceId),
      );

      if (serviceLogCount > MAX_STATUS_LOG) {
        const targetIds = await transaction
          .select({ id: Log.id })
          .from(Log)
          .where(eq(Log.service_id, serviceId))
          .orderBy(desc(Log.timestamp))
          .offset(MAX_STATUS_LOG)
          .limit(serviceLogCount - MAX_STATUS_LOG)
          .all();

        await transaction
          .delete(Log)
          .where(
            inArray(
              Log.id,
              targetIds.flatMap(({ id }) => id),
            ),
          )
          .run();
      }
    });
  }
};

export const exportLatestResult = async ({
  OUTPUT_FILE_PATH,
}: CliOptions): Promise<void> => {
  const database = DatabaseManager.getConnection(OUTPUT_FILE_PATH);

  const serviceLogs = await database
    .select({
      title: Service.title,
      name: Service.name,
      lastResponse: Service.last_response,
      logs: sql`json_group_array(json_object(
         'status', CASE WHEN ${Log.status} = 1 THEN 'true' ELSE 'false' END,
          'timestamp', ${Log.timestamp}
        ) ORDER BY ${Log.timestamp} DESC)`.as('logs'),
    })
    .from(Service)
    .leftJoin(Log, eq(Log.service_id, Service.id))
    .groupBy(Service.title, Service.id)
    .orderBy(desc(Service.title));

  const exportResult: ExportJson = {};

  for (const row of serviceLogs) {
    if (!exportResult[row.title]) {
      exportResult[row.title] = [];
    }

    exportResult[row.title].push({
      name: row.name,
      response: String(row.lastResponse),
      logs: (JSON.parse(String(row.logs)) as ExportLog[]).map(
        (log: ExportLog) => ({ ...log, status: String(log.status) === 'true' }),
      ),
    });
  }

  const exportFilePath = path.join(
    path.dirname(OUTPUT_FILE_PATH),
    path.basename(OUTPUT_FILE_PATH, path.extname(OUTPUT_FILE_PATH)) + '.json',
  );
  await fs.writeFile(exportFilePath, JSON.stringify(exportResult));
};

export const closeDatabase = (filePath: string): void => {
  DatabaseManager.closeConnection(filePath);
};

export const closeAllDatabases = (): void => {
  DatabaseManager.closeAll();
};
