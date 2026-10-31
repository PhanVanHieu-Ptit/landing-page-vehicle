# Integration status

The application composes presence, silhouette, detail, interior, journey and invitation from the six chapter modules. Details and Orbit accept canonical chapter content and shared media; their specialized verified-subject and orbit modes remain available to other consumers. Journey uses the Performance module's content layout without its unrelated dial. Gauge values no longer animate with scroll.

One native-scroll runtime feeds the existing director. CSS owns sticky positioning. Chapter subscribers receive local progress; the sequence receives global progress. The application shell updates only at chapter boundaries or motion/media configuration changes. Motion choices are session-local. Short viewport mode takes precedence; explicit selection otherwise takes precedence over system motion preference.

The manifest is fetched and validated before media rendering. Requirements-only manifests do not request vehicle media. Missing or failed media retains semantic content. The configured null action renders no conversion link. Static and reduced modes unmount the sequence loader.

Verified: strict TypeScript and Vite production build; timeline boundary/reverse/direct-jump tests; rAF coalescing and listener cleanup/remount tests; gauge mapping and specification parsing tests.

Outstanding: browser visual, keyboard, refresh/resize and responsive acceptance. The browser execution tool is unavailable in this session. No approved vehicle media exists, so decode-memory, transfer, crop, visual continuity and draw-time budgets cannot yet be measured. Do not treat this integration as production media approval.
