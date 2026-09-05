# Verify uncertain caption word highlights — FAIL

**Work order:** `caption-confidence-verify-5`  
**Implementation candidate:** `64b7b56e8562e45946c8f351ab0758e9a8ad1a2a`  
**Verification tooling:** `3e3dfebfc79506d5ff81b95806e08e90ca6049f6`  
**Documentation at verification start:** `83a1e21982e8534cecf1c673cc1f96df84a7c547`  
**Live URL:** <https://caption-confidence.sociobot.in/>  
**Verified:** 5 September 2026 UTC  
**Scope:** fresh repository, live desktop and phone browsers, live downloadable extension, and claim evidence. Product code was not changed.

## Job, audience, and first action

The job is to mark caption words a person may miss and replay the current caption line. The audience is people with high-frequency hearing loss who use captions. Before scrolling, fresh desktop and 390 px phone browsers show **Spot uncertain words in captions**, name that audience, and present **Try it with sample data**. The next line says it opens a loaded caption example. Privacy, free-core, and $12 one-time-price facts are also visible before scrolling.

## Verdict

**FAIL — 2 P2 findings and 2 incompletely tested public claims.**

The implementation and live product work end to end in the exercised paths. All commands exit successfully, including all 18 claim commands. Two claim commands still do not assert the full outcomes that their public claims promise. The claims contract says a passing command that checks only availability or checkout copy is not enough. Manual verification of those outcomes does not replace the required repeatable claim tests.

## Findings

### P2 — `free-core` checks controls, not the promised outcomes

Public claim: **Import, word highlights, timing labels, replay, and settings work without a license.**

Declared command:

```text
npm run test:e2e -- --grep @claim:free-core
```

The tagged test opens the demo without a license, then checks that the pairs field, timing checkbox, replay button, and import label are enabled or visible. It does not import a file, change a highlight, show or hide a timing label, replay a cue, or change a setting. That is the exact presence-only pattern the claims contract excludes.

Other tests and this verification exercised those functions successfully. The finding is the incomplete declared evidence, not a failed free feature.

Required repair: make the one `@claim:free-core` test perform and assert every listed free outcome while no license is stored.

### P2 — `supporter-checkout` does not test the paid result

Public claim: **The $12 one-time supporter purchase adds optional caption appearances through Sociobot checkout.**

Declared command:

```text
npm run test:e2e -- --grep @claim:supporter-checkout
```

The tagged test proves an HTTP 303 to Dodo and checks the hosted page for the product name, `$12.00`, and “One-time Supporter unlock.” It does not supply a recorded valid verification response, enable the appearance selector, or apply an optional appearance in the extension. Therefore it proves the checkout listing but not the promised result of the purchase.

Independent QA loaded the live ZIP, supplied a fixture valid verdict, and confirmed the selector enabled and `theme-moss` applied. The implementation works; the declared claim command remains incomplete.

Required repair: extend the one tagged test with a recorded valid verification response and assert that a paid appearance becomes selectable and is applied. No live purchase is needed.

## Clean repository and commands

The worktree was clean at documentation SHA `83a1e21` before installation. Commits after implementation `64b7b56` change only `scripts/verify-url.mjs` and `.factory/handoff.md`; no later product image was required.

| Command or check | Result |
| --- | --- |
| `npm ci` | PASS — 341 packages; 0 vulnerabilities |
| `npm run lint` | PASS |
| `npm run check` | PASS |
| `npm test` | PASS — 8/8 |
| `npm run build` | PASS — site, MV3 extension, and ZIP emitted |
| `unzip -t dist/site/downloads/caption-confidence-chrome.zip` | PASS |
| `npm audit --omit=dev`; `npm audit` | PASS — 0 vulnerabilities |
| `npm run test:e2e` | PASS — 19/19 |
| `npm run verify:claims` | Command PASS — all 18 commands exited 0; 2 are incomplete as described above |
| `npm run verify:billing` | PASS — HTTP 303 to hosted Dodo checkout |
| `./verify-url.sh https://caption-confidence.sociobot.in` | PASS — home, demo, privacy, terms, and designed HTTP 404 |

Initial site JavaScript is 9,624 bytes uncompressed across three bundles. CSS is 18,634 bytes, no web fonts ship, the mobile hero is 37,240 bytes, and the social image is 168,376 bytes. These are within the stated budgets.

## Claim command review

Full command output is retained at `/work/.evidence/claim-commands.log`. The site claim definitions are in `tests/e2e/claims.spec.ts`; extension outcome evidence is in `tests/e2e/extension.spec.ts` and `/work/.evidence/live-extension.json`.

| Claim | Command result | Evidence review |
| --- | --- | --- |
| `exact-word-highlights` | PASS | Complete |
| `replay-current-caption` | PASS | Complete |
| `caption-file-imports` | PASS | Complete |
| `source-uncertainty` | PASS | Complete |
| `timing-flags` | PASS | Complete |
| `demo-isolation` | PASS | Complete |
| `no-account` | PASS | Complete |
| `no-tracking` | PASS | Complete |
| `offline-demo` | PASS | Complete |
| `packaged-download` | PASS | Complete |
| `extension-track` | PASS | Complete |
| `local-settings` | PASS | Complete |
| `no-history-permission` | PASS | Complete |
| `no-caption-generation` | PASS | Complete |
| `caption-data-local` | PASS | Complete |
| `free-core` | Command passes | **Incomplete: availability only, no outcomes** |
| `supporter-checkout` | Command passes | **Incomplete: checkout listing only, no paid result** |
| `license-request-cache` | PASS | Complete |

