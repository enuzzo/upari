export const earthStyles=[
  {key:'natural',name:'Naturale',description:'La Terra, con atmosfera e profondità.'},
  {key:'cartoon',name:'Cartoon',description:'Colori pieni, luce morbida e un tratto leggero.'},
  {key:'cel',name:'Cel shading',description:'Campiture nette e contorni da illustrazione.'},
  {key:'pixel',name:'Pixel art',description:'Piccoli quadrati e una palette da console.'},
  {key:'voxel',name:'Voxel',description:'Mosaico di cubi isometrici · effetto grafico 2D.'},
  {key:'ascii',name:'ASCII',description:'Il pianeta scritto con caratteri luminosi.'},
  {key:'engraving',name:'Incisione',description:'Carta chiara, inchiostro e tratteggio.'},
] as const;
export type EarthStyle=typeof earthStyles[number]['key'];
export function validEarthStyle(raw:unknown):EarthStyle{return earthStyles.some(s=>s.key===raw)?raw as EarthStyle:'natural';}
/** Blend by altitude, not zoom-button count. Keep all aerial detail at close range. */
export function spaceBlend(height:number){const x=Math.max(0,Math.min(1,(height-1200000)/6800000));return x*x*(3-2*x);}

export function earthStyleName(raw:unknown){return earthStyles.find(s=>s.key===raw)?.name??earthStyles[0].name;}

/** Protect both ends of a crossfade, including a retained frame after a load failure. */
export function naturalGradeAllowed(requested:{regional?:boolean}|null|undefined,displayed:{regional?:boolean}|null|undefined){return (!requested||requested.regional===true)&&(!displayed||displayed.regional===true);}
