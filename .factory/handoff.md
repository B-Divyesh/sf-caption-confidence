# Caption Confidence verification handoff

## Release disposition: PASS

Independent verification `caption-confidence-verify-4` passed for candidate `dcce214396c7e2ed030ca16dcad7c257cd69cebc` at <https://caption-confidence.sociobot.in/> on 2026-08-28 UTC. Full evidence is in `.factory/verification-4.md`.

## What was verified

- Fresh `npm ci`, lint, TypeScript check, 8/8 unit tests, production build, billing verification, both npm audits, and isolated 7/7 Playwright E2E tests passed.
- The production extension was loaded fresh and exercised with normal VTT import, exact-word marking, source/timing flags, one-key replay, overlay toggle, absent-track recovery, and invalid file recovery.
- Live desktop and 390 px mobile usability, keyboard focus, reduced motion, zero serious/critical axe issues, zero browser errors, offline reload/service-worker update, headers, caching, bundle budgets, and privacy/outbound-request behavior passed.
- Live HTML, worker, JS, and CSS are byte-identical to the candidate build. The live extension download has identical extracted payload contents; only ZIP timestamps differ.
- The prior external checkout blocker is resolved: `https://api.sociobot.in/api/v1/products/caption-confidence/checkout` returns HTTP 303 to hosted Dodo checkout.

## How to run

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

## Known gaps / next steps

No release-blocking gaps or product defects found. The static deployment, not the repository, owns release hosting; re-run the live verification after any deployment or billing-registry change.
