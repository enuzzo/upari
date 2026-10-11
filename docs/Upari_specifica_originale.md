# Upari

**Esplorare la Terra. Ritrovare il cielo.**

Specifica di prodotto e architettura · 11 ottobre 2026 · versione 0.1

Il nome **Upari** è approvato. Il prodotto sarà una web app gratuita, installabile e ospitabile sul proprio server. Luoghi personali, preferenze e diario rimarranno sul dispositivo. ISS, esplorazione della Terra e guida AR saranno parti della stessa esperienza.

Questo documento definisce il progetto da costruire. Le tre immagini proposte sono concept con dati dimostrativi; non attestano un'app funzionante o previsioni calcolate. L'implementazione non è ancora iniziata.

## L'esperienza

Apri Upari e trovi il pianeta. Puoi avvicinarti alla tua zona, cambiare il modo di vederlo e far scorrere il tempo. Il prossimo passaggio interessante della ISS è immediatamente raggiungibile. Quando vuoi osservarlo, apri la fotocamera e una guida mostra dove apparirà e come attraverserà il cielo.

La navigazione principale ha tre destinazioni: **Terra**, **Cielo**, **Avvisi**. Su telefono i comandi essenziali restano raggiungibili con una mano; sul desktop pannelli laterali lasciano libero il globo. Font leggibili, controlli da almeno 44 px, contrasto verificato e modalità con movimento ridotto fanno parte del progetto.

I temi iniziali sono notte, atlante chiaro e osservazione rossa. Quest'ultimo riduce la luminosità e usa accenti rossi; la conservazione dell'adattamento al buio dipenderà anche dalla luminosità dello schermo. La scelta fra i concept fissa la struttura dell'interfaccia; i temi saranno una preferenza separata.

## La magia degli overlay

La caratteristica centrale è un pianeta che cambia aspetto e racconta processi reali. Ogni scena combina dati, colori, tempo e una breve spiegazione. Il catalogo completo resta disponibile, ma l'ingresso è attraverso scene comprensibili.

| Scena | Cosa vediamo | Dati e interpretazione |
|---|---|---|
| Oceani vivi | Fioriture, distribuzione della clorofilla e cambiamenti stagionali | Clorofilla PACE o MODIS; indicatore della presenza di fitoplancton. Le correnti sono un secondo dato distinto. |
| Terra termica | Oceani, suolo e atmosfera in palette termiche | Temperatura superficiale, temperatura di brillanza infrarossa e anomalie: prodotti separati, con unità proprie. |
| Il respiro del pianeta | Nuvole e, con un campo vettoriale disponibile, scie dei venti | Immagini satellitari per le nuvole; modelli o osservazioni di velocità per il movimento. |
| Terra di notte | Terminatore giorno/notte e luci urbane | Illuminazione calcolata per l'ora scelta; Black Marble con anno del composito esplicito. |
| Le stagioni | Neve, vegetazione e ghiacci che cambiano | Serie temporali satellitari, con intervallo e frequenza visibili. |
| Un altro sguardo | Aerosol, temperature marine, anomalie e altri strati | Preset curati e catalogo estendibile NASA, NOAA e Copernicus. |

La magia nasce da transizioni fluide fra viste, atmosfera sottile, palette curate, confronto fra periodi e riproduzione temporale. Le scie vengono advettate da veri campi di velocità. La velocità di riproduzione e l'eventuale interpolazione sono dichiarate: un'animazione accelerata non è una misura del movimento in tempo reale.

Per il plancton, la clorofilla mostra come cambia la distribuzione osservata. Affiancare le correnti aiuta a esplorare il contesto fisico; non identifica o traccia singoli organismi. I falsi colori sono descritti come tali. La clorofilla non rappresenta una luce emessa dal mare.

