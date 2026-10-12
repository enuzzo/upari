# Upari — lavoro svolto

## Revisione 0.2.1 — prosecuzione locale, 11 ottobre 2026

- Estratto lo ZIP nella directory `upari`; recuperata la storia dal bundle e preservati gli artefatti originali. Installazione riproducibile con `npm ci`, nessuna nuova dipendenza npm.
- Eseguita QA reale di Terra e salvaschermo nel browser interno: mobile 390×844 e desktop, layer/data/confronto, animazione, pannelli, tastiera e ISS opzionale.
- Corretto il focus dei dialoghi e la pulizia dei marker dopo la distruzione del viewer Cesium: la navigazione Terra → ISS poteva rendere vuota l’app. Aggiunta regressione sulla raccolta già distrutta.
- Isolata la sessione fotocamera/bussola: permessi richiesti nel gesto, sensori assoluti Android/Safari, guida manuale, revoca, background, attivazioni ripetute e risultati tardivi senza riaccendere la camera.
- Riproduzione in attesa delle immagini, prefetch limitato a otto tile e allo zoom della fonte, stop su errore e rispetto del movimento ridotto. Legenda non disponibile esplicitata.
- Shell offline completa per entrambe le pagine; cache solo per risorse pubbliche NASA/Esri, limiti conservati e link `?view=sky|alerts` recuperabili offline. I test simulano l’offline; prova PWA nel browser completo aperta.
- Controlli più rigorosi su OMM/TLE, cancellazione della richiesta ISS disabilitata, aggiornamento di cache orbitale scaduta, backup senza campi sconosciuti/token, unità/codici meteo e freschezza continua. Orologio con secondi a due cifre.
- Aggiunte prove sul cambio ora legale di Roma, distinguendo due istanti UTC con la stessa ora locale. Fixture orbitali originarie conservate.
- Revisione indipendente: corretti il fallback offline dei link agli avvisi e l’orientamento rimasto dopo una camera terminata. Nessun invio ntfy/HA reale, nessun push/deploy per la decisione dell’utente.
- Meteo live Open-Meteo verificato sul luogo pubblico predefinito. Aggiunta sfumatura per leggere clock/meteo sulle immagini chiare; AR manuale/Escape/focus e navigazione Terra/ISS riprovati.
- Esteso il confronto Skyfield/JPL a sette casi e quattro finestre complete; corretto il massimo quando la visibilità termina durante la salita. Differenze massime 1,905 s e 0,357°, con limiti documentati.
- Gate finale: 54/54 test in 18 file, TypeScript, build, sintassi SW, riferimenti HTML e diff whitespace superati. Shell completa 376 file/route, circa 12,25 MB. DPR 2 fisico, PWA offline reale e fullscreen restano aperti.

## Revisione 0.2 — qualità, UI/UX e salvaschermo

- Recepite le nuove istruzioni: globo prioritario, ISS opzionale, box AR fisso eliminato, deploy rinviato.
- Corretta la combinazione DPR/resolutionScale di Cesium e aggiunti budget/profili di rendering. Fotografia Esri come base; NASA come fallback; cache/LOD/antialiasing adattati.
- Sostituiti rail fisso e terzo inferiore con globo a viewport disponibile e pannelli su richiesta. Separati moduli ISS, AR e avvisi; aggiornamento catalogo differito e deduplicato.
- Aggiunti conservazione della camera, ingresso `screensaver.html`, link con configurazione validata, rotazione, fullscreen, clock indipendente e meteo facoltativo.
- Aggiornati service worker e build multi-ingresso. Nessuna nuova dipendenza npm.
- 28 test superati; TypeScript e build completati. La verifica visuale/device/browser non è stata effettuata perché il controllo browser richiesto non era disponibile.
- Nessuna pubblicazione o push remoto della 0.2. Il pacchetto identifica il commit locale e comprende la build pronta. Prossimo passo: prova dei flussi documentati e poi deploy quando richiesto.

## Recupero e decisioni

- Recuperata la conversazione condivisa dall'utente. Il testo rilevante è in `conversazione-recuperata.md`; la specifica precedente è conservata senza riscritture in `Upari_specifica_originale.md`.
- Recuperato e ispezionato il primo concept approvato, nero e turchese. Conservato in `concept-upari-notte.png`. La selezione del design è già conclusa.
- Costruita un'app originale, con dati personali sul dispositivo e hosting statico. Non è stato copiato il codice del progetto usato come riferimento nella discussione precedente.

