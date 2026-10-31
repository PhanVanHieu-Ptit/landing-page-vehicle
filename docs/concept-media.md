# Grand tourer concept media

Current implementation: `src/app/App.tsx`, copy in `conceptChapters` in `src/config/vehicle.ts`.

The user selected a VALMORA-inspired rebuild using new imagery on 2026-10-31. This supersedes the old brief's direction to avoid a dust-sheet reveal. The live app uses four generated studio stills, CSS reveal masking, scroll-based pan/zoom, chapter changes and a scroll-progress dial. It does not claim to provide a continuous 3D orbit or physically simulated cloth. No vehicle performance figures are invented.

## Asset provenance

Generated with the built-in imagegen tool; the hero was used as the image reference for all three other shots. Web assets are JPEG quality 88, converted from the generated PNGs using macOS sips. All four are local in `public/assets/concept/` and require no remote image requests.

| File | Final prompt specification |
| --- | --- |
| `hero.jpg` | Photorealistic original unbranded 1960s grand tourer concept, oxblood paint, round headlights, wire wheels, delicate chrome, front three-quarter facing left. Near-black warm studio, reflected floor, empty upper third, wide landscape, no text or logos. |
| `covered.jpg` | Edit hero preserving camera, silhouette, frame, floor and lighting. Completely cover car with warm ivory silk dust sheet, realistic folds following geometry; no visible vehicle parts. |
| `rear.jpg` | Same concept and studio, move to rear three-quarter, nose facing left away from camera. Preserve paint, wheels, proportions; elegant fastback, round tail lamps and delicate chrome bumper. Empty upper third, no logos or lettering. |
| `detail.jpg` | Same concept, close shot of front fender, headlight and wire wheel, vehicle on left two-thirds, near-black right third for copy. Preserve geometry, burgundy paint and chrome, subdued studio light. |

Full prompt wording is retained in this conversation's imagegen tool calls. Original PNGs remain in the imagegen output directory. Asset identity is illustrative; generated angles are not guaranteed CAD-consistent.

The old `public/assets/manifest.json` remains a requirements-only contract for the optional legacy 180-frame renderer. The active still-based presentation does not fetch it. Do not mark that sequence approved merely because the concept stills exist.

## Validation

Production build and 14 existing logic tests passed. Desktop and mobile Chromium checks cover actual media decoding, chapter navigation forward/reverse, menu interaction, horizontal overflow, reduced-motion natural flow, replay and failed-media fallback. See the current Playwright report for run results. Earlier QA metrics in `qa-audit.md` refer to the legacy text/sequence presentation and do not certify this redesign.
