import { checkStatus, updateResult } from './service';
import { chunk } from 'es-toolkit';
import { readSourceFile } from './helper';
import { getSpinnerInstance } from './shared/spinner';
import { SourceFileSchema } from './shared/validate-schema';

const spinner = getSpinnerInstance();

const processCheck = async (service: Service, check: Check) => {
  spinner.start(`check : ${check.name}`);

  try {
    const { status, response } = await checkStatus(service, check);

    if (!status) {
      spinner.fail(check.name);
    }

    return { name: check.name, url: check.host, status, response };
  } catch (error) {
    spinner.fail(`Failed to check status for ${check.name}: ${error}`);

    return {
      name: check.name,
      url: check.host,
      status: false,
      response: undefined,
    };
  }
};

const processService = async (
  service: Service,
  concurrency: number,
): Promise<ServiceStatusResult[]> => {
  spinner.info(`service : ${service.title}`);

  const result: ServiceStatusResult[] = [];

  for (const chunkElement of chunk(service.checks, concurrency)) {
    const chunkResult = await Promise.all(
      chunkElement.map((check) => processCheck(service, check)),
    );

    result.push(...chunkResult);
  }

  return result;
};

export const execute = async (sourceFilePath: string, options: CliOptions) => {
  const source = readSourceFile(sourceFilePath);

  const validate = SourceFileSchema.safeParse(source);

  if (!validate.success) {
    spinner.warn(`Invalid source file > ${sourceFilePath}`);
    return;
  }

  for (const service of source) {
    const serviceResult = await processService(
      service,
      options.EXECUTE_CONCURRENCY,
    );

    spinner.start(`update : ${service.title}`);

    await updateResult(service.title, serviceResult, options);
  }
};
