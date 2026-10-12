# Design lock

## Revision0.6 — Documentary journeys

Solo Terra Naturale, nero/turchese, qualità Alta invariata. Percorsi a capitoli su fotografia NASA/EOX, contorno del paese e richiamo geografico, letture/curve annuali originali. Voli Cesium cancellabili e anni armonizzati; nessun secondo motore o timer. Atlante completo/palette intatti uscendo dalla regia. Desktop editoriale, portrait compatto, comandi fuori dalla porzione scorrevole; reduced-motion manuale. I dettagli di ricerca, scelte e limiti sono in `DOCUMENTARY.md`. Le revisioni0.4 che parlano di stili sono storiche e superate dalle decisioni0.5.


## Revision 0.4 — Earth quality and optional styles

The user requested richer orbital Earth and optional visual shaders, while keeping Natural as the default. Original single-pass effects retain the existing Cesium renderer, black/turquoise navigation and planet-first hierarchy. NASA orbital base blends into Esri detail, solar shading remains tied to the current clock (explicitly labelled when previewing a time offset), and city lights come from the real 2016 mosaic. A subtle procedural starfield is decorative. Scientific Natural palettes are protected even while an older frame remains visible. Styles only affect the globe canvas; interface stays sharp. Voxel is explicitly a 2D isometric rendering effect. See `EARTH_STYLES.md` and the current `VERIFICATION.md`; old pending screenshot statements below are historical.


## Revision 0.2 — latest user instructions

The 11 October 2026 feedback supersedes the concept's permanent pass/AR strip and fixed desktop rail. Preserve the black/turquoise system and prominent planet; Earth now fills the viewport between minimal header/navigation. ISS is opt-in, initially off. Layer controls are an on-demand side panel on desktop and bottom sheet on mobile. A compact view selector and Screensaver action sit over the globe. No permanent AR CTA on Earth.

Screensaver is a second static entry with the chosen camera/layer/date/comparison, slow rotation, real-time clock and optional model weather. Its controls auto-hide. These are requested intentional changes, not fidelity drift. Read `UIUX_PASS_02.md`; the older concept inventory below is retained as design history. Browser screenshots of0.2/0.3are recorded inVERIFICATION.md; realdeviceacceptance remains separate.

The selected concept is `concept-upari-notte.png`, native 853×1844. Its viewport equivalent is approximately 390×844. The later user instruction is explicitly **black and turquoise, like the first prototypes**. The warm-white and violet/apricot concepts are not the selected direction.

## System

- Background: `#060b13`; surfaces: `#0c131e`; text: `#f2f6fa`; secondary: `#9ba9bd`; hairlines: `#263442`.
- Turquoise: `#69f6dc`; text on turquoise: `#052423`. Light atlas and dark red are optional themes, not the default redesign.
- Space Grotesk for wordmark/headings; DM Sans for UI. Files are local; OFL licenses included. Device/system fallback is supported.
- Outline icons, lucide, approximately 1.7–2 px strokes. Orbit mark is original SVG.
- Single globe canvas, thin dividers, rounded primary CTA, restrained floating layer selector. No marketing page, dashboard card grid, sign-up or false metrics.
- Mobile: wordmark and place; globe; one layer control; next-pass strip; `Apri cielo AR`; `Tutti i passaggi`; three bottom destinations `Terra`, `Cielo`, `Avvisi`.
- Desktop extends the same system to a left information/control rail and a large geographic canvas. There was no accepted desktop screenshot; this is a documented responsive extension.

## Allowed primary copy and dynamic substitutions

`upari`, chosen place, `Terra di notte`, `NASA · composito 2016`, `Il prossimo passaggio`, `ISS alle [computed local time]`, `Da [computed direction] · [computed duration]`, `Apri cielo AR`, `Tutti i passaggi`, `Terra`, `Cielo`, `Avvisi`.

Demo times and `Anteprima · dati demo` from the concept are deliberately replaced by computed states, real date labels, loading/error/empty states. The AR preview is still explicitly marked `Anteprima` because its time can be future. A source-controlled loading or empty state is preferable to an illustrative pass presented as real.

## Fidelity ledger — current limits

| Point | Concept evidence | Implementation | Verification / next action |
|---|---|---|---|
| Palette | Near-black, turquoise CTA | Locked CSS tokens, default night | Tokens reviewed; rendered comparison pending |
| Planet | Large day/night Earth | Real Cesium ellipsoid, NASA images and actual sunlight | Coordinate substrate reviewed; browser screenshot pending |
| Header | Upari, place, settings | Original wordmark, place selector, settings | Source reviewed; native-size screenshot pending |
| Navigation | Terra / Cielo / Avvisi | Same mobile labels/order; desktop header equivalent | Interaction source checked; live click-through pending |
| CTA | Apri cielo AR | Same CTA; enabled only for a computed visible pass | Projection unit tests passed; real camera QA pending |
| Scientific information | Historical NASA credit | Per-product dates, units, real legends, missing-data note | Metadata/URLs checked; displayed legends need visual QA |
| Layout | 390×844 equivalent | Responsive CSS at 760 and 359 px | No fabricated screenshot; viewport check pending |
| Copy | Demo ISS time | Dynamic real computation and honest empty state | Intentional data substitution, not a visual drift claim |

The approved concept was inspected with `view_image`. **No rendered implementation screenshot was available in this environment.** Browser control for the managed Sites preview was not exposed; the installed Sites workflow required skipping browser QA instead of installing or improvising another browser. Do not call the implementation visually verified or “10/10” yet.
