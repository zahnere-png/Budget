# Hushållsbudget v12 – Stabil & uppfräschad

**Fixar & nyheter:**
- **Symboler/ikoner:** emojis laddas stabilt via font‑stack; HTML är UTF‑8.
- **Nattläge:** robust växling (🌙/☀️), sparas i `localStorage` och appliceras på hela appen.
- **Egna rader per sektion:** knappar för + Egen *fast* / *rörlig* / *spar/skuld* kategori; sparas & laddas.
- **Focus‑clear:** fält för **Namn**, **Lön** (och egendef. radnamn/belopp) rensar placeholder när du trycker i fältet.
- **Budget‑default:** Globalt 🎯 = **ON**, 🎯 per rad = **OFF** (tänd rad för rad).
- **Bakåtkompatibel läsning av månader** från `budget_*`, `budgetV113_*`, `budgetV112_*`.
- **PWA/offline** med cache‑bustad service worker.

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v12`).
2. Lägg upp allt i `main`.
3. Settings → Pages → Source = **GitHub Actions**.

## Tips
- Efter deploy: **Ctrl+F5 / Cmd+Shift+R** (eller unregister service worker) om du ser gammal cache.
