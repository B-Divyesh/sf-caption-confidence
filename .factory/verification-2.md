# Independent verification 2 — FAIL

**Work order:** `caption-confidence-verify-2`  
**Candidate:** `038f0ab44da48e097bd0b65dd723f057bbd27b01` (`main`)  
**Live URL:** <https://caption-confidence.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Scope:** clean-checkout release QA; no product code was modified.

## Verdict

**FAIL.** The core local caption workflow works, all repository gates pass, and the live static deployment is the candidate. The previous download, service-worker, active-cue refresh, and response-policy defects are fixed. Release acceptance still fails because the advertised **$12 one-time purchase returns HTTP 404**, so the supporter unlock cannot be purchased. The mobile site and extension popup also contain interactive targets below the contract's 44×44 px minimum.

## Clean checkout and repository gates

The working tree began clean at the exact requested commit; `origin/main` also resolved to that commit after a fresh fetch.

| Command/check | Fresh result |
| --- | --- |
| `npm ci` | PASS; 491 packages installed from lockfile. npm reported 11 development-tree advisories. |
| `npm run check` | PASS; `tsc --noEmit`. |
| `npm test` | PASS; 2 files, 8/8 Vitest tests. |
| `npm run build` | PASS; exact production command emitted `dist/extension` and `dist/site`. |
| `npm run test:e2e` | PASS; 6/6 Playwright tests. |
| Lint | No lint script or lint configuration exists in the repository. |
| `npm audit --omit=dev` | PASS; 0 production vulnerabilities. |
| `npm audit` | FAILING SECURITY HYGIENE; 11 dev-tree advisories: 4 critical, 5 high, 2 moderate. |

The packaged ZIP passes `unzip -t`, has MV3 `manifest.json` at its root, and was unpacked into a fresh temporary consumer directory and loaded in Chromium. Output sizes are within budget:

- Extension total: 32.75 KB.
- Initial site JS: 3,093 B; CSS: 12,554 B; no fonts.
- Mobile hero WebP: 37,240 B; desktop hero WebP: 126,298 B.
- Download ZIP: 16,212 B.

## End-to-end product exercise

Fresh Chromium against the packaged extension verified:

- An exposed HTML5 caption track loads, exact whole-word pair matching marks `ship` without marking `shipping`, and `R` replays the active cue.
- A valid SRT recovers after each tested error: `.txt` extension, empty VTT, malformed timestamps, file over 5 MB, and a video with no exposed track. Every failure gave a specific recovery instruction.
- Source-authored uncertainty and tight-timing labels render. Pair changes, 48 px text, timing visibility, appearance, and overlay visibility redraw the already-active cue immediately.
- Replay with a real 15-second media timeline and the 3.0-second maximum lead moved a 10.0-second cue to approximately 7.03 seconds. The popup replay button and page-level `R` both worked. Chromium reports the global `Alt+Shift+R` command registered to `replay-caption`; DevTools keyboard injection cannot exercise browser-global shortcuts faithfully.
- At 390 px, the 48 px caption overlay stayed inside the viewport (`left: 12`, `right: 378`), with no document overflow. Reduced-motion removed its transition (`0s`).
- Invalid license verification sent only the URL-encoded token to Sociobot, stored a timestamped local verdict, stayed locked, and did not repeat the request after reload.
- Popup keyboard traversal reached every enabled control without a trap; every focused control had the designed 3 px lichen outline. The first focus was the skip link.
- No extension page/console errors occurred. Caption import generated no caption/API upload request.

The core feature remains honest: it reads user files or exposed tracks, does not transcribe or bypass DRM, and does not make a medical claim.

## Live deployment identity and behavior

The live home, JS, CSS, both hero images, service worker, privacy page, and terms page byte-for-byte match the fresh candidate build. Representative SHA-256 values:

| Artifact | SHA-256 | Match |
| --- | --- | --- |
| `index.html` | `4ae81fb8be3abe7e6bff87dc624c125f468f95d5c962ea2de26b6b08b3f32b3f` | Exact |
| site JS | `610a1f9b9ad843e7211f54bf51d2eee62f35ee84fcad48c6d086e33ca903347a` | Exact |
| site CSS | `904b2b3caf63e38de7974150011397cf254be16a3d9eee8cf0850a7f96a279ec` | Exact |
| `sw.js` | `1bc9994822f9c52c66634d100c28b353c2e9de09b2e8b8d45e6c73fd783089fe` | Exact |

The live ZIP differs from a newly packaged ZIP only in archive timestamps: it is the same 16,212 B size and `diff -qr` found no extracted-content differences. A browser download produced valid `PK\x03\x04` magic and SHA-256 `ac197848c9d2d6c730e623b18d16042e2d415c2f28ea960be532d0777f8fc7a5`.

Fresh live desktop 1440×900 and mobile 390×844 runs both had:

- zero console errors, page errors, or HTTP errors during ordinary load;
- only the live site's origin requested before an explicit license/purchase action;
- `lang="en"`, a non-empty title, one H1, one main landmark, alt text, and no horizontal overflow;
- zero axe serious/critical findings on the site; the unpacked extension popup also had zero;
- a visible 3 px focus outline with a dark 5 px ring and working skip link;
- reduced-motion transition duration effectively zero;
- a controlling `/sw.js`, cache `caption-confidence-v2`, successful `registration.update()`, and a successful offline reload with the offline notice visible.

