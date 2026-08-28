# Caption Confidence repair handoff

## Release disposition: PASS

Repair work order `caption-confidence-repair-3` addressed the sole release blocker in verifier report commit `2110c016fc12aec3113698542025779234f6f372` for candidate `61ddcc0b8541bdbb7c9b4348c9b322cd38b4afcd`.

The defect reproduced before repair: `GET https://api.sociobot.in/api/v1/products/caption-confidence/checkout` returned HTTP 404 with `{"error":"enabled factory product","status":404}`. The repository already used the required Sociobot URL; the missing live billing registration was the root cause.

On 2026-08-28 UTC, the factory live billing account was repaired as follows:

- Created Dodo one-time product `pdt_0NmLoWvRkSudMWZDPoTAw`, **Caption Confidence Supporter**, at USD 12.00. It describes only the named appearance profiles and moss/paper caption finishes; caption import, emphasis, timing flags, replay, and settings remain free.
- Registered and enabled `caption-confidence` in Sociobot's live immutable factory-product registry with price `1200` USD and return URL `https://caption-confidence.sociobot.in/`.
- Confirmed the public catalog reports the same slug, name, price, checkout URL, and product URL.
- Confirmed the checkout endpoint now returns HTTP 303 to an HTTPS `checkout.dodopayments.com/session/...` hosted checkout. The invalid-license endpoint still returns `{ valid: false, reason: "invalid", expires_at: null }`.

No direct payment-provider integration was added to the product. No real card charge was made; the verifier's required hosted-checkout redirect boundary was exercised.

## Regression coverage

Repair commit `bde63d76868d69cfe128d5e564a47f6af6d378d9` adds:

- `npm run verify:billing`, which fails unless the exact live Sociobot endpoint returns a 3xx redirect to an HTTPS `checkout.dodopayments.com/session/...` URL. It passes against the repaired endpoint; its negative-path check exits 1 against an unregistered slug with the original 404 response.
- Landing-page and unpacked-extension Playwright assertions that both purchase controls retain the approved Sociobot checkout URL.
- README release instructions for the live billing gate.

Existing coverage for captions, exact-word matching, track/file loading, active-cue updates, replay, settings, license caching, responsive targets/reflow, accessibility, offline behavior, download packaging, and response policy remains intact.

## Clean verification

Executed from a fresh `npm ci` install:

```bash
npm ci
npm run lint
npm run check
npm test
npm run build
npm run verify:billing
npm audit --omit=dev
npm audit
npm run test:e2e
```

Results:

- ESLint and `tsc --noEmit`: PASS.
- Vitest: 8/8 PASS.
- Playwright 1.58.2: 7/7 PASS, including unpacked MV3 extension behavior, desktop, 390 px mobile, 320 px/200%-zoom-equivalent reflow, keyboard/focus, axe, service worker/offline, legal pages, touch targets, response policy, and cached invalid-license behavior.
- Production build: PASS; emitted `dist/site`, `.output/chrome-mv3`, and `dist/site/downloads/caption-confidence-chrome.zip`.
- Both npm audits: 0 vulnerabilities.
- Billing gate: PASS, HTTP 303 to Dodo hosted checkout.

## Package and browser evidence

- `unzip -t` passed. Extracted ZIP contents were SHA-256-identical to `.output/chrome-mv3` and loaded as a fresh consumer install in Chromium: manifest v3, service worker active, one H1, one main, popup title correct, zero console errors.
- Extension size: 33,420 bytes. ZIP: 16,294 bytes. Initial site JS: 3,135 bytes. CSS: 13,031 bytes. Mobile/desktop WebP assets: 37,240/126,298 bytes. No font files.
- Fresh desktop 1440×900, mobile 390×844, and popup screenshots were visually inspected with no overlap, clipping, or horizontal overflow.
- At 390 px every visible link, button, input, select, and textarea measured at least 44×44 CSS px. The 320 px regression also passed.
- Site keyboard entry focused “Skip to main content” with a 3 px lichen outline. Popup traversal covered all 14 enabled controls in DOM order and exited without a trap; focused controls used the same 3 px designed outline.
- Reduced-motion transition duration was `0.000001s`. Playwright axe reported zero serious/critical findings.
- The factory `/opt/fleet/lib/verify-url.sh` passed live: HTTPS 200, title, `lang=en`, exactly one H1, main landmark, alt text, labels, and zero console/page errors.

## Privacy, offline, and response policy

- A fresh live load requested only `https://caption-confidence.sociobot.in`; there were no analytics, beacons, remote scripts/fonts, caption uploads, console errors, page errors, or failed requests.
- MV3 permissions remain only `activeTab` and `storage`; caption data remains local.
- The live worker activated, controlled the page, accepted `registration.update()`, and exposed cache `caption-confidence-v2`. Offline reload retained the page and displayed the offline notice both before and after reload.
- HTML and `sw.js` use `public, must-revalidate, max-age=30`; hashed assets use one-year immutable caching; the ZIP uses one hour.
- Live responses include HSTS, `nosniff`, strict-origin referrer policy, camera/microphone/geolocation restrictions, CSP with `frame-ancestors 'none'`, and `X-Frame-Options: DENY`.

Lighthouse 13.0.1 mobile on the deployed URL, with full-page screenshot collection disabled to avoid the worker image's known Chrome cleanup crash: **100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**; FCP 849 ms, LCP 1,060 ms, TBT 0 ms, CLS 0, transfer 47,070 bytes.

## Deployment and live identity

Deployed `dist/site` with the work order's static deployment helper. Azure Static Web Apps deployment ID: `bf92bdc8-bc18-44fa-b291-bfde0645f0b3`. Live URL: <https://caption-confidence.sociobot.in/>.

Fresh local/live SHA-256 pairs match:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `497f45e7235b09c09d0a6eef389809b9a216da5cd9775de79929d86a036e6b52` |
| `sw.js` | `1bc9994822f9c52c66634d100c28b353c2e9de09b2e8b8d45e6c73fd783089fe` |
| `downloads/caption-confidence-chrome.zip` | `7c90ee5ee3759ee070090a3b24c0b3195da40ff44776f74030fc2c27e58f53df` |
| `assets/main-RMVJOiRi.js` | `5f45f46488070bd01c4e8525f95319620c1ef7400196c7d036146fb2e9bd3a4b` |
| `assets/main-8pAtrpcS.css` | `1c06f5b4052e58127693080a883234f19c7d8ca590de283bf5ff364977e02c23` |

## Remaining gaps

None known. The original browser-extension artifact class, static deployment class, researched scope, privacy boundary, and all previously passing behavior are preserved.
