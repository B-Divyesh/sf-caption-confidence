import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

test('@claim:exact-word-highlights marks exact chosen words and updates the result', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('#demo-caption mark')).toHaveText('ship');
  await page.locator('#demo-pairs').fill('last / mast');
  await expect(page.locator('#demo-caption mark')).toHaveText('last');
  await expect(page.locator('#demo-caption mark')).not.toContainText('ship');
});

test('@claim:replay-current-caption moves the sample to the chosen lead-in with R', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Next caption' }).click();
  await expect(page.locator('#playback-position')).toHaveText('00:04.8');
  await page.locator('h1').focus();
  await page.keyboard.press('r');
  await expect(page.locator('#playback-position')).toHaveText('00:03.4');
  await expect(page.locator('#demo-status')).toHaveText('Replaying caption 2 from 00:03.4.');
});

test('@claim:caption-file-imports imports both VTT and SRT files into the demo', async ({ page }) => {
  await page.goto('/demo/');
  const input = page.locator('#demo-file');

  await input.setInputFiles({
    name: 'meeting.vtt',
    mimeType: 'text/vtt',
    buffer: Buffer.from('WEBVTT\n\n00:01.000 --> 00:03.000\nThe ship leaves now.')
  });
  await expect(page.locator('#import-status')).toContainText('meeting.vtt loaded in this tab with 1 caption line.');
  await expect(page.locator('#demo-caption')).toContainText('The ship leaves now.');

  await input.setInputFiles({
    name: 'lesson.srt',
    mimeType: 'application/x-subrip',
    buffer: Buffer.from('1\n00:00:02,000 --> 00:00:04,000\nUse the fine wire.')
  });
  await expect(page.locator('#import-status')).toContainText('lesson.srt loaded in this tab with 1 caption line.');
  await expect(page.locator('#demo-caption')).toContainText('Use the fine wire.');
});

test('@claim:source-uncertainty shows a label when the caption source marks uncertainty', async ({ page }) => {
  await page.goto('/demo/');
  await page.locator('#cue-list button').nth(3).click();
  await expect(page.locator('#demo-caption .caption-flag')).toHaveText('source says uncertain');
});

test('@claim:timing-flags shows and hides labels for tight or overlapping cues', async ({ page }) => {
  await page.goto('/demo/');
  await page.locator('#cue-list button').nth(1).click();
  await expect(page.locator('#demo-caption .timing')).toHaveText('tight timing');
  await page.locator('#demo-timing').uncheck();
  await expect(page.locator('#demo-caption .timing')).toHaveCount(0);
});

test('@claim:demo-isolation resets sample state without changing real data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:caption-confidence', 'real-data-sentinel');
  });
  await page.goto('/demo/');
  await page.locator('#demo-pairs').fill('last / mast');
  await page.getByRole('button', { name: 'Next caption' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();

  await expect(page.locator('#demo-pairs')).toHaveValue('sip / ship\nfine / vine\ntin / kin');
  await expect(page.locator('#demo-status')).toHaveText('Demo reset. Sample caption 1 of 4 is ready.');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:caption-confidence'))).toBe('real-data-sentinel');

  await page.locator('#start-real').evaluate((link) => link.addEventListener('click', (event) => event.preventDefault(), { once: true }));
  await page.locator('#start-real').click();
  expect(await page.evaluate(() => sessionStorage.getItem('demo:caption-confidence:active'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('sb_license:caption-confidence'))).toBe('real-data-sentinel');
});

test('@claim:no-account opens a working sample without sign-in or an API call', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://localhost:4173') externalRequests.push(request.url());
  });
  await page.goto('/demo/');
  await expect(page.locator('#demo-caption mark')).toHaveText('ship');
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Replay current caption' }).click();
  await expect(page.locator('#demo-status')).toContainText('Replaying caption 1');
  expect(externalRequests).toEqual([]);
});

test('@claim:no-tracking loads public pages without analytics or third-party requests', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://localhost:4173') externalRequests.push(request.url());
  });
  for (const route of ['/', '/demo/', '/privacy/', '/terms/']) await page.goto(route);
  expect(externalRequests).toEqual([]);
});

test('@claim:offline-demo reloads the populated demo offline in its own browser context', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:4173/demo/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
    await expect(page.locator('#demo-caption mark')).toHaveText('ship');
    await expect(page.locator('#offline')).toBeVisible();
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:packaged-download serves a Manifest V3 extension archive', async ({ page }) => {
  const response = await page.request.get('/downloads/caption-confidence-chrome.zip');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/zip');
  expect((await response.body()).subarray(0, 4).toString()).toBe('PK\u0003\u0004');
  const manifest = JSON.parse(execFileSync('unzip', ['-p', 'dist/site/downloads/caption-confidence-chrome.zip', 'manifest.json'], { encoding: 'utf8' })) as {
    manifest_version: number;
    name: string;
  };
  expect(manifest).toMatchObject({ manifest_version: 3, name: 'Caption Confidence' });
});

test('@claim:free-core keeps every caption control available without a license', async ({ page }) => {
  await page.goto('/demo/');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:caption-confidence'))).toBeNull();
  await expect(page.locator('#demo-pairs')).toBeEnabled();
  await expect(page.locator('#demo-timing')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Replay current caption' })).toBeEnabled();
  await expect(page.getByText('Import VTT or SRT', { exact: true })).toBeVisible();
});

test('@claim:supporter-checkout opens the registered $12 one-time Sociobot checkout', async ({ request }) => {
  const checkout = await request.get('https://api.sociobot.in/api/v1/products/caption-confidence/checkout', { maxRedirects: 0 });
  expect(checkout.status()).toBe(303);
  const location = checkout.headers().location;
  expect(location).toMatch(/^https:\/\/checkout\.dodopayments\.com\/session\//);
  const hosted = await request.get(location);
  expect(hosted.status()).toBe(200);
  const body = await hosted.text();
  expect(body).toContain('Caption Confidence Supporter');
  expect(body).toContain('$12.00');
  expect(body).toContain('One-time Supporter unlock');
});

test('@claim:license-request-cache sends only the license token and reuses the one-day verdict', async ({ page }) => {
  let verificationRequests = 0;
  await page.route('https://pilot-api.sociobot.in/api/v1/products/caption-confidence/verify?**', async (route) => {
    verificationRequests += 1;
    const request = route.request();
    const url = new URL(request.url());
    expect([...url.searchParams.keys()]).toEqual(['license']);
    expect(url.searchParams.get('license')).toBe('invalid token');
    expect(request.postData()).toBeNull();
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
