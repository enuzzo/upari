# Upari — instructions for the next Codex session

Read this file before changing anything. Then read `docs/HANDOFF.md`, `docs/VERIFICATION.md`, `docs/DESIGN.md` and `docs/Upari_specifica_originale.md`. The latest user decisions below supersede earlier design-option questions in the recovered conversation.

## User decisions and goal

- Name **Upari** approved. Italian UI. Independent original app, not a fork.
- **Near-black and turquoise**, as in `docs/concept-upari-notte.png`. Keep the planet prominent. Do not reopen the design-choice gate.
- Free, installable, self-hostable static web app. Personal places/preferences stay in IndexedDB. No central user database, account, telemetry, or mandatory Cesium ion key.
- Earth exploration with day/night, real NASA overlays, time, comparison, detailed imagery, and ISS observation in one product. Smartphone camera guidance is wanted.
- Notifications: useful directions and timing, via ntfy or a small personal HA bridge; distinguish local browser UI from a real external scheduler.
- The user asked for this complete package so Codex can continue. Continue the existing work; do not start over or replace the geospatial renderer without a concrete reason.

## Working rules

1. Inspect current source and verification before implementation. Keep the approved palette and visual hierarchy.
2. Run `npm ci`, `npm run check`, `npm run test`, `npm run build` as appropriate. Reuse a successful check when inputs have not changed. Do not claim browser/device verification from unit tests or a build.
3. Keep small traceable Git commits. Update `docs/WORK_LOG.md`, `docs/HANDOFF.md`, and `docs/VERIFICATION.md` for each meaningful milestone. The delivery includes a Git bundle; use it when you want the actual history.
4. Do not read or copy application source from the original reference repository. Original source here is MIT; dependencies and data retain their own licenses and credits. The private handoff may mention the research reference; product UI needs only relevant data credits.
5. No fabricated pass times, weather, accuracy, live data, vector currents, tracking of plankton, or hidden fallback demo data. Black Marble is 2016. Layer dates are separate from ISS/Sun time.
6. Satellite forecasts run in a worker, never block the UI. Keep UTC internally. Geometry uses WGS84, radians inside satellite.js, kilometres in satellite.js, metres in Cesium. NASA WMTS here is EPSG:3857 with 256 px tiles and the documented matrix sets.
7. Keep camera/orientation/geolocation behind a user gesture. Provide the manual guide. Stop video tracks and listeners on exit. Test both landscape directions and permission rejection on real iPhone/Android before calling AR accurate.
8. Protect notification semantics: at-most-once where documented, bounded 48-hour queue, 48-hour orbital freshness for alerts, no duplicates on partial failure, no silent removal of remote queue state after an uncertain cancellation. Never automatically send a live test notification without the user's requested test/channel.
9. No tokens in source, bundles, Git, logs, backup exports or URLs. The HA token belongs in the bridge environment, never the browser. The browser may retain its own narrowly scoped bridge/ntfy token locally if configured by the user.
10. CelesTrak requests: current canonical domain, one catalogue ID, cache 2–4 hours, stop/back off after non-200. Do not bypass source limits by changing domains.
11. Keep rendering adaptive, on-demand where possible, bounded image caches and reduced-motion behavior. Do not add a second 3D engine for decorative trails.
12. If Sites is available, `.openai/hosting.json` is the authoritative project identity. Reuse its exact `project_id`; preserve private access. Never create a second Site. Otherwise work locally or use the user's hosting.

## Priorities for continuation

1. Browser QA of the compiled app at 390×844 and desktop; compare the approved concept directly with real screenshots and fix concrete differences.
2. Real camera/compass QA and complete sensor lifecycle (including denial, repeated activation and backgrounding).
3. Real ntfy/HA end-to-end test with the user's chosen endpoints, cancellation, partial failure, restart and page closed. There are no live credentials in this package.
4. Independent event/visibility validation across dates, latitudes, DST, horizon masks and shadow boundaries. Preserve the existing reference fixtures.
5. Playback refinement/preloading, source date-range refresh and missing-data handling. Test scientific legends and zoom/source changes.
6. Remaining product scope: true vector currents/winds, horizon masks, diary, other satellites, configurable regional imagery, further channels and stronger offline guarantees. Implement according to the source/method ledger.

Make routine implementation choices autonomously. Ask the user only for information or access that genuinely blocks the next useful step. Report in clear Italian; use short exact technical procedures when needed.
