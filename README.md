# Upari 1.0

Il pianeta Terra raccontato dai suoi dati di oggi. Un documentario interattivo per desktop: undici capitoli brevi, una voce narrante scritta, un globo che si può trascinare, avvicinare fino a 10 m per pixel e interrogare punto per punto.

## Capitoli

Il pianeta · Il respiro (venti GFS) · Le correnti (OSCAR) · Il calore del mare (GHRSST MUR) · La febbre (anomalie) · Il mare che fiorisce (PACE) · La pioggia (GPM IMERG, 24 ore) · Il fuoco (FIRMS) · Il ghiaccio (GAMSSA) · Le luci (Black Marble) · Lassù (ISS in tempo reale).

Le frasi con numeri (il vento più forte, il mare più caldo, la quota della Stazione Spaziale, la percentuale di oceani oltre la media) sono calcolate dai dati all'apertura.

## Motore

three.js e shader propri: scattering atmosferico a singola diffusione (Rayleigh + Mie) sia sul bordo sia sulla superficie, luce del Sole calcolata per l'istante presente, rilievo da DEM in luce radente, nuvole trasportate dai venti reali (flow map), particelle GPU per venti e correnti, palette scientifiche ricampionate in bicubico, bloom HDR e tone mapping ACES. Da vicino si caricano le tessere Sentinel-2 cloudless di EOX. La risoluzione si adatta da sola se la GPU fatica.

## Comandi

```bash
npm install
npm run dev          # http://127.0.0.1:4181
npm run build        # dist/
```

Dati (tutti rigenerabili, richiedono ImageMagick):

```bash
node scripts/prepare-earth.mjs    # texture giorno, notte, nuvole, rilievo
node scripts/prepare-fields.mjs   # venti GFS e correnti OSCAR
node scripts/prepare-layers.mjs   # mare, anomalie, ghiaccio, clorofilla, pioggia, fuochi
node scripts/prepare-stars.mjs    # Yale Bright Star Catalogue
node tools/shots.mjs http://127.0.0.1:4181/ shots   # screenshot di QA in Chrome headless
```

Tastiera: spazio pausa, frecce capitoli, I approfondimento, F schermo intero, + e − zoom, / cerca un luogo (Nominatim di OpenStreetMap, una richiesta solo quando premi Invio), M audio (musica e ambienti, attivi dopo il primo clic).

## Aggiornamento quotidiano

Il workflow [`pages.yml`](.github/workflows/pages.yml) gira ogni giorno alle 10:41 UTC (dopo che NASA pubblica i dati del giorno prima), a ogni push su `main` e a richiesta. Scarica venti, mare, anomalie, ghiaccio, fitoplancton, 24 ore di pioggia, fuochi e l'orbita della ISS, ricostruisce il sito e lo pubblica su GitHub Pages: https://enuzzo.github.io/upari/

I dati freschi non vengono committati: il repository conserva un'istantanea verificata, che il sito usa ogni volta che una fonte è in ritardo, incompleta o irraggiungibile (il riepilogo del workflow lo segnala). Uno strato nuovo entra solo se la sua copertura è almeno l'80% di quella dell'istantanea (il ghiaccio, che cambia con le stagioni, il 50% e con ghiaccio a entrambi i poli; la pioggia con almeno 20 fotogrammi su 24; i fuochi con almeno il 30% delle celle; il vento con il 95% della griglia). Correnti, rilievo, texture e stelle sono statici.

GitHub sospende i workflow pianificati dopo 60 giorni senza attività sul repository: per evitarlo, il primo di ogni mese il workflow committa gli elementi orbitali aggiornati della ISS. Se fosse comunque sospeso, si riattiva dalla scheda Actions.

La versione precedente (0.7.x, Cesium e React) resta nella storia git.
