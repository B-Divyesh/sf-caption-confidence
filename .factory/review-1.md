# Review 1 — Try caption samples and replay uncertain words

**Work order:** `caption-confidence-review-1`  
**Reviewed:** 2026-09-05 UTC  
**Live URL:** <https://caption-confidence.sociobot.in/>  
**Implementation SHA reviewed:** `7f86ad973167fb4fa9e8debcb5e7710059f5b6f7`  
**Documentation SHA at review start:** `fbab09d617644524cef62ab292e23196bc2687ec`  
**Report SHA:** this report's commit

## Verdict

**FAIL — 5 findings, including 2 P1 findings and 20 untested public claims.**

The job is to help people who miss some caption words spot their own likely sound-confusion words and replay that caption line. The audience is people with high-frequency hearing loss who use captions. Before scrolling, both fresh desktop and phone browsers show the metaphorical headline **“Catch the word. Keep the moment.”** and the first usable action is **“Download for Chrome.”** They do not state that job and audience plainly, and do not offer the required sample action.

The deployed runtime is the current implementation: fresh local `dist/site/index.html`, JS, and CSS SHA-256 values exactly match the live files. The later commits through `fbab09d` change only verification/handoff documentation after the last product-runtime change (`7f86ad`); `bde63d7` adds a billing test only.

## Findings

### P1 — No one-click demo sandbox exists

**Evidence:** The live home has no link or button containing “sample”, “demo”, or “try it”; it has no **Try it with sample data** action. `/demo` returns HTTP 404. The expected persistent label **“Demo — sample data, nothing is saved”**, **Reset demo**, and **Start for real** controls are absent. No `.factory/demo.md` exists.

**Impact:** A prospective user cannot try a realistic caption workflow in one click. There is no isolated demo state to prove populated output, reset behavior, or that sample use cannot touch real data.

**Required repair:** Add `/demo` (and a first-screen **Try it with sample data** control) that opens a realistic, immediately populated caption example in a `demo:` storage namespace. Show the persistent sample label, Reset demo, and Start for real, document it in `.factory/demo.md`, and test the isolation and reset behavior from a fresh context.

### P1 — The required claims system is absent; 20 public claims are untested

**Evidence:** `.factory/claims.json` is missing, and `rg -n '@claim:' tests` returns no claim tag. Therefore no public statement has the required one tagged, observable sandbox test. The following 20 distinct visitor-facing claims are unlisted and untested under the claims contract:

1. Highlights easy-to-miss words.
2. Replays the current caption with one key.
3. Does not send video or transcript anywhere.
4. Core tools are free.
5. Works in Chrome and Chromium browsers.
6. Requires no account.
7. Imports local VTT files.
8. Imports local SRT files.
9. Reads an exposed HTML5 caption track.
10. Lets a user choose exact word pairs.
11. Labels source-authored uncertainty.
12. Labels unusually tight or overlapping cue timing.
13. Can be set up in one minute.
14. Collects no browsing history.
15. The supporter unlock is $12 one time.
16. A license can be used on the buyer’s own devices.
17. Import, emphasis, timing flags, replay, and settings are never paywalled.
18. Does not open DRM captions.
19. Does not generate transcripts.
20. License verification sends only the pasted token and occurs at most once per day after caching.

Some ordinary E2E and unit tests cover portions of this behavior, but that does not satisfy the contract: none is tagged to a claim, every claim lacks its manifest entry, and the privacy/offline/sample flow is not tested through the required demo entry point.

**Impact:** Visitors are asked to rely on behavior that the build has no declared, reproducible claim evidence for.

**Required repair:** Create `.factory/claims.json`; keep only claims with one `@claim:<id>` test apiece; run every listed command from a clean checkout. Add request-recording privacy coverage and a fresh-context offline/demo test. Remove or narrow any claim that cannot be asserted.

### P2 — The first screen and copy-audit contract are not met

**Evidence:** The home title is **“Caption Confidence — catch the word, keep the moment”** and its sole H1 is **“Catch the word. Keep the moment.”** Neither says the job in plain words. The first-screen lede is 26 words, exceeding the 22-word maximum: “Caption Confidence marks the words you find easy to miss and lets you replay the current caption with one key—without sending your video or transcript anywhere.” The first action downloads an extension rather than trying sample data. The page also contains metaphor/mood copy such as “Concrete certainty. Moss where attention belongs.” and “Add a layer of attention. Nothing more.” `.factory/copy-audit.md` is absent.

**Impact:** A person arriving on a phone is not told clearly enough, in the required words, what the tool does, who it is for, and what to do first.

**Required repair:** Use a job headline such as “Spot uncertain words in captions”; name caption users who miss high-frequency words in a <=22-word lede; put the sample action first with its result beside it; replace decorative copy with useful labels; add and pass the required copy audit.

### P2 — Required site routes, metadata, and 404 experience are missing

