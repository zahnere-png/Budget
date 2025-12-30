# Hushållsbudget v9.2 – egna kategorier & dölja bas

**Nyheter:**
- Lägg till **egna kategorier** under Fasta, Rörliga och Spar/Skuld.
- **Dölj valfria bas-kategorier** (👁️‑knappen) – summorna ignorerar dolda fält.
- Behåller v9.1: en (1) lön + dynamiska betalare i hushållet.
- Fortfarande PWA (manifest + service worker, offline), CSV/PDF, dashboard (diagram+progress), dark mode, tips, gamification.

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v92`).
2. Ladda upp allt till `main`.
3. Settings → Pages → Source = **GitHub Actions**.
4. URL: `https://<ditt-användarnamn>.github.io/budget-pwa-v92/`.

## Användning
- Klicka **👁️ Dölj** på en bas-kategori du inte använder.
- Klicka **+ Lägg till egen kategori** i respektive sektion och fyll namn + belopp.
- Allt sparas lokalt per **år/månad**, och summor/diagram uppdateras live.
