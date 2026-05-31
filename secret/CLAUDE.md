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
firebase deploy --only functions         # deploy Cloud Functions
```
Firebase hosting is NOT configured (`firebase.json` only declares `firestore`) — `dist/` is deployed to mydevil hosting via GitHub Actions FTP (`.github/workflows/deploy.yml`).

Cloud Function secrets are set via `firebase functions:config:set stripe.secret_key=...` (not env vars).

## Project Overview

**Masarski Master** (EBRA Rzemiosło) is a butcher's recipe management web application built as a Vite/React SPA.

## Architecture

The app is a Vite/React SPA with:

- **Firebase Auth** — Google, Facebook, and email/password login via `firebase/auth`
- **Firestore** — real-time data sync via `onSnapshot` listeners for `recipes`, `categories`, `users`, `ads`, `settings/pricing`
- **TailwindCSS** — all styling via utility classes; no separate CSS files
- **DOMPurify** — sanitizes HTML rendered from recipe `tech` field; supports `**bold**` / `*italic*` / `- list` markdown-like syntax
- **Stripe** — payment links via `VITE_STRIPE_LINK_*` env vars; plan activation handled by `SuccessPage`
- **Image uploads** — to an external PHP endpoint at `https://www.masarz.ebra.pl/upload_image.php`

### Routing

There is no React Router. Routing is manual in `src/main.jsx`:
- `window.location.pathname === '/success'` → renders `SuccessPage` (post-Stripe redirect, activates plan in Firestore via `?plan=` query param)
- everything else → renders `App` (tab-based SPA)

### Key constants (`src/firebase.js`)
- `SUPER_ROOT = "krzysiekgodek@gmail.com"` — owner/super-admin email, hardcoded
- `MYDEVIL_URL` — image upload endpoint on mydevil hosting

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

### Plan systems (two separate, coexisting)

**Firestore plans** (`settings/pricing`): `free` / `mini` / `midi` / `maxi` / `vip` — used for recipe limits in the app. Legacy value `max` treated as alias for `maxi` (limit: 30).

**Stripe plans** (`src/stripe.js`): `mini` / `midi` / `maxi` / `vip` — used for payment links. After successful payment Stripe redirects to `/success?plan=<id>`, where `SuccessPage` writes the plan ID into `users/{uid}.plan` in Firestore.

Two Stripe checkout flows coexist:
1. **Client-side payment links** (`src/stripe.js`) — `paymentLink` URLs from `VITE_STRIPE_LINK_*` env vars; this is the active flow the UI opens.
2. **Server-side Checkout Session** — `functions/index.js` exports a callable `createCheckoutSession` (firebase-functions v4, region `europe-central2`, Node 18) that creates a subscription session using `stripe.secret_key` from functions config. Alternate flow kept alongside the payment links.

Environment variables required for Stripe payment links:
```
VITE_STRIPE_LINK_MINI=
VITE_STRIPE_LINK_MIDI=
VITE_STRIPE_LINK_MAXI=
VITE_STRIPE_LINK_VIP=
```

### Recipe calculation logic
Meat weights stored as **percentages** in Firestore (normalized from input `val` on save). When calculating: `percentage * totalTarget / 100`. Spices: `perKg * totalTarget`.

### Plan / trial system
- 21-day trial grants VIP-level access (100 recipes) — `isTrialActive` computed client-side from `createdAt`
- Plans and recipe limits:
  - `free` — 2 receptury, każdy kalkulator osobno
  - `mini` — 10 receptur, 1 wybrany kalkulator (12 zł/rok)
  - `midi` — 20 receptur, 1 wybrany kalkulator (20 zł/rok)
  - `maxi` — 30 receptur, 1 wybrany kalkulator (30 zł/rok)
  - `vip` — 100 receptur łącznie we wszystkich kalkulatorach (60 zł/rok)
  - `max` — legacy alias dla maxi (limit: 30)
- Stripe webhook: kwoty → plany: 1200=mini, 2000=midi, 3000=maxi, 6000=vip
- Firestore rules enforce limits via `users/{uid}.recipeCount` counter field (integer). App must increment this field on recipe create and decrement on delete.

### Print support
`Calculator.jsx` has a hidden `print-container` div. Screen-only elements use `no-print` class; activated via `window.print()`.

### PWA
App is a PWA via `vite-plugin-pwa` (`autoUpdate` mode). Firebase Auth and Firestore URLs use `NetworkFirst`; the image upload endpoint (`masarz.ebra.pl`) is `NetworkOnly`. PWA icons must exist at `public/icons/icon-192.png` and `public/icons/icon-512.png`.

### Firestore rules
`firestore.rules` uses `europe-central2` region. The `isAdmin()` function in rules is **hardcoded to `krzysiekgodek@gmail.com`** — it does NOT check the `isAdmin` field in Firestore. Both the rules-level admin check and the app-level `SUPER_ROOT` constant must be updated together if the owner email changes.
