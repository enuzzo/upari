# Third-party notices

Application code is original and MIT licensed. No application code or assets from the researched ISS-tracker reference repository were copied.

- CesiumJS / @cesium: Apache License 2.0. Keep the included package notices and runtime credits.
- React and React DOM: MIT.
- satellite.js: MIT.
- idb: ISC.
- lucide: ISC.
- Vite, TypeScript, Vitest and build dependencies: see their package licenses; they are reproducibly installed from `package-lock.json`.
- DM Sans and Space Grotesk: SIL Open Font License; license files are in `public/fonts`.
- NASA EOSDIS GIBS / Blue Marble / Black Marble: keep the source/product/date and scientific attribution. NASA imagery does not imply NASA endorsement.
- CelesTrak orbital data: retain source and epoch; follow the linked usage policy.
- Esri World Imagery: default photographic base with its own imagery contributors/terms, displayed by Cesium’s imagery credit system. NASA Blue Marble is a fallback when the photographic provider cannot initialize. Access conditions are separate from the original application’s MIT license.
- Open-Meteo: optional external weather data for the screensaver. Source/model attribution is displayed; see https://open-meteo.com/en/docs and https://open-meteo.com/en/terms for service and data conditions.

The selected design concept is a generated UI reference, not a scientific Earth asset and not a rendered screenshot of this implementation.

- OSCAR / Earth & Space Research, distributed by NOAA CoastWatch ERDDAP: historical 2014 surface velocity data, source/epoch/method retained. https://coastwatch.pfeg.noaa.gov/erddap/info/jplOscar/index.html . Dataset conditions and scientific limitations remain separate from the application's MIT license.
- ASCAT Metop-C marine wind, EUMETSAT/product contributors, distributed by NOAA OceanWatch: 2026-10-10 daily composite. https://coastwatch.pfeg.noaa.gov/erddap/info/erdQCwindproducts1day/index.html . Keep product attribution and date; no NOAA/EUMETSAT endorsement.
- SWISSIMAGE, ©swisstopo: official regional mosaic with differing acquisition years; credits displayed by Cesium. https://www.swisstopo.admin.ch/it/ortofoto-swissimage-10-cm . Coverage includes surrounding SPOT5 historical imagery as documented by the WMTS service.
- Optional scientific distributor tooling: xarray, numpy, scipy, h5netcdf/h5py retain their package licenses. They are not included in the PWA or mandatory Node dependencies.
