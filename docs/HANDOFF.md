# Upari — passaggio locale 0.4.2

Continuazione dello ZIP originale, base Git `ab609bb`, implementazioni locali `96c26f4` (0.3) e `bf85a66` (0.4), seguite da `eb68b44` (rotazione ambientale 0.4.1) e `a1234ae` (atmosfera/crepuscolo/zoom 0.4.2). Palette nera/turchese e gerarchia approvate conservate: Terra dominante, pannelli su richiesta, ISS inizialmente spenta. **Nessun push o deploy**, per istruzione dell'utente. ZIP, bundle e DELIVERY originali rimangono invariati; documentano 0.2.0, non questa revisione.

| Ambito | Stato corrente |
|---|---|
| Qualità Terra | NASA orbitale ↔ Esri territoriale, atmosfera per frammento Auto/Alta, notte con luci NASA 2016; illuminazione attenuata nel dettaglio. Nessuna nuvola inventata |
| Atmosfera/zoom 0.4.2 | Bordo ellissoidale blu/crepuscolo solare; fotografia log-altitude C2 con attesa tile e blend breve, close-up nativo leggibile. Tinta del terreno scientifico protetta. Un solo ciclo/stage |
| Rotazione | Default 0,08°/s orbitale, circa 75 min/giro; pausa/play e velocità 0,02–1°/s nella barra destra. Rallenta a terra, pausa gesti, movimento ridotto, scena/backup/salvaschermo persistenti |
| Stili | Naturale + Cartoon/Cel/Pixel/Voxel/ASCII/Incisione, intensità regolabile, backup e salvaschermo. Voxel grafico 2D. Palette scientifiche protette in Naturale, anche durante caricamento/fallimento/dissolvenza; avviso negli altri stili |
| Date dei layer | Fonte/data UTC del fotogramma effettivo sempre visibili; due date nel confronto e salvaschermo; Black Marble 2016, Esri e SWISSIMAGE mosaici con anni variabili |
| Playback | Ultime 7 date valide, almeno 1,2 s dopo il commit visibile; conserva il precedente fino al caricamento, pre-carica un solo frame Cesium, dissolve in 320 ms senza schiarire la base; pausa su errori/background, movimento ridotto |
| Venti/correnti | Due pacchetti reali NOAA: ASCAT 10 ottobre 2026, OSCAR storico 26 settembre 2014; griglia 2°, celle assenti mascherate, advezione WGS84, un solo motore Cesium |
| Pipeline | Convertitore ERDDAP standard Python; adattatore CF NetCDF3/4 opzionale verificato su fixture tecniche. OSCAR v2 reale e aggiornamento periodico richiedono download autorizzato |
| Orizzonte | Otto direzioni per luogo, 0–85°, interpolazione circolare; combinato con soglia nel worker e incluso nei backup |
| Diario | Locale, massimo 1000 osservazioni dichiarate, note/esito e contesto; inserimento manuale distinto dalla previsione, scritture atomiche e backup |
| Altri satelliti | Massimo 8 import OMM/TLE locali, identità/epoca validate e stesso worker; nessun nuovo fetch automatico, avvisi esterni riservati alla ISS |
| Fonti regionali | JSON di configurazione pubblica EPSG:3857/256px, senza chiavi; SWISSIMAGE selezionabile con bounds, zoom nativo e crediti |
| Backup | Camera corrente al click anche durante rotazione; snapshot background best-effort senza scritture per frame. v2: preferenze/orizzonti, scena/camera, preferiti, diario, orbite. v1 ancora accettato; whitelist, transazione atomica, 8 MiB; epoche non ringiovanite. Import applica scena e preferenze insieme e ricarica l'orbita attiva |
| Canali | ntfy; bridge personale HA/Gotify/webhook. Segreti server, coda persistente e deduplica. Invio ntfy incerto conservato prima del POST, retry bloccato |
| Offline | Shell di entrambe le pagine, moduli/font/Cesium/vettori; stato cache visibile, aggiornamento in attesa segnalato; tile pubbliche 48 MiB / 120 elementi, Swiss allowlisted |
| Verifica | 91 test JS/TS in 34 file, 6 prove convertitore Python (NetCDF3+4), riferimenti Skyfield/JPL estesi, HTTP loopback e browser mobile/desktop; dettagli in VERIFICATION.md |

## Limiti che rimangono

