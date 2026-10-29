# Upari

The planet Earth told through today's data. An interactive documentary for the desktop (it
also works on a phone held upright): four stories of short chapters, a written narration, and
a globe you can drag, bring as close as 10 m per pixel and question point by point.

## Stories

- **The planet, right now**: The planet · The thermometer (Climate Pulse, every day since
  1940) · Breath (GFS winds) · The storms (IBTrACS cyclones, with GDACS forecast tracks) ·
  Lightning (GOES GLM, the last half hour, over the LIS/OTD climatology) · Currents (OSCAR) ·
  The warmth of the sea (GHRSST MUR) · Marine heatwaves (Hobday method on NOAA OISST) ·
  Fever (sea temperature anomaly) · The sea in bloom (PACE) · Rain (GPM IMERG, 24 hours) ·
  Fire (FIRMS) · The Earth shakes (USGS, with GVP volcanoes) · Ice (GAMSSA, with icebergs) ·
  Lights (Black Marble) · Up there (the ISS in real time) · A day on Earth.
- **Nature**: Green breath (NDVI) · The breath of carbon (Mauna Loa, NOAA CarbonTracker) · Lost forests
  (Hansen/GFW) · The mangroves (Global Mangrove Watch) · How much nature is left
  (Biodiversity Intactness Index) · Snow (VIIRS) · Air (MERRA-2) · The air of cities
  (TROPOMI NO₂) · The shield (OMPS ozone) · The wounded sea (SkyTruth Cerulean) · Coral reefs
  (Coral Reef Watch).
- **People**: Eight billion · Cities grow (GHSL 1975–2030) · The dams (Global Dam Watch) ·
  The lanes (ships, World Bank/IMF) · births, life expectancy, children, natural balance and
  electricity (World Bank WDI) · The world lights up (night lights 1992–2024) · Where it
  burns (ODIAC fossil CO₂) · The footprint · Far from home · Fleeing and The routes of asylum
  (UNHCR) · The wars (UCDP).
- **The sky, right now**: The Sun (SDO) · The aurora (NOAA SWPC) · The satellites
  (CelesTrak) · Departures (Launch Library 2) · Shooting stars and Passing by (JPL CNEOS) ·
  One light day (Voyager, JPL Horizons).

Next to the stories: Explore (every layer on its own, with a note on how to read it), Your
place (search a place, read what is there, see when the Space Station passes overhead), a
card for each country, a postcard of the current view and a mode for classrooms.

Every chapter carries a label for the kind of data it shows (measured, model, forecast,
reanalysis, estimate, official statistics, inventory, computed, with projections). Sentences
with numbers are computed from the data when the page opens. Daily data are refreshed every
morning by the workflow (`scripts/prepare-*.mjs` and `prepare-lightning.py`); the heavier
datasets are prepared once by hand with the other `scripts/prepare-*.py` and committed.
Sources and licences are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); letters to the
providers whose data are not yet open are in [`docs/outreach`](docs/outreach/README.md).

## Languages

Twelve languages: Italian, English, Spanish, French, German, Portuguese, Russian, Chinese,
Japanese, Korean, Arabic and Hindi. On opening, Upari picks the browser's language (English
otherwise); the menu at the top right changes it on the fly and remembers it. `?lang=xx` in
the address forces a language.

The texts live in [`src/i18n`](src/i18n). Italian ([`it.ts`](src/i18n/it.ts)) is the
original and defines the shape of every dictionary, which TypeScript checks. Sentences with
data are functions that receive numbers and dates already formatted in the page's language.
Country names come from `Intl.DisplayNames`, with a few exceptions per language. For Chinese,
Japanese, Korean, Arabic, Hindi and Russian the Noto (or Cormorant) fonts are loaded from
Google Fonts only when needed, and Arabic reads right to left.

The text of "Why Upari", opened from the copyright line at the bottom right, is in
[`docs/ABOUT.md`](docs/ABOUT.md). Notes for coding agents are in [AGENTS.md](AGENTS.md).

## Version

The version is the one in `package.json` and appears at the bottom right next to the
Netmilk Studio copyright (the year is the current one). It goes up a patch for fixes (1.1.1)
and a minor for new features (1.2.0).

## Engine

three.js and custom shaders: single-scattering atmosphere (Rayleigh + Mie) on both the limb
and the surface, sunlight computed for the present instant, relief from a DEM in grazing
light, clouds 10 km up carried by the real winds (flow map) with their parallax and shadow,
a sea glint that moves with the wind, GPU particles for winds and currents, scientific
palettes resampled bicubically, HDR bloom and ACES tone mapping. Close up, EOX Sentinel-2
cloudless tiles are loaded. Resolution adapts by itself when the GPU struggles, and motion
is reduced when the system asks for it.

## Commands

```bash
npm install
npm run dev          # http://127.0.0.1:4181
npm run build        # dist/
```

Data (all regenerable, ImageMagick required):

```bash
node scripts/prepare-earth.mjs    # day, night, cloud and relief textures
node scripts/prepare-fields.mjs   # GFS winds and OSCAR currents
node scripts/prepare-layers.mjs   # sea, anomalies, ice, chlorophyll, rain, fires and more
node scripts/prepare-sky.mjs      # Sun, aurora, launches, fireballs, asteroids, Voyager
node scripts/prepare-climate.mjs  # temperature, CO₂, sea ice
node scripts/prepare-stars.mjs    # Yale Bright Star Catalogue
node tools/shots.mjs http://127.0.0.1:4181/ shots   # QA screenshots in headless Chrome
```

The Python scripts (`scripts/*.py`) need a virtual environment outside Dropbox; each one
says at the top what it needs and how to run it.

Keyboard: space pause, arrows chapters, Shift + arrows turn the planet, Enter reads the
centre of the view, I details, L Explore, P postcard, F full screen, + and − zoom, / search a
place (OpenStreetMap Nominatim, one request only when you press Enter), M sound (music and
ambience, active after the first click), Esc closes panels.

## Daily refresh

The workflow [`pages.yml`](.github/workflows/pages.yml) runs every day at 10:41 UTC (after
NASA publishes the previous day's data), on every push to `main` and on demand. It downloads
winds, sea, anomalies, ice, phytoplankton, 24 hours of rain, fires, earthquakes, cyclones,
lightning, snow and ice, marine heatwaves, the sky and the orbit of the ISS, rebuilds the
site and publishes it to https://upari.earth (SiteGround, over FTPS, with
[`scripts/deploy-siteground.sh`](scripts/deploy-siteground.sh): it sends only the files that
changed, `index.html` last). Credentials live in the repository secrets (`DEPLOY_HOST`,
`DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_PASSWORD`, `DEPLOY_PATH`) and, locally, in `.env`,
which git ignores. Cache rules and the redirects to https without www are in
[`public/.htaccess`](public/.htaccess). GitHub Pages publishes only a redirect from the old
address enuzzo.github.io/upari to upari.earth.

Fresh data are not committed: the repository keeps a verified snapshot, which the site uses
whenever a source is late, incomplete or unreachable (the workflow summary reports it). A new
layer is accepted only if its coverage is at least 80% of the snapshot's (ice, which changes
with the seasons, 50% and with ice at both poles; rain with at least 20 frames out of 24;
fires with at least 30% of the cells; wind with 95% of the grid). Currents, relief, textures
and stars are static.

GitHub suspends scheduled workflows after 60 days without activity on the repository: to
avoid that, on the first day of every month the workflow commits the updated orbital
elements of the ISS. If it is suspended anyway, it can be re-enabled from the Actions tab.

The previous version (0.7.x, Cesium and React) remains in the git history.
