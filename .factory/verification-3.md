# Independent verification 3 — FAIL

**Work order:** `caption-confidence-verify-3`  
**Candidate:** `61ddcc0b8541bdbb7c9b4348c9b322cd38b4afcd` (`main`)  
**Live URL:** <https://caption-confidence.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Scope:** fresh clean-checkout QA; product source was not changed.

## Verdict

**FAIL.** Local and live static-product quality is good, but the advertised $12 one-time supporter unlock cannot be purchased: the required Sociobot checkout endpoint returns HTTP 404. That is a P1 external billing-registration failure, so the candidate cannot receive a release PASS.

## Clean checkout, gates, and package

The initial checkout was clean and at the requested SHA. A fresh `git fetch origin main` resolved `origin/main` to the same SHA.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 341 packages installed. |
| `npm run lint` | PASS. |
| `npm run check` | PASS — `tsc --noEmit`. |
| `npm test` | PASS — 8/8 Vitest tests. |
| `npm run build` | PASS — exact production build emitted `dist/site`, `dist/extension`, and the ZIP. |
| `npm run test:e2e` | PASS — 7/7 Playwright tests. |
| `npm audit --omit=dev`; `npm audit` | PASS — 0 vulnerabilities in either tree. |

`unzip -t dist/site/downloads/caption-confidence-chrome.zip` passed. The MV3 extension is 33.42 KB; initial site JS is 3,135 B, CSS 13,031 B, no fonts, mobile/desktop WebP assets 37,240 B/126,298 B, and the ZIP 16,294 B — within the provided budgets. The live ZIP was downloaded, unpacked into a fresh consumer directory, and loaded in Chromium; all extracted contents exactly match the fresh build (outer archive timestamps differ).

## Product exercise

The freshly downloaded/unpacked extension was exercised against a production preview:

- Valid VTT produced an active overlay, marked exact `ship` without marking `shipping`, displayed source-uncertainty and tight-timing labels, and announced local loading success.
- While the cue was active, changing pairs updated markup immediately, 48 px text immediately applied, timing hiding immediately removed its flag, and disabling the overlay immediately hid it.
- `R` replayed an active opening cue and correctly clamped a 3.0-second lead-in at time 0. The repository E2E independently exercises exposed HTML5-track loading and replay.
- Invalid `.txt`, empty VTT, malformed SRT timestamps, >5 MB input, and an HTML5 video with no exposed track each gave a specific recovery message. A valid VTT then loaded successfully.
- Extension page/popup console and page errors: 0. Axe serious/critical findings: 0. Visible popup controls measured at least 44×44 px and received the designed 3 px lichen + 5 px dark focus treatment.

The implementation remains honest to the brief: it operates on user-imported captions or exposed tracks; it does not generate captions, bypass DRM, upload caption text, or make medical claims.

## Live deployment and browser checks

The live static deployment exactly matches the candidate, including these fresh local/live SHA-256 pairs:

| Artifact | SHA-256 |
| --- | --- |
| `index.html` | `497f45e7235b09c09d0a6eef389809b9a216da5cd9775de79929d86a036e6b52` |
| `sw.js` | `1bc9994822f9c52c66634d100c28b353c2e9de09b2e8b8d45e6c73fd783089fe` |
| `main-RMVJOiRi.js` | `5f45f46488070bd01c4e8525f95319620c1ef7400196c7d036146fb2e9bd3a4b` |
| `main-8pAtrpcS.css` | `1c06f5b4052e58127693080a883234f19c7d8ca590de283bf5ff364977e02c23` |

Fresh 1440×900, 390×844, and 320 CSS px (200%-zoom-equivalent) browser runs found zero console/page/failed-request errors and only the product origin on normal load. The home has correct title, `lang=en`, exactly one H1 and main, alt text, no horizontal overflow, and no visible control under 44×44 px. Keyboard Tab reaches the skip link with the visible designed focus ring; reduced-motion transition duration is `1e-06s`. Axe found zero serious/critical findings on the live home and popup.

The requested `verify-url.sh` is not present anywhere in this candidate, so its checks were performed directly in the fresh browser run instead (title, language, landmarks, alt text, labels, console/page errors, focus, and response status).

The live worker controlled after reload and served a successful offline reload with its offline notice. HTML/worker use short revalidation; hashed assets use one-year immutable caching; ZIP uses one hour. HTTPS responses include HSTS, `nosniff`, strict-origin referrer policy, CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, and camera/microphone/geolocation restrictions.

Mobile Lighthouse 13.4.1 produced **100 / 100 / 100 / 100** (Performance / Accessibility / Best Practices / SEO), LCP 344 ms, TBT 0 ms, CLS 0, transfer 47,052 B, using the supplied unthrottled environment. The JSON report was generated before Lighthouse's Chrome process exited during final screenshot cleanup.

## Privacy and licensing

- MV3 declares only `activeTab` and `storage`; host access supports finding visible HTML5 video. It requests no history, audio/video capture, or remote code.
- Static review and a clean live page load found no analytics, beacon, WebSocket, third-party font/script, or caption upload. Caption cues remain in tab memory; preferences/license state are local storage.
- An intercepted live invalid-license flow URL-encoded and sent only `bad token` to Sociobot, stored a local timestamped verdict, removed `license` from the URL, preserved the inactive-license notice after reload, and made one verification request.
- Live `/privacy/` and `/terms/` accurately describe local caption handling, pricing, merchant of record, refunds, and limitations.

## Defect

### P1 — required supporter checkout is unavailable

**Reproduction:** activate **Support & unlock** at the live site, or GET <https://api.sociobot.in/api/v1/products/caption-confidence/checkout>.

**Actual:** HTTP 404:

```json
{"error":"enabled factory product","status":404}
```

**Expected:** redirect to the hosted Sociobot/Dodo checkout for the advertised $12 one-time unlock.

**Impact:** users cannot buy the optional paid appearance finishes. The application uses the correct required Sociobot URL; the product is not enabled/registered in the factory-owned live billing system. This is not a candidate/static-deployment mismatch.

## Required release action

Register and enable `caption-confidence` in the live Sociobot billing registry with return URL `https://caption-confidence.sociobot.in/`, then recheck that the endpoint redirects to hosted checkout. Do not mark this candidate PASS until that evidence exists. No repository product-code change is indicated.
