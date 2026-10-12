# Macchina del tempo statistica — progetto e piano 0.5.0

Richiesta dell’utente: Upari come strumento gratuito/open source/non profit per curiosi di ogni professione. Serie reali, annuali, per confini, temi sociologici/politici/statistici; timeline trascinabile e autonoma fluida, fonti/unità/metodo/licenze sempre linkati. Nessun deploy. Le decisioni di implementazione ordinarie sono autorizzate dall’AGENTS; si procede nella UI esistente senza una nuova approvazione estetica.

## Prima consegna concreta

1. Demografia: popolazione, natalità/mortalità per1000, saldo naturale derivato (nascite meno morti, migrazione esclusa), speranza di vita. Lavoro: occupazione15+ e disoccupazione (stime ILO). API WDI come distributore con provenienza originale UN/ILO/uffici nazionali. Periodo1960–2025, disponibilità per serie/paese esplicita, nessun futuro inventato.
2. Temi nel catalogo esistente: fotografia, oceani, atmosfera, superficie; demografia e lavoro nel nuovo atlante statistico. Ulteriori fonti verificate UNdata/Eurostat/UNHCR in registro con stato operativo distinto.
3. Renderer nello stesso Cesium: poligoni Natural Earth110m pubblici, primitive raggruppate. Colori fissi sull’intera serie, senza ranking. Seconda variabile confrontabile nel pannello e in simboli proporzionali (area) con legenda. Picking/tap e selettore territorio, curva temporale con buchi conservati.
4. Timeline sempre sul globo durante lo studio, play/pausa/velocità/loop/range e cursore fra anni; interpolare solo l’aspetto fra due frame, mostrare i due valori originali. Nessuna stima infrannuale generata. Movimento ridotto: frame annuali discreti. Stop/background/cleanup, nessun salto al ritorno.
5. Tool Python senza dipendenze per acquisizione API/paginazione/hash/attribution e normalizzazioneCSV ISO3+anno+valore+metadata/licenza. Validatori TS prima del rendering. Confini generalizzati contemporanei, non ricostruzione geopolitica storica. Aggregati regionali esclusi dal join.
6. UNHCR AsylumApplications acquisito integralmente per il sottoinsieme SYR/UKR/AFG,N/G,2000–2025:2860 righe/263 relazioni, massimo64 archi sul globo. Domande annuali pubblicate, non stock, viaggi o individui unici. Le variazioni di natalità/mortalità non diventano trasferimenti internazionali.

## Contratto visivo e prestazionale

Terra dominante e palette approvata; navigazione su richiesta. Legenda e anno sempre presenti, scheda fonte a un click, essenziale anche senza hover. Nessun secondo engine, ricostruzione geometria per frame o fetch durante play. Geometria una volta, colori/buffer aggiornati solo quando cambia il frame. Clock unico del renderer Cesium; UI timeline limitata a10–15 aggiornamenti/s mentre il globo interpola al ritmo del renderer. Caricare e validare il pacchetto nel componente dopo scelta Atlante; il service worker include gli snapshot nella shell offline. Persistenza scena/backup/link/salvaschermo degli ID e della posizione, mai credenziali o dataset enormi nel frammento.

Non confondere fonte gratuita con licenza libera. Sei indicatori WDI verificati singolarmente CC BY4.0; Natural Earth public domain. Nessun logo o endorsement UN/WB/ILO. MIT del codice consente riuso, mentre il progetto non propone monetizzazione. Audit concluso: Esri rimosso; EOX2016 CC BY4.0 al suo posto, WGS84/~10m/2016–2017. Ultima istruzione: solo Naturale, rimozione completa UI/shader artistici e migrazione vecchie scene; Alta default. Nessun dato EOX successivo NC.

## Sequenza e verifiche

Acquisire dati/metadata e licenze → validatore e tool con prove di missing/duplicate/join/license → clock deterministico e prove seeking/loop/background/reducedmotion → renderer/picking → catalogo/pannello/timeline/trend → scena/backup/saver/offline → revisione indipendente → check/test/build e browser desktop/portrait/landscape → documenti e commit locali. Verificare estreme longitudini, fori/multipoligoni, falsi zeri, cambio serie durante play, indicatore lavoro prima1991, dati fino2025 senza anno corrente fittizio. Prestazioni Mac ancora soggette al limiteCPU osservato in0.4.3; nessuna promessa60 fps senza misura.

Implementazione completata localmente; contratti/metodi/fonti e backlog in STATISTICAL_ATLAS.md, prove effettive in VERIFICATION.md. Telefono domani, canali/PWA restano gate distinti.
