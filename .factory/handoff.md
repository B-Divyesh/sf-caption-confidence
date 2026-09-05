# Caption Confidence verification 5 handoff

## Result

**FAIL — 2 P2 findings and 2 incompletely tested public claims.**

- Work order: `caption-confidence-verify-5`
- Implementation reviewed: `64b7b56e8562e45946c8f351ab0758e9a8ad1a2a`
- Verification tooling: `3e3dfebfc79506d5ff81b95806e08e90ca6049f6`
- Documentation at verification start: `83a1e21982e8534cecf1c673cc1f96df84a7c547`
- Live: <https://caption-confidence.sociobot.in/>
- Demo: <https://caption-confidence.sociobot.in/demo/>
- Full report: [`.factory/verification-5.md`](verification-5.md)

Product code was not changed. The live implementation works in the tested desktop, phone, offline-demo, checkout, license, extension, download, accessibility, privacy, and designed-404 paths. Release acceptance fails because two required per-claim tests prove only part of their public wording.

## Findings to repair

1. `@claim:free-core` checks that controls are enabled or visible. It does not perform and assert import, highlighting, timing labels, replay, and settings without a license.
2. `@claim:supporter-checkout` checks the redirect, hosted product, price, and one-time wording. It does not use a recorded valid verdict to prove that an optional appearance becomes enabled and applies.

Independent QA manually confirmed both outcomes work. The repair is test evidence, not product behavior. Keep exactly one tagged outcome test for each claim.

## Verification completed

| Command or check | Result |
| --- | --- |
| `npm ci` | PASS — 341 packages, 0 vulnerabilities |
| `npm run lint` | PASS |
| `npm run check` | PASS |
| `npm test` | PASS — 8/8 |
| `npm run build` | PASS |
| `npm audit --omit=dev`; `npm audit` | PASS — 0 vulnerabilities |
| `npm run test:e2e` | PASS — 19/19 |
| `npm run verify:claims` | Command PASS — 18/18; 2 commands are semantically incomplete |
| `npm run verify:billing` | PASS — HTTP 303 to Dodo checkout |
| Live `verify-url.sh` | PASS, including expected designed HTTP 404 |

Fresh live checks confirmed:

- The desktop and phone first screens state the caption-highlighting job, audience, sample action, action result, and three facts before scrolling.
- The four-cue demo updates exact-word marks, replays from the lead-in, resets, preserves a real-data sentinel, clears its session namespace on exit, and reloads populated while offline.
- Invalid extension, malformed caption data, over-5-MB input, no exposed track, and valid recovery paths give usable results.
- The downloaded MV3 ZIP extracts cleanly and its payload matches the local build. A clean Chromium profile used the live artifact successfully.
- Home, demo, legal pages, and designed 404 have correct titles and structure, no serious or critical axe results, no narrow-width overflow, and no sub-44 px visible controls.
- Same-origin request checks found no tracking or caption upload. Live license verification sent only the token, cached the verdict, and kept the inactive notice after reload.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.08 s, CLS 0.

## How to verify after repair

```bash
npm ci
npm run lint
npm run check
npm test
npm run build
npm run test:e2e
npm run verify:claims
npm run verify:billing
./verify-url.sh https://caption-confidence.sociobot.in
```

Inspect the two focused claim commands as well as their exit status. Each must assert the complete claim outcome.

## Known distribution limit

Chrome Web Store publication is outside this repository. Installation uses the tested downloadable MV3 ZIP.
