# VALMORA comparison — 2026-11-01

## Result

The current implementation does not match VALMORA. A 100% match is neither achieved nor certified. No numeric similarity score is assigned: a recorded preview cannot establish pixel parity or interaction parity with the live original.

Reference: https://www.scrolltide.co/#t-valmora → https://www.scrolltide.co/templates/valmora

The public template page exposes a 37.6-second preview recording at https://pub-1e5b4001b36b47e28e6a2fb775966a79.r2.dev/previews/valmora.mp4 . This recording was inspected at three-second intervals. It is comparison evidence, not a production asset or the original frame sequence. Public template metadata identifies VALMORA as Premium with source code enabled; the authenticated source package was not available in this session.

## Evidence

- Current app opening: [desktop screenshot](qa/valmora-current-desktop.png), 1280 × 756, Chromium, actual decoded local images.
- Reference: [opening frame](qa/valmora-reference-opening.jpg) and [preview contact sheet](qa/valmora-reference-contact.jpg). Frames are extracted from the public recording; the contact sheet is not a chronological full-page screenshot.
- Implementation inspected: `src/app/App.tsx`, `src/app/experience.css`, `src/config/vehicle.ts`, `docs/concept-media.md`.

## Differences

| Area | Reference observed in recording | Current implementation | Required change |
| --- | --- | --- | --- |
| Identity/navigation | VALMORA; Design, Specification, Atelier, Private Viewing | LIGHT / FORM; vehicle selector; Explore chapter menu | Restore reference header, content, destinations, and interactions |
| Opening | Monumental stone hall, skylight, reflective marble, covered GT | Near-black studio with different generated covered car | Use matching original environment, car, lighting, camera and media |
| Typography | Wide uppercase sans-serif with contrasting italic accents | Georgia serif headlines and small Arial labels | Obtain exact fonts and match metrics, tracking, wrapping and placement |
| Opening copy | Large editorial headline about rediscovering classics | “Some things never grow old.” | Reconstruct original copy and layout from source |
| Unveiling | Cloth lifts and gathers while the camera moves around the car | CSS inset mask removes a still vertically | Replace masking with original continuous frame sequence and its scroll mapping |
| Camera/detail tour | Continuous orbit plus wheel/body detail close-ups and callouts | Four distinct stills, repeated across six equal chapters, small pan/zoom | Integrate complete sequence, camera continuity, timed labels and hotspots |
| Story structure | Hero/model introduction, Design, Specification, Atelier and further sections visible in recording | Six fixed fullscreen panels in one sticky stage | Rebuild section lengths, pinning, transitions and natural-flow sections |
| Specification | Large left tachometer and right specification rows with changing numbers | Right progress dial displaying percent | Implement matching dial geometry, units, values, rows and count-up timing |
| Atelier | Image panels, craft metrics, large light-colour section and curved boundaries | No equivalent | Implement original section composition and transitions |
| Extra UI | Minimal reference navigation and sequence annotations | Motorcycle switch, side dots, chapter count, independent-study footer | Resolve these deliberate project additions against strict parity |
| Mobile | Not established by this desktop recording | Responsive still-based layouts exist | Compare against the original live mobile build before certification |

## Completion requirements

1. Supply the original VALMORA source/export package with frame sequences, posters, fonts and other assets. The current generated images cannot reproduce the original camera/cloth/environment geometry.
2. Integrate the original presentation locally. Preserve the existing motorcycle work separately while resolving whether it belongs in the exact-match presentation.
3. Compare the live original and local implementation at identical viewport sizes, device pixel ratio, font readiness and scroll positions; include intermediate forward/reverse scrubbing, drag behaviour, loading, menu states and section transitions.
4. Review screenshot differences and interaction timing at desktop and mobile widths. Define the acceptance tolerance explicitly; literal pixel identity across browsers and machines cannot be inferred from a video.

## Checks and scope

`npm run build` passed (TypeScript and Vite). A local Chromium opening screenshot was captured. These checks establish build health and the current opening appearance, not visual parity. No application source was changed during this comparison, and pre-existing uncommitted motorcycle changes were preserved. Source/media access is the remaining dependency for exact reproduction; no paywall was bypassed.
