# Salvaschermo autonomo

Il comando Salvaschermo crea un indirizzo per il secondo ingresso statico della build, `/screensaver.html`. La pagina carica il proprio codice e il renderer condiviso; non legge la finestra principale e non richiede che quella scheda rimanga aperta.

## Vista conservata

- Layer fotografico o prodotto NASA selezionato, data e opacità.
- Confronto fra date e posizione del separatore.
- Posizione geografica della camera, quota, heading/pitch/roll.
- Illuminazione e scostamento temporale del Sole.
- Luogo per il meteo, ora visibile/nascosta, meteo attivo/spento e velocità della rotazione.

La configurazione è validata e contenuta nel frammento dell'URL, dopo `#`. Il server di hosting non riceve il frammento. Il link contiene comunque le coordinate del luogo: chi riceve il link può leggerle. Non contiene token, coda notifiche o preferenze estranee.

La pagina conserva la data scientifica selezionata. L'ora visualizzata è sempre l'ora corrente del dispositivo. Il Sole segue l'ora corrente più l'eventuale offset scelto e indicato nel credito della vista. Il salvaschermo non serializza la traccia ISS o le credenziali degli avvisi.

## Schermo e interazioni

La pagina usa l'intero viewport. Il comando Schermo intero usa la Fullscreen API dopo un click, quando disponibile nel browser. Su browser senza questa API la pagina resta a tutto viewport. I controlli scompaiono dopo circa 6,5 secondi; puntatore, tocco o tastiera li richiamano. Sono disponibili pausa della rotazione, opzioni e ritorno a Upari.

Il renderer si ferma in background. La rotazione non recupera il tempo perso tornando visibile, per evitare salti. Si rispetta `prefers-reduced-motion`; la rotazione rimane ferma sui dispositivi che la richiedono. La qualità Alta usa un budget finito di pixel, non una promessa di risoluzione illimitata.

## Meteo facoltativo

Open-Meteo riceve le coordinate soltanto se l'opzione è attiva. Vengono richiesti temperatura a 2 m, temperatura percepita, vento a 10 m e codice WMO; il tempo è UNIX UTC. Il display converte l'ora al fuso del dispositivo. I dati sono stime da modelli, non misure di una stazione del luogo.

Refresh ogni 30 minuti mentre la pagina è visibile, timeout 15 secondi e abort alla chiusura del componente. Valori mancanti, unità non previste, dati troppo vecchi o fuori intervallo vengono rifiutati. Un dato oltre un'ora non viene presentato come corrente. Errori del meteo non interrompono il globo. L'attribuzione Open-Meteo è visibile.

## Build e ripresa — ✈️ STE100

1. Esegui `npm ci`.
2. Esegui `npm run build`.
3. Esegui `npm run preview`.
4. Apri Upari all'indirizzo del terminale.
5. Crea la vista.
6. Apri il salvaschermo dal suo comando.

Distribuire il contenuto completo di `dist`, inclusi `screensaver.html`, asset condivisi, font e runtime Cesium. La pagina non va aperta con `file://`. L'autonomia dalla scheda principale non implica l'assenza di richieste alle fonti delle immagini o del meteo. Il service worker preserva la route del salvaschermo quando offline; servono comunque moduli già visitati e immagini disponibili nella cache.

Restano da verificare in un browser reale: conservazione della camera, due date, permessi fullscreen, controlli nascosti/focus, rotazione, meteo/CORS, background, memoria e aggiornamento del service worker.
