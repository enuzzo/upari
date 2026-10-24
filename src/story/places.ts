/** A rough, evocative name for a point at sea or on land, in Italian. */
export function seaName(lon: number, lat: number): string {
  if (lat > 66) return 'nel Mar Glaciale Artico';
  if (lat < -58) return 'nell’Oceano Antartico';
  if (lon > -6 && lon < 37 && lat > 30 && lat < 46) return 'nel Mediterraneo';
  if (lon > 32 && lon < 44 && lat > 12 && lat < 30) return 'nel Mar Rosso';
  if (lon > 47 && lon < 57 && lat > 23 && lat < 31) return 'nel Golfo Persico';
  if (lon > -98 && lon < -80 && lat > 18 && lat < 31) return 'nel Golfo del Messico';
  if (lon > -88 && lon < -60 && lat > 9 && lat < 22) return 'nel Mar dei Caraibi';
  if (lon > 99 && lon < 125 && lat > 0 && lat < 25) return 'nel Mar Cinese Meridionale';
  if (lon > 110 && lon < 160 && lat > -12 && lat < 10) return 'tra le isole dell’Indonesia';
  const indian = lon > 20 && lon < 120 && lat < 30 && !(lon > 100 && lat > -10);
  if (indian) return lat < -35 ? 'nell’Oceano Indiano meridionale' : 'nell’Oceano Indiano';
  const atlantic = lon < 20 && (lat >= 8 ? lon > -82 : lon > -68);
  if (atlantic) {
    if (lat > 40) return 'nell’Atlantico del Nord';
    if (lat > 0) return 'nell’Atlantico tropicale';
    return lat < -35 ? 'nell’Atlantico del Sud' : 'nell’Atlantico meridionale';
  }
  if (lat > 35) return 'nel Pacifico del Nord';
  if (lat > 0) return 'nel Pacifico tropicale';
  return lat < -35 ? 'nel Pacifico del Sud' : 'nel Pacifico meridionale';
}