No additional unlisted public claim was found in the live pages or README. AI assistance is not an expected missing feature for this local exact-word and timing utility.

## Live desktop, phone, and demo

Fresh 1440×900 and 390×844 contexts had no ordinary-load console, page, request, or layout errors. Both requested only the product origin. The primary action ended at 625 px on desktop and 532 px on phone. All three facts ended at 771 px and 698 px respectively, before scrolling.

The one-click live demo showed the persistent **Demo — sample data, nothing is saved** label and four realistic cues. It initially marked `ship`; changing the pair to `last / mast` marked `last`. Selecting caption 2 and pressing `R` moved the displayed position to `00:03.4`. Reset restored the three shipped pairs, `ship`, caption 1, and its status. A real license sentinel stayed unchanged, and **Start for real** cleared the `demo:caption-confidence:active` session key without changing the sentinel.

Invalid `.txt`, malformed SRT, and a 5,000,001-byte VTT each produced a specific recovery message. A valid VTT then loaded one cue and displayed “The ship leaves now.” The demo made no request outside the product origin.

The service worker controlled the live demo, `registration.update()` completed with an activated worker, and an offline reload retained the populated sample plus its offline notice.

## Downloaded extension and normal, boundary, and recovery paths

The live ZIP returned HTTP 200 as `application/zip`, passed `unzip -t`, and contained an MV3 manifest. Its extracted files matched the fresh local package byte for byte. The outer ZIP hash differs because archive timestamps differ.

A fresh consumer Chromium profile loaded the extension extracted from the live ZIP. An exposed HTML5 caption track displayed “The ship leaves now,” marked only `ship`, labeled tight timing, and replayed the opening cue at time `0`. Settings persisted in `chrome.storage.local`. A fixture valid license enabled the appearance control and applying moss changed the live overlay to `theme-moss`. The popup had no console errors, no serious or critical axe results, and no visible control below 44×44 px. The only non-product request was the explicit fixture license check; no caption text appeared in any request.

The repository suite also covered invalid extension, empty/malformed input, over-5-MB input, no exposed track, replacement-file recovery, settings bounds, exact whole-word matching, HTML escaping, and active-cue redraw.

## Accessibility, privacy, routes, and performance

- Home, demo, privacy, terms, and the designed 404 each have `lang=en`, one H1, one main landmark, route-specific titles and metadata, working alternatives, and no serious or critical axe findings at phone and desktop sizes.
- At 1440, 390, and 320 CSS px, no tested route overflowed and no visible interactive target measured below 44×44 px.
- The first Tab focuses **Skip to main content** with a 3 px lichen outline and 5 px dark ring. Keyboard `R` works outside form fields. Native controls expose names and states, and async messages use live regions.
- Reduced motion changes transitions to `0.000001s` and scrolling to `auto`. The visual thesis explicitly uses one light site treatment plus a high-contrast dark caption overlay.
- A clean live license-return URL sent one GET containing only the URL-encoded token, removed it from the page URL, stored the timestamped verdict, preserved the inactive notice after reload, and made no second request.
- The normal site and demo use only same-origin requests. Static and runtime review found no analytics, advertising, remote scripts, remote fonts, or caption upload. The privacy page gives local deletion steps and a privacy contact.
- All internal links, the source link, ZIP, icons, social image, `robots.txt`, and `sitemap.xml` resolved. Mail links are explicit. Checkout was separately verified as HTTP 303.
- An unknown route correctly returned HTTP 404 with title **Page not found — Caption Confidence**, one H1, one main landmark, and a return link. The expected browser resource message for the deliberate 404 is not a defect.
- Live headers include HSTS, CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, strict-origin referrer policy, and restricted device permissions.
- Fresh Lighthouse 13.4.1 mobile scored **100 / 100 / 100 / 100** for Performance / Accessibility / Best Practices / SEO. FCP was 0.88 s, LCP 1.08 s, TBT 0 ms, CLS 0, and transfer 48,069 bytes.

This is a static site and browser extension. Backend tenant isolation, SQLite persistence, backend restart persistence, health endpoints, and HTTP 429 allowances do not apply.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Live ZIP returned 404 | Fixed; live ZIP is valid and its extracted payload matches the build. |
| Service worker returned 404 and logged errors | Fixed; worker controls, updates, and serves the offline demo. |
| Active cue did not redraw after settings changed | Fixed; extension and browser tests pass. |
| CSP and framing headers were missing | Fixed; both policies are live. |
| Checkout returned 404 | Fixed; live endpoint returns HTTP 303 to hosted Dodo checkout. |
| Targets below 44 px and 320 px overflow | Fixed on all tested site routes and the popup. |
| Vulnerable development dependencies | Fixed; both audits report zero vulnerabilities. |
| Cached inactive-license warning disappeared | Fixed; the live warning persists without another request. |
| No one-click isolated demo | Fixed and independently exercised live. |
| No claims manifest or tagged claim commands | Partly fixed; 18 entries and commands exist, but 2 commands are incomplete findings in this report. |
| First screen did not state job or audience | Fixed on desktop and phone. |
| Missing demo, metadata, and designed 404 | Fixed. |
| Missing URL verifier | Fixed and passed against live. |

## Release action

Do not declare this work order PASS. Strengthen the two tagged claim tests so each command proves its full public outcome, then rerun all claim commands and this focused evidence review. No product-runtime repair was indicated by this verification. Chrome Web Store distribution remains outside this repository; the valid MV3 ZIP is the documented installation path.
