# Upari — instructions for the next Codex session

Read this file before changing anything. Then read `docs/HANDOFF.md`, `docs/VERIFICATION.md`, `docs/DESIGN.md` and `docs/Upari_specifica_originale.md`. The latest user decisions below supersede earlier design-option questions in the recovered conversation.

## User decisions and goal

- Name **Upari** approved. Italian UI. Independent original app, not a fork.
- **Near-black and turquoise**, as in `docs/concept-upari-notte.png`. Keep the planet prominent. Do not reopen the design-choice gate.
- Free, installable, self-hostable static web app. Personal places/preferences stay in IndexedDB. No central user database, account, telemetry, or mandatory Cesium ion key.
- Earth exploration with day/night, real NASA overlays, time, comparison, detailed imagery, and ISS observation in one product. Smartphone camera guidance is wanted.
- Notifications: useful directions and timing, via ntfy or a small personal HA bridge; distinguish local browser UI from a real external scheduler.
- The user asked for this complete package so Codex can continue. Continue the existing work; do not start over or replace the geospatial renderer without a concrete reason.
- **Latest instructions, 11 October 2026:** improve image quality and mobile/desktop UX; remove the permanent AR/pass box; ISS must be optional and initially off. These instructions supersede the old concept's bottom pass strip. Earth occupies the available viewport. Panels appear on demand.
- **Screensaver:** every Earth view can open a separate static page with its exact camera, layer/date/comparison, slow rotation, current clock and optional real weather. Keep the clock independent of WebGL rendering. Preserve native source resolution and credits.
- **Publication is deferred:** the user said “Dopo faremo deploy”. Version 0.2 is local, not pushed or deployed. The existing Site still serves 0.1. Do not publish until the user asks for the next deployment step.

## Working rules

1. Inspect current source and verification before implementation. Keep the approved palette and visual hierarchy.
2. Run `npm ci`, `npm run check`, `npm run test`, `npm run build` as appropriate. Reuse a successful check when inputs have not changed. Do not claim browser/device verification from unit tests or a build.
3. Keep small traceable Git commits. Update `docs/WORK_LOG.md`, `docs/HANDOFF.md`, and `docs/VERIFICATION.md` for each meaningful milestone. The delivery includes a Git bundle; use it when you want the actual history.
4. Latest user authorization: downloading and studying the reference repository, including graphics code, is allowed. Keep the checkout under ignored `.references/`; do not run its scripts or copy application code/assets into the MIT implementation. Document the studied revision and visual findings. Dependencies/data retain their own licenses and credits.
5. No fabricated pass times, weather, accuracy, live data, vector currents, tracking of plankton, or hidden fallback demo data. Black Marble is 2016. Layer dates are separate from ISS/Sun time.
6. Satellite forecasts run in a worker, never block the UI. Keep UTC internally. Geometry uses WGS84, radians inside satellite.js, kilometres in satellite.js, metres in Cesium. NASA WMTS here is EPSG:3857 with 256 px tiles and the documented matrix sets.
7. Keep camera/orientation/geolocation behind a user gesture. Provide the manual guide. Stop video tracks and listeners on exit. Test both landscape directions and permission rejection on real iPhone/Android before calling AR accurate.
8. Protect notification semantics: at-most-once where documented, bounded 48-hour queue, 48-hour orbital freshness for alerts, no duplicates on partial failure, no silent removal of remote queue state after an uncertain cancellation. Never automatically send a live test notification without the user's requested test/channel.
9. No tokens in source, bundles, Git, logs, backup exports or URLs. The HA token belongs in the bridge environment, never the browser. The browser may retain its own narrowly scoped bridge/ntfy token locally if configured by the user.
10. CelesTrak requests: current canonical domain, one catalogue ID, cache 2–4 hours, stop/back off after non-200. Do not bypass source limits by changing domains.
11. Keep rendering adaptive, on-demand where possible, bounded image caches and reduced-motion behavior. Do not add a second 3D engine for decorative trails.
    Native DPR is explicitly enabled in Cesium. The resolution scale is effectiveRatio/nativeDPR, not a second reduction with browser-recommended resolution enabled. See the regression tests. ISS off means no new ephemeris fetches, forecast workers, tracking or periodic refreshes.
12. If Sites is available, `.openai/hosting.json` is the authoritative project identity. Reuse its exact `project_id`; preserve private access. Never create a second Site. Otherwise work locally or use the user's hosting.

## Current local milestone — 0.5.1, 12 October 2026

Country-name tooltip on Natural and study views; geographic WGS84 hit-test20Hz, generalized contemporary boundary disclaimer, imported regional boundaries supported. Atlas hover highlights outlines and dims unrelated relations. Original Cesium Fabric animated forward chevrons/soft trails; schematic, never observed journeys/speeds/people. Separate persistent flowMotion pause, reduced-motion/background suspend; static geometry/native loop and batching by origin. Refined glass/timeline UI, low-height source card scroll. No deploy/push. Current QA and performance limits in HANDOFF/VERIFICATION.

## Previous local milestone — 0.5.0, 12 October 2026

User requests: only **Natural Earth**, best quality; remove all artistic modes/shaders, including saved links/backups. New default High, retain explicitly chosen Auto/Battery. EOX Sentinel-2 cloudless2016 CC BY4.0 replaces proprietary Esri: WGS84 matrix, maxLevel13 (~10m native), historical acquisition2016–2017; NASA orbital imagery/lights2016 and original atmosphere/twilight/zoom remain. Do not imply equal ground detail to former Esri or current imagery. No NC EOX2018–2025 sources.

