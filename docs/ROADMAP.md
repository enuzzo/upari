# Upari: where to go

Upari today is a story of eleven chapters about the planet at this moment. It can become a
small living atlas of the Earth: more stories, a complete free exploration, the data of
humanity next to the physical ones. The same eye everywhere: few words, real light, no
invented data, every image with its source.

The phases are in working order. Each one is published on its own, after checks with
screenshots, build and frame time.

## 1. Up there, the journey

The chapter becomes a sequence in three movements.

1. **From afar.** The whole Earth with the real terminator; the complete orbit drawn as a
   thread of light, the station as a running dot, in real time.
2. **The journey.** The camera follows the station along its orbit, still high: you can see
   where it is going (day, night, the next sunrise).
3. **Close up.** The camera comes down to a few hundred metres and stops: the NASA model of
   the ISS, in its real attitude, with the Earth below.
   - Discreet telemetry: altitude, speed, which country or sea it is over, whether it is day
     or night on board, minutes to the next sunrise or sunset, the orbit of the day.
   - Caption: "This is what the crew sees from the window right now".
   - At night the station is lit by the real Moon and the glow of the cities.
4. **In exploration too.** A "Reach the Station" item in the panel, and the model always
   appears when you get close.

## 2. People: the atlas, redone

The data of the previous version come back, with the new graphics. They stay verified
snapshots (World Bank WDI CC BY 4.0, UN IGME, UNHCR CC BY 4.0, Natural Earth public domain).

- **Indicators:** population, birth rate, death rate, natural balance, life expectancy,
  under-5 mortality, access to electricity, employment and unemployment (with their
  warning: modelled estimates, no rankings), share of renewables in the EU.
- **Rendering:** countries become light on the surface, not a flat mosaic: a country
  identity map on the GPU, the values per year in a texture, colours flowing from one year to
  the next (colours are interpolated, never the measurements). Borders as thin, glowing
  threads, the country under the cursor lighting up.
- **Population as dust of light:** one dot for every million people, scattered inside each
  country; over the years the dust thickens.
- **Migration:** asylum applications from Syria, Ukraine and Afghanistan as particle trails
  from the origin to the country where they were filed, thickness proportional to the
  numbers. Schematic trails, not itineraries: we say so.
- **Time:** a 1960–2025 year slider with play; gaps stay gaps.
- **Reading:** on hover, name, value and year; on click, a country card with the curve
  since 1960.

## 3. More stories

The current story becomes the first of a series. On opening, you choose which one to see.

- **The planet, right now.** Today's eleven chapters.
- **People.** Eight billion; Fewer births; Longer lives; The children; Electric light;
  Fleeing; Work; The balance.
- **Your place.** After a search: the place right now, with solar time, sunrise and sunset,
  wind, rain and sea around it, and the next visible pass of the ISS computed locally with
  SGP4.
- **A day on Earth.** Twenty-four hours in a minute: terminator, clouds, city lights coming
  on, the station going round sixteen times.
- **The Earth shakes** (new data, below). Earthquakes of the last seven days.

## 4. Complete free exploration

- **Layer panel.** The sky (clouds, night, atmosphere, stars); The air (wind); The sea
  (currents, temperature, anomaly, plankton, ice); Water (rain); Fire; Lights; The Station;
  People (every indicator).
- **Controls:** real or studio light, automatic rotation, time (forwards and backwards over
  24 hours, the Sun moves), year for the statistical data, rain frame.
- **Shareable links:** position, layer and year in the address.
- **Postcard:** save the view as an image with title, date and sources.

## 5. New data, all open

- Earthquakes of the last 7 days (USGS, public domain).
- Active tropical cyclones (NOAA NHC / JTWC).
- Smoke and dust: aerosol optical depth (NASA GIBS).
- Snow and vegetation (NASA GIBS, MODIS).
- Long series: CO₂ at Mauna Loa, Arctic ice, global temperature anomaly.

## 6. Platform

- Tablet and phone: touch, compact panels, adaptive quality.
- Accessibility: reduced motion, full keyboard, alternative texts.
- English next to Italian.
- Domain upari.netmilk.dev on GitHub Pages (needs the DNS record).
- Automated tests of the data transformations.

## Status

Done and published on 26 October 2026:

- **Up there, the journey**: the whole Earth with the orbit as a thread of light, the chase,
  the descent to the ISS, live telemetry, the caption "This is what the crew sees right now".
- **People**: the atlas engine (countries as light, population dust, asylum trails) and a
  story of seven chapters.
- **Choice of story** on opening and in the top bar; at the end of a story, "Continue".
- **Explore**: every layer, year, time, real light, clouds, rotation, "Reach the Station",
  shareable links.