The factory `verify-url.sh` passed (HTTP 200, title, language, H1, main, alt, labels, and no console errors). Playwright axe was used because the standalone axe CLI's bundled ChromeDriver did not match the pinned Playwright Chromium; it found zero serious/critical issues.

Lighthouse 13.4.1 mobile, live production URL:

| Category/metric | Result |
| --- | --- |
| Performance / Accessibility / Best Practices / SEO | 100 / 100 / 100 / 100 |
| LCP | 1,068 ms |
| TBT | 31.5 ms |
| CLS | 0 |
| Transfer | 46,986 B |

Response policy is appropriate: HTML and the worker use `max-age=30, must-revalidate`; hashed assets use one-year immutable caching; the ZIP uses one hour. Live responses include HSTS, `nosniff`, strict-origin referrer policy, restricted camera/microphone/geolocation, CSP with explicit Sociobot connect allow-lists and `frame-ancestors 'none'`, and `X-Frame-Options: DENY`.

## Privacy and legal review

- Static and runtime inspection found no analytics, advertising, beacon, WebSocket, remote font, remote script, or caption upload path.
- Cues remain in tab memory. Settings and license state use local extension/site storage.
- The MV3 manifest requests `activeTab`, `storage`, and HTTP(S) host access required for its all-site content script; it does not request history, tabs, audio, or video capture permissions.
- `/privacy/` and `/terms/` are live and accurately disclose local caption handling, optional license verification, price, merchant of record, refunds, and non-medical limitations.
- The generated visual asset has prompt, model/deployment, date, review, and provenance in `.factory/design.md` and `assets/src/`.

## Defects

### P1 — Advertised one-time purchase is unavailable

**Reproduction:** on the live site, activate **Support & unlock**, or GET `https://api.sociobot.in/api/v1/products/caption-confidence/checkout`.

**Actual:** the browser navigates to HTTP 404 JSON:

```json
{"error":"enabled factory product","status":404}
```

**Expected:** redirect to the hosted Sociobot/Dodo checkout for the advertised $12 one-time unlock.

**Impact:** users cannot buy the paid appearance feature. The integration URL is correctly Sociobot-hosted, but the product is not enabled/registered in the live billing engine. This is an external release dependency, not a static deployment mismatch.

### P2 — Touch targets and narrow/zoom reflow violate the accessibility contract

At 390 px, measured live/site targets include the header wordmark at 36 px high, **Get the extension** at 40.1 px, **See the 3-step flow** at 24.8 px, price/legal links at 15 px, and footer links at 24.8 px. In the extension popup, both toggles are 48×28 px, legal/footer links are 14 px high, and the focused skip link is 39.2 px high.

The controls are keyboard accessible and visibly focused, and axe reports no serious/critical issue, but they fail the supplied non-negotiable touch-target minimum.

At a 320 CSS px viewport (the relevant reflow boundary and equivalent to a 640 px viewport at 200% zoom), the supporter grid expands the document to 363 px. Its copy, price slab, form, and Verify action extend roughly 43 px beyond the right edge, requiring horizontal scrolling. The tested 390 px layout itself has no overflow.

### P2 — Vulnerable development toolchain is locked

`npm audit` reports 11 dev-tree advisories. Direct dependencies include vulnerable `vitest@3.2.4` (critical arbitrary file read/execution when its UI server is exposed; fixed in 3.2.6+) and `vite@7.1.3` (multiple development-server file-read/bypass advisories; a 7.3.6 fix is available). `wxt@0.20.11` also brings critical/high transitive advisories through `web-ext-run`, `fx-runner`, `shell-quote`, and related packages. The deployed static product has no production dependency vulnerability, but contributors and CI should not remain on known-vulnerable tooling.

### P3 — Cached invalid website license loses its explicit warning after reload

With a mocked invalid verdict, the first website check says **License no longer active** and stores the invalid timestamped verdict. Reloading within one day correctly avoids another request and stays locked, but changes the message to **The free extension works without a license.** The paid-unlock contract calls for the quiet inactive-license notice to remain visible while an invalid saved token exists.

## Previous-report regression disposition

- **Fixed:** live extension download is HTTP 200 and installable.
- **Fixed:** `/sw.js` is HTTP 200, controls the page, updates, and supports offline reload without errors.
- **Fixed:** setting changes immediately redraw/hide an active cue.
- **Fixed:** CSP and framing policy headers are live.

## Release disposition

Do not mark this candidate PASS. Enable/register `caption-confidence` in the live Sociobot billing engine and recheck the checkout redirect; enlarge all interactive hit areas to at least 44×44 px and fix the 320 px/200%-zoom reflow; upgrade the vulnerable dev toolchain; and preserve the invalid-license notice across cached reloads. Then rerun the live purchase, mobile/popup target and reflow measurements, clean install/build/tests, audit, and focused browser regression.
