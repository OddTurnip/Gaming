import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: [
      'code/tests/**/*.test.js',
      'Dice/tests/**/*.test.js',
      'Cards/tests/**/*.test.js',
      'Names/**/*.test.js',
      'Characters/**/*.test.js',
      'Themes/**/*.test.js',
    ],
  },
});