- **The Earth shakes**: USGS earthquakes of the last seven days, refreshed every morning, a
  new chapter of the first story and a layer in Explore.

Done and published on 26 October 2026, evening:

- **Nature**, the third story: green breath (monthly NDVI), lost forests (2001–2024, year by
  year), air (monthly MERRA-2 aerosols), coral reefs (Coral Reef Watch). Layers in Explore
  too.
- **Animated layers**: sea temperature, anomaly, plankton and ice are series of twelve
  months up to today, with the month's clock.
- **Audio**: four characters of the same music (calm, grave, curious, open) crossfading; an
  ambience for each chapter; quieter effects.
- **Graphics**: clouds with relief, sharp city lights, a bluer ocean, a crisper sun glint;
  a line on the night side fixed.

Done on 27 October 2026 (report "Nuove fonti e proposte per Upari"):

- **The sky, right now**, the fourth story: this morning's Sun (SDO), the aurora of the next
  half hour with Kp (NOAA SWPC, requested live), every active satellite moved on the GPU
  (CelesTrak), the next launches, fireballs since 1988, the asteroids of the next 60 days,
  the Voyagers at one light day (JPL).
- **The planet**: "The thermometer" (every day since 1940, Climate Pulse), "The storms"
  (IBTrACS cyclones with their tracks), erupting volcanoes inside "The Earth shakes",
  icebergs inside "Ice".
- **Nature**: "The breath of carbon" (Keeling curve), "Snow", "The air of cities" (NO₂),
  "The shield" (ozone), "The wounded sea" (SkyTruth oil slicks, CC BY-SA).
- **People**: "Cities grow" (GHSL 1975–2030), "The lanes" (ships 2015–2021).
- **Explore**: all the new layers, the "Sky" group, a note on how to read each layer with
  its source. **Happening now** on the title, with high thresholds. The date of the frame
  sits above the planet.

Done on 27 October 2026, evening: "The sky, right now" revised after the user's notes:

- **The Sun** as a 3D body, at the right size against the Earth (not the right distance):
  from afar with the Earth as a measure, then close up; the face towards us is the morning's
  SDO HMI image.
- **The aurora** as curtains of light above the oval forecast by NOAA OVATION: oxygen green
  below, red above, the pink hem of nitrogen; from above and then from the side.
- **Departures**: yesterday's launches climbing from their pads, labelled with their
  destination, then the last year of launches (335) pad by pad.
- **Passing by**: the asteroid's real path around the Earth and the Moon's orbit (JPL
  Horizons), labelled; no more background satellites.
- **One light day**: Voyager 1 marked among the stars in its real direction; the sunlight
  now sets behind the Earth as a disc (before, clipped by depth, it looked square).

## Plan from the report, with its status

Licences: by the user's decision (27 October) Upari is a free project; non-commercial and
share-alike licences are used with the required credits, paid data are not, and nothing
that needs an account or a key the user has not given.

### Now
- [x] A "how to read" note and the source for every layer in Explore (from the chapter text).
- [x] Data-kind labels (measured, model, forecast, reanalysis, estimate, official
  statistics, inventory, computed, with projections): next to the title of every chapter
  and in the Explore note.
- [x] The planet today: temperature (Climate Pulse), CO₂ (NOAA GML), NSIDC v4 sea ice
  (downloaded every day into `public/climate/seaice.json`).
- [x] OMPS ozone. [x] TROPOMI NO₂. [x] TROPOMI SO₂ (in Explore, with the volcanoes).
  [ ] OMPS Aerosol Index (MERRA-2 is already there).
- [x] Monthly VIIRS NDSI snow. [x] Cloud-free IMS (northern hemisphere only): layer "Snow
  and ice, yesterday".
- [x] IBTrACS ACTIVE cyclones. [x] Forecast tracks in every basin (GDACS, CC BY 4.0 stated on
  every resource).
- [x] Shipping lanes (World Bank/IMF). [x] Aurora and Kp.

### Next
- [x] The sky, right now. [x] Launches. [x] Icebergs. [x] Cities 1975–2030. [x] Happening now.
- [x] Sea level (CoastWatch ERDDAP, 12 months). [x] Waves (WaveWatch III via PacIOOS, last
  24 hours). [ ] Floods, freeze and thaw (MODIS Flood, SMAP): unreadable at global scale,
  they need close views.
- [x] NSIDC v4 ice inside "Ice" (today against the 1981–2010 mean of the same day).
- [x] Your place, first part: a searched place shows solar time, sunrise and sunset, wind
  and sea around it. [ ] The year-of-birth part.
