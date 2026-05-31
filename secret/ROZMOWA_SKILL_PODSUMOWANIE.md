# Podsumowanie rozmowy - Tworzenie Skilla dla masarz.ebra.pl

**Data:** 30 kwietnia 2026  
**Cel:** Stworzyć customowy skill do automatyzacji treści i publikacji dla aplikacji masarz.ebra.pl

---

## 📱 O Aplikacji masarz.ebra.pl

- **Typ:** Kalkulator receptur na kiełbasy, pasztety, peklowanie
- **Technologia:** Vite/React SPA, Firebase Auth, Firestore
- **Hosting:** mydevil.net (GitHub Actions FTP deployment)
- **Repozytorium:** GitHub → mydevil.net
- **Status:** Upgrade będzie zawierać datę dodania przepisów

### Model danych (Firestore)
```
recipes/{id}:
  - name: nazwa przepisu
  - category: kategoria
  - meats: [{name, percentage, val, grinding}]
  - spices: [{name, perKg, unit}]
  - tech: instrukcje
  - imageUrl: zdjęcie
  - ownerId: właściciel (ADMIN = szablon)
  - updatedAt: data modyfikacji
  - blocked/verified: status

users/{uid}:
  - email
  - plan: free/mini/midi/maxi/vip
  - isAdmin
  - favorites: []
```

### Plany użytkowników
- **Free:** 2 przepisy
- **Mini:** 10 przepisów (12 zł/rok)
- **Midi:** 20 przepisów (20 zł/rok)
- **Maxi:** 30 przepisów (30 zł/rok)
- **VIP:** 100 przepisów (60 zł/rok)

---

## 🎯 Cel Skilla: Automatyzacja Treści Social Media

### Funkcjonalność

1. **Generowanie Postów Social Media**
   - Każda platforma w innym stylu/tonie:
     - Facebook
     - Instagram
     - LinkedIn
     - X (Twitter)
   - Format: krótka informacja o nowym przepisie + opis + CTA (link do kalkulatora)

2. **Scenariusze Filmów YouTube**
   - Co 15 postów → 1 scenariusz filmiku
   - Długość: ~5 minut
   - Format: **Pełny script** (ze słowami do mówienia)

3. **Harmonogram Publikacji**
   - Skill **proponuje** publikacje
   - Użytkownik **zatwierdza** przed publikacją
   - Częstotliwość: kilka razy w tygodniu

### Źródło danych
- Użytkownik **ręcznie dodaje nowe przepisy** do aplikacji
- Aplikacja będzie mieć datę dodania
- Skill pobiera dane o nowych przepisach

### Katalog danych
- **Google Drive** (abonament już wykupiony)
- Katalog będzie zawierać dane do zarządzania publikacjami

---

## 📋 Co Dalej

1. ✅ Zdefiniować dokładnie strukturę danych w Google Drive
2. ⏳ Stworzyć SKILL.md z instrukcjami
3. ⏳ Stworzyć test cases (2-3 przykłady)
4. ⏳ Uruchomić testy
5. ⏳ Zbierać feedback i iterować
6. ⏳ Zoptymalizować opis triggering skilla
7. ⏳ Zapackować skill do instalacji

---

## 🔧 Techniczne Szczegóły

- **Model:** Claude Sonnet (zmienić w Cowork Settings)
- **Dostęp:** D:\portal_ebra\masarz-claude (katalog montowany)
- **Kod:** GitHub repo (do przeanalizowania)
- **Email użytkownika:** biuro@antyramy.eu

---

## 💡 Notatki

- Aplikacja jest kompleksna (auth, payments via Stripe, PWA)
- CLAUDE.md zawiera wszystkie wymagane info dla twórcy kodu
- Skill będzie bardzo praktyczny - automatyzuje całą treść biznesu
- Każda platforma potrzebuje innego podejścia (FB bardziej szczegółowy, X krótki, LinkedIn profesjonalny)
- YT scenariusze mogą być bardzo wartościowe dla user education

---

**Status:** Gotowy do pisania skilla ✅
