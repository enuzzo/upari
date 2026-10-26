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

## Prossimi passi

1. **Il tuo luogo**: dopo una ricerca, un racconto breve sul luogo (ora solare, alba e
   tramonto, vento, pioggia e mare intorno, prossimo passaggio visibile della ISS).
2. **Scheda del paese**: al clic, la curva dal 1960 di ogni indicatore.
3. **Un giorno sulla Terra**: ventiquattro ore in un minuto.
4. **Cartolina**: salva l'inquadratura con titolo, data e fonti.
5. **Dati nuovi**: cicloni attivi, aerosol, neve e vegetazione, lunghe serie (CO₂, ghiaccio
   artico, temperatura globale).
6. **Piattaforma**: tablet e telefono, accessibilità, inglese, dominio upari.netmilk.dev.
