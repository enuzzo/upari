import type { Globe } from '../engine/globe';
import { DATA, type DataId } from '../engine/layers';
import { PALETTES } from '../engine/palettes';
import type { Chapter } from './chapters';
import { loadCountries, placeBelow } from './geo';

// The third story: the living planet, from monthly satellite series and the forest record.

const it = (n: number, d = 0) => n.toLocaleString('it-IT', { maximumFractionDigits: d, minimumFractionDigits: d });
const monthIt = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('it-IT', { month: 'long', timeZone: 'UTC' });
const monthYearIt = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const LOOK = { sun: 'studio' as const, clouds: 0, night: 0, atmo: 0.8 };

/** Area-weighted scan of one frame of a series; visit gets the decoded value. */
async function scanFrames(g: Globe, id: DataId, box: [number, number, number, number], visit: (frame: number, v: number, area: number, lon: number, lat: number) => void, step = 1) {
  const { sampler, meta } = await g.layers.get(id);
  const [lon0, lat0, lon1, lat1] = box;
  sampler.forEach((s, f) => {
    for (let lat = lat0; lat <= lat1; lat += step) {
      const area = Math.cos((lat * Math.PI) / 180);
      for (let lon = lon0; lon < lon1; lon += step) {
        const [r, c] = s.read(lon, lat);
        if (c < 0.5) continue;
        visit(f, DATA[id].decode(r, meta), area, lon, lat);
      }
    }
  });
  return meta;
}

async function greenSeasons(g: Globe) {
  const green = new Float64Array(16), all = new Float64Array(16);
  const meta = await scanFrames(g, 'ndvi', [-180, 30, 180, 65], (f, v, a) => { all[f] += a; if (v > 0.5) green[f] += a; });
  const share = Array.from(meta.frames!, (_, f) => (all[f] ? green[f] / all[f] : 0));
  const hi = share.indexOf(Math.max(...share)), lo = share.indexOf(Math.min(...share));
  return { meta, share, hi, lo };
}

async function haziest(g: Globe) {
  let best = { v: 0, lon: 0, lat: 0, frame: 0 };
  const sum = new Float64Array(16), area = new Float64Array(16);
  const meta = await scanFrames(g, 'aerosol', [-180, -60, 180, 70], (f, v, a, lon, lat) => {
    sum[f] += v * a; area[f] += a;
    if (v > best.v) best = { v, lon, lat, frame: f };
  }, 1);
  const mean = Array.from(meta.frames!, (_, f) => (area[f] ? sum[f] / area[f] : 0));
  return { meta, best, worstMonth: mean.indexOf(Math.max(...mean)) };
}

async function reefStress(g: Globe) {
  const alert = new Float64Array(16), severe = new Float64Array(16), all = new Float64Array(16);
  const meta = await scanFrames(g, 'coral', [-180, -30, 180, 30], (f, v, a) => {
    all[f] += a;
    if (v >= 4) alert[f] += a;
    if (v >= 8) severe[f] += a;
  }, 0.5);
  const n = meta.frames!.length;
  const share = (arr: Float64Array, f: number) => (all[f] ? arr[f] / all[f] : 0);
  let peak = 0;
  for (let f = 0; f < n; f++) if (share(alert, f) > share(alert, peak)) peak = f;
  return { meta, last: n - 1, alertNow: share(alert, n - 1), severeNow: share(severe, n - 1), peak, alertPeak: share(alert, peak) };
}

async function forestMeta() {
  return (await fetch('layers/forest.json')).json() as Promise<{ peak: number; share: number[]; first: number; last: number }>;
}

