# Hushållsbudget v11.2 (full, restored) – Budgetläge & 🎯 per rad (robust)

**Vad ingår:**
- Full app: inkomster, fasta/rörliga/spar, delning, per‑rad betalningar, avstämning, års‑CSV, månad‑CSV, PDF, PWA/offline.
- **Globalt Budgetläge ON/OFF** (default: OFF, som v11.2).
- **🎯 Budgetknapp per rad** (default: ON per rad, som v11.2), robust med **event‑delegation** – fungerar även för nya/återladdade rader.
- Service Worker **cache‑bust** (ny cache‑version) för att undvika att gammal cache visas.

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v11.2-full-restored`).
2. Lägg in alla filer i `main`.
3. Settings → Pages → Source = **GitHub Actions**.
4. URL: `https://<ditt‑användarnamn>.github.io/budget-pwa-v11.2-full-restored/`.

## Tips
- Om du ser ”gammal” sida: kör **hard refresh** eller unregister service worker i DevTools.
