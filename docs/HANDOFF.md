# Upari — passaggio locale 0.3.0

Continuazione dello ZIP originale, base Git `ab609bb`, implementazione locale `96c26f4`. Palette nera/turchese e gerarchia approvate conservate: Terra dominante, pannelli su richiesta, ISS inizialmente spenta. **Nessun push o deploy**, per istruzione dell'utente. ZIP, bundle e DELIVERY originali rimangono invariati; documentano 0.2.0, non questa revisione.

| Ambito | Stato 0.3.0 |
|---|---|
| Date dei layer | Fonte/data UTC del fotogramma effettivo sempre visibili; due date nel confronto e salvaschermo; Black Marble 2016, Esri e SWISSIMAGE mosaici con anni variabili |
| Playback | Ultime 7 date valide, almeno 1,2 s dopo il commit visibile; conserva il precedente fino al caricamento, pre-carica un solo frame Cesium, dissolve in 320 ms senza schiarire la base; pausa su errori/background, movimento ridotto |
| Venti/correnti | Due pacchetti reali NOAA: ASCAT 10 ottobre 2026, OSCAR storico 26 settembre 2014; griglia 2°, celle assenti mascherate, advezione WGS84, un solo motore Cesium |
| Pipeline | Convertitore ERDDAP standard Python; adattatore CF NetCDF3/4 opzionale verificato su fixture tecniche. OSCAR v2 reale e aggiornamento periodico richiedono download autorizzato |
| Orizzonte | Otto direzioni per luogo, 0–85°, interpolazione circolare; combinato con soglia nel worker e incluso nei backup |
| Diario | Locale, massimo 1000 osservazioni dichiarate, note/esito e contesto; inserimento manuale distinto dalla previsione, scritture atomiche e backup |
| Altri satelliti | Massimo 8 import OMM/TLE locali, identità/epoca validate e stesso worker; nessun nuovo fetch automatico, avvisi esterni riservati alla ISS |
| Fonti regionali | JSON di configurazione pubblica EPSG:3857/256px, senza chiavi; SWISSIMAGE selezionabile con bounds, zoom nativo e crediti |
| Backup | v2: preferenze/orizzonti, scena/camera, preferiti, diario, orbite. v1 ancora accettato; whitelist, transazione atomica, 8 MiB; epoche non ringiovanite. Import applica scena e preferenze insieme e ricarica l'orbita attiva |
| Canali | ntfy; bridge personale HA/Gotify/webhook. Segreti server, coda persistente e deduplica. Invio ntfy incerto conservato prima del POST, retry bloccato |
| Offline | Shell di entrambe le pagine, moduli/font/Cesium/vettori; stato cache visibile, aggiornamento in attesa segnalato; tile pubbliche 48 MiB / 120 elementi, Swiss allowlisted |
| Verifica | 79 test JS/TS, 6 prove convertitore Python (NetCDF3+4), riferimenti Skyfield/JPL estesi, HTTP loopback e browser mobile/desktop; dettagli in VERIFICATION.md |

## Limiti che rimangono

- Telefono reale: fotocamera/bussola/FOV, entrambi i landscape, permessi negati/revoca, riattivazione e background. Guida manuale e lifecycle automatico verificati, allineamento fisico aperto.
- Canali dell'utente: recapito push, cancellazione remota, pagina chiusa, telefono bloccato e restart del proprio servizio. Nessun endpoint/configurazione reale disponibile, nessun invio live effettuato.
- PWA/hardware: installazione, aggiornamento tra versioni, riapertura con rete realmente disattivata, fullscreen, DPR 2/3 reale, consumo e frame rate su telefono. La shell e i limiti cache sono verificati; non è salvato tutto il pianeta.
- OSCAR v2: adattatore pronto, file reale autenticato non acquisito. Non sostituire il pacchetto 2014 con dati inventati; ottenere accesso nel distributore e seguire VECTORS.md.
- Astronomia: stessi OMM della distribuzione 11 ottobre 2026, 13 casi / 12 finestre su due date iniziali. Non verifica tutte le epoche/stagioni né rifrazione/meteo o osservazioni reali. Dopo 7 giorni le orbite vengono rifiutate; avvisi entro 48 h.
- Rendering: Cesium è circa 4,25 MB minificati / 1,14 MB gzip, warning build noto. Le scie possono essere corte a scala planetaria. Transizioni misurate nel browser locale non certificano prestazioni del telefono.
- Provider regionali nuovi: configurabili, ma condizioni/CORS/precisione devono essere verificati; non entrano automaticamente nella cache allowlisted. WMS/terreno/edifici richiedono adattatori successivi.

## Ripresa

Leggere AGENTS.md, VERIFICATION.md, VECTORS.md, REGIONAL_IMAGERY.md e CHANNELS.md. `npm run check`, `npm run test`, `npm run build`; `npm run preview` per la build, `npm run dev` per sviluppo. Test con due worker per evitare contesa CPU; il ricevitore HTTP usa solo loopback. Conservare i riferimenti originali e le regressioni di camera/Cesium/coda.

Prossimo passo consigliato: QA su iPhone/Android e PWA/offline, poi il canale scelto dall'utente. Nessun deploy finché non richiesto. Percorsi guidati, dati scalari interrogabili, WebXR, terreno/edifici e allerte ambientali restano estensioni successive della specifica, non funzioni dichiarate operative.
