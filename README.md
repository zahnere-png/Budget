# Hushållsbudget v12.2 (felfri + dashboard)

**Fixar:**
- **Månader**: robust laddning från `budget_*`, `budgetV113_*`, `budgetV112_*` + **dual write** (neutral + källa), säker in/ut.
- **Knappar per rad**: 🎯/👁️/🔗/💳 via event‑delegation (fungerar på alla rader, även nya, oavsett DOM‑uppdateringar).
- **Dashboard tillbaka**: toppsumma (kort), progressbar, och **pie‑diagram** med Chart.js.
- **Focus‑clear** och nattläge kvar som tidigare.
- **PWA/offline** med cache‑bust.

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v12.2`).
2. Lägg allt i `main`.
3. Settings → Pages → Source = **GitHub Actions**.

## Tips
- Efter deploy: **Ctrl+F5 / Cmd+Shift+R** eller unregister SW om du ser gammal cache.
