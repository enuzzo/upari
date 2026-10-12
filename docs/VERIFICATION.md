# Upari — verifiche locali0.5.0

12 ottobre 2026. Codice locale `84281fa`. Nessun push/deploy, endpoint utente o invio live. Solo server QA dell'agente gestiti. Ultime istruzioni: solo Naturale e dati/fonti libere; iPhone17Pro stessa Wi-Fi, prove rinviate a domani dall'utente.

## Gate e integrità

- **108 test / 38 file**, giro completo verde con HTTP127.0.0.1; TypeScript/build/postbuild/sintassiSW/diffcheck verdi. Primo giro sandbox105/106 (HTTPlistenEPERM), ripetizione completa106/106 e finale108/108. Successive prove mirate dopo caption/disposizione/guard, poi giro completo finale108/108 sulla revisione congelata; verdi. Nessuna nuova dipendenza.
- **3 prove Python toolCSV** verdi sulla validazione finale: zero/null/anni assenti/exactjoin, duplicati e regioni ignote, sorgenti/licenze dichiarate e rifiuto licenza non libera. Fixture NetCDF storiche non rieseguite perché non modificate (6prove precedenti conservate).
- Revisione indipendente chiusa: riferimentoSWEsri pendente, appartenenzafloworigins, whitelist coordinate/metadati, callback async tardivi/RequestGate, playhead uscita/tab/import e reader precedente, attribuzioni generiche dei flussi importati. Test aggiunti: zero neutro asimmetrico e identità del pacchetto validato stabile dopo export/reimport.
- Tre snapshot, fonti, hash, byte e periodi in STATISTICAL_ATLAS.md.217 territori,177 feature/288 poligoni;263 relazioni/2860 righe UNHCR, massimo64 archi nel renderer, nessuna imputazione. WDIaggregati esclusi,7 confini senza match espliciti. API acquisite serialmente, nessuna dipendenza istituzionale live durante play.
- Build finale: `app-DRYM-Czh.js`, `screensaver-BJN7g-aG.js`, `StatisticsStudy-CMUqA0Dg.js`; Globe4268,44kB/1150,37kB gzip, warning dimensione noto. Shell **381 route/file,14.315.113 byte**, SHA256 dell'elenco JSON `b10ded2c42417ce16a734e72061b3db74ae04279a3a7852892601c9facaee6d9` (non hash dei contenuti). Tre/statistics/ inclusi. Output delle build precedenti preservati sotto/private/tmp/upari-qa, non cancellati; ZIP/bundle/DELIVERY/reference intatti.

## Browser effettivo

Browser interno Codex/IAB, DPR 1; DEV1280×720 per campione studio, build1143×953 per il desktop, override390×844 e844×390. **Non Chrome fisico, Safari o iPhone**. Chrome precedentemente connesso non più disponibile nel browser inventory; nessuna modifica/reinstallazione. Preview finale solo127.0.0.1:4179 su origine nuova per escludere SW della build precedente. Origin dell'utente4173 conservato.

| Prova | Esito effettivo |
|---|---|
| Solo Naturale | Inspector e salvaschermo senza selettori artistici; migrazione vecchiASCII/voxel/link/backup in test. Default nuovo origin: Alta selezionata, ISS off; Auto/Batteria espliciti conservati |
| Fotografia | EOX2016/WGS84: zoom su Luino, mosaico reale dettagliato/georeferenziato e crediti CC BY4.0, nessun errore/warning osservato. Vista pianeta/rotazione presenti; nessuna fotografia attuale o dettaglio identico a Esri dichiarati |
| Catalogo | La Terra, Società nel tempo, Oceani, Atmosfera, Superficie/territorio; Atlante apre8serie reali con anni/unità/fonte |
| Timeline DEV | Play muove globo/testi, pausa e seeking input/tastiera coerenti:2020.5 mappa eUI,2022.51 dopoArrowRight. Dati originali2020Italiaasylum1078→2021:4962, senza numero interpolato |
| Studio mancante | Build: Occupazione15+, range manuale1970, seek1970.01: Italia1970→1971 “Non disponibile” su entrambi; nessuno zero o valore recuperato dal1991 |
| Confronto/fonti | Selezione territorio e secondo indicatore con cerchi rosa/scala/curve, periodi/caveat/fonti originali. UNHCRItalia2022 relazioniAFG2031,SYR410,UKR2993; note originali accessibili. Nessuna pretesa di causalità/ranking |
| Import/reload | Pacchetto reale ristretto alla natalità importato via filechooser, locale, un solo indicatore dopo import e reload. Ripristino del pacchetto incluso esplicito; nuovi dataset locali non descritti automaticamente come WDI/ILO/UNHCR |
| CSV reale | File432338byte/1736righe (217×8),anno2024. Italia saldo−4.7 numerico, occupazione46.365 e speranza83.9512195121951 conservate; assenze vuote, metadata/link/unità. Helper browser download ha richiesto circa7min: non una misura della latenza dell'app e non ripetuto |
| Portrait compilato |390×844,nessun overflow. Atlantecompatto x14–304,y74–350;timeline y597–710,comandi liberi. Espansione/dettagli su richiesta |
| Landscape compilato |844×390,nessun overflow. Atlante x14–274, timelinex366–756;nessuna sovrapposizione fra i pannelli. Overrides ripristinati |
| Salvaschermo | Configstudy/anno/indicatore/camera nel link; caption statistiche e anno2024 distinti da clock12 ottobre 2026. Play/ritorno1960–2024 osservato. Sourcecard rimane visibile quando toolbar/timeline scompaiono |
| Salvaschermo corretto | Portrait: toolbar y15–67, cardy74–318, timeliney541–654, clocky675–766; landscape: cardx14–274, timelinex366–756/y128–230, clockx300+/y244–330. Fonte/anno e ora leggibili; corretti overlay clock/timeline e titolo launcher ancora fotografico |
| Ultima build | app-DRYM-Czh.js osservato nel DOM; click nativo sulla timeline natalità →1992 coerente. Uscita/reload lascia fotografia; lenta rotazione ripristinata. Screenshot finaleNaturale1280×720/DPR 1; console pulita |
| Produzione normale | Nessun attributo data-study-frame né osservatore del campione studio; console senza errori/warning nelle viste esaminate |