## Implementazione

- React/TypeScript/Vite, CSS responsive, font locali, icone, dialoghi, temi, backup e preferenze IndexedDB.
- Globo Cesium senza chiave ion obbligatoria; NASA GIBS, giorno/notte, Black Marble storico, dieci layer, date, legende, sequenza temporale e confronto.
- SGP4 in worker, snapshot ISS reale e datato, recupero OMM/import TLE, controlli di identità/freschezza, calcolo Sole/ombra, passaggi e calendario.
- Guida del cielo con fotocamera, sensori quando disponibili, modalità manuale e calibrazione. Proiezione verificata con test; dispositivo reale ancora da provare.
- Adattatore ntfy e piano limitato a 48 ore; bridge personale Home Assistant con scheduler persistente, token sul server, filtri e deduplicazione.
- Manifest, icone e service worker con cache limitata. Postbuild per gli asset Cesium e la shell offline.

## Correzioni e controlli

- Corretta l'inizializzazione degli asset Cesium per la versione installata e separato il caricamento del globo dal resto dell'app.
- Aggiunta gestione del fallimento del renderer per mantenere accessibili passaggi e impostazioni.
- Resa pigra l'apertura IndexedDB; impedita l'inclusione dei token nei backup esportati.
- Rafforzati i controlli sulle effemeridi, il backoff della sorgente e le date dei prodotti NASA.
- Gestite le risposte ntfy parziali/incerte senza cancellare invii già accettati o creare duplicati.
- Corretta la pulizia di fotocamera e listener anche con attivazioni ripetute o risposta asincrona dopo la chiusura.
- Corretto il template del service worker; aggiunto controllo sintattico sul file generato.
- Completati controllo TypeScript, build e 15 test automatici. Aggiunto confronto con 9 campioni indipendenti Skyfield/JPL. I risultati e i limiti sono in `VERIFICATION.md`.

## Consegna e ripresa

La consegna contiene sorgenti, build, documentazione, concept e bundle Git. `DELIVERY.json` identifica il commit e contiene gli hash dei file. `AGENTS.md` dà le istruzioni al prossimo Codex; `PROMPT_PER_CODEX.md` contiene un prompt già pronto.

Il progetto è una versione 0.1 concreta. La specifica più ampia non è interamente completata. La prossima attività utile è la verifica nel browser, seguita da AR su telefono e avvisi sui canali dell'utente. Non sono state inviate notifiche reali e non sono stati verificati dispositivi reali.


## 11 ottobre 2026 — continuazione locale 0.3.0

- Eseguito il piano `IMPLEMENTATION_03.md` sulle priorità autonome dell'AGENTS: orizzonti, diario, altri satelliti via import locale, configurazione regionale/SWISSIMAGE, canali bridge aggiuntivi e disponibilità offline visibile.
- Date/fonti UTC del fotogramma effettivo sempre esposte, inclusi confronto e salvaschermo. Playback conserva il frame precedente fino al caricamento, pre-carica un frame Cesium e dissolve in 320 ms con permanenza minima di 1,2 s dopo il commit; gestisce errori/background/movimento ridotto.
- Distribuiti campi vettoriali NOAA autentici con maschere e provenienza: vento ASCAT del 10 ottobre 2026, correnti OSCAR storiche del 26 settembre 2014. Advezione WGS84 in un solo renderer Cesium. Pipeline ERDDAP e adattatore CF NetCDF3/4 offline; file operativo OSCAR v2 autorizzato ancora mancante.
- Completati backup v2 e import atomico di scena/camera/preferenze/orbite, compatibilità v1, epoche originali conservate. Diario protetto da scritture concorrenti. Avvisi sempre riservati a NORAD 25544.
- Correzioni emerse dalla revisione: campi OMM obbligatori non nascosti dai default, cambio orbita dopo import, stato ntfy incerto persistito prima dell'HTTP, nessun retry duplicato dopo risposta persa. Ultimo controllo indipendente senza ulteriori problemi concreti.
- Ultima QA: corretto callback di ridimensionamento arrivato con contenitore già rimosso. Verifica indipendente e ripetizione cambio scena/viewport senza nuove occorrenze; gate finali ripetuti.
- Gate: 79 test in 30 file; TypeScript/build/SW superati; 6 prove Python NetCDF3/4; 13 casi Skyfield/JPL con 12 finestre e fixture originali conservate. HTTP reale solo loopback. Manifest shell: 377 route/file, 12.645.723 byte. Riferimenti e limiti in `VERIFICATION.md`.
- QA reale nel browser su build e origine isolata: oceani play/pausa/confronto, salvaschermo con clock indipendente, scie datate, SWISSIMAGE, export/import backup e fonte/epoca ISS, cache con aggiornamento in attesa. Screenshot temporanei in `/private/tmp/upari-qa/`. Ripristinata la scena aerosol dell'utente con ISS spenta e camera conservata.
- **Nessun push o deploy.** Restano telefono AR/performance, PWA installata/offline/fullscreen e canali propri. Non ci sono notifiche live o osservazioni fisiche inventate. ZIP/bundle/DELIVERY originali preservati; leggere `HANDOFF.md` per la ripresa.

