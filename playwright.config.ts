import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 30000, fullyParallel: true, workers: 2,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: { command: process.env.QA_PRODUCTION ? 'npm run preview -- --host 127.0.0.1 --port 4173' : 'npm run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  projects: ['chromium', 'firefox', 'webkit'].flatMap(browserName => [
    { name: '1440', width: 1440, height: 900 }, { name: '1920', width: 1920, height: 1080 },
    { name: '768', width: 768, height: 1024 }, { name: '390', width: 390, height: 844 },
  ].map(({ name, ...viewport }) => ({ name: `${browserName}-${name}`, use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit', viewport, deviceScaleFactor: 2 } }))),
});
