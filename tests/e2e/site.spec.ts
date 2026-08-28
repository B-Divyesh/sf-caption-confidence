import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

async function undersizedControls(page: import('@playwright/test').Page): Promise<Array<{ label: string; width: number; height: number }>> {
  return page.locator('a, button, input:not([type="file"]), select, textarea').evaluateAll((elements) => elements
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        label: (element.textContent || element.getAttribute('aria-label') || element.id).trim().replace(/\s+/g, ' '),
        width: rect.width,
        height: rect.height
      };
    })
    .filter(({ width, height }) => width < 44 || height < 44));
}

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
  await expect(page.getByRole('link', { name: 'Support & unlock', exact: true })).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/caption-confidence/checkout'
  );
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect([...requestedOrigins]).toEqual(['http://localhost:4173']);
});

test('mobile and 200% zoom layouts keep controls usable without horizontal scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Download for Chrome' })).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(await undersizedControls(page)).toEqual([]);
  }

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible();
  expect(Number.parseFloat(await page.locator('.slab').first().evaluate((element) => getComputedStyle(element).transitionDuration))).toBeLessThan(0.01);
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('cached invalid supporter license keeps its warning without another request', async ({ page }) => {
  let verificationRequests = 0;
  await page.route('https://pilot-api.sociobot.in/api/v1/products/caption-confidence/verify?**', async (route) => {
    verificationRequests += 1;
    expect(route.request().url()).toContain('license=invalid%20token');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid' }) });
  });

  await page.goto('/?license=invalid%20token');
  await expect(page.locator('#license-status')).toHaveText(/License no longer active/);
  await expect(page).toHaveURL('http://localhost:4173/');
  expect(verificationRequests).toBe(1);

  await page.reload();
  await expect(page.locator('#license-status')).toHaveText(/License no longer active/);
  expect(verificationRequests).toBe(1);
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
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    expect(await undersizedControls(page)).toEqual([]);
  });
}
