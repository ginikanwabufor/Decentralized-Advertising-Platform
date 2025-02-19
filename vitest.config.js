import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    deps: {
      interopDefault: true,
      inline: ['@hirosystems/clarinet-sdk-wasm'],
    },
  },
});
