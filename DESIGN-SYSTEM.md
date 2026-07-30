# Parket Terminal — Design System

A dark-rail / light-canvas **trading terminal design pattern**. Extracted from the Stock Order Management Web app so it can be dropped into any new project.

Stack-agnostic: everything is plain CSS custom properties + class names. Works with React, Vue, Svelte, or server-rendered HTML.

---

## 1. Design philosophy

| Principle | What it means in practice |
|---|---|
| **Dense but calm** | 13px base body text, 9px table padding, 14px gutters. Information-rich without feeling cramped. |
| **Dark rail, light canvas** | The navigation rail is *always* dark, even in light mode. Gives the app a permanent anchor and an "instrument panel" feel. |
| **Numbers are monospace** | Every figure uses a tabular mono font so columns align optically. Text is never mono. |
| **Semantic color is reserved** | Green/red mean *up/down* only. Never use them for generic success/error styling in market contexts. |
| **Flat surfaces, hairline borders** | Elevation comes from 1px borders + very soft shadows, not from heavy drop shadows. |
| **One accent** | A single indigo accent drives focus rings, active states, and primary buttons. Nothing else competes. |
| **Theme via one attribute** | `data-theme="dark"` on the app root flips the whole system. No per-component theme logic. |

---

## 2. Design tokens

Drop this into your global stylesheet first. Everything else depends on it.

```css
:root {
  /* ---- surfaces ---- */
  --bg:         #EFF2F7;   /* app background */
  --bg-grid:    #FFFFFF;   /* header / ticker background */
  --panel:      #FFFFFF;   /* cards, tables, modals */
  --panel-2:    #F6F8FB;   /* nested/inset surfaces, table hover */
  --panel-3:    #EDF1F7;   /* chips, secondary buttons, tags */
  --hover:      #F0F4FA;
  --border:     #E4E9F1;   /* structural borders */
  --border-soft:#EDF1F7;   /* row dividers */

  /* ---- text ---- */
  --text:       #131A2A;   /* primary */
  --text-dim:   #5C6678;   /* labels, secondary */
  --text-faint: #9AA4B6;   /* placeholders, units, meta */

  /* ---- brand / accent ---- */
  --accent:      #4F6BED;
  --accent-2:    #3F58D4;  /* hover + accent text on light */
  --accent-dim:  #C3CEF6;  /* subtle borders */
  --accent-soft: rgba(79,107,237,0.10);  /* focus ring, active pill fill */

  /* ---- market semantics ---- */
  --up:      #0F9D6B;  --up-bg:   rgba(15,157,107,0.10);  --up-bar:   rgba(15,157,107,0.14);
  --down:    #E0314B;  --down-bg: rgba(224,49,75,0.09);   --down-bar: rgba(224,49,75,0.13);
  --flat:    #8A93A6;
  --warn:    #C98A06;  --warn-bg: rgba(201,138,6,0.12);
  --info:    #4F6BED;

  /* ---- dark navigation rail (dark in BOTH themes) ---- */
  --rail:        #0E1626;
  --rail-2:      #18233A;   /* rail hover */
  --rail-3:      #202D49;   /* rail chips/badges */
  --rail-border: #233048;
  --rail-text:   #EAEEF6;
  --rail-dim:    #9AA6BE;
  --rail-faint:  #67738C;
  --rail-accent: #8AA4FF;
  --rail-accent-soft: rgba(122,150,255,0.16);

  /* ---- type ---- */
  --font: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
  --mono: 'IBM Plex Mono', ui-monospace, monospace;

  /* ---- geometry ---- */
  --r-sm: 5px;
  --r:    8px;
  --r-lg: 12px;
  --sidebar-w: 232px;
  --header-h:  52px;
  --ticker-h:  30px;

  /* ---- elevation ---- */
  --shadow:      0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06);
  --shadow-sm:   0 1px 2px rgba(16,24,40,0.06);
  --shadow-pop:  0 18px 50px rgba(16,24,40,0.18);
  --card-shadow: 0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.05);
}

[data-theme="dark"] {
  --bg:         #090C12;
  --bg-grid:    #0C1019;
  --panel:      #11161F;
  --panel-2:    #161C28;
  --panel-3:    #1B2230;
  --hover:      #1E2636;
  --border:     #222B3B;
  --border-soft:#1A2230;

  --text:       #E7EBF3;
  --text-dim:   #97A1B5;
  --text-faint: #5C6678;

  --accent:      #5B8DEF;
  --accent-2:    #7AA2FF;
  --accent-dim:  #2B3F6B;
  --accent-soft: rgba(91,141,239,0.12);

  --up:      #1FC78B;  --up-bg:   rgba(31,199,139,0.13);  --up-bar:   rgba(31,199,139,0.20);
  --down:    #F6465D;  --down-bg: rgba(246,70,93,0.13);   --down-bar: rgba(246,70,93,0.18);
  --flat:    #97A1B5;
  --warn:    #F0B90B;  --warn-bg: rgba(240,185,11,0.13);
  --info:    #5B8DEF;

  /* rail dissolves into the dark canvas */
  --rail: #0C1019;  --rail-2: #161C28;  --rail-3: #1B2230;  --rail-border: #222B3B;
  --rail-text: #E7EBF3;  --rail-dim: #97A1B5;  --rail-faint: #5C6678;
  --rail-accent: #7AA2FF;  --rail-accent-soft: rgba(91,141,239,0.14);

  --shadow:      0 8px 30px rgba(0,0,0,0.45);
  --shadow-sm:   0 2px 8px rgba(0,0,0,0.4);
  --shadow-pop:  0 14px 50px rgba(0,0,0,0.6);
  --card-shadow: none;   /* dark mode uses borders only */
}
```

### Token usage rules

- **Never hardcode a hex** in a component. If you need a new value, add a token.
- `--panel` → `--panel-2` → `--panel-3` is a *nesting depth* ladder, not a lightness ladder. In dark mode they get lighter; in light mode they get darker. Use depth, not brightness, as your mental model.
- `--border` for structure (panel outlines, header underline). `--border-soft` for repetition (table rows, kv cells).
- In dark mode `--card-shadow: none` — cards are defined purely by their border. Don't reintroduce shadows there.

---

## 3. Base layer

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
#root { height: 100%; }

button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
input, select { font-family: inherit; }
a { color: inherit; text-decoration: none; }

