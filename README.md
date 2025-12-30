# Hushållsbudget v12.1 (felfri)

**Åtgärdat & förbättrat:**
- **Basrader återställda**: försäkringar, streaming och fordon tillbaka enligt den gamla full‑uppsättningen.
- **Knappar per rad**: 🎯/👁️/🔗/💳 funkar robust via event‑delegation – även efter DOM‑uppdateringar och för nya rader.
- **Ta bort egna rader**: varje egen rad har 🗑️ och kan tas bort direkt.
- **Nattläge**: stabilt (🌙/☀️), sparas i `localStorage` och appliceras globalt.
- **Focus‑clear**: Namn/Lön samt egna fält rensar placeholder vid fokus.
- **Bakåtkompatibel månadsläsning**: läser från `budget_*`, `budgetV113_*`, `budgetV112_*`.
- **Budget default**: Globalt ON, per‑rad OFF (tänd rad för rad).
- **PWA/offline**: ny versionerad SW‑cache.

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v12.1`).
2. Lägg allt i `main`.
3. Settings → Pages → Source = **GitHub Actions**.

## Tips
- Efter deploy: **Ctrl+F5 / Cmd+Shift+R** eller unregister SW om du ser gammal cache.
