import { num } from './format';

// Italiano: il testo originale di Upari. Ogni altra lingua ha la stessa forma (il tipo Dict).
// Le funzioni ricevono numeri e date già formattati nella lingua della pagina, salvo dove
// serve il numero vero (plurali).

const WDI_NOTE = 'Valori annuali originali, senza stime aggiunte da Upari: un paese senza dato per un anno resta grigio. I colori scorrono fra un anno e il successivo; i numeri no. Confini Natural Earth contemporanei, non quelli dell’epoca.';

const it = {
  lang: { name: 'Italiano', locale: 'it-IT', dir: 'ltr' },

  page: {
    title: 'Upari · Il pianeta, adesso',
    description: 'Upari: il pianeta Terra raccontato dai dati satellitari di oggi. Venti, correnti, mari, pioggia, fuochi, ghiaccio, luci e la Stazione Spaziale.',
    globe: 'Il globo terrestre',
    home: 'Torna all’inizio',
    stories: 'Racconti',
    search: 'Cerca un luogo',
    searchKey: 'Cerca un luogo (/)',
    searchCredit: 'Ricerca <a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a> · dati © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    searching: 'Cerco…',
    noPlace: 'Nessun luogo con questo nome.',
    searchDown: 'La ricerca non risponde, riprova tra poco.',
    explore: 'Esplora: strati e controlli',
    exploreKey: 'Esplora (L)',
    audio: 'Audio',
    audioKey: 'Audio (M)',
    audioOn: 'Attiva l’audio',
    audioOff: 'Disattiva l’audio',
    credits: 'Fonti e crediti',
    fullscreen: 'Schermo intero',
    fullscreenKey: 'Schermo intero (F)',
    language: 'Lingua',
    more: 'Scopri di più',
    next: (story: string) => `Continua: ${story}`,
    chapters: 'Capitoli',
    pause: 'Pausa',
    resume: 'Riprendi il racconto',
    zoomIn: 'Avvicina',
    zoomOut: 'Allontana',
    close: 'Chiudi',
    tileCredit: '<a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a> di EOX IT Services GmbH · contiene dati Copernicus Sentinel 2016 e 2017 modificati · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>',
    hint: 'Trascina per ruotare · rotella per avvicinarti · tocca un punto per leggerlo · L per gli strati · / per cercare · M per l’audio',
    intro: 'Il pianeta, raccontato dai suoi dati di oggi.',
    exploreAlone: 'Esplora da solo',
    noWebgl: 'Serve un browser con WebGL 2 per vedere il pianeta.',
    /** The clock in the top bar. */
    clock: (day: string, time: string) => `${day} · ${time} UTC`,
    about: 'Perché Upari',
  },

  stories: { pianeta: 'Il pianeta, adesso', natura: 'La natura', persone: 'Le persone' },

  /** Cardinal letters, for coordinates (45° N, 9° E). */
  compass: { N: 'N', S: 'S', E: 'E', W: 'O' },

  /** Units after a number, where the code writes one. */
  units: { km: 'km', kmh: 'km/h' },

  /** "oggi", "ieri", "il 22 ottobre": the day a layer actually shows. */
  when: { today: 'oggi', yesterday: 'ieri', on: (day: string) => `il ${day}`, recent: 'di recente' },

  station: {
    name: 'Stazione Spaziale',
    panel: 'La Stazione Spaziale, adesso',
    title: 'Stazione Spaziale · ora',
    alt: 'Quota',
    speed: 'Velocità',
    below: 'Sotto',
    light: 'A bordo',
    pos: 'Posizione',
    orbit: 'Orbita',
    day: 'giorno',
    night: 'notte',
    sunsetIn: (min: string) => `tramonto tra ${min} min`,
    sunriseIn: (min: string) => `alba tra ${min} min`,
    orbitOfDay: (n: number) => `${n}ª di oggi`,
  },

  explore: {
    title: 'Esplora',
    year: 'Anno',
    playYears: 'Fai scorrere gli anni',
    reach: 'Raggiungi la Stazione',
    hour: 'Ora',
    now: 'adesso',
    backToNow: 'torna ad adesso',
    hoursFromNow: 'Ore da adesso',
    realLight: 'Luce vera del Sole',
    clouds: 'Nuvole',
    spin: 'Rotazione lenta',
    groups: { planet: 'Il pianeta', nature: 'La natura', people: 'Le persone' },
    layers: {
      adesso: 'La Terra, adesso', venti: 'Venti', correnti: 'Correnti', mare: 'Temperatura del mare',
      anomalia: 'Mare più caldo del solito', plancton: 'Fitoplancton', pioggia: 'Pioggia, ultime 24 ore',
      fuochi: 'Fuochi, ultimi 7 giorni', terremoti: 'Terremoti, ultimi 7 giorni', ghiaccio: 'Ghiaccio marino',
      luci: 'Le luci della notte', stazione: 'Stazione Spaziale',
      verde: 'Vegetazione, mese per mese', foreste: 'Foreste perdute, 2001 – 2024', aria: 'Polveri e fumo nell’aria',
      coralli: 'Calore sulle barriere coralline',
      popolazione: 'Popolazione', nascite: 'Natalità', mortalita: 'Mortalità', saldo: 'Saldo naturale',
      vita: 'Speranza di vita', bambini: 'Mortalità sotto i 5 anni', elettricita: 'Accesso all’elettricità',
      disoccupazione: 'Disoccupazione (stime ILO)', asilo: 'Domande di asilo',
    },
  },

  credits: {
    title: 'Da dove vengono queste immagini',
    intro: 'Tutto quello che vedi è un dato vero. Nessuna immagine è inventata: dove i satelliti non vedono, la mappa sfuma.',
    /** Label, then the source (HTML). */
    items: [
      ['Terra di giorno', 'NASA Blue Marble Next Generation, via NASA GIBS'],
      ['Terra di notte', 'NASA Black Marble, VIIRS 2016, via NASA GIBS'],
      ['Nuvole', 'NASA Visible Earth, composito delle nuvole'],
      ['Rilievo', 'Mapzen Terrain Tiles su AWS: USGS SRTM e GMTED2010, NOAA ETOPO1, EU-DEM Copernicus e altri modelli nazionali'],
      ['Da vicino', '<a href="https://cloudless.eox.at" target="_blank" rel="noopener">EOxCloudless 2016</a> di EOX IT Services GmbH (contiene dati Copernicus Sentinel 2016 e 2017 modificati), <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>'],
      ['Venti', 'NOAA GFS 0,5°, via PacIOOS ERDDAP'],
      ['Correnti', 'OSCAR, ESR / NASA, via NOAA CoastWatch ERDDAP'],
      ['Mare e anomalie', 'GHRSST MUR, NASA JPL, via NASA GIBS'],
      ['Ghiaccio', 'GHRSST GAMSSA, Bureau of Meteorology australiano, via NASA GIBS'],
      ['Fitoplancton', 'NASA PACE OCI, via NASA GIBS'],
      ['Pioggia', 'NASA GPM IMERG, via NASA GIBS'],
      ['Vegetazione', 'NASA VIIRS (Suomi NPP), NDVI mensile, via NASA GIBS'],
      ['Polveri e fumo', 'NASA GMAO MERRA-2, spessore ottico degli aerosol, via NASA GIBS'],
      ['Foreste perdute', 'Hansen et al. 2013, University of Maryland, via Global Forest Watch, CC BY 4.0'],
      ['Barriere coralline', 'NOAA Coral Reef Watch, Degree Heating Week 5 km, via PacIOOS ERDDAP'],
      ['Terremoti', 'USGS Earthquake Hazards Program, feed degli ultimi 7 giorni'],
      ['Fuochi', 'NASA FIRMS, VIIRS NOAA-20'],
      ['Stazione Spaziale', 'elementi orbitali CelesTrak, propagazione SGP4 con satellite.js; modello 3D NASA 3D Resources, ISS (B), di Michael D. Carbajal'],
      ['Stelle', 'Yale Bright Star Catalogue'],
      ['Le persone', 'World Bank, World Development Indicators (con dati ONU World Population Prospects, UN IGME e ILO), CC BY 4.0; domande di asilo UNHCR Refugee Data Portal, CC BY 4.0; confini Natural Earth, pubblico dominio'],
      ['Musica e suoni', 'composti per Upari con Magnific (Google Lyria, ElevenLabs)'],
      ['Ricerca dei luoghi', '<a href="https://nominatim.org" target="_blank" rel="noopener">Nominatim</a>, dati © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, ODbL'],
      ['Traduzioni', 'scritte con l’aiuto di Claude (Anthropic) a partire dal testo italiano'],
    ] as [string, string][],
    foot: 'I dati del giorno si aggiornano ogni mattina. Immagini fornite dai servizi NASA GIBS, parte di NASA ESDIS. Attribuzioni e licenze complete in <a href="THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener">THIRD_PARTY_NOTICES</a>. Upari è un progetto di <a href="https://netmilk.ch" target="_blank" rel="noopener">Netmilk Studio</a>, software libero con licenza Apache 2.0: <a href="https://github.com/enuzzo/upari" target="_blank" rel="noopener">codice sorgente</a>.',
  },

  /** The "Why Upari" page, opened from the copyright line. The English text is the master. */
  about: {
    kicker: 'Perché Upari',
    title: 'Gratis come la pioggia.',
    lead: 'Upari è la Terra com’è adesso. I venti di oggi, il mare di ieri, i fuochi e i terremoti di questa settimana, la Stazione Spaziale che scivola lassù mentre leggi questa riga. Niente è dipinto a mano: quello che vedi l’hanno misurato satelliti e sensori, e l’hanno consegnato a chiunque abbia voglia di guardare. Noi abbiamo solo imparato ad ascoltare.',
    aims: 'L’abbiamo fatto per tre cose, in quest’ordine: stupirti, informarti e farti innamorare perdutamente di questo sasso assurdo, rotante, unico al mondo. In quest’ordine, perché nessuno ha mai difeso qualcosa che lo annoiava.',
    costTitle: 'Quanto costa',
    cost: 'Niente. È gratis, come è gratis la luce del Sole, come è gratis la pioggia, come il vento che stamattina ha attraversato un oceano solo per spettinarti e non ti ha mai mandato una fattura. Niente pubblicità, niente account, nessuno che ti segue.',
    price: 'In cambio chiediamo una cosa sola, e non è poco:',
    child: 'Guardalo con gli occhi di un bambino.',
    warrior: 'Difendilo con il coraggio di un guerriero.',
    both: 'Tutte e due le cose insieme, possibilmente. I bambini non hanno paura, e ogni guerriero è stato bambino.',
    whoTitle: 'Chi siamo',
    who: 'Siamo Netmilk Studio. Facciamo siti per vivere e, ogni tanto, una cosa come questa per nessun’altra ragione che l’amore. Upari è open source con licenza Apache 2.0: smontalo, imparaci, miglioralo. Di pianeti ce n’è uno solo. Il codice, almeno, si può forkare.',
    visit: 'Visita Netmilk Studio',
    source: 'Codice sorgente',
    signoff: 'Fatto sulla Terra.',
  },

  /** Exceptions to the country names of Intl.DisplayNames (alpha-2 codes), and places it has no code for. */
  countries: {} as Record<string, string>,

  /** Where the sea is: "in" is the phrase for a sentence, "name" the bare name. */
  sea: {
    arctic: { in: 'nel Mar Glaciale Artico', name: 'Mar Glaciale Artico' },
    southern: { in: 'nell’Oceano Antartico', name: 'Oceano Antartico' },
    med: { in: 'nel Mediterraneo', name: 'Mediterraneo' },
    red: { in: 'nel Mar Rosso', name: 'Mar Rosso' },
    persian: { in: 'nel Golfo Persico', name: 'Golfo Persico' },
    mexico: { in: 'nel Golfo del Messico', name: 'Golfo del Messico' },
    caribbean: { in: 'nel Mar dei Caraibi', name: 'Mar dei Caraibi' },
    southChina: { in: 'nel Mar Cinese Meridionale', name: 'Mar Cinese Meridionale' },
    indonesia: { in: 'tra le isole dell’Indonesia', name: 'Indonesia' },
    indianSouth: { in: 'nell’Oceano Indiano meridionale', name: 'Oceano Indiano meridionale' },
    indian: { in: 'nell’Oceano Indiano', name: 'Oceano Indiano' },
    atlanticNorth: { in: 'nell’Atlantico del Nord', name: 'Atlantico del Nord' },
    atlanticTropical: { in: 'nell’Atlantico tropicale', name: 'Atlantico tropicale' },
    atlanticSouth: { in: 'nell’Atlantico del Sud', name: 'Atlantico del Sud' },
    atlanticSouthern: { in: 'nell’Atlantico meridionale', name: 'Atlantico meridionale' },
    pacificNorth: { in: 'nel Pacifico del Nord', name: 'Pacifico del Nord' },
    pacificTropical: { in: 'nel Pacifico tropicale', name: 'Pacifico tropicale' },
    pacificSouth: { in: 'nel Pacifico del Sud', name: 'Pacifico del Sud' },
    pacificSouthern: { in: 'nel Pacifico meridionale', name: 'Pacifico meridionale' },
  },

  /** USGS places: "147 km ENE of Lospalos, Timor Leste". */
  quake: {
    distance: (km: string, place: string) => `a ${km} km da ${place}`,
    near: (place: string) => `vicino a ${place}`,
    region: (place: string) => `nella regione ${place}`,
    regions: { sandwich: 'Isole Sandwich Australi', kermadec: 'Isole Kermadec', ridge: 'Dorsale medio-atlantica' },
  },

  /** What the cursor reads on the globe. */
  probe: {
    asylum: (n: string) => `${n} domande di asilo`,
    noAsylum: 'nessuna domanda pubblicata',
    noData: 'nessun dato per quest’anno',
    /** From north, clockwise, every 45°. */
    directions: ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'],
    windFrom: (dir: string) => `vento da ${dir}`,
    waterTo: (dir: string) => `l’acqua scorre verso ${dir}`,
    magnitude: (m: string) => `magnitudo ${m}`,
    quake: (place: string, depthKm: string, ago: string) => `${place} · ${depthKm} km di profondità · ${ago}`,
    lessThanHour: 'meno di un’ora fa',
    hoursAgo: (h: number) => `${h} ore fa`,
    daysAgo: (d: number) => `${d} giorni fa`,
    noQuake: 'nessun terremoto qui',
    noQuakeSub: 'magnitudo 2,5 o più, ultimi 7 giorni',
    fires: (n: number, s: string) => `${s} ${n === 1 ? 'fuoco' : 'fuochi'}`,
    noFire: 'nessun fuoco',
    firesSub: 'entro 150 km, ultimi 7 giorni',
    solarDay: 'ora solare · è giorno',
    solarNight: 'ora solare · è notte',
    solarDusk: 'ora solare · crepuscolo',
  },

  /** Values of the data layers, under the cursor. */
  data: {
    anomaly: (signed: string) => `${signed} °C rispetto al normale`,
    rainTrace: 'pioggia appena percettibile',
    rain: (mm: string) => `${mm} mm di pioggia all’ora`,
    ice: (pct: string) => `ghiaccio al ${pct}%`,
    bare: 'suolo quasi nudo',
    ndvi: (v: string) => `verde ${v} (NDVI)`,
    noStress: 'nessuno stress termico',
    coral: (v: string) => `${v} settimane di calore (°C)`,
    forest: (year: number) => `foresta perduta nel ${year}`,
    aerosol: (v: string) => `aria velata ${v} (AOD)`,
  },

  /** The statistics of the people: legend, value under the cursor, source. */
  atlas: {
    population: {
      title: 'persone', left: '', right: '', source: 'World Bank, World Development Indicators · SP.POP.TOTL (ONU, uffici nazionali, Eurostat)',
      format: (v: number) => (v >= 1e9 ? `${num(v / 1e9, 2)} miliardi` : v >= 1e6 ? `${num(v / 1e6, 1)} milioni` : `${num(v)} persone`),
    },
    birth: {
      title: 'nascite ogni 1.000 abitanti', left: '5', right: '50', source: 'World Bank, World Development Indicators · SP.DYN.CBRT.IN',
      format: (v: number) => `${num(v, 1)} nascite ogni 1.000`,
    },
    death: {
      title: 'decessi ogni 1.000 abitanti', left: '2', right: '30', source: 'World Bank, World Development Indicators · SP.DYN.CDRT.IN',
      format: (v: number) => `${num(v, 1)} decessi ogni 1.000`,
    },
    balance: {
      title: 'nascite meno decessi, ogni 1.000', left: '−10', right: '+40', source: 'World Bank, World Development Indicators · natalità meno mortalità (calcolo Upari)',
      format: (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(v), 1)} ogni 1.000`,
    },
    life: {
      title: 'speranza di vita alla nascita', left: '35 anni', right: '85', source: 'World Bank, World Development Indicators · SP.DYN.LE00.IN',
      format: (v: number) => `${num(v, 1)} anni`,
    },
    under5: {
      title: 'bambini che muoiono prima dei 5 anni, su 1.000', left: '0', right: '300', source: 'UN IGME tramite World Bank WDI · SH.DYN.MORT',
      format: (v: number) => `${num(v)} su 1.000 nati vivi`,
    },
    electricity: {
      title: 'persone con l’elettricità', left: '0%', right: '100%', source: 'World Bank, SDG 7.1.1 · EG.ELC.ACCS.ZS',
      format: (v: number) => `${num(v)}% della popolazione`,
    },
    unemployment: {
      title: 'disoccupazione, stime modellate ILO', left: '0%', right: '30%', source: 'ILO, stime modellate, tramite World Bank WDI · SL.UEM.TOTL.ZS',
      format: (v: number) => `${num(v, 1)}% della forza lavoro`,
    },
  },

  /** Legends of the chapters that are not statistics. */
  legends: {
    wind: { title: 'velocità del vento', left: 'calma', right: '80 km/h' },
    currents: { title: 'velocità della corrente', left: 'lenta', right: '4 km/h' },
    sst: { title: 'temperatura dell’acqua', left: '−2 °C', right: '34 °C' },
    anomaly: { title: 'differenza dalla media', left: '−3 °C', right: '+3 °C' },
    chlorophyll: { title: 'clorofilla in superficie', left: 'acqua limpida', right: 'fioritura' },
    rain: { title: 'intensità della pioggia', left: 'pioviggine', right: 'nubifragio' },
    quakes: { title: 'profondità del terremoto', left: 'in superficie', right: '700 km' },
    ice: { title: 'mare ghiacciato', left: '15%', right: '100%' },
    asylum: { title: 'domande di asilo, per paese d’origine', left: 'Siria · Ucraina', right: 'Afghanistan' },
    ndvi: { title: 'quanto è verde la terra (NDVI)', left: 'suolo nudo', right: 'foresta fitta' },
    forest: { title: 'alberi perduti, per anno', left: 'anni fa', right: 'quest’anno' },
    aerosol: { title: 'quanta luce trattengono le particelle (AOD)', left: 'aria limpida', right: 'aria densa' },
    coral: { title: 'stress termico accumulato', left: '0', right: '20 °C · settimane' },
  },

  // ——— Il pianeta, adesso ———

  pianeta: {
    title: 'Il pianeta', kicker: 'Adesso',
    narrate: 'Questa è la Terra, in questo istante. Metà nel giorno, metà nella notte. La linea d’ombra scivola sull’equatore a 1.670 chilometri all’ora.',
    facts: [
      ['1.670 km/h', 'velocità della rotazione all’equatore'],
      ['8′ 20″', 'il tempo che la luce del Sole impiega ad arrivare qui'],
    ] as [string, string][],
    hour: 'l’ora del globo che vedi: la luce è quella vera',
    text: 'Giorno, notte e crepuscolo sono calcolati per l’istante presente. Le nuvole si spostano seguendo i venti di oggi; le montagne proiettano ombra quando il Sole è basso.',
    source: 'NASA Blue Marble · NASA Black Marble · modello del terreno Mapzen/AWS · venti NOAA GFS',
  },
  respiro: {
    title: 'Il respiro', kicker: 'I venti di oggi',
    narrate: (p: { where: string; kmh: string }) => `L’aria non sta mai ferma. Questi sono i venti di oggi: fiumi invisibili che portano il calore dei tropici verso i poli. Il più forte, adesso, soffia ${p.where} a ${p.kmh} km/h.`,
    strongest: (coords: string) => `il vento più forte del momento, ${coords}`,
    facts: [
      ['10 m', 'l’altezza dal suolo a cui è misurato'],
      ['× 22.000', 'l’accelerazione delle scie, per vederle muovere'],
    ] as [string, string][],
    text: 'Le alte e basse pressioni girano in direzioni opposte nei due emisferi: è la rotazione terrestre a curvare i venti. Tocca un punto per leggere velocità e direzione.',
    source: (time: string) => `Modello NOAA GFS 0,5° · analisi del ${time} UTC`,
    pin: 'il vento più forte, ora',
  },
  correnti: {
    title: 'Le correnti', kicker: 'Fiumi nel mare',
    narrate: 'Sotto le onde, il mare ha i suoi fiumi. La Corrente del Golfo trasporta decine di volte l’acqua di tutti i fiumi della Terra insieme, e porta un po’ di tropico fino in Europa.',
    facts: [
      ['30 milioni', 'metri cubi al secondo nella Corrente del Golfo, al largo della Florida'],
      ['1,2 milioni', 'metri cubi al secondo: tutti i fiumi del mondo messi insieme'],
      ['15 m', 'lo strato d’acqua di superficie rappresentato'],
    ] as [string, string][],
    text: 'Le correnti mostrate sono una giornata di settembre: le grandi correnti cambiano lentamente da un anno all’altro, mentre i vortici al loro bordo nascono e muoiono in poche settimane.',
    source: 'OSCAR · NOAA CoastWatch ERDDAP · 26 settembre 2014, risoluzione 1/3°',
  },
  calore: {
    title: 'Il calore del mare', kicker: 'Un anno di temperatura del mare',
    /** temp is "31,4", or null above 32 °C, where the colour map stops. */
    narrate: (p: { when: string; today: boolean; where: string; temp: string | null }) => `Il mare è il grande termosifone del pianeta. Il punto più caldo, ${p.when}, ${p.today ? 'è' : 'era'} ${p.where}: ${p.temp ?? 'oltre 32'} gradi. Guarda l’acqua calda salire verso nord d’estate e tornare a sud d’inverno: un anno in pochi secondi.`,
    hottest: (when: string, coords: string) => `il mare più caldo ${when}, ${coords}`,
    facts: [
      ['−1,8 °C', 'la temperatura a cui gela l’acqua di mare'],
      ['1 km', 'la risoluzione della mappa originale'],
    ] as [string, string][],
    text: 'L’oceano assorbe più del 90% del calore in eccesso dovuto ai gas serra. Le correnti calde si riconoscono come lingue arancioni che risalgono verso i poli.',
    pin: 'il mare più caldo',
  },
  febbre: {
    title: 'La febbre', kicker: 'Un anno, rispetto al normale',
    narrate: (p: { when: string; today: boolean; pct: string }) => `In rosso il mare più caldo del solito, in blu quello più freddo, mese dopo mese per un anno. ${p.when.charAt(0).toUpperCase() + p.when.slice(1)} ${p.today ? 'è' : 'era'} più caldo della media il ${p.pct}% degli oceani.`,
    share: 'della superficie del mare oltre la media',
    strongest: (where: string) => `l’anomalia più forte, ${where}`,
    over3: 'oltre +3',
    normal: ['2003–2014', 'il periodo che fa da “normale”'] as [string, string],
    text: 'Un’anomalia confronta la temperatura di un giorno con la media dello stesso giorno negli anni di riferimento. Le ondate di calore marine durano settimane e mettono in difficoltà coralli, pesci e praterie sommerse.',
    source: 'GHRSST MUR anomalie, NASA JPL',
    pin: 'l’anomalia più forte',
  },
  fioritura: {
    title: 'Il mare che fiorisce', kicker: 'Un anno di fitoplancton',
    narrate: 'Ogni bagliore verde è una prateria invisibile: miliardi di alghe microscopiche, il fitoplancton. Producono circa metà dell’ossigeno che respiriamo, e fioriscono dove arriva la primavera, prima in un emisfero, poi nell’altro.',
    oxygen: ['≈ 50%', 'dell’ossigeno del pianeta viene dal mare'] as [string, string],
    days: (n: number) => `${n} giorni`,
    daysLabel: 'di osservazioni fusi per togliere le nuvole',
    range: 'milligrammi di clorofilla per metro cubo, dal blu al verde',
    text: 'Le fioriture seguono le stagioni e le acque ricche di nutrienti: lungo le coste, dove l’acqua profonda risale, e in primavera alle alte latitudini. A ottobre è primavera nell’emisfero sud.',
  },
  pioggia: {
    title: 'La pioggia', kicker: 'Ventiquattro ore',
    narrate: 'Un giorno intero di pioggia, in pochi secondi. Lungo l’equatore l’aria calda sale, si raffredda, e restituisce al mare l’acqua che il Sole gli aveva preso.',
    interval: ['30 min', 'tra un’immagine e l’altra della costellazione GPM'] as [string, string],
    hours: '24 ore',
    since: (time: string) => `dal ${time} UTC`,
    yearly: ['≈ 1 m', 'la pioggia che cade in media in un anno su tutto il pianeta'] as [string, string],
    text: (last: string) => `Ogni fotogramma è una stima satellitare della pioggia; fra un’immagine e l’altra le transizioni sono interpolate. Ultimo fotogramma: ${last} UTC.`,
  },
  fuoco: {
    title: 'Il fuoco', kicker: 'Ultimi sette giorni',
    /** thousands is the count in thousands ("98"), approx the same in full ("98.000"). */
    narrate: (p: { thousands: string; approx: string }) => `Ogni scintilla è un incendio visto dallo spazio. In sette giorni i satelliti ne hanno contati più di ${p.thousands} mila. Quasi tutti li accendiamo noi: per pulire i campi, per fare spazio al pascolo.`,
    count: 'punti di calore rilevati in 7 giorni',
    facts: [
      ['375 m', 'la grandezza del pixel che vede il fuoco'],
      ['2 volte', 'al giorno, di giorno e di notte, NOAA‑20 passa su ogni punto'],
    ] as [string, string][],
    text: 'La luminosità di ogni punto è proporzionale alla potenza del fuoco; i più recenti brillano di più. In Africa australe e in Sud America è la stagione degli incendi agricoli.',
    source: (day: string) => `NASA FIRMS · VIIRS NOAA-20 · aggiornato al ${day}`,
  },
  terremoti: {
    title: 'La Terra trema', kicker: 'Ultimi sette giorni',
    narrate: (p: { count: string; mag: string; where: string }) => `In sette giorni la Terra ha tremato ${p.count} volte con magnitudo 2,5 o più: la settimana scorre in pochi secondi. Il più forte, di magnitudo ${p.mag}, ${p.where}. Insieme disegnano i confini delle placche.`,
    count: 'terremoti di magnitudo 2,5 o più negli ultimi 7 giorni',
    strong: 'di magnitudo 5 o più',
    deepest: (where: string) => `il più profondo, ${where}`,
    text: 'Ogni punto è un terremoto, grande quanto la sua magnitudo e colorato secondo la profondità: ambra in superficie, rosa a media profondità, viola fin sotto i 300 km, dove una placca scende sotto l’altra. Fuori dagli Stati Uniti la rete USGS registra soprattutto i terremoti dalla magnitudo 4 in su.',
    source: (day: string) => `USGS Earthquake Hazards Program · aggiornato al ${day}`,
    pin: (mag: string) => `magnitudo ${mag}`,
    pinSub: 'il più forte della settimana',
  },
  ghiaccio: {
    title: 'Il ghiaccio', kicker: 'Un anno ai poli',
    narrate: (p: { when: string; today: boolean; area: string }) => `In cima al mondo il mare gela. ${p.when.charAt(0).toUpperCase() + p.when.slice(1)} il ghiaccio artico ${p.today ? 'copre' : 'copriva'} ${p.area} milioni di chilometri quadrati, e ogni inverno si allarga di un’area più grande dell’Europa. Qui scorre un anno: l’Artico si scioglie mentre l’Antartide gela.`,
    area: (mkm2: string) => `${mkm2} mln km²`,
    arctic: (when: string) => `ghiaccio marino artico, ${when}`,
    antarctic: 'ghiaccio attorno all’Antartide',
    decline: ['−12%', 'per decennio: il calo del minimo estivo artico dal 1979'] as [string, string],
    text: 'La superficie è la somma delle aree con almeno il 15% di ghiaccio, pesata per la concentrazione. Il ghiaccio riflette la luce del Sole: quando si ritira, il mare scuro assorbe più calore.',
    source: 'GHRSST GAMSSA, Bureau of Meteorology · concentrazione del ghiaccio',
  },
  luci: {
    title: 'Le luci', kicker: 'La notte, adesso',
    narrate: 'Quando cala la notte, il pianeta si accende. Queste luci sono il ritratto più fedele di dove viviamo: lungo le coste, i fiumi, le strade.',
    facts: [
      ['≈ 57%', 'dell’umanità vive in città'],
      ['742 m', 'il pixel con cui un satellite fotografa le luci'],
      ['2016', 'l’anno del mosaico notturno, senza nuvole né Luna'],
    ] as [string, string][],
    text: 'Il fiume di luce del Nilo, la ragnatela dell’Europa, le coste del Giappone: le luci raccontano anche ciò che manca, come le grandi foreste e i deserti, quasi bui.',
    source: 'NASA Black Marble · VIIRS 2016',
  },
  lassu: {
    title: 'Lassù', kicker: 'La Stazione Spaziale, ora',
    narrate: (p: { alt: string; speed: string }) => `E lassù, a ${p.alt} chilometri, la Stazione Spaziale gira intorno a tutto questo a ${p.speed} km/h. Un giro completo ogni 92 minuti: sedici albe al giorno.`,
    /** light: is it day on board, and in how many minutes the next sunset or sunrise (null if unknown). */
    arrive: (p: { below: string; day: boolean | null; minutes: string }) => `Questo è ciò che l’equipaggio vede adesso dal finestrino: sotto di loro, ${p.below}.${p.day === null ? '' : p.day ? ` A bordo è giorno: il prossimo tramonto tra ${p.minutes} minuti.` : ` A bordo è notte: la prossima alba tra ${p.minutes} minuti.`}`,
    alt: 'di quota, in questo momento',
    speed: 'circa 7,7 km ogni secondo',
    dawns: ['16', 'albe e tramonti al giorno per l’equipaggio'] as [string, string],
    text: 'La posizione è calcolata ora dagli elementi orbitali pubblicati da CelesTrak. La linea mostra un’orbita completa: mezz’ora nel passato e un’ora nel futuro. Da vicino la stazione vola con il suo vero assetto: i moduli nel senso del moto, la trave perpendicolare all’orbita.',
    source: 'Elementi orbitali NORAD 25544 · CelesTrak · propagazione SGP4 · modello 3D NASA',
  },

  // ——— La natura ———

  verde: {
    title: 'Il respiro verde', kicker: 'Un anno di vegetazione',
    narrate: (p: { hi: string; hiMonth: string; lo: string; loMonth: string }) => `La Terra respira con le stagioni. Fra i 30 e i 65 gradi nord le foglie coprono il ${p.hi}% della terra a ${p.hiMonth}, appena il ${p.lo}% a ${p.loMonth}. Poi il verde passa all’altro emisfero.`,
    dense: (month: string) => `delle terre fra 30° e 65° nord con vegetazione fitta (NDVI oltre 0,5), a ${month}`,
    sparse: (month: string) => `a ${month}`,
    months: (n: number) => `${n} mesi`,
    span: (from: string, to: string) => `da ${from} a ${to}`,
    text: 'L’NDVI confronta la luce rossa, che le foglie assorbono, con l’infrarosso vicino, che riflettono: più è alto, più la vegetazione è fitta e attiva. Ogni fotogramma è la media di un mese; dove le nuvole coprono tutto il mese il valore manca.',
    source: 'NASA VIIRS (Suomi NPP) · NDVI mensile · GIBS',
  },
  foreste: {
    title: 'Le foreste perdute', kicker: 'Copertura arborea perduta, 2001 – 2024',
    narrate: (peak: number) => `Ogni punto è un pezzo di foresta che non c’è più: tagliata, bruciata, trasformata in campo. Brilla l’anno in cui è scomparsa, poi diventa cicatrice. Il ${peak} è stato l’anno peggiore di tutta la serie.`,
    peak: 'l’anno con la perdita più grande dal 2001',
    recent: (from: number, to: number) => `della perdita di tutta la serie è avvenuta negli ultimi cinque anni (${from}–${to})`,
    early: (from: number, to: number) => `nei primi cinque (${from}–${to})`,
    text: 'Perdita di copertura arborea: alberi alti almeno 5 metri spariti da un pixel di 30 metri, per incendio, taglio o malattia. Non distingue la deforestazione dalla gestione forestale né conta la ricrescita. Qui è ridotta a circa 10 km per punto; le quote per anno sono calcolate su questa mappa, ponderate per l’intensità.',
    source: 'Hansen et al. 2013, University of Maryland · Global Forest Watch v1.12 · CC BY 4.0',
  },
  aria: {
    title: 'L’aria', kicker: 'Un anno di polveri e fumo',
    narrate: (p: { where: string; month: string; worst: string }) => `Sabbia del Sahara sull’Atlantico, fumo degli incendi, smog delle città: l’aria trasporta tutto. Nell’ultimo anno il velo più spesso era sopra ${p.where}, a ${p.month}; il mese più torbido del pianeta è stato ${p.worst}.`,
    thickest: (where: string, month: string) => `lo spessore ottico più alto dell’anno: ${where}, ${month}`,
    worst: 'il mese con l’aria più carica, in media sul pianeta',
    wavelength: ['550 nm', 'la lunghezza d’onda della luce verde su cui si misura'] as [string, string],
    text: 'Lo spessore ottico degli aerosol dice quanta luce del Sole viene fermata dalle particelle sospese: 0,1 è aria limpida, oltre 1 il cielo è opaco. Sono stime della rianalisi MERRA-2 della NASA, che fonde satelliti e un modello dell’atmosfera; non distinguono da sole la polvere dal fumo.',
    source: 'NASA GMAO · MERRA-2 · spessore ottico degli aerosol a 550 nm, mensile · GIBS',
  },
  coralli: {
    title: 'Le barriere coralline', kicker: 'Un anno di calore nel mare',
    /** peakMonth is null when the latest month is the worst of the year. */
    narrate: (p: { now: string; peakMonth: string | null; peak: string }) => `Quando il mare resta troppo caldo per settimane, i coralli espellono le alghe che li nutrono e sbiancano. Oggi il ${p.now}% dei mari tropicali è oltre la soglia: ${p.peakMonth ? `nell’ultimo anno il picco è stato a ${p.peakMonth}, con il ${p.peak}%` : 'il valore più alto dell’ultimo anno'}.`,
    alert: 'dei mari tropicali (30° N – 30° S) oltre 4 °C-settimane, dove lo sbiancamento è probabile',
    severe: 'oltre 8, dove molti coralli muoiono',
    worst: (pct: string) => `il mese più critico dell’ultimo anno (${pct}%)`,
    text: 'Le settimane di calore (Degree Heating Weeks) sommano, sulle ultime dodici settimane, quanto l’acqua ha superato la temperatura massima abituale di quel luogo. La misura vale per tutto il mare: le barriere coralline sono solo dove l’acqua è bassa e limpida.',
    source: 'NOAA Coral Reef Watch v3.1 · 5 km · via PacIOOS ERDDAP',
  },

  // ——— Le persone ———

  wdiNote: WDI_NOTE,
  popolazione: {
    title: 'Otto miliardi', kicker: 'Popolazione, 1960 – 2025',
    narrate: (p: { then: string; now: string }) => `Nel 1960 eravamo ${p.then} miliardi. Nel 2025 siamo ${p.now}. Ogni punto di luce è un quarto di milione di persone: si accende dove vivono, anno dopo anno.`,
    billions: (b: string) => `${b} miliardi`,
    total: 'abitanti nel 2025, somma dei 217 territori',
    dot: ['250.000', 'persone per ogni punto di luce'] as [string, string],
    largest: (people: string) => `il paese più popoloso: ${people}`,
    text: 'I punti sono sparsi dentro ogni paese dove di notte ci sono luci (NASA Black Marble): mostrano dove si vive, non indirizzi precisi. Per ogni anno se ne accendono tanti quanti ne servono a contare la popolazione di quell’anno.',
    borders: 'confini Natural Earth',
  },
  nascite: {
    title: 'Si nasce di meno', kicker: 'Natalità, 1960 – 2024',
    narrate: (p: { then: string; now: string; top: string }) => `Nel 1960 nascevano ${p.then} bambini ogni mille persone. Nel 2024, ${p.now}. Il calo è arrivato quasi ovunque; oggi il tasso più alto è in ${p.top}.`,
    world: 'nascite ogni mille abitanti nel mondo, nel 2024 (media pesata sulla popolazione)',
    highest: (country: string) => `il valore più alto, in ${country}`,
    lowest: (country: string) => `il più basso, in ${country}`,
    text: 'Tasso grezzo: dipende anche dall’età della popolazione.',
  },
  vita: {
    title: 'Si vive più a lungo', kicker: 'Speranza di vita, 1960 – 2024',
    narrate: (p: { then: string; now: string }) => `Nel 1960 chi nasceva poteva aspettarsi, in media, ${p.then} anni di vita. Oggi ${p.now}. È una delle grandi conquiste del secolo, e non è finita.`,
    years: (y: string) => `${y} anni`,
    world: 'speranza di vita alla nascita nel mondo, 2024 (media pesata sulla popolazione)',
    highest: (country: string) => `la più alta, a ${country}`,
    lowest: (country: string) => `la più bassa, in ${country}`,
    text: 'Misura di periodo: quanto vivrebbe chi nasce oggi se i rischi di morte per età restassero quelli dell’anno. I crolli improvvisi sono guerre, carestie ed epidemie.',
  },
  bambini: {
    title: 'I bambini', kicker: 'Mortalità sotto i cinque anni, 1960 – 2024',
    /** then is the 1960 value of the same country, when known. */
    narrate: (p: { many: string; top: string; now: string; then: string | null }) => `Nel 1960, in ${p.many} paesi più di un bambino su quattro moriva prima dei cinque anni. Oggi il valore più alto è in ${p.top}: ${p.now} su mille${p.then ? `, erano ${p.then}` : ''}.`,
    then: 'paesi nel 1960 con almeno 250 morti ogni mille nati',
    now: 'paesi nel 2024 con almeno 100 su mille',
    goal: ['SDG 3.2', 'l’obiettivo ONU: non più di 25 su mille entro il 2030'] as [string, string],
    text: 'Stime di periodo UN IGME: non conteggi di decessi, né il destino di un singolo bambino; piccoli scarti non sono differenze certe.',
  },
  saldo: {
    title: 'Il saldo', kicker: 'Nascite meno decessi, 1960 – 2024',
    narrate: (n: string) => `Le nascite meno i decessi. In ${n} paesi, oggi, si muore più di quanto si nasca: in blu, soprattutto in Europa e in Asia orientale. Dove è ambra, la popolazione cresce da sé.`,
    now: 'paesi con più decessi che nascite nel 2024',
    then: 'quanti erano nel 1960',
    world: 'saldo naturale del mondo, nel 2024',
    text: 'Calcolato da Upari come natalità meno mortalità, per lo stesso paese e anno, solo dove ci sono entrambe. Le migrazioni non sono contate: un paese può crescere anche con il saldo negativo.',
  },
  luce: {
    title: 'La luce elettrica', kicker: 'Accesso all’elettricità, 2000 – 2024',
    narrate: (p: { then: string; now: string; without: string }) => `Nel 2000 aveva l’elettricità il ${p.then}% delle persone; oggi il ${p.now}%. Ne restano senza ${p.without} milioni, soprattutto nell’Africa a sud del Sahara.`,
    world: 'delle persone con l’elettricità nel 2024 (media pesata sulla popolazione)',
    millions: (m: string) => `${m} milioni`,
    first: (country: string) => `persone senza elettricità in ${country}`,
    second: (country: string) => `in ${country}`,
    text: 'Accesso da rete, mini-reti o sistemi autonomi: non dice nulla di continuità, qualità o prezzo. Si parte dal 2000 perché prima molti paesi non hanno valori.',
  },
  fuga: {
    title: 'In fuga', kicker: 'Domande di asilo, 2011 – 2024',
    narrate: (p: { year: number; total: string }) => `Chi fugge da Siria, Ucraina e Afghanistan, e il paese dove ha chiesto asilo. La guerra siriana raggiunge il suo culmine nel ${p.year}: ${p.total} domande in un solo anno.`,
    peak: (origin: string, year: number) => `domande dall’origine ${origin}, nel ${year} (anno di picco)`,
    text: 'Domande individuali nuove presentate alle autorità di governo, per paese di presentazione. Solo tre origini: non sono tutte le migrazioni né persone uniche. Dal 2022 la maggior parte di chi lasciava l’Ucraina ha ottenuto nell’Unione europea la protezione temporanea, che non è contata qui. Gli archi uniscono le capitali: sono schematici, non viaggi osservati.',
    source: 'UNHCR, Refugee Data Portal · AsylumApplications, CC BY 4.0',
  },
};

export type Dict = typeof it;
export default it;
