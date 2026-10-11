# Upari

Esplorare la Terra. Ritrovare il cielo.

PWA italiana gratuita e ospitabile come directory statica. Globo con fotografia dettagliata, dieci prodotti NASA, SWISSIMAGE e una pagina salvaschermo autonoma. ISS, guida AR e avvisi sono strumenti opzionali, inizialmente spenti. Luoghi, orizzonti, diario e preferenze rimangono sul dispositivo.

Revisione **0.4.0**, preparata senza deploy come richiesto. Lo stato del sito pubblicato non è stato verificato in questa sessione. Leggere il [passaggio UI/UX](docs/UIUX_PASS_02.md).

**Prima di continuare:** leggere [AGENTS.md](AGENTS.md), [stato del lavoro](docs/HANDOFF.md) e [verifiche](docs/VERIFICATION.md). La verifica nel browser è stata eseguita su mobile e desktop; le prove AR e notifiche su dispositivi e servizi reali restano aperte.

## Qualità visiva 0.4

- Vista Naturale: base NASA dallo spazio, dettaglio Esri avvicinandosi, atmosfera e transizione giorno/notte, luci reali del composito NASA 2016. Nel dettaglio l'illuminazione si attenua per leggere le fotografie.
- Apri la vista corrente → **Un altro modo di guardare**: Naturale, Cartoon, Cel shading, Pixel art, Voxel, ASCII e Incisione. Intensità regolabile; stile conservato nelle viste, nei backup e nel salvaschermo.
- Voxel è un effetto grafico 2D a cubi isometrici. Naturale conserva le palette scientifiche; gli altri stili segnalano i colori modificati. Stelle decorative, senza funzione astronomica.
- [Metodo e limiti del rendering](docs/EARTH_STYLES.md). Nessun deploy. Prestazioni su telefono reale ancora da misurare.

## Nuove funzioni 0.3

- Data e fonte del fotogramma sempre visibili; confronto con due date. Playback con attesa delle tile, precaricamento Cesium limitato e dissolvenza di 320 ms.
- Vento marino ASCAT datato 10 ottobre 2026 e correnti OSCAR storiche del 26 settembre 2014, con velocità reali e celle mancanti. [Metodo, fonti e convertitori](docs/VECTORS.md).
- Orizzonte degli ostacoli: apri il luogo, poi le otto direzioni. Diario accessibile dagli strumenti anche con ISS spenta.
- Satelliti locali: attiva lo strumento, apri ISS → Satellite e importa un file OMM/TLE recente. Gli avvisi restano dedicati alla ISS.
- [Provider regionali configurabili](docs/REGIONAL_IMAGERY.md), SWISSIMAGE incluso, date di acquisizione variabili per zona.
- Backup v2 include scena/camera, diario, orizzonti, preferiti e orbite, senza credenziali; import v1 compatibile.
- [Bridge HA, Gotify e webhook](docs/CHANNELS.md), con coda persistente. Stato della cache e pacchetti offline negli strumenti.

## Avvio locale — ✈️ STE100

Requisito: Node.js 22.12 o successivo, npm, connessione per installare le dipendenze.

1. Estrai lo ZIP.
2. Apri il terminale nella directory `upari`.
3. Esegui `npm ci`.
4. Esegui `npm run build`.
5. Esegui `npm run preview`.
6. Apri l’indirizzo mostrato dal terminale.

Risultato atteso: app e asset Cesium serviti dalla build in `dist`. La build inclusa nello ZIP è già pronta.

Per modificare il codice, esegui `npm run dev`. Il comando copia prima gli asset Cesium in `public/cesium`. Non aprire `index.html` come file locale.

## Hosting HTTPS — ✈️ STE100

1. Copia **il contenuto** di `dist/` nella radice web di un dominio HTTPS.
2. Apri il dominio nel browser.
3. Controlla il caricamento del globo.
4. Apri `Layer` e prova una vista NASA.
5. Apri `Salvaschermo` e controlla la pagina separata.

Risultato atteso: Upari funziona senza backend obbligatorio. Fotocamera e sensori richiedono HTTPS, o localhost durante lo sviluppo. La build usa percorsi assoluti: per ospitare sotto una sottodirectory occorre adattare base URL, manifest, service worker e asset Cesium.

