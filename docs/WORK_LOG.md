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