**Evidence:** Live `/demo` and `/404` each return Azure’s generic 404 page (HTTP 404, title “Azure Static Web Apps - 404: Not found”, no `<main>` or `<h1>`). `sitemap.xml` omits `/demo`. The home, privacy, and terms source lacks canonical, Open Graph, and Twitter-card metadata; there is no product social image. The header has no Demo or Privacy route. These are required site-structure elements.

**Impact:** The demo cannot be deep-linked, unknown URLs have no usable recovery path, and product pages lack required route metadata and sharing information.

**Required repair:** Ship styled `/404` and `/demo` pages, configure the static host 404 rewrite, list all routes in the sitemap, add route-specific canonical/OG/Twitter tags and a product-derived 1200×630 image, and make the standard header links consistent.

### P2 — The required `verify-url.sh` is missing

**Evidence:** No `verify-url.sh` exists in the checkout (`rg --files -g 'verify-url.sh'` returns no file), so the attached accessibility check cannot be run as required.

**Impact:** The documented URL-level accessibility smoke gate is not reproducible by a clean reviewer.

**Required repair:** Add the project’s documented `verify-url.sh`, run it against the production preview/live URL in CI or the declared verification command, and keep its title/language/main/alt/console checks passing.

## Checks that passed

### Clean checkout and declared commands

After `npm ci`, all commands declared in `README.md`/`package.json` completed successfully:

| Command | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run check` | PASS |
| `npm test` | PASS — 8/8 Vitest tests |
| `npm run build` | PASS — creates `dist/extension`, `dist/site`, and `dist/site/downloads/caption-confidence-chrome.zip` |
| `npm run verify:billing` | PASS — HTTP 303 to hosted Dodo checkout |
| `npm run test:e2e` | PASS — 7/7 Playwright tests |

`npm ci` reported zero dependency vulnerabilities. There were no declared claim commands to run because the required claims manifest is missing; this is the P1 finding above, not a pass.

### Fresh live desktop and phone browsers

Fresh 1440×900 desktop and 390×844 touch contexts loaded the live URL with HTTP 200. Each had `lang="en"`, one `<h1>`, one `<main>`, no missing image alt, no console/page/request failures, only the product origin requested before an explicit action, visible 3 px keyboard focus beginning at the skip link, no horizontal overflow, and zero axe serious/critical violations. At 390 px and 320 px, no visible website controls measured below 44×44 CSS px. The freshly loaded extension popup also had one h1/main and no interactive controls below 44×44 px.

Reduced motion changes slab transitions to `1e-06s`. A fresh controlled service worker was present after reload; with the context offline, reload returned HTTP 200 from the worker and the offline notice was visible. `/privacy/` and `/terms/` each return HTTP 200 with their route title, a single h1, and a main landmark. All live home links resolved as expected: site pages and ZIP were HTTP 200, checkout was HTTP 303, and the source link was HTTP 200. The intentional HTTP 404 responses above are not defects merely because they are 404; they are findings because the required demo and designed 404 pages do not exist.

### Extension behavior

The fresh production MV3 artifact was loaded in the E2E consumer environment. Current 7/7 E2E coverage exercises an exposed HTML5 track, exact whole-word marking, active-cue updates, overlay visibility, replay with `R`, and current normal/invalid/recovery behavior. Unit coverage covers VTT/SRT parsing, malformed timing, escaping, matching, and settings bounds. The packaged live ZIP is HTTP 200 and the clean build emits an installable ZIP.

## Earlier verification findings and current disposition

| Earlier report | Earlier finding | Current disposition and evidence |
| --- | --- | --- |
| `verification.md` | Live ZIP 404 | Fixed: live ZIP is HTTP 200 (16,294 bytes); local build emits it. |
| `verification.md` | Service-worker 404/page error | Fixed: `/sw.js` is HTTP 200; fresh worker controls the page; offline reload works with no console errors. |
| `verification.md` | Active cue did not redraw after settings change | Fixed: current extension E2E changes pairs, text size, timing, appearance, and overlay while the cue is active. |
| `verification.md` | CSP/framing headers missing | Fixed: live CSP includes `frame-ancestors 'none'`; `X-Frame-Options: DENY` is present. |
| `verification-2.md` / `verification-3.md` | Checkout 404 | Fixed: declared live billing check receives HTTP 303 to hosted Dodo checkout. |
| `verification-2.md` | Sub-44 px targets and 320 px overflow | Fixed: fresh 390 and 320 px live checks found no undersized visible controls or horizontal overflow; popup check found none. |
| `verification-2.md` | Vulnerable dev toolchain | Fixed: clean `npm ci` reported 0 vulnerabilities. |
| `verification-2.md` | Cached invalid-license warning disappeared | Fixed: current E2E asserts the inactive warning survives reload without a second verification request. |
| `verification-4.md` | No findings | No regression found in the areas it covered. |

## Notes for the next implementation

The core extension paths appear healthy. The next implementation should prioritize the missing demo and claims system, then revise the first-screen plain language and complete the route/metadata/404 requirements. Re-run this review from the `/demo` entry point after those changes.
