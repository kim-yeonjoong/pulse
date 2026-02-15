/* eslint-disable vitest/require-mock-type-parameters, vitest/no-hooks, vitest/valid-title, vitest/no-done-callback */
import { afterEach, describe, it, vi } from 'vitest';
import ora from 'ora';
import {
  createSpinner,
  getSpinnerInstance,
  resetSpinnerInstance,
} from './spinner';

vi.mock('ora', () => {
  return {
    default: vi.fn(() => ({
      stop: vi.fn(),
    })),
  };
});

describe.sequential('spinner utilities', () => {
  afterEach(() => {
    resetSpinnerInstance();
    vi.clearAllMocks();
  });

  describe(createSpinner, () => {
    it('should create a new spinner instance with correct config', ({
      expect,
    }) => {
      expect.assertions(2);

      const spinner = createSpinner();

      expect(ora).toHaveBeenCalledWith({
        prefixText: '[PULSE]',
        spinner: 'dots',
      });
      expect(spinner).toBeDefined();
    });

    it('should create different instances on each call', ({ expect }) => {
      expect.assertions(2);

      const spinner1 = createSpinner();
      const spinner2 = createSpinner();

      expect(spinner1).toBeDefined();
      expect(spinner2).toBeDefined();
    });
  });

  describe(getSpinnerInstance, () => {
    it('should return a new spinner instance if one does not exist', ({
      expect,
    }) => {
      expect.assertions(2);

      const instance = getSpinnerInstance();

      expect(ora).toHaveBeenCalledWith({
        prefixText: '[PULSE]',
        spinner: 'dots',
      });
      expect(instance).toBeDefined();
    });

    it('should return the same spinner instance on subsequent calls', ({
      expect,
    }) => {
      expect.assertions(2);

      const firstInstance = getSpinnerInstance();
      const secondInstance = getSpinnerInstance();

      expect(firstInstance).toBeDefined();
      expect(firstInstance).toStrictEqual(secondInstance);
    });
  });

  describe(resetSpinnerInstance, () => {
    it('should reset the spinner instance', ({ expect }) => {
      expect.assertions(3);

      const firstInstance = getSpinnerInstance();

      expect(firstInstance).toBeDefined();

      resetSpinnerInstance();

      const secondInstance = getSpinnerInstance();

      expect(secondInstance).toBeDefined();
      // After reset, a new instance should be created
      expect(ora).toHaveBeenCalledTimes(2);
    });

    it('should call stop on existing spinner before reset', ({ expect }) => {
      expect.assertions(1);

      const instance = getSpinnerInstance();
      const stopSpy = vi.spyOn(instance, 'stop');

      resetSpinnerInstance();

      expect(stopSpy).toHaveBeenCalledOnce();
    });
  });
});
