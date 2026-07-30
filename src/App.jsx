import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import FoyerMark from "./components/FoyerMark";
import Icon from "./components/Icon";
import Avatar from "./components/Avatar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Kiosk from "./pages/Kiosk";
import Organizations from "./pages/masters/Organizations";
import Hosts from "./pages/masters/Hosts";
import Visitors from "./pages/masters/Visitors";
import Users from "./pages/masters/Users";
import { useOrgData, useSession, useToast } from "./store/AppStore";
import { can, userTypeLabel } from "./data/constants";
import { FMT, humanDuration, isToday, minutesBetween, timeOf } from "./utils/format";

/* Navigation is grouped data, never hand-written markup. Every item carries the
   permission key that also guards its route. */
const NAV = [
  { group: "Reception", items: [
    { key: "desk", to: "/", label: "Welcome desk", icon: "dashboard", end: true, count: "onsite" },
    { key: "checkin", to: "/check-in", label: "Check-in", icon: "checkin" },
    { key: "kiosk", to: "/kiosk", label: "Kiosk", icon: "kiosk" },
  ]},
  { group: "Insight", items: [
    { key: "reports", to: "/reports", label: "Reports", icon: "reports" },
  ]},
  { group: "Master data", items: [
    { key: "org", to: "/masters/organizations", label: "Organizations", icon: "pin" },
    { key: "hosts", to: "/masters/hosts", label: "Host master", icon: "users" },
    { key: "visitors", to: "/masters/visitors", label: "Visitor master", icon: "badge" },
    { key: "users", to: "/masters/users", label: "Users", icon: "user" },
  ]},
  { group: "System", items: [
    { key: "settings", to: "/settings", label: "Settings", icon: "settings" },
  ]},
];

const ROUTES = [
  { key: "desk", path: "/", element: <Dashboard /> },
  { key: "checkin", path: "/check-in", element: <CheckIn /> },
  { key: "kiosk", path: "/kiosk", element: <Kiosk /> },
  { key: "reports", path: "/reports", element: <Reports /> },
  { key: "org", path: "/masters/organizations", element: <Organizations /> },
  { key: "hosts", path: "/masters/hosts", element: <Hosts /> },
  { key: "visitors", path: "/masters/visitors", element: <Visitors /> },
  { key: "users", path: "/masters/users", element: <Users /> },
  { key: "settings", path: "/settings", element: <Settings /> },
];

const THEME_KEY = "foyer.theme";

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");

  /* One attribute flips the whole system. It lives on <html> rather than the
     shell div so overlays rendered outside the shell (toasts, drawers) and the
     document background follow the theme too. */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return [theme, () => setTheme(t => (t === "dark" ? "light" : "dark"))];
}

/** Shell-level numbers: the ticker, the header pills and the nav badge all read
    from this one derivation. */
function useDeskStats() {
  const { visits, expand } = useOrgData();

  return useMemo(() => {
    const waiting = visits.filter(v => v.status === "waiting");
    const meeting = visits.filter(v => v.status === "meeting");
    const today = visits.filter(v => v.checkInAt && isToday(v.checkInAt));
    const expected = visits.filter(v => v.status === "prereg" && v.expectedAt && isToday(v.expectedAt));
    const done = today.filter(v => v.checkOutAt);

    const avg = (rows, get) =>
      rows.length ? Math.round(rows.reduce((s, v) => s + get(v), 0) / rows.length) : 0;

    const greeted = today.filter(v => v.meetingAt);
    const last = today.reduce(
      (latest, v) => (!latest || new Date(v.checkInAt) > new Date(latest.checkInAt) ? v : latest),
      null
    );

    return {
      waiting: waiting.length,
      meeting: meeting.length,
      onsite: waiting.length + meeting.length,
      today: today.length,
      expected: expected.length,
      out: done.length,
      avgWait: avg(greeted, v => minutesBetween(v.checkInAt, v.meetingAt)),
      avgDwell: avg(done, v => minutesBetween(v.checkInAt, v.checkOutAt)),
      lastArrival: last ? expand(last).visitor?.name || null : null,
      lastAt: last ? timeOf(last.checkInAt) : null,
    };
  }, [visits, expand]);
}

