# Hushållsbudget v10.1 – Bugfix‑release

**Fixar:**
- 🛠️ **Sparning återställd**: robust `scheduleSave()` + korrekt `localStorage`‑nycklar.
- 🧮 **Fördelning fungerar**: rad‑chips och per‑person status uppdateras korrekt, även när du lägger till/byter namn på personer (raderna byggs om vid behov).
- 🧷 **Säkra upp beräkningar**: skrivning till element sker bara om de finns; lagt till delsumme‑element för **Streaming** och **Fordon**.
- 📄 **Export Års‑CSV** tillagd.

**Funktioner:**
- Huvudpersoner i Inkomster (Du + betalare), egna kategorier med auto‑ikon, dölja basrader, 🔗 delning proportionellt mot lön, rad‑chips med belopp per person, per‑person sammanställning (andel %, skall kr, betalat kr, progress %, saldo kr), dashboard, CSV/PDF, dark mode, tips, gamification, PWA/offline.

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v101`).
2. Ladda upp allt till `main`.
3. Settings → Pages → Source = **GitHub Actions**.
4. URL: `https://<ditt‑användarnamn>.github.io/budget-pwa-v101/`.
