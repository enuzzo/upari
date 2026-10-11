# Upari — passaggio a Codex

Questa consegna contiene la revisione **0.2.1**, con verifica browser e correzioni di dialoghi, ciclo di vita Cesium/AR, riproduzione, cache e validazione dei dati. Il progetto completo descritto nella specifica rimane più ampio di questa versione. **Nessun deploy della 0.2:** l'utente ha rinviato la pubblicazione; il sito esistente serve ancora 0.1.

## Decisioni ferme

Upari è il nome approvato. La direzione scelta da Luca è nera e turchese, con un grande globo. React/TypeScript/Vite per la PWA; CesiumJS per la geografia; satellite.js/SGP4 per ISS; IndexedDB per luoghi e impostazioni. Home Assistant è facoltativo. Nessun fork, account Upari o chiave Cesium ion obbligatoria.

Le ultime richieste superano il box passaggio/AR del concept: Terra occupa il viewport disponibile, ISS è opzionale e inizialmente spenta, i pannelli compaiono su richiesta. Ogni vista terrestre si può aprire come pagina salvaschermo autonoma. Vedere `UIUX_PASS_02.md` e `SCREENSAVER.md`.

## Contenuto

| Elemento | Stato concreto |
|---|---|
| Interfaccia | Terra/Layer/Strumenti; ISS/Avvisi solo quando abilitati; desktop senza rail fisso, mobile senza box AR |
| Globo | Cesium, ellissoide, Esri fotografico iniziale, NASA di riserva, illuminazione, Black Marble storico e marker locale |
| Qualità | DPR nativo, budget di pixel, Auto/Alta/Risparmio, livello di dettaglio e antialiasing; misure su hardware da fare |
| NASA | Dieci prodotti curati, catalogo/date aggiornabili, date valide, opacità, legende ufficiali |
| Animazione/confronto | Massimo sette date; attende le immagini, prefetch limitato a otto tile della data successiva, pausa su errori/background; confronto provato nel browser |
| Fotografia a zoom elevato | Esri World Imagery predefinito, attribuzioni native; risoluzione variabile, non una promessa di case dettagliate ovunque |
| Salvaschermo | Seconda pagina HTML, snapshot camera/layer/date/confronto, rotazione, ora corrente, meteo Open-Meteo opzionale e Fullscreen API |
| Luoghi/preferenze | IndexedDB, inserimento manuale/GPS, temi, preferiti layer, backup/import senza credenziali |
| ISS | Opzionale; OMM pubblico/import TLE, worker SGP4, Sole sotto −6°, satellite interamente illuminato, soglia 5–70°, finestra massima 72 ore |
| Guida AR | Sessione isolata per fotocamera/bussola, risultati tardivi e revoca gestiti, dialogo e fallback manuale; sette test di ciclo di vita, telefono ancora da provare |
| ntfy | Piano di massimo 48 ore, filtri, stato locale, sequenze deterministiche, risposta verificata, cancellazione e gestione parziale; solo test simulati |
| Home Assistant | Bridge Node incluso, piano persistente, deduplicazione, scadenza, filtri di presenza/meteo opzionali, token HA fuori dal browser |
| PWA/offline | Shell completa con moduli delle due pagine, Cesium e font; cache pubblica NASA/Esri 48 MiB/120 elementi, link avvisi offline; comportamento browser completo da verificare |
| Correnti/venti | Non implementati; non sono simulati con particelle decorative |

## Limiti da non nascondere

- Screenshot reali e prove mobile/desktop sono documentati in `VERIFICATION.md`. Il concept resta la direzione approvata; la verifica tecnica non equivale ad approvazione visiva dell’utente.
- Fotocamera, bussola, rotazione del telefono, consegna ntfy e HA non sono stati testati su dispositivi o servizi dell’utente.
- DPR 2 reale, installazione/aggiornamento PWA, offline a rete disattivata, fullscreen restano da provare. Il meteo live Open-Meteo è stato verificato per il luogo pubblico Luino. Il browser interno consente la verifica delle dimensioni e delle interazioni, non la certificazione su schermi o telefoni reali.
- Le effemeridi di distribuzione hanno epoca 11 ottobre 2026. Non sono una sorgente sempre aggiornata; vengono usate soltanto se fresche. Sono confrontate sette combinazioni luogo/soglia e quattro finestre complete con Skyfield/JPL; vedere tolleranze e limiti in VERIFICATION.md. Dopo sette giorni la copia viene rifiutata; gli avvisi richiedono dati entro 48 ore.
- A Luino, nel caso di controllo 11 ottobre 2026 ore 16:00 UTC, non risultano intervalli osservabili sopra 10° nelle successive 72 ore. Questo è uno stato vuoto legittimo, non un errore da coprire con orari dimostrativi. Altre località di controllo hanno passaggi.
- La soglia di sette giorni per il globo/previsioni è un limite di prototipo. Per l’uso osservativo serio valutare un limite più stretto dopo confronto esteso con riferimenti indipendenti.
- In AR il campo visivo è regolabile e approssimato. La bussola può essere imprecisa; non c’è riconoscimento ottico della ISS.
- Non c’è un servizio sempre attivo gestito da Upari. La coda esterna va aggiornata dall’utente; il bridge consuma il piano ricevuto e non recupera nuove effemeridi autonomamente.
- ntfy deve confermare l’ID di sequenza e l’istante richiesto nella risposta. Una risposta incerta viene registrata e ferma la coda. Non viene nascosto un invio potenzialmente già accettato.
- Le date del catalogo non assicurano copertura di ogni pixel. La proiezione WMTS Mercator esclude le regioni oltre circa 85° di latitudine. Gli overlay restano alla propria risoluzione anche quando la fotografia di base è più dettagliata.
- Maschera dell’orizzonte per ostacoli, diario, altri satelliti, fonti regionali configurabili, vettori OSCAR/vento, notifiche aggiuntive e hardware QA restano da sviluppare.

## Ripresa consigliata

Leggere AGENTS.md e VERIFICATION.md. Partire da `npm run check`, `npm run test`, `npm run build` e `npm run preview`. Completare DPR 2 e PWA offline/aggiornamento in un browser completo, poi AR su iPhone/Android e ntfy/HA con i canali scelti dall’utente. Conservare le prove e i limiti aperti. Il ripristino del globo passando Terra/ISS e la gestione del focus sono regressioni già corrette: riprovare questi flussi dopo modifiche al ciclo di vita. Le credenziali assenti non bloccano il lavoro autonomo su correnti/venti reali, maschere dell’orizzonte e diario; consultare il ledger delle fonti prima di implementarli.

Non sostituire l’interfaccia con una landing page. Non reintrodurre il blocco di selezione dei concept: la selezione è già avvenuta.
