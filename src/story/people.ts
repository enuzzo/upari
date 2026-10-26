import type { Globe } from '../engine/globe';
import { ATLAS, ORIGINS, type AtlasId } from '../engine/atlas';
import type { Chapter, Legend } from './chapters';

// The second story: the people of the planet since 1960, from the atlas snapshots.

const it = (n: number, d = 0) => n.toLocaleString('it-IT', { maximumFractionDigits: d, minimumFractionDigits: d });
const LOOK = { sun: 'studio' as const, clouds: 0, dim: 0.66, desat: 0.6, night: 0, atmo: 0.8 };
const legend = (id: AtlasId): Legend => ({ stops: ATLAS[id].palette, left: ATLAS[id].left, right: ATLAS[id].right, title: ATLAS[id].title });
const WDI_NOTE = 'Valori annuali originali, senza stime aggiunte da Upari: un paese senza dato per un anno resta grigio. I colori scorrono fra un anno e il successivo; i numeri no. Confini Natural Earth contemporanei, non quelli dell’epoca.';

async function atlas(g: Globe) {
  await g.loadAtlas();
  return g.atlas;
}

const mean = async (g: Globe, id: AtlasId, year: number) => (await atlas(g)).worldMean(id, year) ?? 0;

export const PEOPLE: Chapter[] = [
  {
    id: 'popolazione', title: 'Otto miliardi', kicker: 'Popolazione, 1960 – 2025',
    look: { ...LOOK, dim: 0.76, atlas: 'population', dust: 1, years: [1960, 2025], yearSeconds: 20, bloom: 1.2 },
    duration: 26, clock: 'year',
    narrate: async (g) => {
      const a = await atlas(g);
      return `Nel 1960 eravamo ${it(a.total('population', 1960) / 1e9, 1)} miliardi. Nel 2025 siamo ${it(a.total('population', 2025) / 1e9, 1)}. Ogni punto di luce è un quarto di milione di persone: si accende dove vivono, anno dopo anno.`;
    },
    detail: async (g) => {
      const a = await atlas(g);
      const top = a.extreme('population', 2025, true)!;
      return {
        facts: [
          { value: `${it(a.total('population', 2025) / 1e9, 2)} miliardi`, label: 'abitanti nel 2025, somma dei 217 territori' },
          { value: '250.000', label: 'persone per ogni punto di luce' },
          { value: top.name, label: `il paese più popoloso: ${ATLAS.population.format(top.value)}` },
        ],
        text: 'I punti sono sparsi dentro ogni paese dove di notte ci sono luci (NASA Black Marble): mostrano dove si vive, non indirizzi precisi. Per ogni anno se ne accendono tanti quanti ne servono a contare la popolazione di quell’anno.',
        source: `${ATLAS.population.source} · confini Natural Earth`,
      };
    },
    beats: async () => [{ shot: { lon: 48, lat: 18, dist: 3.3 }, drift: 0.9 }],
  },
  {
    id: 'nascite', title: 'Si nasce di meno', kicker: 'Natalità, 1960 – 2024',
    look: { ...LOOK, atlas: 'birth', years: [1960, 2024], yearSeconds: 18 },
    duration: 24, clock: 'year', legend: legend('birth'),
    narrate: async (g) => {
      const top = (await atlas(g)).extreme('birth', 2024, true)!;
      return `Nel 1960 nascevano ${it(await mean(g, 'birth', 1960))} bambini ogni mille persone. Nel 2024, ${it(await mean(g, 'birth', 2024))}. Il calo è arrivato quasi ovunque; oggi il tasso più alto è in ${top.name}.`;
    },
    detail: async (g) => {
      const a = await atlas(g);
      const low = a.extreme('birth', 2024, false)!, top = a.extreme('birth', 2024, true)!;
      return {
        facts: [
          { value: `${it(await mean(g, 'birth', 2024), 1)} ‰`, label: 'nascite ogni mille abitanti nel mondo, nel 2024 (media pesata sulla popolazione)' },
          { value: it(top.value, 1), label: `il valore più alto, in ${top.name}` },
          { value: it(low.value, 1), label: `il più basso, in ${low.name}` },
        ],
        text: `Tasso grezzo: dipende anche dall’età della popolazione. ${WDI_NOTE}`,
        source: ATLAS.birth.source,
      };
    },
    beats: async () => [{ shot: { lon: 18, lat: 8, dist: 3.0 }, drift: 1.0 }],
  },
  {
    id: 'vita', title: 'Si vive più a lungo', kicker: 'Speranza di vita, 1960 – 2024',
    look: { ...LOOK, atlas: 'life', years: [1960, 2024], yearSeconds: 18 },
    duration: 24, clock: 'year', legend: legend('life'),
    narrate: async (g) => `Nel 1960 chi nasceva poteva aspettarsi, in media, ${it(await mean(g, 'life', 1960))} anni di vita. Oggi ${it(await mean(g, 'life', 2024))}. È una delle grandi conquiste del secolo, e non è finita.`,
    detail: async (g) => {
      const a = await atlas(g);
      const top = a.extreme('life', 2024, true)!, low = a.extreme('life', 2024, false)!;
      return {
        facts: [
          { value: `${it(await mean(g, 'life', 2024), 1)} anni`, label: 'speranza di vita alla nascita nel mondo, 2024 (media pesata sulla popolazione)' },
          { value: it(top.value, 1), label: `la più alta, a ${top.name}` },
          { value: it(low.value, 1), label: `la più bassa, in ${low.name}` },
        ],
        text: `Misura di periodo: quanto vivrebbe chi nasce oggi se i rischi di morte per età restassero quelli dell’anno. I crolli improvvisi sono guerre, carestie ed epidemie. ${WDI_NOTE}`,
        source: ATLAS.life.source,
      };
    },
    beats: async () => [{ shot: { lon: 95, lat: 20, dist: 3.1 }, drift: 1.0 }],
  },
  {
    id: 'bambini', title: 'I bambini', kicker: 'Mortalità sotto i cinque anni, 1960 – 2024',
    look: { ...LOOK, atlas: 'under5', years: [1960, 2024], yearSeconds: 18 },
    duration: 24, clock: 'year', legend: legend('under5'),
    narrate: async (g) => {
      const a = await atlas(g);
      const many = a.count('under5', 1960, (v) => v >= 250);
      const top = a.extreme('under5', 2024, true)!;
      const then = a.value('under5', top.code, 1960);
      return `Nel 1960, in ${it(many)} paesi più di un bambino su quattro moriva prima dei cinque anni. Oggi il valore più alto è in ${top.name}: ${it(top.value)} su mille${then ? `, erano ${it(then)}` : ''}.`;
    },
    detail: async (g) => {
      const a = await atlas(g);
      return {
        facts: [
          { value: it(a.count('under5', 1960, (v) => v >= 250)), label: 'paesi nel 1960 con almeno 250 morti ogni mille nati' },
          { value: it(a.count('under5', 2024, (v) => v >= 100)), label: 'paesi nel 2024 con almeno 100 su mille' },
          { value: 'SDG 3.2', label: 'l’obiettivo ONU: non più di 25 su mille entro il 2030' },
        ],
        text: `Stime di periodo UN IGME: non conteggi di decessi, né il destino di un singolo bambino; piccoli scarti non sono differenze certe. ${WDI_NOTE}`,
        source: ATLAS.under5.source,
      };
    },
    beats: async () => [{ shot: { lon: 15, lat: 2, dist: 2.9 }, drift: 0.9 }],
  },
  {
    id: 'saldo', title: 'Il saldo', kicker: 'Nascite meno decessi, 1960 – 2024',
    look: { ...LOOK, atlas: 'balance', years: [1960, 2024], yearSeconds: 18 },
    duration: 24, clock: 'year', legend: legend('balance'),
    narrate: async (g) => {
      const n = (await atlas(g)).count('balance', 2024, (v) => v < 0);
      return `Le nascite meno i decessi. In ${it(n)} paesi, oggi, si muore più di quanto si nasca: in blu, soprattutto in Europa e in Asia orientale. Dove è ambra, la popolazione cresce da sé.`;
    },
    detail: async (g) => {
      const a = await atlas(g);
      return {
        facts: [
          { value: it(a.count('balance', 2024, (v) => v < 0)), label: 'paesi con più decessi che nascite nel 2024' },
          { value: it(a.count('balance', 1960, (v) => v < 0)), label: 'quanti erano nel 1960' },
          { value: `${it(await mean(g, 'balance', 2024), 1)} ‰`, label: 'saldo naturale del mondo, nel 2024' },
        ],
        text: `Calcolato da Upari come natalità meno mortalità, per lo stesso paese e anno, solo dove ci sono entrambe. Le migrazioni non sono contate: un paese può crescere anche con il saldo negativo. ${WDI_NOTE}`,
        source: ATLAS.balance.source,
      };
    },
    beats: async () => [{ shot: { lon: 60, lat: 40, dist: 3.1 }, drift: 0.9 }],
  },
  {
    id: 'luce', title: 'La luce elettrica', kicker: 'Accesso all’elettricità, 2000 – 2024',
    look: { ...LOOK, atlas: 'electricity', years: [2000, 2024], yearSeconds: 16 },
    duration: 24, clock: 'year', legend: legend('electricity'),
    narrate: async (g) => {
      const a = await atlas(g);
      const without = Array.from(a.slots.keys()).reduce((s, code) => {
        const v = a.value('electricity', code, 2024), p = a.value('population', code, 2024);
        return v == null || !p ? s : s + p * (1 - v / 100);
      }, 0);
      return `Nel 2000 aveva l’elettricità il ${it(await mean(g, 'electricity', 2000))}% delle persone; oggi il ${it(await mean(g, 'electricity', 2024))}%. Ne restano senza ${it(without / 1e6, 0)} milioni, soprattutto nell’Africa a sud del Sahara.`;
    },
    detail: async (g) => {
      const a = await atlas(g);
      const ranked = Array.from(a.slots.keys()).map((code) => {
        const v = a.value('electricity', code, 2024), p = a.value('population', code, 2024);
        return { name: a.places.get(code)?.name ?? code, n: v == null || !p ? 0 : p * (1 - v / 100) };
      }).sort((x, y) => y.n - x.n);
      return {
        facts: [
          { value: `${it(await mean(g, 'electricity', 2024))}%`, label: 'delle persone con l’elettricità nel 2024 (media pesata sulla popolazione)' },
          { value: `${it(ranked[0].n / 1e6)} milioni`, label: `persone senza elettricità in ${ranked[0].name}` },
          { value: `${it(ranked[1].n / 1e6)} milioni`, label: `in ${ranked[1].name}` },
        ],
        text: `Accesso da rete, mini-reti o sistemi autonomi: non dice nulla di continuità, qualità o prezzo. Si parte dal 2000 perché prima molti paesi non hanno valori. ${WDI_NOTE}`,
        source: ATLAS.electricity.source,
      };
    },
    beats: async () => [{ shot: { lon: 22, lat: -2, dist: 2.9 }, drift: 0.8 }],
  },
  {
    id: 'fuga', title: 'In fuga', kicker: 'Domande di asilo, 2011 – 2024',
    look: { ...LOOK, dim: 0.72, migration: 1, years: [2011, 2024], yearSeconds: 20, bloom: 1.3 },
    duration: 26, clock: 'year',
    legend: {
      stops: [[0, '#5af2e6'], [0.34, '#5af2e6'], [0.35, '#ff8ccc'], [0.66, '#ff8ccc'], [0.67, '#ffc059'], [1, '#ffc059']],
      left: 'Siria · Ucraina', right: 'Afghanistan', title: 'domande di asilo, per paese d’origine',
    },
    narrate: async (g) => {
      const a = await atlas(g);
      const syr = a.asylumPeak('SYR');
      return `Chi fugge da Siria, Ucraina e Afghanistan, e il paese dove ha chiesto asilo. La guerra siriana raggiunge il suo culmine nel ${syr.year}: ${it(syr.total)} domande in un solo anno.`;
    },
    detail: async (g) => {
      const a = await atlas(g);
      const peaks = Object.keys(ORIGINS).map((o) => ({ o, ...a.asylumPeak(o) }));
      return {
        facts: peaks.map((p) => ({ value: it(p.total), label: `domande dall’origine ${ORIGINS[p.o].name}, nel ${p.year} (anno di picco)` })),
        text: 'Domande individuali nuove presentate alle autorità di governo, per paese di presentazione. Solo tre origini: non sono tutte le migrazioni né persone uniche. Dal 2022 la maggior parte di chi lasciava l’Ucraina ha ottenuto nell’Unione europea la protezione temporanea, che non è contata qui. Gli archi uniscono le capitali: sono schematici, non viaggi osservati.',
        source: 'UNHCR, Refugee Data Portal · AsylumApplications, CC BY 4.0',
      };
    },
    beats: async () => [{ shot: { lon: 32, lat: 42, dist: 2.4 }, drift: 0.5 }],
  },
];
