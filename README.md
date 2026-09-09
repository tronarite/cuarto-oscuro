# Cuarto Oscuro

A minimalist, self-hosted photo gallery for showcasing personal photography by
trip or theme — built as a "museum walkthrough": scroll through a gallery and
let the photos do the talking, with real EXIF data, watermark protection, and
three privacy levels per gallery.

This is a portfolio/demo build. The screenshots and example content below use
generic placeholder text and a single non-identifying travel gallery — no
personal information is included.

## Screenshots

**Home page** — editable title/subtitle, public visit count, a slowly
scrolling rail of featured photos, and the gallery list.

![Home page](docs/screenshots/home.jpg)

**Gallery view** — a deterministic masonry mosaic (large/medium/small slots
per a chosen template), captions, and real EXIF specs per photo.

![Gallery view](docs/screenshots/gallery.jpg)

**Dark mode** — every page adapts, remembered per browser.

![Gallery view in dark mode](docs/screenshots/gallery-dark.jpg)

**Photo viewer** — opens a photo full-size with pinch/wheel zoom and pan,
previous/next navigation (arrows, keyboard, swipe), a toggle to fill the
whole screen (cropping instead of letterboxing), and copy-pasteable
caption text. Controls fade out on their own after a moment of
inactivity and reappear on movement, like a video player.

![Photo lightbox](docs/screenshots/lightbox.jpg)

**Admin editor** — drag photos to reorder (or pin one in place), pick a
privacy level and a grid template, mark up to 3 photos to feature on the
home page. The preview mirrors the public page exactly, watermark
included.

![Admin gallery editor](docs/screenshots/admin-editor.jpg)

**Settings** — grouped into Content / Appearance / Photos / Account with
quick-jump navigation, since the list has grown long: site title/subtitle,
the 4 color packs, a two-axis watermark (overlay layer or baked into the
file, in a repeated/full/corner style) with a one-click reprocess for
already-uploaded photos, optional AI auto-captioning, and changing the
admin password.

![Admin settings, part 1](docs/screenshots/settings.jpg)
![Admin settings, part 2 — watermark](docs/screenshots/settings-2.jpg)

## Features

- **Galleries with three privacy levels**: public (listed on the home page),
  unlisted (reachable only by direct link), or password-protected
  (bcrypt-hashed, session unlocked per gallery for 7 days).
- **Deterministic masonry layout** — four selectable grid templates (mixed,
  large, compact, balanced) that render identically in the admin preview and
  the public page, computed client-side by real photo aspect ratio. Photos
  are never cropped, anywhere.
- **Photo viewer** with previous/next navigation via on-screen arrows,
  keyboard (← →, Esc), and touch swipe, plus a position counter ("3 / 24"),
  wheel/double-click zoom with pan, and a toggle to fill the whole screen
  (crops instead of letterboxing). Caption text is selectable/copyable.
  Controls auto-hide after a moment of inactivity and reappear on the
  slightest movement, like a video player — only the caption reappears on
  its own when you move to a new photo, so switching photos with the
  controls hidden doesn't flash the whole UI back in.
- **Presentation mode** — a fullscreen, auto-advancing slideshow for a
  gallery, sharing the same full-bleed layout, zoom-to-fill toggle, and
  auto-hiding controls as the regular viewer.
- **Optional AI auto-captioning (beta)** — new uploads can be sent to
  Google Gemini for a short, natural-language caption; a one-click action
  can (re)caption every already-uploaded photo too, without ever
  overwriting a caption you wrote by hand. Fully optional — with no API
  key configured, it silently does nothing and uploads work exactly as
  before.
- **Drag-and-drop photo reordering**, including a "pin" that locks a photo to
  a fixed position even if others around it are deleted or reordered.
- **Home page featured rail** — up to 3 photos per gallery can be marked to
  appear in a slowly scrolling rail on the home page (vertical on desktop,
  horizontal on mobile). Draggable by hand (touch) or by mouse wheel (PC);
  resumes auto-scroll after you let go.
- **Drag-and-drop gallery reordering** on the home page, from the admin
  dashboard.
- **Gallery suggestions** — two random public galleries (with a cover photo)
  shown at the end of every gallery, and on the 404 page, so a broken link
  never dead-ends.
- **4 color packs, admin-picked** — Warm, Cool, Contrast and Soft, all
  black-and-white (no color hues), each with its own light and dark variant;
  applies site-wide. A single fixed dusty-pink accent color sits on top,
  independent of the pack, for subtle hover/interactive touches.
- **Toggleable "About me" page** — enable or disable it from Settings; when
  off, both the home page link and the page itself (404 for everyone except
  the logged-in admin) disappear.
