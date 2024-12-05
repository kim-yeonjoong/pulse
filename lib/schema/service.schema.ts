import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const Service = sqliteTable('service', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  name: text('name').notNull(),
  last_response: text('last_response'),
});