Screenshot reali temporanei: `/private/tmp/upari-qa/050-atlas-final.png`, `050-atlas-portrait-final.png`, `050-atlas-landscape-final.png`, `050-natural-detail-production.png`, `050-saver-portrait-final.png`, `050-saver-landscape-final.png`, `050-natural-final.png`. Screenshots DEV precedenti sono prove intermedie; non sostituiscono le finali.

## Prestazioni e prove ancora esterne

Studio DEV:120 intervalli dopo30 di warmup,59,512 fps medi,p9517,9 ms,max33,6 ms,JSsubmission2,2375 ms medi. In docs/performance/0.5.0-study.json. Non è tempoGPU, misura sostenuta, confronto causale o certificazione Naturale60 fps su Mac. Dati0.4.3 di Chrome/Vega56/CPUlimit28 rimangono storici: nuovo `pmset -g therm` in questa fase non ha restituito statoCPU/power, quindi non dichiarare il limite ancora28 né normalizzato. Nessun intervento OS/energia/processi.

Domani: iPhone17Pro stessa Wi-Fi, buildstaticaLAN WebGL/statistiche prima, almeno10 min di fluidità/consumo/gesti/background e due landscape. PWA installata/aggiornamento/rete veramente spenta, AR/fotocamera/bussola/permessi e servizi personali richiedono prove separate e contestoHTTPS per i sensori. Import su LANHTTP richiede invece HTTPS/localhost per crypto.subtle; pacchetto incluso disponibile. Meteo opzionale non riattivato nella QAstatistica finale: verificare anche layout con meteo sul telefono. Canali utente mai contattati. Nessun deploy.

---

# Upari — verifiche locali 0.4.3

12 ottobre 2026. Codice locale `db3c660`, base `dc43575`. **Nessun push/deploy.** Obiettivo 60 fps con qualità invariata: ancora aperto, non certificato. [Metodo, dati e prove iPhone](PERFORMANCE.md).

## Gate finali

- **97 test / 36 file**, giro completo verde. Primo giro nel sandbox: 96 verdi e prova HTTP bloccata da `listen EPERM 127.0.0.1`; ripetizione autorizzata completa verde. Nessun endpoint reale o invio sui canali dell’utente.
- TypeScript verde; build finale completa con postbuild/sintassi SW verde. Nessuna nuova dipendenza. Dopo il primo build verde, la ricompilazione CSS ha incontrato `ENOTEMPTY dist/cesium`: conservato l’output interrotto in `/private/tmp/upari-qa/043-dist-interrupted`, ricostruito da directory nuova e verificato. Non attribuita una causa certa; ZIP/bundle/DELIVERY/reference intatti.
- Revisione indipendente: reset dei campioni su viewport/qualità e cambi vista, snapshot camera/import/teardown, diagnostica default off. Corretto il salvaschermo che eliminava ?perf=1; query acquisita e preservata prima del caricamento lazy. Nessun ulteriore rilievo concreto.
- Shell finale **376 route/file, 12.672.732 byte**, SHA-256 dell’elenco JSON `8a06826e02f106b1a069095b1364ac8ac21c883a1399e8de0b744e93a83bc8b9` (non checksum dei contenuti). Asset finale osservato nel DOM `/assets/app-93KnzrRu.js`; globo 4.265,79 kB / 1.149,10 kB gzip, warning dimensione noto.

## Browser effettivo

Chrome fisico sul Mac, AMD Radeon Pro Vega 56 / ANGLE Metal, iMacPro1,1, DPR 2. Override solo per layout; non è Safari o un iPhone. Dev 4174; build finale solo loopback 4175.

| Prova | Esito |
|---|---|
| Qualità invariata | Auto framebuffer circa 3 MP, MSAA4, per-fragment atmosphere e SSE1,5 conservati. Nessuna modifica allo shader/texture per questa ottimizzazione |
| Camera su richiesta | Allontana → Salvaschermo: link con quota 26.349.986 m subito, nuova posa durante rotazione; test cache finale/import verde |
| Diagnostica normale/opt-in | Build senza query: HUD e tre attributi diagnostici assenti; ?perf=1: pannello visibile e profilo cap61. Console senza errori/warning osservati |
| Pausa/riavvio | Pausa ferma rotazione; Play cancella vecchio campione e mostra attesa. Nuovo campione di 300 intervalli effettivi dopo immagini/warmup |
| Portrait 390×844 | Nessun overflow, larghezza390; HUD termina y670, Salvaschermo inizia y708: sovrapposizione corretta |
| Landscape 844×390 | Nessun overflow; HUD x24–314, Salvaschermo x685–822; comandi liberi. Override ripristinato |
| Salvaschermo DEV | ?perf=1 conservato dopo replaceState e ready; HUD presente, cap30, MSAA4, atmosfera per-frammento. Nessun valore di fps usato durante build concorrente |
| Misure | Baseline58,84; sviluppo finale31,80 / RAF31,81; build finale19,21 / RAF18,67. Condizioni del Mac variabili, ultimo CPU_Speed_Limit osservato28: non dichiarare miglioramento quantitativo o 60 fps sostenuti |

Dati sintetici persistiti in `docs/performance/0.4.3-mac.json`; dettagli e limiti in PERFORMANCE.md. Il browser RAF rallenta insieme al rendering; il tempo JS non è tempo GPU. Nessuna modifica ai processi o impostazioni energetiche del Mac. Vista dev sospesa durante la build e anteprima compilata lasciata disponibile.

