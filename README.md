# Caption Confidence

Caption Confidence is a local-first Chrome/Chromium extension for people who use captions and want easy-to-miss words made obvious. Import a VTT/SRT file or use an exposed HTML5 caption track, define exact word-confusion pairs, and press `R` to replay the current line.

It does not transcribe audio, scrape protected streams, judge speech accuracy, or diagnose hearing loss. Caption text stays in the active tab; preferences are stored in the browser.

Live product site: <https://caption-confidence.sociobot.in>

## What ships

- MV3 extension built with WXT and TypeScript
- Local VTT/SRT parser with clear invalid-file states
- Exposed HTML5 caption-track reader
- Exact word-pair highlighting and source-authored uncertainty labels
- Honest “tight timing” flag for compressed or overlapping cues
- Page-level `R` replay plus `Alt+Shift+R` browser command
- Keyboard-accessible 390 px popup, responsive overlay, and local preferences
- Static product, privacy, and terms pages with an optional $12 supporter unlock
- Supporter license restore/verification for optional caption finishes only

The free tier includes every comprehension and accessibility feature. The supporter purchase is a one-time appearance unlock through the Sociobot billing API; Dodo is the merchant of record.

## Develop

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

WXT writes the development extension to `.output/chrome-mv3`. Load that directory from `chrome://extensions` with Developer mode enabled. Run the site separately with:

```bash
npm run dev:site
```

## Test and build

```bash
npm run lint
npm run check
npm test
npm run build
npm run test:e2e
npm run verify:billing
```

`npm run build` is the production build command. It creates:

- `dist/extension/` — unpacked MV3 extension
- `dist/site/index.html` — static deploy root
- `dist/site/downloads/caption-confidence-chrome.zip` — packaged download linked by the site

`npm run build:site` is also deploy-ready: it builds the MV3 extension first, then emits the static site together with its linked ZIP and service worker under `dist/site/`.

The end-to-end suite uses pinned Playwright 1.58.2. On Linux it runs under Xvfb so Chromium can load the unpacked extension.
`npm run verify:billing` is the release-time live dependency check: it requires the approved Sociobot endpoint to redirect to its hosted checkout.

## Privacy and permissions

The extension requests `activeTab`, local `storage`, and access to HTTP(S) pages so its content script can find supported HTML5 video. It collects no analytics, browsing history, audio, video, or caption text. License verification sends only the pasted license token to `api.sociobot.in`, at most once per day after a cached verdict.

See the full [privacy policy](https://caption-confidence.sociobot.in/privacy/) and [terms](https://caption-confidence.sociobot.in/terms/).

## Project notes

The researched scope is in [`.factory/brief.json`](.factory/brief.json), the visual and asset system is in [`.factory/design.md`](.factory/design.md), and release verification is in [`.factory/handoff.md`](.factory/handoff.md).

MIT licensed. See [LICENSE](LICENSE).
