// Sound: one score in four moods, and an ambience for every chapter. The moods share key
// and instruments (C minor / E-flat major, piano, pads, strings), so passing from one to the
// next is a slow crossfade, never a cut. Everything loops by crossfading a clip into itself,
// so the MP3 encoder's padding never makes a gap.

export type Ambience = 'wind' | 'ocean' | 'rain' | 'fire' | 'forest' | 'waves' | 'reef' | 'quake' | 'ice' | 'night' | 'station' | 'desert' | 'city' | 'sky';
export type Mood = 'calm' | 'grave' | 'curious' | 'open';

const MUSIC: Record<Mood, string[]> = {
  calm: ['audio/music-1.mp3', 'audio/music-2.mp3'],
  grave: ['audio/music-grave.mp3'],
  curious: ['audio/music-curious.mp3'],
  open: ['audio/music-open.mp3'],
};
const MUSIC_LEVEL = 0.5;
const AMBIENCE_LEVEL = 0.55;
const MOOD_FADE = 7;
const KEY = 'upari-sound';

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private moods = new Map<Mood, GainNode>();
  private moodLoading = new Set<Mood>();
  private beds = new Map<Ambience, GainNode>();
  private loading = new Map<Ambience, Promise<void>>();
  private current: Ambience | null = null;
  private mood: Mood = 'calm';
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
    this.startMood(this.mood, true);
    if (this.current) this.setAmbience(this.current, true);
    // The other moods arrive in the background, so later changes are immediate.
    window.setTimeout(() => (['curious', 'open', 'grave'] as Mood[]).forEach((m) => this.startMood(m, false)), 15000);
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

  /** The feeling of the score: the same theme, darker, questioning or released. */
  setMood(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    if (!this.ctx) return;
    this.startMood(mood, false);
    for (const [m, g] of this.moods) this.fade(g.gain, m === mood ? MUSIC_LEVEL : 0, MOOD_FADE);
  }

  /** Load a mood and keep it looping (silent until chosen). */
  private startMood(mood: Mood, audible: boolean) {
    if (!this.ctx || this.moods.has(mood) || this.moodLoading.has(mood)) return;
    this.moodLoading.add(mood);
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0;
    // The grave mood sits a little lower in the spectrum: a gentle low-pass darkens it.
    if (mood === 'grave') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1500;
      lp.Q.value = 0.4;
      bus.connect(lp).connect(this.master!);
    } else bus.connect(this.master!);
    void (async () => {
      const files = MUSIC[mood];
      const first = await this.load(files[0]);
      const pieces = [first];
      this.moods.set(mood, bus);
      this.loop(pieces, bus, 6);
      if (this.mood === mood) this.fade(bus.gain, MUSIC_LEVEL, audible ? 3 : MOOD_FADE);
      for (const f of files.slice(1)) pieces.push(await this.load(f));
    })().catch((err) => { this.moodLoading.delete(mood); console.warn(`music ${mood} unavailable`, err); });
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
      const job = this.load(`audio/${id}.mp3`).then((buf) => {
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
