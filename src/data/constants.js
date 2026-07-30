export const PURPOSES = [
  "Business meeting",
  "Client visit",
  "Job interview",
  "Contractor",
  "Delivery",
  "Event / tour",
];

export const DEPARTMENTS = ["Engineering", "Sales", "People", "Facilities", "Finance", "Operations", "Legal"];

/* ------------------------------------------------------------------
   Visit status

   On-site is two states, not one: a visitor is either waiting in the
   foyer or already in the meeting. "On-site" anywhere in the UI means
   waiting + meeting.
   ------------------------------------------------------------------ */
export const ONSITE = ["waiting", "meeting"];

export const STATUS_LABEL = {
  waiting: "In waiting",
  meeting: "In meeting",
  out: "Checked out",
  prereg: "Expected",
  denied: "Denied",
};

/* Status → badge tone. One lookup table, never scattered conditionals. */
export const STATUS_STYLE = {
  waiting: "amber",
  meeting: "green",
  out: "grey",
  prereg: "blue",
  denied: "red",
};

/* ------------------------------------------------------------------
   Users and access

   User type decides which sections exist for a signed-in user. The keys
   match the nav item ids and the route guard, so there is one source of
   truth for "may this person see this".
   ------------------------------------------------------------------ */
export const USER_TYPES = [
  { id: "admin", label: "Administrator", desc: "Full access including every master database" },
  { id: "reception", label: "Reception", desc: "Runs the desk, the kiosk and visitor records" },
  { id: "host", label: "Host", desc: "Sees their own visitors and the reports" },
];

export const userTypeLabel = id => (USER_TYPES.find(t => t.id === id) || USER_TYPES[2]).label;

export const CAN = {
  admin:     ["desk", "checkin", "kiosk", "reports", "org", "hosts", "visitors", "users", "settings"],
  reception: ["desk", "checkin", "kiosk", "reports", "hosts", "visitors", "settings"],
  host:      ["desk", "reports"],
};

export const can = (userType, key) => (CAN[userType] || []).includes(key);

/* Distribution colours, in PURPOSES order: a sequential ramp of the single
   accent (see --cat-* in terminal.css), not six competing hues. */
export const PURPOSE_COLORS = [
  "var(--cat-1)",
  "var(--cat-2)",
  "var(--cat-3)",
  "var(--cat-4)",
  "var(--cat-5)",
  "var(--cat-6)",
];

export const DEFAULT_SETTINGS = {
  email: true,
  sms: true,
  slack: false,
  watch: true,
  id: false,
  photo: true,
  nda: true,
  health: true,
  auto: true,
};

/* Watchlist screening is a demo check: any visitor whose full name matches one
   of these (case-insensitive) is flagged at check-in. */
export const WATCHLIST = ["blocked visitor", "john doe"];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
