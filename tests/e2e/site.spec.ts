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

test('landing page states the job, audience, first action, and facts before scrolling', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await expect(page).toHaveTitle('Caption Confidence — highlight uncertain caption words');
  await expect(page.getByRole('heading', { level: 1, name: 'Spot uncertain words in captions' })).toHaveCount(1);
  await expect(page.getByText('For people with high-frequency hearing loss')).toBeVisible();
  const action = page.getByRole('link', { name: 'Try it with sample data' });
  await expect(action).toBeVisible();
  await expect(page.getByText('Opens a loaded caption example.')).toBeVisible();
  const actionBox = await action.boundingBox();
  expect(actionBox && actionBox.y + actionBox.height).toBeLessThanOrEqual(900);
  await expect(page.locator('.plain-facts li')).toHaveCount(3);
  expect(errors).toEqual([]);
});

test('mobile, keyboard, zoom, and reduced motion keep every control usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const action = page.getByRole('link', { name: 'Try it with sample data' });
    await expect(action).toBeVisible();
    const actionBox = await action.boundingBox();
    expect(actionBox && actionBox.y + actionBox.height).toBeLessThanOrEqual(844);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(await undersizedControls(page)).toEqual([]);
  }

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeVisible();
  expect(Number.parseFloat(await page.locator('.slab').first().evaluate((element) => getComputedStyle(element).transitionDuration))).toBeLessThan(0.01);
});

test('all public routes have metadata, landmarks, usable controls, and no serious accessibility issues', async ({ page }) => {
  const routes = [
    { path: '/', title: 'Caption Confidence — highlight uncertain caption words', canonical: 'https://caption-confidence.sociobot.in/' },
    { path: '/demo/', title: 'Demo — Caption Confidence', canonical: 'https://caption-confidence.sociobot.in/demo/' },
    { path: '/privacy/', title: 'Privacy — Caption Confidence', canonical: 'https://caption-confidence.sociobot.in/privacy/' },
    { path: '/terms/', title: 'Terms — Caption Confidence', canonical: 'https://caption-confidence.sociobot.in/terms/' },
    { path: '/404.html', title: 'Page not found — Caption Confidence', canonical: 'https://caption-confidence.sociobot.in/404' }
  ];

  for (const route of routes) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', route.canonical);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /caption-confidence-social\.jpg$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.locator('img:not([alt])')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(await undersizedControls(page)).toEqual([]);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  }
});

test('internal links resolve and unknown routes use the designed 404 response', async ({ page }) => {
  const paths = new Set<string>();
  for (const route of ['/', '/demo/', '/privacy/', '/terms/', '/404.html']) {
    await page.goto(route);
    for (const href of await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))) {
      if (href.startsWith('/') && !href.startsWith('//')) paths.add(href.split('#')[0] || '/');
    }
  }
  for (const path of paths) {
    const response = await page.request.get(path);
    expect(response.status(), path).toBe(200);
  }

  const config = JSON.parse(await readFile('dist/site/staticwebapp.config.json', 'utf8')) as {
    responseOverrides?: Record<string, { rewrite?: string }>;
    globalHeaders: Record<string, string>;
  };
  expect(config.responseOverrides?.['404']?.rewrite).toBe('/404.html');
  expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
});

test('demo reports invalid files and recovers with valid input', async ({ page }) => {
  await page.goto('/demo/');
  const input = page.locator('#demo-file');

  await input.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('plain text') });
  await expect(page.locator('#import-status')).toHaveText('Choose a file ending in .vtt or .srt.');

  await input.setInputFiles({ name: 'broken.srt', mimeType: 'application/x-subrip', buffer: Buffer.from('not timed') });
  await expect(page.locator('#import-status')).toContainText('No timed captions');

  await input.setInputFiles({ name: 'large.vtt', mimeType: 'text/vtt', buffer: Buffer.alloc(5_000_001, 'a') });
  await expect(page.locator('#import-status')).toContainText('over 5 MB');

  await input.setInputFiles({
    name: 'recovery.vtt',
    mimeType: 'text/vtt',
    buffer: Buffer.from('WEBVTT\n\n00:00.000 --> 00:02.000\nThe ship is ready.')
  });
  await expect(page.locator('#import-status')).toContainText('recovery.vtt loaded in this tab with 1 caption line.');
  await expect(page.locator('#demo-caption')).toContainText('The ship is ready.');
});