Screenshot reali temporanei: `/private/tmp/upari-qa/043-natural-production.png`, `043-production-perf.png`, `043-mac-final.png`, `043-phone-layout.png`. Nessuna prova sul telefono o misura di consumo/temperatura fisica dichiarata. iPhone 17 Pro dell’utente confermato; rete Wi-Fi comune non ancora confermata. AR/PWA/canali restano aperti; la LAN HTTP prevista serve solo la build statica per la prova WebGL.

---

# Upari — verifiche locali 0.4.2

12 ottobre 2026. Codice locale `a1234ae`, base `f38bbbc`. **Nessun push o deploy.** Questa sezione descrive la revisione storica 0.4.2.

## Gate

- **91 test in 34 file** superati sulla revisione finale, compresi HTTP loopback e riferimenti Skyfield/JPL invariati. Tre nuove prove: distribuzione log-altitude/C2 e dettaglio, fade atmosferico indipendente, readiness/background/movimento ridotto e passo 30/60 fps del blend.
- TypeScript, build di produzione e sintassi SW verdi. Nessuna dipendenza aggiunta. Micro-ottimizzazione finale GLSL provata nel browser (Naturale e ASCII), senza errori shader.
- Revisione indipendente: P2 ripresa blend dal background corretto con `suspend()` e guard hidden; guard scientifico anche sulla tinta nativa. 12 test mirati verdi; successiva revisione della camera immediata dopo zoom senza ulteriori rilievi concreti.
- Manifest shell finale: **376 route/file, 12.668.051 byte**; SHA-256 dell’elenco `JSON.stringify(await offlineFiles())`: `1e67c11e17eba0a6fbb7f4460d0563680bcfbabf5e323cd6c5936a9a05cef9b9`. È l’elenco, non un hash dei contenuti. Globo/Cesium 4.261,67 kB / 1.147,42 kB gzip, warning dimensione noto.
- Asset finale osservato nel DOM `/assets/app-DPKw02Rs.js`. Diagnostica `data-render-sample`/`meanMs` assente nei bundle compilati: il campione è limitato allo sviluppo, senza timer o telemetria di produzione.

## Browser e confronto

Browser interno Codex su questo Mac, 1280×720 e portrait 390×844, DPR 1 della QA; sviluppo 4174, build 4175, copia build 0.4.1 in `/private/tmp/upari-qa/baseline-041` su loopback 4176. Scena dell’utente 4173 preservata. Nessuna camera/GPS o canale live.

| Prova | Esito osservato |
|---|---|
| Atmosfera/crepuscolo | Naturale, Sole all’ora reale e anteprima −6 h dichiarata: bordo blu/ambra, volume e luci NASA 2016. Confronto con vecchia build sulla stessa camera a 26.350 km e offset 0; orologio reale, catture ravvicinate, nessun pixel-diff o Sole congelato |
| Zoom | Vista orbitale 17.000 km, zoom out 26.350 km, blend intermedio a 3.034.649 m: aerial/target 0,520537. Fotografia a 12.000 m: aerial/target 1, dettaglio leggibile e mosaici reali, grading nuovo nullo |
| Camera dopo zoom | Rilevato link con quota precedente se aperto subito dopo il pulsante; corretto pubblicando in preRender e immediatamente nei pulsanti. Build riprovata: Allontana da vista pianeta → Salvaschermo subito, quota 26.349.986 m nel link invece di 17.000.000 m |
| Raggio rivolto al cielo | Fixture locale derivata dal link pubblico di QA: quota 3.200 km, pitch +π/2, clock spento. Terra dietro la camera: cielo scuro/stelle, nessun alone falso, console pulita |
| Palette/date/play | Oceani termici 10/10/2026, legenda ufficiale; play prepara il 04/10 conservando il frame datato 10/10, poi avanzamento osservato fino al 07/10 e 10/10. Nessuna tinta fotografica/atmosferica sul raster. Campione fade: 9 aggiornamenti / 333 ms / gap max 74 ms |
| Stili | ASCII sul nuovo shader, ritorno Naturale; nessun errore/warning di compilazione osservato |
| Mobile | 390×844: fotografia Naturale/terminatore/rotazione, controlli e caption leggibili, `scrollWidth=clientWidth=390`; nessun overlay framework o errore console. Override ripristinato |
| Scena dell’utente | Aerosol 10/10/2026, ISS off e rotazione 0,08 conservati dopo reload sulla build finale. Pausa temporanea per isolare il campione, poi ripristinata. Anteprima fotografica separata, Sole reale e rotazione attiva |

La prima baseline dopo sola sostituzione del frammento nella stessa scheda mostrava ancora la scena vecchia: il salvaschermo legge la scena al caricamento. Cattura scartata e confronto rifatto dopo reload; consultare i link salvati in una nuova scheda o ricaricare dopo cambio manuale del frammento. Un click di QA ha avuto un timeout del controllo durante il caricamento: stato riletto e azione riuscita, senza errore dell’app in console.

## Cadenza osservata e limiti

Diagnostica DEV nel callback Cesium esistente: otto intervalli di warmup, poi 120 intervalli consecutivi di rotazione attiva, memoria costante, nessun timer o readback GPU. Non misura il tempo GPU né certifica ogni fotogramma presentato a schermo.

| Campione locale | Media / massimo intervallo | Contesto |
|---|---|---|
| Prima calibrazione | 19,33 / 49,30 ms | QA locale con più schede, target 60, prima della micro-ottimizzazione finale |
| Viste concorrenti | 59,58 / 203,10 ms | Tre viste 3D in movimento durante la QA; campione sotto contesa, non confronto dello shader |
| Una sola vista in movimento | **25,95 / 50,60 ms** | Altre due viste messe temporaneamente in pausa, schede di confronto chiuse; target 60, circa 38,5 aggiornamenti/s nel campione |

La pausa delle altre viste riduce la contesa osservata, ma non dimostra che questa fosse l’unica causa. Campioni brevi e condizioni differenti: **non dichiarare 60 fps sostenuti o un aumento misurato rispetto alla 0.4.1**. Il codice evita calcoli ripetuti (un raggio/pixel, stelle solo sul cielo), mantiene una passata e i profili adattivi precedenti; la prova quantitativa su telefono/GPU reale resta aperta. Si sono ripristinate le rotazioni precedenti dopo il campione.

