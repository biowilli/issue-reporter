import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: { channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' },
      }),
      instances: [{ browser: 'chromium', viewport: { width: 1000, height: 600 } }],
    },
  },
});
