# Upari: dove andare

Upari oggi è un racconto di undici capitoli sul pianeta di questo momento. Può diventare
un piccolo atlante vivo della Terra: più racconti, un'esplorazione libera completa, i dati
dell'umanità accanto a quelli fisici. Lo stesso sguardo dappertutto: poche parole, luce
vera, nessun dato inventato, ogni immagine con la sua fonte.

Le fasi sono in ordine di lavoro. Ognuna si pubblica da sola, dopo verifiche con
screenshot, build e tempo di frame.

## 1. Lassù, il viaggio

Il capitolo diventa una sequenza in tre tempi.

1. **Da lontano.** La Terra intera con il terminatore vero; l'orbita completa disegnata
   come un filo di luce, la stazione come un punto che corre, in tempo reale.
2. **Il viaggio.** La camera accompagna la stazione lungo l'orbita, ancora alta: si vede
   dove sta andando (giorno, notte, la prossima alba).
3. **Da vicino.** La camera scende fino a qualche centinaio di metri e si ferma: il
   modello NASA della ISS, nel suo assetto reale, con la Terra sotto.
   - Telemetria discreta: quota, velocità, sopra quale paese o mare, a bordo è giorno o
     notte, minuti alla prossima alba o al prossimo tramonto, orbita del giorno.
   - Didascalia: «Questo è ciò che l'equipaggio vede adesso dal finestrino».
   - Di notte la stazione è illuminata dalla Luna vera e dal bagliore delle città.
4. **Anche in esplorazione.** Voce «Raggiungi la Stazione» nel pannello, e il modello
   compare sempre quando ci si avvicina.

## 2. Le persone: l'atlante, rifatto

I dati della versione precedente tornano, con la grafica nuova. Restano snapshot
verificati (World Bank WDI CC BY 4.0, UN IGME, UNHCR CC BY 4.0, Natural Earth pubblico
dominio).

- **Indicatori:** popolazione, natalità, mortalità, saldo naturale, speranza di vita,
  mortalità sotto i 5 anni, accesso all'elettricità, occupazione e disoccupazione (con
  la loro avvertenza: stime modellate, niente classifiche), quota di rinnovabili nell'UE.
- **Resa:** i paesi diventano luce sulla superficie, non un mosaico piatto: una mappa di
  identità dei paesi su GPU, i valori per anno in una texture, i colori che scorrono
  fra un anno e l'altro (si interpolano i colori, mai le misure). Confini come fili sottili
  e luminosi, il paese sotto il cursore che si accende.
- **Popolazione come polvere di luce:** un punto ogni milione di persone, sparso dentro
  ogni paese; negli anni la polvere si addensa.
- **Migrazioni:** le domande di asilo da Siria, Ucraina e Afghanistan come scie di
  particelle dall'origine al paese di presentazione, spessore proporzionale ai numeri.
  Scie schematiche, non itinerari: lo diciamo.
- **Tempo:** cursore degli anni 1960–2025 con play; i vuoti restano vuoti.
- **Lettura:** al passaggio nome, valore e anno; al clic una scheda del paese con la
  curva dal 1960.

## 3. Più racconti

Il racconto attuale diventa il primo di una serie. All'avvio si sceglie quale vedere.

- **Il pianeta, adesso.** Gli undici capitoli di oggi.
- **Le persone.** Otto miliardi; Si nasce di meno; Si vive più a lungo; I bambini; La
  luce elettrica; In fuga; Il lavoro; Il saldo.
- **Il tuo luogo.** Dopo una ricerca: il luogo adesso, con ora solare, alba e tramonto,
  vento, pioggia e mare intorno, e il prossimo passaggio visibile della ISS calcolato in
  locale con SGP4.
- **Un giorno sulla Terra.** Ventiquattro ore in un minuto: terminatore, nuvole, luci
  delle città che si accendono, la stazione che gira sedici volte.
- **La Terra trema** (dati nuovi, sotto). Terremoti degli ultimi sette giorni.

## 4. Esplorazione libera completa

- **Pannello degli strati.** Il cielo (nuvole, notte, atmosfera, stelle); L'aria (vento);
  Il mare (correnti, temperatura, anomalia, plancton, ghiaccio); L'acqua (pioggia);
  Il fuoco; Le luci; La Stazione; Le persone (ogni indicatore).
- **Controlli:** luce reale o da studio, rotazione automatica, ora (avanti e indietro
  nelle 24 ore, il Sole si sposta), anno per i dati statistici, fotogramma della pioggia.
- **Link condivisibili:** posizione, strato e anno nell'indirizzo.
- **Cartolina:** salva l'inquadratura come immagine con titolo, data e fonti.

## 5. Dati nuovi, tutti aperti

- Terremoti degli ultimi 7 giorni (USGS, pubblico dominio).
- Cicloni tropicali attivi (NOAA NHC / JTWC).
- Fumo e polveri: profondità ottica degli aerosol (NASA GIBS).
- Neve e vegetazione (NASA GIBS, MODIS).
- Lunghe serie: CO₂ a Mauna Loa, ghiaccio artico, anomalia globale di temperatura.

