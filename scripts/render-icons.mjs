import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 128, height: 128 }, deviceScaleFactor: 1 });
await page.goto(`file://${resolve(import.meta.dirname, '../extension-public/icons/icon.svg')}`);
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  await page.locator('svg').evaluate((svg, dimension) => {
    svg.setAttribute('width', String(dimension));
    svg.setAttribute('height', String(dimension));
    svg.style.display = 'block';
  }, size);
  await page.screenshot({ path: resolve(import.meta.dirname, `../extension-public/icons/icon-${size}.png`), omitBackground: true });
}
await browser.close();