Implementazione 0.3.0 salvata nel commit locale `96c26f4`; documentazione e resoconto finale nel commit successivo. Build finale ricaricata, console senza errori/warning, scena dell’utente ripristinata.


## 11 ottobre 2026 — qualità Terra 0.4.0

- Nuova richiesta: massima cura soprattutto della vista Naturale in zoom out, e shader alternativi. Reference recuperata: kedube/ha-iss-tracker; consultati solo README/screenshot pubblici e documentazione primaria Cesium. Nessun codice del riferimento, nuovo motore o dipendenza.
- Implementazione locale `bf85a66`: base NASA orbitale ↔ Esri nel dettaglio, atmosfera per frammento, notte con composito NASA 2016 e rinforzo caldo dei pixel luminosi reali, bordo atmosferico e stelle decorative. Nel dettaglio la luce si attenua per consultare le foto.
- Naturale, Cartoon, Cel shading, Pixel art, Voxel (2D isometrico), ASCII con glifi originali e Incisione. Intensità regolabile; persistenza scena, backup v2 e salvaschermo. Interfaccia e date intatte.
- P2 dalla revisione indipendente chiuso: il grading Naturale ora protegge anche i raster scientifici trattenuti durante un cambio foto, una dissolvenza o un errore. Avviso artistico sul frame effettivamente visibile. Test dedicato.
- QA ha trovato lo zoom notturno troppo scuro: Cesium usa distanza dal centro, non quota. Corretta conversione con raggio WGS84; riprovato a 12 km nella build finale, fotografia leggibile. Fonte/mosaici reali conservati.
- Gate finali: TypeScript/build/SW; 82 test in 31 file, incluso HTTP loopback; revisione 12 test mirati verdi. Browser desktop + 390×844, sette stili in sviluppo, Naturale/ASCII/Voxel compilati, salvaschermo e reload. Un campione play termico: 10 aggiornamenti in 302 ms, max gap 38 ms, senza promettere 60 fps.
- Prove e limiti in VERIFICATION.md/EARTH_STYLES.md. Shell 377 file/route, 12.658.980 byte. Scena originale aerosol dell'utente conservata e ISS off; anteprima 4175 separata.
- Nessun deploy/push o invio sui canali. Restano performance/AR su telefono reale, PWA installata e canali propri; voxel geometrico e fonti operative aggiuntive non sono dichiarati implementati.


## 11–12 ottobre 2026 — rotazione ambientale 0.4.1

- Rotazione default 0,08°/s; pausa/play e pannello velocità nella barra destra, preset e cursore 0,02–1°/s. Scene precedenti migrate, impostazioni persistenti e trasmesse al salvaschermo. Play delle date indipendente.
- Un solo ciclo Cesium; fattore quota per rendere leggibile il terreno, pausa su tutti i puntatori/ruota/voli, reset al background, passo limitato. Movimento ridotto inizialmente fermo, avvio esplicito disponibile.
- Revisione P2: backup legge la camera corrente invece dello snapshot ormai vecchio. Flush camera al background/chiusura best-effort, nessuna scrittura per frame. Liberati puntatori interrotti al cambio visibilità/blur; revisore senza ulteriori rilievi concreti, 10 test mirati verdi.
- Download/studio grafico della reference autorizzato; checkout ignorato e originale MIT conservato. Scoperta accidentale dei test esterni corretta con include esplicito delle radici Upari. Metodo/revisione in REFERENCE_STUDY.md.
- 88 test / 33 file, TypeScript/build/SW verdi; browser desktop, portrait 390×844 e landscape 844×390. Pausa/velocità/camera conservate al reload, backup UI con camera in movimento, salvaschermo rispetta pausa e riparte manualmente. In landscape corretto pannello che incrociava il pulsante Salvaschermo. Screenshot reali temporanei; nessuna misura sostenuta di fps/consumo.
- Nessun deploy/push. Prove telefono reale, PWA installata e canali propri ancora aperte; riferimento preciso e prompt aggiornato in HANDOFF.md.

