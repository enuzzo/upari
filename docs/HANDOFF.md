# Upari — passaggio locale 0.6.0

13 ottobre 2026. Base `8c2ffde`; implementazione `1dce320`, correzione cache offline `913aa53`. **Alla consegna iniziale nessun push/deploy/invio; il13ottobre l’utente ha poi autorizzato creazione repo e push. Deploy e invii restano rinviati.** ZIP, bundle, DELIVERY, reference e dati degli origin precedenti preservati. Questo blocco è corrente; le sezioni successive sono lo storico.

Per la prossima sessione dall’ufficio, partire da [OFFICE_HANDOFF.md](OFFICE_HANDOFF.md) e [OFFICE_START.txt](OFFICE_START.txt). Licenza corrente Apache-2.0 con NOTICE a enuzzo/repository; lo storico MIT resta tale.

| Ambito | Consegna corrente |
|---|---|
| Percorsi del mondo | Tre percorsi originali: energia europea, speranza di vita, protezione. Capitoli, voli nativi cancellabili, pausa, curva reale e letture annuali. Terra fotografica, contorno e richiamo geografico; uscita ripristina l’atlante quantitativo |
| Nuova fonte | Eurostat diretto: quota rinnovabili nel consumo finale lordo, 27 paesi UE, 2004–2024, 567 valori originali. Nove indicatori complessivi; politica di riuso statistico e cambio metodo RED nel 2021 dichiarati |
| Lifecycle | Un solo Cesium, nessun timer di regia. Gesti/zoom/background mettono in pausa; movimento ridotto usa capitoli manuali. Scene, backup e salvaschermo conservano un fotogramma fermo |
| Qualità | Solo Naturale, Alta predefinita, ISS inizialmente spenta; fotografia storica EOX/NASA con date e crediti. Nessuna dipendenza npm nuova o dato annuale inventato |
| Offline | Quattro pacchetti statistici inclusi; 383 file/route, 14.362.916 byte. Cache basata anche sui byte: un aggiornamento dei soli dati cambia generazione (`a282b79f31c7`) |
| Verifica | 121 test in 44 file, tre test Python CSV e tre Eurostat; TypeScript/build/postbuild verdi. Revisione indipendente e browser compilato desktop, portrait, landscape e salvaschermo |
| Prestazioni | Campioni brevi: 26,59 fps desktop DPR2 e 49,34 fps portrait DPR1. Condizioni diverse, nessun confronto causale o certificazione di 60 fps/4K. Qualità non ridotta |

## Anteprima e documentazione

