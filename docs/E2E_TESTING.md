# E2E Testing Guide

This document covers Playwright E2E testing setup, troubleshooting, and best practices for containerized environments.

## Quick Start

```bash
# Install Playwright and browsers
npm install -D @playwright/test
npx playwright install chromium

# Run tests
npm run test:e2e              # All tests
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e -- --project=chromium  # Chromium only
```

## Test Structure

```
e2e/
├── fixtures/
│   └── test-data.ts          # Database helpers, sample data
├── pages/                    # Page Object Models
│   ├── BasePage.ts           # Common page methods
│   ├── DashboardPage.ts
│   ├── RosterPage.ts
│   ├── TeamsPage.ts
│   └── WishesPage.ts
└── tests/
    ├── character-crud.spec.ts
    ├── character-import.spec.ts
    ├── navigation.spec.ts
    ├── team-management.spec.ts
    └── ...
```

---

## Troubleshooting

### Browser Crashes in Containers

**Symptom:** `Target page, context or browser has been closed`

**Cause:** Chrome requires Linux kernel features often unavailable in containers:
- D-Bus system bus (`/run/dbus/system_bus_socket`)
- inotify file watchers (`/proc/sys/fs/inotify/max_user_watches`)
- NETLINK socket permissions
- Shared memory (`/dev/shm`)

**Solution:** The `playwright.config.ts` includes stability flags:

```typescript
launchOptions: {
  args: [
    // Core stability flags
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    // Process isolation for containers
    '--single-process',
    '--no-zygote',
    // Disable unnecessary features
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-features=IsolateOrigins,site-per-process',
  ],
}
```

### Flaky Tests

**Symptom:** Tests pass sometimes, fail others

**Solution:** The config enables retries (`retries: 2`) and serial execution (`workers: 1`). Tests marked "flaky" in reports passed on retry.

For individual tests with timing issues, add explicit timeouts:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(120000);  // 2 minutes
  await expect(page).toHaveURL(/\/route/, { timeout: 15000 });
});
```

### IndexedDB / Dexie Crashes

**Symptom:** Browser crashes when clearing database between tests

**Cause:** Deleting IndexedDB while Dexie.js has active connections crashes the tab.

**Solution:** The `clearDatabase()` function in `e2e/fixtures/test-data.ts` navigates away before clearing:

```typescript
export async function clearDatabase(page: Page): Promise<void> {
  // Navigate away to close Dexie connections
  await page.goto('about:blank');
  await page.waitForTimeout(300);

  // Now safe to delete
  await page.evaluate((dbName) => {
    return indexedDB.deleteDatabase(dbName);
  }, DB_NAME);
}
```

---

## Running in Different Environments

### Local Development

Tests run with full parallelism and no retries by default when `CI` env var is not set:

```bash
npm run test:e2e
```

### CI/CD (GitHub Actions)

Example workflow configuration:

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### Docker

For Docker environments, use the official Playwright image or add these flags:

```dockerfile
# Option 1: Official image (recommended)
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Option 2: Custom image - add required dependencies
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

Run container with extended permissions:

```bash
docker run --ipc=host --cap-add=SYS_ADMIN your-image
```

---

## Configuration Reference

### playwright.config.ts

| Setting | Value | Purpose |
|---------|-------|---------|
| `fullyParallel` | `false` | Serial execution for stability |
| `workers` | `1` | Single worker in containers |
| `retries` | `2` | Retry flaky tests |
| `timeout` | `60000` | 60s test timeout |
| `expect.timeout` | `10000` | 10s assertion timeout |

### Chrome Stability Flags

| Flag | Purpose |
|------|---------|
| `--no-sandbox` | Required for containers without user namespaces |
| `--disable-dev-shm-usage` | Use `/tmp` instead of `/dev/shm` |
| `--single-process` | Run all Chrome processes in one (stability) |
| `--no-zygote` | Disable process pre-forking |
| `--disable-gpu` | Disable GPU acceleration |
| `--disable-setuid-sandbox` | Disable setuid sandbox |

---

## Writing Tests

### Page Object Pattern

```typescript
// e2e/pages/RosterPage.ts
export class RosterPage extends BasePage {
  readonly addButton = this.page.getByRole('button', { name: /add character/i });
  readonly characterCards = this.page.locator('[data-testid="character-card"]');

  async goto() {
    await this.page.goto('/roster');
    await this.waitForLoad();
  }

  async getCharacterCount(): Promise<number> {
    return await this.characterCards.count();
  }
}
```

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { RosterPage } from '../pages';
import { clearDatabase, waitForAppReady } from '../fixtures/test-data';

test.describe('Character CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display roster page', async ({ page }) => {
    const roster = new RosterPage(page);
    await roster.goto();
    await expect(roster.addButton).toBeVisible();
  });
});
```

---

## Known Limitations

1. **Container Instability**: Some tests may be flaky in highly restricted environments (Claude Code sandbox, minimal Docker containers). Retries mitigate this.

2. **Enka.network Tests**: Skipped by default - require network access and valid UID.

3. **Firefox**: Commented out in config - focus on Chromium for reliability.

4. **Video/Trace**: Only captured on retry to reduce CI storage.

---

## Debugging Failed Tests

### View Test Report

```bash
npx playwright show-report
```

### View Trace

```bash
npx playwright show-trace test-results/*/trace.zip
```

### Run Single Test

```bash
npm run test:e2e -- -g "test name pattern"
```

### Debug Mode

```bash
npm run test:e2e -- --debug
```

---

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Docker Guide](https://playwright.dev/docs/docker)
- [Chrome Headless Flags](https://peter.sh/experiments/chromium-command-line-switches/)
