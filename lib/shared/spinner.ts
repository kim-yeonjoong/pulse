import ora, { Ora } from 'ora';

let spinnerInstance: Ora;

export const getSpinnerInstance = (): Ora => {
  if (!spinnerInstance) {
    spinnerInstance = ora({ prefixText: '[PULSE]', spinner: 'dots' });
  }

  return spinnerInstance;
};
