# Hushållsbudget v11.2.1 (hotfix) – Månadsfix

**Fixar:**
- Enhetlig månadsnyckel: `budget_<år>-<månad>` (neutral, oberoende av version).
- **Automatisk migrering** från v11.2 (`budgetV112_…`) och v11.3 (`budgetV113_…`).
- Knappar för migrering av hela året.
- Event‑delegation för radknappar (🎯/👁️/🔗/💳) bibehållen.
- Service Worker cache‑bust.

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v11.2.1-hotfix`).
2. Lägg allt i `main`.
3. Settings → Pages → Source = **GitHub Actions**.

## Tips
- Efter deploy: **Ctrl+F5 / Cmd+Shift+R** eller unregister SW i DevTools.
