import type { Globe } from '../engine/globe';
import { ATLAS, ORIGINS, atlasText, type AtlasId } from '../engine/atlas';
import { legend as legendOf, titled, type Chapter, type Legend } from './chapters';
import { t } from '../i18n';
import { num } from '../i18n/format';

// The second story: the people of the planet since 1960, from the atlas snapshots.

const LOOK = { sun: 'studio' as const, clouds: 0, dim: 0.66, desat: 0.6, night: 0, atmo: 0.8 };
const legend = (id: AtlasId): Legend => ({
  stops: ATLAS[id].palette,
  get left() { return atlasText(id).left; }, get right() { return atlasText(id).right; }, get title() { return atlasText(id).title; },
});
/** The text of a statistic, then the note every World Bank chapter carries. */
const noted = (text: string) => `${text} ${t.wdiNote}`;

async function atlas(g: Globe) {
  await g.loadAtlas();
  return g.atlas;
}

const mean = async (g: Globe, id: AtlasId, year: number) => (await atlas(g)).worldMean(id, year) ?? 0;

export const PEOPLE: Chapter[] = titled([
  {
    id: 'popolazione',
    mood: 'calm', sound: 'city',
    look: { ...LOOK, dim: 0.76, atlas: 'population', dust: 1, years: [1960, 2025], yearSeconds: 20, bloom: 1.2 },
    duration: 26, clock: 'year',
    narrate: async (g) => {
      const a = await atlas(g);
      return t.popolazione.narrate({ then: num(a.total('population', 1960) / 1e9, 1), now: num(a.total('population', 2025) / 1e9, 1) });
    },
    detail: async (g) => {
      const a = await atlas(g);
      const top = a.extreme('population', 2025, true)!;
      const words = t.popolazione;
      return {
        facts: [
          { value: words.billions(num(a.total('population', 2025) / 1e9, 2)), label: words.total },
          { value: words.dot[0], label: words.dot[1] },
          { value: top.name, label: words.largest(atlasText('population').format(top.value)) },
        ],
        text: words.text,
        source: `${atlasText('population').source} · ${words.borders}`,
      };
    },
    beats: async () => [{ shot: { lon: 48, lat: 18, dist: 3.3 }, drift: 0.9 }],
  },
  {
    id: 'nascite',
    mood: 'curious', sound: 'city',
    look: { ...LOOK, atlas: 'birth', years: [1960, 2024], yearSeconds: 18 },
    duration: 24, clock: 'year', legend: legend('birth'),
    narrate: async (g) => {
      const top = (await atlas(g)).extreme('birth', 2024, true)!;
      return t.nascite.narrate({ then: num(await mean(g, 'birth', 1960)), now: num(await mean(g, 'birth', 2024)), top: top.name });
    },
    detail: async (g) => {
      const a = await atlas(g);
      const low = a.extreme('birth', 2024, false)!, top = a.extreme('birth', 2024, true)!;
      return {
        facts: [
          { value: `${num(await mean(g, 'birth', 2024), 1)} ‰`, label: t.nascite.world },
          { value: num(top.value, 1), label: t.nascite.highest(top.name) },
          { value: num(low.value, 1), label: t.nascite.lowest(low.name) },
        ],
        text: noted(t.nascite.text),
        source: atlasText('birth').source,
      };
    },
    beats: async () => [{ shot: { lon: 18, lat: 8, dist: 3.0 }, drift: 1.0 }],
  },
  {
    id: 'vita',
    mood: 'open', sound: 'city',
    look: { ...LOOK, atlas: 'life', years: [1960, 2024], yearSeconds: 18 },
    duration: 24, clock: 'year', legend: legend('life'),
    narrate: async (g) => t.vita.narrate({ then: num(await mean(g, 'life', 1960)), now: num(await mean(g, 'life', 2024)) }),
    detail: async (g) => {
      const a = await atlas(g);
      const top = a.extreme('life', 2024, true)!, low = a.extreme('life', 2024, false)!;
      return {
        facts: [
          { value: t.vita.years(num(await mean(g, 'life', 2024), 1)), label: t.vita.world },
          { value: num(top.value, 1), label: t.vita.highest(top.name) },
          { value: num(low.value, 1), label: t.vita.lowest(low.name) },
        ],
        text: noted(t.vita.text),
        source: atlasText('life').source,
      };
    },
    beats: async () => [{ shot: { lon: 95, lat: 20, dist: 3.1 }, drift: 1.0 }],
  },
  {
    id: 'bambini',
    mood: 'grave', sound: 'city',
    look: { ...LOOK, atlas: 'under5', years: [1960, 2024], yearSeconds: 18 },
    duration: 24, clock: 'year', legend: legend('under5'),
    narrate: async (g) => {
      const a = await atlas(g);
      const many = a.count('under5', 1960, (v) => v >= 250);
      const top = a.extreme('under5', 2024, true)!;
      const then = a.value('under5', top.code, 1960);
      return t.bambini.narrate({ many: num(many), top: top.name, now: num(top.value), then: then ? num(then) : null });
    },
    detail: async (g) => {
      const a = await atlas(g);
      return {
        facts: [
          { value: num(a.count('under5', 1960, (v) => v >= 250)), label: t.bambini.then },
          { value: num(a.count('under5', 2024, (v) => v >= 100)), label: t.bambini.now },
          { value: t.bambini.goal[0], label: t.bambini.goal[1] },
        ],
        text: noted(t.bambini.text),
        source: atlasText('under5').source,
      };
    },
    beats: async () => [{ shot: { lon: 15, lat: 2, dist: 2.9 }, drift: 0.9 }],
  },
  {
    id: 'saldo',
    mood: 'curious', sound: 'city',
    look: { ...LOOK, atlas: 'balance', years: [1960, 2024], yearSeconds: 18 },
    duration: 24, clock: 'year', legend: legend('balance'),
    narrate: async (g) => t.saldo.narrate(num((await atlas(g)).count('balance', 2024, (v) => v < 0))),
    detail: async (g) => {
      const a = await atlas(g);
      return {
        facts: [
          { value: num(a.count('balance', 2024, (v) => v < 0)), label: t.saldo.now },
          { value: num(a.count('balance', 1960, (v) => v < 0)), label: t.saldo.then },
          { value: `${num(await mean(g, 'balance', 2024), 1)} ‰`, label: t.saldo.world },
        ],
        text: noted(t.saldo.text),
        source: atlasText('balance').source,
      };
    },
    beats: async () => [{ shot: { lon: 60, lat: 40, dist: 3.1 }, drift: 0.9 }],
  },
  {
    id: 'luce',
    mood: 'calm', sound: 'night',
    look: { ...LOOK, atlas: 'electricity', years: [2000, 2024], yearSeconds: 16 },
    duration: 24, clock: 'year', legend: legend('electricity'),
    narrate: async (g) => {
      const a = await atlas(g);
      const without = Array.from(a.slots.keys()).reduce((s, code) => {
        const v = a.value('electricity', code, 2024), p = a.value('population', code, 2024);
        return v == null || !p ? s : s + p * (1 - v / 100);
      }, 0);
      return t.luce.narrate({ then: num(await mean(g, 'electricity', 2000)), now: num(await mean(g, 'electricity', 2024)), without: num(without / 1e6) });
    },
    detail: async (g) => {
      const a = await atlas(g);
      const ranked = Array.from(a.slots.keys()).map((code) => {
        const v = a.value('electricity', code, 2024), p = a.value('population', code, 2024);
        return { name: a.places.get(code)?.name ?? code, n: v == null || !p ? 0 : p * (1 - v / 100) };
      }).sort((x, y) => y.n - x.n);
      return {
        facts: [
          { value: `${num(await mean(g, 'electricity', 2024))}%`, label: t.luce.world },
          { value: t.luce.millions(num(ranked[0].n / 1e6)), label: t.luce.first(ranked[0].name) },
          { value: t.luce.millions(num(ranked[1].n / 1e6)), label: t.luce.second(ranked[1].name) },
        ],
        text: noted(t.luce.text),
        source: atlasText('electricity').source,
      };
    },
    beats: async () => [{ shot: { lon: 22, lat: -2, dist: 2.9 }, drift: 0.8 }],
  },
  {
    id: 'fuga',
    mood: 'grave', sound: 'wind',
    look: { ...LOOK, dim: 0.72, migration: 1, years: [2011, 2024], yearSeconds: 20, bloom: 1.3 },
    duration: 26, clock: 'year',
    legend: legendOf([[0, '#5af2e6'], [0.34, '#5af2e6'], [0.35, '#ff8ccc'], [0.66, '#ff8ccc'], [0.67, '#ffc059'], [1, '#ffc059']], 'asylum'),
    narrate: async (g) => {
      const syr = (await atlas(g)).asylumPeak('SYR');
      return t.fuga.narrate({ year: syr.year, total: num(syr.total) });
    },
    detail: async (g) => {
      const a = await atlas(g);
      const peaks = Object.keys(ORIGINS).map((o) => ({ o, ...a.asylumPeak(o) }));
      return {
        facts: peaks.map((p) => ({ value: num(p.total), label: t.fuga.peak(ORIGINS[p.o].name, p.year) })),
        text: t.fuga.text,
        source: t.fuga.source,
      };
    },
    beats: async () => [{ shot: { lon: 32, lat: 42, dist: 2.4 }, drift: 0.5 }],
  },
]);
