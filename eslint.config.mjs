import tsEslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-plugin-prettier/recommended';
import eslint from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import sonarjs from 'eslint-plugin-sonarjs';
import vitest from '@vitest/eslint-plugin';

export default tsEslint.config(
  {
    files: ['lib/**/*.ts'],
  },
  eslint.configs.recommended,
  ...tsEslint.configs.strict,
  ...tsEslint.configs.stylistic,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  unicorn.configs['flat/recommended'],
  sonarjs.configs.recommended,
  prettier,
  {
    files: ['lib/**/*.js', 'lib/**/*.mjs'],
    ...tsEslint.configs.disableTypeChecked,
  },
  {
    files: ['lib/**/*.test.ts'],
    ...vitest.configs.recommended,
  },
  {
    languageOptions: {
      globals: {
        ...globals.nodeBuiltin,
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['dist', '*.config.mjs', 'node_modules', 'coverage'],
  },
);
