# Caption Confidence repair handoff

## Release disposition

PASS for the repository and deployed static product.

- Work order: `caption-confidence-repair-4`
- Deployed product implementation: `64b7b56e8562e45946c8f351ab0758e9a8ad1a2a`
- Later verification-tooling commit: `3e3dfebfc79506d5ff81b95806e08e90ca6049f6`
- Live URL: <https://caption-confidence.sociobot.in/>
- Demo URL: <https://caption-confidence.sociobot.in/demo/>
- Deployment target: existing `sf-caption-confidence` Static Web App
- Deployed: 5 September 2026 UTC

The live runtime matches the implementation commit. The later commit changes only the URL verifier so a deliberate HTTP 404 is treated as expected when its page is correctly designed.

## What changed

- Added a one-click demo with four populated caption lines, exact word-pair editing, uncertainty and timing labels, caption sizing, cue selection, keyboard/button replay, and VTT/SRT import.
- Isolated the demo from real state. It uses only the `demo:caption-confidence:` session namespace; reset and exit clear that namespace.
- Rewrote the first screen to name the job, audience, first action, action result, privacy, free core, and optional price before scrolling.
- Added `.factory/claims.json` with 18 public claims and exactly one tagged outcome test for each.
- Added a designed 404 response, route-specific titles, descriptions, canonicals, Open Graph and Twitter metadata, a 1200×630 original social image, sitemap coverage, and consistent navigation.
- Added `verify-url.sh` for status, title, language, landmarks, image alternatives, labels, and console errors.
- Updated the service worker to precache hashed site assets and keep the populated demo functional after an offline reload.
- Fixed an extension edge case where importing a replacement caption file with a reused cue ID could leave the old caption visible.
- Updated README, demo documentation, copy audit, catalog description, visual provenance, and legal copy.

## Review finding disposition

| Review finding | Disposition |
| --- | --- |
| No one-click demo sandbox | Fixed at `/demo/`; sample, persistent banner, reset, real start, isolation, and direct URL are tested. |
| No claims manifest; 20 claims untested | Fixed; unsupported wording was removed or narrowed, and 18 retained claims have tagged outcome tests. |
| First-screen copy did not state job or audience | Fixed; desktop and 390 px cold checks show the job, audience, primary sample action, result, and three facts before scrolling. |
| Missing demo, designed 404, and metadata structure | Fixed; all routes have unique metadata and the unknown-route response is the designed page with HTTP 404. |
| Missing `verify-url.sh` | Fixed; local and live runs pass all routes, including the expected 404 response. |

Earlier findings remain fixed: the live ZIP is installable, the service worker loads without console errors, active settings redraw the current cue, security headers are present, the checkout redirects, 320 px layouts do not overflow, controls meet 44 px targets, audits report no dependency vulnerabilities, and cached invalid-license notices persist.

## Verification

A fresh clone of implementation `64b7b56` was created under `/tmp/cc-clean.sWnGWI`. From that clone:

| Command | Result |
| --- | --- |
| `npm ci` | PASS; 341 packages, 0 vulnerabilities |
| `npm run lint` | PASS |
| `npm run check` | PASS |
| `npm test` | PASS; 8/8 |
| `npm run build` | PASS; extension, site, and ZIP emitted |
| `npm audit --omit=dev` | PASS; 0 vulnerabilities |
| `npm audit` | PASS; 0 vulnerabilities |
| `npm run test:e2e` | PASS; 19/19 |
| `npm run verify:claims` | PASS; all 18 manifest commands ran independently |
| `npm run verify:billing` | PASS; 303 to hosted Dodo checkout |
| `./verify-url.sh http://127.0.0.1:4173` | PASS; home, demo, privacy, terms, and local 404 |

The local Playwright accessibility scan found zero serious or critical issues on every route. It also checked 390 px and 320 px layouts, touch targets, focus, reduced motion, internal links, invalid and oversized files, recovery, offline reload, and the unpacked extension.

Production was deployed successfully. Fresh live checks found:

- Local/live SHA-256 matches for home HTML, demo HTML, and `sw.js`.
- Desktop 1440×900 and phone 390×844: the first action is in the initial viewport, no horizontal overflow, no console errors, and no external request during sample use.
- Demo: `ship` is marked initially, a changed pair marks `last`, R replays from `00:00.0`, reset restores `ship`, and a real-data sentinel stays unchanged.
- **Start for real** clears the demo key and opens `/#download`.
- Offline demo reload: HTTP 200 with populated output and an offline notice.
- Unknown route: HTTP 404 with title `Page not found — Caption Confidence` and H1 `Return to Caption Confidence`.
- Live axe checks: zero serious or critical issues on home, demo, privacy, and terms in desktop and phone contexts.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1 s; CLS 0; 47 KiB transfer.
- Initial JavaScript: 9.6 KB uncompressed across shared, home, and demo bundles. CSS: 18.6 KB. No web fonts. Social image: 168 KB.
- Security policy includes CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, strict-origin referrer policy, and restricted device permissions.
- The live ZIP extracts without errors and matches the local build payload.

## How to run

```bash
npm ci
npm run lint
npm run check
npm test
npm run build
npm run test:e2e
npm run verify:claims
npm run verify:billing
npx vite preview --outDir dist/site --host 127.0.0.1
./verify-url.sh http://127.0.0.1:4173
```

## Known gaps

- Chrome Web Store distribution is not part of this repository. Users install the downloadable MV3 ZIP in Developer mode.
- Lighthouse did not report INP because the audited page load had no qualifying interaction. Interaction paths are covered by Playwright.
