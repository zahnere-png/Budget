# Hushållsbudget v12.3 (betalning fix)

**Detta är en minimal uppdatering av v12.2:**
- Endast **💳 betalningsknappen per rad** är åtgärdad (öppnar en payments‑drawer, lagrar per rad+månad i `ROWPAID_KEY`).
- Övrigt (månader, dashboard, delning m.m.) är oförändrat från v12.2.

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v12.3`).
2. Lägg upp allt i `main`.
3. Settings → Pages → Source = **GitHub Actions**.

## Noter
- Service Worker är versionerad `v12.3` för cache‑bust.
- Liten klass `label.paid` sätts när en rad markerats som betald.
