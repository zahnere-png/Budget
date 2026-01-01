# Hushållsbudget v12.4.3 (stabil delningsinmatning)

**Nyhet:** Delningsrutan (🔗) tappar inte längre fokus när du skriver eget belopp. Vi uppdaterar `nu: X%` **utan att rendera om** hela raden, och gör full omrendering först på **blur**. 

- **Budgetläge default OFF** vid första start (du tänder själv).
- **Månad + år i header** kvar.
- All övrig funktionalitet kvar från 12.4.x (dashboard, PWA/offline, 💳 betalningslåda, års‑export m.m.).

## Publicera
1. Skapa repo (t.ex. `budget-pwa-v12.4.3`).
2. Lägg upp allt i `main`.
3. Settings → Pages → Source = **GitHub Actions**.
4. Efter deploy: **hard refresh** (Ctrl+F5 eller Cmd+Shift+R) om du ser gammal cache.
