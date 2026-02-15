import ora, { Ora } from 'ora';

export const createSpinner = (): Ora => {
  return ora({ prefixText: '[PULSE]', spinner: 'dots' });
};

let spinnerInstance: Ora | undefined;

export const getSpinnerInstance = (): Ora => {
  if (!spinnerInstance) {
    spinnerInstance = createSpinner();
  }
  return spinnerInstance;
};

export const resetSpinnerInstance = (): void => {
  if (spinnerInstance) {
    spinnerInstance.stop();
  }
  spinnerInstance = undefined;
};
