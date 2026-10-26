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
- **World Bank, World Development Indicators** (`public/statistics/world.json`, `health.json`, `electricity.json`, `renewables.json`): population, birth and death rates, life expectancy, under-5 mortality (UN IGME), access to electricity (SDG 7.1.1), ILO modelled employment and unemployment; Eurostat renewable share. CC BY 4.0, https://datacatalog.worldbank.org/public-licenses#cc-by ; Eurostat reuse policy https://ec.europa.eu/eurostat/help/copyright-notice . Snapshots acquired 12–22 October 2026 (see the 0.7 atlas documentation); the natural balance is computed by Upari as birth rate minus death rate. Values are not interpolated; colours move between years.
- **UNHCR Refugee Data Portal, AsylumApplications** (`public/statistics/asylum.json`): new individual applications lodged with governmental authorities, origins Syria, Ukraine and Afghanistan, 2000–2025. CC BY 4.0, https://refugeedata.unhcr.org/en/terms-and-conditions-of-use/ . Arcs between capitals are schematic.
- **Natural Earth** 1:110m admin-0 countries (`public/statistics/countries.geojson`), public domain, https://www.naturalearthdata.com/about/terms-of-use/ . Contemporary generalised borders.
- **Population dust** (`public/statistics/dust.bin`): derived by Upari (`scripts/prepare-atlas.mjs`) from WDI population and the NASA Black Marble night lights already credited above.
- **Music and ambience** (`public/audio/`): two score pieces (Google Lyria 3 Pro) and four ambience loops (ElevenLabs sound effects: wind, ocean current, rain, wildfire), generated for Upari by Netmilk Studio with Magnific on a paid plan, then levelled and encoded. They are not covered by the Apache License of the code; any use outside Upari is subject to Magnific's terms.
- **Nominatim / OpenStreetMap** place search https://nominatim.org — data © OpenStreetMap contributors, ODbL 1.0, https://www.openstreetmap.org/copyright . Queried from the visitor's browser only when they press Enter, at most once per second, with results cached for the session, following https://operations.osmfoundation.org/policies/nominatim/ ; credited under the results.
- **CelesTrak** general perturbations elements for the ISS (NORAD 25544). The workflow refreshes `public/sky/iss.json` once a day; visitors contact CelesTrak only if that copy is more than two days old. https://celestrak.org/
- **Yale Bright Star Catalogue**, 5th revised edition (Hoffleit & Warren, 1991), via the JSON edition at https://github.com/brettonw/YaleBrightStarCatalog — Copyright (c) 2016 Bretton Wade, MIT License (text below).

## MIT License text

Applies to three.js, satellite.js and the YaleBrightStarCatalog JSON edition, with the copyright lines given above.

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
