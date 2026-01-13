import { checkStatus, updateResult } from './service';
import { chunk } from 'es-toolkit';
import { readSourceFile } from './helper';
import { getSpinnerInstance } from './shared/spinner';
import { SourceFileSchema } from './shared/validate-schema';
import { NetworkError, ValidationError } from './errors';

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
    const networkError = new NetworkError(
      `Failed to check status for ${check.name}`,
      { originalError: error, checkName: check.name, host: check.host },
    );
    spinner.fail(networkError.message);

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
  const source = await readSourceFile(sourceFilePath);

  const validate = SourceFileSchema.safeParse(source);

  if (!validate.success) {
    const validationError = new ValidationError(
      `Invalid source file: ${sourceFilePath}`,
      { filePath: sourceFilePath, errors: validate.error.errors },
    );
    spinner.warn(validationError.message);
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