function Ticker({ stats, org }) {
  const items = [
    { k: "In waiting", v: FMT.int(stats.waiting) },
    { k: "In meeting", v: FMT.int(stats.meeting) },
    { k: "Arrivals today", v: FMT.int(stats.today) },
    { k: "Expected", v: FMT.int(stats.expected) },
    { k: "Avg wait", v: humanDuration(stats.avgWait) },
    { k: "Avg dwell", v: humanDuration(stats.avgDwell) },
    { k: "Last arrival", v: stats.lastArrival ? `${stats.lastArrival} · ${stats.lastAt}` : "—" },
    { k: "Visiting slot", v: org ? `${org.slotStart}–${org.slotEnd}` : "—" },
  ];

  /* Rendered twice so the -50% translate loops seamlessly. */
  return (
    <div className="ticker">
      <span className="ticker-label"><Icon name="dot" size={11} /> LIVE</span>
      <div className="ticker-marquee">
        <div className="ticker-track">
          {[...items, ...items].map((it, i) => (
            <span className="tick" key={i}>
              <span className="k">{it.k}</span>
              <span className="v">{it.v}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { signedIn, user, org, signOut } = useSession();
  const [theme, toggleTheme] = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [params, setParams] = useSearchParams();
  const searchRef = useRef(null);

  const stats = useDeskStats();
  const query = params.get("q") || "";

  /* ⌘K / Ctrl-K focuses the desk search, as the header hint advertises. */
  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!signedIn) return <Login />;

  const type = user.userType;
  const allowed = ROUTES.filter(r => can(type, r.key));
  const home = allowed[0]?.path || "/";

  /* The search drives the welcome-desk log, so typing anywhere lands there. */
  const search = value => {
    if (location.pathname !== "/") navigate(value ? `/?q=${encodeURIComponent(value)}` : "/");
    else setParams(value ? { q: value } : {}, { replace: true });
  };

  const leave = () => {
    signOut();
    navigate("/");
    toast("Signed out", "ok", user.name || user.loginId);
  };

  return (
    <div className={"app" + (collapsed ? " collapsed" : "")} data-theme={theme}>
      <div className="brand" onClick={() => navigate(home)}>
        <FoyerMark size={30} />
        <div className="brand-text">
          <div className="brand-name">Foyer <b>Desk</b></div>
          <div className="brand-sub trunc">{org.name}</div>
        </div>
      </div>

      <Ticker stats={stats} org={org} />

      <header className="header">
        <button className="icon-btn" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">
          <Icon name="menu" size={18} />
        </button>

        {can(type, "desk") && (
          <label className="search">
            <Icon name="search" size={15} />
            <input
              ref={searchRef}
              value={query}
              onChange={e => search(e.target.value)}
              placeholder="Search visitors, hosts, purpose…"
              aria-label="Search visitors"
            />
            <kbd>⌘K</kbd>
          </label>
        )}

        <span className="header-spacer" />

        <div className="stat-pill">
          <span className="k">Waiting</span>
          <span className="v num" style={{ color: stats.waiting ? "var(--warn)" : undefined }}>
            {FMT.int(stats.waiting)}
          </span>
        </div>
        <div className="stat-pill">
          <span className="k">In meeting</span>
          <span className="v num up">{FMT.int(stats.meeting)}</span>
        </div>
        <div className="stat-pill opt">
          <span className="k">Today</span>
          <span className="v num">{FMT.int(stats.today)}</span>
        </div>

        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
        <button
          className="icon-btn"
          aria-label="Notifications"
          onClick={() => toast(
            stats.waiting ? `${stats.waiting} visitor${stats.waiting === 1 ? "" : "s"} waiting` : "Nobody is waiting",
            stats.waiting ? "warn" : "ok",
            stats.expected ? `${stats.expected} more expected today` : "Nothing else expected today"
          )}
        >
          <Icon name="bell" size={18} />
          {stats.waiting > 0 && <span className="pip" style={{ background: "var(--warn)" }} />}
        </button>

        <button className="user-chip" onClick={() => can(type, "settings") && navigate("/settings")}>
          <Avatar name={user.name || user.loginId} size={32} />
          <span className="who">
            <span className="n">{user.name || user.loginId}</span>
            <span className="r">{userTypeLabel(type)}</span>
          </span>
        </button>
        <button className="icon-btn" onClick={leave} aria-label="Sign out" title="Sign out">
          <Icon name="logout" size={18} />
        </button>
      </header>

      <nav className="sidebar">
        {NAV.map(group => {
          const items = group.items.filter(i => can(type, i.key));
          if (!items.length) return null;
          return (
            <div className="nav-group" key={group.group}>
              <div className="nav-group-label">{group.group}</div>
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
                  title={item.label}
                >
                  <Icon name={item.icon} size={18} />
                  <span className="lbl">{item.label}</span>
                  {item.count === "onsite" && stats.onsite > 0 && (
                    <span className="badge-count">{stats.onsite}</span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}

        <div className="sidebar-foot">
          <div className="k">Signed in as</div>
          <div className="v trunc">{user.loginId} · {org.orgId}</div>
        </div>
      </nav>

      <main className="main">
        <Routes>
          {allowed.map(r => <Route key={r.path} path={r.path} element={r.element} />)}
          {/* Anything this user type may not open falls back to their home. */}
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </main>
    </div>
  );
}
