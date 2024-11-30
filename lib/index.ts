import { exportLatestResult, initDatabase } from './service';
import { chunk } from 'es-toolkit';
import { execute } from './processor';
import consola from 'consola';
import { getSourceFilePaths, initCli } from './helper';
import * as process from 'node:process';
import { getSpinnerInstance } from './shared/spinner';

const options = initCli();

await initDatabase(options.OUTPUT_FILE_PATH);

const sourceFileNames = getSourceFilePaths(options.SOURCE_PATH);

const spinner = getSpinnerInstance().start('Checking API Pulse...');

try {
  for (const chunkElement of chunk(sourceFileNames, options.FILE_CONCURRENCY)) {
    await Promise.all(chunkElement.map((element) => execute(element, options)));
  }

  spinner.succeed(`result save to ${options.OUTPUT_FILE_PATH}`);

  if (options.EXPORT_JSON) {
    await exportLatestResult(options);
  }
} catch (error) {
  consola.error(error);
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
} finally {
  spinner.stop();
}
