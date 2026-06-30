import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  maxFailures: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

  ],

  webServer: [
    {
      command: [
        'poetry run python api/manage.py migrate --noinput',
        'poetry run python api/manage.py flush --noinput',
        'poetry run python api/manage.py loaddata api/apps/users/fixtures/allowed_staff.json',
        'poetry run python api/manage.py seed_e2e_auth',
        'poetry run python api/manage.py runserver 127.0.0.1:8001 --noreload',
      ].join(' && '),
      env: {
        DJANGO_SETTINGS_MODULE: 'config.settings.e2e',
        SECRET_KEY: 'django-insecure-e2e-only-key-for-tests',
      },
      url: 'http://127.0.0.1:8001/api/health/',
      reuseExistingServer: false,
      timeout: 120 * 1000,
    },
    {
      command: 'bun run dev -- --host 127.0.0.1 --port 4173',
      env: {
        VITE_API_PROXY_TARGET: 'http://127.0.0.1:8001',
      },
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120 * 1000,
    },
  ],
})
