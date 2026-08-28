# Independent verification 4 — PASS

**Work order:** `caption-confidence-verify-4`  
**Candidate:** `dcce214396c7e2ed030ca16dcad7c257cd69cebc` (`main`)  
**Live URL:** <https://caption-confidence.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Scope:** clean-checkout, production-build, extension, and deployed-site QA. Product source was not changed.

## Verdict

**PASS.** The candidate meets the researched smallest useful product: it locally imports VTT/SRT or uses an exposed HTML5 caption track, marks configured exact-word sound-confusion terms and source/timing uncertainty, and replays the current cue with `R`. The live deployment is the candidate build (ZIP payload contents match; its ZIP container timestamps naturally differ after a fresh local package). The prior checkout-registration blocker is repaired: the required Sociobot endpoint now returns a hosted Dodo checkout redirect.

No open P0, P1, P2, or P3 defects were found.

## Clean checkout and quality gates

The worktree was clean and `HEAD` was the requested candidate before testing.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 341 packages installed; audit reported 0 vulnerabilities. |
| `npm run lint` | PASS. |
| `npm run check` | PASS — `tsc --noEmit`. |
| `npm test` | PASS — 8/8 Vitest tests. |
| `npm run build` | PASS — production MV3 build, static site, and downloadable ZIP produced. |
| `npm run verify:billing` | PASS — HTTP 303 to `https://checkout.dodopayments.com/session/...`. |
| `npm audit --omit=dev`; `npm audit` | PASS — 0 vulnerabilities in both. |
| `npm run test:e2e` | PASS — 7/7 Playwright tests in an isolated run. |

`unzip -t` passed for both the fresh package and the live download. The MV3 build is 33,420 bytes; initial site JS is 3,135 bytes and CSS 13,031 bytes (well below the 200 KB / 50 KB budgets); no font files ship. The downloaded ZIP has the same 15 extracted files and content hashes as the fresh package. Its outer SHA differs solely because ZIP entry timestamps are 05:29 live vs 05:54 fresh.

## Independent product exercise

An unpacked production MV3 extension was loaded into fresh Chromium against a local production preview.

- A normal VTT (`The ship is shipping [?]`) loaded as one local cue into a visible HTML5 video. The overlay marked only `ship` (not the `ship` substring in `shipping`), displayed both `source says uncertain` and `tight timing`, and reported `Ready. 1 captions loaded locally.`
- With a cue beginning at 0, keyboard `R` replayed and clamped the video time to `0`; disabling the overlay immediately set it hidden.
- A page video with no accessible captions gave the specific recovery path: “This video does not expose an accessible caption track. Import its VTT or SRT file instead.” Importing a valid VTT then succeeded.
- Invalid inputs recovered with actionable messages: `.txt` extension, empty VTT, malformed SRT timing, and a file over 5 MB. Unit coverage additionally confirms SRT/VTT parsing, timestamp validation, HTML escaping, exact-word matching, and settings clamping.
- The repository E2E suite separately exercised exposed-track loading, settings updates while a cue is active, popup controls, local invalid-license caching, legal pages, worker/offline reload, and response policy.

This stays within the brief: it accesses user-accessible caption material only, makes no hearing-loss diagnosis or caption-generation claim, and keeps captions/preferences local.

## Live deployment, browser, accessibility, and privacy

Fresh SHA-256 comparisons were identical for live vs fresh `index.html`, `sw.js`, `assets/main-RMVJOiRi.js`, and `assets/main-8pAtrpcS.css`. Live and local extension ZIP payloads were content-identical after extraction.

At desktop 1440×900 and mobile 390×844:

- exactly one `h1`, one `main`, `lang=en`, descriptive title, and visible skip link;
- no horizontal overflow and no visible interactive control below 44×44 CSS px;
- keyboard Tab reaches a designed focus treatment (`3px` lichen outline plus `5px` dark ring); extension keyboard traversal has the same visible focus and no trap;
- `prefers-reduced-motion` reduced slab transitions to `0.000001s`;
- axe reported zero serious/critical violations on the live landing page and extension popup;
- browser console errors, page errors, and failed requests were zero; visual review of fresh desktop and 390 px screenshots found no overlap or clipping.

A normal fresh live load requested only `https://caption-confidence.sociobot.in` — no analytics, beacons, third-party scripts, fonts, or caption upload. The static review confirms only MV3 `activeTab` and `storage` permissions. The service worker was active after reload, accepted `registration.update()`, and a subsequent offline reload retained the shell and showed the offline notice.

Live headers provide HTTPS/HSTS, `nosniff`, `DENY` framing, strict-origin referrer policy, camera/microphone/geolocation restrictions, and a CSP that limits scripts/styles/images to self and connections to self plus the required Sociobot licensing APIs. Cache policy is 30-second revalidation for HTML/worker, one-year immutable for hashed assets, and one hour for the ZIP.

Fresh Lighthouse 13.4.1 mobile: **96 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**; FCP 0.9 s, LCP 1.1 s, TBT 240 ms, CLS 0, total transfer 46 KiB. (The first Lighthouse invocation hit a browser-tab crash; a retry with `--disable-dev-shm-usage --disable-software-rasterizer` produced the valid report.)

The live checkout endpoint is HTTP 303 to HTTPS Dodo hosted checkout; an invalid verification token returns HTTP 200 JSON from the Sociobot API with `Cache-Control: no-store`.

## Defects by severity

None found.
