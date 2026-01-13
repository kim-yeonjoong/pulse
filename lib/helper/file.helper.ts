import fs from 'node:fs/promises';
import path from 'node:path';
import { parseJSON, parseYAML } from 'confbox';

export const readSourceFile = async (filePath: string): Promise<Service[]> => {
  const rawContent = await fs.readFile(filePath, 'utf8');
  const content = (filePath.endsWith('.json') ? parseJSON : parseYAML)(
    rawContent,
  );

  return (Array.isArray(content) ? content : [content]) as Service[];
};

export const getSourceFilePaths = async (
  directoryOrFilePath: string,
): Promise<string[]> => {
  const FILE_EXTENSIONS = new Set(['.yaml', '.yml', '.json']);

  const stat = await fs.stat(directoryOrFilePath);
  if (stat.isFile()) {
    return [directoryOrFilePath];
  }

  const files = await fs.readdir(directoryOrFilePath, {
    encoding: 'utf8',
    recursive: true,
  });

  return files
    .filter((file) => FILE_EXTENSIONS.has(path.extname(file)))
    .map((file) => path.join(directoryOrFilePath, file));
};
