# Upari

Il pianeta Terra raccontato dai suoi dati di oggi. Un documentario interattivo per desktop: quattro racconti di capitoli brevi, una voce narrante scritta, un globo che si può trascinare, avvicinare fino a 10 m per pixel e interrogare punto per punto.

## Racconti

- **Il pianeta, adesso**: Il pianeta · Il termometro (Climate Pulse, ogni giorno dal 1940) · Il respiro (venti GFS) · Le tempeste (cicloni IBTrACS) · Le correnti (OSCAR) · Il calore del mare e La febbre (GHRSST MUR) · Il mare che fiorisce (PACE) · La pioggia (GPM IMERG, 24 ore) · Il fuoco (FIRMS) · La Terra trema (USGS, con i vulcani GVP) · Il ghiaccio (GAMSSA, con gli iceberg) · Le luci (Black Marble) · Lassù (ISS in tempo reale).
- **La natura**: Il respiro verde (NDVI) · Il respiro del carbonio (Mauna Loa) · Le foreste perdute (Hansen/GFW) · La neve (VIIRS) · L’aria (MERRA-2) · L’aria delle città (NO₂ TROPOMI) · Lo scudo (ozono OMPS) · Il mare ferito (SkyTruth Cerulean) · Le barriere coralline (Coral Reef Watch).
- **Le persone**: Otto miliardi · Le città crescono (GHSL 1975–2030) · Le rotte (navi, World Bank/IMF) · natalità, speranza di vita, bambini, saldo, elettricità (World Bank WDI) · In fuga (UNHCR).
- **Il cielo, adesso**: Il Sole (SDO) · L’aurora (NOAA SWPC) · I satelliti (CelesTrak) · In partenza (Launch Library 2) · Le stelle cadenti e Di passaggio (JPL CNEOS) · Un giorno-luce (Voyager, JPL Horizons).

Le frasi con numeri sono calcolate dai dati all’apertura. I dati del giorno si aggiornano ogni mattina (`scripts/prepare-*.mjs`, nel workflow); le rotte e le città si preparano una volta a mano (`scripts/prepare-ships.py`, `scripts/prepare-built.py`). Fonti e licenze in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Lingue

Dodici lingue: italiano, inglese, spagnolo, francese, tedesco, portoghese, russo, cinese, giapponese, coreano, arabo e hindi. All'apertura Upari sceglie la lingua del browser (altrimenti l'inglese); il menu in alto a destra la cambia al volo e la ricorda. `?lang=xx` nell'indirizzo forza una lingua.

I testi stanno in [`src/i18n`](src/i18n): l'italiano ([`it.ts`](src/i18n/it.ts)) è l'originale e definisce la forma di tutti i dizionari, che TypeScript controlla. Le frasi con dati sono funzioni che ricevono numeri e date già formattati nella lingua della pagina. I nomi dei paesi vengono da `Intl.DisplayNames`, con poche eccezioni per lingua; per cinese, giapponese, coreano, arabo, hindi e russo si caricano i Noto (o Cormorant) di Google Fonts solo quando servono, e l'arabo si legge da destra a sinistra.

Il testo di «Perché Upari», che si apre dal copyright in basso a destra, è in [`docs/ABOUT.md`](docs/ABOUT.md).

## Versione

La versione è quella di `package.json` e compare in basso a destra accanto al copyright di Netmilk Studio (l'anno è quello corrente). Sale di una patch per le correzioni (1.1.1) e di una minor per le novità (1.2.0).

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

Il workflow [`pages.yml`](.github/workflows/pages.yml) gira ogni giorno alle 10:41 UTC (dopo che NASA pubblica i dati del giorno prima), a ogni push su `main` e a richiesta. Scarica venti, mare, anomalie, ghiaccio, fitoplancton, 24 ore di pioggia, fuochi e l'orbita della ISS, ricostruisce il sito e lo pubblica su https://upari.earth (SiteGround, via FTPS, con [`scripts/deploy-siteground.sh`](scripts/deploy-siteground.sh): invia solo i file cambiati, `index.html` per ultimo). Le credenziali stanno nei secrets del repository (`DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, `DEPLOY_PASSWORD`, `DEPLOY_PATH`) e, in locale, in `.env`, che git ignora. Le regole di cache e i reindirizzamenti a https senza www sono in [`public/.htaccess`](public/.htaccess). GitHub Pages pubblica solo un rimando dal vecchio indirizzo enuzzo.github.io/upari a upari.earth.

I dati freschi non vengono committati: il repository conserva un'istantanea verificata, che il sito usa ogni volta che una fonte è in ritardo, incompleta o irraggiungibile (il riepilogo del workflow lo segnala). Uno strato nuovo entra solo se la sua copertura è almeno l'80% di quella dell'istantanea (il ghiaccio, che cambia con le stagioni, il 50% e con ghiaccio a entrambi i poli; la pioggia con almeno 20 fotogrammi su 24; i fuochi con almeno il 30% delle celle; il vento con il 95% della griglia). Correnti, rilievo, texture e stelle sono statici.

GitHub sospende i workflow pianificati dopo 60 giorni senza attività sul repository: per evitarlo, il primo di ogni mese il workflow committa gli elementi orbitali aggiornati della ISS. Se fosse comunque sospeso, si riattiva dalla scheda Actions.

La versione precedente (0.7.x, Cesium e React) resta nella storia git.
