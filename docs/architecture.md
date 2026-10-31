# Architecture and implementation contracts

## Scope and authority

This is a design contract, not a running application. The repository currently has no package setup or section implementation. Shared configuration lives in creative-brief.md; typed vehicle content in `src/config/vehicle.ts`; types in `src/types/cinematic.ts`; visual values in `src/styles/tokens.css`; media inventory in `public/assets/manifest.json`. The working title is editorial. Vehicle approval remains a separate dependency.

Use React + TypeScript + Vite when implementation begins. Keep scroll mathematics independent of React and DOM rendering. One scroll director publishes state; one canvas draws frames. React must not rerender the entire page on each scroll tick. No animation framework is required. Import tokens at the app entry and import public contracts using `import type`.

## Planned public exports

These files are future boundaries, not files to create in this planning phase. Public entry points must not expose internal caches, refs or event listeners.

| Planned module | Named exports / contract | Responsibility and acceptance |
| --- | --- | --- |
| src/cinematic/index.ts | CinematicExperience, ScrollDirector, FrameSequence, ChapterPanel, ChapterNavigation, ExperienceControls, Invitation | Barrel re-exports only; consumers do not import internal files |
| CinematicExperience.tsx | CinematicExperience(CinematicExperienceProps) | Compose six semantic chapter sections and all controllers; correct order with no duplicate IDs; readable fallback before media loads |
| ScrollDirector.tsx | ScrollDirector(ScrollDirectorProps) | Sole normalized progress owner; cleanup listeners; direct seeks and reverse scroll produce same state as forward scroll |
| FrameSequence.tsx | FrameSequence(FrameSequenceProps) | Canvas, loading queue and bounded decode cache; ready after first drawable image; error callback once per failed asset; missing frame holds nearest ready frame or poster |
| ChapterPanel.tsx | ChapterPanel(ChapterPanelProps) | Real DOM headline and copy; no inaccessible canvas text; inactive visual duplicates never create duplicate screen-reader content |
| ChapterNavigation.tsx | ChapterNavigation(ChapterNavigationProps) | Anchor links usable without JS; current item marked aria-current=step; callback progressively enhances jumps; keyboard focus visible |
| ExperienceControls.tsx | ExperienceControls(ExperienceControlsProps) | Accessible full/reduced/static selector; apply system preference at startup and on change unless explicit user choice overrides it |
| Invitation.tsx | Invitation(InvitationProps) | Render an action only for non-null validated configuration; null action produces no fake link or disabled conversion control |
| src/cinematic/timeline.ts | resolveTimeline(progress, chapters, frameCount, motionMode): TimelineState | Pure clamp, chapter selection, local progress and frame mapping; finite input validation; boundary tests as specified in animation-spec.md |

The existing types file exports ChapterId, NormalizedProgress, MotionMode, AssetVariant, AssetId, ChapterDefinition, VerifiedSpecification, VehicleConfiguration, TimelineState, all seven props interfaces, AssetRecord and AssetManifest. The config file exports named `vehicle`; no default export. Proposed public function signature uses those exact types. `NormalizedProgress` is a documented numeric range, not a runtime guarantee.

## State and data flow

Config + validated manifest → experience. Native scroll + measured stage bounds + motion preference → director → TimelineState → media renderer and chapter state. Navigation uses chapter anchors and requests a scroll target through the director's adapter. Full motion uses a sticky canvas and semantic chapter anchors, not a wheel-event hijack. Reduced/static modes bypass the pinned canvas and render posters in document flow. User motion selection is session-local; no tracking or storage required.

Check manifest at runtime before use: unique known IDs, positive dimensions and byte budgets, 180 consecutive indices for each approved sequence, same count for both variants. An asset record being present does not mean the file exists. `requirements-only` manifests must use semantic content fallbacks; they cannot pass the production media gate. Approved assets require source, license and human-reviewed alt descriptions on posters. Sequence alt may remain null because the canvas is decorative alongside the DOM story.