## 6. Piattaforma

- Tablet e telefono: tocco, pannelli compatti, qualità adattiva.
- Accessibilità: movimento ridotto, tastiera completa, testi alternativi.
- Inglese accanto all'italiano.
- Dominio upari.netmilk.dev su GitHub Pages (serve il record DNS).
- Test automatici delle trasformazioni dei dati.

## Stato

Fatto e pubblicato il 26 ottobre 2026:

- **Lassù, il viaggio**: Terra intera con l'orbita come filo di luce, inseguimento, discesa
  alla ISS, telemetria dal vivo, didascalia «Questo è ciò che l'equipaggio vede adesso».
- **Le persone**: motore dell'atlante (paesi come luce, polvere della popolazione,
  scie dell'asilo) e un racconto di sette capitoli.
- **Scelta del racconto** all'avvio e nella barra in alto; a fine racconto, «Continua».
- **Esplora**: tutti gli strati, anno, ora, luce vera, nuvole, rotazione, «Raggiungi la
  Stazione», link condivisibili.
- **La Terra trema**: terremoti USGS degli ultimi sette giorni, aggiornati ogni mattina,
  nuovo capitolo del primo racconto e strato in Esplora.

Fatto e pubblicato il 26 ottobre 2026, sera:

- **La natura**, terzo racconto: il respiro verde (NDVI mensile), le foreste perdute
  (2001–2024, anno per anno), l'aria (aerosol MERRA-2 mensili), le barriere coralline
  (Coral Reef Watch). Strati anche in Esplora.
- **Strati animati**: temperatura del mare, anomalia, plancton e ghiaccio sono serie di
  dodici mesi fino a oggi, con l'orologio del mese.
- **Audio**: quattro caratteri della stessa musica (calmo, grave, interrogativo, disteso)
  in dissolvenza; un ambiente per ogni capitolo; effetti più bassi.
- **Grafica**: nuvole con rilievo, luci delle città nitide, oceano più azzurro, riflesso del
  Sole più netto; corretta una linea sul lato notturno.

Fatto il 27 ottobre 2026 (rapporto «Nuove fonti e proposte per Upari»):

- **Il cielo, adesso**, quarto racconto: il Sole di stamattina (SDO), l’aurora della prossima
  mezz’ora con il Kp (NOAA SWPC, chiesta dal vivo), tutti i satelliti attivi mossi sulla GPU
  (CelesTrak), i prossimi lanci, i bolidi dal 1988, gli asteroidi dei prossimi 60 giorni, le
  Voyager a un giorno-luce (JPL).
- **Il pianeta**: «Il termometro» (ogni giorno dal 1940, Climate Pulse), «Le tempeste»
  (cicloni IBTrACS con le tracce), vulcani in eruzione dentro «La Terra trema», iceberg dentro
  «Il ghiaccio».
- **La natura**: «Il respiro del carbonio» (curva di Keeling), «La neve», «L’aria delle città»
  (NO₂), «Lo scudo» (ozono), «Il mare ferito» (chiazze di petrolio SkyTruth, CC BY-SA).
- **Le persone**: «Le città crescono» (GHSL 1975–2030), «Le rotte» (navi 2015–2021).
- **Esplora**: tutti gli strati nuovi, il gruppo «Il cielo», una nota su come leggere ogni
  strato con la sua fonte. **Accade adesso** sul titolo, con soglie alte. La data del
  fotogramma sta sopra il pianeta.

Fatto il 27 ottobre 2026, sera — «Il cielo, adesso» rivisto dopo le note dell’utente:

- **Il Sole** come corpo in 3D, in scala di grandezza con la Terra (non di distanza): da lontano con
  la Terra come misura, poi da vicino; la faccia verso di noi è l’immagine HMI di SDO del mattino.
- **L’aurora** come tende di luce sopra l’ovale previsto da NOAA OVATION: verde dell’ossigeno in
  basso, rosso in alto, orlo rosa dell’azoto; dall’alto e poi di lato.
- **In partenza**: le salite dei lanci di ieri dalle loro rampe, con l’etichetta della destinazione,
  poi l’ultimo anno di lanci (335) rampa per rampa.
- **Di passaggio**: il percorso vero dell’asteroide intorno alla Terra e l’orbita della Luna (JPL
  Horizons), con le etichette; niente più satelliti di sfondo.
- **Un giorno-luce**: Voyager 1 segnata fra le stelle nella sua direzione vera; la luce del Sole
  ora tramonta dietro la Terra come un disco (prima, tagliata dalla profondità, sembrava quadrata).

## Piano dal rapporto, con lo stato

Licenze: per decisione dell’utente (27 ottobre) Upari è un progetto gratuito; le licenze non
commerciali e share-alike si usano con i crediti richiesti, i dati a pagamento no, e nulla che
richieda un account o una chiave che l’utente non ha dato.

