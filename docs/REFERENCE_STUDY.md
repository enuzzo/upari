# Studio grafico della reference — 0.4.1

L’utente ha autorizzato download e lettura della repository originale [kedube/ha-iss-tracker](https://github.com/kedube/ha-iss-tracker). Checkout shallow locale in `.references/ha-iss-tracker`, escluso da Git e dalla build; revisione studiata **cd6b9e286031dd2d10def64047224cb48038b6d4**, ramo main, licenza GPL-3.0. Nessun codice o asset del progetto è stato copiato nell’implementazione MIT di Upari; nessuna installazione delle sue dipendenze o avvio dell’app.

| Osservazione nel sorgente grafico | Scelta per Upari |
|---|---|
| `frontend/iss-globe.js`, `_buildStyle`: Blue Marble orbitale dissolve tra zoom 5 e 6,5; dettaglio da zoom 4,4 | Conferma del passaggio continuo tra immagine orbitale e dettaglio, già implementato nella 0.4.0; Cesium usa quote, non gli stessi zoom MapLibre |
| Cielo blu scuro, fog/horizon e atmosfera che si attenua avvicinandosi | Conservare il volume e un bordo discreto dallo spazio, alleggerendo l’effetto vicino al terreno |
| `frontend/iss-space.js`, `NIGHT_FRAGMENT`: maschera notte/crepuscolo riferita al Sole; immagine equirettangolare delle luci 2016, cache e fallback NASA GIBS WMS | Upari conserva Sole Cesium, composito NASA 2016 dichiarato e tile GIBS, senza copiare shader o texture |
| Pianificazione dei frame e posizioni ISS nella vista | Upari usa il suo unico ciclo Cesium, rotazione ambientale adattiva e pausa sui gesti. Non si assume che la reference abbia lo stesso movimento di default |

Le scelte grafiche della 0.4.0 precedono questo studio. Spunti futuri: confrontare la leggibilità del crepuscolo a diverse quote e calibrare la transizione fotografica su coste/deserti/neve, con scene fisse e confronto visivo. Non sono dichiarati nuovi effetti già implementati né una replica esatta della reference.

## Isolamento dei test

Il primo comando Vitest dopo il download ha scoperto per errore anche le suite `node:test` della reference: il solo `.gitignore` non basta a impedirlo. Sono state eseguite durante quella scoperta, con quattro errori di suite non riconosciute da Vitest; nessun loro server o processo applicativo è stato avviato. L’incidente è stato comunicato e corretto: `vite.config.ts` ammette ora soltanto i test di `src/`, `bridge/` e `scripts/` di Upari. Il giro finale **88/88 in 33 file** esclude il checkout. Non eseguire volontariamente script della reference nelle prossime sessioni.


## Applicazione degli spunti — 0.4.2

| Spunto / differenza | Intervento originale e prova |
|---|---|
| Reference: transizione continua nello zoom, atmosfera che si attenua vicino al terreno | Quota logaritmica C2 tra 1.200 e 8.000 km, attesa delle tile e blend breve nel ciclo Cesium; prova intermedia a 3.035 km e dettaglio a 12 km |
| Reference: notte/crepuscolo dal Sole, glow contenuto | Bordo esterno con distanza del raggio dall’ellissoide in metri, contributi blu e ambra angolari; quadro orbitale e zoom out 26.350 km, offset Sole 0 e −6 h |
| Reference MapLibre vs Upari Cesium | Native scattering mantenuto e calibrato; nessun morph 2D, nessun shader/texture copiato. Il postprocess originale rimane una sola passata |
| Differenza rispetto alla 0.4.1 | Meno tinta nel dettaglio, transizione distribuita lungo lo zoom, ripresa dal background senza recupero brusco; guard scientifico anche sulla tinta nativa del terreno |

Confronto locale con copia della build precedente in `/private/tmp/upari-qa/baseline-041`, servita solo su loopback 4176. Camera identica e offset Sole 0, orologio reale (nessun confronto pixel esatto). Le scene del salvaschermo sono lette al caricamento: quando si sostituisce un frammento nella stessa scheda, ricaricare prima del confronto. La prima cattura con la vecchia scena è stata scartata e sostituita. Screenshot/misure e limiti in VERIFICATION.md. Fonti tecniche primarie in EARTH_STYLES.md.