Anteprima dell’agente solo loopback: [127.0.0.1:4182](http://127.0.0.1:4182/). DEV4180 fermato; server preesistenti4179/4181 conservati. Il browser finale è tornato a dimensioni desktop normali, senza HUD diagnostico. Screenshot reali ora conservati in `docs/evidence/0.6.0/`, oltre alle copie temporanee; documentano la QA locale, non l’accettazione fisica. La preview è del Mac di casa, non trasferita all’ufficio.

- `DOCUMENTARY.md`: ricerca primaria, alternative, tre percorsi, metodo e lifecycle.
- `STATISTICAL_ATLAS.md`: coperture, limiti, licenze e hash dei quattro pacchetti.
- `VERIFICATION.md`: gate, prove browser e limiti fisici.
- `PERFORMANCE.md` e `performance/0.6.0-journeys.json`: misure e condizioni.

Due vecchi moduli residui osservati in dist sono conservati in `/private/tmp/upari-dist-060-preclean`; la build corrente è stata ricostruita pulita. Causa del residuo non determinata. L’output0.5.1 precedente rimane in `/private/tmp/upari-dist-051-before-documentary`.

## Prossima prova e idee ancora in coda

**iPhone17Pro personale, stessa Wi-Fi già confermata; prove reali rinviate dall’utente.** Preparare la preview LAN solo quando si comincia, senza deploy. Verificare qualità Alta/Auto, gesti, capitoli/timeline/fonti, entrambi i landscape e almeno dieci minuti di stabilità/fps/consumo/background. Il browser390×844 non certifica il telefono. PWA installata/offline/aggiornamento, AR/sensori e permessi richiedono prove separate e HTTPS adatto.

UNICEF, UNdata e WPP diretto sono stati ricercati ma non acquisiti; WPP richiede token e separazione storia/proiezioni. Flussi bilaterali ulteriori, clima/commercio, confini storici e OSCARv2 rimangono in coda. Nessun dato di impianti o emissioni dedotto dalla quota rinnovabile. Canali personali restano subordinati al test esplicito richiesto dall’utente.

## Prompt di ripresa

“Leggi AGENTS.md, HANDOFF.md, VERIFICATION.md, DOCUMENTARY.md, STATISTICAL_ATLAS.md e PERFORMANCE.md. Continua da Upari0.6.0 locale, con tre percorsi documentari e nove indicatori reali; conserva solo Naturale, qualità Alta, palette e preferenze. L’iPhone17Pro è nella stessa Wi-Fi: facciamo le prove della build in LAN, senza deploy. Misura qualità/gesti/capitoli/timeline e dieci minuti di fps, consumo e background; annota viewport/DPR e non abbassare silenziosamente la qualità. Poi PWA/AR/canali soltanto con accesso e test richiesti. Conserva import locali e fonti; UNICEF/UNdata/WPP e le altre estensioni restano in coda.”

Comandi: `npm run check`, `npm run test`, `python3 scripts/test-package-statistics.py`, `python3 scripts/test-fetch-renewables.py`, `npm run build`, `npm run preview -- --port 4182`. Prima di avviare server, verificare quelli già attivi. Nessun aggiornamento della consegna ZIP/bundle originale in questa sessione.

---

# Upari — passaggio locale 0.5.1

12 ottobre 2026. Implementazione locale0.5.1 `5f5ca08`, base `7349948`. Nessun push/deploy, nessun invio sui canali. ZIP/bundle/DELIVERY e reference ignorata preservati. Le sezioni0.4 sottostanti sono storiche; questo blocco e AGENTS.md descrivono lo stato attuale.

| Ambito | Consegna attuale |
|---|---|
| Terra | Solo Naturale: tutti gli stili e i rami shader artistici rimossi; vecchie scene convertite. Alta default, Auto/Risparmio espliciti conservati. Atmosfera/crepuscolo/zoom originali e rotazione destra restano |
| Immagini libere | NASA orbitale ↔ EOX2016 CC BY4.0, WGS84/zoom13/~10m, acquisizione2016–2017. Esri rimosso; non promettere lo stesso dettaglio a terra. SWISSIMAGE regionale e luci NASA2016 conservate |
| Atlante | 8 indicatori,217 territori,1960–2025 con coperture individuali. Sei WDI originali (ONU/ILO/nazionali/Eurostat), saldo derivato, selezione reale UNHCR |
| Relazioni | 2860 righe/263 relazioni UNHCR SYR/UKR/AFG,N/G,2000–2025; massimo64 archi stabili sul periodo, colori per origine e spessore per quantità. Schematici, non viaggi né persone uniche |
| Nomi e scie | Nomi al passaggio del mouse, tap nell’atlante; contorno evidenziato e relazioni estranee attenuate. Frecce/scie direzionali animate, pausa separata, movimento ridotto/background; UI luminosa e legenda scorribile nei viewport bassi |
| Studio | Timeline mouse/touch/tastiera/play/pausa/velocità avanti-indietro, intervallo/loop; poligoni statici Cesium, picking e menu paese, variabile secondaria/curve con buchi, scala fissa/zero neutro/null distinti |
| Fonti/tool | Fonti originali/distributori/date/unità/natura/licenze/metodi linkati, CSV/JSON, tool offline per serie e confini regionali. Import documentato locale, whitelist/gate; export/reimport conserva l'identità validata |
| Persistenza | Scene/backup/link/salvaschermo conservano config/anno/ID. Pacchetto importato a parte: esportare anche JSON completo. Fonte statistica/anno della serie distinti da clock e fotografia; tre snapshot inclusi offline |
| Verifica | 115 test / 41 file,3 prove tool CSV,check/build/postbuild/SW; revisione indipendente senza rilievi rimasti. Browser IAB compilato desktop/portrait/landscape e salvaschermo; vedere VERIFICATION.md |
| Prestazioni | 0.5.1 scie DEV58,80 fps su120 intervalli IAB/DPR1; storico0.5.0 studio59,512 fps; non certificazione Mac Naturale o telefono. Camera on-demand/cap61/30 mantenuti. Target60Naturale aperto: PERFORMANCE.md |

## Cosa richiede l'utente/domani

**iPhone17Pro personale, stessa Wi-Fi confermata. Le prove sono state rinviate a domani dall'utente.** Partire dalla build dist verificata, avviare anteprima LAN esplicita quando si comincia. Provare Alta/Auto, zoom/rotazione/gesti, timeline/range/loop/seeking/fonti e background, almeno10 min per stabilità/consumo. L'override390×844/844×390 del browser non è il dispositivo. AR/camera/bussola/PWA installata e permessi richiedono un contesto HTTPS adatto, distinto dalla prova WebGL via LAN HTTP. Nessuna esposizione pubblica/deploy.

Canali personali ntfy/HA/Gotify/webhook: serve endpoint/configurazione dell'utente e una richiesta di test reale; nessun invio effettuato. PWA offline/aggiornamento fisico e precisione AR restano separati. Ingestione OSCARv2 reale autorizzata, fonti statistiche aggiuntive e confini storici rimangono in coda: non spacciare archivi2014/2016 o geografie contemporanee per dati attuali/storici ricostruiti.

## Ripresa consigliata

“Leggi AGENTS.md, HANDOFF.md, VERIFICATION.md, STATISTICAL_ATLAS.md e PERFORMANCE.md. Continua dalla0.5.1 locale: solo Naturale, qualità alta, dati e fonti libere. L'iPhone17Pro è nella stessa Wi-Fi; facciamo ora le prove della build in LAN senza deploy. Misura Naturale/rotazione/zoom e timeline statistica su Mac e telefono, annota fps/p95 e condizioni; non ridurre silenziosamente la qualità. Conserva luoghi/preferenze e gli import locali. Poi PWA/AR/canali solo con accesso/test richiesto. Eurostat/UNICEF/UNdata e confini storici sono idee in coda documentate, non dataset già caricati.”

Comandi: `npm run check`, `npm run test`, `npm run build`, `npm run preview -- --port 4181`. Anteprima corrente solo127.0.0.1:4179; gli origin4173/4174/4175 dell'utente conservano i propri dati. Build di sviluppo e vecchia preview dell'agente fermate. Nessuna memoria privata o token negli export.

---

# Upari — passaggio locale 0.4.3

Continuazione dello ZIP originale, base Git `ab609bb`, implementazioni locali `96c26f4` (0.3) e `bf85a66` (0.4), seguite da `eb68b44` (rotazione ambientale 0.4.1) e `a1234ae` (atmosfera/crepuscolo/zoom 0.4.2) e `db3c660` (fluidità/diagnostica 0.4.3). Palette nera/turchese e gerarchia approvate conservate: Terra dominante, pannelli su richiesta, ISS inizialmente spenta. **Nessun push o deploy**, per istruzione dell'utente. ZIP, bundle e DELIVERY originali rimangono invariati; documentano 0.2.0, non questa revisione.

| Ambito | Stato corrente |
|---|---|
| Qualità Terra | NASA orbitale ↔ Esri territoriale, atmosfera per frammento Auto/Alta, notte con luci NASA 2016; illuminazione attenuata nel dettaglio. Nessuna nuvola inventata |
| Atmosfera/zoom 0.4.2 | Bordo ellissoidale blu/crepuscolo solare; fotografia log-altitude C2 con attesa tile e blend breve, close-up nativo leggibile. Tinta del terreno scientifico protetta. Un solo ciclo/stage |
| Fluidità 0.4.3 | Camera pull su richiesta, cap 61/30, HUD locale con ?perf=1. Qualità invariata. Target 60 non certificato: Mac CPU_Speed_Limit 28, sviluppo 31,8 fps / RAF 31,8; build finale 19,2 / RAF 18,7. iPhone 17 Pro scelto, Wi-Fi da confermare; PERFORMANCE.md |
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
| Verifica | 97 test JS/TS in 36 file, 6 prove convertitore Python (NetCDF3+4), riferimenti Skyfield/JPL estesi, HTTP loopback e browser mobile/desktop; dettagli in VERIFICATION.md |

## Limiti che rimangono

- Telefono reale: fotocamera/bussola/FOV, entrambi i landscape, permessi negati/revoca, riattivazione e background. Guida manuale e lifecycle automatico verificati, allineamento fisico aperto.
- Canali dell'utente: recapito push, cancellazione remota, pagina chiusa, telefono bloccato e restart del proprio servizio. Nessun endpoint/configurazione reale disponibile, nessun invio live effettuato.
- PWA/hardware: installazione, aggiornamento tra versioni, riapertura con rete realmente disattivata, fullscreen, DPR 2/3 reale, consumo e frame rate su telefono. La shell e i limiti cache sono verificati; non è salvato tutto il pianeta.
- OSCAR v2: adattatore pronto, file reale autenticato non acquisito. Non sostituire il pacchetto 2014 con dati inventati; ottenere accesso nel distributore e seguire VECTORS.md.
- Astronomia: stessi OMM della distribuzione 11 ottobre 2026, 13 casi / 12 finestre su due date iniziali. Non verifica tutte le epoche/stagioni né rifrazione/meteo o osservazioni reali. Dopo 7 giorni le orbite vengono rifiutate; avvisi entro 48 h.
- Rendering: Cesium è circa 4,25 MB minificati / 1,14 MB gzip, warning build noto. Le scie possono essere corte a scala planetaria. Transizioni misurate nel browser locale non certificano prestazioni del telefono.
- Provider regionali nuovi: configurabili, ma condizioni/CORS/precisione devono essere verificati; non entrano automaticamente nella cache allowlisted. WMS/terreno/edifici richiedono adattatori successivi.

## Ripresa visiva 0.4.3

Apri la vista corrente → “Un altro modo di guardare”. La reference iniziale era `kedube/ha-iss-tracker`; per la 0.4.0 sono stati consultati solo README e screenshot pubblici. Per la 0.4.1 l’utente ha autorizzato download e studio del sorgente grafico, con checkout ignorato; metodo/revisione in `REFERENCE_STUDY.md`, nessun codice o asset copiato. Confronto e scelte in `EARTH_STYLES.md`. Browser compilato provato su desktop e 390×844, tutti gli stili esaminati nello sviluppo, Voxel/ASCII anche in salvaschermo. Corretto e riprovato il dettaglio notturno a 12 km. Le prove reali di telefono/canali/PWA sopra restano aperte.

Prompt di ripresa: “Leggi AGENTS.md, HANDOFF.md, VERIFICATION.md, EARTH_STYLES.md e REFERENCE_STUDY.md. Continua da 0.4.3 mantenendo atmosfera/crepuscolo e blend di zoom, rotazione ambientale, pausa/velocità persistenti e la qualità orbitale e il dettaglio leggibile. Leggi PERFORMANCE.md: ripeti i campioni 60 fps sul Mac quando CPU_Speed_Limit torna normale. Il telefono scelto è l’iPhone 17 Pro dell’utente; conferma Wi-Fi comune e verifica la build dist nella LAN, senza pubblicazione. Annota le prestazioni effettive e conserva la qualità. Nessun deploy e nessun invio sui miei canali senza richiesta.”

La 0.4.1 è stata provata nella build desktop, portrait 390×844 e landscape 844×390, controlli 44 px e nessun overflow. Pausa/speed al reload, backup con camera corrente e avvio manuale del salvaschermo confermati. Console senza errori/warning nella QA. La rotazione non è una misura hardware di fps/consumo; queste prove restano aperte.

La 0.4.2 aggiunge prove sulla vista Naturale a 26.350 km, 17.000 km, 3.035 km e 12 km; palette/date/play termico, mobile e un caso con Terra dietro la camera. Nessun errore WebGL osservato. I campioni di cadenza del ciclo sono locali e dipendono dalle viste contemporaneamente attive: non promettere 60 fps sostenuti o prestazioni del telefono.

## Ripresa

Leggere AGENTS.md, VERIFICATION.md, VECTORS.md, REGIONAL_IMAGERY.md e CHANNELS.md. `npm run check`, `npm run test`, `npm run build`; `npm run preview` per la build, `npm run dev` per sviluppo. Test con due worker per evitare contesa CPU; il ricevitore HTTP usa solo loopback. Conservare i riferimenti originali e le regressioni di camera/Cesium/coda.

Prossimo passo consigliato: QA su iPhone/Android e PWA/offline, poi il canale scelto dall'utente. Nessun deploy finché non richiesto. Percorsi guidati, dati scalari interrogabili, WebXR, terreno/edifici e allerte ambientali restano estensioni successive della specifica, non funzioni dichiarate operative.

La 0.4.3 elimina la copia per-frame della camera; lettore finale sicuro dopo teardown e import isolato. Browser Chrome fisico Retina, layout 390×844/844×390 e salvaschermo diagnostico verificati. Campioni sintetici persistiti in docs/performance; non confrontare causalmente la baseline 58,8 con il finale 31,8 sotto limite CPU. Nessuna prova reale iPhone o canale live.
