# Terra e stili — 0.4.2

La richiesta dell'11 ottobre 2026 mette al primo posto una vista Naturale suggestiva anche allontanandosi, e chiede alternative cartoon/cel/pixel/voxel/ASCII. La reference iniziale è [kedube/ha-iss-tracker](https://github.com/kedube/ha-iss-tracker): recuperata dalla conversazione, consultati README e screenshot pubblici (in particolare [globe-night.jpg](https://github.com/kedube/ha-iss-tracker/blob/main/docs/images/globe-night.jpg)), allora senza leggere/copiare il sorgente applicativo. Il successivo studio del codice grafico, autorizzato dall’utente per la 0.4.1, è documentato in [REFERENCE_STUDY.md](REFERENCE_STUDY.md). Elementi ripresi come obiettivo visivo: volume della Terra, notte leggibile, luci e bordo atmosferico. Il renderer resta Cesium, il design resta nero/turchese con pannelli su richiesta.

## Naturale

NASA Blue Marble statica con rilievo/batimetria a scala orbitale; Esri World Imagery prende progressivamente il posto della base fra 8.000 e 1.200 km di quota, con una curva continua su quota logaritmica, con derivate prima e seconda nulle agli estremi. Metà blend a circa 3.098 km: la transizione si distribuisce lungo l’avvicinamento invece di concentrarsi sulle quote maggiori. L’immagine aerea attende le tile del viewport prima di aumentare visibilità; quando pronte, segue il target con una dissolvenza esponenziale di circa 0,46 s al 99%. Rete incompleta conserva la base NASA. Movimento ridotto elimina la dissolvenza temporale. Nel dettaglio rimane l'immagine nativa. Le date dei mosaici variano per zona: non si dichiara una fotografia live né un'unica acquisizione odierna.

Illuminazione e terminatore sono calcolati da Cesium per l'ora reale o per l'offset solare dichiarato. Nel dettaglio l'illuminazione si attenua per consentire di leggere le foto, anche durante la notte. Le distanze native di fade sono riferite al **centro della Terra**, e includono quindi il raggio WGS84; non vanno sostituite con quote. Una regressione scura a 12 km è stata trovata e corretta nella QA.

Le luci sono pixel del prodotto NASA VIIRS Black Marble **2016**, sovrapposti al lato notturno solo sulla vista fotografica orbitale; gamma/luminosità e un rinforzo caldo delle zone già luminose migliorano la resa. Non vengono generate nuove città o nuvole. Per consultare il prodotto scientifico Black Marble resta disponibile il relativo layer con la sua data originale. L'atmosfera nativa usa calcolo per frammento in Auto/Alta; Risparmio mantiene il profilo più leggero. Lo shader aggiunge un bordo sottile e un campo stellato procedurale statico: le stelle sono decorative, senza corrispondenza a un catalogo astronomico.

Il grading fotografico Naturale è disattivato per i raster scientifici. Il controllo considera **sia la richiesta sia il frame effettivamente mostrato**, così protegge anche le dissolvenze e il vecchio frame conservato dopo un caricamento fallito. La legenda e le date non vengono interpolate o ringiovanite. I mosaici regionali sono fotografie e consentono il grading.

## Affinamento atmosfera e crepuscolo — 0.4.2

Il bordo esterno usa la distanza minima del raggio di vista dall’ellissoide, espressa in metri. Due contributi esponenziali (14 e 42 km, parametri di resa artistica) formano il bordo blu e la fascia superiore più tenue: la larghezza non dipende dal discriminante variabile con la camera. I raggi rivolti dalla parte opposta alla Terra non generano aloni. Il raggio viene calcolato una volta per pixel; stelle procedurali soltanto fuori dal pianeta.

La tinta calda è localizzata intorno al terminatore solare e rinforzata verso il bordo, dove il percorso ottico è più lungo. Il lato in piena notte non riceve il bordo blu diurno. Rimane il Sole calcolato da Cesium, all’ora reale o con l’offset dichiarato; non si simulano meteo, rifrazione osservativa o nuove nuvole. Native scattering: intensità cielo 36, contributo Mie 8e−6 per canale e intensità terreno 6; calcolo per frammento Auto/Alta, profilo più leggero Risparmio. Sono parametri visivi, non una misura dell’atmosfera corrente.

La forza atmosferica segue una curva distinta (120–3.200 km) così rimane un orizzonte nel territorio senza colorare il dettaglio aereo. A 12 km il nuovo grading è nullo e la fotografia mantiene i suoi mosaici reali. Il guard di richiesta/frame effettivo disattiva anche la tinta atmosferica nativa sul terreno scientifico.

