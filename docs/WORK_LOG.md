# Upari — lavoro svolto

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