/* thin, unobtrusive scrollbars */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(120,134,160,0.38); border-radius: 6px;
  border: 2px solid transparent; background-clip: padding-box;
}
::-webkit-scrollbar-thumb:hover { background: rgba(120,134,160,0.6); background-clip: padding-box; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(150,166,190,0.22); background-clip: padding-box; }
```

### Utility classes

These five carry most of the visual work. Learn them and you rarely need inline styles.

```css
.mono  { font-family: var(--mono); font-feature-settings: "tnum" 1; }
.num   { font-family: var(--mono); font-feature-settings: "tnum" 1; letter-spacing: -0.2px; }
.up    { color: var(--up); }
.down  { color: var(--down); }
.flat  { color: var(--flat); }
.dim   { color: var(--text-dim); }
.faint { color: var(--text-faint); }
```

---

## 4. Typography scale

| Role | Size | Weight | Family | Notes |
|---|---|---|---|---|
| Hero number (quote) | 34px | 600 | mono | `letter-spacing: -1px` |
| Stat card value | 26px | 600 | mono | `letter-spacing: -0.5px` |
| Page H1 (auth) | 23–24px | 600 | sans | `letter-spacing: -0.4px` |
| Page title | 19px | 600 | sans | `letter-spacing: -0.3px` |
| Modal title | 16px | 600 | sans | |
| Body / table cell | 13px | 400 | sans | |
| Panel heading `h3` | 13px | 600 | sans | `letter-spacing: 0.2px` |
| Button | 13px | 600 | sans | |
| Field label | 11.5–12px | 500 | sans | `--text-dim` |
| Table header | 10.5px | 600 | sans | UPPERCASE, `letter-spacing: 0.5px`, `--text-faint` |
| Eyebrow / group label | 10px | 600 | sans | UPPERCASE, `letter-spacing: 1.2px` |

**Rule:** headings tighten (negative tracking), micro-labels loosen (positive tracking + uppercase). Nothing in between gets tracking.

---

## 5. App shell

A three-row / two-column CSS grid. The rail spans the ticker + header rows so the brand block reads as part of the rail.

```
┌──────────┬──────────────────────────┐
│  brand   │  ticker  (30px)          │
│ (rail)   ├──────────────────────────┤
│          │  header  (52px)          │
├──────────┼──────────────────────────┤
│ sidebar  │  main    (scrolls)       │
│ (rail)   │                          │
└──────────┴──────────────────────────┘
   232px               1fr
```

```css
.app {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  grid-template-rows: var(--ticker-h) var(--header-h) 1fr;
  grid-template-areas:
    "brand ticker"
    "brand header"
    "side  main";
  height: 100%;
  overflow: hidden;
}
.app.collapsed { --sidebar-w: 60px; }   /* collapse by re-binding one token */

.main { grid-area: main; overflow-y: auto; overflow-x: hidden; background: var(--bg); }
.page { padding: 18px 22px 40px; max-width: 1640px; margin: 0 auto; }
.page-wide { padding: 0; max-width: none; }   /* for full-bleed screens */

