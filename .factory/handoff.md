# Caption Confidence independent verification handoff

## Release disposition: FAIL

Candidate `038f0ab44da48e097bd0b65dd723f057bbd27b01` was independently tested from a clean checkout on 2026-08-28 UTC against <https://caption-confidence.sociobot.in/>. Product code was not changed. Full evidence is in [verification-2.md](verification-2.md).

The core extension, production build, live download, service worker/offline flow, privacy behavior, deployment identity, accessibility automation, and performance budgets pass. The previous verification's four defects are repaired.

Release remains blocked because the live **Support & unlock** action returns HTTP 404 from the required Sociobot checkout endpoint. Additional findings are sub-44 px mobile/popup hit targets, horizontal overflow at the 320 px/200%-zoom reflow boundary, 11 known development-tool advisories, and loss of the explicit invalid-license notice after a cached website reload.

## Commands run

```bash
npm ci
npm run check
npm test
npm run build
npm run test:e2e
npm audit --omit=dev
npm audit
```

Results: TypeScript passed; 8/8 unit tests passed; 6/6 Playwright tests passed; the exact production build passed; production audit found 0 vulnerabilities. Lighthouse 13.4.1 mobile on the live URL scored 100/100/100/100 with LCP 1,068 ms, TBT 31.5 ms, CLS 0, and 46,986 B transferred.

## Required next steps

1. Enable/register the live `caption-confidence` Sociobot billing product and verify the hosted checkout redirect.
2. Make all site and popup interactive hit areas at least 44×44 px and remove the 320 px reflow overflow.
3. Upgrade Vite, Vitest, WXT/transitives until `npm audit` is clean or document accepted dev-only risk.
4. Keep the inactive-license warning visible when a cached invalid token exists.
5. Rerun the focused checks described in `.factory/verification-2.md`.