Implementazione 0.4.1 salvata nel commit locale `eb68b44`; documentazione aggiornata nel commit successivo. Build finale `app-T578fIU0.js`, rotazione default confermata nella scena originale, console senza errori/warning.


## 12 ottobre 2026 — atmosfera, crepuscolo e zoom Naturale 0.4.2

- Spunti della reference applicati con codice originale: bordo in metri dall’ellissoide, blu/ambra legati al Sole e crepuscolo accentuato verso l’orizzonte; native scattering alleggerito, dettaglio senza nuovo grading. Raggio una sola volta/pixel, stelle solo fuori dalla Terra; stesso stage/ciclo, nessun nuovo timer/dipendenza.
- Transizione fotografica C2 su quota logaritmica; attesa delle tile prima di aumentare l’immagine aerea, blend esponenziale e reset su background. Guard richiesto/effettivo protegge anche la tinta nativa del terreno scientifico.
- Revisione P2 background chiuso; nessun ulteriore rilievo su alone/guard/camera. Browser ha trovato link subito dopo zoom con camera precedente: preRender e pulsanti aggiornano il riferimento corrente senza scrittura per frame; link riprovato a 26.349.986 m.
- Gate finali: 91 test / 34 file; TypeScript/build/SW, HTTP loopback e riferimenti scientifici conservati. Diagnostica DEV di 120 intervalli, memoria costante e nessun timer, rimossa nella build di produzione. Campioni e contesa tra schede documentati in VERIFICATION.md.
- Browser sviluppo/build, confronto con build 0.4.1 su stessa camera e Sole all’ora reale, mobile 390×844, dettaglio 12 km, zoom intermedio e zoom out, Terra dietro la camera, ASCII e play oceani termici. Console pulita. Prima baseline con frammento cambiato senza reload scartata, poi rifatta correttamente.
- Nessun deploy/push o canale live. Restano telefono reale (prestazioni/consumo/AR), PWA installata e canali propri. Mosaici/foto/luci 2016 conservano le loro date; nessuna osservazione o fisica meteo inventata.

Implementazione 0.4.2 nel commit locale `a1234ae`. Build finale `app-DPKw02Rs.js`; campione isolato 120 intervalli, media 25,95 ms e massimo 50,60 ms, senza promettere 60 fps. Rotazioni ripristinate, origine dell’utente aerosol/ISS off conservata; documentazione di ripresa nel commit successivo.


## 12 ottobre 2026 — fluidità Naturale e diagnosi locale 0.4.3

- Codice locale `db3c660`: camera on-demand invece di tre getter nativi costosi per frame; cache finale sicura dopo teardown, reader precedente escluso dall’import. Link subito dopo zoom confermato a 26.349.986 m. Nessuna scrittura IndexedDB per frame.
- Cap Auto/Alta61 con margine per deadline Cesium, Batteria/salvaschermo30. Budget/risoluzione/atmosfera/MSAA/SSE/shader invariati. Esperimento RAF libero scartato, non rivendicato come miglioramento.
- HUD ?perf=1 anche nella build statica, 300 intervalli postRender dopo warmup/tile, osservazione RAF limitata. Default produzione inattivo, nessuna telemetria. Reset su profilo/scena; query del salvaschermo preservata. Revisione indipendente senza ulteriori rilievi concreti.
- 97 test/36 file verdi, TypeScript/build/postbuild/SW verdi. HTTP loopback inizialmente bloccato dal sandbox, ripetuto nel giro completo autorizzato. Ricompilazione CSS ENOTEMPTY sull’output generato: output conservato fuori repo e build pulita riuscita. Manifest376 file/route,12.672.732byte. Browser compilato asset app-93KnzrRu.js, console pulita; normale senza observer e opt-in con HUD verificati.
- Chrome fisico Retina Vega56: baseline58,84 fps; sviluppo finale31,80/RAF31,81; build finale19,21/RAF18,67 sotto condizioni variabili. pmset registra CPU_Speed_Limit28 e carico elevato; nessuna modifica OS/app. Target60 ancora aperto, nessuna percentuale di aumento inventata. Dati/procedura in PERFORMANCE.md e docs/performance/0.4.3-mac.json.
- Layout390×844/844×390 verificato, HUD non sovrapposto ai comandi; override ripristinato. Salvaschermo DEV conserva diagnostica e cap30. I test responsive non sostituiscono hardware iPhone.
- L’utente indica il proprio iPhone17Pro. Wi-Fi comune/USB non confermati; nessuna prova reale ancora effettuata. Guida locale dist/LAN pronta; AR, PWA e canali restano verifiche separate. Nessun deploy/push o invio live. Screenshot temporanei elencati in VERIFICATION.md.