Una base concreta è già disponibile: NASA ha pubblicato una sequenza annuale PACE con medie mobili di 30 giorni, da marzo 2024 a marzo 2025. Upari può offrire un percorso storico immediato e, separatamente, immagini recenti disponibili in GIBS. [Esempio NASA e descrizione dei dati](https://svs.gsfc.nasa.gov/31345/).

### Dati verificati e primo catalogo

La verifica del catalogo WMTS GIBS EPSG:3857 dell'11 ottobre 2026 ha restituito **1.330 layer**. Il numero include prodotti con formati e requisiti diversi: l'importatore dovrà distinguere raster e vettori, copertura, proiezione e periodo. Il catalogo NASA documenta oltre 1.200 visualizzazioni e specifica che molti prodotti arrivano con alcune ore di ritardo.

| Funzione | Identificatore GIBS verificato | Primo utilizzo |
|---|---|---|
| Clorofilla e fitoplancton | `OCI_PACE_Chlorophyll_a` | Oceani vivi, immagini giornaliere disponibili |
| Alternativa per clorofilla | `MODIS_Aqua_L2_Chlorophyll_A` | Archivio e confronto |
| Terra a colori naturali | `VIIRS_NOAA20_CorrectedReflectance_TrueColor` | Nuvole e superficie |
| Infrarosso notturno | `VIIRS_NOAA20_Brightness_Temp_BandI5_Night` | Temperatura di brillanza |
| Temperatura del suolo | `MODIS_Terra_Land_Surface_Temp_Day_TES` | Terra termica |
| Temperatura del mare | `GHRSST_L4_MUR_Sea_Surface_Temperature` | Oceani e fronti termici |
| Anomalie marine | `GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies` | Confronto con il riferimento del prodotto |
| Neve | `MODIS_Terra_NDSI_Snow_Cover` | Le stagioni |
| Aerosol | `MODIS_Aqua_Aerosol_Optical_Depth_3km` | Esplorazione atmosferica |
| Luci urbane | `VIIRS_Black_Marble` | Composito storico; nel catalogo letto, anni 2012 e 2016 |

Le particelle marine useranno un adattatore per campi vettoriali come **OSCAR**, che fornisce velocità superficiali medie giornaliere su una griglia di 0,25°. Accesso, licenza, ritardo e distribuzione dei file vanno verificati prima dell'integrazione operativa. I file scientifici originali possono richiedere autenticazione: il telefono riceverà pacchetti preparati dal distributore o dal gestore della propria installazione, senza richiedere un account scientifico all'utente finale.

[GIBS: API](https://nasa-gibs.github.io/gibs-api-docs/) · [Prodotti e risoluzioni](https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/) · [OSCAR: dati e velocità](https://www.esr.org/data-products/oscar/) · [OSCAR NRT: caratteristiche e ritardo](https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_NRT_V2.0)

### Regole per i layer

Ogni layer dichiara fonte, misura, unità, legenda, risoluzione originale, date valide, frequenza, copertura e crediti. La data dell'immagine è sempre distinta dall'ora dell'ISS o della simulazione solare. Se due layer hanno periodi diversi, la vista mostra le date effettivamente utilizzate. Le zone senza dato rimangono riconoscibili.

Il primo catalogo contiene circa dieci prodotti curati. Seguono ricerca per fenomeno e fonte, preferiti locali, opacità, ordine degli strati, confronto prima/dopo e animazione con un numero limitato di fotogrammi precaricati. I colori dei raster già elaborati mantengono la legenda del produttore. Palette alternative con valori interrogabili richiedono dati scalari e una corrispondenza numerica verificata.

Lo zoom fino agli edifici richiede una base fotografica ad alta risoluzione con copertura e condizioni adeguate. I layer scientifici mantengono la propria risoluzione anche quando la base mostra una casa. La Svizzera dispone, per esempio, di SWISSIMAGE a 10 cm in pianura e 25 cm nelle Alpi; non promettiamo la stessa disponibilità mondiale. Il progetto consente fonti regionali e provider configurabili. [SWISSIMAGE](https://www.swisstopo.admin.ch/it/ortofoto-swissimage-10-cm).

## Stack e dove gira

| Parte | Scelta proposta | Dove gira |
|---|---|---|
| Interfaccia | React, TypeScript, Vite | Browser/PWA su telefono e desktop |
| Pianeta | CesiumJS caricato quando necessario | GPU del dispositivo, WebGL |
| Orbite | satellite.js, SGP4/SDP4, dati TLE/OMM | Web Worker sul dispositivo |
| Luoghi e preferenze | IndexedDB con schema versionato | Dispositivo e origine della web app |
| Offline | Service Worker e cache con limiti | Browser; risorse app e dati selezionati |
| Overlay raster | Adattatori WMTS/WMS | Richieste dirette ai provider compatibili |
| Campi di vento/corrente | Pacchetti globali preparati da una pipeline opzionale | File statici distribuiti dall'hosting pubblico o personale |
| AR | Fotocamera, orientamento, proiezione del cielo | Telefono; WebXR come miglioramento opzionale |
| Avvisi a pagina chiusa | ntfy, bridge HA o gateway opzionale | Scheduler esterno scelto dall'utente |

La consegna sarà una directory statica servibile via HTTPS, con build riproducibile e configurazione delle fonti. Non richiederà Home Assistant, un account Upari o un database personale centrale. Sarà ospitabile su un normale server web, NAS, macchina domestica o hosting statico. Un contenitore potrà semplificare il servizio dei file senza diventare un requisito.

Cesium è adatto al globo georeferenziato, alle immagini e agli oggetti nel tempo. Three.js è ottimo per effetti personalizzati; qui la scelta iniziale privilegia un unico motore geografico. Gli effetti verranno sviluppati nel suo rendering attraverso shader e primitive. Non caricheremo due motori 3D per ottenere una scia.

Cesium ion e relativi account non saranno requisiti della base: ellissoide e sorgenti configurabili sono sufficienti per iniziare. Terreno dettagliato ed edifici 3D saranno opzioni dipendenti dalla fonte. Un globo che permette di zoomare non implica automaticamente terreno o edifici fotorealistici disponibili ovunque.

[CesiumJS](https://cesium.com/platform/cesiumjs/) · [satellite.js](https://github.com/shashwatak/satellite-js)

### Prestazioni

L'interfaccia si carica prima del motore 3D. Il rendering continuo si attiva durante interazione, riproduzione o passaggio seguito; altrove la scena viene ridisegnata su richiesta. Risoluzione del rendering, numero di particelle e strati animati si adattano al dispositivo. Gli effetti si sospendono quando l'app va in background. La fotocamera AR e il globo pesante non renderizzano insieme.

Obiettivi da verificare, non risultati già misurati: interazione fluida su telefoni intermedi, controlli utilizzabili durante caricamenti e calcoli, nessuna crescita illimitata della cache. La modalità con movimento ridotto mantiene mappe, legenda e controlli temporali senza rotazioni automatiche o scie continue.

## Cielo e ISS

Il calcolo parte dalle effemeridi, applica SGP4 e ricava azimut ed elevazione per l'osservatore locale. Un passaggio osservabile richiede la combinazione di orizzonte libero, illuminazione del satellite e oscurità adeguata del cielo. Gli intervalli vengono individuati e raffinati; i punti di ingresso nell'ombra sono distinti dal tramonto geometrico del satellite.

Il risultato mostra inizio, punto di comparsa, culmine, fine visibile, durata, percorso e anzianità dei dati orbitali. La luminosità è una stima dichiarata. La qualità del passaggio usa spiegazioni come “alto nel cielo” e “breve” anziché percentuali di successo inventate. Il meteo appare soltanto se arriva da una fonte configurata.

Luoghi multipli, selezione manuale delle coordinate e maschera dell'orizzonte per ostacoli sono locali. Seguire altri satelliti luminosi è un'estensione del medesimo motore. L'interfaccia distingue posizione prevista, osservazione registrata e modalità di anteprima.

Le sorgenti iniziali candidate sono CelesTrak OMM e una sorgente TLE alternativa. Le richieste di effemeridi non contengono il luogo dell'osservatore. Cache, aggiornamento controllato, backoff e validazione impediscono dati incoerenti e richieste eccessive. Un download più vecchio non sostituisce dati più recenti. I limiti per previsioni e avvisi vengono fissati dopo confronto con casi di riferimento indipendenti.

## AR sul telefono

“Apri cielo AR” avvia la fotocamera posteriore e richiede l'orientamento mediante un gesto esplicito. Sul cielo compaiono punto di apparizione, percorso previsto, orari e posizione prevista per l'istante selezionato. Una freccia guida verso un bersaglio fuori inquadratura. Un cursore permette di vedere dove sarà fra pochi minuti; la modalità futura è evidente.

Il motore usa gli stessi azimut ed elevazioni del passaggio. La proiezione corregge orientamento dello schermo e rotazioni del dispositivo. Il campo visivo della camera e la calibrazione influiscono sulla precisione. Una regolazione manuale permette di riallineare il nord; se bussola o permessi non sono disponibili rimane una guida del cielo orientabile a mano.

La base è una sovrapposizione sulla camera, senza richiedere WebXR. WebXR sarà rilevato e usato solo sui dispositivi compatibili. Il progetto non assume sessioni AR immersive disponibili su Safari iPhone. La guida calcola dove cercare: il riconoscimento ottico automatico della ISS non fa parte della prima versione.

La camera richiede HTTPS e permesso. Non si richiede il microfono. Fotogrammi e sensori vengono elaborati sul telefono; le tracce video e gli ascoltatori vengono chiusi uscendo dalla modalità. Prima di dichiarare l'AR operativa occorrono prove su veri iPhone e Android, anche in verticale/orizzontale e con permessi negati.

[Camera: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) · [Orientamento: specifica W3C](https://www.w3.org/TR/orientation-event/) · [Compatibilità WebXR](https://github.com/mdn/browser-compat-data/blob/main/api/XRSystem.json)

## Notifiche utili

Il messaggio principale risponde a una decisione: **quando uscire e dove guardare**. Esempio dimostrativo: “ISS tra 10 minuti. Cerca verso nord-ovest; resterà visibile per circa 6 minuti. Apri la guida AR.” Meteo, direzione e durata vengono inseriti soltanto quando disponibili e coerenti con la previsione corrente.

Tre tipi iniziali: promemoria prima del passaggio, invito “guarda ora” facoltativo e riepilogo del miglior passaggio serale facoltativo. Silenzio notturno, limite giornaliero, soglia di qualità e silenziamento del singolo passaggio sono configurabili. Deduplicazione e revisione della coda evitano ripetizioni dopo riavvii o aggiornamenti orbitali. L'invio in ritardo viene scartato quando perde utilità.

| Modalità | Comportamento a pagina chiusa | Compromesso |
|---|---|---|
| Solo web app | Non garantisce allarmi programmati in background | Previsioni e guida rimangono disponibili; niente falsa promessa di sveglie locali |
| ntfy | Messaggi programmati consegnabili anche dopo la chiusura | Serve un server/topic scelto; coda finita da aggiornare riaprendo Upari |
| Home Assistant light | HA conserva ed esegue un piano di eventi | Può ricontrollare presenza e meteo al momento dell'avviso |
| Gateway/Web Push | Scheduler opzionale per notifiche native e altri canali | Richiede un servizio sempre attivo e configurazione del canale |

ntfy documenta una finestra programmabile predefinita massima di tre giorni. Il progetto propone una coda di 48 ore, ulteriormente limitata dalla qualità dei dati e dalle capacità del server. La pagina mostra **avvisi programmati fino a…** e ultimo aggiornamento. Annullamento e sostituzione della coda dipendono dalla versione/capacità dell'istanza e vengono rilevati prima di proporli.

Una pagina sospesa non può aggiornare continuamente la coda o rivalutare il meteo. Per farlo autonomamente serve il bridge o gateway personale. Su iPhone le notifiche Web Push della PWA richiedono l'aggiunta alla schermata Home e il consenso mediante un gesto. La consegna dipende anche da sistema operativo e rete. Per ntfy self-hosted su iPhone la configurazione del push upstream influisce sull'immediatezza della consegna.

Gotify e webhook sono i successivi adattatori. Servizi che richiedono segreti di bot o credenziali server vengono collegati tramite gateway personale; quei segreti non entrano nel bundle pubblico.

[ntfy: invii e pianificazione](https://docs.ntfy.sh/publish/) · [ntfy: configurazione](https://docs.ntfy.sh/config/) · [Web Push su iPhone](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) · [Limiti della sincronizzazione periodica](https://developer.mozilla.org/en-US/docs/Web/API/Web_Periodic_Background_Synchronization_API)

### Bridge Home Assistant

Il bridge riceve un piano versionato con identificatore del passaggio, istante UTC, scadenza, messaggio e azioni consentite. Persistenza, scheduler e deduplicazione sono sul server HA; globo, catalogo e interfaccia rimangono nella PWA. Il bridge non espone un'API per eseguire servizi arbitrari di HA.

Azioni iniziali: aprire il dettaglio/AR, silenziare il passaggio e rinviare quando ha ancora senso. Presenza e meteo possono filtrare un avviso al momento della consegna. Collegare una PWA HTTPS pubblica a un HA locale HTTP incontra limiti di origine e sicurezza del browser: la via consigliata è servire la PWA dalla stessa origine personale o usare un gateway HTTPS configurato.

L'integrazione si limita a stato della coda, prossimo evento e invio ai canali selezionati. Le sue credenziali non vengono inserite in link o esportazioni ordinarie. [Azioni delle notifiche Companion](https://companion.home-assistant.io/docs/notifications/actionable-notifications/).

## Dati personali e gratuità

| Dato | Residenza di base | Quando viene comunicato |
|---|---|---|
| Luoghi, coordinate, orizzonte | IndexedDB locale | Solo per servizi scelti che ne hanno bisogno, come meteo o gateway personale |
| Preferenze, scene, diario | Dispositivo | Esportazione richiesta dall'utente |
| Fotocamera e orientamento | Memoria locale durante l'AR | Nessun caricamento previsto |
| Piano ntfy | Locale e server ntfy selezionato | Tempi, contenuto, topic e autorizzazione necessari all'invio |
| Piano HA | Locale e propria istanza HA | Piano e opzioni di filtro scelti |
| Effemeridi e immagini | Cache locale; sorgenti pubbliche | Download dei dati e delle tile richieste |

I provider di immagini vedono le richieste delle tile e possono dedurre la zona visualizzata. I servizi di notifiche ricevono informazioni sufficienti a consegnare gli avvisi; anche gli orari possono consentire inferenze. “Dati residenti sul telefono” significa che Upari non mantiene un profilo personale centrale, non che ogni funzione sia priva di traffico verso fonti esterne.

Nessuna telemetria nella configurazione di base. Backup/import JSON versionati, con credenziali escluse per impostazione predefinita. Il browser può cancellare lo storage: richiesta di persistenza dove supportata e backup esportabile riducono il rischio, senza promettere conservazione permanente. Cambiare dominio crea uno storage separato; l'importazione trasferisce le preferenze.

Il core gratuito usa fonti senza chiavi obbligatorie. I provider aggiuntivi mostrano le proprie condizioni; non garantiamo costi nulli o accesso illimitato per qualunque servizio esterno. Una pipeline opzionale pubblica può preparare dati globali comuni senza ricevere coordinate o profili degli utenti. Chi si ospita Upari può distribuire gli stessi pacchetti dal proprio server.

## Implementazione indipendente

Upari avrà codice, componenti, asset originali, pacchetto e storia Git propri. Lo studio svolto finora usa documentazione pubblica, screenshot, metadati delle dipendenze e verifiche delle fonti dati; non ha riutilizzato il codice applicativo del progetto osservato. La prima implementazione sarà sviluppata da questa specifica e dalle documentazioni delle librerie selezionate.

Licenza proposta MIT per il codice originale. Restano licenze delle dipendenze e crediti richiesti dalle fonti NASA e dagli altri provider. Nelle schermate le attribuzioni riguarderanno i dati effettivamente mostrati.

## Ordine di costruzione

**Prima versione:** PWA installabile e servibile; luoghi locali; globo giorno/notte; temi; layer curati inclusi clorofilla e infrarosso; animazione temporale e confronto; previsione ISS; guida AR con fallback manuale; avvisi ntfy e bridge HA. Dati reali e demo sono sempre distinti.

**Seconda estensione:** correnti e venti con pacchetti vettoriali verificati e scie GPU; catalogo più ampio; altri satelliti luminosi; diario osservazioni; calendario; altri adattatori di notifica. La scena Oceani vivi è utile già con il tempo della clorofilla, prima dell'integrazione delle correnti.

**Estensioni successive:** percorsi guidati del pianeta, esposizione da salotto, confronti stagionali, terreno/edifici per fonti compatibili e allerte ambientali dove esistono dati strutturati e scheduler adeguati. Una visualizzazione raster da sola non genera una previsione o un'allerta affidabile.

## Come verificheremo il risultato

Le verifiche già svolte riguardano documentazione, catalogo GIBS e disponibilità HTTP/CORS delle sorgenti candidate. Non sono test dell'app, dell'accuratezza AR o del sistema completo di notifiche.

La costruzione richiederà queste prove significative:

1. Confronto del propagatore e degli eventi di visibilità con casi indipendenti; UTC, fusi, ora legale, ingresso nell'ombra, dati scaduti e orizzonte ostruito.
2. Layer con date differenti, buchi di copertura, unità/legende, limiti di zoom, ordine e interruzioni delle richieste durante animazione.
3. Persistenza locale, migrazione/import e riavvio offline con dati già scaricati; cache limitata e nessuna coordinata inviata alle sorgenti orbitali.
4. AR su veri telefoni iPhone/Android: permessi, calibrazione, orientamento dello schermo, precisione osservabile e spegnimento della camera.
5. Coda avvisi aggiornata/cancellata, assenza di duplicati, scadenza, riavvio HA e consegna a pagina chiusa attraverso i canali realmente configurati.
6. Controlli e testi accessibili, movimento ridotto e prestazioni su dispositivi rappresentativi; misure pubblicate come risultati effettivi.

La consegna finale comprenderà sorgenti, build statica, istruzioni HTTPS/self-hosting, adattatori, documentazione dei dati e limiti verificati. La prossima decisione è la direzione visiva fra le tre immagini Upari già presentate.
