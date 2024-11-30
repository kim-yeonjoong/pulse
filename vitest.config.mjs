import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      provider: 'v8',
      exclude: [
        'commitlint.config.js',
        'src/**/index.ts',
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
