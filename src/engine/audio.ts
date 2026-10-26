// Sound: a quiet score under the whole film and an ambience for the chapters that have a
// voice of their own (wind, sea currents, rain, fire). Everything loops by crossfading a
// clip into itself, so the MP3 encoder's padding never makes a gap.

export type Ambience = 'wind' | 'ocean' | 'rain' | 'fire';

const MUSIC = ['audio/music-1.mp3', 'audio/music-2.mp3'];
const AMBIENCE: Record<Ambience, string> = { wind: 'audio/wind.mp3', ocean: 'audio/ocean.mp3', rain: 'audio/rain.mp3', fire: 'audio/fire.mp3' };
const MUSIC_LEVEL = 0.5;
const AMBIENCE_LEVEL = 0.8;
const KEY = 'upari-sound';

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private beds = new Map<Ambience, GainNode>();
  private loading = new Map<Ambience, Promise<void>>();
  private current: Ambience | null = null;
  enabled = true;
  onChange: (enabled: boolean) => void = () => {};

  constructor() {
    try { this.enabled = localStorage.getItem(KEY) !== 'off'; } catch { /* private mode */ }
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (this.enabled) void this.ctx.resume();
    });
  }

  /** Must run inside a click or key press: browsers only allow sound after a gesture. */
  start() {
    if (this.ctx || typeof AudioContext === 'undefined') return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    if (this.enabled) this.fade(this.master.gain, 1, 4);
    else void ctx.suspend();
    const music = ctx.createGain();
    music.gain.value = MUSIC_LEVEL;
    music.connect(this.master);
    // The first piece starts as soon as it arrives; the second joins the rotation later.
    void this.load(MUSIC[0]).then(async (first) => {
      const pieces = [first];
      this.loop(pieces, music, 6);
      pieces.push(await this.load(MUSIC[1]));
    }).catch((err) => console.warn('music unavailable', err));
    if (this.current) this.setAmbience(this.current, true);
  }

  toggle() { this.setEnabled(!this.enabled); }

  setEnabled(v: boolean) {
    this.enabled = v;
    try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch { /* private mode */ }
    if (this.ctx && this.master) {
      if (v) { void this.ctx.resume(); this.fade(this.master.gain, 1, 1.2); }
      else {
        this.fade(this.master.gain, 0, 0.6);
        const ctx = this.ctx;
        window.setTimeout(() => { if (!this.enabled) void ctx.suspend(); }, 700);
      }
    }
    this.onChange(v);
  }

  /** Crossfade to the ambience of what the planet shows now (null: the score alone). */
  setAmbience(id: Ambience | null, force = false) {
    if (id === this.current && !force) return;
    this.current = id;
    if (!this.ctx) return;
    for (const [k, g] of this.beds) this.fade(g.gain, k === id ? AMBIENCE_LEVEL : 0, k === id ? 3 : 2.2);
    if (id && !this.beds.has(id) && !this.loading.has(id)) {
      const ctx = this.ctx;
      const bed = ctx.createGain();
      bed.gain.value = 0;
      bed.connect(this.master!);
      const job = this.load(AMBIENCE[id]).then((buf) => {
        this.beds.set(id, bed);
        this.loop([buf], bed, 3);
        if (this.current === id) this.fade(bed.gain, AMBIENCE_LEVEL, 3);
      }).catch((err) => console.warn(`ambience ${id} unavailable`, err));
      this.loading.set(id, job);
    }
  }

  private async load(url: string): Promise<AudioBuffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return this.ctx!.decodeAudioData(await res.arrayBuffer());
  }

  private fade(p: AudioParam, to: number, seconds: number) {
    const t = this.ctx!.currentTime;
    p.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    p.linearRampToValueAtTime(to, t + seconds);
  }

  /** Plays the clips one after another, each fading into the next; `clips` may grow later. */
  private loop(clips: AudioBuffer[], out: GainNode, xfade: number) {
    const ctx = this.ctx!;
    let i = 0, next = ctx.currentTime + 0.05;
    const queue = () => {
      while (next - ctx.currentTime < 5) {
        const buf = clips[i++ % clips.length];
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        src.connect(g).connect(out);
        const end = next + buf.duration;
        g.gain.setValueAtTime(0, next);
        g.gain.linearRampToValueAtTime(1, next + xfade);
        g.gain.setValueAtTime(1, end - xfade);
        g.gain.linearRampToValueAtTime(0, end);
        src.start(next);
        src.stop(end + 0.05);
        next = end - xfade;
      }
    };
    queue();
    window.setInterval(queue, 1000);
  }
}
