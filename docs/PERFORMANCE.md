# Aggiornamento 0.5.0

Solo Naturale; Alta di default, Auto/Batteria espliciti conservati. Il cambio di fotografia Esri→EOX2016 nasce dal requisito di licenza libera e comporta circa10m nativi, non è una riduzione del framebuffer per inseguire gli fps. Atmosfera/crepuscolo/zoom e camera on-demand restano.

Atlante: geometria statica, aggiornamento attributi, clock nativo e UI limitata12,5Hz. Campione DEV IAB1280×720/DPR1,120 intervalli durante play UNHCR:59,512fps,16,803ms medi, p9517,9ms,max33,6ms; submission JS2,2375ms medi,p952,6ms. Breve, interno e prima del build finale; non è Chrome fisico né una certificazione Naturale60fps. Diagnostica studio DEV esclusa dalla build normale.

**iPhone17Pro nella stessa Wi-Fi confermato; prove reali domani per richiesta dell'utente.** Verificare build compilata/LAN, Auto e Alta, Natural zoom/rotazione e timeline durante gesti/background. Nessun deploy o modifica impostazioni del Mac. Il target60fps Naturale rimane aperto; la diagnostica opt-in del metodo sotto resta disponibile, gli stili artistici sotto sono riferimenti storici.

---

# Fluidità Naturale — 0.4.3

12 ottobre 2026. Obiettivo: 60 fps sul Mac conservando la qualità. **Non ancora certificato**. Nessun push/deploy, invio diagnostico o modifica alle impostazioni del Mac.

## Modifiche verificate

