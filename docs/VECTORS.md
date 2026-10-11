# Campi reali e pipeline di distribuzione — 0.3.0

Il browser riceve due pacchetti statici, senza credenziali. Sono campi di velocità distinti dalle immagini NASA: le due date rimangono visibili separatamente anche nel salvaschermo. Non sono live e non identificano organismi o oggetti. I pacchetti distribuiti non si aggiornano da soli.

| Pacchetto | Fonte / epoca UTC | Griglia e campionamento | Dati validi |
|---|---|---|---|
| `public/vectors/wind.json` | ASCAT Metop-C / NOAA OceanWatch, 2026-10-10 12:00 | Vento marino a 10 m; prodotto 0,25°, griglia ERDDAP circa 1/3°, decimata a circa 2° | 6.162 / 16.200 celle |
| `public/vectors/currents.json` | OSCAR / ESR, archivio NOAA, 2014-09-26 00:00 | Composito 5 giorni, livello 15 m, originale 1/3°, decimato a 2° | 8.763 / 14.580 celle |

OSCAR pubblico `jplOscar` termina nel 2014. Il suo nome non autorizza a chiamarlo attuale. OSCAR v2 NRT è un altro prodotto: medie giornaliere su 0,25°, strato superiore di 30 m, ritardo dichiarato circa due giorni. [Fonte PO.DAAC](https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_NRT_V2.0). Non è stato scaricato un file autenticato v2 in questa sessione.

## Metodo di rendering

`vectors.ts` interpola bilinearmente le componenti est/nord in m/s soltanto quando tutte e quattro le celle sono presenti. Un angolo mancante rende il campione assente. Advezione al punto medio, raggi locali WGS84; longitudine periodica soltanto per griglie globali, interruzione delle scie all'antimeridiano. Nessuna interpolazione temporale o animazione dedotta dai colori NASA.

Una raccolta di primitive Cesium, senza un secondo motore 3D. Massimo 80/180/320 scie per Risparmio/Auto/Alta, sette campioni di storia ogni 0,4 s più la testa, aggiornamento 10/20 Hz. Campo mantenuto costante: 1 secondo visualizzato rappresenta 1 ora per vento, 1 giorno per correnti. Questo esagera intenzionalmente il tempo, non la velocità nei dati; non è una ricostruzione di giorni successivi. Background sospende il timer; cambio camera rigenera le scie; movimento ridotto le mantiene statiche. Le linee possono essere molto corte a scala planetaria: non si inventa una velocità per allungarle.

## Riprodurre i pacchetti ERDDAP

Fonti/metadati e condizioni:

- https://coastwatch.pfeg.noaa.gov/erddap/info/jplOscar/index.html
- https://coastwatch.pfeg.noaa.gov/erddap/info/erdQCwindproducts1day/index.html

Richieste di sottoinsiemi, senza token (le parentesi devono essere URL-encoded se il client lo richiede):

```text
https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplOscar.json?u[(2014-09-26T00:00:00Z)][0][0:6:480][0:6:1074],v[(2014-09-26T00:00:00Z)][0][0:6:480][0:6:1074]
https://coastwatch.pfeg.noaa.gov/erddap/griddap/erdQCwindproducts1day.json?wind_u[(2026-10-10T12:00:00Z)][0][0:6:539][0:6:1079],wind_v[(2026-10-10T12:00:00Z)][0][0:6:539][0:6:1079]
```

`package-vectors.py` usa soltanto Python standard: richiede timestamp UTC unico, livello unico e m/s; riordina gli assi e normalizza la longitudine. Decimazione già effettuata dalla richiesta, nessun riempimento. Arrotondamento a 0,001 m/s; maschera `null` conservata. Esempio:

```sh
python3 scripts/package-vectors.py wind-erddap.json public/vectors/wind.json --kind wind --u wind_u --v wind_v --source 'ASCAT Metop-C / NOAA OceanWatch' --url 'https://coastwatch.pfeg.noaa.gov/erddap/info/erdQCwindproducts1day/index.html' --period 'Composito giornaliero del 10 ottobre 2026' --native-resolution 'Griglia ERDDAP circa 1/3° (prodotto ASCAT 0,25°)' --level 'Vento marino a 10 m'
```

| Snapshot | SHA-256 |
|---|---|
| JSON ERDDAP correnti originale | `2724d3007e947fdf2d1e233a02460b8acc9e111d84304b026bc08aaa5b8b480a` |
| Pacchetto correnti | `74c66be7bac275a17f7e0c369348cd6e10330f7e3ae41e2f84d9460bf7d1f10f` |
| JSON ERDDAP vento originale | `cbba19b6f8c5c172fadb372559b4843236c784833716f8cbc7eb45690bee2cdd` |
| Pacchetto vento | `a8170b1b7096a1677ebcb78f8d9d10fccc34b50a0e9b2e5b9b75901b123b3478` |

Gli originali pubblici di QA sono in `/private/tmp/upari-oscar-data.json` e `/private/tmp/upari-wind-data.json`. I checksum dei file grezzi descrivono questi download; formattazione o distribuzione futura può cambiare. Per la build contano anche checksum e metadati dei pacchetti finali.

## Adattatore CF NetCDF del distributore

`package-netcdf.py` converte un file scientifico locale con assi rettilinei CF e componenti m/s. Non scarica dati, non gestisce account e non pubblica. Download autenticati, autorizzazioni e segreti restano nel proprio ambiente scientifico. Dipendenze opzionali Python 3.11+: xarray, numpy, scipy (NetCDF3), h5netcdf/h5py (NetCDF4). Nessuna entra nella PWA.

1. Scarica il file dal distributore ufficiale nel tuo ambiente autorizzato.
2. Ispeziona nomi, unità, dimensioni, timestamp e livello nelle sue variabili.
3. Specifica gli assi/componenti corretti con `--latitude`, `--longitude`, `--u`, `--v`.
4. Specifica `--time-index` se esistono più istanti e `--select DIM=INDEX` per livelli non singleton. Scrivi il livello selezionato in `--level`.
5. Usa `--stride 8` soltanto per una griglia originale di 0,25° se vuoi campionare a 2°. Fonte, periodo e risoluzione vanno dichiarati dai metadati del file.
6. Converti in un file di staging, valida il JSON con lo schema di `vectors.ts`, confronta maschera/unità/timestamp e checksum. Poi sostituisci il pacchetto e ricostruisci la build. Una pubblicazione richiede una richiesta separata.

```sh
python scripts/package-netcdf.py source.nc staging/currents.json --kind currents --source 'OSCAR v2 / ESR / NASA PO.DAAC' --url 'https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_NRT_V2.0' --period 'Media giornaliera' --resolution '0,25°' --level 'Media dello strato 0–30 m' --stride 8 --latitude latitude --longitude longitude --u u --v v
python scripts/test-package-netcdf.py
UPARI_TEST_NETCDF_ENGINE=h5netcdf python scripts/test-package-netcdf.py
```

I nomi nel comando sono parametri da verificare sul file reale, non una dichiarazione sul suo schema. I test usano fixture numeriche tecniche con ordine degli assi invertito, cella mancante, istanti multipli, unità errate e livello ambiguo. Non vengono distribuite come dati del pianeta. L'adattatore è verificato; ingestione operativa OSCAR v2 e aggiornamento ricorrente richiedono un file reale autorizzato.
