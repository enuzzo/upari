# Upari — ripresa dall’ufficio, 13 ottobre 2026

Questo è il punto di ingresso operativo. Versione **0.6.0**, codice documentario `1dce320`, cache basata sui contenuti `913aa53`, documentazione iniziale `0c0edc0`; successiva consegna/licenza e verifiche in WORK_LOG.md e VERIFICATION.md. Repository pubblica creata: https://github.com/enuzzo/upari . Primo push verificato su `3c85134`; `origin` ora punta aGitHub e `delivery-bundle` conserva ilremote originale. L’ultimo commit del ramo main è l’autorità; non il vecchio ZIP/bundle/DELIVERY0.2.

## Stato e decisioni da conservare

- Terra dominante, nero/turchese, italiano, solo Naturale, Alta predefinita; ISS opzionale e inizialmente spenta. Un solo Cesium, nessuna telemetria/account centrale. Scene e luoghi personali in IndexedDB.
- Tre percorsi documentari: energia europea (quattro capitoli), speranza di vita (tre), protezione (tre). Voli cancellabili, quattro secondi di assestamento, fotografia/contorno/richiamo geografico e valori annuali reali. Gesti/zoom/background mettono in pausa; movimento ridotto manuale. Nessuna regia riavviata automaticamente da backup/reload/salvaschermo.
- Nove indicatori, WDI/ONU/ILO/UNHCR più Eurostat diretto. Rinnovabili:567 valori, UE27,2004–2024, unità e cambio metodo RED2021 dichiarati. Nessuna imputazione, valore mancante diverso da zero, archi schematici diversi da viaggi osservati. Fotografie e luce notturna storiche hanno date proprie.
- Distribuzione corrente Apache-2.0 con NOTICE: attribuzione a enuzzo e repository. Revisioni storiche MIT restano MIT; font/dipendenze/foto/dati conservano condizioni proprie. LICENSE/NOTICE/THIRD_PARTY_NOTICES.md inclusi nella build e nella shell offline. Dettagli in LICENSING.md.
- L’utente ha autorizzato creazione repository e push il13ottobre. **Il deploy del sito e l’invio sui canali personali restano rinviati.** Nessun restart/cambio piano/provider/energia richiesto.

## Materiale portabile

| Materiale | Dove e cosa dimostra |
|---|---|
| Sorgenti e storia | Repository main; bundle aggiornato separato nella cartella esterna `office-handoff-2026-10-13` |
| Identità e integrità | `office-handoff-2026-10-13/REVISION.txt`, `SOURCE_INPUTS.sha256`, `SHA256SUMS`; bundle ripristinato e199file verificati su questoMac, da ricontrollare sul Mac reale prima di lavorare |
| Screenshot reali | `docs/evidence/0.6.0/`: desktop, portrait, landscape, salvaschermo. Sono prove della QA locale, non concept né accettazione del telefono |
| Ricerca/licenze/metodi | DOCUMENTARY.md, STATISTICAL_ATLAS.md, SOURCES.md, THIRD_PARTY_NOTICES.md e LICENSING.md |
| Misure e gate | PERFORMANCE.md, performance/0.6.0-journeys.json e VERIFICATION.md; condizioni e limiti dichiarati |
| Prompt pronto | OFFICE_START.txt; da incollare nella chat dell’ufficio |

La cartella esterna contiene bundleGit, archivio dei sorgenti e checksum generati dalla revisione di consegna. ZIP/bundle/DELIVERY originali e reference ignorata restano intatti. Le vecchie copie dist in `/private/tmp` e l’anteprima4182 sono locali a questo Mac: non necessari per ricostruire il progetto e non garantiti dopo chiusura/reboot.

## Avvio sul Mac dell’ufficio