Su iPhone: Safari → Share → Add to Home Screen. Anche senza installazione l’app funziona nel browser.

## Salvaschermo — ✈️ STE100

1. Scegli il layer, la data e lo zoom sulla Terra.
2. Premi `Salvaschermo`.
3. Scegli se mostrare l'ora e il meteo.
4. Premi `Apri salvaschermo`.
5. Nella nuova pagina, premi `Schermo intero` se il browser offre il comando.

Risultato atteso: `screensaver.html` mostra la vista scelta, con rotazione lenta. La pagina funziona anche se chiudi la scheda principale. Tocca o muovi il puntatore per mostrare i controlli. Le opzioni sono salvate nell'indirizzo della pagina; puoi copiarlo e riaprirlo sullo stesso hosting. Il meteo viene richiesto a Open-Meteo solo quando attivato.

Per usare ISS, apri `Strumenti` o le impostazioni e attiva `ISS e osservazione`. Compaiono `ISS` e `Avvisi`. Il comando AR si trova nella sezione ISS, per un passaggio calcolato.

## Verifiche

```sh
npm run check
npm run test
npm run build
```

I test automatici coprono SGP4, Sole/ombra, proiezione del cielo, notifiche/bridge, budget del rendering, migrazione delle preferenze, salvataggio delle viste e validazione dei dati meteo. I trasporti sono verificati con simulazioni e un ricevitore HTTP locale reale; non sono state mandate notifiche all’utente o a terzi. La resa e le interazioni delle due pagine sono state provate nel browser interno; DPR 2 reale, installazione/offline completa e hardware restano da verificare.

## Struttura

- `src/`: app React/TypeScript, UI, adattatori e worker.
- `public/`: manifest, service worker, icone, font e snapshot ISS datato.
- `scripts/`: build e controllo indipendente opzionale Skyfield.
- `bridge/`: scheduler personale Node per Home Assistant/Gotify/webhook; zero dipendenze npm aggiuntive.
- `docs/`: specifica originale, conversazione recuperata, concept scelto, metodo, verifiche e stato.
- `dist/`: build statica pronta, con asset Cesium.
- `screensaver.html`: secondo ingresso della build; non dipende dalla scheda principale.
- `upari-history.bundle`: storia Git trasportabile, quando presente nella consegna.

## Bridge Home Assistant — ✈️ STE100

Requisiti: Node.js 22+, Home Assistant raggiungibile e un reverse proxy HTTPS. Il bridge ascolta solo su localhost per impostazione predefinita.

1. Configura le variabili elencate in `bridge/.env.example` nel tuo service manager.
2. Crea un token bridge casuale di almeno 32 caratteri.
3. Imposta il token Home Assistant nel processo del bridge.
4. Imposta `UPARI_HA_SERVICE` al tuo servizio `notify.mobile_app_*`.
5. Imposta `UPARI_ALLOWED_ORIGIN` all’origine HTTPS di Upari.
6. Esegui `node bridge/server.mjs`.
7. Esponi il bridge tramite il reverse proxy HTTPS.
8. Inserisci l’URL del bridge e il suo token nella sezione `Avvisi` di Upari.
9. Premi `Invia piano al bridge`.

Risultato atteso: il bridge salva il piano e invia gli eventi validi anche a pagina chiusa. Riapri Upari e invia un nuovo piano per aggiornare le successive 48 ore. `UPARI_PRESENCE_ENTITY` e `UPARI_WEATHER_ENTITY` sono filtri facoltativi. Il token HA non entra nel browser.

API bridge: `GET /status`, `PUT /plan`, `DELETE /plan`, con bearer token. Se montato sotto `/upari`, il proxy deve rimuovere il prefisso.

Lo scheduler registra la presa in carico prima dell’invio: evita duplicati dopo un crash, ma può perdere un invio se muore fra la registrazione e la richiesta HTTP. Gli avvisi in ritardo oltre 60 s sono scartati. Non è una promessa di consegna esatta una volta.

## Licenze

Codice originale: MIT. Cesium: Apache-2.0; React, satellite.js, lucide e altre dipendenze conservano le rispettive licenze. I font sono SIL OFL. Dati NASA, orbitali e Esri hanno fonti/attribuzioni proprie. Vedere `docs/SOURCES.md` e `THIRD_PARTY_NOTICES.md`.