### Subito
- [x] Nota «come leggere» e fonte per ogni strato in Esplora (dal testo del capitolo).
- [~] Etichette osservato / modello / inventario / provvisorio: nei testi, non ancora come
  etichetta separata.
- [x] Il pianeta oggi: temperatura (Climate Pulse), CO₂ (NOAA GML), ghiaccio NSIDC v4
  (scaricato ogni giorno in `public/climate/seaice.json`, non ancora mostrato).
- [x] Ozono OMPS. [x] NO₂ TROPOMI. [x] SO₂ TROPOMI (in Esplora, con i vulcani).
  [ ] OMPS Aerosol Index (c’è già MERRA-2).
- [x] Neve VIIRS NDSI mensile. [ ] IMS senza nuvole (solo emisfero nord).
- [x] Cicloni IBTrACS ACTIVE. [ ] Coni di previsione NHC.
- [x] Rotte delle navi (World Bank/IMF). [x] Aurora e Kp.

### Dopo
- [x] Il cielo, adesso. [x] Lanci. [x] Iceberg. [x] Città 1975–2030. [x] Accade adesso.
- [x] Altezza del mare (CoastWatch ERDDAP, 12 mesi). [x] Onde (WaveWatch III via PacIOOS,
  ultime 24 ore). [ ] Allagamenti, gelo e disgelo (MODIS Flood, SMAP): a scala globale non
  si leggono, servono viste ravvicinate.
- [x] Ghiaccio NSIDC v4 dentro «Il ghiaccio» (oggi contro la media 1981–2010 dello stesso giorno).
- [x] Il tuo luogo, prima parte: un luogo cercato mostra ora solare, alba e tramonto, vento e
  mare intorno. [ ] La parte con l’anno di nascita.
- [x] Modalità `?kiosk` (i quattro racconti in ciclo, cursore nascosto) e `?embed` (cornice
  quieta con il link al sito).
- [ ] Mare che si acidifica (OceanSODA: licenza dei file da confermare). Zone morte WRI: il
  dataset non è più online.
- [ ] Integrità della biodiversità (BII, CC BY, 100 m: file molto grandi). [ ] Mangrovie
  1996–2020 (Global Mangrove Watch, licenza da confermare sulla fonte primaria).
- [x] Nati all’estero (UN DESA via WDI, ogni cinque anni, il dato mostra il suo anno).
  [x] Rifugiati per paese d’origine (UNHCR, ogni mille abitanti): capitolo «Lontano da casa».
  [ ] Flussi origine–destinazione di tutte le origini (le scie oggi restano tre).
- [x] CO₂ per persona 1970–2024 (EDGAR via WDI, non IEA-EDGAR): capitolo «L’impronta».
  [ ] Dighe nel tempo.
- [x] Tendina prima/dopo in Esplora (atlante e serie). [x] Anno di nascita nel «Termometro».
- [x] Pagina «Per la classe» (da «Perché Upari»).
- [ ] Riserva per gli elementi orbitali: SatNOGS rimanda dati Space-Track, la cui
  ridistribuzione non è chiara; per ora resta l’ultimo file buono del giorno.

### Da valutare
- [x] Chiazze di petrolio SkyTruth Cerulean (CC BY-SA, crediti e nota sulle immagini derivate).
- [x] Vulcani Smithsonian GVP (termini «non commercial», accettati per un progetto gratuito).
- [ ] Area bruciata MCD64A1: serve un account Earthdata gratuito come secret del workflow.
- [ ] Pesca e navi buie (Global Fishing Watch): serve un token personale.
- [ ] Aree protette WDPA: niente download, permesso scritto per usi commerciali.
- [ ] GBIF / OBIS (licenze miste, distorsione del campionamento). [ ] Climate TRACE (API beta).
- [ ] Ember, Global Energy Monitor: chiave o modulo. [ ] CAMS, Copernicus Marine: account.
- [ ] HYDE 3.5 (licenza da confermare, protezione anti-bot). [ ] Luci notturne 1992–2024.
- [ ] Conflitti UCDP: scelta editoriale dell’utente.
- [ ] Plastica come storia lenta (solo modelli o campioni, licenze da verificare).
- [ ] Ondate di calore marine, fulmini GLM, CO₂ ODIAC: sforzo grande.

### Esclusi
ACLED, OpenSky, TeleGeography, Ookla, WHO GHO, NHM BII (NC-SA, sostituito da quello CC BY),
Blitzortung, dati SOS presi direttamente dal catalogo.

### Ancora dalla roadmap
1. **Il tuo luogo**. 2. **Scheda del paese**. 3. **Un giorno sulla Terra**. 4. **Cartolina**.
5. **Grafica**: nuvole volumetriche, onde, multi-scattering. 6. **Piattaforma**: telefono,
accessibilità.