1. Terminare le scritture sul Mac di casa e attendere Dropbox completo. Evitare due sessioni scriventi sullo stesso checkout.
2. Preferire un clone separato fuori da Dropbox: `git clone https://github.com/enuzzo/upari.git ~/Developer/upari` dopo aver creato `~/Developer` e verificato che la destinazione non esista. Se si continua invece nel checkout Dropbox, la radice effettiva è la sottocartella `upari` che contiene package.json; controllare stato/branch/HEAD prima di qualunque pull. Con modifiche locali, fermarsi e preservarle; nessun reset/clean automatico.
3. Controllare `git status --short --branch`, `git log -3 --oneline`, `node --version`, `npm --version`, `uname -m`. Questa consegna è stata preparata su x86_64, Node24.11.1/npm11.6.2. Sul Mac AppleSilicon installare runtime nativo; non riutilizzare node_modules o dist sincronizzati dall’altra architettura. Con un clone fresco, `npm ci` ricrea le dipendenze dal lockfile; non copiare .env/token/dati personali.
4. Leggere AGENTS.md, HANDOFF.md, VERIFICATION.md, DOCUMENTARY.md, STATISTICAL_ATLAS.md e PERFORMANCE.md. Se disponibile il pacchetto esterno, verificare prima `shasum -a 256 -c SHA256SUMS` nella sua cartella e `shasum -a 256 -c /percorso/SOURCE_INPUTS.sha256` dalla radice dei sorgenti. Non confondere checkout aggiornato successivamente con la revisione congelata.
5. Eseguire `npm run check`, `npm run test`, `python3 scripts/test-package-statistics.py`, `python3 scripts/test-fetch-renewables.py`, `npm run build`. Il test HTTP usa soltanto loopback; in un sandbox con EPERM richiedere l’esecuzione autorizzata, non indebolire il test. Warning di dimensione Cesium noto; non è un errore di build.
6. Avviare `npm run preview -- --port 4182`. Controllare prima le porte disponibili; quella preview serve il dist locale. `?perf=1` è diagnostica facoltativa, pagina normale senza observer/HUD. La vecchia URL127.0.0.1 di casa non punta al Mac dell’ufficio.
7. Per il telefono sulla stessa Wi-Fi dell’ufficio: `npm run preview -- --host 0.0.0.0 --port 4182`, quindi URL con IP LAN del Mac. Esposizione limitata alla rete locale; annotare indirizzo/porta e fermare il server al termine. Non è un deploy pubblico. Per PWA/AR/sensori predisporre HTTPS affidabile sul dispositivo: LAN HTTP non basta per certificarli.

I dati IndexedDB/localStorage sono legati a browser e origin, **non viaggiano con Git o Dropbox**. Per portarli, l’utente esporta il backup dalla UI e lo importa nel nuovo origin. Un dataset statistico personalizzato va esportato separatamente come JSON completo. Conservare il vecchio browser e il suo origin; non cancellare cache o preferenze per risolvere problemi senza prima verificare la causa.

## Prove da fare, in ordine

| Priorità | Prova e criterio |
|---|---|
|1 — Mac ufficio | Browser reale/nativo: qualità Alta, nitidezza, zoom/rotazione, tre percorsi, pause/drag/timeline/fonti/reload e salvaschermo. Misurare almeno10minuti, viewport/DPR/framebuffer, fps/p95 e condizioni; conservare qualità. Non confrontare campioni di Mac/browser/DPR diversi come causa-effetto |
|2 — iPhone17Pro | Confermare Wi-Fi comune nell’ufficio. Portrait e due landscape, tap/drag/zoom, capitoli/fonti/timeline, rientro da background; dieci minuti di stabilità/fps/consumo. Il rendering390×844 automatizzato non è questa prova |
|3 — PWA e permessi | HTTPS, installazione, aggiornamento tra versioni, riapertura realmente offline, sensori/camera e permessi negati/revoca. Provare separatamente; shell offline non equivale a scaricare il pianeta |
|4 — Canali/vettori | Test ntfy/HA/Gotify/webhook solo con endpoint e richiesta esplicita; OSCARv2 con accesso reale. Non inviare prove dal solo consenso al push |

Baseline locale documentata:120frame,26,59fpsdesktopDPR2 e49,34fpsportraitDPR1. Campioni brevi, senza misuraGPU né60fps sostenuti/UHD certificati. Nessuna attribuzione del limite aDropbox o al sistema senza prova. Riduzione movimento/background coperti dai test e revisione; OS e telefono fisico ancora da provare.

## Idee in coda

UNICEF infanzia/salute (selezionare indicatore, disaggregazioni, intervalli e note); UNdata (definizioni e licenza per dataset); UNWPP diretto (token, storia separata dalle proiezioni); relazioni bilaterali ulteriori/commercio/mobilità; clima; confini storici; OSCARv2 operativo. Sono fonti/idee ricercate, non funzioni o dati acquisiti. Preferire prima le prove fisiche e la profilazione; aggiungere nuove serie soltanto con fonte, unità, anni, metodo, licenza e assenze espliciti.

## Recupero e rollback

Se GitHub non fosse accessibile, verificare SHA256SUMS, poi `git clone /percorso/upari-office.bundle /nuovo/percorso/upari`; la directory di destinazione deve essere nuova. Impostare poi il remote GitHub, senza tentare push verso il file bundle. Per confrontare/recuperare una revisione, usare clone/worktree isolato del commit desiderato; non riscrivere main o fare reset del checkout condiviso. Il pacchetto non contiene node_modules, .env, segreti, browser backup o referenceGPL ignorata.
