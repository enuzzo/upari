# Fonti e metodo

| Funzione | Fonte primaria | Dato/metodo | Frequenza e limiti |
|---|---|---|---|
| Orbita ISS | https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=json | OMM, SGP4 tramite satellite.js | Solo con ISS attiva; cache 2–4 ore; backoff 2 ore su errori; snapshot datato |
| Politica CelesTrak | https://celestrak.org/usage-policy.php | Solo il dato necessario, dominio canonico | Nessun cambio di dominio per aggirare limiti |
| Propagatore | https://github.com/shashwatak/satellite-js | Libreria MIT, coordinate TEME/ECEF | Non è codice applicativo della repo di riferimento |
| Riferimento SGP4 | https://celestrak.org/publications/AIAA/2006-6753/ | Caso Vanguard/Vallado pubblicato | Test di posizione e velocità a epoca |
| Riferimento indipendente | https://rhodesmill.org/skyfield/ | Skyfield, sgp4 Python, JPL DE421 | Script opzionale separato dal runtime |
| NASA raster | https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml | WMTS EPSG:3857, tile 256 px, matrix set specifico | Risoluzione/periodo individuale; buchi di copertura |
| API/attribuzioni NASA | https://nasa-gibs.github.io/gibs-api-docs/ | Immagini e legende originali | Nessuna palette scalare inventata o misura ricavata dai colori |
| Fotografia dettagliata | https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer | Esri World Imagery, base iniziale | Mosaico con date/risoluzioni diverse; crediti del servizio; NASA di riserva |
| Cesium | https://cesium.com/learn/cesiumjs/ref-doc/ | Globo ellissoidale, rendering georeferenziato | Asset runtime locali; terreno 3D/edifici non attivati |
| Densità e filtri | https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html e https://cesium.com/learn/cesiumjs/ref-doc/ImageryLayer.html | DPR nativo, resolutionScale, livello di dettaglio, filtro lineare e anisotropia | Budget in pixel; non aggiunge risoluzione ai dati originali |
| Meteo salvaschermo | https://open-meteo.com/en/docs | Current weather da modelli; temperatura, percepita, vento, codice WMO; timestamp UNIX | Solo dopo attivazione; refresh 30 min; timeout 15 s; niente valori dimostrativi |
| ntfy | https://docs.ntfy.sh/publish/ | Programmazione esterna, sequenza e cancellazione | Conferma della risposta; nessun invio live durante lo sviluppo |
| HA | https://companion.home-assistant.io/docs/notifications/actionable-notifications/ | API notifiche Companion dal bridge personale | Servizio limitato a notify.mobile_app_*, credenziali server |
| Orientamento | https://www.w3.org/TR/orientation-event/ | Matrice Rz(alpha) Rx(beta) Ry(gamma), bussola Safari se presente | Nord assoluto richiesto; fallback manuale; calibrazione |
| Correnti future | https://www.esr.org/data-products/oscar/ | Campo vettoriale superficiale reale | Non implementato; verificare distribuzione/licenze prima dell’integrazione |

## Coordinate

Longitudine zero Greenwich; longitudini est positive, ovest negative, intervallo −180…180. WGS84 per osservatore e globo. Satellite.js: angoli in radianti, distanze in chilometri. Cesium: coordinate angolari in gradi agli adattatori, quote in metri. Tiling: WebMercatorTilingScheme, GoogleMapsCompatible_LevelN, non la matrice GIBS EPSG:4326. Quest’ultima ha una struttura diversa e non può essere intercambiata senza adattatore.

Il marker locale, la posizione orbitale e le immagini condividono la stessa geografia. Controlli visuali di Greenwich, Mediterraneo, Giappone e longitudine ±180 rimangono da effettuare nel browser.

## Visibilità

Ogni segmento visibile richiede altezza ≥ soglia, Sole dell’osservatore ≤ −6° e satellite fuori dall’intero cono di penombra terrestre. Il Sole usa una formula astronomica approssimata; la penombra è conservativa. Campionamento 15 s, transizioni raffinate sotto 0,5 s, culmine campionato ogni 5 s. Queste sono risoluzioni algoritmiche, non una certificazione di precisione fisica.

Nessun meteo è dedotto dalle immagini. Clorofilla non traccia organismi; aerosol non è PM2.5; temperatura superficiale/radiometrica non è temperatura dell’aria. Il provider può osservare le tile richieste e dedurre l’area esplorata.

## Riferimenti della revisione 0.2.1

- [Permesso DeviceOrientation e attivazione utente](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static): richiesta avviata nel gesto; negazione indipendente dalla fotocamera e guida manuale.
- [Orientamento assoluto](https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientationabsolute_event): supporto al canale assoluto oltre al compass heading Safari, senza scambiare letture relative per il nord.
- [Cambio di visibilità](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event): pulizia della sessione AR e sospensione delle operazioni visibili in background.
- [Satellite events con Skyfield](https://rhodesmill.org/skyfield/earth-satellites.html): confronto opzionale di finestre complete con implementazione separata SGP4/JPL. I dati orbitali condivisi restano un limite della validazione, non una misura fisica indipendente.
