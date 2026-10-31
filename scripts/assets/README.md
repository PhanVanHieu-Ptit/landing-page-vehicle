# Cinematic media pipeline

Run from the repository root:

```sh
node scripts/assets/run.mjs test
node scripts/assets/run.mjs validate
# Optional public directory override:
node scripts/assets/run.mjs validate /absolute/path/to/public
```

The runner uses the installed Vite/esbuild toolchain without changing dependency files. Validation exits nonzero for an unapproved manifest, missing files, wrong WebP dimensions, or files over their compressed-byte budget. It reports every missing index; presence in JSON never establishes file availability. Header validation does not replace a browser decode review.

## Produce aligned frames

1. Obtain approval for one vehicle source: a licensed 3D scene or a continuous, stabilized master capture of the same vehicle. Record its source and license. Do not independently generate car images per frame: geometry, trim, wheels, reflections and camera alignment will drift.
2. Lock the vehicle model, material assignments, lighting setup, color pipeline, frame rate, camera path and exposure. For a render, use deterministic scene settings and a fixed random seed. For footage, stabilize once on the master timeline, remove any cuts, and confirm permission for every visible mark.
3. Build one 180-frame master timeline, numbered 0–179. Coordinate chapter endpoints with `docs/animation-spec.md`. Render all frames from the same timeline; do not normalize exposure or auto-crop each frame separately. Use a fixed subject anchor and ground plane so reverse scrubbing follows exactly the same camera path.
4. Derive two independent, consistent camera/crop tracks from that master: 1920×1080 desktop and 900×1200 mobile. Keep subject-safe margins through the entire track. Mobile must preserve the intended subject rather than blindly center-crop desktop. Use identical timeline sampling for both variants, with no duplicate or missing indices.
5. Export lossless intermediate frames before WebP encoding. For example, with an approved master whose first 180 frames are the intended timeline:

   ```sh
   mkdir -p /tmp/vehicle-desktop
   ffmpeg -i approved-desktop-master.mov -frames:v 180 -start_number 0 /tmp/vehicle-desktop/frame-%04d.png
   ```

   Encode each intermediate with `cwebp -q 82 input.png -o output.webp` (adjust quality after inspection). Outputs go to `public/assets/vehicle/desktop/frame-0000.webp` through `frame-0179.webp`, and equivalent mobile paths. Quality 82 is a starting point, not a guarantee of either fidelity or file size. Never stretch a mismatched source to satisfy dimensions.
6. Extract the six chapter posters from reviewed frames of the same approved timeline and crop tracks. Use the exact poster paths in `public/assets/manifest.json`. Keep each desktop file ≤180,000 bytes and mobile file ≤100,000 bytes. Sequence ceilings are 32.4 MB desktop and 18 MB mobile. Keep startup critical assets ≤600 KB; only load the selected variant.
7. Review a contact sheet and forward/reverse scrub for anchor drift, flicker, geometry changes, crop safety, blur, frame continuity and color shifts. Review mobile independently. Supply source/license on every approved record and human-reviewed alt text on posters. Only then change each record and the manifest to `approved` and run the production gate.
8. Measure real decode memory, draw durations and scrub long tasks on a named device/browser. The 12-frame / 96 MiB decoded cache limit is an estimate based on RGBA pixels, not a browser heap guarantee. Use lower-resolution approved media or posters if the performance targets fail. Do not claim an FPS result without measurement.

## Renderer integration

`SequenceCanvas` accepts `manifest`, `variant` and normalized `progress` supplied by the caller. It has no scroll listener and does not select a competing progress source. Pass a stable manifest object, semantic content outside the decorative canvas, and a readable `fallback` node. `fit` defaults to `cover`; `contain` preserves the complete frame. The parent must provide a nonzero height.

An optional `posterId` selects an approved same-variant poster. Requirements-only or invalid manifests leave fallback content visible and do not initiate media loads. `onReady` fires once per renderer setup after the first drawable image, including a poster. `onError` fires once per failed asset ID per setup; frame failures share their sequence ID. A seek holds the nearest cached frame or poster while the requested frame loads. If neither exists, fallback content stays visible.

`onProgress` reports unique frames ever loaded, unique failed frames, sequence total, current cached count and active/queued work. Loaded count is not cache residency or readiness; a sliding preload window intentionally does not download the entire sequence. The queue prioritizes the requested index and nearby frames, replaces stale queued work on seeks, and bounds in-flight requests (default 3, maximum 6). Decoded cache limits default to 12 frames and 96 MiB; evictions release image resources. A separately loaded optional poster is retained until unmount. In-flight browser decoding may temporarily use additional memory.

DPR is capped at 2. ResizeObserver and window resize schedule redraws and are disconnected on teardown; pending animation frames and loads are cancelled and cached images released. No scroll event handling belongs here. Browser visual and performance acceptance still requires approved assets; the current requirements inventory is not production media.
