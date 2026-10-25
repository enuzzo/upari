import type { Globe, Look } from '../engine/globe';
import type { Shot } from '../engine/camera';
import { PALETTES, type Stop } from '../engine/palettes';
import { sunDirection, vecToLonLat, lonLatToVec } from '../engine/astro';
import { stats, formatLonLat } from './stats';
import { seaName } from './places';

export interface Beat { shot: Shot; seconds?: number; drift?: number }
export interface Fact { value: string; label: string }
export interface Detail { facts: Fact[]; text: string; source: string }
export interface Legend { stops: Stop[]; left: string; right: string; title: string }

export interface Chapter {
  id: string;
  title: string;
  kicker: string;
  look: Partial<Look>;
  duration: number;
  narrate: (g: Globe) => Promise<string>;
  detail: (g: Globe) => Promise<Detail>;
  beats: (g: Globe) => Promise<Beat[]>;
  legend?: Legend;
  follow?: 'iss';
  clock?: 'rain';
  pin?: (g: Globe) => Promise<{ lon: number; lat: number; label: string; sub: string } | null>;
}

const it = (n: number, d = 0) => n.toLocaleString('it-IT', { maximumFractionDigits: d, minimumFractionDigits: d });
const dateIt = (iso: string) => new Date(iso + (iso.length === 10 ? 'T12:00:00Z' : '')).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });

/** "oggi", "ieri" or "il 22 ottobre", from the day a layer actually shows. */
function when(iso: string | undefined): string {
  if (!iso) return 'di recente';
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diff = Math.round((day(new Date()) - Date.parse(iso.slice(0, 10) + 'T00:00:00Z')) / 86400e3);
  return diff <= 0 ? 'oggi' : diff === 1 ? 'ieri' : `il ${dateIt(iso)}`;
}
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** The NASA anomaly colormap stops at ±3 °C. */
const anomalyText = (v: number) => (v >= 2.95 ? 'oltre +3' : `+${it(v, 1)}`);

async function meta(g: Globe, id: Parameters<Globe['layers']['get']>[0]) {
  return (await g.layers.get(id)).meta;
}

/** A view that shows both day and night, centred on the terminator. */
function terminatorShot(g: Globe, dist: number): Shot {
  const s = vecToLonLat(sunDirection(g.now));
  // 75° away from the sub-solar point towards the evening side, at a pleasant latitude.
  let lon = s.lon - 70;
  lon = ((lon + 540) % 360) - 180;
  return { lon, lat: 22, dist };
}

