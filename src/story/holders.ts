import { t } from '../i18n';

// Who holds the rights to each dataset Upari shows, and where to find them. Every chapter and
// every layer of Esplora names its holders in a credit line that is always visible, each one a
// link that opens the holder's own page in a new tab. The full notices are in
// THIRD_PARTY_NOTICES.md and in the credits panel.

interface Holder { name: string; url: string; licence?: 'CC BY 4.0' | 'CC BY-SA 4.0' }

export const HOLDERS = {
  blueMarble: { name: 'NASA Blue Marble', url: 'https://visibleearth.nasa.gov/collection/1484/blue-marble' },
  blackMarble: { name: 'NASA Black Marble', url: 'https://blackmarble.gsfc.nasa.gov' },
  gibs: { name: 'NASA GIBS', url: 'https://www.earthdata.nasa.gov/gibs' },
  terrain: { name: 'Mapzen Terrain Tiles', url: 'https://registry.opendata.aws/terrain-tiles/' },
  gfs: { name: 'NOAA GFS', url: 'https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast' },
  pacioos: { name: 'PacIOOS', url: 'https://pae-paha.pacioos.hawaii.edu/erddap/' },
  c3s: { name: 'Copernicus C3S / ECMWF', url: 'https://pulse.climate.copernicus.eu/', licence: 'CC BY 4.0' },
  ibtracs: { name: 'NOAA NCEI IBTrACS', url: 'https://www.ncei.noaa.gov/products/international-best-track-archive' },
  gdacs: { name: 'GDACS (EC JRC, UN OCHA)', url: 'https://www.gdacs.org', licence: 'CC BY 4.0' },
  glm: { name: 'NOAA GOES-R GLM', url: 'https://www.goes-r.gov/spacesegment/glm.html' },
  lisotd: { name: 'NASA GHRC LIS/OTD', url: 'https://ghrc.nsstc.nasa.gov/lightning/' },
  oscar: { name: 'OSCAR, ESR / NASA', url: 'https://coastwatch.pfeg.noaa.gov/erddap/info/jplOscar/index.html' },
  mur: { name: 'GHRSST MUR, NASA JPL', url: 'https://podaac.jpl.nasa.gov/MEaSUREs-MUR' },
  oisst: { name: 'NOAA OISST', url: 'https://www.ncei.noaa.gov/products/optimum-interpolation-sst' },
  pace: { name: 'NASA PACE', url: 'https://pace.oceansciences.org' },
  imerg: { name: 'NASA GPM IMERG', url: 'https://gpm.nasa.gov/data/imerg' },
  firms: { name: 'NASA FIRMS', url: 'https://firms.modaps.eosdis.nasa.gov/' },
  usgs: { name: 'USGS', url: 'https://earthquake.usgs.gov' },
  gvp: { name: 'Smithsonian GVP', url: 'https://volcano.si.edu' },
  gamssa: { name: 'GHRSST GAMSSA, Bureau of Meteorology', url: 'https://www.ghrsst.org' },
  nsidc: { name: 'NSIDC', url: 'https://nsidc.org/data/g02135' },
  usnic: { name: 'U.S. National Ice Center', url: 'https://usicecenter.gov' },
  ims: { name: 'NOAA/NESDIS IMS, NSIDC', url: 'https://nsidc.org/data/g02156' },
  celestrak: { name: 'CelesTrak', url: 'https://celestrak.org' },
  nasa3d: { name: 'NASA 3D Resources', url: 'https://science.nasa.gov/3d-resources/' },
  gml: { name: 'NOAA GML, Scripps', url: 'https://gml.noaa.gov/ccgg/trends/' },
  carbontracker: { name: 'NOAA CarbonTracker CT2026', url: 'https://gml.noaa.gov/ccgg/carbontracker/' },
  hansen: { name: 'Hansen et al., UMD / Global Forest Watch', url: 'https://www.globalforestwatch.org', licence: 'CC BY 4.0' },
  gmw: { name: 'Global Mangrove Watch', url: 'https://www.globalmangrovewatch.org', licence: 'CC BY 4.0' },
  bii: { name: 'Impact Observatory, Vizzuality', url: 'https://planetarycomputer.microsoft.com/dataset/io-biodiversity', licence: 'CC BY 4.0' },
  merra: { name: 'NASA GMAO MERRA-2', url: 'https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/' },
  s5p: { name: 'Copernicus Sentinel-5P (ESA)', url: 'https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-5p' },
  omps: { name: 'NASA/NOAA OMPS', url: 'https://ozonewatch.gsfc.nasa.gov' },
  cerulean: { name: 'SkyTruth Cerulean', url: 'https://cerulean.skytruth.org', licence: 'CC BY-SA 4.0' },
  crw: { name: 'NOAA Coral Reef Watch', url: 'https://coralreefwatch.noaa.gov' },
  coastwatch: { name: 'NOAA CoastWatch', url: 'https://coastwatch.noaa.gov' },
  ww3: { name: 'NOAA WaveWatch III', url: 'https://polar.ncep.noaa.gov/waves/' },
  oceansoda: { name: 'OceanSODA-ETHZ, ETH Zürich', url: 'https://doi.org/10.25921/m5wx-ja34' },
  wdi: { name: 'World Bank WDI', url: 'https://databank.worldbank.org/source/world-development-indicators', licence: 'CC BY 4.0' },
  naturalEarth: { name: 'Natural Earth', url: 'https://www.naturalearthdata.com' },
  ghsl: { name: 'European Commission JRC, GHSL', url: 'https://human-settlement.emergency.copernicus.eu', licence: 'CC BY 4.0' },
  gdw: { name: 'Global Dam Watch', url: 'https://www.globaldamwatch.org', licence: 'CC BY 4.0' },
  ships: { name: 'World Bank / IMF', url: 'https://datacatalog.worldbank.org/search/dataset/0037580', licence: 'CC BY 4.0' },
  nightlights: { name: 'Li, Zhou et al.', url: 'https://doi.org/10.6084/m9.figshare.9828827', licence: 'CC BY 4.0' },
  odiac: { name: 'ODIAC, CGER/NIES', url: 'https://db.cger.nies.go.jp/dataset/ODIAC/', licence: 'CC BY 4.0' },
  unhcr: { name: 'UNHCR', url: 'https://www.unhcr.org/refugee-statistics/', licence: 'CC BY 4.0' },
  ucdp: { name: 'Uppsala Conflict Data Program', url: 'https://ucdp.uu.se', licence: 'CC BY 4.0' },
  sdo: { name: 'NASA/SDO', url: 'https://sdo.gsfc.nasa.gov' },
  swpc: { name: 'NOAA SWPC', url: 'https://www.swpc.noaa.gov' },
  spacedevs: { name: 'The Space Devs', url: 'https://thespacedevs.com' },
  cneos: { name: 'NASA/JPL CNEOS', url: 'https://cneos.jpl.nasa.gov' },
  horizons: { name: 'NASA/JPL Horizons', url: 'https://ssd.jpl.nasa.gov/horizons/' },
  stars: { name: 'Yale Bright Star Catalogue', url: 'https://github.com/brettonw/YaleBrightStarCatalog' },
} satisfies Record<string, Holder>;

export type HolderId = keyof typeof HOLDERS;

const LICENCES = { 'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/', 'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/' };

const link = (href: string, text: string) => {
  const a = document.createElement('a');
  a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = text;
  return a;
};

/** Fill an element with the credit line: "Data ©" and every holder, each linked. */
export function showCredit(el: HTMLElement, ids: readonly HolderId[] | undefined) {
  el.textContent = '';
  if (!ids?.length) { el.hidden = true; return; }
  el.hidden = false;
  el.append(`${t.page.dataCredit} `);
  [...new Set(ids)].forEach((id, k) => {
    const h: Holder = HOLDERS[id];
    if (k) el.append(' · ');
    el.append(link(h.url, h.name));
    if (h.licence) el.append(' (', link(LICENCES[h.licence], h.licence), ')');
  });
}
