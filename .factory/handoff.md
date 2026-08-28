# Caption Confidence v1 handoff

## Shipped

- WXT + TypeScript MV3 extension with a keyboard-accessible 390 px popup and in-page Shadow DOM caption overlay.
- Local VTT/SRT import, exposed HTML5 `TextTrack` reading, exact user-defined word-pair emphasis, source-authored uncertainty recognition, and an honest tight/overlap timing signal.
- One-key `R` replay with configurable lead-in, plus the global `Alt+Shift+R` command; text size, timing signal, overlay visibility, word pairs, and appearance persist locally.
- Full free accessibility workflow. The optional $12 one-time supporter unlock adds only deep-moss and paper caption finishes.
- Sociobot checkout link, query-string license capture on the site, paste-to-restore in site and extension, daily verdict cache, optimistic offline use from a valid cache, and quiet invalid/revoked handling. No product ID is hardcoded; the slug endpoint is used.
- Responsive static landing, `/privacy/`, `/terms/`, offline notice, service-worker cache, Azure Static Web Apps cache/security configuration, original generated hero artwork, and a 16 KB extension ZIP linked from the deployed site.

## Build and verification

Production command: `npm run build`

Deploy root: `dist/site` (contains `index.html`). Unpacked extension: `dist/extension`. Download: `dist/site/downloads/caption-confidence-chrome.zip`.

Verified on 2026-08-28:

- `npm run check` — pass
- `npm test` — 8/8 unit tests pass
- `npm run build` — pass; extension 32.73 KB total, site JS 3.06 KB, CSS 12.55 KB, mobile hero 37.24 KB
- `npm run test:e2e` — 5/5 pass, including axe serious/critical scan, 390×844 mobile layout, legal pages, console-error assertion, and unpacked-extension track/highlight/replay flow
- Lighthouse 12.8.2 mobile against the final production build: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, total blocking time 0 ms, CLS 0, total transferred size 46 KiB.
- `npm audit --omit=dev` — no runtime dependencies and no runtime advisories

Budgets are met: initial JS is far below 200 KB, CSS below 50 KB, no font payload, mobile hero below 300 KB, and all imagery has explicit dimensions. The UI respects reduced motion, has visible focus treatment and 44 px controls, uses one `h1` and a `main` per page, and loads no third-party runtime script or font.

## Known boundaries

- Browser security and DRM restrictions are respected. Tracks that a site does not expose must be supplied as an accessible VTT/SRT file.
- Imported cue content intentionally lives only in the current tab and resets on navigation/reload; user preferences persist.
- The factory must register the `caption-confidence` product/return URL with Sociobot before checkout can complete in production. No payment provider is embedded.
- The download uses Chrome’s documented unpacked-extension path until a store listing is available.

## Next steps

1. Register the production billing product and exercise the return URL with a real test license.
2. Run a pilot against the brief’s success measure: fewer than one manual replay per five minutes for at least 70% of participants.
3. Submit the packaged MV3 extension to browser stores after privacy review.
