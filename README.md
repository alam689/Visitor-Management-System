# Foyer — Visitor Management (React frontend)

A working multi-tenant reception / visitor-management frontend: sign-in,
front-desk check-in, a tablet kiosk for self check-in, a live welcome desk,
reports, four master databases, and configurable policy.

Built with **React 18 + Vite + React Router**. No backend — state lives in a
reducer and persists to `localStorage`, so every screen reads from one source of
truth and updates immediately.

The interface follows the **Parket Terminal** design system in
[DESIGN-SYSTEM.md](DESIGN-SYSTEM.md): a dark navigation rail against a light
canvas, 13px body text, monospace figures, hairline borders instead of drop
shadows, and a single indigo accent. Light and dark are one attribute apart —
`data-theme` on the document root — and the toggle sits in the header.

## Running it

```bash
npm install
```

```bash
npm run dev
```

`npm run build` produces a static bundle in `dist/`, `npm run preview` serves it
exactly as GitHub Pages does — under the `/Visitor-Management-System/` base path.

## Deploying

Live at **https://alam689.github.io/Visitor-Management-System/**

Every push to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds and publishes `dist/` to Pages. One-time repo setup:
**Settings → Pages → Build and deployment → Source: _GitHub Actions_**.

Three things make a Vite SPA work on Pages, all in
[`vite.config.js`](vite.config.js) and [`src/main.jsx`](src/main.jsx):

- **`base`** is the repo path, so built asset URLs resolve under the subpath. The
  dev server stays at `/`; `vite preview` reports `command: "serve"` too, so it
  is caught with `isPreview` rather than being left at the root.
- **`basename={import.meta.env.BASE_URL}`** on the router, so links and the
  asset paths agree in both environments.
- **`dist/404.html`** is a copy of `index.html`, written by a small build plugin.
  Pages has no SPA rewrite — an unknown path serves `404.html`, so shipping the
  app there is what lets a deep link like `/reports` reach the router.

## Signing in

Sign-in is demo-only: user IDs and passwords are seeded records in
`localStorage` compared in plain text. Every account is listed on the sign-in
screen and fills the form when clicked.

| User ID | Password | Type | Organization |
| --- | --- | --- | --- |
| `admin` | `admin123` | Administrator | Northwind Studios |
| `reception` | `desk123` | Reception | Northwind Studios |
| `sarah` | `host123` | Host | Northwind Studios |
| `meridian` | `admin123` | Administrator | Meridian Logistics |

User type decides what exists: an administrator sees everything, reception runs
the desk plus the host and visitor masters, and a host sees only the visitors
coming to see them. The nav and the route guard read the same permission table
(`CAN` in `src/data/constants.js`), so there is one source of truth.

## Screens

| Route | What it does |
| --- | --- |
| `/` | Welcome desk — stat cards, today's visitor log with filter + search, waiting → meeting → out actions, activity timeline |
| `/check-in` | Staffed check-in: find the visitor by mobile or name, then host, purpose and agreement — ending in a printable badge |
| `/reports` | Visits by day/hour, purpose split, busiest hosts, wait and dwell averages, CSV export |
| `/masters/organizations` | Organization records — address, contact, website, contact person, visiting slot |
| `/masters/hosts` | Host master — employee ID, photo, department, designation, concern |
| `/masters/visitors` | Visitor master — mobile, email, visitor organization, visiting card, visit history |
| `/masters/users` | Sign-in accounts — user type, linked employee ID, enable/disable |
| `/settings` | Notification / security / flow policy, end-of-day bulk check-out, demo reset |
| `/kiosk` | Tablet self check-in — recognises returning visitors by mobile number |

## The data model

Five collections, all in one reducer, all scoped by `orgId`:

| Collection | Key | Holds |
| --- | --- | --- |
| `organizations` | `orgId` | Name, address, contact number, email, website, contact person, visiting slot |
| `users` | `userId` | `orgId`, login ID, password, user type, employee ID |
| `hosts` | `hostId` | `orgId`, employee ID, name, photo, department, designation, concern |
| `visitors` | `visitorId` | `orgId`, mobile, name, email, visitor organization, visiting-card image |
| `visits` | `id` | `orgId`, `visitorId`, `hostId`, purpose, status, check-in / meeting / check-out stamps, badge |