@media (max-width: 1100px) {
  .app { --sidebar-w: 60px; }
  .brand-text, .nav-item .lbl, .nav-item .badge-count, .nav-group-label { display: none; }
  .brand, .nav-item { justify-content: center; }
  .brand { padding: 0; }
}
```

> **Key trick:** sidebar collapse is a *single token override* (`--sidebar-w: 60px`), not a class on every child. The responsive breakpoint reuses the exact same rule.

### Brand block

```css
.brand {
  grid-area: brand; display: flex; align-items: center; gap: 10px;
  padding: 0 18px; background: var(--rail);
  height: calc(var(--ticker-h) + var(--header-h));
}
.brand-mark {
  width: 30px; height: 30px; flex: none; border-radius: 7px;
  background: linear-gradient(135deg, var(--accent), #8a6bff);
  display: grid; place-items: center;
  box-shadow: 0 4px 14px rgba(91,141,239,0.4);
}
.brand-name { font-weight: 600; font-size: 15px; letter-spacing: -0.2px; color: var(--rail-text); }
.brand-name b { color: var(--rail-accent); font-weight: 700; }
.brand-sub { font-size: 10px; color: var(--rail-faint); letter-spacing: 1.5px; text-transform: uppercase; margin-top: -2px; }
```

The wordmark is two-tone: normal weight + accent-colored `<b>` (`Parket **Terminal**`). Sub-line is an all-caps context strip (`DSE · BDT`).

### Sidebar navigation

```css
.sidebar {
  grid-area: side; background: var(--rail);
  display: flex; flex-direction: column;
  overflow-y: auto; overflow-x: hidden; padding: 12px 12px 16px;
}
.nav-group { margin-top: 14px; }
.nav-group:first-child { margin-top: 4px; }
.nav-group-label {
  font-size: 10px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase;
  color: var(--rail-faint); padding: 6px 10px 4px;
}
.nav-item {
  display: flex; align-items: center; gap: 11px;
  padding: 9px 11px; border-radius: 9px; width: 100%;
  color: var(--rail-dim); font-size: 13px; font-weight: 500;
  position: relative; transition: background .12s, color .12s;
}
.nav-item:hover  { background: var(--rail-2); color: var(--rail-text); }
.nav-item.active { background: var(--rail-accent-soft); color: #fff; }
.nav-item.active::before {          /* flush-left accent tab */
  content: ''; position: absolute; left: -12px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 20px; border-radius: 0 3px 3px 0; background: var(--rail-accent);
}
.nav-item .badge-count {
  margin-left: auto; font-size: 10.5px; font-family: var(--mono);
  background: var(--rail-3); color: var(--rail-dim); border-radius: 20px; padding: 1px 7px;
}
.sidebar-foot { margin-top: auto; padding: 14px 11px 0; border-top: 1px solid var(--rail-border); }
```

Nav is defined as **grouped data**, never hand-written markup:

```js
const NAV = [
  { group: 'Market', items: [
    { id: 'market',    label: 'Market',     icon: 'market' },
    { id: 'watchlist', label: 'Watch List', icon: 'watchlist' },
  ]},
  { group: 'Trade', items: [
    { id: 'trade',  label: 'Trade',      icon: 'trade' },
    { id: 'orders', label: 'Order List', icon: 'orders' },
  ]},
];
```

### Ticker strip

```css
.ticker {
  grid-area: ticker; display: flex; align-items: center;
  border-bottom: 1px solid var(--border); background: var(--bg-grid);
  overflow: hidden; position: relative;
}
[data-theme="dark"] .ticker,
[data-theme="dark"] .header { background: var(--rail); }

.ticker-label {
  flex: none; display: flex; align-items: center; gap: 6px;
  padding: 0 14px; height: 100%;
  font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
  color: var(--warn); border-right: 1px solid var(--border); background: var(--warn-bg);
}
.ticker-track {
  display: flex; gap: 38px; white-space: nowrap;
  animation: marquee 48s linear infinite; padding-left: 38px;
}
.ticker:hover .ticker-track { animation-play-state: paused; }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
```

Render the item list **twice** (`[...TICKER, ...TICKER]`) so the `-50%` translate loops seamlessly. Pause on hover so items stay readable.

### Header

```css
.header {
  grid-area: header; display: flex; align-items: center; gap: 14px;
  padding: 0 18px; border-bottom: 1px solid var(--border); background: var(--bg-grid);
}
.search {
  display: flex; align-items: center; gap: 8px;
  background: var(--panel-2); border: 1px solid var(--border);
  border-radius: 9px; padding: 8px 12px; width: 340px;
  color: var(--text-faint); transition: border-color .15s, box-shadow .15s;
}
.search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.search input { background: none; border: none; outline: none; color: var(--text); flex: 1; font-size: 13px; }
.search kbd {
  font-size: 10px; font-family: var(--mono); color: var(--text-faint);
  border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px;
}
.header-spacer { flex: 1; }

.stat-pill {
  display: flex; flex-direction: column; align-items: flex-end;
  padding: 4px 14px; border-left: 1px solid var(--border-soft);
}
.stat-pill .k { font-size: 10px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.6px; }
.stat-pill .v { font-size: 15px; font-weight: 600; }

.icon-btn {
  width: 34px; height: 34px; border-radius: 8px;
  display: grid; place-items: center; color: var(--text-dim);
  transition: background .12s, color .12s;
}
.icon-btn:hover { background: var(--hover); color: var(--text); }

.user-chip {
  display: flex; align-items: center; gap: 9px;
  padding: 4px 6px 4px 4px; border-radius: 9px; transition: background .12s;
}
.user-chip:hover { background: var(--hover); }
.avatar {
  width: 32px; height: 32px; border-radius: 8px; flex: none;
  background: linear-gradient(135deg, #3a4a6b, #5b8def);
  display: grid; place-items: center; font-weight: 600; font-size: 13px; color: #fff;
}
```

Header order, left → right: **collapse toggle · search · spacer · live stat pills · notifications · settings · user chip · logout**.

---

## 6. Component catalog

### Page header

```css
.page-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.page-title { font-size: 19px; font-weight: 600; letter-spacing: -0.3px; }
.page-sub   { font-size: 12.5px; color: var(--text-dim); }
.page-head .spacer { flex: 1; }
```

Pattern: `title + subtitle` on the left, `.spacer`, then filters/actions on the right.

### Panel (the primary container)

```css
.panel {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: var(--r-lg); box-shadow: var(--card-shadow);
}
.panel-head {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-bottom: 1px solid var(--border-soft);
}
.panel-head h3 { font-size: 13px; font-weight: 600; letter-spacing: 0.2px; white-space: nowrap; }
.panel-head .spacer { flex: 1; }
.panel-body { padding: 14px 16px; }

.grid { display: grid; gap: 14px; }   /* set grid-template-columns inline per layout */
.divider { height: 1px; background: var(--border-soft); margin: 14px 0; }
.empty { text-align: center; color: var(--text-faint); padding: 40px; font-size: 13px; }
```

Tables go **directly inside `.panel`** (no `.panel-body`) so rows run edge to edge.

### Tabs & segmented control

```css
.tabs {
  display: flex; gap: 2px; background: var(--panel-2);
  border: 1px solid var(--border); border-radius: 9px; padding: 3px;
}
.tab {
  padding: 6px 15px; border-radius: 6px; font-size: 13px; font-weight: 500;
  color: var(--text-dim); transition: background .12s, color .12s; white-space: nowrap;
}
.tab:hover  { color: var(--text); }
.tab.active { background: var(--panel); color: var(--text); box-shadow: var(--shadow-sm); }

.seg { display: inline-flex; background: var(--panel-2); border: 1px solid var(--border); border-radius: 7px; padding: 2px; }
.seg button { padding: 4px 11px; border-radius: 5px; font-size: 12px; color: var(--text-dim); font-weight: 500; }
.seg button.on { background: var(--panel); color: var(--text); box-shadow: var(--shadow-sm); }
```

The active pill is a *lifted* `--panel` surface on a recessed `--panel-2` track. Same idiom at two sizes.

### Data table

```css
.dt { width: 100%; border-collapse: collapse; }
.dt thead th {
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
  color: var(--text-faint); text-align: right; padding: 9px 14px;
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; background: var(--panel); z-index: 1;
}
.dt thead th:first-child { text-align: left; }
.dt tbody td { padding: 9px 14px; text-align: right; border-bottom: 1px solid var(--border-soft); font-size: 13px; }
.dt tbody td:first-child { text-align: left; }
.dt tbody tr { transition: background .1s; cursor: pointer; }
.dt tbody tr:hover { background: var(--panel-2); }
.dt tbody tr:last-child td { border-bottom: none; }
.dt.dense thead th, .dt.dense tbody td { padding: 6px 8px; }

/* symbol / identity cell */
.sym-cell { display: flex; align-items: center; gap: 10px; }
.sym-cell .tk { font-weight: 600; font-size: 13px; }
.sym-cell .ds { font-size: 11px; color: var(--text-faint); }
.sym-tag {
  width: 30px; height: 30px; border-radius: 7px; flex: none;
  display: grid; place-items: center; font-size: 11px; font-weight: 700;
  background: var(--panel-3); color: var(--text-dim);
}
```

**Table law:** first column left-aligned (identity), every other column right-aligned (numbers), headers sticky, wrap numeric cells in `.num`.

### Badges & chips

```css
.badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 20px;
  font-family: var(--font); letter-spacing: 0.2px;
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; }
.badge.green { background: var(--up-bg);     color: var(--up); }
.badge.red   { background: var(--down-bg);   color: var(--down); }
.badge.blue  { background: var(--accent-soft); color: var(--accent-2); }
.badge.amber { background: var(--warn-bg);   color: var(--warn); }
.badge.grey  { background: var(--panel-3);   color: var(--text-dim); }

.chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; padding: 4px 10px; border-radius: 7px;
  background: var(--panel-2); border: 1px solid var(--border); color: var(--text-dim);
}
```

Give the dot `background: currentColor` so it inherits the badge tone automatically.

Map domain statuses to the five tones in **one lookup table**, not scattered conditionals:

```js
const STATUS_STYLE = {
  'Filled': 'green',  'Queued': 'green',  'OMS Accepted': 'blue',
  'Partially Filled': 'amber', 'Replaced': 'blue',
  'Cancelled': 'grey', 'Rejected': 'red',
};
```

### Buttons

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
  background: var(--panel-3); color: var(--text); border: 1px solid var(--border);
  transition: background .12s, border-color .12s, transform .05s;
}
.btn:hover  { background: var(--hover); }
.btn:active { transform: translateY(1px); }
.btn svg { width: 16px; height: 16px; }

.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-2); }
.btn-buy  { background: var(--up);   border-color: var(--up);   color: #04130d; }
.btn-sell { background: var(--down); border-color: var(--down); color: #1a0509; }
.btn-buy:hover, .btn-sell:hover { filter: brightness(1.08); }
.btn-ghost { background: transparent; }
.btn-ghost:hover { background: var(--panel-2); }
.btn-lg    { padding: 13px 18px; font-size: 14.5px; }
.btn-block { width: 100%; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
```

Buy/sell buttons use **near-black text on saturated fills** (`#04130d` / `#1a0509`) — pure white would vibrate against those greens and reds.

### Form fields

Three field densities exist. Pick by context.

```css
/* (a) compact — trading tickets, numeric entry */
.field { margin-bottom: 13px; }
.field > label { display: block; font-size: 11.5px; color: var(--text-dim); margin-bottom: 6px; font-weight: 500; }
.field > label .req { color: var(--down); }
.input-wrap {
  display: flex; align-items: center; background: var(--panel);
  border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
  transition: border-color .12s;
}
.input-wrap:focus-within { border-color: var(--accent-dim); }
.input-wrap input {
  flex: 1; background: none; border: none; outline: none; color: var(--text);
  font-family: var(--mono); font-size: 15px; font-weight: 500;
  padding: 10px 12px; width: 100%; text-align: right;
}
.input-wrap .unit { padding: 0 12px; color: var(--text-faint); font-size: 12px; }
.stepper-btn {
  width: 38px; align-self: stretch; display: grid; place-items: center;
  color: var(--text-dim); border-right: 1px solid var(--border); font-size: 18px;
}
.stepper-btn.plus { border-right: none; border-left: 1px solid var(--border); }
.stepper-btn:hover { background: var(--hover); color: var(--text); }

/* (b) standard — registration / KYC forms */
.rf > label { display: block; font-size: 12px; font-weight: 500; color: var(--text-dim); margin-bottom: 6px; }
.rf > label .req { color: var(--down); }
.rf-input {
  display: flex; align-items: center; background: var(--panel);
  border: 1.5px solid var(--border); border-radius: 9px; padding: 10px 12px;
  transition: border-color .14s, box-shadow .14s;
}
.rf-input:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.rf-input input, .rf-input select {
  flex: 1; border: none; outline: none; background: none;
  font-size: 14px; color: var(--text); font-family: var(--font); width: 100%;
}
.rf-input select { cursor: pointer; appearance: none; }

/* (c) prominent — login / single-focus forms */
.login-input {
  display: flex; align-items: center; gap: 10px; background: var(--panel);
  border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 14px;
  transition: border-color .14s, box-shadow .14s;
}
.login-input:focus-within { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
```

**Focus ring rule:** `border-color: var(--accent)` + `box-shadow: 0 0 0 3px var(--accent-soft)` (4px on prominent fields). Never `outline`.

Numeric inputs are **right-aligned mono**; text inputs are left-aligned sans.

### Option pills, quick-values, checkboxes

```css
.pill-row { display: flex; gap: 6px; flex-wrap: wrap; }
.pill-opt {
  padding: 7px 12px; border-radius: 7px; font-size: 12.5px; font-weight: 500;
  color: var(--text-dim); background: var(--panel); border: 1px solid var(--border);
  transition: all .12s;
}
.pill-opt:hover { border-color: var(--accent-dim); color: var(--text); }
.pill-opt.on    { background: var(--accent-soft); border-color: var(--accent-dim); color: var(--accent-2); }

.quick-qty { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-top: 8px; }
.quick-qty button {
  padding: 6px; border-radius: 6px; font-family: var(--mono); font-size: 11.5px;
  color: var(--text-dim); background: var(--panel-2); border: 1px solid var(--border-soft);
}
.quick-qty button:hover { background: var(--hover); color: var(--text); border-color: var(--accent-dim); }

.check-row { display: flex; align-items: center; gap: 9px; cursor: pointer; padding: 4px 0; }
.check-box {
  width: 17px; height: 17px; border-radius: 5px; border: 1.5px solid var(--border);
  display: grid; place-items: center; transition: all .12s;
}
.check-box.on { background: var(--accent); border-color: var(--accent); }
.check-box svg { width: 12px; height: 12px; color: #fff; }
```

Any numeric input should be paired with a `.quick-qty`-style shortcut row (25%/50%/max, or ₹1k/5k/10k). Adapt the label set to the domain.

### Binary side selector (buy/sell)

```css
.ticket-side {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  border: 1px solid var(--border); border-radius: 9px; overflow: hidden;
}
.ticket-side button {
  padding: 11px; font-size: 14px; font-weight: 700;
  color: var(--text-dim); background: var(--panel); transition: all .12s;
}
.ticket-side button.buy-on  { background: var(--up-bg);   color: var(--up);   box-shadow: inset 0 -2px 0 var(--up); }
.ticket-side button.sell-on { background: var(--down-bg); color: var(--down); box-shadow: inset 0 -2px 0 var(--down); }
```

Selection is signalled three ways at once: tinted background, colored label, inset underline. Reusable for any high-stakes binary choice.

### Value summary box

```css
.order-value-box {
  background: var(--panel-2); border: 1px solid var(--border);
  border-radius: 9px; padding: 12px 14px; margin: 4px 0 12px;
}
.ov-row { display: flex; justify-content: space-between; align-items: baseline; padding: 3px 0; font-size: 12.5px; }
.ov-row .k { color: var(--text-dim); }
.ov-row .v { font-family: var(--mono); font-weight: 500; }
.ov-row.total { border-top: 1px solid var(--border); margin-top: 6px; padding-top: 9px; font-size: 14px; }
.ov-row.total .v { font-weight: 700; font-size: 16px; }
```

Use before any irreversible confirm: itemized rows, then a bordered total row.

### Key/value grid

```css
.kv-grid { display: grid; grid-template-columns: repeat(2, 1fr); }
.kv {
  display: flex; justify-content: space-between; align-items: baseline; gap: 10px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-soft); border-right: 1px solid var(--border-soft);
}
.kv .k { font-size: 11.5px; color: var(--text-dim); }
.kv .v { font-family: var(--mono); font-size: 13px; font-weight: 500; }
```

Cell borders come from the *cells*, not the grid — so it works with any column count and any item count.

### Stat cards

```css
.stat-card {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: var(--r-lg); padding: 16px 18px; box-shadow: var(--card-shadow);
}
.stat-card .lbl { font-size: 11.5px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
.stat-card .big { font-family: var(--mono); font-size: 26px; font-weight: 600; letter-spacing: -0.5px; margin-top: 6px; }
.stat-card .sub { font-size: 12px; margin-top: 4px; }
```

Always three tiers: **uppercase label → big mono value → delta/context sub-line**.

### Modal

```css
.modal-overlay {
  position: fixed; inset: 0; background: rgba(5,7,11,0.72); backdrop-filter: blur(3px);
  display: grid; place-items: center; z-index: 100; animation: fade .15s ease;
}
@keyframes fade { from { opacity: 0; } }
.modal {
  background: var(--panel); border: 1px solid var(--border); border-radius: 14px;
  width: 440px; max-width: 92vw; box-shadow: var(--shadow-pop);
  animation: pop .18s cubic-bezier(.2,.8,.2,1);
}
@keyframes pop { from { transform: scale(.96) translateY(8px); opacity: 0; } }
.modal-head { padding: 16px 20px; border-bottom: 1px solid var(--border-soft); display: flex; align-items: center; gap: 12px; }
.modal-head h3 { font-size: 16px; font-weight: 600; }
.modal-body { padding: 18px 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid var(--border-soft); display: flex; gap: 10px; }

.err-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: var(--down-bg); color: var(--down);
  display: grid; place-items: center; flex: none;
}
```

### Drawer (detail panel)

```css
.drawer-overlay { position: fixed; inset: 0; background: rgba(5,7,11,0.5); z-index: 90; animation: fade .15s; }
.drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: 460px; max-width: 94vw;
  background: var(--panel); border-left: 1px solid var(--border); z-index: 91;
  box-shadow: var(--shadow-pop); display: flex; flex-direction: column;
  animation: slidedrawer .22s cubic-bezier(.2,.8,.2,1);
}
@keyframes slidedrawer { from { transform: translateX(100%); } }
.drawer-head { padding: 16px 20px; border-bottom: 1px solid var(--border-soft); display: flex; align-items: center; gap: 12px; }
.drawer-body { flex: 1; overflow-y: auto; padding: 18px 20px; }
.drawer-foot { padding: 14px 20px; border-top: 1px solid var(--border-soft); display: flex; gap: 10px; }
```

Modal = decision. Drawer = inspection. Both use head/body/foot with the same padding rhythm.

### Toast

```css
.toast-wrap { position: fixed; bottom: 22px; right: 22px; display: flex; flex-direction: column; gap: 10px; z-index: 200; }
.toast {
  display: flex; align-items: center; gap: 12px; min-width: 300px;
  background: var(--panel-2); border: 1px solid var(--border); border-left: 3px solid var(--up);
  border-radius: 10px; padding: 12px 16px; box-shadow: var(--shadow);
  animation: slidein .25s cubic-bezier(.2,.8,.2,1);
}
@keyframes slidein { from { transform: translateX(40px); opacity: 0; } }
.toast.err { border-left-color: var(--down); }
.toast .t-ic { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; flex: none; }
.toast .t-ic.ok { background: var(--up-bg);   color: var(--up); }
.toast .t-ic.no { background: var(--down-bg); color: var(--down); }
.toast .t-tt { font-size: 13px; font-weight: 600; }
.toast .t-ds { font-size: 11.5px; color: var(--text-dim); }
```

Toasts carry a **title + optional description**, auto-dismiss at ~4.2s, and stack bottom-right.

### Wizard stepper

```css
.stepper { display: flex; align-items: center; margin-bottom: 24px; }
.step { display: flex; align-items: center; gap: 9px; }
.step-num {
  width: 27px; height: 27px; border-radius: 50%; display: grid; place-items: center;
  font-size: 12.5px; font-weight: 600; font-family: var(--mono);
  background: var(--panel-3); color: var(--text-faint);
  border: 1.5px solid var(--border); transition: all .15s;
}
.step.on   .step-num { background: var(--accent); color: #fff; border-color: var(--accent); }
.step.done .step-num { background: var(--up);     color: #fff; border-color: var(--up); }
.step-label { font-size: 12.5px; color: var(--text-faint); font-weight: 500; }
.step.on .step-label, .step.done .step-label { color: var(--text); }
.step-line { flex: 1; height: 1.5px; background: var(--border); margin: 0 12px; }
.step-line.done { background: var(--up); }
```

Three states — `pending` (grey), `on` (accent), `done` (green). Connector lines turn green behind you.

### Selection cards (method / path)

```css
.method-card {
  display: flex; align-items: center; gap: 13px; padding: 13px 15px;
  border-radius: 11px; border: 1.5px solid var(--border); background: var(--panel);
  cursor: pointer; transition: all .14s; width: 100%; text-align: left;
}
.method-card + .method-card { margin-top: 9px; }
.method-card:hover { border-color: var(--accent-dim); background: var(--panel-2); }
.method-card.on    { border-color: var(--accent);     background: var(--accent-soft); }
.method-logo { width: 42px; height: 42px; border-radius: 10px; flex: none; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 19px; }
.method-name { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.method-detail { font-size: 11.5px; color: var(--text-faint); font-family: var(--mono); margin-top: 2px; }
.method-radio {
  width: 21px; height: 21px; border-radius: 50%; border: 2px solid var(--border);
  flex: none; display: grid; place-items: center; transition: all .14s;
}
.method-card.on .method-radio { border-color: var(--accent); }
.method-card.on .method-radio::after { content: ''; width: 11px; height: 11px; border-radius: 50%; background: var(--accent); }

/* larger variant for top-level branching choices */
.path-card {
  display: flex; gap: 15px; padding: 18px; border-radius: 13px;
  border: 1.5px solid var(--border); background: var(--panel);
  cursor: pointer; transition: all .15s; text-align: left; width: 100%;
}
.path-card:hover { border-color: var(--accent); box-shadow: var(--shadow); transform: translateY(-1px); }
.path-ic { width: 46px; height: 46px; border-radius: 12px; flex: none; display: grid; place-items: center; }
.path-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 9px; }
.path-desc { font-size: 12.5px; color: var(--text-dim); margin-top: 4px; line-height: 1.5; }
```

Layout is always **icon · content · affordance**. The `translateY(-1px)` lift on hover is the system's only transform-based feedback.

### Timeline

```css
.timeline { text-align: left; margin: 20px 0; }
.tl-row { display: flex; gap: 12px; padding: 4px 0; }
.tl-dot { width: 22px; flex: none; display: flex; flex-direction: column; align-items: center; }
.tl-dot .d { width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--border); background: var(--panel); margin-top: 3px; }
.tl-row.done   .tl-dot .d { background: var(--up);   border-color: var(--up); }
.tl-row.active .tl-dot .d { background: var(--warn); border-color: var(--warn); }
.tl-dot .ln { width: 2px; flex: 1; background: var(--border); margin: 2px 0; }
.tl-row:last-child .tl-dot .ln { display: none; }
.tl-body .t { font-size: 13.5px; font-weight: 500; }
.tl-body .s { font-size: 12px; color: var(--text-faint); margin-top: 1px; }
```

### Confirmation / result screen

```css
.success-badge { width: 66px; height: 66px; border-radius: 20px; display: grid; place-items: center; margin: 0 auto 18px; }
.success-badge.ok      { background: var(--up-bg);   color: var(--up); }
.success-badge.pending { background: var(--warn-bg); color: var(--warn); }

.ref-box { background: var(--panel-2); border: 1px solid var(--border); border-radius: 11px; padding: 16px; margin: 22px 0; }
.ref-box .k { font-size: 11px; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text-faint); }
.ref-box .v { font-family: var(--mono); font-size: 21px; font-weight: 700; margin-top: 4px; letter-spacing: 0.5px; }
```

Result screen recipe: **badge → headline → explanation → reference box → timeline → actions**.

---

## 7. Data visualization

All charts are hand-rolled inline SVG using CSS variables for color. No chart library.

### Sparkline

```jsx
function Sparkline({ data, w = 76, h = 26, up }) {
  const path = useMemo(() => {
    if (!data?.length) return '';
    const min = Math.min(...data), max = Math.max(...data), rng = (max - min) || 1;
    return data.map((v, i) =>
      `${i ? 'L' : 'M'}${(i / (data.length - 1) * w).toFixed(1)},${(h - ((v - min) / rng) * h).toFixed(1)}`
    ).join(' ');
  }, [data, w, h]);

  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={path} fill="none" stroke={up ? 'var(--up)' : 'var(--down)'} strokeWidth={1.4} />
    </svg>
  );
}
```

### Area chart

Key techniques (see `AreaChart` in `ui.jsx` for the full implementation):

- **`ResizeObserver`** on a wrapper div for width; height is a prop. No layout-thrash re-render loop.
- **Gradient fill** from `stopOpacity 0.28` → `0` in the series color.
- **Previous-close reference line**: dashed, `--text-faint`, `opacity: 0.6`.
- **Gridlines** at max / mid / min only, in `--border-soft`, labels in mono `--text-faint`.
- **Hover crosshair**: dashed vertical line + filled dot with a `--panel` stroke ring + value chip clamped inside the plot area.
- Series color is `var(--up)` or `var(--down)` — never a fixed brand color.

### Bar / distribution primitives

```css
/* three-segment breadth bar */
.breadth { display: flex; height: 8px; border-radius: 5px; overflow: hidden; background: var(--panel-3); }
.breadth .seg-up { background: var(--up); }
.breadth .seg-fl { background: var(--flat); opacity: 0.4; }
.breadth .seg-dn { background: var(--down); }

/* range with position marker */
.range { display: flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 11px; color: var(--text-faint); }
.range .bar  { flex: 1; height: 4px; border-radius: 3px; background: var(--panel-3); position: relative; }
.range .fill { position: absolute; inset: 0 auto 0 0; border-radius: 3px;
               background: linear-gradient(90deg, var(--down), var(--warn), var(--up)); opacity: 0.5; }
.range .dot  { position: absolute; top: 50%; width: 10px; height: 10px; border-radius: 50%;
               background: var(--text); transform: translate(-50%,-50%); box-shadow: 0 0 0 3px var(--bg); }

/* magnitude bars behind table rows */
.depth-row { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center;
             position: relative; font-family: var(--mono); font-size: 12px; padding: 4px 10px; }
.depth-row .fillbar { position: absolute; top: 1px; bottom: 1px; border-radius: 3px; z-index: 0; }
.depth-row > span { position: relative; z-index: 1; text-align: right; }
.depth-row > span:first-child { text-align: left; }

.spark { width: 76px; height: 26px; }
```

`--up-bar` / `--down-bar` exist specifically for `.fillbar` — they're more opaque than `--up-bg` so they read behind text.

### Delta component

```jsx
function Delta({ pct, abs, showAbs, size }) {
  const cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  return (
    <span className={'delta ' + cls} style={{ fontSize: size || 13 }}>
      {pct !== 0 && <Icon name={pct > 0 ? 'arrowup' : 'arrowdown'} size={(size || 13) - 1} />}
      <span>{FMT.pct(pct)}</span>
      {showAbs && abs != null && <span className="faint" style={{ marginLeft: 4 }}>({FMT.sign(abs)})</span>}
    </span>
  );
}
```

```css
.delta { display: inline-flex; align-items: center; gap: 3px; font-family: var(--mono); font-weight: 500; }
.delta svg { width: 11px; height: 11px; }
.q-last { font-family: var(--mono); font-size: 34px; font-weight: 600; letter-spacing: -1px; line-height: 1; }
```

Change is signalled **redundantly**: arrow direction + color + sign character. Never color alone (colorblind accessibility).

---

## 8. Icon system

One flat `IconPaths` map of SVG `d` strings, one `<Icon>` renderer. No icon package, no per-icon component.

```jsx
const IconPaths = {
  market:   'M3 3v18h18 M7 14l3-4 3 3 4-6',
  quote:    'M21 12a9 9 0 1 1-9-9 M12 7v5l3 2',
  trade:    'M7 16V9 M7 9l-3 3 M7 9l3 3 M17 8v7 M17 15l3-3 M17 15l-3-3',
  search:   'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-4.3-4.3',
  check:    'M5 12l5 5L20 6',
  chevdown: 'M6 9l6 6 6-6',
  // …one entry per icon
};

function Icon({ name, size = 18, style, className }) {
  const d = IconPaths[name] || IconPaths.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
         style={style} className={className}>
      {d.split(' M').map((seg, i) => <path key={i} d={(i ? 'M' : '') + seg} />)}
    </svg>
  );
}
```

Rules:
- 24×24 viewBox, `strokeWidth: 1.7`, round caps and joins, `fill: none`.
- Multi-subpath icons are stored as one space-separated string and split on `' M'`.
- Color always inherits via `currentColor` — never set `stroke` at the call site.
- Sizes: **13–14** inline with text, **16** in buttons, **18** in nav/header, **20–24** in feature icons.

---

## 9. Number formatting

Centralize every format. Never call `toFixed` in a component.

```js
const FMT = {
  n:    (v, d = 2) => v == null ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }),
  int:  (v)        => v == null ? '—' : Number(v).toLocaleString('en-US'),
  pct:  (v)        => (v > 0 ? '+' : '') + Number(v).toFixed(2) + '%',
  sign: (v, d = 2) => (v > 0 ? '+' : '') + Number(v).toFixed(d),
  cur:  (v)        => '৳ ' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  big:  (v) => {
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
    return String(v);
  },
};
```

Conventions:
- `null` renders as an em dash `—`, never as `0` or blank.
- Percentages and deltas always carry an explicit `+` when positive.
- Large aggregates get `big()`; per-unit prices keep full precision.
- Swap `cur()`'s symbol and `'en-US'` locale for your target market; everything else is portable.

---

## 10. Motion

| Interaction | Duration | Easing |
|---|---|---|
| Hover color/background | 120ms | default |
| Border + focus ring | 140–150ms | default |
| Button press | 50ms | default (`translateY(1px)`) |
| Overlay fade in | 150ms | `ease` |
| Modal pop | 180ms | `cubic-bezier(.2,.8,.2,1)` |
| Drawer slide | 220ms | `cubic-bezier(.2,.8,.2,1)` |
| Toast slide | 250ms | `cubic-bezier(.2,.8,.2,1)` |
| Ticker marquee | 48s | `linear infinite` |

**Rule:** `cubic-bezier(.2,.8,.2,1)` for anything that enters the screen. Plain default easing for state changes on things already there. Nothing over 250ms except the ambient marquee.

---

## 11. Printable document pattern

For statements, certificates, and receipts: render a **fixed light "paper" surface** that ignores the app theme, then hide app chrome at print time.

```css
.doc-paper {
  background: #fff; color: #1a2230; max-width: 820px; margin: 0 auto;
  border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow);
  padding: 38px 42px 30px; font-size: 12px; line-height: 1.5;
}
[data-theme="dark"] .doc-paper { color: #1a2230; }   /* paper stays paper */

.doc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;
            border-bottom: 2px solid #16203A; padding-bottom: 16px; }
.doc-doctype { font-size: 15px; font-weight: 700; color: #4F6BED; letter-spacing: -0.2px; }
.doc-table { width: 100%; border-collapse: collapse; margin: 6px 0 4px; }
.doc-table th { font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7587;
                font-weight: 600; padding: 7px 8px; border-bottom: 1.5px solid #16203A; }
.doc-table td { font-size: 11px; padding: 7px 8px; border-bottom: 1px solid #eef1f6;
                color: #1a2230; text-align: right; }
.doc-table td.num { font-family: var(--mono); }
.doc-table tfoot td { font-weight: 700; border-top: 1.5px solid #16203A; border-bottom: none; color: #16203A; }
.doc-note { font-size: 10px; color: #7a8499; line-height: 1.6; margin-top: 18px;
            border-top: 1px solid #eef1f6; padding-top: 10px; }

@media print {
  @page { size: A4; margin: 0; }
  html, body { height: auto !important; background: #fff !important; }
  body.printing-doc .brand,
  body.printing-doc .ticker,
  body.printing-doc .header,
  body.printing-doc .sidebar,
  body.printing-doc .toast-wrap,
  body.printing-doc .doc-print-hide,
  body.printing-doc .page-head { display: none !important; }
  body.printing-doc .app  { display: block !important; height: auto !important; overflow: visible !important; }
  body.printing-doc .main { display: block !important; overflow: visible !important; }
  body.printing-doc .page { padding: 0 !important; max-width: none !important; }
  body.printing-doc .doc-paper {
    box-shadow: none !important; border: none !important; max-width: none !important;
    margin: 0 !important; padding: 15mm 14mm !important;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
}
```

Toggle `document.body.classList.add('printing-doc')` before `window.print()` and remove it after. Documents use **hardcoded print hexes**, not tokens — printed output must not follow the screen theme.

---

## 12. Auth screen pattern

Split-screen: dark branded panel on the left (hidden on mobile), form on the right.

```css
.login-wrap { display: grid; grid-template-columns: 1.05fr 1fr; height: 100%; background: var(--bg); }
.login-brand {
  position: relative; overflow: hidden; padding: 48px 52px;
  display: flex; flex-direction: column; justify-content: space-between;
  background:
    radial-gradient(130% 120% at 100% 0%, rgba(122,150,255,0.20), transparent 52%),
    radial-gradient(90% 90% at 0% 100%, rgba(15,157,107,0.14), transparent 55%),
    linear-gradient(160deg, #16203A 0%, #0E1626 72%);
  color: #fff;
}
.login-hero h1 { font-size: 38px; line-height: 1.12; font-weight: 600; letter-spacing: -1px; text-wrap: balance; }
.login-hero p  { font-size: 14.5px; color: var(--rail-dim); margin-top: 16px; line-height: 1.6; max-width: 400px; }

.login-panel { display: grid; place-items: center; padding: 40px; overflow-y: auto; }
.login-card  { width: 100%; max-width: 380px; }
.login-card h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.4px; }

.login-error {
  display: flex; align-items: center; gap: 8px; font-size: 12.5px;
  color: var(--down); background: var(--down-bg); border: 1px solid rgba(224,49,75,0.22);
  border-radius: 9px; padding: 9px 12px; margin-bottom: 15px;
}
.login-sep { display: flex; align-items: center; gap: 12px; margin: 22px 0; color: var(--text-faint); font-size: 11px; letter-spacing: 0.6px; }
.login-sep::before, .login-sep::after { content: ''; flex: 1; height: 1px; background: var(--border); }

@media (max-width: 880px) { .login-wrap { grid-template-columns: 1fr; } .login-brand { display: none; } }
```

The brand panel's depth comes from **two radial gradients layered over a linear base** — accent glow top-right, secondary glow bottom-left. Reuse the same recipe for the balance card (`.cash-card`) and any hero surface.

---

## 13. Application architecture

The design pattern assumes this structure. Adapt names; keep the separation.

```
src/
  styles.css        — tokens + all component classes (single stylesheet)
  data/             — data layer + FMT formatters; no UI imports
  components/ui     — Icon, Delta, Sparkline, AreaChart, RangeBar,
                      StatusBadge, SymTag, Select, ToastHost
  screens/          — one file per feature area; composes primitives only
  App.jsx           — shell: NAV data, routing switch, global state, toasts
```

### App-level state

The shell owns cross-screen state and passes down **actions, not setters**:

```js
const [route, setRoute]         = useState({ id: 'market', params: {} });
const [collapsed, setCollapsed] = useState(false);
const [theme, setTheme]         = useState('Light');
const [toasts, setToasts]       = useState([]);

function nav(id, params = {}) {
  setRoute({ id, params });
  document.querySelector('.main')?.scrollTo(0, 0);   // always reset scroll
}

function toast(t) {
  const id = Date.now() + Math.random();
  setToasts(ts => [...ts, { ...t, id }]);
  setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4200);
}
```

Theme is applied by one attribute on the shell root:

```jsx
<div className={'app' + (collapsed ? ' collapsed' : '')} data-theme={theme.toLowerCase()}>
```

Routing is a plain `switch` on `route.id` with `params` for detail views (`{ sym: 'ABC' }`). Nav highlighting handles sub-routes with prefix matching:

```js
const active = route.id === item.id
  || (item.id === 'documents' && route.id.startsWith('doc-'))
  || (item.id === 'ipo'       && route.id.startsWith('ipo'));
```

---

## 14. Screen composition recipes

**Dashboard** — hero + supporting rail, then a table row:
```
.page
  .page-head            title/sub · spacer · Select · icon-btn
  .grid (1.6fr 1fr)     hero .panel (tabs → big number → chart → range)
                        .grid stacked (breadth · kv-grid · list panel)
  .grid (3 cols)        three list panels (gainers / losers / active)
```

**List screen** — filters up top, one full-width table:
```
.page
  .page-head            title · spacer · .seg · Select · .btn
  .panel > .dt          sticky header, first col identity, rest numeric
```

**Transaction form** — form left, context right:
```
.page
  .grid (1fr 380px)
    left:   .fund-toggle → .amount-field → .quick-amt → .method-card list
            → .order-value-box → .btn-primary.btn-lg.btn-block
    right:  .cash-card + .fund-note + recent activity panel
```

**Wizard** — full-bleed, own topbar:
```
.reg-full
  .reg-topbar           sticky, rail-colored, back link right
  .reg-full-inner       max-width 1000px
    .stepper
    .reg-sec-card ×n    head + sub + .reg-grid (2col, .full to span)
    .reg-actions        ghost back · primary next
```

---

## 15. Accessibility & quality checklist

- [ ] Every state change signals in **two channels minimum** (color + icon, or color + weight).
- [ ] Focus is always visible: `border-color: var(--accent)` + `box-shadow: 0 0 0 3px var(--accent-soft)`.
- [ ] `--text-faint` is for non-essential meta only — never for data a user must read.
- [ ] Interactive rows/cards are `<button>` elements, not `<div onClick>`.
- [ ] Tables have real `<thead>`/`<th>`; sticky headers get `background: var(--panel)` so rows don't bleed through.
- [ ] Both themes verified: check `--card-shadow: none` doesn't leave dark-mode cards floating.
- [ ] Long text truncates with `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0`.
- [ ] Numeric columns right-aligned and `.num`/`.mono`, so digits line up.
- [ ] Destructive/irreversible actions preceded by a `.order-value-box`-style summary and an explicit confirm.

---

## 16. Adapting this to a new domain

| This app | Generic equivalent | What to change |
|---|---|---|
| `--up` / `--down` | positive / negative delta | Keep the tokens; rename only if your domain has no direction concept |
| Ticker strip | announcements / alerts bar | Or delete the row from the grid and drop `--ticker-h` |
| `.sym-tag` | entity avatar | Hash-to-color logic works for any short identifier |
| `.ticket-side` | any binary high-stakes toggle | Retint via `--up-bg` / `--down-bg` |
| `.q-last` | primary metric hero | Keep mono + `-1px` tracking |
| `FMT.cur` | your currency | Change symbol + locale |
| `.doc-paper` | any printable | Keep hardcoded print colors |

**Minimum viable port:** copy §2 tokens, §3 base layer, and `.panel` / `.btn` / `.dt` / `.badge` / field styles. That's ~150 lines and already gives you the full look.

---

## 17. Anti-patterns

- ❌ Hardcoded hex values in components — always a token.
- ❌ Shadows for elevation in dark mode — borders only.
- ❌ Mono for prose, or sans for figures.
- ❌ Green/red for generic success/error inside market UI (they mean up/down there).
- ❌ `outline` for focus — use the border + ring pair.
- ❌ Multiple accent colors competing in one screen.
- ❌ Transitions longer than 250ms on interactive feedback.
- ❌ A second border weight — the system uses 1px (structure) and 1.5px (inputs/selection). That's all.
- ❌ Per-component theme conditionals — `data-theme` on the root does it all.
