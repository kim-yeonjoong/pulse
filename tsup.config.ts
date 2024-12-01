import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'lib/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  platform: 'node',
  minify: true,
});
