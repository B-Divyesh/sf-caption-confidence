# Caption Confidence repair handoff

## Release disposition: BLOCKED ON BILLING REGISTRATION

Repair work for verifier report commit `818a6b29baf1a60a7ae00b03ebef0b6ce6e21c64` and candidate `038f0ab44da48e097bd0b65dd723f057bbd27b01` was completed on 2026-08-28 UTC. The code repair is commit `7f86ad9` on `main`. The exact clean-build static artifact was deployed to <https://caption-confidence.sociobot.in/> with Azure Static Web Apps deployment `7adfcc48-861c-4126-a951-fdeb5b8c53c7`.

All repository-controlled findings are repaired and covered by regression tests. Release remains blocked only because the factory-owned live billing registry still does not contain an enabled `caption-confidence` product. The repository uses the required Sociobot checkout URL, but `GET https://api.sociobot.in/api/v1/products/caption-confidence/checkout` still returns HTTP 404 with `{"error":"enabled factory product","status":404}`. The paid-unlock instructions name `fleet/new-paid-product.sh`; that script and a billing-admin credential are not present in this worker. No payment-provider or billing-infrastructure workaround was attempted.

## Repairs

- Enlarged every visible site and popup control to at least 44×44 CSS px, including header/footer/legal links, the mobile secondary action, popup toggles, skip links, and license controls.
- Changed responsive grid tracks to `minmax(0, 1fr)` and allowed section children to shrink. At the 320 CSS px / 200%-zoom boundary, `scrollWidth === innerWidth === 320`.
- Kept a cached invalid license visibly inactive after reload while retaining the once-per-day request cache. The live regression produced the same “License no longer active” notice before and after reload and made exactly one verification request.
- Upgraded WXT `0.20.11 → 0.21.4`, Vite `7.1.3 → 7.3.6`, and Vitest `3.2.4 → 3.2.7`. Removed the vulnerable `web-ext-run`/`fx-runner` tree. Added ESLint 10 with TypeScript rules and an `npm run lint` gate. Full and production-only npm audits now report zero vulnerabilities.
- Added exact Playwright regressions for 390 px touch targets, 320 px reflow, legal-page targets, popup targets, and cached-invalid-license reload/request behavior. Existing caption import/track/highlight/settings/replay, offline, service-worker, download, CSP, and axe checks remain intact.

## Clean verification

Run from a clean dependency install:

```bash
npm ci
npm run lint
npm run check
npm test
npm run build
npm run test:e2e
npm audit --omit=dev
npm audit
```

Results: install passed; ESLint passed; TypeScript passed; 8/8 Vitest tests passed; production build passed; 7/7 Playwright tests passed; both audits found 0 vulnerabilities.

Build/package evidence:

- MV3 extension: 33.42 KB; packaged ZIP: 16,294 bytes; `unzip -t` passed.
- The ZIP was extracted into a fresh temporary consumer directory and loaded in Chromium: manifest v3, service worker active, popup title/H1 correct.
- Initial site JS: 3,135 bytes; CSS: 13,031 bytes; mobile hero: 37,240 bytes; desktop hero: 126,298 bytes; no font files.

Browser/accessibility evidence:

- Desktop 1440×900, mobile 390×844, and reflow 320×844 were visually inspected. At 390 and 320 px, every visible `a`, `button`, non-file `input`, `select`, and `textarea` measured at least 44×44 px; neither viewport overflowed horizontally.
- Popup keyboard traversal reached all 14 enabled controls in DOM order without a trap. Focus rendered a 3 px lichen outline and 5 px dark ring. Reduced motion and the first-focus skip link passed.
- Playwright axe found zero serious/critical findings on the site and unpacked extension. The factory `verify-url.sh` passed with no console errors, one H1, one main, `lang=en`, title, labels, and image alt text.
- Live service worker was activated and controlling, `registration.update()` succeeded, cache `caption-confidence-v2` existed, and offline reload retained the page and showed the offline notice.
- Live first load made requests only to `caption-confidence.sociobot.in`; no analytics, remote scripts/fonts, caption upload, or unexpected request was observed.

Lighthouse 12.8.2 mobile against the live deployment: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1,070 ms, TBT 0 ms, CLS 0, total transfer 47,034 bytes.

Live identity after the final clean build/deploy:

| Artifact | Local/live SHA-256 |
| --- | --- |
| `index.html` | `497f45e7235b09c09d0a6eef389809b9a216da5cd9775de79929d86a036e6b52` |
| `sw.js` | `1bc9994822f9c52c66634d100c28b353c2e9de09b2e8b8d45e6c73fd783089fe` |
| `downloads/caption-confidence-chrome.zip` | `dd507ab283336e03736d6e1f821e179b4692e1c8ceebd0769b491f279d7ee360` |

Live HTML and worker responses retain short revalidation caching; hashed assets retain one-year immutable caching; the ZIP retains one-hour caching. CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, HSTS, `nosniff`, strict-origin referrer policy, and camera/microphone/geolocation restrictions are present.

## Remaining factory action

Register and enable the live `$12` one-time `caption-confidence` product using the factory billing workflow, with return URL `https://caption-confidence.sociobot.in/`, then confirm the checkout endpoint returns a hosted-checkout redirect. No repository or static-site redeployment is needed for that action.