## Agent ownership boundaries

These are future work allocation boundaries; no agents are launched in this phase.

| Owner | Exclusive write scope | Handoff |
| --- | --- | --- |
| Technical lead / integrator | shared types, vehicle config, app entry, dependency files, public barrels | Approves shared contract changes and integrates modules |
| Creative/content owner | docs/creative-brief.md, tokens.css | Supplies approved copy and visual decisions; proposes contract changes to lead |
| Motion owner | docs/animation-spec.md, ScrollDirector, timeline utilities | Uses existing types; no independent frame count or breakpoint definitions |
| Media owner | public/assets/**, FrameSequence internals | Delivers manifest, licensing and decode report; no copy or timeline changes |
| UI/accessibility owner | ChapterPanel, ChapterNavigation, ExperienceControls, Invitation | Uses config and tokens; no direct scroll-progress computation |
| QA owner | future tests and audit reports | Reports failures; does not rewrite shared contracts unilaterally |

One owner per file at a time. Coordinate cross-boundary changes through the lead before edits. Do not introduce alternate configuration files, duplicate progress sources or replace approved vehicle facts.

## Responsive contract

CSS breakpoints: mobile <768px; tablet 768–1199px; desktop ≥1200px. JavaScript uses the same 768px media query for asset variant selection, with desktop assets for tablet/desktop. Breakpoint values are documented constants rather than CSS custom properties, which cannot drive media queries. Recompute scroll bounds on resize/orientation changes without jumping chapter. Desktop stage uses 100svh and an initial total stage height of 700svh (600svh travel); mobile full mode uses 500svh (400svh travel). Final values may be tuned after media QA without changing normalized boundaries. At short landscape heights below 500px, use natural-flow posters to avoid obstructed content.

At 320px width and 200% text zoom there must be no horizontal overflow or clipped controls. Use safe-area insets for edge controls, cap canvas DPR at 2, and preserve subject-safe crops. CSS never stretches frames. Reduced motion and static mode share poster rendering; reduced also disables scroll smoothing, parallax, fades and transforms. Support contrast ratios ≥4.5:1 for normal text and ≥3:1 for large text and meaningful UI. Keyboard focus must never enter invisible content. Do not use aria-live for scroll changes.

## Module acceptance gates

| Module | Required verification |
| --- | --- |
| Config/types | Strict TypeScript check passes once toolchain exists; six unique contiguous ranges cover [0,1]; null identity and action allowed; specs require source |
| Tokens/UI | Only token values used for shared styling; contrast measured over actual scrim/media; 320, 768, 1200 and 1920px widths checked with 200% text zoom |
| Timeline/director | Deterministic boundaries, endpoints, reverse scroll, resize, deep link and motion toggle; no duplicate listeners after mount/unmount |
| Media/manifest | All approved paths resolve, dimensions/counts match, no missing indices, valid licensing, independent mobile crop; fallback survives failed decode and blocked network |
| Chapter panels/navigation | Six semantic sections, one h1, ordered headings, keyboard-operable anchors and current state; no repeated announcements while scrubbing |
| Controls/invitation | OS change and explicit override verified; toggling preserves chapter and focus; no CTA until approved destination exists |
| Integration | Initial content visible without waiting for all frames; no scroll trapping or layout shift from media; no-JS and failed-asset states readable |

Production budget targets: initial critical assets ≤600KB compressed, desktop sequence ≤32.4MB, mobile ≤18MB; do not fetch both variants on startup. Decode at most 12 full frames (approximately 95MiB desktop RGBA) and dispose evicted bitmaps. Target ≤20ms draw time and no animation-caused task >50ms in a 10-second scrub on a representative midrange mobile device; record device/browser rather than claiming an unmeasured universal FPS. If targets fail, use posters or lower-resolution media.

Current planning verification does not constitute browser, runtime, performance or accessibility acceptance. Those checks require implemented components and approved media.
