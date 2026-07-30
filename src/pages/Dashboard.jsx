import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import Delta from "../components/Delta";
import { useActivity, useApp, useOrgData, useSession, useToast } from "../store/AppStore";
import { ONSITE, STATUS_LABEL, STATUS_STYLE, can } from "../data/constants";
import {
  FMT, dateLabel, humanDuration, isSameDay, isToday, minutesBetween, relativeTime, timeOf,
} from "../utils/format";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "waiting", label: "Waiting" },
  { id: "meeting", label: "In meeting" },
  { id: "prereg", label: "Expected" },
  { id: "out", label: "Departed" },
];

const ACT = {
  in:      { what: "Checked in", tone: "" },
  meeting: { what: "Went in", tone: "done" },
  out:     { what: "Checked out", tone: "" },
  prereg:  { what: "Pre-registered", tone: "active" },
};

function StatCard({ label, value, icon, accent, children }) {
  return (
    <div className="stat-card">
      <div className="head">
        <span className="lbl">{label}</span>
        <span className="stat-ic"><Icon name={icon} size={15} /></span>
      </div>
      <div className="big" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="sub">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const { dispatch } = useApp();
  const { user } = useSession();
  const { visits, expand, hosts } = useOrgData();
  const activity = useActivity(7);
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const query = params.get("q") || "";
  const filter = params.get("f") || "all";

  /* A host only ever sees the visitors coming to see them. */
  const mine = user.userType === "host"
    ? hosts.find(h => h.employeeId === user.employeeId) || null
    : null;

  const scoped = useMemo(
    () => (mine ? visits.filter(v => v.hostId === mine.hostId) : visits),
    [visits, mine]
  );

  const setFilter = f => {
    const next = new URLSearchParams(params);
    f === "all" ? next.delete("f") : next.set("f", f);
    setParams(next, { replace: true });
  };

  const stats = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const waiting = scoped.filter(v => v.status === "waiting");
    const meeting = scoped.filter(v => v.status === "meeting");
    const today = scoped.filter(v => v.checkInAt && isToday(v.checkInAt));
    const yday = scoped.filter(v => v.checkInAt && isSameDay(v.checkInAt, yesterday));
    const expected = scoped.filter(v => v.status === "prereg" && v.expectedAt && isToday(v.expectedAt));
    const done = today.filter(v => v.checkOutAt);

    const change = yday.length ? Math.round(((today.length - yday.length) / yday.length) * 100) : null;

    const greeted = today.filter(v => v.meetingAt);
    const avgWait = greeted.length
      ? Math.round(greeted.reduce((s, v) => s + minutesBetween(v.checkInAt, v.meetingAt), 0) / greeted.length)
      : 0;

    const dwellSource = done.length ? done : scoped.filter(v => v.checkOutAt).slice(-30);
    const avgDwell = dwellSource.length
      ? Math.round(dwellSource.reduce((s, v) => s + minutesBetween(v.checkInAt, v.checkOutAt), 0) / dwellSource.length)
      : 0;

    /* Who has been standing in the foyer longest — the number reception acts on. */
    const longestWait = waiting.reduce(
      (max, v) => (!max || minutesBetween(v.checkInAt) > minutesBetween(max.checkInAt) ? v : max),
      null
    );

    return { waiting, meeting, today, expected, done, change, avgWait, avgDwell, longestWait };
  }, [scoped]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped
      .filter(v => isToday(v.checkInAt || v.expectedAt))
      .filter(v => filter === "all" || v.status === filter)
      .map(expand)
      .filter(v => {
        if (!q) return true;
        return (v.visitor?.name || "").toLowerCase().includes(q)
          || (v.visitor?.mobile || "").includes(q)
          || (v.visitor?.organization || "").toLowerCase().includes(q)
          || (v.host?.name || "").toLowerCase().includes(q)
          || v.purpose.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.checkInAt || b.expectedAt) - new Date(a.checkInAt || a.expectedAt));
  }, [scoped, filter, query, expand]);

  const startMeeting = v => {
    dispatch({ type: "start-meeting", id: v.id });
    toast(`${v.visitor?.name || "Visitor"} is in the meeting`, "ok",
      `Waited ${humanDuration(minutesBetween(v.checkInAt))} · ${v.host?.name || "host"}`);
  };

  const checkOut = v => {
    dispatch({ type: "check-out", id: v.id });
    toast(`${v.visitor?.name || "Visitor"} checked out`, "ok",
      `On-site ${humanDuration(minutesBetween(v.checkInAt))}`);
  };

  const admit = v => {
    dispatch({ type: "admit", id: v.id });
    toast(`${v.visitor?.name || "Visitor"} checked in`, "ok", `${v.host?.name || "Host"} notified`);
  };

  const total = stats.waiting.length + stats.meeting.length + stats.done.length + stats.expected.length || 1;
  const pct = n => (n / total) * 100;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">{mine ? "My visitors" : "Welcome desk"}</div>
          <div className="page-sub">
            {dateLabel()} · {stats.today.length} arrival{stats.today.length === 1 ? "" : "s"} logged today
          </div>
        </div>
        <span className="spacer" />
        {can(user.userType, "kiosk") && (
          <button className="btn" onClick={() => navigate("/kiosk")}><Icon name="kiosk" /> Open kiosk</button>
        )}
        {can(user.userType, "checkin") && (
          <button className="btn btn-primary" onClick={() => navigate("/check-in")}>
            <Icon name="plus" /> Check someone in
          </button>
        )}
      </div>

      <div className="grid g-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 14 }}>
        <StatCard label="In waiting" value={FMT.int(stats.waiting.length)} icon="clock"
          accent={stats.waiting.length ? "var(--warn)" : undefined}>
          {stats.longestWait
            ? `Longest ${humanDuration(minutesBetween(stats.longestWait.checkInAt))}`
            : "Foyer is clear"}
        </StatCard>
        <StatCard label="In meeting" value={FMT.int(stats.meeting.length)} icon="users">
          {stats.meeting.length ? "With their host now" : "No meetings running"}
        </StatCard>
        <StatCard label="Arrivals today" value={FMT.int(stats.today.length)} icon="checkin">
          {stats.change === null ? "First day of data" : <Delta pct={stats.change} label="vs yesterday" />}
        </StatCard>
        <StatCard label="Avg wait" value={humanDuration(stats.avgWait)} icon="activity">
          Check-in to meeting start
        </StatCard>
      </div>

      <div className="grid g-main" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "start" }}>
        {/* ---- visitor log ---- */}
        <section className="panel">
          <div className="panel-head">
            <h3>Visitor log</h3>
            <div className="seg">
              {FILTERS.map(f => (
                <button key={f.id} className={filter === f.id ? "on" : ""} onClick={() => setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>
            <span className="spacer" />
            <span className="faint" style={{ fontSize: 11.5 }}>
              {rows.length} {rows.length === 1 ? "record" : "records"}
              {query && <> · matching “{query}”</>}
            </span>
          </div>

          <table className="dt">
            <thead>
              <tr>
                <th>Visitor</th>
                <th className="t">Host</th>
                <th className="t">Purpose</th>
                <th>Arrived</th>
                <th>Wait</th>
                <th>On-site</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">
                      <span className="t">Nothing to show</span>
                      {query ? "No visitor matches that search." : "Checked-in guests appear here."}
                    </div>
                  </td>
                </tr>
              )}

              {rows.map(v => {
                const wait = v.status === "prereg" ? null
                  : v.meetingAt ? minutesBetween(v.checkInAt, v.meetingAt)
                  : v.status === "waiting" ? minutesBetween(v.checkInAt)
                  : null;
                const onSite = v.status === "prereg" ? null : minutesBetween(v.checkInAt, v.checkOutAt);

                return (
                  <tr key={v.id}>
                    <td>
                      <div className="sym-cell">
                        <Avatar name={v.visitor?.name || "?"} size={30} />
                        <div className="trunc">
                          <div className="tk trunc">{v.visitor?.name || "Unknown visitor"}</div>
                          <div className="ds trunc">{v.visitor?.organization || v.badgeNo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="t">
                      <div className="trunc">{v.host?.name || "—"}</div>
                      <div className="faint" style={{ fontSize: 11 }}>{v.host?.department || ""}</div>
                    </td>
                    <td className="t dim">{v.purpose}</td>
                    <td className="num">
                      {v.status === "prereg"
                        ? <span className="faint">~{timeOf(v.expectedAt)}</span>
                        : timeOf(v.checkInAt)}
                    </td>
                    <td className={"num " + (v.status === "waiting" ? "warn-text" : "dim")}
                      style={v.status === "waiting" ? { color: "var(--warn)" } : undefined}>
                      {wait == null ? "—" : humanDuration(wait)}
                    </td>
                    <td className="num dim">{onSite == null ? "—" : humanDuration(onSite)}</td>
                    <td>
                      <span className={"badge " + STATUS_STYLE[v.status]}>
                        <span className="badge-dot" />{STATUS_LABEL[v.status]}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {v.status === "waiting" && (
                        <button className="row-action" title="Start meeting"
                          aria-label={`Start meeting for ${v.visitor?.name}`} onClick={() => startMeeting(v)}>
                          <Icon name="arrowRight" size={14} />
                        </button>
                      )}
                      {ONSITE.includes(v.status) && (
                        <button className="row-action" title="Check out" style={{ marginLeft: 5 }}
                          aria-label={`Check out ${v.visitor?.name}`} onClick={() => checkOut(v)}>
                          <Icon name="arrowOut" size={14} />
                        </button>
                      )}
                      {v.status === "prereg" && (
                        <button className="row-action" title="Check in now"
                          aria-label={`Check in ${v.visitor?.name} now`} onClick={() => admit(v)}>
                          <Icon name="check" size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* ---- right rail ---- */}
        <div className="grid" style={{ gap: 14 }}>
          <section className="panel">
            <div className="panel-head"><h3>Today at a glance</h3></div>
            <div className="panel-body">
              <div className="breadth">
                <div className="seg-dn" style={{ width: `${pct(stats.waiting.length)}%` }} />
                <div className="seg-up" style={{ width: `${pct(stats.meeting.length)}%` }} />
                <div className="seg-fl" style={{ width: `${pct(stats.done.length)}%` }} />
                <div style={{ width: `${pct(stats.expected.length)}%`, background: "var(--accent)", opacity: 0.35 }} />
              </div>
              <div className="breadth-key">
                <span className="i"><span className="sw" style={{ background: "var(--warn)" }} />Waiting {FMT.int(stats.waiting.length)}</span>
                <span className="i"><span className="sw" style={{ background: "var(--up)" }} />In meeting {FMT.int(stats.meeting.length)}</span>
                <span className="i"><span className="sw" style={{ background: "var(--flat)", opacity: 0.4 }} />Departed {FMT.int(stats.done.length)}</span>
                <span className="i"><span className="sw" style={{ background: "var(--accent)", opacity: 0.35 }} />Expected {FMT.int(stats.expected.length)}</span>
              </div>
            </div>
            <div className="kv-grid">
              <div className="kv"><span className="k">Arrivals</span><span className="v">{FMT.int(stats.today.length)}</span></div>
              <div className="kv"><span className="k">On-site</span><span className="v">{FMT.int(stats.waiting.length + stats.meeting.length)}</span></div>
              <div className="kv"><span className="k">Avg wait</span><span className="v">{humanDuration(stats.avgWait)}</span></div>
              <div className="kv"><span className="k">Avg dwell</span><span className="v">{humanDuration(stats.avgDwell)}</span></div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>Activity</h3>
              <span className="spacer" />
              <span className="badge green"><span className="badge-dot" />Real-time</span>
            </div>
            <div className="panel-body">
              {activity.length === 0 && <div className="empty">Nothing has happened today — yet.</div>}
              <div className="timeline" style={{ margin: 0 }}>
                {activity.map(e => (
                  <div className={"tl-row " + ACT[e.kind].tone} key={e.id}>
                    <div className="tl-dot"><span className="d" /><span className="ln" /></div>
                    <div className="tl-body">
                      <div className="t trunc">
                        {e.who} <span className="faint" style={{ fontWeight: 400 }}>· {ACT[e.kind].what}</span>
                      </div>
                      <div className="s trunc">
                        {e.kind === "in" && `Waiting for ${e.visit.host?.name || "host"}`}
                        {e.kind === "meeting" && `Waited ${humanDuration(minutesBetween(e.visit.checkInAt, e.visit.meetingAt))}`}
                        {e.kind === "out" && `On-site ${humanDuration(e.dwell)}`}
                        {e.kind === "prereg" && `Expected ${timeOf(e.at)} · QR sent`}
                      </div>
                    </div>
                    <span className="faint num" style={{ fontSize: 11, flex: "none" }}>{relativeTime(e.at)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-foot">
              <Icon name="shield" size={14} style={{ color: "var(--up)" }} />
              All systems nominal · watchlist screening active
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
