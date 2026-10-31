# Creative brief — Light / Form

> Updated direction (2026-10-31): the user selected a VALMORA-inspired rebuild with new generated concept imagery. The active presentation is documented in [concept-media.md](concept-media.md); its copy is `conceptChapters` in `src/config/vehicle.ts`. The prior planning brief below is historical where it conflicts with that direction.

## Shared PROJECT CONFIGURATION

Created for this repository at the user's request. This section is the canonical project configuration; `src/config/vehicle.ts` is its typed content counterpart. Creative choices below are approved working defaults, not vehicle facts.

| Field | Decision |
| --- | --- |
| Working project title | Light / Form (editorial title, not a vehicle or marque) |
| Goal | Introduce a vehicle through six cinematic chapters and an approved next step |
| Audience | Design-conscious automotive visitors on desktop and mobile |
| Language | English |
| Proposed implementation | React + TypeScript + Vite; native scroll, Canvas 2D sequence, CSS overlays |
| Current deliverable | Documentation, types, content configuration, tokens, asset requirements only |
| Vehicle identity | Unassigned; brand, model, model year remain null |
| Technical specifications | Empty; publish only sourced and approved values |
| Conversion | Unassigned; no fabricated booking, price, availability or destination |
| Media | Commissioned or licensed assets required; no supplied media yet |
| Sound | None |
| Publication | Out of scope |

## Direction

A quiet study of light moving across a vehicle. Deep green graphite provides the stage; ivory typography and a restrained champagne accent establish an editorial mood. Use generous negative space, asymmetric copy, thin rules and large serif headlines. Avoid dashboard decoration, simulated performance numbers and excessive interface chrome. Vehicle paint, materials, badges and physical features must follow approved references once a vehicle is selected.

The [VALMORA reference](https://www.scrolltide.co/templates/valmora) describes a scroll-driven vehicle unveiling, camera tour and specification display. Borrow the principle of pacing a story through scrolling, not its vehicle, copy, dust-sheet reveal, tachometer or visual assets. The proposed story instead follows light from whole form to detail, cabin and landscape. The linked description was inspected; a live rendered template was not visually audited.

## Visual identity and tokens

`src/styles/tokens.css` is the value authority. Background #101311, surface #1b211d, ivory text #f2eee4, muted #bdbfb5 and champagne #d6b98c. Georgia supplies an editorial display face without external font requests; Arial supplies readable body and interface text. Display type ranges 40–112px at a 16px root; body 16–18px. Spacing uses a 4px base, fluid gutters and a 90rem content limit. Controls have a 44px minimum target; focus uses a visible 2px outline with 4px offset. Avoid text over unprotected imagery: apply the dark scrim and verify actual contrast.

## Six chapters

| ID | Global range | Story and shot requirement | Copy intent |
| --- | --- | --- | --- |
| presence | [0, .14) | Stationary wide view; a band of light establishes the whole vehicle | A presence, revealed. |
| silhouette | [.14, .32) | Restrained lateral camera movement following the body line | Follow the line. |
| detail | [.32, .49) | Macro study of an approved exterior feature | Look closer. |
| interior | [.49, .66) | Cabin viewpoint composed around approved geometry | A different perspective. |
| journey | [.66, .85) | Vehicle in a quiet landscape; no speed or capability claim | Beyond the frame. |
| invitation | [.85, 1] | Settled final composition, room for approved identity and action | Stay with the moment. |

Descriptions are shot briefs, not claims of specific equipment or materials. Copy in `vehicle.ts` is the initial editorial source; do not duplicate headlines in components.

## Responsive and accessible intent

Desktop uses a pinned widescreen stage with copy in an image-safe left or right column. Mobile receives independently composed portrait media, stacked copy and compact navigation. No text is baked into frames. Reduced motion presents six static posters in natural document flow. Visitors can choose a static mode even when their OS permits animation. All content and approved actions remain readable if media fails or JavaScript is unavailable.

## Creative acceptance

All six chapter intents remain legible in both crops. No stock image or renderer invents a vehicle feature; selected vehicle references govern production. No technical value, price, accolade or availability appears without an approved source. There is one clear next step only after its destination is supplied. Validate accessibility and responsive behavior against the module criteria in architecture.md before implementation is accepted.
