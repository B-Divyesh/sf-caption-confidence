import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('landing page has core content, download, and no serious accessibility issues', async ({ page }) => {
  const consoleErrors: string[] = [];
  const requestedOrigins = new Set<string>();
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('request', (request) => requestedOrigins.add(new URL(request.url()).origin));
  await page.goto('/');
  await expect(page).toHaveTitle(/Caption Confidence/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Download extension ZIP' })).toHaveAttribute('href', /caption-confidence-chrome\.zip/);
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect([...requestedOrigins]).toEqual(['http://localhost:4173']);
});

test('mobile layout keeps primary action visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Download for Chrome' })).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible();
  expect(Number.parseFloat(await page.locator('.slab').first().evaluate((element) => getComputedStyle(element).transitionDuration))).toBeLessThan(0.01);
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('production site ships its installable extension, offline worker, and response policy', async ({ page, context }) => {
  const packageResponse = await page.request.get('/downloads/caption-confidence-chrome.zip');
  expect(packageResponse.status()).toBe(200);
  expect(packageResponse.headers()['content-type']).toContain('application/zip');
  expect((await packageResponse.body()).subarray(0, 4).toString()).toBe('PK\u0003\u0004');

  const config = JSON.parse(await readFile('dist/site/staticwebapp.config.json', 'utf8')) as { globalHeaders: Record<string, string> };
  expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  expect(config.globalHeaders['Content-Security-Policy']).toContain('connect-src');
  expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');

  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await context.setOffline(false);
});

for (const path of ['/privacy/', '/terms/']) {
  test(`${path} has a single h1 and main landmark`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  });
}