Screenshot reali temporanei in `/private/tmp/upari-qa/`: `042-natural-final.png`, `042-natural-mobile.png`, `042-zoom-out.png`, `042-before-far.png`, `042-after-far.png`, `042-away-from-earth.png`, `042-middle-dev.png`, `042-science-dev.png`, `042-after-night-dev.png`, `042-before-orbit.png`. Le immagini DEV sono prove intermedie, quelle finali provano la build. Sono file temporanei, non inclusi nella distribuzione.

Telefono reale: misurare fluidità/consumo/memoria e DPR 2/3, gesti/background e AR. PWA installata: offline/update/fullscreen. Canali propri: recapito/cancellazione/restart; nessun invio live. File operativo OSCAR v2 autorizzato ancora mancante. Nessuna accettazione hardware o visiva dell’utente dichiarata effettuata.

---

# Upari — verifiche locali 0.4.1

11–12 ottobre 2026. Codice locale `eb68b44`, continuazione di `bf85a66`. **Nessun push o deploy.** Questa sezione descrive la revisione storica 0.4.1.

## Gate

- **88 test in 33 file**, giro finale verde; TypeScript/build di produzione/sintassi service worker superati. Nessuna nuova dipendenza npm. Include Vitest limita la scoperta a `src/`, `bridge/`, `scripts/`: checkout ignorato escluso. Incidente iniziale di scoperta esterna documentato in REFERENCE_STUDY.md.
- Nuove prove: migrazione/default, pausa/speed nel backup e nel salvaschermo, validazione/clamp, passo indipendente da 30/60 fps, quota/stalli, multi-touch/inerzia/background; markup movimento ridotto/default; snapshot camera corrente esportato con segreti esclusi.
- Revisione indipendente: P2 backup con camera vecchia corretto via getter al click; snapshot background best-effort senza scrittura per frame, reset puntatori interrotti. Ultimo giro mirato **10/10** verde, nessun altro rilievo concreto.
- Manifest offline finale: **376 route/file, 12.666.108 byte**. SHA-256 dell’elenco ordinato `JSON.stringify(await offlineFiles())`: `ec7881c569d78cc3ee65f39d691db1520a143a4731728eb594e03d88824ea0da`. Checksum del manifest, non dei contenuti. Trovati asset generati obsoleti dopo la lunga sospensione della QA: build rigenerata e manifest ricalcolato sulla directory pulita; causa della ricomparsa non accertata.
- Chunk globo/Cesium 4.260,24 kB / 1.146,99 kB gzip, warning dimensione noto. Asset finale osservato nel DOM `/assets/app-T578fIU0.js`.

## Browser

Browser interno su questo Mac; build 4175 separata dalla scena dell’utente 4173. Nessuna autorizzazione fotocamera/GPS, canale live o deploy.

| Prova | Risultato osservato |
|---|---|
| Rotazione e velocità | Barra destra mostra pausa attiva e 0,08; preset Rapida mostra 0,20, link salvaschermo trasmette entrambi i campi. Camera nei link cambia effettivamente da 12° a 10,444752°, poi 9,195552° prima della pausa; non è una misura di fps |
| Pausa/reload | Dopo pausa, scena `rotationEnabled=false`, speed 0,20; ricaricamento conserva entrambi e la stessa longitudine, differenza 0° |
| Backup corrente | Esportazione via UI dopo riavvio Play: enabled=true, speed=0,20, camera aggiornata a 48,651052°. Il download ha avuto una lunga sospensione del controllo: nessuna misura di prestazioni o durata sostenuta deriva da questo intervallo. Snapshot al click coperto anche automaticamente |
| Preset base | Ripristinato 0,08; pannello si chiude con Escape, selezione confermata nel browser |
| Salvaschermo | Link con pausa apre “Ruota il mondo”; avvio manuale mostra “Ferma il mondo” e aggiorna il link. Console senza errori/warning osservati |
| Portrait | 390×844: pausa/velocità presenti, pannello completo, `scrollWidth=clientWidth=390` |
| Landscape finale | 844×390: tutti i controlli principali 44×44 px, preset 64×44; `scrollWidth=clientWidth=844`. Corretto incrocio con Salvaschermo: pannello termina a y=298, pulsante inizia a y=312, nessuna sovrapposizione |
| Scena dell’utente | Reload sulla build finale conserva aerosol e data 10/10/2026, ISS spenta; nuovo default rotazione applicato. Anteprima fotografica separata lasciata disponibile |

Screenshot reali temporanei: `/private/tmp/upari-qa/041-rotation-desktop.png` (Naturale con anteprima Sole −6 h dichiarata), `041-rotation-mobile.png`, `041-rotation-landscape.png`. Non fanno parte della distribuzione. La correzione finale riguarda il layout landscape; desktop/portrait invariati.

## Prove da completare con l’utente

- Telefono reale: fluidità prolungata, consumo/memoria, DPR 2/3, drag/pinch e rientro dal background, movimento ridotto reale; camera/bussola/AR e permessi. Le unità verificano la politica dei gesti; il browser responsive non simula sensori/hardware.
- PWA installata: offline reale, aggiornamento tra versioni e fullscreen.
- Canali propri: recapito/cancellazione con pagina chiusa o telefono bloccato e restart del bridge. Nessun invio live effettuato.
- OSCAR v2: acquisizione autorizzata del file operativo ancora mancante. Restano i limiti dei dati e dell’astronomia descritti nelle sezioni storiche.

---

# Upari — verifiche locali 0.4.0

11 ottobre 2026. Codice locale `bf85a66`, base precedente `96c26f4`. **Nessun push o deploy.** Questa sezione descrive la revisione storica 0.4.0.

## Gate

