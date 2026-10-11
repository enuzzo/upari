# Passaggio qualità e UI/UX — 0.2.0

Richieste dell'11 ottobre 2026: migliorare il mondo sgranato, ottimizzare mobile e desktop, togliere il box AR permanente, rendere ISS opzionale e trasformare ogni vista terrestre in un salvaschermo autonomo. Il deploy è rinviato su istruzione dell'utente.

## Modifiche concrete

| Prima | Revisione |
|---|---|
| Scala ridotta con DPR ignorato da Cesium | DPR nativo esplicitamente abilitato; scala coerente con la densità e un budget di pixel |
| NASA Blue Marble come base principale, dettaglio limitato | Fotografia Esri iniziale; NASA di riserva in caso di mancata inizializzazione |
| Globo mobile alto 53svh, seguito da passaggio e AR | Globo occupa lo spazio fra header e navigazione; box AR eliminato |
| Rail desktop permanente con controlli e passaggio | Globo a tutta larghezza; pannello laterale aperto su richiesta |
| Cielo e Avvisi sempre presenti, calcoli sempre attivi | ISS inizialmente spenta; strumenti e moduli caricati quando attivati |
| Scelta e dettagli del layer poco collegati sul telefono | Selezione porta direttamente ai dettagli della vista nello stesso pannello |
| Camera persa cambiando sezione | Camera conservata localmente e ripresa all'apertura |
| Unica pagina dell'app | Seconda pagina statica salvaschermo con configurazione nel frammento URL |

La palette nera/turchese e il grande pianeta restano. L'ingombro inferiore del concept originale è superato dalla richiesta esplicita dell'utente.

## Rendering

Automatica: rapporto pixel massimo 2, budget indicativo 3 milioni di pixel; Alta: rapporto massimo 3 e 8 milioni; Risparmio: rapporto 1 e antialiasing ridotto. Il budget non scende sotto la risoluzione CSS del viewport. Su 390×720 con DPR 3, Automatica rende a 780×1440, anziché il vecchio rapporto effettivo 0,5. Questi sono risultati del calcolo verificato dai test, non misure di un dispositivo reale.

Cesium resta in request-render mode, con orologio fermo e richieste esplicite per sole, camera e rotazione. In background si interrompe il render loop. Niente precaricamento dei tile fratelli. La base NASA viene rimossa quando si inizializza quella Esri. Il catalogo NASA viene aggiornato quando si apre il pannello layer. La qualità dell'overlay scientifico resta limitata alla fonte.

Il salvaschermo usa Alta e una rotazione di 0,2°/s per impostazione predefinita. Orologio e meteo hanno componenti indipendenti dal globo; il renderer è memoizzato.

## Flussi da controllare nel browser

| Flusso | Risultato atteso |
|---|---|
| Apertura senza preferenze | Fotografia terrestre; niente passaggi, AR o Avvisi |
| Layer → prodotto NASA | Globe aggiornato, pannello sui dettagli e date del prodotto |
| Chiusura del pannello | Recupero dello spazio del globo; focus al comando d'apertura |
| Qualità → Alta/Risparmio | Cambiano framebuffer e livello di dettaglio senza ricreare il viewer |
| Strumenti → ISS attiva/spenta | Compaiono/scompaiono navigazione e tracking; worker/timer fermati quando spenta |
| Salvaschermo → apri | Nuova pagina con identici zoom, orientamento, layer e confronto |
| Chiudi la scheda principale | Salvaschermo continua autonomamente |
| Ora/meteo disattivati | Nessun HUD corrispondente; nessuna richiesta meteo se disattivato |
| Background e ritorno | Rotazione sospesa e ripresa senza salto; ora riallineata |

Viewport prioritari: 320×568, 390×844, 844×390 landscape, 1024×768, 1440×900 e desktop con DPR 2. Verificare font, crediti, immagini, sovrapposizioni, dialoghi, tastiera, fullscreen, retina, frame rate e memoria.

**Verifica visiva ancora da fare:** il Browser plugin richiesto dal flusso Sites gestito non è disponibile. Non è stato avviato un preview alternativo e non ci sono screenshot della 0.2. Test e build sono completi; i flussi in tabella sono criteri di accettazione da provare, non risultati inventati.
