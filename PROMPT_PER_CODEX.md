# Prompt per continuare Upari

Copia questo testo nella sessione Codex aperta sulla directory estratta `upari`:

> Continua il progetto Upari esistente. Prima leggi `AGENTS.md`, `docs/HANDOFF.md`, `docs/VERIFICATION.md` e `docs/DESIGN.md`. La direzione approvata è nero e turchese, come `docs/concept-upari-notte.png`; non riaprire la selezione dei concept. Il progetto contiene già PWA, globo NASA, previsioni ISS, guida del cielo e adattatori per gli avvisi. Inizia dalla verifica reale della build nel browser a 390×844 e su desktop, quindi correggi gli errori osservati. Mantieni il lavoro esistente e completa le priorità indicate nel passaggio. Non presentare test unitari come prove di AR o notifiche reali. Usa commit piccoli e aggiorna i documenti di stato. Comunica in italiano e prosegui autonomamente dove hai già le informazioni necessarie.

## Avvio — ✈️ STE100

1. Estrai `Upari_codex_handoff.zip`.
2. Apri la directory `upari` in Codex.
3. Incolla il prompt qui sopra.

La build inclusa si avvia con `npm ci` e `npm run preview`. Per ricostruirla, esegui `npm run build`.

Per recuperare la storia Git in una directory separata, esegui `git clone upari-history.bundle ../upari-git`. Il clone contiene i sorgenti; la directory `dist` è inclusa nello ZIP e può essere ricostruita. `DELIVERY.json` indica il commit consegnato.
