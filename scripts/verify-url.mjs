import { chromium } from '@playwright/test';

const input = process.argv[2] ?? 'https://caption-confidence.sociobot.in';
const origin = new URL(input).origin;
const local = new URL(origin).hostname === 'localhost' || new URL(origin).hostname === '127.0.0.1';
const routes = [
  { path: '/', status: 200 },
  { path: '/demo/', status: 200 },
  { path: '/privacy/', status: 200 },
  { path: '/terms/', status: 200 },
  { path: local ? '/404.html' : '/verify-url-missing-page', status: local ? 200 : 404 }
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
let failed = false;

try {
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
    page.on('requestfailed', (request) => errors.push(`request: ${request.url()} ${request.failure()?.errorText ?? ''}`));

    const response = await page.goto(`${origin}${route.path}`, { waitUntil: 'networkidle' });
    const issues = [];
    if (response?.status() !== route.status) issues.push(`expected HTTP ${route.status}, got ${response?.status() ?? 'no response'}`);
    if (!(await page.title()).trim()) issues.push('missing title');
    if (await page.locator('html[lang]').count() !== 1) issues.push('missing html lang');
    if (await page.locator('main').count() !== 1) issues.push('expected one main');
    if (await page.locator('h1').count() !== 1) issues.push('expected one h1');
    if (await page.locator('img:not([alt])').count() !== 0) issues.push('image missing alt');
    const unlabeled = await page.locator('input:not([type="hidden"]), textarea, select').evaluateAll((controls) => controls.filter((control) => {
      const formControl = /** @type {HTMLInputElement} */ (control);
      return !control.getAttribute('aria-label') && !control.getAttribute('aria-labelledby') && !formControl.labels?.length;
    }).map((control) => control.id || control.tagName));
    if (unlabeled.length) issues.push(`unlabeled controls: ${unlabeled.join(', ')}`);
    if (errors.length) issues.push(...errors);

    if (issues.length) {
      failed = true;
      console.error(`FAIL ${route.path}: ${issues.join('; ')}`);
    } else {
      console.log(`PASS ${route.path}: HTTP ${route.status}, title/lang/main/h1/alt/labels/console`);
    }
    await page.close();
  }
} finally {
  await context.close();
  await browser.close();
}

if (failed) process.exitCode = 1;
