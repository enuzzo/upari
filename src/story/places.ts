import { t } from '../i18n';

export type SeaId = keyof typeof t.sea;

/** A rough, evocative region for a point at sea or on land. */
export function seaId(lon: number, lat: number): SeaId {
  if (lat > 66) return 'arctic';
  if (lat < -58) return 'southern';
  if (lon > -6 && lon < 37 && lat > 30 && lat < 46) return 'med';
  if (lon > 32 && lon < 44 && lat > 12 && lat < 30) return 'red';
  if (lon > 47 && lon < 57 && lat > 23 && lat < 31) return 'persian';
  if (lon > -98 && lon < -80 && lat > 18 && lat < 31) return 'mexico';
  if (lon > -88 && lon < -60 && lat > 9 && lat < 22) return 'caribbean';
  if (lon > 99 && lon < 125 && lat > 0 && lat < 25) return 'southChina';
  if (lon > 110 && lon < 160 && lat > -12 && lat < 10) return 'indonesia';
  const indian = lon > 20 && lon < 120 && lat < 30 && !(lon > 100 && lat > -10);
  if (indian) return lat < -35 ? 'indianSouth' : 'indian';
  const atlantic = lon < 20 && (lat >= 8 ? lon > -82 : lon > -68);
  if (atlantic) {
    if (lat > 40) return 'atlanticNorth';
    if (lat > 0) return 'atlanticTropical';
    return lat < -35 ? 'atlanticSouth' : 'atlanticSouthern';
  }
  if (lat > 35) return 'pacificNorth';
  if (lat > 0) return 'pacificTropical';
  return lat < -35 ? 'pacificSouth' : 'pacificSouthern';
}

/** Where a point is, as a phrase for a sentence: «nel Mediterraneo», "in the Mediterranean". */
export const seaName = (lon: number, lat: number) => t.sea[seaId(lon, lat)].in;
