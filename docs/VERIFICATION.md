# Upari — verifiche della revisione locale 0.2.1

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
