export function time(t: number) { return new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit'}).format(t); }
export function day(t: number) { return new Intl.DateTimeFormat('it-IT',{weekday:'short',day:'numeric',month:'short'}).format(t); }
export function dateLabel(s: string) { return new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(s.length===4?s+'-01-01T12:00:00Z':s+'T12:00:00Z')); }
export function direction(az: number) { return ['nord','nord-est','est','sud-est','sud','sud-ovest','ovest','nord-ovest'][Math.round(((az%360)+360)%360/45)%8]; }
export function duration(a: number,b: number) { const s=Math.max(0,Math.round((b-a)/1000));return `${Math.floor(s/60)} min ${s%60} s`; }
export function utcDate(ms: number) { return new Date(ms).toISOString().slice(0,10); }
export function download(name: string, body: string, type='application/json') { const u=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000); }