- TypeScript (`npm run check` e `tsc -b` della build), build di produzione e sintassi SW superati.
- **82 test in 31 file**, compresi HTTP reale loopback, riferimenti astronomici, buffer e i tre nuovi casi di stili/persistenza/migrazione/palette. Il primo tentativo sandbox ha negato `listen` HTTP; ripetuto con permesso di loopback, senza modificare test/assert.
- Revisione indipendente: rilevato e corretto P2 grading del vecchio raster scientifico durante cambio verso foto; 12 test mirati verdi. Nessun altro rilievo concreto su lifecycle/persistenza.
- Nessuna nuova dipendenza npm. Gli ambienti scientifici Python e le sei prove 0.3 non cambiano in questa revisione.
- Shell offline: **377 route/file**, **12.658.980 byte**; SHA-256 dell'elenco ordinato `JSON.stringify(await offlineFiles())`: `bfc2d328988b04cb742c4d937281a824cd7e10e07f1b79df582dcc853aefff26`. Questo checksum riguarda il manifest, non gli asset. Chunk Cesium/globo 4.256,11 kB / 1.145,89 kB gzip: warning di dimensione noto.

## Browser e immagini

Browser interno su questo Mac, sviluppo 4174 e build finale 4175 separati dai dati dell'utente 4173. Riferimento solo README/screenshot pubblici di ha-iss-tracker; nessun sorgente copiato. Metodo in EARTH_STYLES.md.

- Esaminati i sette stili sulla Terra reale; nessun errore/warning WebGL nella QA. Interfaccia non filtrata.
- Build: Naturale notte, anteprima Sole −6 h esplicitamente indicata, zoom out e ritorno a 12 km, ASCII e Voxel. Asset finale verificato nel DOM: `/assets/app-CC24NZF_.js`.
- Individuata regressione di dettaglio notturno troppo buio; risolta includendo il raggio nelle distanze native Cesium. Riprovata la foto Esri a 12 km con Sole all'ora reale, ora leggibile. Il mosaico conserva le sue discontinuità reali.
- Scene reload conserva ASCII, intensità via tastiera Home/End 0/100%; controlli persistiti e roundtrip backup/link coperti anche automaticamente.
- Oceani termici reali: data 10/10/2026, legenda ufficiale e warning con Voxel/Cel. Naturale rimuove l'avviso artistico. Playback conservato: un campione locale 10 aggiornamenti, 302 ms, massimo intervallo 38 ms; nominale 320 ms, nessuna interpolazione dei valori. Campione limitato, non certificazione 60 fps.
- Salvaschermo: Voxel dal link esatto, orologio reale e stile nel caption; cambio ASCII nelle opzioni aggiorna il link. Controlli riattivati con un tocco.
- 390×844: pannello stili in tre colonne, legenda e data termica, warning scientifico, Naturale e salvaschermo ASCII. Nessun overflow orizzontale HTML (`scrollWidth=clientWidth=390`). Viewport temporaneo ripristinato.
- Scheda dell'utente ricaricata sulla build, scena aerosol 10/10 conservata, ISS spenta. Anteprima fotografica separata lasciata disponibile.

Screenshot reali temporanei in `/private/tmp/upari-qa/`: `04-natural-orbit.png` (Sole −6 h), `04-natural-night.png`, `04-natural-zoomout.png`, `04-ascii.png`, `04-voxel.png`, `04-saver-voxel.png`, `04-saver-mobile-ascii.png`, `04-mobile-styles.png`, `04-mobile-natural.png`, `04-detail-final.png`. `04-mobile-detail.png` documenta la regressione precedente e **non** è l'esito finale. I file temporanei non sono parte della distribuzione e possono essere rimossi dal sistema.

## Prove ancora necessarie

Telefono reale: DPR 2/3, fluidità/consumo/memoria dei sette shader, gesti, sospensione e ripresa prolungata; fotocamera/bussola e AR. PWA installata: aggiornamento tra versioni, offline reale e fullscreen. Canali dell'utente: consegna/cancellazione con pagina chiusa, telefono bloccato e restart bridge. OSCAR v2 operativo: file reale autorizzato ancora mancante. Nessun invio live, misura hardware o accettazione visiva dell'utente dichiarata effettuata. Gli altri limiti scientifici/dati della 0.3 restano applicabili.

---

# Upari — verifiche locali 0.3.0

11 ottobre 2026. Base Git `ab609bb`; implementazione locale `96c26f4`, versione corrente 0.3.0. **Nessun push o deploy.** Questa sezione descrive la revisione storica 0.3.0; la 0.2.1 sotto conserva controlli precedenti.

## Gate automatici

| Controllo | Risultato | Portata |
|---|---|---|
| `npm run check` / TypeScript nel build | Superato | Sorgenti e test |
| `npm run test` | **79 test, 30 file** superati | Due worker; geometria, buffer imagery, dati, backup, orizzonti, vettori, satelliti, cache, trasporti e regressioni precedenti |
| `npm run build` | Superato | Due ingressi HTML, Cesium locale, sintassi SW |
| Convertitore CF NetCDF | **6 prove** superate | Tre fixture con NetCDF3/scipy e tre con NetCDF4/h5netcdf; assi, maschere, unità, istanti e livelli |
| HTTP del bridge | Superato | Ricevitore vero su loopback: HA/Gotify/webhook, errore parziale 503, persistenza, restart senza duplicazione, cancellazione futura |
| Revisione indipendente | Completata | Rilievi corretti; ultimo controllo su import backup applicato atomicamente e orbita originale, nessun ulteriore problema concreto segnalato |
| Shell offline | **377 route/file, 12.645.723 byte** | Moduli, font, Cesium, entrambi gli HTML e due pacchetti vettoriali; non comprende tutto il pianeta |

SHA-256 dell'elenco ordinato delle route (`JSON.stringify(await offlineFiles())`): `54f80fdbd0208c027b8aa0289f595b7132be81f271104c3aa0736ac2de8abf64`. È un checksum del manifest, non degli asset. Checksum e metadati dei vettori in `VECTORS.md`. Nessuna nuova dipendenza npm. Gli ambienti scientifici Python sono separati dalla PWA.