export const NATURE: Chapter[] = [
  {
    id: 'verde', title: 'Il respiro verde', kicker: 'Un anno di vegetazione',
    mood: 'open', sound: 'forest',
    look: { ...LOOK, data: 'ndvi', dim: 0.35, desat: 0.65 },
    duration: 26, clock: 'data',
    legend: { stops: PALETTES.ndvi, left: 'suolo nudo', right: 'foresta fitta', title: 'quanto è verde la terra (NDVI)' },
    narrate: async (g) => {
      const { meta, share, hi, lo } = await greenSeasons(g);
      const f = meta.frames!;
      return `La Terra respira con le stagioni. Fra i 30 e i 65 gradi nord le foglie coprono il ${it(share[hi] * 100)}% della terra a ${monthIt(f[hi].time)}, appena il ${it(share[lo] * 100)}% a ${monthIt(f[lo].time)}. Poi il verde passa all’altro emisfero.`;
    },
    detail: async (g) => {
      const { meta, share, hi, lo } = await greenSeasons(g);
      const f = meta.frames!;
      return {
        facts: [
          { value: `${it(share[hi] * 100)}%`, label: `delle terre fra 30° e 65° nord con vegetazione fitta (NDVI oltre 0,5), a ${monthYearIt(f[hi].time)}` },
          { value: `${it(share[lo] * 100)}%`, label: `a ${monthYearIt(f[lo].time)}` },
          { value: `${f.length} mesi`, label: `da ${monthYearIt(f[0].time)} a ${monthYearIt(f[f.length - 1].time)}` },
        ],
        text: 'L’NDVI confronta la luce rossa, che le foglie assorbono, con l’infrarosso vicino, che riflettono: più è alto, più la vegetazione è fitta e attiva. Ogni fotogramma è la media di un mese; dove le nuvole coprono tutto il mese il valore manca.',
        source: 'NASA VIIRS (Suomi NPP) · NDVI mensile · GIBS',
      };
    },
    beats: async () => [{ shot: { lon: 20, lat: 35, dist: 3.2 }, drift: 1.4 }],
  },
  {
    id: 'foreste', title: 'Le foreste perdute', kicker: 'Copertura arborea perduta, 2001 – 2024',
    mood: 'grave', sound: 'forest',
    look: { ...LOOK, data: 'forest', dim: 0.55, desat: 0.85, years: [2001, 2024], yearSeconds: 18, bloom: 1.3 },
    duration: 26, clock: 'year',
    legend: { stops: PALETTES.forest, left: 'anni fa', right: 'quest’anno', title: 'alberi perduti, per anno' },
    narrate: async () => {
      const m = await forestMeta();
      return `Ogni punto è un pezzo di foresta che non c’è più: tagliata, bruciata, trasformata in campo. Brilla l’anno in cui è scomparsa, poi diventa cicatrice. Il ${m.peak} è stato l’anno peggiore di tutta la serie.`;
    },
    detail: async () => {
      const m = await forestMeta();
      const recent = m.share.slice(-5).reduce((a, b) => a + b, 0), early = m.share.slice(0, 5).reduce((a, b) => a + b, 0);
      return {
        facts: [
          { value: String(m.peak), label: 'l’anno con la perdita più grande dal 2001' },
          { value: `${it(recent * 100)}%`, label: `della perdita di tutta la serie è avvenuta negli ultimi cinque anni (${m.last - 4}–${m.last})` },
          { value: `${it(early * 100)}%`, label: `nei primi cinque (${m.first}–${m.first + 4})` },
        ],
        text: 'Perdita di copertura arborea: alberi alti almeno 5 metri spariti da un pixel di 30 metri, per incendio, taglio o malattia. Non distingue la deforestazione dalla gestione forestale né conta la ricrescita. Qui è ridotta a circa 10 km per punto; le quote per anno sono calcolate su questa mappa, ponderate per l’intensità.',
        source: 'Hansen et al. 2013, University of Maryland · Global Forest Watch v1.12 · CC BY 4.0',
      };
    },
    beats: async () => [{ shot: { lon: -58, lat: -6, dist: 2.5 }, drift: 0.9, hold: 12 }, { shot: { lon: 108, lat: 2, dist: 2.6 }, seconds: 5, drift: 0.6 }],
  },
  {
    id: 'aria', title: 'L’aria', kicker: 'Un anno di polveri e fumo',
    mood: 'curious', sound: 'desert',
    look: { ...LOOK, data: 'aerosol', dim: 0.45, desat: 0.6, clouds: 0.1 },
    duration: 24, clock: 'data',
    legend: { stops: PALETTES.aerosol, left: 'aria limpida', right: 'aria densa', title: 'quanta luce trattengono le particelle (AOD)' },
    narrate: async (g) => {
      const { meta, best, worstMonth } = await haziest(g);
      const where = placeBelow(await loadCountries().catch(() => null), best.lon, best.lat);
      return `Sabbia del Sahara sull’Atlantico, fumo degli incendi, smog delle città: l’aria trasporta tutto. Nell’ultimo anno il velo più spesso era sopra ${where}, a ${monthIt(meta.frames![best.frame].time)}; il mese più torbido del pianeta è stato ${monthIt(meta.frames![worstMonth].time)}.`;
    },
    detail: async (g) => {
      const { meta, best, worstMonth } = await haziest(g);
      const where = placeBelow(await loadCountries().catch(() => null), best.lon, best.lat);
      return {
        facts: [
          { value: it(best.v, 2), label: `lo spessore ottico più alto dell’anno: ${where}, ${monthYearIt(meta.frames![best.frame].time)}` },
          { value: monthYearIt(meta.frames![worstMonth].time), label: 'il mese con l’aria più carica, in media sul pianeta' },
          { value: '550 nm', label: 'la lunghezza d’onda della luce verde su cui si misura' },
        ],
        text: 'Lo spessore ottico degli aerosol dice quanta luce del Sole viene fermata dalle particelle sospese: 0,1 è aria limpida, oltre 1 il cielo è opaco. Sono stime della rianalisi MERRA-2 della NASA, che fonde satelliti e un modello dell’atmosfera; non distinguono da sole la polvere dal fumo.',
        source: 'NASA GMAO · MERRA-2 · spessore ottico degli aerosol a 550 nm, mensile · GIBS',
      };
    },
    beats: async () => [{ shot: { lon: -10, lat: 18, dist: 3.1 }, drift: 1.2 }],
  },
  {
    id: 'coralli', title: 'Le barriere coralline', kicker: 'Un anno di calore nel mare',
    mood: 'grave', sound: 'reef',
    look: { ...LOOK, data: 'coral', dim: 0.6, desat: 0.7, bloom: 1.2 },
    duration: 26, clock: 'data',
    legend: { stops: PALETTES.coral, left: '0', right: '20 °C · settimane', title: 'stress termico accumulato' },
    narrate: async (g) => {
      const r = await reefStress(g);
      const peak = r.peak === r.last ? 'il valore più alto dell’ultimo anno' : `nell’ultimo anno il picco è stato a ${monthYearIt(r.meta.frames![r.peak].time)}, con il ${it(r.alertPeak * 100)}%`;
      return `Quando il mare resta troppo caldo per settimane, i coralli espellono le alghe che li nutrono e sbiancano. Oggi il ${it(r.alertNow * 100)}% dei mari tropicali è oltre la soglia: ${peak}.`;
    },
    detail: async (g) => {
      const r = await reefStress(g);
      return {
        facts: [
          { value: `${it(r.alertNow * 100)}%`, label: 'dei mari tropicali (30° N – 30° S) oltre 4 °C-settimane, dove lo sbiancamento è probabile' },
          { value: `${it(r.severeNow * 100)}%`, label: 'oltre 8, dove molti coralli muoiono' },
          { value: monthYearIt(r.meta.frames![r.peak].time), label: `il mese più critico dell’ultimo anno (${it(r.alertPeak * 100)}%)` },
        ],
        text: 'Le settimane di calore (Degree Heating Weeks) sommano, sulle ultime dodici settimane, quanto l’acqua ha superato la temperatura massima abituale di quel luogo. La misura vale per tutto il mare: le barriere coralline sono solo dove l’acqua è bassa e limpida.',
        source: 'NOAA Coral Reef Watch v3.1 · 5 km · via PacIOOS ERDDAP',
      };
    },
    beats: async () => [{ shot: { lon: 150, lat: -12, dist: 2.9 }, drift: 1.0 }],
  },
];
