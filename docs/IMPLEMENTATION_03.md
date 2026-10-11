# Continuazione autorizzata — 11 ottobre 2026

Specifica: `Upari_specifica_originale.md`, AGENTS.md e richiesta dell'utente di completare autonomamente il lavoro verificabile, senza deploy. Design già approvato; nessuna nuova selezione visiva. Implementazione nello stesso checkout, revisione separata in sola lettura.

## Sequenza e criteri

1. Date scientifiche sempre visibili: fotogramma effettivamente mostrato, confronto, frequenza, ultimo giorno dichiarato dal catalogo, distinzione dall'orologio e dal Sole. Test su compositi, UTC e confronto.
2. Riproduzione: conservare la scena precedente fino al caricamento della successiva, precaricare in Cesium un solo fotogramma, transizione breve senza schiarimenti, limiti di memoria, cancellazione/errori/background. Test del buffer e prova nel browser; misure osservate, nessuna promessa di fps su telefono.
3. Orizzonte: otto direzioni per luogo, interpolazione circolare, soglia combinata con elevazione minima nel worker; backup e riferimenti indipendenti.
4. Diario locale: osservazioni dichiarate dall'utente, note e contesto orbitale, nessuna osservazione automatica; import/export validati.
5. Fonti regionali: SWISSIMAGE ufficiale selezionabile, copertura e data del mosaico dichiarate; preservare scene/salvaschermo e crediti.
6. Vettori: pacchetti reali con fonte/data/risoluzione/maschera dei dati mancanti, adattatore riproducibile, vento e correnti distinti. Accesso autenticato OSCAR v2 resta nel distributore. Non chiamare attuale un archivio storico pubblico.
7. Altri satelliti: import locale di effemeridi validate, nessun nuovo fetch automatico; stesso worker, identità esplicita, avvisi ISS separati.
8. Canali: adattatori server Gotify/webhook, segreti soltanto nell'ambiente del bridge; prove con trasporto locale e conservazione delle semantiche della coda.
9. Offline: stato/cache visibili, risorse dei nuovi moduli incluse, garanzie limitate ai dati salvati e validi.
10. Check/test/build, revisione indipendente, browser mobile/desktop, documentazione e commit locali. Nessun push/deploy.

## Prove esterne

Fotocamera/bussola/FOV e orientamento richiedono telefono reale. Recapito, cancellazione remota e app chiusa richiedono canali scelti dall'utente. Installazione PWA, storage persistente e prestazioni energetiche restano specifiche di browser/hardware. Annotare queste prove senza bloccare lo sviluppo locale.