## 12 ottobre2026 — società nel tempo e solo Naturale0.5.0

- Per ultima richiesta rimossi UI/stili/rami shader cartoon/cel/pixel/voxel/ASCII/incisione; migrazione backup/link a Naturale. Alta default, Auto/Batteria espliciti conservati. Atmosfera/crepuscolo/zoom e rotazione originali mantenuti.
- Ricerca primaria/licenze: sei serie WDI CC BY4.0, fonti UN/ILO/nazionali/Eurostat mantenute; saldo naturale derivato/null rigorosi.217territori,1960–2025 con copertura individuale. Natural Earth177feature/288poligoni, revision pinned,7join assenti non imputati; confini contemporanei dichiarati.
- UNHCR AsylumApplications selezione SYR/UKR/AFG,N/G2000–2025 acquisita29pagine seriali:2860righe/263relazioni,0unmatched. Schema/time_period/footnotes/hash conservati. Massimo64archi stabili per periodo: domande pubblicate, non viaggi o migrazione generale. Tentativi PopStats/bulkCSV non usati come dati; limiti annotati.
- Requisito fonti libere: Esri rimosso da runtime/cache, EOX2016CCBY4 al suo posto (~10m,WGS84,max13,2016–2017). Tradeoff di dettaglio comunicato, EOXrecentiNC esclusi. NASA/SWISSIMAGE conservati.
- Catalogo tematico, atlante lazy nello stesso Cesium, primitive statiche/attributi, clock nativo e UI12,5Hz, timeline input reale/tastiera, missing/buchi, confronti/trend/provenienza/export. Tool CSV regionale documentato e validazione condivisa; import locale senza upload.
- Revisione indipendente: rimosso riferimentoSWEsri pendente, validate floworigins, whitelist coordinate/metadata, RequestGate/abort degli async, playheaduscita/import reader guarded, fonti generiche negli import. Zero neutro anche su scala asimmetrica; hash pacchetto valido stabile dopo export/reimport. Nessun rilievo materiale rimasto nelle correzioni.
- 108test/38file e3proveCSV verdi; check/build/postbuild/SW e diffcheck. Primo giro sandbox105/106 con HTTPloopbackEPERM, ripetizione completa autorizzata e finale108/108. Ulteriori17prove mirate dopo caption salvaschermo corretta. Nessuna nuova dipendenza.
- Browser DEV/compilato IAB, misure/layout e limiti in VERIFICATION.md; CSV reale1736righe, Italia saldo−4.7 numerico e originali senza arrotondamenti. Importdocumentato reale/reload/ripristino provati. Dati/provenienza/strumenti/fonti future in STATISTICAL_ATLAS.md.
- Campione breve studio59,512fps/120intervalli IAB DPR1, non certificazione fisicaNaturale60. Dati in docs/performance/0.5.0-study.json. iPhone17Pro stessa Wi-Fi confermata, test domani su istruzione utente. Nessun deploy/push/canale live, nessuna modifica processi/impostazioni Mac; solo server QA propri fermati.

- Ultima QA: corretti titolo launcher e sovrapposizioni source/toolbar/timeline/clock nei due formati del salvaschermo. I vettori fisici e il confronto raster sono sospesi nello studio anche per scene importate, evitando dati sovrapposti senza legenda. Al ritorno resta la configurazione fotografica. Verifiche mirate e ricompilazione finale verdi.

