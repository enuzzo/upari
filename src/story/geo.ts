import { seaName } from './places';

// Countries from Natural Earth 1:110m (public domain), with Italian names. Contemporary,
// generalised borders: good to say what lies below, not to settle a frontier.

type Ring = [number, number][];
export interface Country {
  id: string;
  /** World Bank code used by the statistics (null for the few outlines with no WDI match). */
  stat: string | null;
  name: string;
  lon: number;
  lat: number;
  polygons: Ring[][];
  bbox: [number, number, number, number];
}

let loading: Promise<Country[]> | null = null;

export function loadCountries(): Promise<Country[]> {
  loading ??= (async () => {
    const geo = await (await fetch('statistics/countries.geojson')).json();
    return (geo.features as { properties: { id: string; statCode: string | null; name: string; longitude: number; latitude: number }; geometry: { type: string; coordinates: unknown } }[])
      .map((f) => {
        const polygons = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][];
        const bbox: [number, number, number, number] = [180, 90, -180, -90];
        for (const poly of polygons) for (const [x, y] of poly[0]) {
          bbox[0] = Math.min(bbox[0], x); bbox[1] = Math.min(bbox[1], y);
          bbox[2] = Math.max(bbox[2], x); bbox[3] = Math.max(bbox[3], y);
        }
        return { id: f.properties.id, stat: f.properties.statCode ?? null, name: f.properties.name, lon: f.properties.longitude, lat: f.properties.latitude, polygons, bbox };
      });
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

function inRing(ring: Ring, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The country at a point, or null at sea (or where the 1:110m outline has no land). */
export function countryAt(countries: Country[], lon: number, lat: number): Country | null {
  for (const c of countries) {
    const [x0, y0, x1, y1] = c.bbox;
    if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
    for (const poly of c.polygons) {
      if (!inRing(poly[0], lon, lat)) continue;
      if (poly.slice(1).some((hole) => inRing(hole, lon, lat))) continue;
      return c;
    }
  }
  return null;
}

/** What lies below a point, as a bare name: «Italia», «Atlantico del Nord». */
export function placeBelow(countries: Country[] | null, lon: number, lat: number): string {
  const c = countries ? countryAt(countries, lon, lat) : null;
  if (c) return c.name;
  return seaName(lon, lat).replace(/^(nel|nell’|nello|nella|nei|negli|tra le isole dell’)\s?/, '');
}
