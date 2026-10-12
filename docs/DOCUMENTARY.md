# Percorsi del mondo — 0.6.0

13 ottobre 2026. Ricerca e implementazione originale sul motore Cesium esistente; nessun codice/asset di applicazioni terze copiato. Solo Terra Naturale. Nessun push, deploy, account o telemetria.

## Ricerca e scelta

| Soluzione primaria studiata | Cosa serve a Upari | Scelta |
|---|---|---|
| [Google Earth Studio, easing e camera](https://earth.google.com/studio/docs/tutorials/), [quota logaritmica](https://earth.google.com/studio/docs/advanced-features/logarithmic-adaptation/), [attribuzione](https://earth.google.com/studio/docs/en_gb/attribution/) | Ritmo di avvicinamento e inquadrature che orientano | Principi di regia; nessuna immagine Google o esportazione incorporata: fotografie libere già incluse |
| [ArcGIS StoryMaps, sidecar e map choreography](https://doc.esri.com/en/arcgis-storymaps/latest/author-and-share/add-sidecars.html) | Capitoli leggibili, progressione spaziale e autonomia del lettore | Scheda editoriale originale, capitoli e studio libero; nessun servizio/account Esri |
| [Cesium Camera](https://cesium.com/learn/cesiumjs/ref-doc/Camera.html) | Voli cancellabili, easing, camera nativa | `flyTo`, QUINTIC_IN_OUT, 3,8 s, quattro secondi di assestamento prima della timeline; cancellazione su pausa/gesti/background |

Tre alternative valutate: animare solo gli attuali riempimenti (poco documentario); video prerenderizzato (toglie esplorazione e letture originali); regia sullo stesso globo (scelta). Nessun secondo canvas, motore o timer di animazione.

## Fonti approfondite

| Fonte | Verifica e decisione |
|---|---|
| [Eurostat nrg_ind_ren](https://ec.europa.eu/eurostat/databrowser/view/nrg_ind_ren/default/table?lang=en), [metodo](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Renewable_energy_statistics), [riuso](https://ec.europa.eu/eurostat/help/copyright-notice) | Acquisito davvero: A / REN / PC, UE27, 2004–2024, 567 valori. Riuso statistico con attribuzione; etichetta `Eurostat-Reuse`, distinta dalla CC BY del testo editoriale. Traduzione/selezione Upari dichiarate, responsabilità Eurostat esclusa. Nessuna eccezione territoriale non-UE inclusa |
| [UNICEF open data / CC BY3.0IGO](https://data.unicef.org/data-for-action/unicef-indicators-on-the-state-of-children-and-women-now-100-percent-open-data-compliant/), [API SDMX](https://data.unicef.org/sdmx-api-documentation/), [FAQ](https://data.unicef.org/unicef-data-warehouse-faq/) | Fonte libera concreta per infanzia/salute. In coda: scegliere un indicatore e conservare sesso/età, intervalli di confidenza, note e anni assenti. Non caricata in questa versione |
| [UN WPP Data Portal API](https://population.un.org/dataportalapi/index.html), [fonti WPP2024](https://population.un.org/wpp/assets/Files/WPP2024_Data_Sources.pdf) | CC BY3.0IGO indicata dall'API; accesso ai dati richiede token. Non acquisito direttamente; eventuali scenari vanno distinti da storia/stime. WDI esistente resta distribuzione WDI |
| [UNdata, condizioni](https://data.un.org/Host.aspx?Content=UNdataUse) | Uso con citazione; candidato per serie ulteriori. Verificare singolo dataset, codici e definizioni prima dell'import. Non caricata una selezione UNdata |
| Flussi bilaterali ulteriori, commercio e mobilità | Nessun flusso dedotto dalla quota energetica. Il percorso protezione usa soltanto relazioni UNHCR già acquisite. Estensioni restano in coda, con verifica per dataset/licenza prima del download |

## Usare i percorsi

Terra → **Percorsi del mondo**, oppure atlante → icona **Percorsi documentari**. Energia europea (4 capitoli), speranza di vita (3), domande d'asilo (3). I percorsi vengono mostrati solo con codici di misura, paesi e valori estremi originali compatibili; protezione richiede anche l'ordine/origini SYR/UKR/AFG documentato. Non associazioni per somiglianza del nome.

Durante un percorso si vede la fotografia, il contorno del paese scelto, un richiamo geografico e la serie annuale. I riempimenti e i cerchi secondari restano nascosti; i loro attributi non vengono aggiornati inutilmente. Uscendo si ripristina l'atlante completo con la sua palette invariata. Nel percorso UNHCR restano scie/archi schematici e legenda per origine: nessuna traiettoria, velocità o persona osservata viene suggerita.

La curva conserva null e valori originali; gli estremi sono arrotondati soltanto per la lettura. Il cursore segue il tempo continuo ma il richiamo geografico mostra il valore originale dell'anno indicato, mentre la timeline mantiene entrambi gli estremi infrannuali. Il punto è rappresentativo del paese; il segmento ha altezza fissa, senza significato quantitativo. Non localizza impianti, osservazioni o una distribuzione subnazionale. La fotografia NASA/EOX 2016–2017 resta distinta dall'anno statistico e dal Sole corrente.

Pausa ferma anni e camera. Gesti sul globo, zoom e background mettono in pausa; modificare la timeline o un indicatore termina la regia e torna allo studio libero. La navigazione tra capitoli è anche da tastiera, con pulsanti etichettati. In movimento ridotto: capitoli manuali, anno finale originale e spostamento camera immediato; nessuna riproduzione automatica. Il cambiamento della preferenza sospende la regia. Nessuna modifica alle preferenze OS.

Desktop: curva e spiegazione; portrait: lettura più compatta, spiegazione completa nelle fonti del capitolo; landscape: testo scorrevole e comandi fissi. La Terra resta esplorabile. Pausa/fonti/uscita/capitoli sono fuori dalla porzione scorrevole.

## Lifecycle e persistenza

`JourneyDirector` usa esclusivamente il preUpdate Cesium già condiviso con `StudyController`. Passo massimo120ms, nessun recupero del tempo perso. React riceve aggiornamenti dello studio circa12,5Hz, eventi di regia solo ai cambi/pausa. Geometria dell'atlante conservata; richiamo composto da una label e un segmento nel medesimo motore. Nessun salvataggio per frame.

L'ingresso ferma playback NASA e confronto. Cleanup ferma director/studio, cancella voli e listener; import e richiesta asincrona mantengono i gate esistenti. Scene/backup/salvaschermo salvano camera/indicatore/paese/anno come **fotogramma fermo**, non la regia in esecuzione: non riparte una timeline accelerata senza il suo percorso. I dataset custom restano separati come prima. I percorsi si riaprono dal catalogo; non è stato aggiunto un formato di regia condivisibile o video export.

## Limiti di qualità

Risoluzione nativa e profili Alta/Auto/Risparmio invariati. Non è un certificato UHD4K/60fps: foto storiche, dettaglio nativo, GPU, DPR e viewport restano determinanti. Prove correnti in VERIFICATION/PERFORMANCE; telefono reale, consumo prolungato, PWA/AR e notifiche non verificati da questo lavoro.
