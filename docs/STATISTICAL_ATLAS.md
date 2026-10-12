# Società nel tempo — atlante 0.5.1

Upari è gratuito, open source e senza finalità di lucro. Il codice resta MIT: un divieto di riuso commerciale toglierebbe libertà ai suoi utilizzatori. Dati, geografie e fotografie conservano invece le proprie attribuzioni/licenze. Nessun logo o endorsement ONU/World Bank/ILO/UNHCR. Nessun account, telemetria, upload centrale o API istituzionale chiamata durante il play.

## Usarlo

Layer → **Società nel tempo → Atlante statistico**. Indicatore, legenda fissa, unità, anno e link al metodo rimangono sul globo. Play/pausa, anni precedenti/successivi, velocità avanti/indietro, cursore continuo; nelle fonti si sceglie intervallo/loop, territorio e una seconda variabile. Click/tap su un poligono seleziona il territorio; un menu permette di leggere anche territori senza geometria. La curva conserva i buchi. Su schermi piccoli il pannello parte compatto e può essere espanso; le fonti complete sono a un click.

Si interpolano **colori/dimensioni**, mai misure: fra 2020 e 2021 vengono mostrati entrambi i valori annuali originali. Assenza non significa zero; nessun dato di un anno assente viene ricostruito. Timeline statistica, date dei raster, tempo solare/ISS e rotazione della Terra sono indipendenti. Durante lo studio vengono sospesi i vettori vento/correnti e il confronto raster: non si mescolano archi statistici e campi fisici senza le rispettive legende. La configurazione fotografica resta conservata per il ritorno. In movimento ridotto il globo usa anni discreti e il play non parte automaticamente.

## Pacchetto incluso, acquisito 12 ottobre 2026

217 paesi/territori WDI, aggregati esclusi, anni 1960–2025. Disponibilità variabile per territorio; il periodo sotto è quello dell'indicatore, non una garanzia di copertura completa.

| Tema | Indicatore e codice | Unità / periodo | Provenienza |
|---|---|---|---|
| Demografia | Natalità `SP.DYN.CBRT.IN` | nascite/1000 abitanti, 1960–2024 | UN WPP, uffici nazionali, Eurostat tramite WDI |
| Demografia | Mortalità `SP.DYN.CDRT.IN` | morti/1000 abitanti, 1960–2024 | stessi distributori dichiarati nella scheda |
| Demografia | Popolazione `SP.POP.TOTL` | abitanti, 1960–2025 | UN WPP/uffici nazionali/Eurostat tramite WDI |
| Demografia | Speranza di vita `SP.DYN.LE00.IN` | anni, 1960–2024 | UN WPP/uffici nazionali/Eurostat tramite WDI |
| Demografia | Saldo naturale | natalità−mortalità per1000, 1960–2024 | derivazione Upari, stesso territorio/anno; migrazione esclusa |
| Lavoro | Occupazione15+ `SL.EMP.TOTL.SP.ZS` | % popolazione15+, 1991–2025 | ILO modelled estimates tramite WDI |
| Lavoro | Disoccupazione `SL.UEM.TOTL.ZS` | % forza lavoro, 1991–2025 | ILO modelled estimates tramite WDI |
| Mobilità/protezione | Domande di asilo · tre origini | domande individuali pubblicate, 2000–2025 | UNHCR AsylumApplications, selezione documentata sotto |