Corretto anche un callback ResizeObserver arrivato dopo la rimozione del contenitore: termina su effetto fermato, nodo assente o viewer distrutto. Cambio Terra/ISS e ridimensionamento responsive ripetuti; la console conserva solo il log precedente delle 20:45:16 UTC, senza nuove occorrenze. Fix verificato separatamente dal revisore.

Regressioni nuove: scritture diario atomiche, whitelist/limite/duplicati nei backup, campi OMM obbligatori prima dei default, conservazione dell'epoca importata, identità satellite obbligatoria per gli avvisi, esclusione credenziali dagli URL, stato ntfy salvato prima del POST e conservato su timeout/JSON troncato/5xx. Non sono prove di ricezione push.

## Riferimenti scientifici

Le fixture originali sono conservate. Il Sole usa termini Meeus/NOAA più completi senza allargare le tolleranze; confronto opzionale con Skyfield 1.55, sgp4 2.27 e JPL DE421.

| Confronto | Differenze massime |
|---|---|
| Nove campioni originali | Angoli ISS 0,001909°; Sole 0,002793°; coordinate 0,000423° |
| Sette casi originali, quattro finestre | Estremi/massimo 0,967 s; elevazione massima 0,181° |
| Sei casi estesi con orizzonti, otto finestre | Estremi 1,201 s; elevazione massima 0,457° |

I casi estesi includono maschere circolari degli ostacoli e due date iniziali, 11 e 12 ottobre. Stesso snapshot OMM dell'11 ottobre: non certifica tutte le epoche/stagioni, rifrazione, meteo o allineamento osservativo. Tolleranze originali invariate. Il timeout dei test scientifici è 15 s per evitare fallimenti da contesa CPU, senza modificare gli assert di precisione.

Vettori reali: ASCAT marino 10 ottobre 2026 ore 12 UTC; OSCAR **storico 26 settembre 2014**, composito di cinque giorni. Celle mancanti conservate, griglia decimata circa 2°, velocità m/s e advezione WGS84. Le prove del convertitore usano fixture tecniche, non dati pubblicati come osservazioni. OSCAR v2 autorizzato non scaricato.

## Prove nel browser

Browser interno Codex. Build statica su `127.0.0.1:4173`, sviluppo della stessa revisione su origine isolata `127.0.0.1:4174` per backup e dati di QA. Viewport responsive 390×844, desktop compilato osservato 1143×951 e salvaschermo 1280×720; DPR effettivo 1. Nessuna camera/GPS autorizzata, nessun canale dell'utente invocato.

| Flusso | Esito osservato |
|---|---|
| Oceani termici: play/pausa | Date avanzano; il precedente rimane visibile mentre si prepara il successivo, con la sua data effettiva nell'overlay. Precaricato un solo frame, buffer limitato |
| Confronto | Build: sinistra 10/10/2026, destra 04/10/2026; indicazione del frame precedente durante caricamento e nuova coppia al commit |
| Salvaschermo | Link conserva camera, layer e confronto; due date visibili, orologio corrente indipendente e secondi in avanzamento; nessun errore/warning console osservato |
| SWISSIMAGE | Selezione e camera alpina da backup applicate; testo mosaico con anni diversi, crediti swisstopo. Verifica responsive sulla stessa sorgente |
| Vettori | Pacchetti autentici e timestamp separati dal raster; scie turchesi osservate sul luogo pubblico di QA Atlantico a zoom vicino, 180 primitive nel profilo Auto; molto corte a scala planetaria |
| Backup | Esportato v2 via UI e importato un file locale di QA con snapshot ISS pubblico reale; ISS da spenta ad attiva, camera/scena/orizzonte applicati. Il pannello mostra fonte “Backup locale · epoca originale”, senza ringiovanire il dato |
| Cache | UI mostra due pacchetti / due disponibili, conteggio/byte e avviso di aggiornamento in attesa. Non equivale a una prova di rete completamente disattivata |
| Ripristino | Build finale ricaricata (`app-CbnEaG-S.js`), console senza errori/warning. Scheda dell'utente: aerosol, 10 ottobre, confronto spento, vettori spenti, ISS spenta; camera preservata |

Dissolvenza nominale 320 ms, almeno 1,2 s di permanenza dopo il commit. Un campione responsive locale: 19 aggiornamenti in 319 ms, intervallo massimo 26 ms. Campioni desktop compilati: 8 aggiornamenti in 348–369 ms, intervallo massimo 87–90 ms. Sono osservazioni limitate del browser su questo Mac, non una garanzia di 60 fps: viewport, GPU, caricamento e dati mancanti influenzano la fluidità. Nessuna interpolazione scientifica fra le immagini.

Screenshot reali temporanei in `/private/tmp/upari-qa/`: `03-ocean-compare-desktop.png`, `03-saver-dated.png`, `03-backup-epoch-mobile.png`, `03-swiss-mobile.png`, `03-owner-restored.png`. Non sono concept né parte della build. I file in `/private/tmp` possono essere rimossi dal sistema; il resoconto versionato conserva metodo/esiti.

## Prove ancora necessarie

- **iPhone/Android:** camera e bussola/FOV, entrambe le rotazioni landscape, permessi negati/revocati, background/riattivazione, spegnimento tracce, DPR 2/3 reale, fluidità prolungata e consumo. La guida manuale e i controlli matematici non certificano l'allineamento fisico.
- **PWA installata:** prima installazione, aggiornamento dalla versione precedente, chiusura di tutte le schede e riapertura con rete davvero disattivata. Verificare luoghi/date visitati; quelli assenti non sono garantiti offline. Fullscreen reale non confermato nel browser interno.
- **Canali propri:** scelta/configurazione e messaggio concordato, ricezione con pagina chiusa/telefono bloccato, cancellazione remota, rifiuto/risposta persa e restart. Procedura in `CHANNELS.md`; nessun invio live effettuato.
- **File reali ulteriori:** OSCAR v2 autenticato e un satellite aggiuntivo recente fornito dall'utente. Validatori/conversione verificati, queste due ingestioni operative non provate con file reali.
- **Diario:** validazione e serializzazione verificate automaticamente; scritture concorrenti protette da transazione IndexedDB, controllate nel codice, senza una prova UI simultanea fra più schede. Nessuna osservazione astronomica reale effettuata. Confermare comodità del flusso e persistenza nel proprio uso quotidiano.

