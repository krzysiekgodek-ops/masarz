# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev       # start Vite dev server (localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

No test suite exists in this project.

### Firebase deployment
```bash
firebase deploy --only firestore:rules   # deploy Firestore rules
firebase deploy --only firestore:indexes # deploy indexes
```
Firebase hosting is NOT configured — the built `dist/` is deployed separately to mydevil hosting.

## Project Overview

**Masarski Master** (EBRA Rzemiosło) is a butcher's recipe management web application built as a Vite/React SPA.

> `masarz.txt` in the project root is an **old backup** — do not read or modify it.

## Architecture

The app is a Vite/React SPA with:

- **Firebase Auth** — Google, Facebook, and email/password login via `firebase/auth`
- **Firestore** — real-time data sync via `onSnapshot` listeners for `recipes`, `categories`, `users`, `ads`, `settings/pricing`
- **TailwindCSS** — all styling via utility classes; no separate CSS files
- **DOMPurify** — sanitizes HTML rendered from recipe `tech` (process description) field that supports `**bold**` / `*italic*` / `- list` markdown-like syntax
- **Image uploads** — to an external PHP endpoint at `https://www.masarz.ebra.pl/upload_image.php`

## File Structure

```
src/
├── App.jsx                    # Root component — state, Firebase effects, routing logic
├── main.jsx                   # Vite entry point
├── index.css                  # Global styles (Tailwind base)
├── firebase.js                # Firebase app init, auth, db exports
└── components/
    ├── Header.jsx             # Top sticky header with logo + admin button
    ├── BottomNav.jsx          # Fixed bottom navigation (Home / Receptury / Moje / Konto)
    ├── Calculator.jsx         # Full-screen calculator overlay (wsad slider, tables, print card)
    ├── RecipeList.jsx         # Receptury tab — admin recipes list with heart/favorite buttons
    ├── RecipeModal.jsx        # Add/edit recipe modal (meats, spices, image upload)
    ├── AuthModal.jsx          # Login/register modal (Google, Facebook, email)
    ├── AdminPanel.jsx         # Superadmin panel (stats, users, banners, moderation, pricing)
    └── ClientPanel.jsx        # Konto tab — profile, subscription, purchased calculators
```

### Key constants (in `src/firebase.js` or `src/App.jsx`)
- `SUPER_ROOT = "krzysiekgodek@gmail.com"` — the owner/super-admin email, hardcoded
- `MYDEVIL_URL` — the image upload endpoint on mydevil hosting

### User roles & access
- **Guest** — can view Home, Receptury (admin recipes), limited features
- **Authenticated user** — can view/add own recipes (limited by plan), access Konto panel, add favorites
- **Admin** (`isAdmin: true` in Firestore) — can manage all recipes, access superadmin panel
- **Super Root** (email matches `SUPER_ROOT`) — can promote/demote admins, delete users

### Firestore data model
- `recipes/{id}` — `{ name, category, meats: [{name, percentage, val, grinding}], spices: [{name, perKg, unit}], tech, imageUrl, ownerId, updatedAt, blocked?, verified? }`
  - `ownerId = 'ADMIN'` — template recipe visible to all users
  - `blocked: true` — hidden from user by moderator
  - `verified: true` — marked as reviewed by admin
- `users/{uid}` — `{ email, plan, tools, isAdmin, favorites: [], createdAt }`
  - `favorites` — array of recipe IDs (admin recipes) bookmarked by the user
- `categories/{id}` — `{ name }`
- `ads/{id}` — `{ content, active, imageUrl?, pdfUrl?, linkUrl? }`
- `settings/pricing` — `{ food: { free/mini/midi/max: { name, limit, price } }, tech: {...} }`

### Navigation / tabs (bottom nav)
- `home` — calculator selector landing page (Masarski Master card + "more coming soon")
- `recipes` — admin-owned recipes (`ownerId === 'ADMIN'`), public; heart button → favorites
- `my` — user's own recipes + favorited admin recipes; "Dodaj" button respects plan limit
- `account` — profile, subscription status, purchased calculators, change password, logout
- `superadmin` — accessed via header icon (admins only); internal nav: Statystyki / Użytkownicy / Banery / Receptury (moderation) / Cennik

### Recipe calculation logic
Meat weights stored as **percentages** in Firestore (normalized from input `val` on save). When calculating: `percentage * totalTarget / 100`. Spices: `perKg * totalTarget`.

### Plan system
- 21-day trial grants max-level access (`isTrialActive` computed client-side from `createdAt`)
- Plans: `free` (2 recipes), `mini`, `midi`, `max` — limits from Firestore `settings/pricing`

### Print support
`Calculator.jsx` has a hidden `print-container` div with a formatted recipe card. Screen-only elements use `no-print` class; activated via `window.print()`.

### PWA
App is a PWA via `vite-plugin-pwa` (`autoUpdate` mode). Firebase Auth and Firestore URLs use `NetworkFirst`; the image upload endpoint (`masarz.ebra.pl`) is `NetworkOnly`. PWA icons must exist at `public/icons/icon-192.png` and `public/icons/icon-512.png`.

### Firestore rules
`firestore.rules` uses `europe-central2` region. The `isAdmin()` function in rules is **hardcoded to `krzysiekgodek@gmail.com`** — it does NOT check the `isAdmin` field in Firestore. Both the rules-level admin check and the app-level `SUPER_ROOT` constant must be updated together if the owner email changes.
