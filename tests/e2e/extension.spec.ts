import { chromium, expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function extensionIdForPath(path: string): string {
  return createHash('sha256').update(path).digest('hex').slice(0, 32)
    .replace(/[0-9a-f]/g, (digit) => String.fromCharCode('a'.charCodeAt(0) + Number.parseInt(digit, 16)));
}

test('@claim:extension-track @claim:local-settings @claim:no-history-permission @claim:no-caption-generation @claim:caption-data-local extension works from an exposed track without sending captions away', async () => {
  const extensionPath = resolve('.output/chrome-mv3');
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  try {
    const manifest = JSON.parse(await readFile(resolve(extensionPath, 'manifest.json'), 'utf8')) as {
      manifest_version: number;
      permissions?: string[];
    };
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).not.toContain('history');
    expect(manifest.permissions).not.toContain('audioCapture');
    expect(manifest.permissions).not.toContain('videoCapture');

    const externalRequests: string[] = [];
    context.on('request', (request) => {
      const url = new URL(request.url());
      if (url.protocol.startsWith('http') && url.hostname !== '127.0.0.1') externalRequests.push(request.url());
    });
    const extensionId = extensionIdForPath(extensionPath);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.evaluate(() => {
      document.body.innerHTML = '<video id="clip" style="display:block;width:800px;height:450px;background:#111"></video>';
      const video = document.querySelector<HTMLVideoElement>('#clip')!;
      Object.defineProperty(video, 'play', { configurable: true, value: () => Promise.resolve() });
      const track = video.addTextTrack('captions', 'English', 'en');
      track.mode = 'showing';
      track.addCue(new VTTCue(0, 0.5, 'The ship leaves now.'));
    });

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup.getByRole('link', { name: 'Support & unlock finishes' })).toHaveAttribute(
      'href',
      'https://api.sociobot.in/api/v1/products/caption-confidence/checkout'
    );
    const undersizedControls = await popup.locator('a, button, input:not([type="file"]), select, textarea').evaluateAll((elements) => elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { id: element.id, text: element.textContent?.trim(), width: rect.width, height: rect.height };
      })
      .filter(({ width, height }) => width < 44 || height < 44));
    expect(undersizedControls).toEqual([]);
    await page.bringToFront();
    await popup.locator('#use-track').evaluate((button: HTMLButtonElement) => {
      button.disabled = false;
      button.click();
    });
    await expect(popup.locator('#message')).toContainText('page captions loaded');

    await page.evaluate(() => document.querySelector<HTMLVideoElement>('#clip')!.dispatchEvent(new Event('timeupdate')));
    await expect.poll(() => page.evaluate(() => document.querySelector('#caption-confidence-root')?.shadowRoot?.textContent ?? '')).toContain('The ship leaves now.');
    const hasMark = await page.evaluate(() => Boolean(document.querySelector('#caption-confidence-root')?.shadowRoot?.querySelector('mark')));
    expect(hasMark).toBe(true);
    await expect.poll(() => page.evaluate(() => document.querySelector('#caption-confidence-root')?.shadowRoot?.textContent ?? '')).toContain('tight timing');

    await popup.locator('#pairs').fill('vine / wine');
    await popup.locator('#pairs').press('Tab');
    await expect.poll(() => page.evaluate(() => Boolean(document.querySelector('#caption-confidence-root')?.shadowRoot?.querySelector('mark')))).toBe(false);
    await expect.poll(() => popup.evaluate(async () => {
      const stored = await chrome.storage.local.get('captionSettings');
      return stored.captionSettings?.pairsText;
    })).toBe('vine / wine');

    await popup.locator('#font-size').fill('42');
    await expect.poll(() => page.evaluate(() => document.querySelector<HTMLElement>('#caption-confidence-root')?.shadowRoot?.querySelector<HTMLElement>('.caption')?.style.fontSize)).toBe('42px');

    await popup.locator('#show-timing').uncheck();
    await expect.poll(() => page.evaluate(() => document.querySelector('#caption-confidence-root')?.shadowRoot?.textContent ?? '')).not.toContain('tight timing');

    await popup.locator('#appearance').evaluate((control: HTMLSelectElement) => {
      control.disabled = false;
      control.value = 'paper';
      control.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect.poll(() => page.evaluate(() => document.querySelector('#caption-confidence-root')?.shadowRoot?.querySelector('.caption')?.classList.contains('theme-paper'))).toBe(true);

    await popup.locator('#overlay-enabled').uncheck();
    await expect.poll(() => page.evaluate(() => document.querySelector<HTMLElement>('#caption-confidence-root')?.style.display)).toBe('none');
    await popup.locator('#overlay-enabled').check();
    await expect.poll(() => page.evaluate(() => document.querySelector<HTMLElement>('#caption-confidence-root')?.style.display)).toBe('block');

    await page.keyboard.press('r');
    await expect.poll(() => page.evaluate(() => document.querySelector<HTMLVideoElement>('#clip')!.currentTime)).toBe(0);

    const fileInput = popup.locator('#caption-file');
    await page.bringToFront();
    await fileInput.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('plain transcript') });
    await expect(popup.locator('#message')).toContainText('ending in .vtt or .srt');
    await page.bringToFront();
    await fileInput.setInputFiles({ name: 'broken.srt', mimeType: 'application/x-subrip', buffer: Buffer.from('not timed') });
    await expect(popup.locator('#message')).toContainText('No timed captions');
    await page.bringToFront();
    await fileInput.setInputFiles({ name: 'large.vtt', mimeType: 'text/vtt', buffer: Buffer.alloc(5_000_001, 'a') });
    await expect(popup.locator('#message')).toContainText('over 5 MB');
    await page.bringToFront();
    await fileInput.setInputFiles({
      name: 'recovery.srt',
      mimeType: 'application/x-subrip',
      buffer: Buffer.from('1\n00:00:00,000 --> 00:00:02,000\nThe vine is ready.')
    });
    await expect(popup.locator('#message')).toContainText('1 captions loaded locally');
    await page.evaluate(() => document.querySelector<HTMLVideoElement>('#clip')!.dispatchEvent(new Event('timeupdate')));
    await expect.poll(() => page.evaluate(() => document.querySelector('#caption-confidence-root')?.shadowRoot?.textContent ?? '')).toContain('The vine is ready.');

    const pageWithoutTrack = await context.newPage();
    await pageWithoutTrack.goto('http://127.0.0.1:4173/');
    await pageWithoutTrack.evaluate(() => {
      document.body.innerHTML = '<video style="display:block;width:800px;height:450px;background:#111"></video>';
    });
    await pageWithoutTrack.bringToFront();
    await popup.locator('#use-track').evaluate((button: HTMLButtonElement) => {
      button.disabled = false;
      button.click();
    });
    await expect(popup.locator('#message')).toContainText('does not expose an accessible caption track');
    expect(externalRequests).toEqual([]);
  } finally {
    await context.close();
  }
});