- [x] `?kiosk` mode (the four stories in a loop, cursor hidden) and `?embed` (a quiet frame
  with the link to the site).
- [ ] The sea turning acidic (OceanSODA-ETHZ on NCEI: public access with a citation, but no
  explicit licence; it needs a written yes from the authors, letter in
  `docs/outreach/oceansoda.md`). WRI dead zones: the dataset is no longer online.
- [x] Biodiversity intactness (Impact Observatory and Vizzuality via Planetary Computer,
  CC BY 4.0, 2017 and 2020 at 0.05°): chapter "How much nature is left". [x] Mangroves
  1996–2020 (Global Mangrove Watch v3.0, CC BY 4.0 checked on Zenodo): chapter "The
  mangroves".
- [x] Born abroad (UN DESA via WDI, every five years, the data show their year).
  [x] Refugees by country of origin (UNHCR, per thousand inhabitants): chapter "Far from
  home". [x] Asylum flows from every origin (UNHCR, the thirty largest routes of each year,
  coloured by region of departure): chapter "The routes of asylum" and a layer in Explore.
- [x] CO₂ per person 1970–2024 (EDGAR via WDI, not IEA-EDGAR): chapter "The footprint".
  [x] Dams over time (Global Dam Watch v1.0, CC BY 4.0): chapter "The dams", lit in the
  order of their construction year, and a layer in Explore.
- [x] Before/after slider in Explore (atlas and series). [x] Year of birth in "The
  thermometer".
- [x] "For the classroom" page (from "Why Upari").
- [ ] A fallback for the orbital elements: SatNOGS relays Space-Track data, whose
  redistribution is unclear; for now the last good file of the day stays.

### To evaluate
- [x] SkyTruth Cerulean oil slicks (CC BY-SA, credits and a note on the derived images).
- [x] Smithsonian GVP volcanoes ("non commercial" terms, accepted for a free project).
- [ ] MCD64A1 burned area: needs a free Earthdata account as a workflow secret.
- [ ] Fishing and dark vessels (Global Fishing Watch): needs a personal token.
- [ ] WDPA protected areas: no downloads, written permission for commercial uses (letter in
  `docs/outreach/wdpa.md`).
- [ ] GBIF / OBIS (mixed licences, sampling bias). [ ] Climate TRACE (beta API).
- [ ] Ember, Global Energy Monitor: key or form. [ ] CAMS, Copernicus Marine: account.
- [ ] HYDE 3.5 (licence to be confirmed, letter in `docs/outreach/hyde.md`).
  [x] Night lights 1992–2024 (Li, Zhou et al., CC BY 4.0): chapter "The world lights up".
- [x] UCDP GED 26.1 conflicts (CC BY 4.0): chapter "The wars", 2025 deaths per cell and a
  1989–2025 chart.
- [ ] Plastic as a slow story (only models or samples, licences to be checked).
- [x] Lightning: chapter "Lightning", the last half hour of the two GOES (GLM) over the
  twenty-year LIS/OTD map.
- [x] Marine heatwaves (Hobday on OISST, the 1991–2020 climate computed once and saved):
  chapter "Marine heatwaves". [x] ODIAC 2024 fossil CO₂ (CC BY 4.0, summed to 0.05° once):
  chapter "Where it burns".
- [ ] Multi-scattering in the atmosphere: postponed (high cost, small visual gain).
- [ ] Letters to providers (OceanSODA, WDPA, OpenSky, Blitzortung, HYDE, TeleGeography):
  drafts in `docs/outreach/`, to be signed and sent.

### Excluded
ACLED, Ookla, WHO GHO, NHM BII (NC-SA, replaced by the CC BY one), SOS data taken directly
from the catalogue. OpenSky, Blitzortung and TeleGeography stay out unless their letters
get a yes.

### Still on the roadmap
1. [x] **Your place**: the next visible pass of the Station, computed on the device with
   SGP4. [ ] The year-of-birth part.
2. [x] **Country card**: a click on a country, when people are shown, opens its curve since
   1960 for the indicator in view and the other numbers, each with the year of the
   measurement.
3. [x] **A day on Earth**: the last chapter of "The planet, right now", the next twenty-four
   hours in a minute with the real Sun, the lights and the Station.
4. [x] **Postcard**: the view saved as an image with title, date and sources (icon next to
   the caption, item in Explore, P key).
5. **Graphics**: [x] clouds 10 km up with parallax and offset shadows; [x] a sea glint that
   runs with the wind; [ ] multi-scattering.
6. **Platform**: [x] phone held upright (planet above, words below, date and legend on one
   line, the Sun above the Earth); [x] accessibility: reduced motion, Shift + arrows turn the
   planet, Enter reads the centre for screen readers.
