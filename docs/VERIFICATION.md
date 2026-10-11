# Upari — verifiche della consegna 0.1.0

Data di verifica: 11 ottobre 2026. Questa pagina distingue i controlli effettivamente eseguiti dalle prove ancora necessarie. La build e i test non sostituiscono una sessione nel browser o su telefono.

## Ambiente e riproducibilità

- Node.js 24.19.0; npm 11.9.0.
- Dipendenze risolte da `package-lock.json`: React 19.3.0, Cesium 1.146.0, satellite.js 6.0.2, Vite 6.4.4, TypeScript 5.9.3, Vitest 3.2.7.
- Il codice della consegna e la storia Git sono identificati in `DELIVERY.json`, dentro lo ZIP. La build statica è in `dist/`.
- Nessun account ntfy/Home Assistant collegato. Nessun invio reale effettuato.

## Controlli completati

| Controllo | Risultato | Portata |
|---|---|---|
| `npm run check` | Superato | Controllo TypeScript di sorgenti e test |
| `npm run test` | 5 file, 15 test superati | Calcolo orbitale, proiezione del cielo, code e bridge |
| `npm run build` | Superato | Bundle Vite e copia degli asset Cesium |
| Sintassi service worker | Superata | `node --check` sul sorgente e sul file generato; il postbuild ripete il controllo |
| Sintassi bridge/script asset | Superata | Parsing Node di `bridge/core.mjs`, `bridge/server.mjs`, `scripts/cesium-assets.mjs` |
| Confronto indipendente | 9 campioni superati | Skyfield 1.55, SGP4 Python 2.27, effemeridi JPL DE421 |

I file di test sono `src/lib/orbits.test.ts` (5), `ar-math.test.ts` (3), `notifications.test.ts` (3), `skyfield-reference.test.ts` (1 test su 9 campioni) e `bridge/core.test.mjs` (3).

I test notifiche simulano il trasporto: controllano selezione, limiti, orari di quiete, invii parzialmente accettati e blocco dopo risposte incerte. I test del bridge verificano persistenza, deduplicazione e filtri. Non dimostrano la consegna su servizi esterni.

## Confronto orbitale indipendente

La fixture `skyfield-reference.json` usa lo stesso snapshot OMM datato, ma un'altra implementazione SGP4 e una posizione del Sole calcolata con JPL DE421. Contiene Luino, New York e Sydney, in tre istanti fra l'11 e il 13 ottobre 2026. Lo script di generazione è `scripts/skyfield-reference.py`.

| Quantità | Massima differenza nei 9 campioni |
|---|---:|
| Azimut/elevazione ISS | 0,001909° |
| Elevazione del Sole | 0,005331° |
| Latitudine/longitudine del sottopunto | 0,000424° |
| Condizione di illuminazione nei campioni | Tutti concordi |

Le tolleranze del test sono più ampie: 0,1° per azimut/elevazione, 0,15° per elevazione solare, 0,05° per coordinate geografiche e 0,3 km per quota. Le differenze osservate non sono una certificazione di accuratezza fisica o dei tempi di ogni passaggio. Le due implementazioni condividono le stesse effemeridi, che possono essere errate o vecchie.

La previsione scandisce il tempo ogni 15 secondi, affina le soglie a meno di 0,5 secondi e campiona il massimo ogni 5 secondi. Restano da confrontare eventi completi, ingressi/uscite dall'ombra, basse elevazioni, latitudini estreme, fusi e ora legale. Non sono modellati ostacoli locali, rifrazione o nuvolosità osservata.

## Limiti della build

Il globo è caricato in un chunk separato, di circa 4,24 MB minificati (1,14 MB gzip). Vite segnala la sua dimensione. Il bundle iniziale è circa 314 kB (102 kB gzip). La build con gli asset Cesium occupa circa 13 MB non compressi. Occorre misurare memoria, frame rate e primo caricamento su telefoni reali prima di ulteriori interventi sulle prestazioni.

Il postbuild ha corretto una sostituzione errata nel template del service worker e verifica la sintassi del file finale. Questo non prova ancora installazione, aggiornamento o funzionamento offline nel browser.

## Prove ancora da eseguire

1. **Browser e aspetto:** aprire la build a 390×844 e su desktop, controllare console/rete, globo, font, controlli, dialoghi, tastiera e confronto con `concept-upari-notte.png`. Verificare anche lo stato con zero passaggi a Luino.
2. **Dati e layer:** tile NASA reali, legende, date mancanti, animazione, confronto, zoom Esri, crediti e gestione degli errori.
3. **PWA:** installazione, riapertura offline, worker orbitale e chunk Cesium già visitati, limiti cache, aggiornamento da una build precedente e recupero dopo cache incompleta.
4. **Telefono:** Safari/iPhone e Chrome/Android, permessi accettati/rifiutati, sensori assenti, orientamento portrait/landscape, calibrazione, attivazioni ripetute, background e chiusura delle tracce video.
5. **Avvisi reali:** endpoint scelti dall'utente, autorizzazione, pianificazione/cancellazione ntfy, risposte parziali, bridge HA dopo riavvio, pagina chiusa e filtri di presenza/meteo.

Il controllo browser richiesto dal flusso Sites non era disponibile in questo ambiente; il flusso imponeva di saltare questa verifica, senza installare un browser alternativo. Non esistono screenshot della build: il PNG incluso è il concept approvato.
