---
name: masarz-social
description: >
  Skill do automatyzacji treści social media dla aplikacji masarz.ebra.pl (kalkulator receptur wędliniarskich).
  Użyj tego skilla zawsze gdy użytkownik chce: wygenerować post na Facebooka, Instagrama, LinkedIn lub X/Twittera
  o nowym przepisie wędliniarskim; napisać scenariusz filmiku YouTube o recepturach; zaplanować harmonogram
  publikacji; sprawdzić co już zostało opublikowane; oznaczyć przepis jako opublikowany.
  Triggery: "napisz post", "wygeneruj treść", "social media", "Facebook", "Instagram", "LinkedIn", "Twitter",
  "YouTube", "scenariusz", "harmonogram publikacji", "co już opublikowałem", "nowy przepis do publikacji".
compatibility:
  tools:
    - Google Drive MCP (mcp__*__search_files, create_file, read_file_content)
---

# Skill: Automatyzacja Social Media — masarz.ebra.pl

Skill pomaga automatyzować marketing aplikacji masarz.ebra.pl — kalkulatora receptur dla masarzy
(kiełbasy, pasztety, wędzonki, peklowanie). Każdy nowy przepis dodany do aplikacji to okazja do
contentu na wielu platformach jednocześnie.

## Kontekst biznesowy

**Aplikacja:** masarz.ebra.pl — kalkulator receptur wędliniarskich  
**Odbiorcy:** Masarze, wędliniarze, hobbyści domowego wyrobu wędlin  
**Ton marki:** Ekspercki ale przystępny, pasjonacki, rzemieślniczy, autentyczny  
**CTA:** Zawsze kieruj do aplikacji: https://masarz.ebra.pl

**Google Drive — folder projektu:**
- Folder `Ebra` ID: `1kvfu13ycJrwaWCS-hE2OxfJl68Osqwc_`
- Folder `Masarz` ID: `16I4n333L5G7UysrtqexabIRJV6jS2wth`
- Plik harmonogramu: `harmonogram_publikacji.json` (szukaj w folderze Masarz)

---

## Krok 1: Zbierz dane o przepisie

Zanim cokolwiek wygenerujesz, zapytaj użytkownika o dane przepisu jeśli ich nie podał:

- **Nazwa przepisu** (np. "Kiełbasa śląska tradycyjna")
- **Kategoria** (kiełbasy / pasztety / wędzonki / peklowanie / inne)
- **Główne składniki** — 2-4 najważniejsze mięsa i przyprawy
- **Co wyróżnia ten przepis?** (tradycyjna technika, czas wędzenia, skład, region, itp.)
- **Zdjęcie?** — czy przepis ma zdjęcie w aplikacji (tak/nie)

Jeśli użytkownik podał przepis wcześniej w rozmowie, wyodrębnij dane z kontekstu — nie pytaj ponownie.

---

## Krok 2: Sprawdź harmonogram na Drive

Przed generowaniem treści zawsze sprawdź plik harmonogramu:

```
Szukaj pliku "harmonogram_publikacji.json" w folderze Masarz (ID: 16I4n333L5G7UysrtqexabIRJV6jS2wth)
```

Jeśli plik nie istnieje — stwórz go ze strukturą opisaną w sekcji "Format harmonogramu" poniżej.

Z harmonogramu ustal:
- Ile przepisów zostało już opublikowanych (`total_published`)
- Czy aktualny przepis był już publikowany (szukaj po nazwie)
- Czy zbliża się próg co 15 postów → czas na scenariusz YouTube

---

## Krok 3: Generuj treści

### Facebook

Długość: 150-300 słów. Styl: ciepły, ekspercki, opowiadający historię.

Struktura:
```
[Chwytliwe otwarcie — pytanie lub fakt o wędliniarstwie]

[2-3 zdania o przepisie — co go wyróżnia, z czego się składa]

[Krótki fragment "sekret mistrza" — jedna techniczna wskazówka]

[CTA] 👉 Pełna receptura z kalkulatorem proporcji czeka na Ciebie w aplikacji Masarski Master!
🔗 masarz.ebra.pl

#masarstwo #wędliniarstwo #[kategoria] #receptury #domowewędliny
```

Użyj 3-5 emoji rozmieszczonych naturalnie w tekście (nie na każdej linii).

### Instagram

Długość: 80-150 słów + hashtagi. Styl: wizualny, inspiracyjny, bardziej emocjonalny.

Struktura:
```
[Mocne otwarcie — 1 zdanie, maksymalnie atrakcyjne]

[2-3 zdania o przepisie, skup się na zmysłach: smak, zapach, wygląd]

[CTA] Link w bio → masarz.ebra.pl 🔗

.
.
.
#masarstwo #wędliniarstwo #[kategoria] #polskiewędliny #domowymecz #receptury
#kiełbasa #wędzonka #masarstwotradycyjne #[dodaj 3-4 specyficzne dla przepisu]
```

Hashtagi: 10-15 sztuk, mix popularnych i niszowych.

### LinkedIn

Długość: 100-200 słów. Styl: profesjonalny, branżowy, wartościowy.

