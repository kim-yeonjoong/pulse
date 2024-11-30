import fs from 'node:fs';
import path from 'node:path';
import { parseJSON, parseYAML } from 'confbox';

export const readSourceFile = (filePath: string): Service[] => {
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const content = (filePath.endsWith('.json') ? parseJSON : parseYAML)(
    rawContent,
  );

  return (Array.isArray(content) ? content : [content]) as Service[];
};

export const getSourceFilePaths = (directoryOrFilePath: string): string[] => {
  const FILE_EXTENSIONS = new Set(['.yaml', '.yml', '.json']);

  if (fs.statSync(directoryOrFilePath).isFile()) {
    return [directoryOrFilePath];
  }

  return fs
    .readdirSync(directoryOrFilePath, {
      encoding: 'utf8',
      recursive: true,
    })
    .filter((file) => FILE_EXTENSIONS.has(path.extname(file)))
    .filter((file) => FILE_EXTENSIONS.has(path.extname(file)))
    .map((file) => path.join(directoryOrFilePath, file));
};
