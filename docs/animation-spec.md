# Animation specification

## Timeline authority

Native document scroll is the only playhead. In full mode measure stage document top T, total stage height H and visible stage height V. Let D=max(H−V,1), p=clamp((scrollY−T)/D,0,1). Use one requestAnimationFrame update per painted scroll frame; no autonomous playback, time-based drift or scroll interception. Resize remeasures T/H/V. Non-finite progress maps to 0; invalid frameCount (<1 or non-integer) rejects configuration.

Chapter ranges match `vehicle.ts`: presence [0,.14), silhouette [.14,.32), detail [.32,.49), interior [.49,.66), journey [.66,.85), invitation [.85,1]. Select the chapter for which start≤p<end; p=1 belongs to invitation. Local progress u=clamp((p−start)/(end−start),0,1). With N=180, frameIndex=min(N−1,floor(p×(N−1))). Frame 0000 is p=0; frame 0179 is p=1. Frame assignment is global and linear, never independently rounded per chapter.

| Chapter | Global interval | Possible frame indices | Camera / light intent |
| --- | --- | --- | --- |
| presence | 0–.14 | 0–25 | Held wide, light gradually resolves form |
| silhouette | .14–.32 | 25–57 | Lateral movement, stable horizon |
| detail | .32–.49 | 57–87 | Detail composition with matched light |
| interior | .49–.66 | 87–118 | Cabin composition, restrained viewpoint shift |
| journey | .66–.85 | 118–152 | Wide landscape with vehicle stationary |
| invitation | .85–1 | 152–179 | Settle to final hold |

These index ranges overlap because a frame can span a chapter boundary under floor-based mapping; they are not exact chapter cut frames. Each handoff must be visually continuous across its neighboring frames; bake camera transitions into the media. Do not crossfade two large canvases. Last 12 frames should hold composition. Do not animate gauge values or imply acceleration or technical performance.

## DOM choreography

For chapters 1–5, map text opacity from 0 to 1 and translateY from 24px to 0 over local u=0–.18; hold through .76; fade to 0 over .76–1. Invitation enters over 0–.18 then remains fully visible through p=1. Scrub the mapping directly with clamped cubic ease e(t)=1−(1−t)^3; do not run elapsed-time transitions when seeking. The first chapter's essential h1 and fallback copy must already be visible before the director initializes; enhancement may apply choreography only after the first frame is drawable. Any outgoing fade is decorative; semantic chapter content remains readable in document order.

Navigation indicator changes at chapter boundaries; do not animate its position with a spring. Controls and CTA never depend on opacity to indicate focusability. On chapter navigation, target scrollY=T+start×D, select the chapter explicitly within rounding tolerance, and keep focus on the activated link. For direct incoming hash navigation, restore the requested chapter after dimensions resolve. Use immediate scroll for reduced/static mode. Native smooth scrolling in full mode is allowed only for intentional chapter jumps; do not alter ordinary wheel/touch scrolling.

## Media loading and failures

Show the presence poster immediately; never gate the page behind a percentage loader. Fetch only the chosen variant's first poster initially. Load the first frame and a bounded neighborhood around the requested index, favoring current scroll direction; concurrency ≤4 requests. Maintain ≤12 decoded sequence frames and release evicted ImageBitmaps. Seek jumps cancel stale queued requests. Render nearest decoded frame while waiting; if none is available, use the current chapter poster, then a solid background plus DOM copy. Retry a failed request once, then record the failure without blocking scroll. Emit onReady once for the initial drawable sequence image; onError identifies a failing sequence or poster record.

## Asset production contract

Manifest paths are requirements, not delivered files. Both variants use exactly 180 WebP frames, zero-based four-digit names `frame-0000.webp` … `frame-0179.webp`. Desktop directory `/assets/vehicle/desktop/` uses 1920×1080, ≤180,000 bytes per frame. Mobile directory `/assets/vehicle/mobile/` uses 900×1200, ≤100,000 bytes per frame. Encode consistent color in sRGB with no baked labels, UI, watermarks or simulated specifications. Keep exposure, geometry and selected vehicle appearance coherent across shots. Sequence frame count is an editorial budget, not a vehicle specification.

Supply twelve posters, one per chapter per variant, using `/assets/vehicle/posters/{chapter}-{variant}.webp`. Representative source indices: presence 0, silhouette 40, detail 72, interior 103, journey 135, invitation 179. Poster dimensions and per-file budgets match their variant. Recompose mobile rather than blindly cropping desktop. Keep the subject clear of the copy zone, and review each poster at 320px width. Every approved asset needs recorded source and license; posters also require factual alt text once the actual vehicle imagery exists. Do not copy reference-template media. Manifest status becomes approved only after physical-file verification; per-asset status alone is insufficient.

## Motion modes and responsiveness

`full`: scrub sequence and text from native scroll. `reduced`: six static poster chapters, no pinning, camera movement, animated text, smooth scroll or sequence requests. `static`: same static layout, selected explicitly by visitor. Initialize from prefers-reduced-motion; explicit user choice takes priority. On preference changes or user toggles, preserve current chapter and focused control, stop outstanding sequence work, and recalculate geometry. Static layouts use chapter intersection to update navigation, and report frameIndex as that chapter's representative poster index; progress is its start value. No automatic motion resumes merely because a tab becomes visible.

Use portrait media under 768px; landscape media at and above 768px. At heights below 500px, natural-flow poster layout overrides full presentation. On variant changes keep p and chapter, replace media only after a new drawable image is ready, then release the previous variant cache. Respect safe areas and dynamic browser chrome with svh geometry; no forced orientation.

## Acceptance examples

Pure timeline checks: p=0→presence/frame0; .14→silhouette/frame25; .32→detail/frame57; .49→interior/frame87; .66→journey/frame118; .85→invitation/frame152; 1→invitation/frame179. Values below 0/above 1 clamp; NaN and infinities map to 0. Boundary frames can belong to the preceding shot visually, hence transition-safe neighboring frames are mandatory. Check just below and above each boundary, reverse order, and direct jumps from 0 to .85. Reject overlapping, missing, zero-width or unsorted chapter ranges.

Integration acceptance: fast seeks never display a blank canvas when a poster exists; toggling reduced motion triggers zero new sequence fetches; all six chapters remain accessible without JS; orientation changes preserve active chapter; final action remains reachable at p=1. Verify focus visibility, text contrast and no horizontal overflow at the architecture breakpoints. Record decode memory, transferred bytes and draw timings against architecture budgets after assets and runtime exist.
