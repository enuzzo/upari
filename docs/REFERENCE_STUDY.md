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
