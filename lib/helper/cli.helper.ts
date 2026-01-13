import { Argument, Command, Option } from 'commander';
import path from 'node:path';

const DEFAULT_PATH = './';
const DEFAULT_MAX_STATUS_LOG = 100;
const DEFAULT_FILE_CONCURRENCY = 5;
const DEFAULT_EXECUTE_CONCURRENCY = 50;

export const initCli = (): CliOptions => {
  const program = new Command();
  program
    .name('pulse')
    .description('Keeping the pulse of your APIs under watch.')
    .addArgument(
      new Argument('<path>', 'source file directory/file path')
        .argOptional()
        .default(DEFAULT_PATH),
    )
    .addOption(
      new Option('-m, --max <number>', 'max count of status logs')
        .default(DEFAULT_MAX_STATUS_LOG)
        .env('PULSE_STATUS_LOGS_MAX')
        .argParser((value) => {
          const temporary = Number.parseInt(value, 10);
          return Number.isNaN(temporary) ? DEFAULT_MAX_STATUS_LOG : temporary;
        }),
    )
    .addOption(
      new Option('-o, --out <file-path>', 'output file path')
        .env('PULSE_OUTPUT_PATH')
        .default('./pulse.sqlite'),
    )
    .addOption(
      new Option(
        '-c, --concurrency <number>',
        'Concurrent file processing count',
      )
        .default(DEFAULT_FILE_CONCURRENCY)
        .env('PULSE_FILE_CONCURRENCY')
        .argParser((value) => {
          const temporary = Number.parseInt(value, 10);
          return Number.isNaN(temporary) ? DEFAULT_FILE_CONCURRENCY : temporary;
        }),
    )
    .addOption(
      new Option(
        '-e, --execute-concurrency <number>',
        'Concurrent status check requests per file',
      )
        .default(DEFAULT_EXECUTE_CONCURRENCY)
        .env('PULSE_EXECUTE_CONCURRENCY')
        .argParser((value) => {
          const temporary = Number.parseInt(value, 10);
          return Number.isNaN(temporary)
            ? DEFAULT_EXECUTE_CONCURRENCY
            : temporary;
        }),
    )
    .addOption(new Option('--json', 'Export current result to json file'))
    .parse(process.argv);

  const currentPath = process.cwd();
  const options = program.opts();
  const [sourcePath] = program.args;

  return {
    MAX_STATUS_LOG: Number(options.max),
    SOURCE_PATH: path.resolve(currentPath, sourcePath || DEFAULT_PATH),
    OUTPUT_FILE_PATH: path.resolve(currentPath, String(options.out)),
    FILE_CONCURRENCY: Number(options.concurrency),
    EXECUTE_CONCURRENCY: Number(options.executeConcurrency),
    EXPORT_JSON: !!options.json,
  };
};