- Camera letta quando serve a salvataggio, backup, link, pausa o zoom. Tolta la pubblicazione per-frame: nell’installazione Cesium ogni getter heading/pitch/roll cambia il riferimento ENU e lo ripristina (`Camera.js`, proprietà da riga 996); tre getter causavano sei cambi di matrice per fotogramma. Cache finale conservata prima del teardown; import esclude il lettore della scena precedente.
- Tetto 61 fps per Auto/Alta, 30 per Batteria/salvaschermo. Il margine di 1 Hz evita la scadenza stretta `delta > 1000/targetFrameRate` nel ciclo CesiumWidget locale. Rimane un tetto: non significa 61 fps effettivi. Il tentativo con RAF senza limite è stato scartato; avrebbe anche sbloccato i display ad alta frequenza. [API CesiumWidget](https://cesium.com/learn/cesiumjs/ref-doc/CesiumWidget.html).
- Shader, texture, per-fragment atmosphere, budget Auto 3 MP, MSAA 4 e dettaglio SSE 1,5 invariati. Nessuna riduzione automatica della qualità per inseguire il numero di fps.
- Diagnostica locale opt-in con `?perf=1`, disponibile anche nella build e nel salvaschermo. Senza parametro, produzione non attiva osservatori diagnostici. In sviluppo gli attributi DOM restano disponibili anche senza HUD. Nessun timer nuovo, telemetria o readback GPU. Il contatore HUD serve anche a dichiarare apertamente quando il target non è raggiunto.

## Campioni Mac e limite attuale

Chrome fisico, AMD Radeon Pro Vega 56 / ANGLE Metal, iMacPro1,1, DPR 2. Una vista in rotazione. Dati sintetici conservati in [0.4.3-mac.json](performance/0.4.3-mac.json).

| Campione di 300 intervalli | FPS medio | Intervallo medio / p95 | Contesto |
|---|---:|---|---|
| Baseline iniziale, cap 60 | 58,84 | 17,00 / 36,10 ms | viewport 1701×1191; framebuffer 2069×1449 |
| Sviluppo finale Naturale, luce reale, cap 61 | 31,80 | 31,44 / 41,70 ms | viewport 1701×1135; framebuffer 2120×1414; pagina visibile e in focus |
| Cadenza RAF della prova sviluppo | 31,81 | 31,44 / 49,90 ms | 300 callback del browser, senza richiesta di rendering |

| Build finale, cap 61 | 19,21 | 52,04 / 71,30 ms | stesso profilo 1701×1135, 2120×1414; focus/visibile, 20:10 CEST |
| RAF della build finale | 18,67 | 53,57 / 75,00 ms | browser anch’esso rallentato |

La baseline e il finale **non costituiscono un confronto causale**: cambiano condizioni del Mac, viewport e ora del Sole; la baseline non registra l’intera scena. Nello sviluppo finale il tempo JS preUpdate→postRender è medio 3,75 ms, p95 12,80 ms (build finale: 5,04 / 14,00 ms): non è tempo GPU. I campioni sono brevi, non misure di ogni frame effettivamente presentato.

`pmset -g therm` alle 19:40 e 20:01 CEST registra `CPU_Speed_Limit=28`; il limite dello scheduler passa da 67 a 80, CPU disponibili 16. Alle 19:40 `top` mostra load medio a 1 minuto 60,28. Nessun thermal/performance warning registrato. È uno stato prestazionale osservato; non identifica la causa del carico o del limite. Non sono state chiuse app, cambiati profili energetici o modificati servizi. La cadenza RAF è anch’essa bassa: ridurre l’immagine non fornirebbe una prova onesta del target richiesto.

Ripetere sul Mac in condizioni normali prima di certificare 60 fps sostenuti. Il valore di 58,84 iniziale è vicino al target ma il p95 mostra già irregolarità. I numeri della 0.4.2 nel browser interno DPR 1 sono storici, non comparabili con Chrome fisico.

## Metodo ripetibile

1. Aprire una sola vista `/?perf=1`, scegliere Fotografia satellitare, stile Naturale, qualità Auto, Giorno e notte e Vista pianeta. Velocità 0,08°/s. Nessun confronto, vettore o altra vista 3D in movimento.
2. Fare Pausa → Play dopo ogni zoom/gesto o cambio di scenario. Il campione attende tile caricate e 30 frame di warmup, poi 300 intervalli postRender. Si riavvia anche cambiando layer, date, stile, illuminazione o profilo/viewport. Non confrontare campioni con pannelli aperti o gesti nel mezzo.
3. Annotare fps e p95 mostrati; a 60 fps un intervallo nominale è 16,67 ms. In sviluppo leggere anche gli attributi DOM `data-render-profile`, `data-render-sample`, `data-raf-sample`. I due campioni RAF/Cesium sono vicini nel tempo, non sincronizzati al frame.
4. Ripetere tre volte a viewport/DPR/qualità costanti, poi una prova continua di almeno 5 minuti; registrare condizioni della macchina e drift. La diagnosi breve non sostituisce questa accettazione.

## iPhone 17 Pro dell’utente — prove ancora da eseguire

Il modello è confermato. Wi-Fi comune/USB non ancora confermati; nessuna prova su questo dispositivo effettuata. `xcrun xctrace list devices` è terminato con codice 139 e non ha stabilito accesso al telefono. Il responsive Chrome è una verifica di layout, non un iPhone.

Per la prova grafica servire **soltanto `dist/`** nella LAN, a build verde (`npm run preview -- --host 0.0.0.0 --port 4175`), e aprire in Safari `http://<IP-del-Mac>:4175/?perf=1` dalla stessa rete. Nessun deploy/tunnel. La preview loopback sul Mac usa `http://127.0.0.1:4175/?perf=1`. La diagnosi non viene salvata o inviata da sola.

| Prova sul telefono | Cosa annotare |
|---|---|
| Naturale Auto orbitale | Tre campioni fps/p95, stato Risparmio energetico, pagina in primo piano |
| Naturale Alta | Stessi campioni e confronto visivo; nessun cambio qualità nascosto |
| Zoom territorio ↔ pianeta | Dettaglio, atmosfera, transizione senza salti; drag e pinch reali |
| 5 minuti e background/rientro | Fluidità, eventuale calore/drift, camera conservata, nessun salto di rotazione |
| Portrait/entrambi i landscape | Leggibilità del pannello, barra destra e azioni libere |
| Pausa e salvaschermo | Pausa reale, ripresa, cap separato 30; query diagnostica conservata |

HTTP locale basta per questa prova WebGL. Fotocamera/orientamento e PWA/service worker richiedono un contesto sicuro sul telefono: questa LAN HTTP non certifica AR, installazione/offline o notifiche. Questi test e i canali dell’utente restano separati, senza invii live automatici.