Scelte confrontate con [SkyAtmosphere Cesium](https://cesium.com/learn/cesiumjs/ref-doc/SkyAtmosphere.html), [Globe Cesium](https://cesium.com/learn/cesiumjs/ref-doc/Globe.html) e [Bruneton, Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/index.html). Si mantiene il modello Cesium e un supplemento originale nella passata esistente; non sono stati integrati LUT, una libreria atmosferica aggiuntiva o codice della reference.

## Scegliere uno stile

Apri la vista corrente → “Un altro modo di guardare”.

| Stile | Resa |
|---|---|
| Naturale | Fotografia, atmosfera e volume orbitale |
| Cartoon | Campiture più morbide, quantizzazione a sette livelli, tratto leggero |
| Cel shading | Quattro livelli, luce a fasce e contorni più netti |
| Pixel art | Celle da 6 px CSS, campionamento e palette ridotta |
| Voxel | Celle isometriche da 13 px CSS, tre facce illuminate; **effetto grafico 2D**, non cubi geometrici |
| ASCII | Celle da 10×15 px CSS; otto glifi originali disegnati con maschere 5×7 |
| Incisione | Carta, inchiostro, tratteggio e tratteggio incrociato |

Intensità 0–100% negli effetti alternativi. Gli effetti modificano il canvas della Terra, senza filtrare l'interfaccia HTML. Sui layer scientifici compare “colori rielaborati”: selezionare Naturale per usare la legenda. Il warning considera anche il precedente raster ancora visibile durante il cambio di fonte.

Stile/intensità sono validati con whitelist, salvati nella scena locale e nei backup v2, inclusi nel link del salvaschermo. Le vecchie scene senza stile diventano Naturale; la loro scelta esplicita giorno/notte è conservata. Le nuove scene partono con giorno/notte attivo. Nel salvaschermo si può cambiare lo stile dalle opzioni; l'orologio resta indipendente dal renderer.

## Rotazione ambientale

Attiva di default a **0,08°/s**, circa 75 minuti per un giro dalla vista orbitale. Nella barra destra: pausa/play, indicatore numerico e pannello con cursore **0,02–1°/s**, preset Lenta 0,04 / Base 0,08 / Rapida 0,20. Pausa e velocità sono validate e persistite nella scena, nei backup v2 e nel salvaschermo; le scene precedenti ricevono il nuovo default. La pausa del play delle date è indipendente.

La velocità si riduce con la quota (fattore quota / 3.000 km, limitato a 0,0001–1). Trascinamento/pinch sospendono il moto per tutti i puntatori attivi e per 1,8 secondi dopo il rilascio; ruota, zoom e voli della camera hanno la stessa pausa. Il ritorno dal background azzera il passo temporale e libera i puntatori interrotti. Passo massimo 100 ms, per evitare recuperi bruschi dopo uno stallo.

Un unico callback nel ciclo `preUpdate` di Cesium rispetta il profilo adattivo 30/60 fps; nessun timer aggiuntivo. Le preferenze di movimento ridotto avviano la Terra ferma; Play permette una scelta esplicita. I listener vengono rimossi all’uscita. La camera corrente viene aggiornata in memoria a ogni render visibile, anche nei gesti/voli senza rotazione; i pulsanti zoom pubblicano subito la nuova posizione: il backup la legge al click e il background tenta un solo snapshot. Non si scrive su IndexedDB ogni fotogramma; il flush durante la chiusura è best-effort, non una garanzia di completamento del browser.

## Rendering e limiti

Un solo PostProcessStage originale, una sola passata, nessun secondo motore, lettura CPU dei pixel o nuova dipendenza. Il raggio analitico interseca l'ellissoide WGS84 usando i parametri della camera; niente maschera circolare fissa. Dimensioni degli effetti espresse in pixel CSS e adattate al rapporto reale del framebuffer. Nessun timer aggiunto per animare lo shader. Stage/listener vengono rimossi e il GPU stage distrutto quando si cambia stile o si esce; errore di compilazione recuperato rimuovendo l'effetto.

Documentazione primaria consultata: [PostProcessStage](https://cesium.com/learn/cesiumjs/ref-doc/PostProcessStage.html), [Globe](https://cesium.com/learn/cesiumjs/ref-doc/Globe.html), [SkyAtmosphere](https://cesium.com/learn/cesiumjs/ref-doc/SkyAtmosphere.html). Il controllo della semantica delle distanze ha usato la dipendenza Cesium installata. Il ray shader presume il terreno ellissoidale attuale: terreno 3D/edifici futuri richiedono una maschera appropriata, non solo questo ellissoide.

La QA locale non certifica 60 fps, consumo o memoria su telefono. ASCII/pixel/voxel sono effetti di campionamento dello schermo, perciò non hanno una griglia geografica fissa mentre ruoti. Voxel geometrico, nuvole volumetriche o nuove fonti live richiedono un progetto e una verifica separati. Vedere VERIFICATION.md per le prove effettuate e HANDOFF.md per quelle di dispositivo/canali rimaste.
