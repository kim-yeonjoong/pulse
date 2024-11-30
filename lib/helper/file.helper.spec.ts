import { describe, expect, it, vi } from 'vitest';
import fs, { Dirent, Stats } from 'node:fs';
import path from 'node:path';
import { readSourceFile, getSourceFilePaths } from './file.helper';

vi.mock('node:fs');

const testDirectory = 'test-directory';
const testFilePath = 'test-directory/test.json';
const testYAMLPath = 'test-directory/test.yaml';

describe.concurrent('readSourceFile', () => {
  it('JSON 소스 파일을 올바르게 읽어야 한다', () => {
    const jsonContent = JSON.stringify([{ name: 'Service 1' }], undefined, 2);
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(jsonContent);

    const services = readSourceFile(testFilePath);

    expect(services).toStrictEqual([{ name: 'Service 1' }]);
  });

  it('YAML 소스 파일을 올바르게 읽어야 한다', () => {
    const yamlContent = `
    - name: Service 2
    `;
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce(yamlContent);

    const services = readSourceFile(testYAMLPath);

    expect(services).toEqual([{ name: 'Service 2' }]);
  });
});

describe.concurrent('getSourceFilePaths', () => {
  it('디렉터리 경로가 주어지면 해당 디렉토리의 모든 파일 경로를 가져와야 한다', async () => {
    const files = ['test.json', 'test.yaml', 'test/test.yml', 'test'];
    const expected = files
      .filter((filePath) => path.extname(filePath))
      .map((filePath) => `${testDirectory}/${filePath}`);

    vi.spyOn(fs, 'readdirSync').mockReturnValue(files as unknown as Dirent[]);
    vi.spyOn(fs, 'statSync').mockReturnValue({
      isFile: () => false,
    } as Stats);

    const filePaths = getSourceFilePaths(testDirectory);

    expect(fs.readdirSync).toBeCalledWith(testDirectory, {
      encoding: 'utf8',
      recursive: true,
    });
    expect(filePaths).toStrictEqual(expected);
  });

  it('파일 경로가 주어지면 해당 파일 경로를 반환해야 한다', () => {
    vi.spyOn(fs, 'statSync').mockReturnValueOnce({
      isFile: () => true,
    } as Stats);
    vi.spyOn(path, 'join').mockImplementation((...arguments_) =>
      arguments_.join('/'),
    );

    const filePaths = getSourceFilePaths(testFilePath);
    expect(filePaths).toEqual([testFilePath]);
  });
});
