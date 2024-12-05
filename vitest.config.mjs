import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      exclude: [
        'commitlint.config.js',
        '**/index.ts',
        'lib/schema/*',
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
