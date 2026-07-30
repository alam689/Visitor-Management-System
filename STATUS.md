# Foyer — status & next steps

_Last updated: 31 July 2026_

Frontend-only demo (React 18 + Vite + React Router, no backend). State lives in
one reducer and persists to `localStorage`. UI follows the Parket Terminal
system in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

---

## 1. Shipped

### Design system port
- `src/styles/terminal.css` is the single stylesheet: tokens → base → shell →
  component catalog → dataviz → domain. No component hardcodes a hex.
- Dark rail / light canvas shell, ticker strip, header with search + live pills.
- Light and dark themes, one `data-theme` attribute on the document root.
- Charts are hand-rolled inline SVG. No chart library.
- Verified: both themes on every route, no horizontal overflow at 1440px,
  `npm run build` clean, fresh-tab console clean.

### Data model — five collections, all scoped by `orgId`
| Collection | Key | Notable fields |
|---|---|---|
| `organizations` | `orgId` | address, contact number, email, website, contact person, visiting slot (hours + days) |
| `users` | `userId` | login ID, password, user type, employee ID |
| `hosts` | `hostId` | employee ID, photo, department, designation, concern |
| `visitors` | `visitorId` | mobile, name, email, visitor organization, visiting-card image |
| `visits` | `id` | `visitorId`, `hostId`, purpose, status, check-in / meeting / check-out stamps, badge |

`useOrgData()` is the only read path — it filters by signed-in org and joins each
visit to its visitor and host, so multi-tenancy is enforced in one place.

### Features
- **Sign-in** (§12 split-screen) with user-type gating; nav and route guard share
  one permission table (`CAN` in `src/data/constants.js`).
- **Two on-site states**: `waiting` → `meeting` → `out`, with row actions. Makes
  average wait a measured number.
- **Visitor lookup first** at both the desk and the kiosk: match on mobile or
  name prefills; a miss creates the master record on sign-in.
- **Four master screens** with search, drawer forms, image upload, and deletes
  that show a reference count before confirming.
- Visiting-slot violations flagged at check-in (warn, not block).
- Images downscaled to JPEG data URLs before storage (`src/utils/image.js`).

**Verified by walkthrough:** waiting→meeting transition, new-visitor check-in
(`VIS-1021` created), duplicate-mobile guard, kiosk mobile recognition, gating
for all three user types, route guard redirect, and tenant isolation against a
second organization.

---

## 2. Known gaps

Ordered by how much they'd bite. Nothing here is a surprise — these are the
edges of what was built, not defects found later.

### Blocking anything real

- **Authentication is theatre.** Passwords are plain text in `localStorage`,
  every credential is printed on the sign-in screen, and the permission table
  only hides UI — the whole store is readable from devtools. Needs a real
  backend with sessions and server-side authorization before it goes near a
  front desk. Everything below assumes that lands first.

### Functional gaps

- **Reports is org-wide for every user type, including Host.** The dashboard
  scopes a host to their own visitors, but `Reports` reads all org visits, so a
  host sees everyone's arrivals. CSV export is hidden for hosts, which papers
  over it. Either scope the report data the same way the dashboard does, or drop
  Reports from the host's permission set. _(`src/pages/Reports.jsx:65`)_
- **No way to create a pre-registration.** The seed produces `prereg` visits and
  the desk can admit them, but nothing in the UI creates one — the old
  `pre-register` reducer action did not survive the rewrite. Expected-visitor
  counts and the "Expected" filter therefore only ever shrink.
- **`vehicle` and `notes` are captured and never shown.** Check-in writes both to
  the visit; no screen reads them back. Needs a visit-detail drawer on the
  welcome desk (click a row) — which is also where re-print, edit and manual
  check-out belong.
- **Two settings toggles do nothing.** `Require ID scan` and `Photo capture` are
  stored and rendered but no flow consumes them. Either wire a capture step into
  check-in or remove the toggles; inert switches are worse than absent ones.
- **The kiosk's "I have a QR invite" button is inert.** It should look up a
  pre-registration by reference.

### Model and consistency

- **Policy settings are global, not per organization.** In a multi-tenant app,
  NDA / health / notification policy belongs on the organization record next to
  the visiting slot. Today both tenants share one settings object.
- **Watchlist is a hardcoded array** in `constants.js`. By the pattern of every
  other entity it should be an org-scoped master with its own screen.
- **User↔host linking is a loose `employeeId` string match.** The host dashboard
  depends on it; a typo silently shows a host zero visitors. Make it a real
  reference, or validate on save.
- **Deleting a host or visitor leaves dangling references.** Display degrades
  gracefully ("—", "Unknown visitor") and the confirm dialog shows the count, but
  there's no reassign-then-delete path.

### Robustness

- **Storage failures are silent.** `localStorage.setItem` is wrapped in an empty
  `catch`, so once visiting-card images push past the ~5MB quota, writes stop and
  the user is never told. Needs a quota check with a visible warning.
- **No tests.** Not one. The reducer, `searchVisitors`, `withinSlot` and the
  permission table are all pure functions and cheap to cover — that's the first
  test file.
- **Drawer has no focus trap.** Escape closes it and it's labelled, but focus is
  not moved in or restrained.

### Housekeeping

- ~~The root prototype is dead weight.~~ **Done.** `Foyer.html`, the loose root
  `*.jsx`, `styles.css`, `components.css`, the `screenshots/` folder of old-design
  iterations, and the `dist/` build output were deleted. `src/` is the whole app.
- `uploads/` was **kept** — it holds supplied material (a `gatekeeper-vms-complete`
  package and a pasted image), not build output. Delete it if it has served its
  purpose.
- `vite.config.js` reads `process.env.PORT` and `.claude/launch.json` sets
  `autoPort` — added because another local server holds 5173.

---

## 3. Suggested order

1. **Scope Reports for hosts** — small, and it's the one gap where the current
   behaviour contradicts the stated permission model.
2. **Visit-detail drawer** on the welcome desk — unlocks `vehicle`/`notes`,
   badge re-print, and edit/manual check-out in one screen.
3. **Pre-registration** — create + QR reference; closes the loop the seed data
   already implies.
4. **Move policy settings onto the organization record** — do it before more
   settings accumulate against the global object.
5. **Tests for the reducer and selectors** — cheap now, and everything above
   changes the reducer.
6. **Decide on ID scan / photo capture** — wire or remove.
7. **Backend + real auth** — the big one, whenever this stops being a demo.
