import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Icon from "../components/Icon";
import { buildSeed } from "../data/seed";
import { DEFAULT_SETTINGS, ONSITE, WATCHLIST } from "../data/constants";
import { isToday, minutesBetween } from "../utils/format";

const STORAGE_KEY = "foyer.state.v2";

/* Master collections and their primary keys — the generic upsert/remove
   actions use this table so each entity does not need its own reducer case. */
export const ENTITY_KEY = {
  organizations: "orgId",
  users: "userId",
  hosts: "hostId",
  visitors: "visitorId",
};

const todayKey = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------
   Id minting
   ------------------------------------------------------------------ */

let badgeSeq = 5000;

function syncBadgeSeq(visits) {
  const highest = visits.reduce((max, v) => {
    const n = parseInt(String(v.badgeNo).replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  badgeSeq = Math.max(badgeSeq, highest + 1);
}

export const nextBadge = () => `FY-${badgeSeq++}`;
export const newId = () => `vst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Next sequential key for a master collection, e.g. nextKey(visitors, "visitorId", "VIS") */
export function nextKey(rows, key, prefix) {
  const highest = rows.reduce((max, r) => {
    const n = parseInt(String(r[key]).replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 1000);
  return `${prefix}-${highest + 1}`;
}

/* ------------------------------------------------------------------
   Persistence
   ------------------------------------------------------------------ */

function freshState() {
  return { ...buildSeed(), settings: { ...DEFAULT_SETTINGS }, session: null, seededOn: todayKey() };
}

function loadState() {
  const state = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return freshState();

      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.visits)) return freshState();

      const merged = {
        ...freshState(),
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };

      /* Visit history is anchored to "today", so it is rebuilt when the date
         rolls over. Master records are the user's data and are never rebuilt. */
      if (parsed.seededOn !== todayKey()) {
        merged.visits = buildSeed().visits;
        merged.seededOn = todayKey();
      }
      return merged;
    } catch {
      return freshState();
    }
  })();

  syncBadgeSeq(state.visits);
  return state;
}

/* ------------------------------------------------------------------
   Reducer
   ------------------------------------------------------------------ */

function reducer(state, action) {
  const now = () => new Date().toISOString();

  switch (action.type) {
    case "sign-in":
      return { ...state, session: { userId: action.userId, orgId: action.orgId, at: now() } };

    case "sign-out":
      return { ...state, session: null };

    /* ---- masters ---- */
    case "upsert": {
      const key = ENTITY_KEY[action.entity];
      const rows = state[action.entity];
      const exists = rows.some(r => r[key] === action.record[key]);
      return {
        ...state,
        [action.entity]: exists
          ? rows.map(r => (r[key] === action.record[key] ? { ...r, ...action.record } : r))
          : [...rows, action.record],
      };
    }

    case "remove": {
      const key = ENTITY_KEY[action.entity];
      return { ...state, [action.entity]: state[action.entity].filter(r => r[key] !== action.id) };
    }

    /* ---- visits ---- */
    case "check-in": {
      const visit = {
        id: newId(),
        orgId: state.session?.orgId,
        visitorId: null,
        hostId: null,
        purpose: "Business meeting",
        vehicle: "",
        notes: "",
        expectedAt: null,
        meetingAt: null,
        checkOutAt: null,
        source: "desk",
        ...action.visit,
        status: "waiting",
        checkInAt: action.visit.checkInAt || now(),
        badgeNo: action.visit.badgeNo || nextBadge(),
      };
      return { ...state, visits: [...state.visits, visit] };
    }

    /* An expected visitor arriving takes the same path as a walk-in: they
       start in the waiting room, not in the meeting. */
    case "admit":
      return {
        ...state,
        visits: state.visits.map(v =>
          v.id === action.id ? { ...v, status: "waiting", checkInAt: now() } : v),
      };

    case "start-meeting":
      return {
        ...state,
        visits: state.visits.map(v =>
          v.id === action.id && v.status === "waiting"
            ? { ...v, status: "meeting", meetingAt: now() }
            : v),
      };

    case "check-out":
      return {
        ...state,
        visits: state.visits.map(v =>
          v.id === action.id && ONSITE.includes(v.status)
            ? { ...v, status: "out", checkOutAt: now() }
            : v),
      };

    case "check-out-all":
      return {
        ...state,
        visits: state.visits.map(v =>
          ONSITE.includes(v.status) && v.orgId === action.orgId
            ? { ...v, status: "out", checkOutAt: now() }
            : v),
      };

    case "set-setting":
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };

    case "reset":
      return { ...freshState(), session: state.session };

    default:
      return state;
  }
}

/* ------------------------------------------------------------------
   Context
   ------------------------------------------------------------------ */

const AppContext = createContext(null);
const ToastContext = createContext(() => {});

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode — the app still works, it just won't persist */
    }
  }, [state]);

  /** toast(title, tone, description?) — tone is "ok" | "warn" | "error". */
  const toast = useCallback((message, tone = "ok", desc = "") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, message, tone, desc }]);
    const handle = setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
      timers.current.delete(id);
    }, 3600);
    timers.current.set(id, handle);
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const value = useMemo(() => ({ ...state, dispatch }), [state]);

  return (
    <AppContext.Provider value={value}>
      <ToastContext.Provider value={toast}>
        {children}
        <div className="toast-wrap">
          {toasts.map(t => (
            <div key={t.id} className={"toast " + t.tone}>
              <span className="t-ic">
                <Icon name={t.tone === "error" ? "alert" : t.tone === "warn" ? "bell" : "check"} size={15} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="t-tt">{t.message}</div>
                {t.desc && <div className="t-ds">{t.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      </ToastContext.Provider>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export const useToast = () => useContext(ToastContext);

export function useSettings() {
  const { settings, dispatch } = useApp();
  const setSetting = useCallback((key, value) => dispatch({ type: "set-setting", key, value }), [dispatch]);
  return [settings, setSetting];
}

/* ------------------------------------------------------------------
   Session
   ------------------------------------------------------------------ */

export function useSession() {
  const { session, users, organizations, dispatch } = useApp();

  return useMemo(() => {
    const user = session ? users.find(u => u.userId === session.userId) || null : null;
    const org = session ? organizations.find(o => o.orgId === session.orgId) || null : null;
    return {
      /* A stored session whose user or org has since been deleted is not a
         session — it falls back to the sign-in screen. */
      signedIn: Boolean(user && org && user.active !== false),
      user,
      org,
      signOut: () => dispatch({ type: "sign-out" }),
    };
  }, [session, users, organizations, dispatch]);
}

/** Credential check for the sign-in screen. Demo only — plain-text compare. */
export function authenticate(users, loginId, password) {
  const id = loginId.trim().toLowerCase();
  const user = users.find(u => u.loginId.toLowerCase() === id);
  if (!user) return { error: "No user with that ID" };
  if (user.active === false) return { error: "That account is disabled" };
  if (user.password !== password) return { error: "Incorrect password" };
  return { user };
}

/* ------------------------------------------------------------------
   Org-scoped selectors

   Every screen reads its data through here, so multi-tenancy is enforced in
   one place instead of a filter on every query.
   ------------------------------------------------------------------ */

export function useOrgData() {
  const { hosts, visitors, visits, users, session } = useApp();
  const orgId = session?.orgId;

  return useMemo(() => {
    const orgHosts = hosts.filter(h => h.orgId === orgId);
    const orgVisitors = visitors.filter(v => v.orgId === orgId);
    const orgVisits = visits.filter(v => v.orgId === orgId);
    const orgUsers = users.filter(u => u.orgId === orgId);

    const hostMap = new Map(orgHosts.map(h => [h.hostId, h]));
    const visitorMap = new Map(orgVisitors.map(v => [v.visitorId, v]));

    return {
      orgId,
      hosts: orgHosts,
      visitors: orgVisitors,
      visits: orgVisits,
      users: orgUsers,
      hostById: id => hostMap.get(id) || null,
      visitorById: id => visitorMap.get(id) || null,
      /** Visit joined with its visitor and host — what every screen displays. */
      expand: v => ({
        ...v,
        visitor: visitorMap.get(v.visitorId) || null,
        host: hostMap.get(v.hostId) || null,
      }),
    };
  }, [hosts, visitors, visits, users, orgId]);
}

/** Visitor master lookup by mobile or name — the first step of a check-in. */
export function searchVisitors(visitors, query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  return visitors
    .filter(v =>
      v.name.toLowerCase().includes(q) ||
      (digits.length >= 3 && v.mobile.replace(/\D/g, "").includes(digits)) ||
      (v.organization || "").toLowerCase().includes(q))
    .slice(0, 6);
}

/** Activity feed derived from visits — always consistent with the log. */
export function useActivity(limit = 8) {
  const { visits, expand } = useOrgData();

  return useMemo(() => {
    const events = [];
    for (const raw of visits) {
      const v = expand(raw);
      const name = v.visitor?.name || "Unknown visitor";

      if (v.checkInAt && isToday(v.checkInAt)) {
        events.push({ id: v.id + ":in", kind: "in", who: name, at: v.checkInAt, visit: v });
      }
      if (v.meetingAt && isToday(v.meetingAt) && v.status !== "prereg") {
        events.push({ id: v.id + ":met", kind: "meeting", who: name, at: v.meetingAt, visit: v });
      }
      if (v.checkOutAt && isToday(v.checkOutAt)) {
        events.push({
          id: v.id + ":out", kind: "out", who: name, at: v.checkOutAt, visit: v,
          dwell: minutesBetween(v.checkInAt, v.checkOutAt),
        });
      }
      if (v.status === "prereg" && v.expectedAt && isToday(v.expectedAt)) {
        events.push({ id: v.id + ":pre", kind: "prereg", who: name, at: v.expectedAt, visit: v });
      }
    }
    return events.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, limit);
  }, [visits, expand, limit]);
}

/** Demo watchlist screening. */
export const screenName = name => WATCHLIST.includes(name.trim().toLowerCase());

/** Is `when` inside the organization's visiting slot? */
export function withinSlot(org, when = new Date()) {
  if (!org?.slotStart || !org?.slotEnd) return true;
  const [sh, sm] = org.slotStart.split(":").map(Number);
  const [eh, em] = org.slotEnd.split(":").map(Number);
  const mins = when.getHours() * 60 + when.getMinutes();
  const dayOk = !org.slotDays?.length || org.slotDays.includes(when.getDay());
  return dayOk && mins >= sh * 60 + sm && mins <= eh * 60 + em;
}
