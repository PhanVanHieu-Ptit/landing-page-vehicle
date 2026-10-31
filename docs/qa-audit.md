# Automotive landing page QA audit — 2026-10-31

> Historical audit of the original sequence/text implementation. The active concept-still redesign has separate validation notes in [concept-media.md](concept-media.md).

## Verdict

Functional checks pass for the delivered implementation. Cinematic media acceptance remains blocked: the manifest is requirements-only and all 360 sequence frames and 12 posters are absent. No production performance target is certified.

## Executed checks

- Playwright 1.64.1, local macOS ARM64, headless Chromium, Firefox and WebKit; two workers; no network/CPU throttling; DPR 2.
- Viewports: 1440×900, 1920×1080, 768×1024, 390×844. Width emulation is not a physical mobile-device test.
- Development StrictMode: 36/36 pass. Production preview: 36/36 pass, including canvas resize across the variant breakpoint. Final timing rerun: 12/12 pass.
- TypeScript, ESLint and production build pass. All 14 existing unit tests pass through the new unified runner.
- Asset production gate fails correctly: unapproved manifest and 372 missing files.
- Normal journeys assert no page exceptions or HTTP errors. Injected manifest 503 and aborted images retain semantic content. Synthetic approved SVG imagery exercises canvas readiness, DPR scaling, seeks, breakpoint resize, mode teardown and failed-image fallback. Synthetic assets do not validate real WebP decoding, vehicle continuity, memory or crop quality.
- Chapter navigation tested forward/reverse; rapid scroll jumps; resize into short-landscape static mode and back; reduced/full switching; OS reduced motion; skip-link focus; active chapter ownership; panel overlap and horizontal overflow assertions.
- This app uses a native scroll adapter, not GSAP ScrollTrigger. Unit tests cover owned trigger/timeline teardown, remounts and rAF coalescing; development E2E runs under React StrictMode. Browser heap/listener profiling across hundreds of remounts remains unperformed.

## Measured lab metrics

Single local production run of the text fallback, including navigation, rapid scroll, resize and mode changes. LCP is text content; it does not predict the future vehicle LCP. CLS uses maximum five-second session windows separated by one-second gaps. Layout-shift API is unavailable in the tested Firefox/WebKit builds, so those values are unavailable, not zero. Frame intervals are rAF callback intervals across the scenario, not GPU presentation measurements or cinematic FPS.

| Browser / width | CLS | LCP ms | rAF p95 / max ms |
| --- | ---: | ---: | ---: |
| Chromium 1440 | .0428 | 92 | 16.8 / 33.3 |
| Chromium 1920 | .0391 | 116 | 16.8 / 33.3 |
| Chromium 768 | .0382 | 52 | 16.7 / 33.4 |
| Chromium 390 | .0317 | 48 | 16.7 / 33.4 |
| Firefox 1440 | unavailable | 98 | 9.3 / 25.1 |
| Firefox 1920 | unavailable | 85 | 16.7 / 42 |
| Firefox 768 | unavailable | 111 | 9.2 / 16.7 |
| Firefox 390 | unavailable | 71 | 9.2 / 17.5 |
| WebKit 1440 | unavailable | 148 | 27 / 82 |
| WebKit 1920 | unavailable | 109 | 33 / 116 |
| WebKit 768 | unavailable | 107 | 21 / 55 |
| WebKit 390 | unavailable | 104 | 20 / 24 |

INP is not established. Observed event-duration maxima were 48 ms in Chromium and 16–24 ms in WebKit; Firefox produced no above-threshold samples. These are diagnostic event samples, not an INP implementation or field percentile. The short two-worker run is noisy, and WebKit shows visible frame-budget overruns worth profiling with real assets. Raw summaries are in `qa-metrics.json`; Archived development and production Playwright JSON is in `qa/`; current run artifacts are under ignored `test-results/`. A final mobile screenshot is in `qa/mobile-390.png`.

Production output: JS 257.15 kB (81.08 kB gzip), CSS 21.12 kB (4.50 kB gzip), HTML 1.71 kB (.74 kB gzip).

## Fixes applied

- Prevented adjacent chapter text overlap by deriving scroll travel from actual panel heights, including responsive changes.
- Snapped chapter boundaries within one scroll pixel so rounded programmatic navigation does not select the preceding chapter.
- Cached native adapter bounds between refreshes, removing repeated layout measurements from scroll events.
- Skipped clear/draw when frame, fit and canvas size are unchanged; retained seek and resize effects.
- Released canvas backing storage on teardown and image resources when cancellation occurs during decode.
- Added async poster decode, high priority for the opening poster, and lazy loading for subsequent posters. Existing sliding decoded cache, retry and concurrency bounds remain intact.
- Fixed skip-to-story focus by targeting a focusable main landmark. Removed duplicate decorative status text over chapter copy; status remains in the footer.
- Added lint/test/E2E commands and lockfile. Resolved lint findings. Corrected a stale midpoint test from frame 90 to 89 to match the documented floor mapping.

## Memory and caching

Code bounds the frame cache to 12 frames / 96 MiB estimated RGBA. With specified desktop dimensions, 12 frames cost about 94.9 MiB; mobile costs about 49.4 MiB. These are calculations, not observed resident memory. Poster, in-flight decoded images, canvas and browser/GPU copies are additional. A 1920×1080 DPR-2 canvas alone has about 31.6 MiB RGBA backing storage. Actual memory plateau, eviction pressure and thermal behavior require real assets and device profiling.

No cache-busting query strings or forced network fetches were introduced; image requests retain browser HTTP caching. Production CDN headers cannot be verified locally. The asset URLs are currently unversioned: do not set immutable caching on these paths. Deploy versioned asset directories before assigning long immutable lifetimes; revalidate HTML and manifest. Deployment header configuration remains pending because no hosting target is supplied.

## Remaining defects and acceptance gaps

1. Release blocker: absent approved imagery. Mobile fallback is readable DOM content, but its photographic crop, continuity and decode quality cannot be assessed. The page is a text study until assets arrive.
2. Frame stability: WebKit had rAF gaps up to 116 ms in the fallback scenario. Profile a named physical device with real media, cold and warm cache, CPU/network throttling and sustained forward/reverse scrubbing.
3. Real INP, resident memory, GPU memory, production cache headers and repeated long-session cleanup profiling remain unmeasured. No Lighthouse/CrUX or field percentile claim is made.
4. npm audit reports 11 moderate findings in the development lint dependency tree (including minimatch); no high/critical findings. Suggested fixes include major/downgrade changes and were not force-applied. Review dependency advisories before CI rollout.
5. Visual acceptance is sampled rather than exhaustive pixel comparison. Full-mode panels taller than the viewport should receive a dedicated long-copy/zoom review; automated overlap checks do not establish every text block remains conveniently readable throughout sticky scrolling.

## Reproduce

```sh
npm ci
npx playwright install chromium firefox webkit
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e                         # development / StrictMode
QA_PRODUCTION=1 npm run test:e2e         # built production preview
node scripts/assets/run.mjs validate    # expected to fail until real assets arrive
```
