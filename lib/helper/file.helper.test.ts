import { describe, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { readSourceFile, getSourceFilePaths } from './file.helper';

vi.mock('node:fs/promises');

const testDirectory = 'test-directory';
const testFilePath = 'test-directory/test.json';
const testYAMLPath = 'test-directory/test.yaml';

describe.concurrent('method: readSourceFile', () => {
  it('json 소스 파일을 올바르게 읽어야 한다', async ({ expect }) => {
    expect.assertions(1);

    const jsonContent = JSON.stringify({ name: 'Service 1' }, undefined, 2);
    vi.mocked(fs.readFile).mockResolvedValueOnce(jsonContent);

    const services = await readSourceFile(testFilePath);

    expect(services).toStrictEqual([{ name: 'Service 1' }]);
  });

  it('json 배열 소스 파일을 올바르게 읽어야 한다', async ({ expect }) => {
    expect.assertions(1);

    const jsonContent = JSON.stringify([{ name: 'Service 1' }], undefined, 2);
    vi.mocked(fs.readFile).mockResolvedValueOnce(jsonContent);

    const services = await readSourceFile(testFilePath);

    expect(services).toStrictEqual([{ name: 'Service 1' }]);
  });

  it('yaml 소스 파일을 올바르게 읽어야 한다', async ({ expect }) => {
    expect.assertions(1);

    const yamlContent = `
    - name: Service 2
    `;
    vi.mocked(fs.readFile).mockResolvedValueOnce(yamlContent);

    const services = await readSourceFile(testYAMLPath);

    expect(services).toStrictEqual([{ name: 'Service 2' }]);
  });
});

describe.concurrent('method: getSourceFilePaths', () => {
  it('디렉터리 경로가 주어지면 해당 디렉토리의 모든 파일 경로를 가져와야 한다', async ({
    expect,
  }) => {
    expect.assertions(2);

    const files = ['test.json', 'test.yaml', 'test/test.yml', 'test'];
    const expected = files
      .filter((filePath) => path.extname(filePath))
      .map((filePath) => `${testDirectory}/${filePath}`);

    vi.mocked(fs.readdir).mockResolvedValueOnce(files as unknown as []);
    vi.mocked(fs.stat).mockResolvedValueOnce({
      isFile: () => false,
    } as Awaited<ReturnType<typeof fs.stat>>);

    const filePaths = await getSourceFilePaths(testDirectory);

    expect(fs.readdir).toHaveBeenCalledWith(testDirectory, {
      encoding: 'utf8',
      recursive: true,
    });
    expect(filePaths).toStrictEqual(expected);
  });

  it('파일 경로가 주어지면 해당 파일 경로를 반환해야 한다', async ({
    expect,
  }) => {
    expect.assertions(1);

    vi.mocked(fs.stat).mockResolvedValueOnce({
      isFile: () => true,
    } as Awaited<ReturnType<typeof fs.stat>>);

    const filePaths = await getSourceFilePaths(testFilePath);

    expect(filePaths).toStrictEqual([testFilePath]);
  });
});
