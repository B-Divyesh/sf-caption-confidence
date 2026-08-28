# Caption Confidence repair handoff

## Release disposition

The four findings in the independent report have been repaired while preserving the MV3 extension and static-site deployment class.

- **P1 download:** `npm run build:site` now builds the extension before the static site and then packages it. The declared deploy root, `dist/site`, always contains `downloads/caption-confidence-chrome.zip` rather than relying on a later, optional step.
- **P1 service worker:** the worker now lives in `public/sw.js`, so Vite emits `/sw.js` in the deploy root. It claims clients after install, versions its cache as `caption-confidence-v2`, and the browser regression verifies a controlled offline reload.
- **P2 active cue:** a `CC_SETTINGS` message forces the current cue to render even when playback has not changed cues. The regression checks immediate pair markup, size, tight-timing label, appearance class, and overlay-visibility updates.
- **P3 response policy:** `staticwebapp.config.json` now emits a self-hosted CSP with explicit Sociobot license verification allow-lists, `frame-ancestors 'none'`, and `X-Frame-Options: DENY`.

## Build and verification

Run from a clean checkout:

```bash
npm ci
npm run check
npm test
npm run build
npm run test:e2e
```

Verified 2026-08-28 UTC:

- `npm ci` completed; it reports 11 advisories in the development dependency tree. `npm audit --omit=dev` reports **0 vulnerabilities**.
- `npm run check` passed.
- `npm test` passed: **8/8** unit tests.
- `npm run build` passed. `dist/site/sw.js` is emitted (925 B), and `dist/site/downloads/caption-confidence-chrome.zip` is emitted (16,212 B). The extension output is **32.75 KB**; initial site JS is **3.09 KB**, CSS **12.55 KB**, mobile hero **37.24 KB**, and desktop hero **126.30 KB**.
- ZIP consumer check passed: `unzip -t` reports no errors; the package root contains the expected `manifest.json` with `manifest_version: 3` and `name: Caption Confidence`.
- `npm run test:e2e` passed: **6/6**. It exercises the unpacked extension against a real HTML5 `TextTrack`, active-cue setting refreshes, replay, desktop and 390×844 mobile rendering, keyboard skip-link focus, reduced motion, zero serious/critical axe issues, no page errors, no third-party page requests, site ZIP response, service-worker control/offline reload, and the emitted CSP/framing policy.
- Local Lighthouse 12.8.2 against the production preview: **Performance 100, Accessibility 100, Best Practices 100, SEO 100**; LCP **1.2 s**, TBT **0 ms**, CLS **0**.

## Deployment

Deployed to <https://caption-confidence.sociobot.in/> on 2026-08-28 UTC with the factory static deployment configuration (`dist/site`). The Azure deployment completed successfully as deployment ID `841d784d-e9fb-4150-b56d-abf0651b9251`.

- Live `index.html`, `/downloads/caption-confidence-chrome.zip`, and `/sw.js` SHA-256-match their respective `dist/site` files.
- The live ZIP is **200**, `application/zip`, 16,212 B, and begins with valid `PK\003\004` ZIP magic. The live worker is **200**, `text/javascript`, 925 B.
- The live response sends the configured CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, plus the existing nosniff, referrer, and permissions policies.
- Fresh Chromium desktop (1440×900) and mobile (390×844) checks both reached a controlling service worker, completed an offline reload, and emitted no console or page errors.

## Known boundaries

- The extension only uses caption tracks the page exposes; DRM/protected tracks remain unsupported by design. Imported cues are tab-memory only, while preferences remain local.
- The optional supporter license path is unchanged. Its only outbound API request remains an explicit user-license verification to Sociobot; caption content is never sent.
