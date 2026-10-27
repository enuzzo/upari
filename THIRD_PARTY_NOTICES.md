# Third-party notices

Upari's own code is licensed under the Apache License 2.0 (see LICENSE and NOTICE). The libraries, fonts, imagery and datasets below keep their own licences and attribution requirements. Using them does not imply endorsement by their authors or by the agencies that produce them.

## Code

- **three.js** — Copyright © 2010-2024 three.js authors. MIT License (text below). https://github.com/mrdoob/three.js
- **satellite.js** — Copyright (C) 2013 Shashwat Kandadai, UCSC Jack Baskin School of Engineering. MIT License (text below). https://github.com/shashwatak/satellite-js
- Vite, TypeScript, Vitest and the other build tools are used only to build the site and keep their own package licences (see `package-lock.json`).

## Fonts

- **Instrument Serif** and **Inter Tight**, loaded from Google Fonts — SIL Open Font License 1.1. They are not redistributed in this repository.

## Imagery and data

Files in `public/` are derived from the sources below by the scripts in `scripts/`. The GitHub Actions workflow regenerates the daily layers every day; the committed copies are a validated fallback snapshot.

- **NASA Global Imagery Browse Services (GIBS)** — Blue Marble Next Generation, VIIRS Black Marble 2016, GHRSST, PACE and GPM layers. "We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)." https://www.earthdata.nasa.gov/gibs
- **NASA Visible Earth**, cloud composite (NASA Goddard Space Flight Center). https://visibleearth.nasa.gov/
- **GHRSST MUR** sea surface temperature and anomalies — NASA JPL, distributed through GIBS.
- **GHRSST GAMSSA** sea ice concentration — Australian Bureau of Meteorology, distributed through GIBS.
- **NASA PACE OCI** chlorophyll-a — NASA Ocean Biology Processing Group, distributed through GIBS.
- **NASA GPM IMERG** precipitation rate, 30-minute Early Run — distributed through GIBS.
- **NASA FIRMS**, VIIRS NOAA-20 active fires (375 m). "We acknowledge the use of data and/or imagery from NASA's Fire Information for Resource Management System (FIRMS), part of NASA's Earth Science Data and Information System (ESDIS)." https://firms.modaps.eosdis.nasa.gov/
- **NOAA GFS** 10 m winds, 0.5° — U.S. National Weather Service, distributed by PacIOOS ERDDAP. https://pae-paha.pacioos.hawaii.edu/erddap/griddap/ncep_global.html
- **OSCAR** surface currents, 26 September 2014 — Earth & Space Research / NASA, distributed by NOAA CoastWatch ERDDAP. https://coastwatch.pfeg.noaa.gov/erddap/info/jplOscar/index.html
- **Terrain Tiles** (Mapzen, hosted on AWS Open Data), used to derive the relief texture. Required attribution: ArcticDEM terrain data DEM(s) were created from DigitalGlobe, Inc., imagery and funded under National Science Foundation awards 1043681, 1559691, and 1542736; Australia terrain data © Commonwealth of Australia (Geoscience Australia) 2017; Austria terrain data © offene Daten Österreichs – Digitales Geländemodell (DGM) Österreich; Canada terrain data contains information licensed under the Open Government Licence – Canada; Europe terrain data produced using Copernicus data and information funded by the European Union - EU-DEM layers; Global ETOPO1 terrain data U.S. National Oceanic and Atmospheric Administration; Mexico terrain data source: INEGI, Continental relief, 2016; New Zealand terrain data Copyright 2011 Crown copyright (c) Land Information New Zealand and the New Zealand Government (All rights reserved); Norway terrain data © Kartverket; United Kingdom terrain data © Environment Agency copyright and/or database right 2015. All rights reserved; United States 3DEP (formerly NED) and global GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey. https://github.com/tilezen/joerd/blob/master/docs/attribution.md
- **EOxCloudless 2016** (Sentinel-2 cloudless) https://cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017) — CC BY 4.0, https://creativecommons.org/licenses/by/4.0/ . Tiles are loaded at runtime for close-ups, lit and blended by Upari's shaders, and credited on screen while visible; they are not redistributed.
- **International Space Station (ISS) (B)** 3D model, NASA / Michael D. Carbajal, from NASA 3D Resources https://science.nasa.gov/3d-resources/international-space-station-iss-b/ — "free and without copyright" (https://github.com/nasa/NASA-3D-Resources), used under the NASA media usage guidelines https://www.nasa.gov/nasa-brand-center/images-and-media . Shipped as `public/models/iss.glb`; Upari drops two stray fragments and assigns its own materials at runtime.
- **Draco** geometry decoder (`public/draco/`), Google, Apache License 2.0, https://github.com/google/draco — the copy distributed with three.js.
- **NASA VIIRS (Suomi NPP) NDVI, monthly** (`public/layers/ndvi-*`) and **NASA GMAO MERRA-2 aerosol optical thickness at 550 nm, monthly** (`public/layers/aerosol-*`), via NASA GIBS, re-encoded from the GIBS colormaps; NASA data, no copyright restrictions; credit NASA.
- **Monthly series** of the GHRSST MUR temperature and anomaly, PACE OCI chlorophyll and GAMSSA sea ice (`public/layers/<id>-*.jpg`, `-c.png`): the same sources as above, one frame per month for twelve months plus the latest day.
- **NOAA Coral Reef Watch** v3.1 Degree Heating Week, 5 km, via PacIOOS ERDDAP (`public/layers/coral-*`), recent months only (GHRSST era): "available for use without restriction" with credit to NOAA Coral Reef Watch, https://coralreefwatch.noaa.gov . The 1985–2002 OSTIA part of the record, which carries Met Office restrictions, is not used.
- **Tree cover loss 2001–2024**, Hansen, M. C. et al. 2013, "High-Resolution Global Maps of 21st-Century Forest Cover Change", Science 342: 850–853; University of Maryland / Global Forest Watch v1.12 (`public/layers/forest.png`, from the GFW tiles at zoom 3), CC BY 4.0.
- **USGS Earthquake Hazards Program** real-time feed, magnitude 2.5+ of the past 7 days (`public/layers/quakes.json`, refreshed daily), https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php — USGS-authored data are in the U.S. public domain; credit USGS.
- **World Bank, World Development Indicators** (`public/statistics/world.json`, `health.json`, `electricity.json`, `renewables.json`): population, birth and death rates, life expectancy, under-5 mortality (UN IGME), access to electricity (SDG 7.1.1), ILO modelled employment and unemployment; Eurostat renewable share. CC BY 4.0, https://datacatalog.worldbank.org/public-licenses#cc-by ; Eurostat reuse policy https://ec.europa.eu/eurostat/help/copyright-notice . Snapshots acquired 12–22 October 2026 (see the 0.7 atlas documentation); the natural balance is computed by Upari as birth rate minus death rate. Values are not interpolated; colours move between years.
- **UNHCR Refugee Data Portal, AsylumApplications** (`public/statistics/asylum.json`): new individual applications lodged with governmental authorities, origins Syria, Ukraine and Afghanistan, 2000–2025. CC BY 4.0, https://refugeedata.unhcr.org/en/terms-and-conditions-of-use/ . Arcs between capitals are schematic.
- **Natural Earth** 1:110m admin-0 countries (`public/statistics/countries.geojson`), public domain, https://www.naturalearthdata.com/about/terms-of-use/ . Contemporary generalised borders.
- **Population dust** (`public/statistics/dust.bin`): derived by Upari (`scripts/prepare-atlas.mjs`) from WDI population and the NASA Black Marble night lights already credited above.
- **Music and ambience** (`public/audio/`): five score pieces in four moods (Google Lyria 3 Pro; the released one transposed by two semitones, the grave one low-passed at playback) and fourteen ambience loops (ElevenLabs sound effects: wind, ocean current, waves, reef, rain, wildfire, earthquake rumble, sea ice, night, station, forest, desert, city, high sky), generated for Upari by Netmilk Studio with Magnific on a paid plan, then levelled and encoded. They are not covered by the Apache License of the code; any use outside Upari is subject to Magnific's terms.
- **Nominatim / OpenStreetMap** place search https://nominatim.org — data © OpenStreetMap contributors, ODbL 1.0, https://www.openstreetmap.org/copyright . Queried from the visitor's browser only when they press Enter, at most once per second, with results cached for the session, following https://operations.osmfoundation.org/policies/nominatim/ ; credited under the results.
- **CelesTrak** general perturbations elements for the ISS (NORAD 25544). The workflow refreshes `public/sky/iss.json` once a day; visitors contact CelesTrak only if that copy is more than two days old. https://celestrak.org/
- **Copernicus Climate Change Service (C3S) / ECMWF, Climate Pulse** (`public/climate/temperature.json`, `sst.json`): daily global 2 m air temperature since 1940 and 60° S–60° N sea surface temperature since 1979 from ERA5, refreshed daily; the last days are preliminary. "Generated using Copernicus Climate Change Service information"; CC BY 4.0. https://pulse.climate.copernicus.eu/
- **NOAA Global Monitoring Laboratory / Scripps Institution of Oceanography**, Mauna Loa CO₂ daily and monthly (`public/climate/co2.json`), U.S. government data; credit NOAA GML and Scripps. https://gml.noaa.gov/ccgg/trends/
- **NSIDC Sea Ice Index, version 4** (G02135), daily extent of both hemispheres (`public/climate/seaice.json`), Fetterer et al.; credit NSIDC. https://nsidc.org/data/g02135
- **NASA/NOAA OMPS total ozone, NASA VIIRS NOAA-20 NDSI snow cover** and **Sentinel-5P TROPOMI NO₂ and SO₂** via NASA GIBS (`public/layers/ozone-*`, `snow-*`, `no2-*`, `so2.*`), re-encoded from the GIBS colormaps. TROPOMI: contains modified Copernicus Sentinel-5P data (ESA), processed by NASA; Copernicus data are free and open under the Copernicus data policy.
- **NOAA NCEI IBTrACS** v04r01, ACTIVE list (`public/layers/cyclones.json`), Knapp et al. 2010; U.S. government data. https://www.ncei.noaa.gov/products/international-best-track-archive
- **Smithsonian Institution, Global Volcanism Program**, Volcanoes of the World, ongoing eruptions (`public/layers/volcanoes.json`), cite: Global Volcanism Program, Smithsonian Institution, https://volcano.si.edu ; shown for public, non-commercial information.
- **U.S. National Ice Center**, Antarctic iceberg positions (`public/layers/icebergs.json`), U.S. government data. https://usicecenter.gov
- **SkyTruth Cerulean** oil slick detections from Sentinel-1 (`public/layers/slicks.json`, last 30 days, machine confidence above 0.95), CC BY-SA 4.0, https://skytruth.org/terms-of-service/ . Upari's derived pictures of these slicks are shared under CC BY-SA 4.0 as well. SkyTruth does not determine intent or legality.
- **World Bank / IMF, Global Shipping Traffic Density** (`public/layers/ships.*`, AIS January 2015 – February 2021), CC BY 4.0, https://datacatalog.worldbank.org/search/dataset/0037580 — produced once by `scripts/prepare-ships.py`.
- **European Commission, Joint Research Centre — GHS-BUILT-S R2023A** (`public/layers/built-*`), built-up surface 1975–2030 at 1 km (2025 and 2030 projected), Pesaresi & Politis 2023, doi:10.2905/9F06F36F-4B11-47EC-ABB0-4F8B7B1D72EA; reuse authorised with acknowledgement (Commission Decision 2011/833/EU; CC BY 4.0). Produced once by `scripts/prepare-built.py`.
- **NOAA Space Weather Prediction Center**, OVATION aurora forecast and planetary Kp (`public/layers/aurora.*`, refreshed daily); when the aurora is shown, the visitor's browser also asks https://services.swpc.noaa.gov for the latest forecast, without cookies or referrer. U.S. government data.
- **NASA/SDO** (`public/sky/sun.jpg`): AIA 171 Å image refreshed daily, "Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams." https://sdo.gsfc.nasa.gov
- **CelesTrak** GP elements of the active satellites (`public/sky/satellites.*`, fetched by the workflow once a day, not committed). https://celestrak.org/
- **Launch Library 2, The Space Devs** (`public/sky/launches.json`), free API within its rate limits; credit The Space Devs. https://thespacedevs.com
- **NASA/JPL CNEOS** close-approach and fireball data (`public/sky/neo.json`, `fireballs.json`) and **NASA/JPL Horizons** ephemerides of Voyager 1 and 2 (`public/sky/voyager.json`). https://ssd.jpl.nasa.gov
- **Yale Bright Star Catalogue**, 5th revised edition (Hoffleit & Warren, 1991), via the JSON edition at https://github.com/brettonw/YaleBrightStarCatalog — Copyright (c) 2016 Bretton Wade, MIT License (text below).

## MIT License text

Applies to three.js, satellite.js and the YaleBrightStarCatalog JSON edition, with the copyright lines given above.

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
