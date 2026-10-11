# Prompt per continuare Upari

Copia questo testo nella sessione Codex aperta sulla directory estratta `upari`:

> Continua Upari 0.3.0 esistente. Leggi AGENTS.md, docs/HANDOFF.md, docs/VERIFICATION.md, docs/VECTORS.md e docs/CHANNELS.md. Mantieni nero/turchese, pianeta dominante, pannelli su richiesta e ISS inizialmente spenta. Date scientifiche sempre visibili e playback con buffer Cesium limitato. Orizzonti, diario, import satelliti, SWISSIMAGE/configurazione regionale e canali aggiuntivi sono implementati; non ricominciare. Il vento distribuito è del 10 ottobre 2026, OSCAR è archivio 2014: non chiamarlo live. Completa le prove su telefono/PWA e sui canali autorizzati dall'utente. Il convertitore NetCDF è verificato; per OSCAR v2 operativo serve un file reale ottenuto dal distributore. Preserva le regressioni backup/Cesium/AR/coda ntfy e i riferimenti indipendenti. Non presentare test automatici come prova fisica o recapito reale. Nessun push/deploy fino a richiesta esplicita. Prosegui autonomamente con informazioni già disponibili; aggiorna log/stato e usa commit locali tracciabili.

## Avvio — ✈️ STE100

1. Estrai `Upari_v0.2_codex_handoff.zip`.
2. Apri la directory `upari` in Codex.
3. Incolla il prompt qui sopra.

La build inclusa si avvia con `npm ci` e `npm run preview`. Per ricostruirla, esegui `npm run build`.

Per recuperare la storia Git in una directory separata, esegui `git clone upari-history.bundle ../upari-git`. Il clone contiene i sorgenti; la directory `dist` è inclusa nello ZIP e può essere ricostruita. `DELIVERY.json` indica il commit consegnato.

`DELIVERY.json` e `upari-history.bundle` identificano lo ZIP originale 0.2.0. La revisione corrente e i controlli successivi sono nella storia Git locale e in `docs/VERIFICATION.md`.
