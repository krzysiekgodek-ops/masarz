# Podsumowanie projektu EBRA — Masarski Master
*Data: 21.04.2026*

---

## 🎯 Cel projektu
Platforma kalkulatorów dla hobbystów i rzemieślników pod domeną **ebra.pl**.
Pierwszy kalkulator: **Masarski Master** (masarz.ebra.pl) — receptury mięsne z kalkulatorem składu surowcowego.

---

## 🏗️ Stack technologiczny
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Firebase (Auth + Firestore)
- **Hosting:** MyDevil.net (masarz.ebra.pl)
- **Płatności:** Stripe (Payment Links)
- **CI/CD:** GitHub Actions → FTP deploy
- **Repozytorium:** https://github.com/krzysiekgodek-ops/masarz

---

## 📁 Struktura projektu
```
D:\portal_ebra\masarz-claude\
├── src/
│   ├── App.jsx              ← root komponent
│   ├── main.jsx
│   ├── firebase.js
│   ├── stripe.js
│   ├── index.css
│   └── components/
│       ├── Header.jsx
│       ├── BottomNav.jsx
│       ├── HomeScreen.jsx   ← lista kalkulatorów
│       ├── RecipeList.jsx   ← receptury admina
│       ├── Calculator.jsx   ← kalkulator składu
│       ├── RecipeModal.jsx  ← dodawanie/edycja receptur
│       ├── AuthModal.jsx    ← logowanie
│       ├── AdminPanel.jsx   ← panel superadmina
│       ├── ClientPanel.jsx  ← panel użytkownika + Stripe
│       └── SuccessPage.jsx
├── public/
│   ├── masarz-banner.jpg
│   ├── banner_piekarz.png
│   ├── nalewki.png
│   ├── upload_image.php
│   ├── upload_pdf.php
│   └── icons/
├── .github/workflows/deploy.yml
├── firestore.rules
├── firebase.json
├── .env                     ← klucze Stripe (lokalnie)
└── CLAUDE.md
```

---

## 👥 Role użytkowników
| Rola | Uprawnienia |
|------|-------------|
| Gość | Widzi receptury admina, brak wydruku |
| Free | 3 własne receptury, zgoda na reklamy |
| Mini | 10 receptur, 10 zł/rok, wydruk |
| Midi | 20 receptur, 20 zł/rok, wydruk |
| Maxi | 30 receptur, 30 zł/rok, wydruk |
| VIP | nieograniczone, 50 zł/rok |
| Admin | pełny dostęp |
| Super Root | krzysiekgodek@gmail.com |

---

## 💳 Stripe — płatności LIVE
```
Mini → https://buy.stripe.com/eVq8wPdrd6o2cYsbocdZ603
Midi → https://buy.stripe.com/7sY28rcn9eUy5w0bocdZ600
Maxi → https://buy.stripe.com/4gM5kD3QD7s62jObocdZ601
VIP  → https://buy.stripe.com/aFa4gzfzlbIm9Mg3VKdZ602
```
**Uwaga:** Webhook Stripe (automatyczna aktywacja planu) — DO ZROBIENIA przez webhook.php na MyDevil

---

## 🔒 Bezpieczeństwo
- ✅ firestore.rules — limity planów po stronie serwera
- ✅ Upload zdjęć zabezpieczony (auth + typ + rozmiar)
- ✅ getDocs import naprawiony
- ✅ DOMPurify dla sanitizacji HTML
- ⬜ Webhook Stripe (aktywacja planu po płatności)

---

## 📱 PWA
- ✅ manifest.json skonfigurowany
- ✅ Service Worker (Vite PWA plugin)
- ✅ Działa na telefonie przez https
- ✅ Ikony 192x192 i 512x512

---

## 🚀 CI/CD — GitHub Actions
Problem z FTP server-dir — ścieżka podwaja się.
Testowane konfiguracje:
- `/usr/home/pluszek2026/domains/masarz.ebra.pl/public_html/` → podwaja ścieżkę
- `public_html/` → działa ale wgrywa też folder public/
- `/domains/masarz.ebra.pl/public_html/` → podwaja domains
- `domains/masarz.ebra.pl/public_html/` → ostatnia próba

**FTP Credentials (GitHub Secrets):**
- FTP_SERVER, FTP_USERNAME (f1039_github), FTP_PASSWORD
- VITE_STRIPE_LINK_MINI/MIDI/MAXI/VIP
- VITE_STRIPE_PUBLIC_KEY

---

## 🖥️ Panel Admina
- ✅ Dashboard ze statystykami
- ✅ Lista użytkowników + zmiana planów
- ✅ Moderacja receptur użytkowników (blokowanie)
- ✅ Zarządzanie reklamami (tytuł, baner, PDF, daty, archiwum)
- ✅ Eksport użytkowników CSV
- ❌ Cennik usunięty (ceny zarządzane przez Stripe)

---

## 📺 Kalkulatory na HomeScreen
| Kalkulator | Status | Baner |
|-----------|--------|-------|
| Masarski Master | ✅ Aktywny | masarz-banner.jpg |
| Piekarski Mistrz | 🔜 Wkrótce | banner_piekarz.png |
| Mistrz Nalewek | 🔜 Wkrótce | nalewki.png |

---

## ⬜ Do zrobienia
1. Naprawić FTP server-dir w deploy.yml
2. Webhook Stripe → webhook.php na MyDevil → aktywacja planu w Firebase
3. Dodać więcej kalkulatorów (Browarnik, Serowar, Auto Serwis)
4. Landing page ebra.pl
5. Optymalizacja rozmiaru bundle (code splitting)
6. Regulamin + Polityka prywatności (RODO)

---

## 🛠️ Narzędzia
- **Claude Code** v2.1.107 (terminal)
- **VS Code** (edytor)
- **Node.js** v24
- **Firebase CLI**
- **FileZilla** (FTP)

---

## 📞 Konta i dostępy
- GitHub: krzysiekgodek-ops
- Firebase: masarski-pro-v2
- MyDevil: pluszek2026
- Stripe: biuro@antyramy.eu
