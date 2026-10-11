# Prompt per continuare Upari

Copia questo testo nella sessione Codex aperta sulla directory estratta `upari`:

> Continua Upari 0.2 esistente. Prima leggi `AGENTS.md`, `docs/HANDOFF.md`, `docs/VERIFICATION.md`, `docs/UIUX_PASS_02.md` e `docs/SCREENSAVER.md`. Mantieni nero e turchese e la nuova gerarchia: Terra a viewport disponibile, pannelli su richiesta, ISS opzionale inizialmente spenta, nessun box AR permanente. La pagina salvaschermo autonoma conserva la vista, ruota il mondo e offre ora/meteo opzionale. Inizia dalla verifica reale delle due pagine nel browser, a 390×844 e su desktop/DPR 2, poi correggi gli errori osservati. Mantieni il lavoro e completa le priorità documentate. Non presentare test unitari come prove visuali, AR o notifiche reali. L'utente ha rinviato il deploy: non pubblicare finché non lo richiede. Usa commit piccoli e aggiorna i documenti di stato. Comunica in italiano e prosegui autonomamente dove hai già le informazioni necessarie.

## Avvio — ✈️ STE100

1. Estrai `Upari_v0.2_codex_handoff.zip`.
2. Apri la directory `upari` in Codex.
3. Incolla il prompt qui sopra.

La build inclusa si avvia con `npm ci` e `npm run preview`. Per ricostruirla, esegui `npm run build`.

Per recuperare la storia Git in una directory separata, esegui `git clone upari-history.bundle ../upari-git`. Il clone contiene i sorgenti; la directory `dist` è inclusa nello ZIP e può essere ricostruita. `DELIVERY.json` indica il commit consegnato.
