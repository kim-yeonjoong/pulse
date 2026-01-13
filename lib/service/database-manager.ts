import { drizzle } from 'drizzle-orm/libsql';

type DrizzleClient = ReturnType<typeof drizzle>;

const connections = new Map<string, DrizzleClient>();

export const getConnection = (filePath: string): DrizzleClient => {
  const existing = connections.get(filePath);
  if (existing) {
    return existing;
  }

  const newConnection = drizzle(`file:${filePath}`);
  connections.set(filePath, newConnection);
  return newConnection;
};

export const closeConnection = (filePath: string): void => {
  const connection = connections.get(filePath);
  if (connection) {
    connection.$client.close();
    connections.delete(filePath);
  }
};

export const closeAllConnections = (): void => {
  for (const [, connection] of connections) {
    connection.$client.close();
  }
  connections.clear();
};

export const DatabaseManager = {
  getConnection,
  closeConnection,
  closeAll: closeAllConnections,
};
