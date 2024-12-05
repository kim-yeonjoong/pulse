import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { Service } from './service.schema';

export const Log = sqliteTable('log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  service_id: text('service_id')
    .notNull()
    .references(() => Service.id),
  status: integer('status', { mode: 'boolean' }).notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(
    sql`(current_timestamp)`,
  ),
});
