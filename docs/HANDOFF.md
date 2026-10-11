# Upari — passaggio a Codex

Questa consegna contiene la revisione **0.2.0**, con miglioramento di qualità/UI e pagina salvaschermo. Il progetto completo descritto nella specifica rimane più ampio di questa versione. **Nessun deploy della 0.2:** l'utente ha rinviato la pubblicazione; il sito esistente serve ancora 0.1.

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
| Animazione/confronto | Sequenza di massimo sette date, confronto dello stesso prodotto fra due date, cursore di separazione |
| Fotografia a zoom elevato | Esri World Imagery predefinito, attribuzioni native; risoluzione variabile, non una promessa di case dettagliate ovunque |
| Salvaschermo | Seconda pagina HTML, snapshot camera/layer/date/confronto, rotazione, ora corrente, meteo Open-Meteo opzionale e Fullscreen API |
| Luoghi/preferenze | IndexedDB, inserimento manuale/GPS, temi, preferiti layer, backup/import senza credenziali |
| ISS | Opzionale; OMM pubblico/import TLE, worker SGP4, Sole sotto −6°, satellite interamente illuminato, soglia 5–70°, finestra massima 72 ore |
| Guida AR | Fotocamera posteriore, orientamento assoluto quando disponibile, guida manuale, proiezione, regolazione del nord/FOV/tempo; non testata su telefono |
| ntfy | Piano di massimo 48 ore, filtri, stato locale, sequenze deterministiche, risposta verificata, cancellazione e gestione parziale; solo test simulati |
| Home Assistant | Bridge Node incluso, piano persistente, deduplicazione, scadenza, filtri di presenza/meteo opzionali, token HA fuori dal browser |
| PWA/offline | Manifest, icone, service worker con shell e cache limitata; comportamento offline completo da verificare nel browser |
| Correnti/venti | Non implementati; non sono simulati con particelle decorative |

## Limiti da non nascondere

- Non ci sono screenshot di una sessione browser dell’app. Il concept originale è incluso e la verifica visiva è ancora da fare.
- Fotocamera, bussola, rotazione del telefono, consegna ntfy e HA non sono stati testati su dispositivi o servizi dell’utente.
- Non è stata verificata nel browser la 0.2: qualità retina, interazione dei pannelli, fullscreen, rendering/rotazione del salvaschermo e meteo/CORS rimangono da provare. Le risposte meteo sono validate con fixture; l'endpoint live non era accessibile allo strumento di ricerca.
- Le effemeridi di distribuzione hanno epoca 11 ottobre 2026. Non sono una sorgente sempre aggiornata; vengono usate soltanto se fresche. Dopo sette giorni la copia viene rifiutata; gli avvisi richiedono dati entro 48 ore.
- A Luino, nel caso di controllo 11 ottobre 2026 ore 16:00 UTC, non risultano intervalli osservabili sopra 10° nelle successive 72 ore. Questo è uno stato vuoto legittimo, non un errore da coprire con orari dimostrativi. Altre località di controllo hanno passaggi.
- La soglia di sette giorni per il globo/previsioni è un limite di prototipo. Per l’uso osservativo serio valutare un limite più stretto dopo confronto esteso con riferimenti indipendenti.
- In AR il campo visivo è regolabile e approssimato. La bussola può essere imprecisa; non c’è riconoscimento ottico della ISS.
- Non c’è un servizio sempre attivo gestito da Upari. La coda esterna va aggiornata dall’utente; il bridge consuma il piano ricevuto e non recupera nuove effemeridi autonomamente.
- ntfy deve confermare l’ID di sequenza e l’istante richiesto nella risposta. Una risposta incerta viene registrata e ferma la coda. Non viene nascosto un invio potenzialmente già accettato.
- Le date del catalogo non assicurano copertura di ogni pixel. La proiezione WMTS Mercator esclude le regioni oltre circa 85° di latitudine. Gli overlay restano alla propria risoluzione anche quando la fotografia di base è più dettagliata.
- Maschera dell’orizzonte per ostacoli, diario, altri satelliti, fonti regionali configurabili, vettori OSCAR/vento, notifiche aggiuntive e hardware QA restano da sviluppare.

## Ripresa consigliata

Leggere AGENTS.md, VERIFICATION.md e UIUX_PASS_02.md. Eseguire la build e avviare il browser locale. Verificare prima Terra e Salvaschermo, su mobile/desktop e schermi densi: asset, immagini, zoom, camera conservata, pannelli, fullscreen, clock, meteo e background. Poi layer, date, confronto, preferiti e backup. Successivamente attivare ISS ed effettuare test reali di AR e avvisi, con i canali scelti dall’utente. Mantenere nero e turchese; non ripristinare il box AR fisso.

Non sostituire l’interfaccia con una landing page. Non reintrodurre il blocco di selezione dei concept: la selezione è già avvenuta.