**Society through time:** eight documented indicators,217 territories,1960–2025 with individual coverage; original UN/ILO/national/Eurostat providers via World Bank WDI; UNHCR2860 rows/263 relations, only3origins N/G2000–2025, up to64 schematic arcs. Single Cesium engine; native clock, static geometry, visual interpolation only, original annual endpoint readouts, null !=0. Theme catalogue, picking, secondary variable/trends, sources/licenses, exports and local documented JSON/CSV boundary tooling. Study scene/backup/link/screensaver persist config, not custom dataset bytes. Read STATISTICAL_ATLAS.md before changing source semantics or adding datasets. Whitelist/async generation/reader guards protect imports and exits. No runtime institutional API polling.

User's iPhone17Pro is on the same Wi-Fi; **real tests postponed to tomorrow by user**, work autonomously now. No phone/channel/PWA certification. Mac Natural60fps target remains open; short IAB study samples are not physical Chrome evidence. No push/deploy. Read current HANDOFF/VERIFICATION.

## Previous local milestone — 0.4.3, 12 October 2026

Natural performance work: on-demand CameraSnapshot eliminates native angle getters per frame; final cache survives teardown and imported scenes exclude old readers. Bounded cap 61 fps Auto/High (small strict widget deadline margin), 30 battery/screensaver; no quality reduction. Local ?perf=1 opt-in HUD reports 300 postRender intervals after imagery/warmup, also in screensaver; production default has no diagnostic observers. 97 tests / 36 files. Physical Chrome Mac DPR2/Vega56: initial 58.84 fps, final 31.80 with RAF31.81 under observed CPU_Speed_Limit28; compiled sample 19.21 fps / RAF18.67 later; samples are not a causal comparison or sustained 60 certification. Read PERFORMANCE.md and its recorded evidence. User phone is iPhone17Pro; common Wi-Fi/USB not confirmed, no actual phone QA yet. No push/deploy.

## Previous local milestone — 0.4.2, 12 October 2026

Implemented locally in `a1234ae`: Natural atmosphere/twilight refinements in the existing shader: metre-based WGS84 limb falloff, sun-aware warm twilight strongest near the limb, reduced native Mie haze, close-up grading fades out. One ray per pixel and stars only outside Earth. Log-altitude C2 imagery transition + bounded readiness-aware ZoomBlend in preRender; suspend on visibility, no new timer. Ground atmospheric tint is also guarded for requested/retained scientific rasters. Camera memory follows visible preRender/zoom immediately, no IndexedDB writes per frame. 91 tests / 34 files; current browser evidence and hardware limits in VERIFICATION.md. No push/deploy.

## Previous local milestone — 0.4.1, 12 October 2026

Implemented locally in `eb68b44`: default slow Earth rotation (0.08 degrees/s at orbital altitude), pause/play and speed in the right toolbar. Persistent scene/backup/screensaver settings; reduce motion starts paused but allows explicit play. A single Cesium preUpdate callback, no additional frame timer; slow down near terrain and hold during interaction. Export reads live camera, background snapshot is best-effort, never write IndexedDB each frame. 88 tests / 33 files; browser portrait/landscape checks and remaining device limits in VERIFICATION.md. Reference source study is now explicitly authorized; ignored checkout revision/findings in REFERENCE_STUDY.md. No push/deploy.

## Previous local milestone — 0.4.0, 11 October 2026

Latest user request: maximum visual quality, especially the default Earth when zooming out; optional cartoon/cel/pixel/voxel/ASCII styles. Implemented locally in `bf85a66`: photographic NASA/Esri altitude blending, actual solar lighting and historical NASA 2016 lights, single-pass original shaders, seven persistent styles and adjustable strength in app/screensaver. Read `docs/EARTH_STYLES.md`. Voxel is explicitly a 2D isometric effect; stars are decorative, not an astronomical catalogue. Natural grading must protect both requested and actually visible scientific frames, including crossfades/failure. Cesium atmospheric fade distances are measured from Earth's centre, not altitude. Preserve the reviewed conversion and mobile/close-up visibility.

## Previous local milestone — 0.3.0, 11 October 2026

The continuation below is historical planning. Playback/source dates, real dated vector packages, horizon masks, diary, local satellite import, regional imagery configuration, additional bridge channels and offline cache visibility are implemented locally. Read the current HANDOFF and VERIFICATION before repeating work. The packaged currents are a 2014 archive; wind is dated 10 October 2026. No push/deploy. Real phone AR/performance, installed PWA offline/update and the user’s channels remain unverified. A real authorized OSCAR v2 file is still needed for operational ingestion.

## Priorities for continuation

1. Browser QA of the compiled current app at 390×844 and desktop, including the separate screensaver. Compare palette/planet hierarchy with the concept while retaining the user's later UI changes. See docs/UIUX_PASS_02.md and docs/SCREENSAVER.md. Verify high-DPR sharpness, tiles, dialogs, optional ISS, fullscreen, clock, weather, backgrounding and keyboard.
2. Real camera/compass QA and complete sensor lifecycle (including denial, repeated activation and backgrounding).
3. Real ntfy/HA end-to-end test with the user's chosen endpoints, cancellation, partial failure, restart and page closed. There are no live credentials in this package.
4. Independent event/visibility validation across dates, latitudes, DST, horizon masks and shadow boundaries. Preserve the existing reference fixtures.
5. Playback refinement/preloading, source date-range refresh and missing-data handling. Test scientific legends and zoom/source changes.
6. Further extensions: operational authorized vector ingestion, guided journeys, queryable scalar data, WebXR and terrain/buildings. Horizon masks, diary, imported satellites, regional imagery, bridge channels and bounded offline shell are already implemented; do not repeat them. Use the source/method ledger for any extension.

Make routine implementation choices autonomously. Ask the user only for information or access that genuinely blocks the next useful step. Report in clear Italian; use short exact technical procedures when needed.
