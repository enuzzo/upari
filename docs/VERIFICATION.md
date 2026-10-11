# Upari — verifiche locali 0.3.0

11 ottobre 2026. Base Git `ab609bb`; implementazione locale `96c26f4`, versione corrente 0.3.0. **Nessun push o deploy.** Questa sezione è lo stato corrente; la 0.2.1 conservata sotto descrive controlli storici, con numeri e limiti dell'epoca.

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
