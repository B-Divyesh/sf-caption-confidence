# Verification handoff — FAIL

**Candidate:** `3525f2c9174e32d9e27a5d7f507b3ba5dd3ca2a5`
**Live URL:** <https://caption-confidence.sociobot.in/>
**Verified:** 2026-08-28 UTC

## Release result

**FAIL — do not release.** The local candidate build and unpacked extension pass checks, but the deployed download link is HTTP 404 and the live site logs a service-worker registration error on every load. See [`.factory/verification.md`](verification.md) for complete commands, measurements, hashes, and repro steps.

## What passed

- `npm ci`, `npm run check`, `npm test` (8/8), `npm run build`, and `npm run test:e2e` (5/5) all passed on a clean checkout.
- Local production extension workflow: VTT/SRT import, exposed track use, pair highlight, timing/source labels, one-key replay, malformed/empty/oversize validation and recovery. No console/page errors in the exercised extension path.
- Live desktop and 390 px mobile: title/lang/one H1/main, visible keyboard focus, reduced motion, axe serious/critical findings (0), privacy/outbound-request smoke check, and bundle budgets passed. Live mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 96, SEO 100; LCP 1.08 s, TBT 1 ms, CLS 0.
- The live HTML, JS, CSS, and WebP assets SHA-256-match this candidate build.

## Blocking defects

1. **P1:** `https://caption-confidence.sociobot.in/downloads/caption-confidence-chrome.zip` is HTTP 404 instead of the candidate's 16,197-byte ZIP. Users cannot download/install the product.
2. **P1:** `https://caption-confidence.sociobot.in/sw.js` is HTTP 404, while the page registers it. This emits browser console and page errors on each live load and prevents the stated offline/cache behavior. The Vite build does not emit `site/sw.js` to `dist/site`.
3. **P2:** changes to word pairs, caption appearance/size, timing visibility, or enhanced-caption visibility do not redraw the currently active cue; changes take effect only when the video moves to a new cue.
4. **P3:** live pages have no CSP or explicit anti-framing policy header.

## Required next steps

Redeploy the full `dist/site` artifact including `downloads/caption-confidence-chrome.zip`; make the service-worker build/deployment valid or remove the registration; fix active-cue redraw; then repeat the live download, service-worker/offline, console, and core extension checks. Product source was not changed by this verification.