Implementazione locale0.5.0 nel commit `84281fa`. Giro completo conclusivo108/108 e3proveCSV dopo tutte le correzioni; buildfinaleapp-DRYM-Czh.js osservata nel browser. Clickmousetimeline→1992 coerente, uscita/reloadNaturale e rotazione ripristinata. Querykey/access_key private rifiutate, authorityUNHCR ammesso. Documentazione segue in commit separato; nessun push/deploy.


## 12 ottobre 2026 — 0.5.1, nomi e flussi luminosi

Richiesta: nomi degli Stati su hover, overlay come asilo più animati e vista/UI magiche. Aggiunti indice geografico leggero, tooltip con nomi/anni/valori, contorni e focus delle relazioni, materiale originale Cesium con chevron/scie, pause separate persistenti e sospensione reduced-motion/background. Colori delle fonti scientifiche, dati e limitazioni conservati; width4+10sqrt sul massimo globale. Batching favorito da fase/origin order. Finiture glass/timeline e legenda scorribile in landscape. Nessuna dipendenza/deploy/push.

Gate:115/41JS,3Python,TypeScript; QA reale IAB DEV e successiva build in VERIFICATION. Corrette due regressioni rilevate nella QA: salvataggio CSS sovrascritto (ripristinato dal HEAD), nome GLSL input riservato. Nessun danno ai pacchetti/preferenze/bundle. Campione finale58.80fps non certifica60; prove telefono rimandate come richiesto.

QA finale:115/41 verdi; build completa con shell382file/14.325.791byte. CompilataIAB4181 conferma nome Italia5434↔3543, scie/pause/source, layout e salvaschermo portrait/landscape, console pulita. Corretto anche incrocio timeline/pulsante Salvaschermo in landscape; clic del launcher verificato. P2touch chiuso in revisione indipendente con2testlifecycle. MisuraDEV finale58.803fps/p9521.4ms bounded; no60sostenuti certificati. Prossimo passo: telefono reale già concordato, senza pubblicare.

Codice salvato nel commit locale `5f5ca08`; documentazione/evidenze in commit separato. Nessun push/deploy.


## 13 ottobre 2026 — percorsi documentari e fonte Eurostat 0.6.0

- Ricerca primaria di Earth Studio, StoryMaps e Cesium; implementazione originale sullo stesso globo. Tre percorsi con capitoli, fotografia, contorni, richiamo geografico rappresentativo, curva e valori annuali reali. Gesti/zoom/background interrompono; riduzione movimento manuale; scene e salvaschermo conservano il fotogramma fermo.
- Acquisito Eurostat A/REN/PC: 27 paesi UE, 2004–2024, 567 valori originali. Nove indicatori complessivi. Pipeline riproducibile, codici esatti, flag/misure/anni validati; politica Eurostat-Reuse e discontinuità RED2021 dichiarate. UNICEF/UNdata/WPP approfonditi ma non acquisiti. Ledger e hash in STATISTICAL_ATLAS.md.
- Revisione indipendente: corretti ingresso con playback NASA/confronto, snapshot e teardown, compatibilità del subset UNHCR e limiti temporali Eurostat. Nessun rilievo materiale residuo. Codice nel commit locale `1dce320`.
- Due vecchi JS residui in dist conservati in archivio temporaneo, quindi build pulita; causa non determinata. Cache offline ora versionata dai byte degli asset oltre ai percorsi: test specifico e revisione verdi. Commit locale `913aa53`; shell383file/14.362.916byte, generazionea282b79f31c7.
- Gate finali: 121 test/44 file, tre test Python CSV e tre Eurostat, TypeScript/build/postbuild/SW/diffcheck verdi. HTTP solo loopback; nessun canale personale. Nessuna dipendenza npm nuova.
- Browser IAB compilato: desktop1280×720/DPR2, portrait390×844/DPR1, landscape844×390/DPR1, pause/capitoli/drag/zoom/timeline/fonti/reload e salvaschermo. Nessun overflow orizzontale o errore/warning applicativo osservato nei flussi finali. Screenshot temporanei reali; preview4182 lasciata a dimensioni normali, DEV4180 fermato, origin precedenti conservati.
- Campioni120frame:26,59fpsdesktopDPR2 e49,34fpsportraitDPR1, non prova sostenuta/GPU né certificazione60fps/4K. Telefono reale, PWA/AR/permessi e canali restano aperti; qualità non ridotta. Dati e condizioni in PERFORMANCE.md. Nessun push/deploy. HANDOFF.md include il prompt per la prova iPhone17Pro già sulla stessa Wi-Fi.