Cesium: circa 4,25 MB minificati / 1,14 MB gzip, warning di dimensione presente. Non sono state pubblicate modifiche. Stato/ripresa in `HANDOFF.md`.

---

# Archivio delle verifiche 0.2.1

Data: 11 ottobre 2026. I risultati distinguono test automatici, prove nel browser e accettazione su hardware. Nessun push o deploy; la pubblicazione è rinviata per istruzione dell’utente.

## Ambiente e riproducibilità

- Progetto estratto in `upari/` dallo ZIP originale; storia recuperata dal bundle, base `3b7e16d2bc6bbaf12d21213b39eecb91b9610c4a`.
- Node.js 24.11.1, npm 11.6.2; `npm ci --no-audit --no-fund` completato. Nessuna nuova dipendenza npm.
- `DELIVERY.json` e `upari-history.bundle` identificano la consegna originale 0.2.0, non le modifiche successive. La revisione corrente è nella storia Git locale.
- URL della QA: `http://127.0.0.1:4173/` e `screensaver.html#scene=…`; build statica servita su loopback.
- Browser interno Codex, controllo CUA con locatori Playwright, DOM, screenshot e console. Nessun browser alternativo installato. Viewport mobile 390×844 e desktop 1280×720; framebuffer mobile osservato 390×722, DPR effettivo 1.
- Nessun permesso camera/GPS accettato, nessun endpoint ntfy/HA configurato o invio reale effettuato. New York è stato inserito a mano come luogo pubblico di prova e poi rimosso; Luino e ISS spenta sono stati ripristinati.

## Controlli completati

| Controllo | Risultato | Portata |
|---|---|---|
| `npm run check` | Superato | TypeScript di sorgenti e test |
| `npm run test` | 18 file, 54 test superati | Geometria, eventi, sensori, rendering, cache, meteo, dati, notifiche/bridge, scene e markup |
| `npm run build` | Superato | Due ingressi HTML e runtime Cesium locale |
| `git diff --check` | Superato | Nessun errore di whitespace |
| Service worker generato | Superato | Controllo sintattico nel postbuild |
| Shell e asset HTML | Superato | 376 route/file, 12.252.685 byte; riferimenti di entrambi gli HTML presenti |
| Riferimento indipendente originario | Superato | Nove campioni Skyfield/JPL, fixture conservata |
| Finestre complete indipendenti | Superato | Sette casi, quattro finestre in 72 ore |
| Revisione indipendente del codice | Completata | Corrette due osservazioni; ultimo controllo mirato 13/13, nessun nuovo rilievo alto/medio |

I test aggiunti verificano: rilascio di una camera arrivata dopo stop/background, attivazioni sovrapposte, permessi negati, letture assolute Android/Safari, revoca della camera, pulizia di viewer già distrutti, prefetch massimo otto tile e zoom nativo, cache pubblica/limite/risorse private escluse, deep link offline, cancellazione del fetch ISS senza fallback, cache orbitale scaduta, identità TLE, valori OMM non finiti, backup senza campi sconosciuti/token, unità e codici WMO, secondi dell’orologio e cambio dell’ora di Roma. I test notifiche/bridge simulano il trasporto: non dimostrano consegna esterna.

## Prove nel browser

Flusso principale: Terra → Layer → selezione NASA → date/animazione/confronto → Salvaschermo → pagina autonoma. Flusso ISS: impostazioni → ISS attiva → pannello → luogo di prova → passaggio calcolato → guida manuale → Escape → Terra → ISS spenta.

| Prova | Esito ed evidenza |
|---|---|
| Identità e contenuto | Titoli Upari/Terra e Upari/Salvaschermo, route corrette, contenuto significativo e globo renderizzato |
| Overlay di errore | Nessun overlay Vite/React nella build finale |
| Terra, mobile/desktop | Palette nera/turchese, pianeta dominante, pannelli a richiesta, nessun box AR permanente; ISS assente quando spenta |
| Dialoghi e tastiera | Focus sul pulsante Chiudi, mantenuto quando il picker viene sostituito dai dettagli; chiusura restituisce focus al comando di apertura |
| Layer e animazione | Black Marble 2016, VIIRS giornaliero e termico reali; animazione osservata avanzare le date dopo caricamento; confronto e cursore disponibili |
| Legenda | Legenda NASA della temperatura superficiale caricata, immagine completa e larghezza nativa 403 px; unità K esplicitata |
| ISS e ritorno a Terra | Stato vuoto legittimo per Luino e passaggi calcolati per New York; andata/ritorno senza pagina vuota dopo correzione |
| AR manuale | Dialogo pieno schermo, traiettoria, percorso temporale e regolazioni; camera non avviata; Escape chiude e riporta il focus su Apri cielo AR |
| Salvaschermo | Camera, layer e due date mantenuti nel link; clock vivo e secondi a due cifre; pausa, auto-hide e ricomparsa dei comandi con tastiera |
| Meteo live | Attivato per il luogo pubblico predefinito Luino: Open-Meteo ha restituito temperatura/percepita/vento, condizioni e timestamp validi. Nessun GPS usato |
| Fullscreen | Comando esercitato; nel browser interno `document.fullscreenElement` è rimasto nullo. Ingresso/uscita reali non confermati |
| Console | Un errore Cesium riprodotto prima della correzione; nessun nuovo errore applicativo osservato nei flussi finali. I log della vecchia scheda conservano l’errore precedente |

