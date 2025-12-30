# Hushållsbudget v11.2.2 LTS (stabil)

**Målet:** Gör appen “som vanligt” igen och säkra att månader & lagring fungerar utan att något verkar försvinna.

**Vad ingår:**
- Full app: inkomster, fasta/rörliga/spar, delning, per‑rad betalningar, avstämning, års‑CSV, månad‑CSV, PDF, PWA/offline.
- **Globalt Budgetläge: ON (default)**, **per‑rad 🎯: OFF (default)** – tänd rad för rad enligt önskemål.
- **Robust lagring:** läsning från `budgetV112_*`, `budgetV113_*` **och** `budget_*`. Sparar **till samma källa** som hittades för månaden (ingen implicit migrering).
- **Skanna & återställ**: knapp som listar var data hittas per månad.
- Service Worker cache‑bust med versionerad cache.

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v11.2.2-lts`).
2. Lägg allt i `main`.
3. Settings → Pages → Source = **GitHub Actions**.

## Tips
- Efter deploy: **Ctrl+F5 / Cmd+Shift+R** eller unregister SW i DevTools.
