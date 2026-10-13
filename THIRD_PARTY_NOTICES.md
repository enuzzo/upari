# Third-party notices

Application code in the current distribution is original and Apache-2.0 licensed; see LICENSE and NOTICE. Historical revisions already licensed under MIT retain that license. No application code or assets from the researched ISS-tracker reference repository were copied.

- CesiumJS / @cesium: Apache License 2.0. Keep the included package notices and runtime credits.
- React and React DOM: MIT.
- satellite.js: MIT.
- idb: ISC.
- lucide: ISC.
- Vite, TypeScript, Vitest and build dependencies: see their package licenses; they are reproducibly installed from `package-lock.json`.
- DM Sans and Space Grotesk: SIL Open Font License; license files are in `public/fonts`.
- NASA EOSDIS GIBS / Blue Marble / Black Marble: keep the source/product/date and scientific attribution. NASA imagery does not imply NASA endorsement.
- CelesTrak orbital data: retain source and epoch; follow the linked usage policy.
- Sentinel-2 cloudless2016, EOX IT Services GmbH: CC BY4.0; Contains modified Copernicus Sentinel data2016 &2017. https://cloudless.eox.at/pricing . Attribution displayed by Cesium. Only2016 is used, not later NC releases. Esri World Imagery was removed in0.5.0. NASA Blue Marble remains the orbital base.
- Open-Meteo: optional external weather data for the screensaver. Source/model attribution is displayed; see https://open-meteo.com/en/docs and https://open-meteo.com/en/terms for service and data conditions.

The selected design concept is a generated UI reference, not a scientific Earth asset and not a rendered screenshot of this implementation.

- OSCAR / Earth & Space Research, distributed by NOAA CoastWatch ERDDAP: historical 2014 surface velocity data, source/epoch/method retained. https://coastwatch.pfeg.noaa.gov/erddap/info/jplOscar/index.html . Dataset conditions and scientific limitations remain separate from the application's Apache-2.0 license.
- ASCAT Metop-C marine wind, EUMETSAT/product contributors, distributed by NOAA OceanWatch: 2026-10-10 daily composite. https://coastwatch.pfeg.noaa.gov/erddap/info/erdQCwindproducts1day/index.html . Keep product attribution and date; no NOAA/EUMETSAT endorsement.
- SWISSIMAGE, ©swisstopo: official regional mosaic with differing acquisition years; credits displayed by Cesium. https://www.swisstopo.admin.ch/it/ortofoto-swissimage-10-cm . Coverage includes surrounding SPOT5 historical imagery as documented by the WMTS service.
- Optional scientific distributor tooling: xarray, numpy, scipy, h5netcdf/h5py retain their package licenses. They are not included in the PWA or mandatory Node dependencies.

- World Bank World Development Indicators: six individually verified CC BY4.0 indicators; original UN/ILO/national statistical/Eurostat provenance retained. Natural balance is derived by Upari. https://datacatalog.worldbank.org/public-licenses#cc-by and https://data.worldbank.org/summary-terms-of-use .
- UNHCR Refugee Population Statistics Database, AsylumApplications: CC BY4.0; Upari subset/annual sums/schematic relations described in docs/STATISTICAL_ATLAS.md. https://refugeedata.unhcr.org/en/terms-and-conditions-of-use/ .
- Natural Earth1:110m countries: public domain. https://www.naturalearthdata.com/about/terms-of-use/ . Contemporary generalized boundaries, not historical reconstructions or political endorsement.

- Eurostat nrg_ind_ren A/REN/PC, EU27 2004–2024: statistical reuse policy with attribution, not the CC BY license of editorial text. Selection/translation by Upari; Eurostat is not responsible for this reuse. Method break RED I/RED II in 2021; see docs/STATISTICAL_ATLAS.md and https://ec.europa.eu/eurostat/help/copyright-notice .