`useOrgData()` is the only way screens read data — it filters by the signed-in
organization and joins each visit to its visitor and host, so multi-tenancy is
enforced in one place instead of a filter on every query.

**A visitor is not the same thing as a visit.** The visitor master is the person;
visits are the times they came. Check-in searches the master by mobile or name
first: a match prefills everything, and a miss creates a master record so the
next visit starts from a search hit.

**On-site is two states.** A visitor is either `waiting` in the foyer or already
`in meeting` — reception marks the transition, which is what makes the average
wait time on Reports a real number rather than a guess.

Photos and visiting cards are downscaled and re-encoded to JPEG data URLs before
they are stored (`src/utils/image.js`); a raw phone photo would exhaust the
~5MB `localStorage` quota on its own.

## How it's wired

```
src/
  main.jsx              app entry — mounts the router and store
  App.jsx               shell: brand block, rail nav, ticker, header, gated routes
  store/AppStore.jsx    reducer + context, persistence, session, org-scoped selectors
  data/constants.js     purposes, statuses, user types, permission table, policy defaults
  data/seed.js          the five seeded collections + 30 days of visits
  pages/                Login, Dashboard, CheckIn, Reports, Settings, Kiosk
  pages/masters/        Organizations, Hosts, Visitors, Users (+ shared MasterShell)
  components/           Icon, Avatar, Delta, Drawer, Field, ImagePicker,
                        ConfirmModal, FoyerMark, Toggle, VisitorBadge
  utils/format.js       time/duration formatting, FMT number formatters, CSV
  utils/image.js        downscale + re-encode uploads before they hit storage
  styles/terminal.css   the whole design system — tokens + every component class
```

Master screens share one shape: `MasterShell` renders the page head, search and
panel; each screen supplies its columns and a `Drawer` form. Deletes go through
`ConfirmModal` with a count of what references the record.

`styles/terminal.css` is the single stylesheet: §2 tokens first, then the base
layer, the shell, the component catalog, and the domain pieces (badge card,
kiosk, settings rows). Components never hardcode a hex — if a value is needed,
it becomes a token. Charts are hand-rolled inline SVG coloured from those same
tokens; there is no chart library.

Two adaptations the design system leaves open (§16) are worth naming: visit
purpose is charted with a sequential ramp of the one accent rather than six
competing hues, and `--up`/`--down` keep their meaning as arrival deltas.

### Things that are actually connected

- Checking someone in at the desk **or** the kiosk adds them to the log, bumps the
  metrics, and appears in the activity feed — a visitor new to the master is
  written to it at the same moment.
- Marking a meeting as started records the real wait; check-out records the real
  dwell time. Reports averages both.
- Master edits propagate immediately: rename a host and the visitor log, the
  check-in host list and the kiosk all follow.
- Settings change behaviour: turning off the NDA and health declaration drops the
  agreement step entirely; notification toggles change the confirmation you get;
  watchlist screening blocks a matching name from checking in at either entry
  point (try `John Doe`).
- Reports recompute from the stored records for the selected range, and CSV
  export writes the visits in that range.
- The header search drives the welcome-desk log (⌘K / Ctrl-K focuses it) and the
  filter lives in the URL, so a filtered view is linkable.
- The theme toggle persists, and the rail stays dark in both themes.

## Notes

- Visit history is anchored to "today" and is rebuilt when the date rolls over.
  Master records are your data and are never rebuilt. Seeded arrivals sit between
  07:00 and 18:00, so if you open the app in the small hours those check-ins are
  technically in the future and dwell times read `0m` until the clock catches up.
- **Authentication is a demo.** Passwords are stored and compared in plain text
  in `localStorage`, every credential is printed on the sign-in screen, and the
  permission table only hides UI — it is not a security boundary. Replace all of
  it before this touches a real front desk.
- Watchlist screening is a demo string match (`src/data/constants.js`), not a
  real security integration.
- `src/` is the whole app. The original CDN/Babel prototype (`Foyer.html`, the
  loose root `*.jsx`, `styles.css`, `components.css`) has been deleted — it had
  diverged completely and kept two designs alive at once.
