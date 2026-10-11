# Fonti fotografiche regionali — 0.3.0

La configurazione pubblica è `src/lib/regional-layers.json`, validata in fase di build. SWISSIMAGE è incluso: EPSG:3857, tile JPEG 256 px, livelli 0–20, bounding box ufficiale 5.140242/45.398181/11.47757/48.230651. Il servizio `current` è un mosaico di anni diversi, non una fotografia dell'anno corrente. La Svizzera ha un originale 10 cm in pianura / 25 cm nelle Alpi; il servizio include paesi circostanti con SPOT5 2004–2005 a 5 m. Crediti swisstopo sempre conservati.

Per aggiungere una fonte alla propria installazione:

1. Verifica condizioni, CORS, crediti, copertura, acquisizione, risoluzione e massimo zoom nella documentazione ufficiale.
2. Aggiungi un oggetto nel JSON, con chiave `region-nome`, metadati completi e `dataLabel` esplicita: data di acquisizione documentata o variabilità per zona. Non inserire credenziali.
3. Usa URL HTTPS pubblici senza query, autenticazione o frammenti. Il template deve avere `{z}/{x}/{y}` e servire tile 256 px EPSG:3857. Bounding box senza attraversamento dell'antimeridiano; maxLevel 0–22.
4. Esegui check/test/build, poi verifica crediti, posizione geografica e zoom nel browser. Il validatore controlla il contratto, non riproietta né certifica la fonte.

Fonti WMTS con altro sistema di coordinate, WMS arbitrario, terreno e edifici 3D richiedono adattatori ulteriori. La cache pubblica offline include soltanto i provider ufficiali già allowlisted: un nuovo provider non viene automaticamente salvato dal service worker. Il provider vede le richieste delle tile e può dedurne l'area.

Fonti: https://docs.geo.admin.ch/visualize-data/wmts.html e https://www.swisstopo.admin.ch/it/ortofoto-swissimage-10-cm. Sono state controllate le capabilities ufficiali WMTS e la matrice 3857_20, senza leggere il codice applicativo del progetto di riferimento.
