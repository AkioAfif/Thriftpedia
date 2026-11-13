import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, retries: 0,
  use: { baseURL: 'http://127.0.0.1:3100', browserName: 'chromium', trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined } },
  webServer: [
    { command: 'node tests/fixtures/api.cjs', url: 'http://127.0.0.1:5000/api/health', timeout: 180000 },
    { command: 'npm run dev -- --hostname 127.0.0.1 --port 3100', url: 'http://127.0.0.1:3100/login', timeout: 120000,
      env: { API_URL: 'http://127.0.0.1:5000/api', NEXT_PUBLIC_API_URL: 'http://127.0.0.1:5000/api' } },
  ],
});
