import { num } from './format';
import type { Dict } from './it';

// Français. Les noms de lieux arrivent nus (« Tchad », « Inde », « Philippines »): les petites
// fonctions ci-dessous leur donnent la bonne préposition (au Tchad, en Inde, aux Philippines).

const WDI_NOTE = 'Valeurs annuelles d’origine, sans estimation ajoutée par Upari : un pays sans donnée pour une année reste gris. Les couleurs glissent d’une année à l’autre ; les chiffres, non. Frontières Natural Earth actuelles, et non celles de l’époque.';

const VOWEL = /^[AEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜŒÆaeiouyàâäéèêëîïôöùûüœæ]/;
const vowel = (s: string) => VOWEL.test(s);
/** « de mars », « d’avril ». */
const de = (s: string) => (vowel(s) ? `d’${s}` : `de ${s}`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « 1 novembre » → « 1er novembre ». */
const first = (day: string) => day.replace(/^1(?=\s)/, '1er');
/** « 1,4 milliard », « 8,2 milliards »: le pluriel commence à deux. */
const plural = (n: string, word: string) => (parseFloat(n.replace(/[\s  ]/g, '').replace(',', '.')) < 2 ? word : `${word}s`);

// Le genre d’un nom de pays ou de mer, pour l’article.
const PLURAL = /^(Îles|États-Unis|Émirats|Pays-Bas|Philippines|Maldives|Seychelles|Comores|Bahamas|Fidji|Samoa américaines|Bermudes|Territoires|Terres|Palaos)/;
const BARE = /^(Cuba|Madagascar|Singapour|Monaco|Malte|Chypre|Bahreïn|Maurice|Haïti|Israël|Oman|Djibouti|Taïwan|Hong Kong|Macao|Saint|Sainte|Sao Tomé|Trinité|Antigua|Nauru|Tuvalu|Kiribati|Tonga|Samoa|Porto Rico|Curaçao|Aruba|Guam|Gibraltar|Brunei|Jersey|Guernesey)(?![a-zà-ÿ])/;
const FEMININE = /^(Sierra|République|RD|Mer|Côte)$/;
const MASCULINE = /^(Mexique|Cambodge|Mozambique|Zimbabwe|Belize|Suriname|Golfe|Océan|Pacifique|Atlantique|Royaume|Sud)$/;
type Kind = 'm' | 'f' | 'pl' | 'bare';
function kind(name: string): Kind {
  if (PLURAL.test(name)) return 'pl';
  if (BARE.test(name)) return 'bare';
  const head = name.split(/[\s-]/)[0];
  if (FEMININE.test(head)) return 'f';
  if (MASCULINE.test(head)) return 'm';
  return head.endsWith('e') ? 'f' : 'm';
}
/** « Océan Indien » seul, mais « l’océan Indien » dans une phrase. */
const low = (s: string) => (/^(Océan|Mer|Golfe|Îles|Sud|Dorsale) /.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
/** « la Chine », « l’Inde », « le Tchad », « les Philippines », « Singapour ». */
function the(name: string): string {
  const k = kind(name), n = low(name);
  if (k === 'pl') return `les ${n}`;
  if (k === 'bare') return name;
  return vowel(n) ? `l’${n}` : k === 'm' ? `le ${n}` : `la ${n}`;
}
/** « en Chine », « en Iran », « au Tchad », « aux Philippines », « à Singapour ». */
function inPlace(name: string): string {
  const k = kind(name), n = low(name);
  if (k === 'pl') return `aux ${n}`;
  if (k === 'bare') return `à ${name}`;
  return k === 'f' || vowel(n) ? `en ${n}` : `au ${n}`;
}
/** « de la Chine », « de l’Inde », « du Tchad », « des Philippines », « de Singapour ». */
function of(name: string): string {
  const k = kind(name), n = low(name);
  if (k === 'pl') return `des ${n}`;
  if (k === 'bare') return de(name);
  return vowel(n) ? `de l’${n}` : k === 'm' ? `du ${n}` : `de la ${n}`;
}
/** Une provenance: « de Syrie », « d’Ukraine », « d’Afghanistan », « du Soudan ». */
function from(name: string): string {
  const k = kind(name), n = low(name);
  if (k === 'pl') return `des ${n}`;
  return k === 'm' && !vowel(n) ? `du ${n}` : de(n);
}
/** Les noms USGS restés en anglais n’ont pas d’article français. */
const ENGLISH = /\b(of|the|Sea|Ridge|Rise|Zone|Islands?|Ocean|Gulf|Basin|Coast|Strait|Trench|Peninsula|Southern|Northern|Central|Eastern|Western|East|West|North|South|Fracture|region|California|Hawaii)\b/;

const fr: Dict = {
  lang: { name: 'Français', locale: 'fr-FR', dir: 'ltr' },

  page: {
    title: 'Upari · La planète, en ce moment',
    description: 'Upari : la planète Terre racontée par les données satellitaires du jour. Vents, courants, mers, pluie, feux, glace, lumières et la Station spatiale.',
    globe: 'Le globe terrestre',
    home: 'Retour au début',
    stories: 'Récits',
    search: 'Chercher un lieu',
    searchKey: 'Chercher un lieu (/)',
    searchCredit: 'Recherche <a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a> · données © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    searching: 'Recherche…',
    noPlace: 'Aucun lieu de ce nom.',
    searchDown: 'La recherche ne répond pas. Réessayez dans un instant.',
    explore: 'Explorer : couches et commandes',
    exploreKey: 'Explorer (L)',
    audio: 'Son',
    audioKey: 'Son (M)',
    audioOn: 'Activer le son',
    audioOff: 'Couper le son',
    credits: 'Sources et crédits',
    fullscreen: 'Plein écran',
    fullscreenKey: 'Plein écran (F)',
    language: 'Langue',
    more: 'En savoir plus',
    next: (story: string) => `Suite : ${story}`,
    chapters: 'Chapitres',
    pause: 'Pause',
    resume: 'Reprendre le récit',
    zoomIn: 'Rapprocher',
    zoomOut: 'Éloigner',
    close: 'Fermer',
    tileCredit: '<a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a> par EOX IT Services GmbH · contient des données Copernicus Sentinel 2016 et 2017 modifiées · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>',
    hint: 'Faites glisser pour tourner · molette pour vous approcher · touchez un point pour le lire · L pour les couches · / pour chercher · M pour le son',
    intro: 'La planète, racontée par ses données du jour.',
    exploreAlone: 'Explorer librement',
    noWebgl: 'Il faut un navigateur compatible WebGL 2 pour voir la planète.',
    clock: (day: string, time: string) => `${first(day)} · ${time} UTC`,
    about: 'Pourquoi Upari',
  },

  stories: { pianeta: 'La planète, en ce moment', natura: 'La nature', persone: 'Les humains' },

  compass: { N: 'N', S: 'S', E: 'E', W: 'O' },

  units: { km: 'km', kmh: 'km/h' },

  when: { today: 'aujourd’hui', yesterday: 'hier', on: (day: string) => `le ${first(day)}`, recent: 'récemment' },

  station: {
    name: 'Station spatiale',
    panel: 'La Station spatiale, en ce moment',
    title: 'Station spatiale · maintenant',
    alt: 'Altitude',
    speed: 'Vitesse',
    below: 'En dessous',
    light: 'À bord',
    pos: 'Position',
    orbit: 'Orbite',
    day: 'jour',
    night: 'nuit',
    sunsetIn: (min: string) => `coucher du soleil dans ${min} min`,
    sunriseIn: (min: string) => `lever du soleil dans ${min} min`,
    orbitOfDay: (n: number) => `${n === 1 ? '1re' : `${n}e`} du jour`,
  },

  explore: {
    title: 'Explorer',
    year: 'Année',
    playYears: 'Faire défiler les années',
    reach: 'Rejoindre la Station',
    hour: 'Heure',
    now: 'maintenant',
    backToNow: 'revenir à maintenant',
    hoursFromNow: 'Heures à partir de maintenant',
    realLight: 'Vraie lumière du Soleil',
    clouds: 'Nuages',
    spin: 'Rotation lente',
    groups: { planet: 'La planète', nature: 'La nature', people: 'Les humains' },
    layers: {
      adesso: 'La Terre, en ce moment', venti: 'Vents', correnti: 'Courants', mare: 'Température de la mer',
      anomalia: 'Mer plus chaude que d’habitude', plancton: 'Phytoplancton', pioggia: 'Pluie, dernières 24 heures',
      fuochi: 'Feux, 7 derniers jours', terremoti: 'Séismes, 7 derniers jours', ghiaccio: 'Glace de mer',
      luci: 'Les lumières de la nuit', stazione: 'Station spatiale',
      verde: 'Végétation, mois par mois', foreste: 'Forêts perdues, 2001 – 2024', aria: 'Poussières et fumées dans l’air',
      coralli: 'Chaleur sur les récifs coralliens',
      popolazione: 'Population', nascite: 'Natalité', mortalita: 'Mortalité', saldo: 'Solde naturel',
      vita: 'Espérance de vie', bambini: 'Mortalité avant 5 ans', elettricita: 'Accès à l’électricité',
      disoccupazione: 'Chômage (estimations ILO)', asilo: 'Demandes d’asile',
    },
  },

  credits: {
    title: 'D’où viennent ces images',
    intro: 'Tout ce que vous voyez est une donnée réelle. Aucune image n’est inventée : là où les satellites ne voient pas, la carte s’estompe.',
    items: [
      ['La Terre de jour', 'NASA Blue Marble Next Generation, via NASA GIBS'],
      ['La Terre de nuit', 'NASA Black Marble, VIIRS 2016, via NASA GIBS'],
      ['Nuages', 'NASA Visible Earth, composite des nuages'],
      ['Relief', 'Mapzen Terrain Tiles sur AWS : USGS SRTM et GMTED2010, NOAA ETOPO1, EU-DEM Copernicus et d’autres modèles nationaux'],
      ['De près', '<a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a> par EOX IT Services GmbH (contient des données Copernicus Sentinel 2016 et 2017 modifiées), <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>'],
      ['Vents', 'NOAA GFS 0,5°, via PacIOOS ERDDAP'],
      ['Courants', 'OSCAR, ESR / NASA, via NOAA CoastWatch ERDDAP'],
      ['Mer et anomalies', 'GHRSST MUR, NASA JPL, via NASA GIBS'],
      ['Glace', 'GHRSST GAMSSA, Bureau of Meteorology australien, via NASA GIBS'],
      ['Phytoplancton', 'NASA PACE OCI, via NASA GIBS'],
      ['Pluie', 'NASA GPM IMERG, via NASA GIBS'],
      ['Végétation', 'NASA VIIRS (Suomi NPP), NDVI mensuel, via NASA GIBS'],
      ['Poussières et fumées', 'NASA GMAO MERRA-2, épaisseur optique des aérosols, via NASA GIBS'],
      ['Forêts perdues', 'Hansen et al. 2013, University of Maryland, via Global Forest Watch, CC BY 4.0'],
      ['Récifs coralliens', 'NOAA Coral Reef Watch, Degree Heating Week 5 km, via PacIOOS ERDDAP'],
      ['Séismes', 'USGS Earthquake Hazards Program, flux des 7 derniers jours'],
      ['Feux', 'NASA FIRMS, VIIRS NOAA-20'],
      ['Station spatiale', 'éléments orbitaux CelesTrak, propagation SGP4 avec satellite.js ; modèle 3D NASA 3D Resources, ISS (B), par Michael D. Carbajal'],
      ['Étoiles', 'Yale Bright Star Catalogue'],
      ['Les humains', 'World Bank, World Development Indicators (avec des données ONU World Population Prospects, UN IGME et ILO), CC BY 4.0 ; demandes d’asile UNHCR Refugee Data Portal, CC BY 4.0 ; frontières Natural Earth, domaine public'],
      ['Musique et sons', 'composés pour Upari avec Magnific (Google Lyria, ElevenLabs)'],
      ['Recherche de lieux', '<a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a>, données © les contributeurs d’<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, ODbL'],
      ['Traductions', 'écrites avec l’aide de Claude (Anthropic), à partir du texte italien'],
    ],
    foot: 'Les données du jour sont mises à jour chaque matin. Images fournies par les services NASA GIBS, qui font partie de NASA ESDIS. Attributions et licences complètes dans <a href="THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener">THIRD_PARTY_NOTICES</a>. Upari est un projet de <a href="https://netmilk.ch" target="_blank" rel="noopener">Netmilk Studio</a>, logiciel libre sous licence Apache 2.0 : <a href="https://github.com/enuzzo/upari" target="_blank" rel="noopener">code source</a>.',
  },

  about: {
    kicker: 'Pourquoi Upari',
    title: 'Gratuit comme la pluie.',
    lead: 'Upari, c’est la Terre telle qu’elle est en ce moment. Les vents d’aujourd’hui, la mer d’hier, les feux et les séismes de la semaine, la Station spatiale qui glisse là-haut pendant que vous lisez cette ligne. Rien n’est peint à la main : ce que vous voyez, des satellites et des capteurs l’ont mesuré, puis l’ont offert à quiconque prend la peine de regarder. Nous avons seulement appris à écouter.',
    aims: 'Nous l’avons fait pour trois choses, dans cet ordre : vous émerveiller, vous informer, et vous faire perdre la tête pour ce caillou absurde, tournoyant, unique au monde. Dans cet ordre, parce que personne n’a jamais défendu ce qui l’ennuyait.',
    costTitle: 'Combien ça coûte',
    cost: 'Rien. C’est gratuit, comme la lumière du Soleil est gratuite, comme la pluie est gratuite, comme le vent qui a traversé un océan ce matin rien que pour vous décoiffer, et qui ne vous a jamais envoyé de facture. Pas de publicité, pas de compte, personne qui vous suit à la trace.',
    price: 'En échange, nous ne demandons qu’une chose, et elle n’est pas donnée :',
    child: 'Regardez-la avec des yeux d’enfant.',
    warrior: 'Défendez-la avec un courage de guerrier.',
    both: 'Les deux à la fois, idéalement. Les enfants n’ont peur de rien, et tout guerrier a d’abord été un enfant.',
    whoTitle: 'Qui sommes-nous',
    who: 'Nous sommes Netmilk Studio. Nous faisons des sites web pour gagner notre vie et, de temps en temps, une chose comme celle-ci, sans autre raison que l’amour. Upari est open source, sous licence Apache 2.0 : démontez-le, apprenez de lui, améliorez-le. Des planètes, il n’y en a qu’une. Le code, au moins, on peut le forker.',
    visit: 'Découvrir Netmilk Studio',
    source: 'Code source',
    signoff: 'Fait sur Terre.',
  },

  countries: {
    CD: 'RD Congo', CG: 'République du Congo', CYN: 'Chypre du Nord', SOL: 'Somaliland', HK: 'Hong Kong', MO: 'Macao',
    PS: 'Palestine', VN: 'Vietnam', VC: 'Saint-Vincent-et-les-Grenadines', SX: 'Saint-Martin',
  },

  sea: {
    arctic: { in: 'dans l’océan Arctique', name: 'Océan Arctique' },
    southern: { in: 'dans l’océan Austral', name: 'Océan Austral' },
    med: { in: 'en Méditerranée', name: 'Méditerranée' },
    red: { in: 'dans la mer Rouge', name: 'Mer Rouge' },
    persian: { in: 'dans le golfe Persique', name: 'Golfe Persique' },
    mexico: { in: 'dans le golfe du Mexique', name: 'Golfe du Mexique' },
    caribbean: { in: 'dans la mer des Caraïbes', name: 'Mer des Caraïbes' },
    southChina: { in: 'en mer de Chine méridionale', name: 'Mer de Chine méridionale' },
    indonesia: { in: 'entre les îles de l’Indonésie', name: 'Indonésie' },
    indianSouth: { in: 'dans le sud de l’océan Indien', name: 'Sud de l’océan Indien' },
    indian: { in: 'dans l’océan Indien', name: 'Océan Indien' },
    atlanticNorth: { in: 'dans l’Atlantique Nord', name: 'Atlantique Nord' },
    atlanticTropical: { in: 'dans l’Atlantique tropical', name: 'Atlantique tropical' },
    atlanticSouth: { in: 'dans l’Atlantique Sud', name: 'Atlantique Sud' },
    atlanticSouthern: { in: 'dans l’Atlantique tropical sud', name: 'Atlantique tropical sud' },
    pacificNorth: { in: 'dans le Pacifique Nord', name: 'Pacifique Nord' },
    pacificTropical: { in: 'dans le Pacifique tropical', name: 'Pacifique tropical' },
    pacificSouth: { in: 'dans le Pacifique Sud', name: 'Pacifique Sud' },
    pacificSouthern: { in: 'dans le Pacifique tropical sud', name: 'Pacifique tropical sud' },
  },

  quake: {
    distance: (km: string, place: string) => `à ${km} km ${de(place)}`,
    near: (place: string) => `près ${de(place)}`,
    region: (place: string) => `dans la région ${ENGLISH.test(place) ? de(place) : of(place)}`,
    regions: { sandwich: 'Îles Sandwich du Sud', kermadec: 'Îles Kermadec', ridge: 'Dorsale médio-atlantique' },
  },

  probe: {
    asylum: (n: string) => `${n} ${n === '1' ? 'demande' : 'demandes'} d’asile`,
    noAsylum: 'aucune demande publiée',
    noData: 'aucune donnée pour cette année',
    directions: ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest'],
    windFrom: (dir: string) => (vowel(dir) ? `vent de l’${dir}` : `vent du ${dir}`),
    waterTo: (dir: string) => (vowel(dir) ? `l’eau s’écoule vers l’${dir}` : `l’eau s’écoule vers le ${dir}`),
    magnitude: (m: string) => `magnitude ${m}`,
    quake: (place: string, depthKm: string, ago: string) => `${place} · ${depthKm} km de profondeur · ${ago}`,
    lessThanHour: 'il y a moins d’une heure',
    hoursAgo: (h: number) => `il y a ${h} ${h < 2 ? 'heure' : 'heures'}`,
    daysAgo: (d: number) => `il y a ${d} ${d < 2 ? 'jour' : 'jours'}`,
    noQuake: 'aucun séisme ici',
    noQuakeSub: 'magnitude 2,5 ou plus, 7 derniers jours',
    fires: (n: number, s: string) => `${s} ${n < 2 ? 'feu' : 'feux'}`,
    noFire: 'aucun feu',
    firesSub: 'dans un rayon de 150 km, 7 derniers jours',
    solarDay: 'heure solaire · il fait jour',
    solarNight: 'heure solaire · il fait nuit',
    solarDusk: 'heure solaire · crépuscule',
  },

  data: {
    anomaly: (signed: string) => `${signed} °C par rapport à la normale`,
    rainTrace: 'pluie à peine perceptible',
    rain: (mm: string) => `${mm} mm de pluie par heure`,
    ice: (pct: string) => `${pct} % de glace`,
    bare: 'sol presque nu',
    ndvi: (v: string) => `verdure ${v} (NDVI)`,
    noStress: 'aucun stress thermique',
    coral: (v: string) => `${v} semaines de chaleur (°C)`,
    forest: (year: number) => `forêt perdue en ${year}`,
    aerosol: (v: string) => `air voilé ${v} (AOD)`,
  },

  atlas: {
    population: {
      title: 'habitants', left: '', right: '', source: 'World Bank, World Development Indicators · SP.POP.TOTL (ONU, instituts nationaux, Eurostat)',
      format: (v: number) => {
        if (v >= 1e9) { const n = num(v / 1e9, 2); return `${n} ${plural(n, 'milliard')}`; }
        if (v >= 1e6) { const n = num(v / 1e6, 1); return `${n} ${plural(n, 'million')}`; }
        return `${num(v)} habitants`;
      },
    },
    birth: {
      title: 'naissances pour 1 000 habitants', left: '5', right: '50', source: 'World Bank, World Development Indicators · SP.DYN.CBRT.IN',
      format: (v: number) => `${num(v, 1)} naissances pour 1 000`,
    },
    death: {
      title: 'décès pour 1 000 habitants', left: '2', right: '30', source: 'World Bank, World Development Indicators · SP.DYN.CDRT.IN',
      format: (v: number) => `${num(v, 1)} décès pour 1 000`,
    },
    balance: {
      title: 'naissances moins décès, pour 1 000', left: '−10', right: '+40', source: 'World Bank, World Development Indicators · natalité moins mortalité (calcul d’Upari)',
      format: (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v), 1)} pour 1 000`,
    },
    life: {
      title: 'espérance de vie à la naissance', left: '35 ans', right: '85', source: 'World Bank, World Development Indicators · SP.DYN.LE00.IN',
      format: (v: number) => `${num(v, 1)} ans`,
    },
    under5: {
      title: 'enfants qui meurent avant 5 ans, pour 1 000', left: '0', right: '300', source: 'UN IGME via World Bank WDI · SH.DYN.MORT',
      format: (v: number) => `${num(v)} pour 1 000 naissances vivantes`,
    },
    electricity: {
      title: 'personnes ayant l’électricité', left: '0 %', right: '100 %', source: 'World Bank, SDG 7.1.1 · EG.ELC.ACCS.ZS',
      format: (v: number) => `${num(v)} % de la population`,
    },
    unemployment: {
      title: 'chômage, estimations modélisées de l’ILO', left: '0 %', right: '30 %', source: 'ILO, estimations modélisées, via World Bank WDI · SL.UEM.TOTL.ZS',
      format: (v: number) => `${num(v, 1)} % de la population active`,
    },
  },

  legends: {
    wind: { title: 'vitesse du vent', left: 'calme', right: '80 km/h' },
    currents: { title: 'vitesse du courant', left: 'lent', right: '4 km/h' },
    sst: { title: 'température de l’eau', left: '−2 °C', right: '34 °C' },
    anomaly: { title: 'écart à la moyenne', left: '−3 °C', right: '+3 °C' },
    chlorophyll: { title: 'chlorophylle en surface', left: 'eau claire', right: 'efflorescence' },
    rain: { title: 'intensité de la pluie', left: 'bruine', right: 'déluge' },
    quakes: { title: 'profondeur du séisme', left: 'en surface', right: '700 km' },
    ice: { title: 'mer gelée', left: '15 %', right: '100 %' },
    asylum: { title: 'demandes d’asile, par pays d’origine', left: 'Syrie · Ukraine', right: 'Afghanistan' },
    ndvi: { title: 'verdure des terres (NDVI)', left: 'sol nu', right: 'forêt dense' },
    forest: { title: 'arbres perdus, par année', left: 'il y a des années', right: 'cette année' },
    aerosol: { title: 'lumière retenue par les particules (AOD)', left: 'air limpide', right: 'air chargé' },
    coral: { title: 'stress thermique cumulé', left: '0', right: '20 °C · semaines' },
  },

  // ——— La planète, en ce moment ———

  pianeta: {
    title: 'La planète', kicker: 'En ce moment',
    narrate: 'Voici la Terre, à cet instant précis. Une moitié dans le jour, l’autre dans la nuit. La ligne d’ombre glisse sur l’équateur à 1 670 kilomètres à l’heure.',
    facts: [
      ['1 670 km/h', 'la vitesse de rotation à l’équateur'],
      ['8′ 20″', 'le temps que met la lumière du Soleil pour arriver jusqu’ici'],
    ],
    hour: 'l’heure du globe que vous voyez : la lumière est la vraie',
    text: 'Le jour, la nuit et le crépuscule sont calculés pour l’instant présent. Les nuages se déplacent avec les vents du jour ; les montagnes projettent leur ombre quand le Soleil est bas.',
    source: 'NASA Blue Marble · NASA Black Marble · modèle de terrain Mapzen/AWS · vents NOAA GFS',
  },
  respiro: {
    title: 'Le souffle', kicker: 'Les vents du jour',
    narrate: (p: { where: string; kmh: string }) => `L’air ne reste jamais immobile. Voici les vents d’aujourd’hui : des fleuves invisibles qui emportent la chaleur des tropiques vers les pôles. Le plus fort, en ce moment, souffle ${p.where} à ${p.kmh} km/h.`,
    strongest: (coords: string) => `le vent le plus fort du moment, ${coords}`,
    facts: [
      ['10 m', 'la hauteur au-dessus du sol où il est mesuré'],
      ['× 22 000', 'l’accélération des traînées, pour les voir bouger'],
    ],
    text: 'Les hautes et les basses pressions tournent en sens inverse dans les deux hémisphères : c’est la rotation de la Terre qui courbe les vents. Touchez un point pour lire la vitesse et la direction.',
    source: (time: string) => `Modèle NOAA GFS 0,5° · analyse du ${first(time)} UTC`,
    pin: 'le vent le plus fort, maintenant',
  },
  correnti: {
    title: 'Les courants', kicker: 'Des fleuves dans la mer',
    narrate: 'Sous les vagues, la mer a ses propres fleuves. Le Gulf Stream transporte des dizaines de fois plus d’eau que tous les fleuves de la Terre réunis, et apporte un peu des tropiques jusqu’en Europe.',
    facts: [
      ['30 millions', 'de mètres cubes par seconde dans le Gulf Stream, au large de la Floride'],
      ['1,2 million', 'de mètres cubes par seconde : tous les fleuves du monde réunis'],
      ['15 m', 'la couche d’eau de surface représentée'],
    ],
    text: 'Les courants affichés sont ceux d’une seule journée de septembre : les grands courants changent lentement d’une année à l’autre, tandis que les tourbillons qui les bordent naissent et meurent en quelques semaines.',
    source: 'OSCAR · NOAA CoastWatch ERDDAP · 26 septembre 2014, résolution 1/3°',
  },
  calore: {
    title: 'La chaleur de la mer', kicker: 'Une année de température de la mer',
    narrate: (p: { when: string; today: boolean; where: string; temp: string | null }) => `La mer est le grand radiateur de la planète. Le point le plus chaud, ${p.when}, ${p.today ? 'se trouve' : 'se trouvait'} ${p.where} : ${p.temp ? `${p.temp} degrés` : 'plus de 32 degrés'}. Regardez l’eau chaude monter vers le nord en été et redescendre vers le sud en hiver : une année en quelques secondes.`,
    hottest: (when: string, coords: string) => `la mer la plus chaude ${when}, ${coords}`,
    facts: [
      ['−1,8 °C', 'la température à laquelle l’eau de mer gèle'],
      ['1 km', 'la résolution de la carte d’origine'],
    ],
    text: 'L’océan absorbe plus de 90 % de l’excès de chaleur dû aux gaz à effet de serre. On reconnaît les courants chauds à ces langues orangées qui remontent vers les pôles.',
    pin: 'la mer la plus chaude',
  },
  febbre: {
    title: 'La fièvre', kicker: 'Une année, comparée à la normale',
    narrate: (p: { when: string; today: boolean; pct: string }) => `En rouge, la mer plus chaude que d’habitude ; en bleu, plus froide ; mois après mois, pendant un an. ${cap(p.when)}, ${p.pct} % des océans ${p.today ? 'sont' : 'étaient'} plus chauds que la moyenne.`,
    share: 'de la surface de la mer au-dessus de la moyenne',
    strongest: (where: string) => `l’anomalie la plus forte, ${where}`,
    over3: 'plus de +3',
    normal: ['2003–2014', 'la période qui sert de « normale »'],
    text: 'Une anomalie compare la température d’un jour à la moyenne du même jour sur les années de référence. Les vagues de chaleur marines durent des semaines et mettent à rude épreuve coraux, poissons et herbiers sous-marins.',
    source: 'Anomalies GHRSST MUR, NASA JPL',
    pin: 'l’anomalie la plus forte',
  },
  fioritura: {
    title: 'La mer en fleur', kicker: 'Une année de phytoplancton',
    narrate: 'Chaque lueur verte est une prairie invisible : des milliards d’algues microscopiques, le phytoplancton. Elles produisent environ la moitié de l’oxygène que nous respirons, et fleurissent là où arrive le printemps, d’abord dans un hémisphère, puis dans l’autre.',
    oxygen: ['≈ 50 %', 'de l’oxygène de la planète vient de la mer'],
    days: (n: number) => `${n} ${n < 2 ? 'jour' : 'jours'}`,
    daysLabel: 'd’observations fusionnés pour effacer les nuages',
    range: 'milligrammes de chlorophylle par mètre cube, du bleu au vert',
    text: 'Les efflorescences suivent les saisons et les eaux riches en nutriments : le long des côtes, là où l’eau profonde remonte, et au printemps aux hautes latitudes. En octobre, c’est le printemps dans l’hémisphère Sud.',
  },
  pioggia: {
    title: 'La pluie', kicker: 'Vingt-quatre heures',
    narrate: 'Une journée entière de pluie, en quelques secondes. Le long de l’équateur, l’air chaud monte, se refroidit, et rend à la mer l’eau que le Soleil lui avait prise.',
    interval: ['30 min', 'entre deux images de la constellation GPM'],
    hours: '24 heures',
    since: (time: string) => `depuis le ${first(time)} UTC`,
    yearly: ['≈ 1 m', 'la pluie qui tombe en moyenne en un an sur toute la planète'],
    text: (last: string) => `Chaque image est une estimation satellitaire des précipitations ; les transitions entre deux images sont interpolées. Dernière image : ${last} UTC.`,
  },
  fuoco: {
    title: 'Le feu', kicker: 'Les sept derniers jours',
    narrate: (p: { thousands: string; approx: string }) => `Chaque étincelle est un incendie vu de l’espace. En sept jours, les satellites en ont compté plus de ${p.approx}. Presque tous, c’est nous qui les allumons : pour nettoyer les champs, pour faire place aux pâturages.`,
    count: 'points chauds détectés en 7 jours',
    facts: [
      ['375 m', 'la taille du pixel qui voit le feu'],
      ['2 fois', 'par jour, de jour comme de nuit, NOAA‑20 passe au-dessus de chaque point'],
    ],
    text: 'La luminosité de chaque point est proportionnelle à la puissance du feu ; les plus récents brillent davantage. En Afrique australe et en Amérique du Sud, c’est la saison des brûlis agricoles.',
    source: (day: string) => `NASA FIRMS · VIIRS NOAA-20 · mis à jour le ${first(day)}`,
  },
  terremoti: {
    title: 'La Terre tremble', kicker: 'Les sept derniers jours',
    narrate: (p: { count: string; mag: string; where: string }) => `En sept jours, la Terre a tremblé ${p.count} fois avec une magnitude de 2,5 ou plus : la semaine défile en quelques secondes. Le plus fort, de magnitude ${p.mag}, a frappé ${p.where}. Ensemble, ces séismes dessinent les frontières des plaques.`,
    count: 'séismes de magnitude 2,5 ou plus au cours des 7 derniers jours',
    strong: 'de magnitude 5 ou plus',
    deepest: (where: string) => `le plus profond, ${where}`,
    text: 'Chaque point est un séisme, aussi grand que sa magnitude et coloré selon sa profondeur : ambre en surface, rose à profondeur moyenne, violet au-delà de 300 km, là où une plaque plonge sous une autre. Hors des États-Unis, le réseau de l’USGS enregistre surtout les séismes de magnitude 4 et plus.',
    source: (day: string) => `USGS Earthquake Hazards Program · mis à jour le ${first(day)}`,
    pin: (mag: string) => `magnitude ${mag}`,
    pinSub: 'le plus fort de la semaine',
  },
  ghiaccio: {
    title: 'La glace', kicker: 'Une année aux pôles',
    narrate: (p: { when: string; today: boolean; area: string }) => `Au sommet du monde, la mer gèle. ${cap(p.when)}, la banquise arctique ${p.today ? 'couvre' : 'couvrait'} ${p.area} ${plural(p.area, 'million')} de kilomètres carrés, et chaque hiver elle gagne une surface plus grande que l’Europe. Ici défile une année : l’Arctique fond pendant que l’Antarctique gèle.`,
    area: (mkm2: string) => `${mkm2} M km²`,
    arctic: (when: string) => `banquise arctique, ${when}`,
    antarctic: 'glace autour de l’Antarctique',
    decline: ['−12 %', 'par décennie : le recul du minimum estival arctique depuis 1979'],
    text: 'La superficie est la somme des zones couvertes d’au moins 15 % de glace, pondérée par la concentration. La glace renvoie la lumière du Soleil : quand elle recule, la mer sombre absorbe davantage de chaleur.',
    source: 'GHRSST GAMSSA, Bureau of Meteorology · concentration de la glace',
  },
  luci: {
    title: 'Les lumières', kicker: 'La nuit, en ce moment',
    narrate: 'Quand la nuit tombe, la planète s’allume. Ces lumières sont le portrait le plus fidèle des lieux où nous vivons : le long des côtes, des fleuves, des routes.',
    facts: [
      ['≈ 57 %', 'de l’humanité vit en ville'],
      ['742 m', 'le pixel avec lequel un satellite photographie les lumières'],
      ['2016', 'l’année de la mosaïque nocturne, sans nuages ni Lune'],
    ],
    text: 'Le fleuve de lumière du Nil, la toile de l’Europe, les côtes du Japon : les lumières racontent aussi ce qui manque, comme les grandes forêts et les déserts, presque obscurs.',
    source: 'NASA Black Marble · VIIRS 2016',
  },
  lassu: {
    title: 'Là-haut', kicker: 'La Station spatiale, maintenant',
    narrate: (p: { alt: string; speed: string }) => `Et là-haut, à ${p.alt} kilomètres, la Station spatiale tourne autour de tout cela à ${p.speed} km/h. Un tour complet toutes les 92 minutes : seize levers de soleil par jour.`,
    arrive: (p: { below: string; day: boolean | null; minutes: string }) => `Voici ce que l’équipage voit en ce moment par le hublot : juste en dessous, ${the(p.below)}.${p.day === null ? '' : p.day ? ` À bord, il fait jour : prochain coucher de soleil dans ${p.minutes} minutes.` : ` À bord, il fait nuit : prochain lever de soleil dans ${p.minutes} minutes.`}`,
    alt: 'd’altitude, en ce moment',
    speed: 'environ 7,7 km par seconde',
    dawns: ['16', 'levers et couchers de soleil par jour pour l’équipage'],
    text: 'La position est calculée à l’instant à partir des éléments orbitaux publiés par CelesTrak. La ligne montre une orbite complète : une demi-heure dans le passé et une heure dans le futur. De près, la station vole dans sa véritable attitude : les modules dans le sens du mouvement, la poutre perpendiculaire à l’orbite.',
    source: 'Éléments orbitaux NORAD 25544 · CelesTrak · propagation SGP4 · modèle 3D NASA',
  },

  // ——— La nature ———

  verde: {
    title: 'Le souffle vert', kicker: 'Une année de végétation',
    narrate: (p: { hi: string; hiMonth: string; lo: string; loMonth: string }) => `La Terre respire au rythme des saisons. Entre 30 et 65 degrés nord, les feuilles couvrent ${p.hi} % des terres en ${p.hiMonth}, à peine ${p.lo} % en ${p.loMonth}. Puis le vert passe dans l’autre hémisphère.`,
    dense: (month: string) => `des terres entre 30° et 65° nord couvertes d’une végétation dense (NDVI supérieur à 0,5), en ${month}`,
    sparse: (month: string) => `en ${month}`,
    months: (n: number) => `${n} mois`,
    span: (from: string, to: string) => `${de(from)} à ${to}`,
    text: 'Le NDVI compare la lumière rouge, que les feuilles absorbent, au proche infrarouge, qu’elles réfléchissent : plus il est élevé, plus la végétation est dense et active. Chaque image est la moyenne d’un mois ; là où les nuages couvrent tout le mois, la valeur manque.',
    source: 'NASA VIIRS (Suomi NPP) · NDVI mensuel · GIBS',
  },
  foreste: {
    title: 'Les forêts perdues', kicker: 'Couvert arboré perdu, 2001 – 2024',
    narrate: (peak: number) => `Chaque point est un morceau de forêt qui n’existe plus : coupé, brûlé, changé en champ. Il brille l’année de sa disparition, puis devient cicatrice. L’année ${peak} a été la pire de toute la série.`,
    peak: 'l’année de la plus grande perte depuis 2001',
    recent: (from: number, to: number) => `de la perte de toute la série s’est produite au cours des cinq dernières années (${from}–${to})`,
    early: (from: number, to: number) => `au cours des cinq premières (${from}–${to})`,
    text: 'Perte de couvert arboré : des arbres d’au moins 5 mètres disparus d’un pixel de 30 mètres, par incendie, coupe ou maladie. Elle ne distingue pas la déforestation de la gestion forestière et ne compte pas la repousse. Ici, elle est réduite à environ 10 km par point ; les parts annuelles sont calculées sur cette carte, pondérées par l’intensité.',
    source: 'Hansen et al. 2013, University of Maryland · Global Forest Watch v1.12 · CC BY 4.0',
  },
  aria: {
    title: 'L’air', kicker: 'Une année de poussières et de fumées',
    narrate: (p: { where: string; month: string; worst: string }) => `Sable du Sahara au-dessus de l’Atlantique, fumée des incendies, smog des villes : l’air transporte tout. Au cours de la dernière année, le voile le plus épais flottait au-dessus ${of(p.where)}, en ${p.month} ; pour la planète entière, le mois le plus trouble a été celui ${de(p.worst)}.`,
    thickest: (where: string, month: string) => `l’épaisseur optique la plus forte de l’année : ${where}, ${month}`,
    worst: 'le mois où l’air a été le plus chargé, en moyenne sur la planète',
    wavelength: ['550 nm', 'la longueur d’onde de la lumière verte à laquelle on la mesure'],
    text: 'L’épaisseur optique des aérosols indique quelle part de la lumière du Soleil est arrêtée par les particules en suspension : à 0,1, l’air est limpide ; au-delà de 1, le ciel est opaque. Ce sont des estimations de la réanalyse MERRA-2 de la NASA, qui combine satellites et modèle de l’atmosphère ; à elles seules, elles ne distinguent pas la poussière de la fumée.',
    source: 'NASA GMAO · MERRA-2 · épaisseur optique des aérosols à 550 nm, mensuelle · GIBS',
  },
  coralli: {
    title: 'Les récifs coralliens', kicker: 'Une année de chaleur dans la mer',
    narrate: (p: { now: string; peakMonth: string | null; peak: string }) => `Quand la mer reste trop chaude pendant des semaines, les coraux expulsent les algues qui les nourrissent et blanchissent. Aujourd’hui, ${p.now} % des mers tropicales dépassent le seuil : ${p.peakMonth ? `au cours de la dernière année, le pic a été atteint en ${p.peakMonth}, avec ${p.peak} %` : 'c’est la valeur la plus haute de la dernière année'}.`,
    alert: 'des mers tropicales (30° N – 30° S) au-delà de 4 °C-semaines, seuil où le blanchissement devient probable',
    severe: 'au-delà de 8, de nombreux coraux meurent',
    worst: (pct: string) => `le mois le plus critique de la dernière année (${pct} %)`,
    text: 'Les semaines de chaleur (Degree Heating Weeks) additionnent, sur les douze dernières semaines, l’écart entre l’eau et la température maximale habituelle de l’endroit. La mesure couvre toute la mer : les récifs coralliens ne se trouvent que là où l’eau est peu profonde et limpide.',
    source: 'NOAA Coral Reef Watch v3.1 · 5 km · via PacIOOS ERDDAP',
  },

  // ——— Les humains ———

  wdiNote: WDI_NOTE,
  popolazione: {
    title: 'Huit milliards', kicker: 'Population, 1960 – 2025',
    narrate: (p: { then: string; now: string }) => `En 1960, nous étions ${p.then} ${plural(p.then, 'milliard')}. En 2025, nous sommes ${p.now}. Chaque point de lumière représente un quart de million de personnes : il s’allume là où elles vivent, année après année.`,
    billions: (b: string) => `${b} ${plural(b, 'milliard')}`,
    total: 'habitants en 2025, somme des 217 territoires',
    dot: ['250 000', 'personnes pour chaque point de lumière'],
    largest: (people: string) => `le pays le plus peuplé : ${people}`,
    text: 'Les points sont répartis à l’intérieur de chaque pays, là où il y a des lumières la nuit (NASA Black Marble) : ils montrent où l’on vit, pas des adresses précises. Chaque année, il s’en allume autant qu’il en faut pour compter la population de cette année-là.',
    borders: 'frontières Natural Earth',
  },
  nascite: {
    title: 'Moins de naissances', kicker: 'Natalité, 1960 – 2024',
    narrate: (p: { then: string; now: string; top: string }) => `En 1960, il naissait ${p.then} enfants pour mille habitants. En 2024, ${p.now}. La baisse a gagné presque tous les pays ; aujourd’hui, le taux le plus élevé se trouve ${inPlace(p.top)}.`,
    world: 'naissances pour mille habitants dans le monde, en 2024 (moyenne pondérée par la population)',
    highest: (country: string) => `le taux le plus élevé, ${inPlace(country)}`,
    lowest: (country: string) => `le plus bas, ${inPlace(country)}`,
    text: 'Taux brut : il dépend aussi de l’âge de la population.',
  },
  vita: {
    title: 'Des vies plus longues', kicker: 'Espérance de vie, 1960 – 2024',
    narrate: (p: { then: string; now: string }) => `En 1960, un nouveau-né pouvait espérer vivre, en moyenne, ${p.then} ans. Aujourd’hui, ${p.now}. C’est l’une des grandes conquêtes du siècle, et elle n’est pas finie.`,
    years: (y: string) => `${y} ans`,
    world: 'espérance de vie à la naissance dans le monde, 2024 (moyenne pondérée par la population)',
    highest: (country: string) => `la plus élevée, ${inPlace(country)}`,
    lowest: (country: string) => `la plus basse, ${inPlace(country)}`,
    text: 'Mesure du moment : combien de temps vivrait un enfant né aujourd’hui si les risques de décès à chaque âge restaient ceux de l’année. Les chutes soudaines sont des guerres, des famines et des épidémies.',
  },
  bambini: {
    title: 'Les enfants', kicker: 'Mortalité avant cinq ans, 1960 – 2024',
    narrate: (p: { many: string; top: string; now: string; then: string | null }) => `En 1960, dans ${p.many} pays, plus d’un enfant sur quatre mourait avant l’âge de cinq ans. Aujourd’hui, le taux le plus élevé se trouve ${inPlace(p.top)} : ${p.now} pour mille${p.then ? `, contre ${p.then} en 1960` : ''}.`,
    then: 'pays en 1960 avec au moins 250 décès pour mille naissances',
    now: 'pays en 2024 avec au moins 100 pour mille',
    goal: ['ODD 3.2', 'l’objectif de l’ONU : pas plus de 25 pour mille d’ici 2030'],
    text: 'Estimations du moment de l’UN IGME : ni des décomptes de décès, ni le destin d’un enfant en particulier ; de petits écarts ne sont pas des différences certaines.',
  },
  saldo: {
    title: 'Le solde', kicker: 'Naissances moins décès, 1960 – 2024',
    narrate: (n: string) => `Les naissances moins les décès. Dans ${n} pays, aujourd’hui, on meurt plus qu’on ne naît : en bleu, surtout en Europe et en Asie de l’Est. Là où c’est ambre, la population croît d’elle-même.`,
    now: 'pays avec plus de décès que de naissances en 2024',
    then: 'combien ils étaient en 1960',
    world: 'le solde naturel du monde, en 2024',
    text: 'Calculé par Upari comme la natalité moins la mortalité, pour un même pays et une même année, seulement là où les deux existent. Les migrations ne sont pas comptées : un pays peut croître même avec un solde négatif.',
  },
  luce: {
    title: 'La lumière électrique', kicker: 'Accès à l’électricité, 2000 – 2024',
    narrate: (p: { then: string; now: string; without: string }) => `En 2000, ${p.then} % des habitants de la planète avaient l’électricité ; aujourd’hui, ${p.now} %. Il reste ${p.without} ${plural(p.without, 'million')} de personnes sans courant, surtout en Afrique subsaharienne.`,
    world: 'des personnes ayant l’électricité en 2024 (moyenne pondérée par la population)',
    millions: (m: string) => `${m} ${plural(m, 'million')}`,
    first: (country: string) => `personnes sans électricité ${inPlace(country)}`,
    second: (country: string) => inPlace(country),
    text: 'Accès par le réseau, des mini-réseaux ou des systèmes autonomes : cela ne dit rien de la continuité, de la qualité ni du prix. On part de 2000, car avant cette date beaucoup de pays n’ont pas de valeurs.',
  },
  fuga: {
    title: 'L’exil', kicker: 'Demandes d’asile, 2011 – 2024',
    narrate: (p: { year: number; total: string }) => `Ceux qui fuient la Syrie, l’Ukraine et l’Afghanistan, et le pays où ils ont demandé l’asile. La guerre en Syrie atteint son paroxysme en ${p.year} : ${p.total} demandes en une seule année.`,
    peak: (origin: string, year: number) => `demandes en provenance ${from(origin)}, en ${year} (année record)`,
    text: 'Nouvelles demandes individuelles déposées auprès des autorités, par pays de dépôt. Trois origines seulement : ce ne sont ni toutes les migrations, ni des personnes uniques. Depuis 2022, la plupart des personnes qui ont quitté l’Ukraine ont obtenu dans l’Union européenne la protection temporaire, qui n’est pas comptée ici. Les arcs relient les capitales : ils sont schématiques, ce ne sont pas des trajets observés.',
    source: 'UNHCR, Refugee Data Portal · AsylumApplications, CC BY 4.0',
  },
};

export default fr;