### Problemi riprodotti e corretti

1. **Pagina vuota in Terra → ISS:** il cleanup dei marker accedeva a `viewer.entities` dopo `viewer.destroy()`. Pulizia ora protetta per luogo e ISS; regressione su collection già distrutta e stesso percorso riprovato nel browser.
2. **Focus perso nel cambio picker/dettagli e alla chiusura:** dialogo etichettato, focus recuperato e restituito all’apertura. AR usa un dialogo nativo e conserva l’opener prima del focus automatico.
3. **Clock/meteo poco leggibili sulle nuvole chiare:** sfumatura statica scura nella metà inferiore del salvaschermo; informazioni sovrapposte al gradiente.
4. **Finestra ISS tagliata durante la salita:** l’ultimo punto viene incluso nel massimo e nel relativo istante. Prima, nel caso New York, il massimo era inferiore al riferimento di circa 1,22°; dopo la correzione la differenza è 0,356°.
5. **Link avvisi offline e letture AR residue:** osservazioni della revisione indipendente riprodotte e corrette, con test di regressione.

### Evidenza visiva e concept

Le immagini sono screenshot del browser, non concept: `/private/tmp/upari-qa/` contiene `blank-iss-before-fix.png`, `iss-after-fix-mobile.png`, `ar-manual-mobile.png`, `nasa-legend-mobile.png`, `earth-final-mobile.png`, `earth-final-desktop.png` e `saver-final-mobile.png`. Sono artefatti locali temporanei, mostrati nella chat; non fanno parte della build.

Il concept approvato `concept-upari-notte.png` rimane il riferimento per palette e gerarchia. Sono mantenuti nero/turchese e pianeta prominente. Il box inferiore ISS/AR del concept è assente per le istruzioni più recenti; i pannelli sono su richiesta. Un overlay NASA a zoom territoriale può mostrare pixel di centinaia di metri: non si sostituisce con un dettaglio inventato.

## Confronti astronomici indipendenti

`skyfield-reference.json` conserva i nove campioni originari: Luino, New York, Sydney, tre istanti tra 11 e 13 ottobre. Massime differenze: azimut/elevazione 0,001909°, Sole 0,005331°, coordinate 0,000424°. Le tolleranze restano 0,1° per angoli, 0,15° per Sole, 0,05° per coordinate, 0,3 km per quota.

La nuova `skyfield-events.json` è generata da `scripts/skyfield-events.py` in ambiente scientifico separato: Skyfield 1.55, sgp4 2.27, JPL DE421, WGS84, elevazione geometrica e Sole apparente ≤ −6°. L’illuminazione confronta separazione angolare dei dischi Terra/Sole con raggi 6378,137/695700 km; scansione 15 s e transizioni affinate a 0,1 s. Nessuna dipendenza scientifica entra nella PWA.

| Caso, soglia | Finestre concordi, 72 ore dall’11 ottobre ore 16:00 UTC |
|---|---:|
| New York, 10° | 2 |
| Sydney, 10° | 1 |
| Luino, 10° | 0 |
| Quito, 5°, quota 2,85 km | 1 |
| Reykjavik, 5° | 0 |
| Longyearbyen, 5° | 0 |
| New York, 70° | 0 |

Massima differenza agli estremi e al massimo: **1,905 s**; altezza massima **0,357°**. Tolleranze: 3 s agli estremi, 6 s al massimo (campionato ogni 5 s), 0,5° all’altezza massima della finestra. Quest’ultima differisce dal confronto a istante fisso: spostare di circa due secondi la soglia solare può cambiare di circa 0,4° un segmento ancora in salita. Queste tolleranze descrivono la regressione del prototipo e non una promessa di precisione osservativa.

Entrambi i calcoli condividono lo stesso snapshot OMM: errori o invecchiamento delle effemeridi non sono verificati indipendentemente. Gli eventi completi coprono una sola epoca, non tutte le stagioni. Ora legale primaverile/autunnale di Roma verificata separatamente su orari locali, calendario UTC e pianificazione; i timestamp di quelle prove sono fixture tecniche, non passaggi previsti. Ostacoli locali, rifrazione e meteo di osservazione non sono modellati.

## Limiti e prossimo passo

- **DPR 2 e hardware:** il browser interno espone dimensioni, non una variazione di DPR. Budget DPR 2/3 coperti dai test matematici; nitidezza, frame rate e consumo reali restano da misurare.
- **AR fisica:** provare iPhone/Safari e Android/Chrome, permessi accettati/rifiutati, entrambi i landscape, riattivazione, calibrazione, background e spegnimento tracce. I test della sessione non certificano bussola/FOV o allineamento reale.
- **PWA:** shell completa e cache verificata con trasporto simulato; installazione, aggiornamento dalla 0.1/0.2 e riapertura a rete disattivata restano da provare nel browser completo. Cache tile limitata a 48 MiB/120 elementi: una zona mai visitata non è garantita offline; effemeridi ISS non vengono precaricate con ISS spenta.
- **Fullscreen e meteo:** fullscreen reale aperto; meteo live verificato in questa sessione, mentre refresh a lungo termine/fallimento della rete e altri browser richiedono una prova ulteriore.
- **Avvisi:** nessun canale reale disponibile. Test ntfy/HA richiedono endpoint scelti dall’utente, autorizzazione all’invio e prove di cancellazione/riavvio/pagina chiusa.
- **Bundle:** globo circa 4,24 MB minificato / 1,14 MB gzip, warning Vite noto e ancora presente. Non è una misura di prestazione su telefono.
- **Scope futuro:** vettori correnti/venti, maschere dell’orizzonte, diario, altri satelliti, fonti regionali, altri canali. Il progetto non è presentato come specifica interamente completata.

Ripresa consigliata: completare PWA/DPR/fullscreen nel browser completo, quindi AR sui telefoni reali e avvisi con i canali dell’utente. Mantenere gli artefatti originali, le regressioni e il vincolo di nessun deploy fino a richiesta esplicita.