Struktura:
```
[Ciekawostka branżowa lub wyzwanie zawodowe masarza]

[Krótki opis przepisu jako przykładu rzemiosła / wiedzy]

[Jak technologia pomaga — nawiązanie do aplikacji jako narzędzia profesjonalisty]

[CTA] Kalkulator receptur Masarski Master: masarz.ebra.pl

#masarstwo #przemysłspożywczy #rzemiosło #technologiaspożywcza #receptury
```

Bez emoji lub max 1-2. Ton ekspercki, jak wpis branżowy.

### X / Twitter

Długość: max 280 znaków. Styl: zwięzły, intrygujący, z charakterem.

Format:
```
[1 mocne zdanie o przepisie — maks. intrygujące]

📌 [Nazwa przepisu] już w Masarski Master
👉 masarz.ebra.pl

#masarstwo #wędliny
```

Policz znaki przed finalizacją — musi zmieścić się w 280.

---

## Krok 4: Scenariusz YouTube (co 15 przepisów)

Sprawdź czy `total_published` (po dodaniu aktualnego) jest wielokrotnością 15.  
Jeśli tak — zaproponuj scenariusz filmiku.

### Format scenariusza (~5 minut, ok. 700-800 słów do mówienia)

```markdown
# 🎬 TYTUŁ FILMIKU: [przyciągający, konkretny]

## Opis YouTube (do wklejenia pod film):
[2-3 zdania opisu + link + hashtagi]

---

## SCENARIUSZ:

**[INTRO — 0:00-0:30]**
[Słowa do powiedzenia wprost do kamery. Przedstawienie tematu, zahaczka.]

**[CZĘŚĆ 1 — 0:30-1:30]**
[Temat główny — np. historia przepisu, skąd pochodzi, co go wyróżnia]
[Słowa: ...]

**[CZĘŚĆ 2 — 1:30-3:00]**
[Pokazanie przepisu / kalkulatora w aplikacji — co widz zobaczy na ekranie]
[Słowa: ...]

**[CZĘŚĆ 3 — 3:00-4:30]**
[Praktyczne wskazówki — technika, błędy do uniknięcia]
[Słowa: ...]

**[OUTRO — 4:30-5:00]**
[CTA: subskrypcja, link do aplikacji, zapowiedź następnego filmiku]
[Słowa: ...]

---

## Wskazówki produkcyjne:
- Nagrywaj w [miejsce: kuchnia/warsztat masarski]
- Pokaż ekran aplikacji w Części 2
- Thumbnail: [sugestia co pokazać na okładce]
```

---

## Krok 5: Aktualizuj harmonogram

Po wygenerowaniu treści zapytaj użytkownika czy chce oznaczyć przepis jako "w kolejce" lub "opublikowany".

Zaktualizuj `harmonogram_publikacji.json` na Google Drive:

```json
{
  "ostatnia_aktualizacja": "YYYY-MM-DD",
  "total_published": 0,
  "przepisy": [
    {
      "nazwa": "Kiełbasa śląska tradycyjna",
      "kategoria": "kiełbasy",
      "data_dodania_do_app": "YYYY-MM-DD",
      "status": "w_kolejce",
      "data_publikacji": null,
      "platformy_opublikowane": [],
      "notatki": ""
    }
  ]
}
```

**Statusy:** `w_kolejce` → `opublikowany` → (opcjonalnie) `archiwum`

Przy aktualizacji "opublikowany": ustaw `data_publikacji` na dzisiaj i dodaj platformy do `platformy_opublikowane`.

---

## Format harmonogramu (inicjalizacja)

Jeśli plik harmonogramu nie istnieje, stwórz go w folderze Masarz z taką strukturą:

```json
{
  "projekt": "masarz.ebra.pl",
  "opis": "Harmonogram publikacji social media dla aplikacji Masarski Master",
  "ostatnia_aktualizacja": "YYYY-MM-DD",
  "total_published": 0,
  "youtube_scenariusz_co": 15,
  "youtube_ostatni_po_publikacji_nr": 0,
  "przepisy": []
}
```

---

## Wskazówki stylistyczne marki

- **Nie pisz** jak korporacja — pisz jak pasjonat rzemiosła
- **Używaj** polskich nazw wędlin (nie "sausage", "ham" — chyba że wpis jest po angielsku)
- **Unikaj** nadmiernego chwalenia się — zamiast "najlepsza kiełbasa świata" → "kiełbasa według sprawdzonej receptury"
- **Nawiązuj** do tradycji, regionów Polski, sezonowości gdy to pasuje
- **Liczby** działają dobrze: "2 kg łopatki", "48 godzin peklowania", "wędzenie przez 6 godzin"
- **Zadawaj pytania** do odbiorców na FB/IG — zwiększa zasięgi

---

## Przykład przepływu

**Użytkownik:** "Mam nowy przepis — Kiełbasa podhalańska z jałowcem, zrób mi posty"

**Skill powinien:**
1. Sprawdzić harmonogram na Drive → odczytać `total_published`
2. Zapytać o brakujące dane (skład, co wyróżnia, czy jest zdjęcie)
3. Wygenerować posty na 4 platformy
4. Sprawdzić czy (total_published + 1) % 15 == 0 → jeśli tak, zaproponować scenariusz YT
5. Zaproponować dodanie do harmonogramu jako "w_kolejce"
6. Zaktualizować JSON na Drive jeśli użytkownik potwierdzi