- Telefono reale: fotocamera/bussola/FOV, entrambi i landscape, permessi negati/revoca, riattivazione e background. Guida manuale e lifecycle automatico verificati, allineamento fisico aperto.
- Canali dell'utente: recapito push, cancellazione remota, pagina chiusa, telefono bloccato e restart del proprio servizio. Nessun endpoint/configurazione reale disponibile, nessun invio live effettuato.
- PWA/hardware: installazione, aggiornamento tra versioni, riapertura con rete realmente disattivata, fullscreen, DPR 2/3 reale, consumo e frame rate su telefono. La shell e i limiti cache sono verificati; non è salvato tutto il pianeta.
- OSCAR v2: adattatore pronto, file reale autenticato non acquisito. Non sostituire il pacchetto 2014 con dati inventati; ottenere accesso nel distributore e seguire VECTORS.md.
- Astronomia: stessi OMM della distribuzione 11 ottobre 2026, 13 casi / 12 finestre su due date iniziali. Non verifica tutte le epoche/stagioni né rifrazione/meteo o osservazioni reali. Dopo 7 giorni le orbite vengono rifiutate; avvisi entro 48 h.
- Rendering: Cesium è circa 4,25 MB minificati / 1,14 MB gzip, warning build noto. Le scie possono essere corte a scala planetaria. Transizioni misurate nel browser locale non certificano prestazioni del telefono.
- Provider regionali nuovi: configurabili, ma condizioni/CORS/precisione devono essere verificati; non entrano automaticamente nella cache allowlisted. WMS/terreno/edifici richiedono adattatori successivi.

## Ripresa visiva 0.4.2

Apri la vista corrente → “Un altro modo di guardare”. La reference iniziale era `kedube/ha-iss-tracker`; per la 0.4.0 sono stati consultati solo README e screenshot pubblici. Per la 0.4.1 l’utente ha autorizzato download e studio del sorgente grafico, con checkout ignorato; metodo/revisione in `REFERENCE_STUDY.md`, nessun codice o asset copiato. Confronto e scelte in `EARTH_STYLES.md`. Browser compilato provato su desktop e 390×844, tutti gli stili esaminati nello sviluppo, Voxel/ASCII anche in salvaschermo. Corretto e riprovato il dettaglio notturno a 12 km. Le prove reali di telefono/canali/PWA sopra restano aperte.

Prompt di ripresa: “Leggi AGENTS.md, HANDOFF.md, VERIFICATION.md, EARTH_STYLES.md e REFERENCE_STUDY.md. Continua da 0.4.2 mantenendo atmosfera/crepuscolo e blend di zoom, rotazione ambientale, pausa/velocità persistenti e la qualità orbitale e il dettaglio leggibile. Verifica iPhone/Android se disponibili e annota le prestazioni effettive. Nessun deploy e nessun invio sui miei canali senza richiesta.”

La 0.4.1 è stata provata nella build desktop, portrait 390×844 e landscape 844×390, controlli 44 px e nessun overflow. Pausa/speed al reload, backup con camera corrente e avvio manuale del salvaschermo confermati. Console senza errori/warning nella QA. La rotazione non è una misura hardware di fps/consumo; queste prove restano aperte.

La 0.4.2 aggiunge prove sulla vista Naturale a 26.350 km, 17.000 km, 3.035 km e 12 km; palette/date/play termico, mobile e un caso con Terra dietro la camera. Nessun errore WebGL osservato. I campioni di cadenza del ciclo sono locali e dipendono dalle viste contemporaneamente attive: non promettere 60 fps sostenuti o prestazioni del telefono.

## Ripresa

Leggere AGENTS.md, VERIFICATION.md, VECTORS.md, REGIONAL_IMAGERY.md e CHANNELS.md. `npm run check`, `npm run test`, `npm run build`; `npm run preview` per la build, `npm run dev` per sviluppo. Test con due worker per evitare contesa CPU; il ricevitore HTTP usa solo loopback. Conservare i riferimenti originali e le regressioni di camera/Cesium/coda.

Prossimo passo consigliato: QA su iPhone/Android e PWA/offline, poi il canale scelto dall'utente. Nessun deploy finché non richiesto. Percorsi guidati, dati scalari interrogabili, WebXR, terreno/edifici e allerte ambientali restano estensioni successive della specifica, non funzioni dichiarate operative.