Le sei serie WDI sono CC BY4.0 **verificate singolarmente** nei metadati. Schede originali: `https://databank.worldbank.org/metadataglossary/world-development-indicators/series/CODICE`; API riproducibile `https://api.worldbank.org/v2/country/all/indicator/CODICE?source=2&date=1960:2025&format=json&per_page=20000`. [Licenza World Bank](https://datacatalog.worldbank.org/public-licenses#cc-by), [condizioni](https://data.worldbank.org/summary-terms-of-use). Il catalogo WDI riporta aggiornamento 8 ottobre 2026; non è la data di ogni osservazione. Provenienza originale conservata, non dichiarare un download diretto UN WPP. I tassi grezzi dipendono dalla struttura per età; le stime ILO comprendono imputazioni e **non sono un ranking fra paesi**, occupazione non significa lavoro dignitoso.

## Relazioni reali e limiti

[UNHCR AsylumApplications](https://refugeedata.unhcr.org/en/data-finder/detail/AsylumApplications/), [metadati](https://refugeedata.unhcr.org/en/data-finder/detail/AsylumApplications/metadata/), [API](https://refugeedata.unhcr.org/en/documentation/technical-reference/api/), [condizioni CC BY4.0](https://refugeedata.unhcr.org/en/terms-and-conditions-of-use/).

Acquisizione completa del **sottoinsieme**, non del mondo: origine SYR/UKR/AFG, domande nuove N, autorità governativa G, unità IND.1.TOT, 2000–2025. 29 pagine seriali distanziate, 2860 righe, 263 relazioni, nessun identificatore geografico senza match. `YYYY-12` è il codice del dato annuale, non un conteggio del solo dicembre. Note pubbliche/periodo/copertura/natura/reporting/deviations sono conservati per relazione e anno. La mappa somma solo le righe pubblicate per paese di presentazione: non il totale di tutte le origini, non persone uniche, non migrazione generale. Una relazione assente resta assente.

Sul globo si disegnano **fino a 64 relazioni** scelte per massimo annuale sull'intero periodo, quindi la selezione resta stabile durante play. Tutte le263 sono nel pacchetto e nei dettagli. Colori delle origini: Siria turchese, Ucraina rosa, Afghanistan ambra; spessore `4+10√(valore/massimo)` px (minimo di leggibilità, scala fissa) sul periodo. Le frecce collegano punti geografici rappresentativi, sono schematiche: **non itinerari osservati**, né particelle equivalenti a individui. Prima prova PopStatsOfficial con quei filtri restituiva zero righe: non usata come dato zero. Un tentativo bulkCSV ha superato il budget150MB ed è stato interrotto; il file parziale resta temporaneo, escluso dalla distribuzione.

## Geografia, colore e confronto

Natural Earth1:110m, [public domain](https://www.naturalearthdata.com/about/terms-of-use/), revisione `9380cca83db5f9aef52d5e762765100745f84b27`. 177 feature, 288 poligoni/multipoligoni, fori conservati. Identificatori esatti WB_A3/ISO_A3_EH/ADM0_A3; Kosovo KOS→XKX esplicito. Sette confini senza corrispondenza WDI: SAH, FLK, ATF, TWN, ATA, CYN, SOL. Nessun valore assegnato per vicinanza. Molti piccoli territori sono nei dati ma non nel globo generalizzato. **Confini contemporanei, non quelli storici dell'anno selezionato**; non esprimono una posizione politica.

Scala Viridis fissa sull'intero pacchetto, grigio per dati assenti. Saldo con negativo blu, zero neutro, positivo ambra anche se la scala è asimmetrica. Nessuna auto-normalizzazione annuale: lo stesso valore mantiene lo stesso colore. Seconda variabile: cerchi rosa con area proporzionale alla posizione nella scala fissa dichiarata; minimo3px per leggibilità, non causalità. Simboli nascosti dietro l'orizzonte. I colori scientifici escludono grading fotografico e tinta atmosferica del terreno.

Geometria Cesium costruita una volta, attributi aggiornati senza ricreare confini. Stesso ciclo nativo per clock/interpolazione; React circa12,5 Hz per testi, nessun fetch o scrittura IndexedDB per fotogramma. Primo frame/background sospendono il clock, passo limitato120ms evita recuperi improvvisi. Diagnostica DEV bounded120 postRender; produzione normale senza questo osservatore. La misura breve nel browser interno non certifica GPU, consumo o 60 fps sostenuti su Mac/iPhone.

## Nomi dei territori e scie 0.5.1

Nome al passaggio del mouse anche sulla Terra Naturale; nell’atlante, anno e valori annuali originali nel tooltip. Hit-test geografico WGS84 limitato a20Hz, indice costruito una volta; multipoligoni, fori e antimeridiano verificati. Confini generalizzati contemporanei Natural Earth110m: il tooltip non certifica frontiere o coste dettagliate. Su pacchetti regionali usa i confini/nome del pacchetto importato. Tap conserva la selezione nell’atlante; trascinamento sospende il tooltip.

Materiale Cesium Fabric originale: scie morbide e chevron che scorrono origine→destinazione. Animazione illustrativa, **non velocità di migrazione né persone simulate**. Pause separate per anno e scie; `flowMotion` persistente e true nelle vecchie scene. Movimento ridotto e pagina nascosta sospendono le scie, senza recupero del tempo perso. Nessun timer o motore aggiuntivo: solo uniformi nel ciclo Cesium, geometria statica. Archi ordinati e fase condivisa per origine favoriscono il batching nativo; hover evidenzia il confine e attenua le relazioni estranee senza cambiare valori/palette. UI con luce contenuta e legenda scorribile nei viewport bassi.

API studiate: [Material](https://cesium.com/learn/cesiumjs/ref-doc/Material.html), [Fabric](https://github.com/CesiumGS/cesium/wiki/Fabric). Nessun codice grafico di applicazioni terze copiato.

## Pacchetti e tool riutilizzabili

`scripts/fetch-statistics.py`: estrazione esplicita WDI/metadati/confini pinned, paginazione, esclusione aggregati, hash delle risposte, nessuna imputazione. `scripts/fetch-asylum.py`: estrazione UNHCR limitata a5000righe e52pagine, verifica dimensioni/unità/duplicati/totale invariato; non usarlo come polling di produzione.

`scripts/package-statistics.py` trasforma CSV lungo `region,year,indicator,value` con metadata e GeoJSON, senza rete/geocoding. Il valore vuoto e gli anni non presenti diventano null; duplicati, regioni ignote e NaN vengono rifiutati. Supporta **regioni/province/comuni** con identificatori espliciti e `--region-property`; non attribuisce valori nazionali a suddivisioni. Metadata devono dichiarare fonte/definizione/unità/natura/caveat/attribuzione/licenza libera/URL per ogni serie e fonte/licenza dei confini.

```sh
python3 scripts/package-statistics.py table.csv bundle.json --metadata metadata.json --boundaries regions.geojson --region-property region_id
node scripts/validate-statistics.mjs bundle.json
python3 scripts/test-package-statistics.py
```

Il tool invoca lo stesso validatore TS dell'app; richiede Node22.18+ o24+ con supporto TypeScript nativo, oltre a Python standard. Il runtime app usa `{data,boundaries}` con `data.version=1`, `years`, `countries`, `indicators`, `values[indicator][region]`, `boundary`, optional `provenance`/`flows`. Esempio reale completo scaricabile dalle fonti dell'atlante; i contratti sono in `src/lib/statistics.ts`. Budget:8MiB,400territori,24indicatori,201anni contigui,300000valori,500feature/60000vertici,1500relazioni. Solo HTTPS pubblico senza credenziali/query segrete; licenze ammesse CC-BY-4.0,CC-BY-3.0-IGO,CC0-1.0,Public-Domain. Le dichiarazioni del pacchetto non sono una certificazione automatica della fonte. Whitelist di proprietà e coordinate2D; campi estranei non vengono conservati/esportati.

Import dal pannello resta in IndexedDB, identificato dall'hash del contenuto validato (stabile dopo export/reimport). Richiede HTTPS/localhost per crypto.subtle; il pacchetto incluso funziona in LAN HTTP. Download CSV dell'anno mantiene numeri originali (anche negativi), assenze vuote, unità/fonti/licenze. Download JSON comprende serie/geografie/note/provenienza. **Scene, URL e backup salvano configurazione/anno/ID, non i dataset importati**: conservare anche il JSON completo; su un altro dispositivo importare lo stesso file. Il salvaschermo supporta l'atlante e mantiene l'anno della serie distinto dall'orologio corrente. Shell offline include i tre pacchetti, non tutto il pianeta.

## Integrità degli snapshot distribuiti

| File | Byte | SHA256 |
|---|---:|---|
| world.json | 806676 | `4d6b2c313d295388f412cb947e76fbadc7d040867d1fe53d533c5bee468b93fb` |
| countries.geojson | 264258 | `d271d3d6600c01beb7ad11a60f49bb6fc16b81305027139228ad977986ea909a` |
| asylum.json | 530949 | `56466279ceae34b55dff1c0086645e1af00e9009d5db4b447aae3e8c4b530a83` |

URL/hash/byte delle risposte originali sono nel ledger provenance; numeri originali conservati prima dell'arrotondamento a due decimali della UI. Le fonti possono revisionare serie storiche: una futura estrazione va consegnata come nuovo snapshot verificato.

## Idee in coda, non dichiarate operative

| Visione | Fonte primaria verificata | Prossimo passo |
|---|---|---|
| Regioni, reddito e lavoro | [Eurostat](https://ec.europa.eu/eurostat/en/about-us/communicating-disseminating-statistics), [copyright/riuso](https://ec.europa.eu/eurostat/help/copyright-notice) | scegliere serie/NUTS e versioni dei confini; riuso con fonte, verificare eccezioni del singolo dataset |
| Infanzia, istruzione, salute | [UNICEF open data](https://data.unicef.org/open-data/), [CC BY3.0IGO](https://data.unicef.org/data-for-action/unicef-indicators-on-the-state-of-children-and-women-now-100-percent-open-data-compliant/) | scegliere indicatori SDMX, unità e disaggregazioni compatibili |
| Ulteriori visioni socio/economiche | [UNdata, uso libero con citazione](https://data.un.org/Host.aspx?Content=UNdataUse) | acquisizione per serie, definizioni e corrispondenze; niente merge sulla sola somiglianza del nome |
| Proiezioni demografiche | [UN WPP](https://population.un.org/wpp/) | separare proiezioni da storia, scenario/variante espliciti |
| Confini storici / visioni politiche | fonte libera ancora da selezionare | versioni per data, metodo e provenienza; non trattare il globo contemporaneo come archivio geopolitico |
| Percorsi di studio, confronti multipli, flussi più estesi | snapshot verificati sopra | narrazioni condivisibili, filtraggio relazioni/budget; niente trasferimenti inventati dai soli tassi |

Questa prima consegna implementa gli otto indicatori e la pipeline generica; il registro non implica che tutte le fonti proposte siano già caricate.
