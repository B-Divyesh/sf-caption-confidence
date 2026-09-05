# Caption Confidence

Caption Confidence helps people with high-frequency hearing loss spot words they may miss in captions. The Chrome extension marks chosen word pairs and replays the current line.

Try the isolated sample at <https://caption-confidence.sociobot.in/demo/>. It starts with four caption lines and needs no account.
After one online load, the populated demo can reload offline.

## What it does

- Imports local VTT and SRT caption files.
- Reads caption tracks exposed by HTML5 video.
- Highlights exact words from pairs you choose.
- Labels source-written uncertainty and tight or overlapping timing.
- Replays the current caption from a chosen lead-in with `R`.
- Stores word-pair and display settings in local extension storage.

If a page has no exposed caption track, the extension asks for a VTT or SRT file. It does not create captions or diagnose hearing loss.

The free tools include import, word highlights, timing labels, replay, and settings. A $12 one-time supporter purchase adds optional caption appearances through Sociobot checkout.

## Privacy

Caption text is not sent off the device. The extension requests no browsing-history, microphone, camera, audio-capture, or video-capture permission.

The site has no advertising trackers or third-party analytics. License verification sends only the pasted token to Sociobot and reuses its verdict for one day.

The demo keeps caption changes in page memory. Its only storage value uses the `demo:caption-confidence:` session namespace, which is removed by **Reset demo** or **Start for real**.

Read [the privacy policy](https://caption-confidence.sociobot.in/privacy/) and [the terms](https://caption-confidence.sociobot.in/terms/).

## Develop

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm run dev
```

WXT writes the development extension to `.output/chrome-mv3`. Load that directory from `chrome://extensions` with Developer mode enabled.

Run the site separately:

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
npm run verify:claims
npm run verify:billing
./verify-url.sh http://127.0.0.1:4173
```

The end-to-end suite uses Playwright 1.58.2 and runs unpacked-extension checks under Xvfb. Every public product claim is listed in [`.factory/claims.json`](.factory/claims.json) with its tagged command.

`npm run build` creates:

- `dist/extension/` — the unpacked Manifest V3 extension.
- `dist/site/` — the complete static deployment.
- `dist/site/downloads/caption-confidence-chrome.zip` — the installable package.

Deploy the contents of `dist/site/` to the product’s static host. The site configuration supplies security headers and the designed 404 response.

## Project records

- [Researched brief](.factory/brief.json)
- [Visual system and asset provenance](.factory/design.md)
- [Demo contract](.factory/demo.md)
- [Current handoff](.factory/handoff.md)

MIT licensed. See [LICENSE](LICENSE).
