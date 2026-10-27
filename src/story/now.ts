import { loadSpots } from '../engine/spots';
import { placeIt, type Quake } from '../engine/markers';
import { climate } from './charts';
import { t } from '../i18n';
import { dayMonth, num } from '../i18n/format';

// "Happening now": the few things of today that deserve a word on the opening title, each
// with the chapter that shows it. Thresholds are ours and deliberately high, so the line is
// quiet on most days.

export interface Happening { text: () => string; story: string; chapter: string; weight: number }

const DAY = 86400e3;

export async function happenings(): Promise<Happening[]> {
  const out: Happening[] = [];
  const jobs: Promise<void>[] = [
    // A hurricane or typhoon still going in the last three days.
    loadSpots('cyclones').then((s) => {
      for (const c of s.data.list as { name: string | null; track: [string, number, number, number | null][] }[]) {
        const last = c.track.at(-1)!;
        const wind = Math.max(...c.track.map((p) => p[3] ?? 0));
        if (Date.now() - Date.parse(last[0]) < 3 * DAY && wind >= 64 && c.name) {
          out.push({ text: () => t.now.cyclone(c.name!, num(wind * 1.852)), story: 'pianeta', chapter: 'tempeste', weight: wind });
        }
      }
    }),
    // A geomagnetic storm (Kp 5 or more).
    fetch('layers/aurora.json').then((r) => r.json()).then((a) => {
      const kp = a.kp?.max24h ?? 0;
      if (kp >= 5) out.push({ text: () => t.now.aurora(num(kp, 0)), story: 'cielo', chapter: 'aurora', weight: 100 + kp * 10 });
    }),
    // An asteroid closer than the Moon within a week.
    climate.neo().then((d) => {
      const o = d.list[0];
      if (o && o.ld < 1 && Date.parse(o.time) - Date.now() < 7 * DAY && Date.parse(o.time) > Date.now() - DAY) {
        out.push({ text: () => t.now.asteroid(o.name, dayMonth(o.time), num(o.ld, 2)), story: 'cielo', chapter: 'passaggi', weight: 150 });
      }
    }),
    // A strong earthquake in the last two days.
    fetch('layers/quakes.json').then((r) => r.json()).then((q) => {
      const top = (q.quakes as Quake[]).filter((e) => Date.now() - e[4] < 2 * DAY).sort((a, b) => b[3] - a[3])[0];
      if (top && top[3] >= 6.3) out.push({ text: () => t.now.quake(num(top[3], 1), placeIt(top[5])), story: 'pianeta', chapter: 'terremoti', weight: 120 + top[3] * 10 });
    }),
    // Voyager 1 about to be one light-day away.
    climate.voyager().then((v) => {
      const d = v.v1.lightDay ? Date.parse(`${v.v1.lightDay}T00:00:00Z`) : NaN;
      if (Math.abs(d - Date.now()) < 10 * DAY) out.push({ text: () => t.now.voyager(dayMonth(v.v1.lightDay)), story: 'cielo', chapter: 'voyager', weight: 90 });
    }),
  ];
  await Promise.allSettled(jobs);
  return out.sort((a, b) => b.weight - a.weight).slice(0, 3);
}
