# Bridge e canali — 0.3.0

Il bridge personale usa esattamente un canale scelto con `UPARI_CHANNEL`: `ha` (predefinito), `gotify` o `webhook`. Nessun servizio viene attivato o pubblicato dallo sviluppo. Leggere README e `bridge/.env.example` per autenticazione, loopback e reverse proxy HTTPS.

| Canale | Configurazione soltanto sul server | Trasporto |
|---|---|---|
| HA | UPARI_HA_URL, UPARI_HA_TOKEN, UPARI_HA_SERVICE | API notify.mobile_app_*; filtri presenza/meteo opzionali |
| Gotify | UPARI_GOTIFY_URL, UPARI_GOTIFY_TOKEN | POST /message; X-Gotify-Key nell'header, link app negli extras |
| Webhook | UPARI_WEBHOOK_URL, UPARI_WEBHOOK_TOKEN opzionale | POST JSON v1, ID, istante/scadenza, titolo, messaggio e link |

Gli URL non contengono credenziali/query. Webhook HTTPS, eccezione loopback per test; redirect rifiutati, timeout 15 s. Presenza/meteo richiedono HA: gli altri canali rifiutano quei filtri invece di ignorarli. Il browser comunica con il bridge e mantiene solo il proprio token ristretto locale; credenziali HA/Gotify/webhook restano nell'ambiente server e fuori da backup/bundle.

Coda persistente 48 h; epoca orbitale entro 48 h; claim salvato prima dell'HTTP, così riavvio e fallimento parziale non ripetono un invio. Un crash dopo il claim può perdere il messaggio: at-most-once non significa consegna assicurata. Avvisi in ritardo oltre 60 s scartati. Solo previsioni NORAD 25544, anche se un altro satellite importato si chiama ISS.

ntfy è indipendente dal bridge. Prima del POST la web app salva uno stato incerto: timeout, risposta troncata o 5xx mantengono la traccia e bloccano ulteriori invii fino a risoluzione manuale nel canale. Solo risposte di rifiuto inequivoche consentono di ripristinare lo stato precedente. Sequenza e orario devono essere entrambi confermati. Una cancellazione incerta conserva la coda visibile.

Prove automatiche: trasporti simulati e ricevitore HTTP reale temporaneo su 127.0.0.1, persistenza, errore 503 parziale, restart, cancellazione e mancato reinvio. Non dimostrano consegna push su telefono. Mancano endpoint dell'utente e autorizzazione allo specifico messaggio di prova: non sono stati invocati.

Procedura per i propri canali, da eseguire dopo scelta/configurazione:

1. Preparare un piano breve con dati orbitali recenti e concordare il messaggio di prova.
2. Verificare ricezione e apertura del link a pagina chiusa, con telefono bloccato.
3. Annullare un avviso futuro e assicurarsi che non arrivi.
4. Riavviare il bridge dopo un invio; controllare ID e assenza di duplicati.
5. Simulare un rifiuto e una perdita della risposta; verificare lo stato incerto senza reinvio automatico.
6. Controllare scadenza e filtri HA, se configurati. Non extrapolare risultati locali alle politiche push di iOS/Android.

Fonti: https://gotify.net/docs/pushmsg, https://docs.ntfy.sh/publish/ e https://companion.home-assistant.io/docs/notifications/actionable-notifications/.