- **Public, site-wide visit counter** on the home page, always rendered
  fresh (no stale count from a production build's static cache).
- **EXIF extraction on upload** (camera, lens, aperture, shutter speed, ISO,
  focal length, GPS, capture date) shown as a caption line per photo.
- **Configurable watermark**, two independent axes: **method** — an overlay
  layer drawn on top when the photo is displayed (the served file is never
  touched) or baked into the file's pixels when it's processed — and
  **style** — a repeated diagonal pattern, one large centered mark, or a
  small mark in a chosen corner. A one-click "reprocess all photos" applies
  a new method/style/quality retroactively to what's already uploaded.
- **Admin dashboard** — the gallery list can be sorted by upload date,
  alphabetically, or by visit count to find one quickly, without disturbing
  the drag-and-drop order that actually controls the home page (that one
  stays under a separate "custom" view). Settings are grouped into
  Content / Appearance / Photos / Account with quick-jump navigation.
- **Duplicate-upload protection** via a SHA-256 content hash per gallery.
- **First-run admin setup** — no password baked into an environment variable;
  the first visit to `/admin` prompts you to create one, hashed with bcrypt.
- **Session auth without a third-party library** — HMAC-SHA256 signed,
  httpOnly cookies via the Web Crypto API, for both the admin session and
  per-gallery password unlocks.
- **Responsive**, including a mobile-specific home page layout and a
  touch-friendly admin (auto-scroll while dragging near the screen edge).
- **Dynamic tab title** — always the site's real title (set in Settings), on
  every page, plus a custom favicon that doubles as a small home-link logo
  in the site's own header/portada.
- **Rich link previews** (Open Graph/Twitter card) when a gallery or the
  home page is shared — title, a truncated description, and a cover
  photo, resolved against a real public URL even without `SITE_URL`
  explicitly configured (falls back to the request's own host).
  Password-protected galleries never leak their photo or description to
  link-preview crawlers.
- **Scroll performance** for long galleries — incremental mounting as you
  scroll, plus `content-visibility` on grid tiles so the browser skips
  layout/paint work for photos far from view.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack, Server Actions)
- [React 19](https://react.dev)
- [Prisma 7](https://www.prisma.io) + SQLite (via `better-sqlite3` driver
  adapter)
- [Google Gemini](https://ai.google.dev) (`@google/genai`), optional, for
  auto-captioning
- [Tailwind CSS 4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/) for scroll-reveal animation
- [sharp](https://sharp.pixelplumbing.com) for resizing/watermarking
- [exifr](https://github.com/MikeKovarik/exifr) for EXIF/GPS extraction
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for password hashing

No auth library, no image CDN, no required external services (Gemini for
auto-captioning is the one optional exception, off by default) — it's
designed to be self-hosted on a single small machine (a homelab box, a
Raspberry Pi, a cheap VPS) with photos stored on local disk.

## Getting started

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- `DATABASE_URL` — defaults to a local SQLite file, fine as-is.
- `SESSION_SECRET` — generate one with:
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
- `ALLOWED_DEV_ORIGIN` — optional, only needed to open the dev server from
  another device on your local network (e.g. testing on your phone).
- `SITE_URL` — your public URL in production (e.g. `https://example.com`),
  used to build absolute image URLs for rich link previews. Optional: if
  unset, it's deduced from the incoming request's own host instead.
- `GEMINI_API_KEY` — optional, only needed for the auto-captioning beta
  feature (Settings → Photos). Free, no card required, from
  [Google AI Studio](https://aistudio.google.com/apikey). Leave unset and
  that toggle simply does nothing.

Set up the database:

```bash
npx prisma migrate deploy
npx prisma generate
```

Run it:

```bash
npm run dev
```

Open `http://localhost:3000/admin` — the first visit prompts you to create
the admin password. From there, create a gallery and upload photos.

## Project structure

```
src/
  app/
    page.tsx                 Home page (title/subtitle, featured rail, gallery list)
    galeria/[slug]/           Public gallery page + password unlock
    sobre-mi/                 "About me" page
    admin/                     Admin dashboard, gallery editor, settings, first-run setup
    api/img/                   Watermarked image serving (display/thumb variants)
  components/                 GalleryView, MasonryGrid, FeaturedRail, PresentationMode, admin editors…
  lib/                        Session signing, gallery access, EXIF, watermarking, photo ordering…
prisma/
  schema.prisma               Gallery, Photo, Settings models
  migrations/                 Hand-written, reviewed SQL migrations
```

## License

Personal/portfolio project, shared as-is for reference. No license file is
included — ask before reusing substantial parts commercially.