function nightSide(g: Globe): Shot {
  const sun = sunDirection(g.now);
  const cities: [number, number][] = [[10, 47], [31, 27], [78, 23], [113, 31], [-82, 38], [-46, -20], [135, 35], [-100, 30], [2, 45]];
  let best = cities[0], bestDark = 1;
  for (const c of cities) {
    const d = lonLatToVec(c[0], c[1]).dot(sun);
    if (d < bestDark) { bestDark = d; best = c; }
  }
  return { lon: best[0], lat: best[1] - 4, dist: 1.05, tilt: 28 };
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'pianeta', title: 'Il pianeta', kicker: 'Adesso',
    look: { sun: 'real', clouds: 1, night: 1 },
    duration: 22,
    narrate: async () => 'Questa è la Terra, in questo istante. Metà nel giorno, metà nella notte. La linea d’ombra scivola sull’equatore a 1.670 chilometri all’ora.',
    detail: async (g) => ({
      facts: [
        { value: '1.670 km/h', label: 'velocità della rotazione all’equatore' },
        { value: '8′ 20″', label: 'il tempo che la luce del Sole impiega ad arrivare qui' },
        { value: g.now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }), label: 'l’ora del globo che vedi: la luce è quella vera' },
      ],
      text: 'Giorno, notte e crepuscolo sono calcolati per l’istante presente. Le nuvole si spostano seguendo i venti di oggi; le montagne proiettano ombra quando il Sole è basso.',
      source: 'NASA Blue Marble · NASA Black Marble · modello del terreno Mapzen/AWS · venti NOAA GFS',
    }),
    beats: async (g) => [{ shot: terminatorShot(g, 3.6), drift: 1.2 }],
  },
  {
    id: 'respiro', title: 'Il respiro', kicker: 'I venti di oggi',
    look: { sun: 'studio', clouds: 0.12, cloudFlow: 1, dim: 0.62, desat: 0.5, night: 0, flow: 'wind', atmo: 0.8 },
    duration: 24,
    legend: { stops: [[0, '#3a5a9a'], [0.25, '#9cc7ff'], [0.5, '#ffffff'], [0.75, '#ffd37a'], [1, '#ff7a4a']], left: 'calma', right: '80 km/h', title: 'velocità del vento' },
    narrate: async (g) => {
      const w = await stats.windiest(g);
      return `L’aria non sta mai ferma. Questi sono i venti di oggi: fiumi invisibili che portano il calore dei tropici verso i poli. Il più forte, adesso, soffia ${seaName(w.lon, w.lat)} a ${it(w.value)} km/h.`;
    },
    detail: async (g) => {
      const w = await stats.windiest(g);
      const m = await (await fetch('fields/wind.json')).json();
      return {
        facts: [
          { value: `${it(w.value)} km/h`, label: `il vento più forte del momento, ${formatLonLat(w.lon, w.lat)}` },
          { value: '10 m', label: 'l’altezza dal suolo a cui è misurato' },
          { value: '× 22.000', label: 'l’accelerazione delle scie, per vederle muovere' },
        ],
        text: 'Le alte e basse pressioni girano in direzioni opposte nei due emisferi: è la rotazione terrestre a curvare i venti. Tocca un punto per leggere velocità e direzione.',
        source: `Modello NOAA GFS 0,5° · analisi del ${new Date(m.time).toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`,
      };
    },
    beats: async (g) => {
      const w = await stats.windiest(g);
      return [{ shot: { lon: w.lon - 14, lat: w.lat * 0.7, dist: 3.4 }, drift: 0.6 }];
    },
    pin: async (g) => {
      const w = await stats.windiest(g);
      return { lon: w.lon, lat: w.lat, label: `${it(w.value)} km/h`, sub: 'il vento più forte, ora' };
    },
  },
  {
    id: 'correnti', title: 'Le correnti', kicker: 'Fiumi nel mare',
    look: { sun: 'studio', clouds: 0, dim: 0.62, desat: 0.5, night: 0, flow: 'currents', atmo: 0.75 },
    duration: 24,
    legend: { stops: [[0, '#1f5f7a'], [0.3, '#4ad1d1'], [0.6, '#b8fff0'], [1, '#ffffff']], left: 'lenta', right: '4 km/h', title: 'velocità della corrente' },
    narrate: async () => 'Sotto le onde, il mare ha i suoi fiumi. La Corrente del Golfo trasporta decine di volte l’acqua di tutti i fiumi della Terra insieme, e porta un po’ di tropico fino in Europa.',
    detail: async () => ({
      facts: [
        { value: '30 milioni', label: 'metri cubi al secondo nella Corrente del Golfo, al largo della Florida' },
        { value: '1,2 milioni', label: 'metri cubi al secondo: tutti i fiumi del mondo messi insieme' },
        { value: '15 m', label: 'lo strato d’acqua di superficie rappresentato' },
      ],
      text: 'Le correnti mostrate sono una giornata di settembre: le grandi correnti cambiano lentamente da un anno all’altro, mentre i vortici al loro bordo nascono e muoiono in poche settimane.',
      source: 'OSCAR · NOAA CoastWatch ERDDAP · 26 settembre 2014, risoluzione 1/3°',
    }),
    beats: async () => [
      { shot: { lon: -58, lat: 30, dist: 1.9 }, drift: 0.8 },
    ],
  },
  {
    id: 'calore', title: 'Il calore del mare', kicker: 'Temperatura del mare',
    look: { sun: 'studio', data: 'sst', clouds: 0.06, dim: 0.3, desat: 0.4, night: 0, atmo: 0.85 },
    duration: 22,
    legend: { stops: PALETTES.sst, left: '−2 °C', right: '34 °C', title: 'temperatura dell’acqua' },
    narrate: async (g) => {
      const h = await stats.hottestSea(g), day = when((await meta(g, 'sst')).dates?.[0]);
      return `Il mare è il grande termosifone del pianeta. Il punto più caldo, ${day}, ${day === 'oggi' ? 'è' : 'era'} ${seaName(h.lon, h.lat)}: ${h.value >= 31.9 ? 'oltre 32' : it(h.value, 1)} gradi. Ai poli l’acqua scende sotto lo zero senza gelare, perché è salata.`;
    },
    detail: async (g) => {
      const h = await stats.hottestSea(g), m = await meta(g, 'sst');
      return {
        facts: [
          { value: `${h.value >= 31.9 ? '> 32' : it(h.value, 1)} °C`, label: `il mare più caldo ${when(m.dates?.[0])}, ${formatLonLat(h.lon, h.lat)}` },
          { value: '−1,8 °C', label: 'la temperatura a cui gela l’acqua di mare' },
          { value: '1 km', label: 'la risoluzione della mappa originale' },
        ],
        text: 'L’oceano assorbe più del 90% del calore in eccesso dovuto ai gas serra. Le correnti calde si riconoscono come lingue arancioni che risalgono verso i poli.',
        source: `GHRSST MUR, NASA JPL · ${dateIt(m.dates![0])}`,
      };
    },
    beats: async (g) => {
      const h = await stats.hottestSea(g);
      return [{ shot: { lon: h.lon - 12, lat: h.lat * 0.6, dist: 3.3 }, drift: 0.8 }];
    },
    pin: async (g) => {
      const h = await stats.hottestSea(g);
      return { lon: h.lon, lat: h.lat, label: `${h.value >= 31.9 ? '> 32' : it(h.value, 1)} °C`, sub: 'il mare più caldo' };
    },
  },
  {
    id: 'febbre', title: 'La febbre', kicker: 'Rispetto al normale',
    look: { sun: 'studio', data: 'anomaly', clouds: 0.06, dim: 0.55, desat: 0.75, night: 0, atmo: 0.85 },
    duration: 22,
    legend: { stops: PALETTES.anomaly, left: '−3 °C', right: '+3 °C', title: 'differenza dalla media' },
    narrate: async (g) => {
      const { share } = await stats.warmShare(g);
      const pct = Math.round(share * 100);
      const day = when((await meta(g, 'anomaly')).dates?.[0]);
      return `In rosso il mare più caldo del solito, in blu quello più freddo. ${cap(day)} ${day === 'oggi' ? 'è' : 'era'} più caldo della media il ${pct}% degli oceani.`;
    },
    detail: async (g) => {
      const { share, hottest } = await stats.warmShare(g), m = await meta(g, 'anomaly');
      return {
        facts: [
          { value: `${Math.round(share * 100)}%`, label: 'della superficie del mare oltre la media' },
          { value: `${anomalyText(hottest.value)} °C`, label: `l’anomalia più forte, ${seaName(hottest.lon, hottest.lat)}` },
          { value: '2003–2014', label: 'il periodo che fa da “normale”' },
        ],
        text: 'Un’anomalia confronta la temperatura di un giorno con la media dello stesso giorno negli anni di riferimento. Le ondate di calore marine durano settimane e mettono in difficoltà coralli, pesci e praterie sommerse.',
        source: `GHRSST MUR anomalie, NASA JPL · ${dateIt(m.dates![0])}`,
      };
    },
    beats: async (g) => {
      const { hottest } = await stats.warmShare(g);
      return [{ shot: { lon: hottest.lon - 10, lat: Math.max(-50, Math.min(50, hottest.lat)), dist: 3.3 }, drift: 0.8 }];
    },
    pin: async (g) => {
      const { hottest } = await stats.warmShare(g);
      return { lon: hottest.lon, lat: hottest.lat, label: `${anomalyText(hottest.value)} °C`, sub: 'l’anomalia più forte' };
    },
  },
  {
    id: 'fioritura', title: 'Il mare che fiorisce', kicker: 'Fitoplancton',
    look: { sun: 'studio', data: 'chlorophyll', clouds: 0.04, dim: 0.66, desat: 0.5, night: 0, atmo: 0.8, bloom: 1.3 },
    duration: 24,
    legend: { stops: PALETTES.chlorophyll, left: 'acqua limpida', right: 'fioritura', title: 'clorofilla in superficie' },
    narrate: async () => 'Ogni bagliore verde è una prateria invisibile: miliardi di alghe microscopiche, il fitoplancton. Producono circa metà dell’ossigeno che respiriamo.',
    detail: async (g) => {
      const m = await meta(g, 'chlorophyll');
      return {
        facts: [
          { value: '≈ 50%', label: 'dell’ossigeno del pianeta viene dal mare' },
          { value: `${m.dates!.length} giorni`, label: 'di osservazioni fusi per togliere le nuvole' },
          { value: '0,01 → 20', label: 'milligrammi di clorofilla per metro cubo, dal blu al verde' },
        ],
        text: 'Le fioriture seguono le stagioni e le acque ricche di nutrienti: lungo le coste, dove l’acqua profonda risale, e in primavera alle alte latitudini. A ottobre è primavera nell’emisfero sud.',
        source: `NASA PACE OCI · ${dateIt(m.dates!.at(-1)!)} – ${dateIt(m.dates![0])}`,
      };
    },
    beats: async () => [{ shot: { lon: -42, lat: -34, dist: 2.9 }, drift: 1.0 }],
  },
  {
    id: 'pioggia', title: 'La pioggia', kicker: 'Ventiquattro ore',
    look: { sun: 'studio', data: 'rain', clouds: 0.18, dim: 0.62, desat: 0.55, night: 0, atmo: 0.8, bloom: 0.8 },
    duration: 24,
    clock: 'rain',
    legend: { stops: PALETTES.rain, left: 'pioviggine', right: 'nubifragio', title: 'intensità della pioggia' },
    narrate: async () => 'Un giorno intero di pioggia, in pochi secondi. Lungo l’equatore l’aria calda sale, si raffredda, e restituisce al mare l’acqua che il Sole gli aveva preso.',
    detail: async (g) => {
      const m = await meta(g, 'rain');
      const first = m.frames![0].time, last = m.frames!.at(-1)!.time;
      return {
        facts: [
          { value: '30 min', label: 'tra un’immagine e l’altra della costellazione GPM' },
          { value: '24 ore', label: `dal ${new Date(first).toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC` },
          { value: '≈ 1 m', label: 'la pioggia che cade in media in un anno su tutto il pianeta' },
        ],
        text: `Ogni fotogramma è una stima satellitare della pioggia; fra un’immagine e l’altra le transizioni sono interpolate. Ultimo fotogramma: ${new Date(last).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC.`,
        source: 'NASA GPM IMERG · Early Run',
      };
    },
    beats: async () => [{ shot: { lon: 120, lat: 6, dist: 3.4 }, drift: 1.6 }],
  },
  {
    id: 'fuoco', title: 'Il fuoco', kicker: 'Ultimi sette giorni',
    look: { sun: 'studio', clouds: 0, dim: 0.78, desat: 0.75, night: 0.35, fires: 1, atmo: 0.6, bloom: 1.4 },
    duration: 22,
    narrate: async () => {
      const f = await (await fetch('layers/fires.json')).json();
      const k = Math.round(f.detections / 1000);
      return `Ogni scintilla è un incendio visto dallo spazio. In sette giorni i satelliti ne hanno contati più di ${it(k)} mila. Quasi tutti li accendiamo noi: per pulire i campi, per fare spazio al pascolo.`;
    },
    detail: async () => {
      const f = await (await fetch('layers/fires.json')).json();
      return {
        facts: [
          { value: it(f.detections), label: 'punti di calore rilevati in 7 giorni' },
          { value: '375 m', label: 'la grandezza del pixel che vede il fuoco' },
          { value: '2 volte', label: 'al giorno, di giorno e di notte, NOAA‑20 passa su ogni punto' },
        ],
        text: 'La luminosità di ogni punto è proporzionale alla potenza del fuoco; i più recenti brillano di più. In Africa australe e in Sud America è la stagione degli incendi agricoli.',
        source: `NASA FIRMS · VIIRS NOAA-20 · aggiornato al ${dateIt(f.newest)}`,
      };
    },
    beats: async () => [{ shot: { lon: 14, lat: -6, dist: 3.2 }, drift: 1.2 }],
  },
  {
    id: 'ghiaccio', title: 'Il ghiaccio', kicker: 'In cima al mondo',
    look: { sun: 'studio', data: 'ice', clouds: 0.08, dim: 0.5, desat: 0.5, night: 0, atmo: 0.9 },
    duration: 22,
    legend: { stops: PALETTES.ice, left: '15%', right: '100%', title: 'mare ghiacciato' },
    narrate: async (g) => {
      const { north } = await stats.arcticIce(g), day = when((await meta(g, 'ice')).dates?.[0]);
      return `In cima al mondo il mare gela. ${cap(day)} il ghiaccio artico ${day === 'oggi' ? 'copre' : 'copriva'} ${it(north / 1e6, 1)} milioni di chilometri quadrati, e ogni inverno si allarga di un’area grande come l’Europa.`;
    },
    detail: async (g) => {
      const { north, south } = await stats.arcticIce(g), m = await meta(g, 'ice');
      return {
        facts: [
          { value: `${it(north / 1e6, 1)} mln km²`, label: `ghiaccio marino artico, ${when(m.dates?.[0])}` },
          { value: `${it(south / 1e6, 1)} mln km²`, label: 'ghiaccio attorno all’Antartide' },
          { value: '−12%', label: 'per decennio: il calo del minimo estivo artico dal 1979' },
        ],
        text: 'La superficie è la somma delle aree con almeno il 15% di ghiaccio, pesata per la concentrazione. Il ghiaccio riflette la luce del Sole: quando si ritira, il mare scuro assorbe più calore.',
        source: `GHRSST GAMSSA, Bureau of Meteorology · concentrazione del ghiaccio · ${dateIt(m.dates![0])}`,
      };
    },
    beats: async () => [{ shot: { lon: -20, lat: 68, dist: 3.2 }, drift: 2 }],
  },
  {
    id: 'luci', title: 'Le luci', kicker: 'La notte, adesso',
    look: { sun: 'real', clouds: 0.45, night: 0.85, atmo: 1, bloom: 0.9 },
    duration: 22,
    narrate: async () => 'Quando cala la notte, il pianeta si accende. Queste luci sono il ritratto più fedele di dove viviamo: lungo le coste, i fiumi, le strade.',
    detail: async () => ({
      facts: [
        { value: '≈ 57%', label: 'dell’umanità vive in città' },
        { value: '742 m', label: 'il pixel con cui un satellite fotografa le luci' },
        { value: '2016', label: 'l’anno del mosaico notturno, senza nuvole né Luna' },
      ],
      text: 'Il fiume di luce del Nilo, la ragnatela dell’Europa, le coste del Giappone: le luci raccontano anche ciò che manca, come le grandi foreste e i deserti, quasi bui.',
      source: 'NASA Black Marble · VIIRS 2016',
    }),
    beats: async (g) => [{ shot: nightSide(g), drift: 0.5 }],
  },
  {
    id: 'lassu', title: 'Lassù', kicker: 'La Stazione Spaziale, ora',
    look: { sun: 'real', clouds: 1, night: 1.1, iss: 1, atmo: 1 },
    duration: 26,
    follow: 'iss',
    narrate: async (g) => {
      const s = g.station;
      const alt = s.altKm > 300 ? Math.round(s.altKm) : 415;
      return `E lassù, a ${it(alt)} chilometri, la Stazione Spaziale gira intorno a tutto questo a ${it(Math.round(s.speedKmh / 100) * 100 || 27600)} km/h. Un giro completo ogni 92 minuti: sedici albe al giorno.`;
    },
    detail: async (g) => ({
      facts: [
        { value: `${it(Math.round(g.station.altKm || 415))} km`, label: 'di quota, in questo momento' },
        { value: `${it(Math.round(g.station.speedKmh || 27600))} km/h`, label: 'circa 7,7 km ogni secondo' },
        { value: '16', label: 'albe e tramonti al giorno per l’equipaggio' },
      ],
      text: 'La posizione è calcolata ora dagli elementi orbitali pubblicati da CelesTrak. La linea mostra un’orbita completa: mezz’ora nel passato e un’ora nel futuro.',
      source: 'Elementi orbitali NORAD 25544 · CelesTrak · propagazione SGP4',
    }),
    beats: async (g) => [{ shot: { lon: g.station.lon, lat: g.station.lat, dist: 1.25 }, seconds: 4.5 }],
  },
];
