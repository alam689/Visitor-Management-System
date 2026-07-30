import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import { useOrgData, useSession, useToast } from "../store/AppStore";
import { ONSITE, PURPOSES, PURPOSE_COLORS } from "../data/constants";
import { FMT, downloadFile, humanDuration, minutesBetween, toCSV } from "../utils/format";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const HOUR_START = 8;
const HOUR_COUNT = 12;
const HOUR_LABELS = ["8a", "9", "10", "11", "12p", "1", "2", "3", "4", "5", "6", "7"];

/* Hand-rolled inline SVG — gridlines at max/mid/zero, mono labels, one accent. */
function HourChart({ values, labels }) {
  const W = 620, H = 170, PAD_L = 26, PAD_B = 20, PAD_T = 8;
  const max = Math.max(1, ...values);
  const plotH = H - PAD_B - PAD_T;
  const slot = (W - PAD_L) / values.length;
  const barW = Math.max(4, slot * 0.56);
  const y = v => PAD_T + plotH - (v / max) * plotH;

  const lines = [
    { v: max, label: FMT.int(max) },
    { v: Math.round(max / 2), label: FMT.int(Math.round(max / 2)) },
    { v: 0, label: "0" },
  ];

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} height={H} role="img" aria-label="Arrivals by hour">
      {lines.map(l => (
        <g key={l.v}>
          <line className="gl" x1={PAD_L} x2={W} y1={y(l.v)} y2={y(l.v)} />
          <text className="gt" x={PAD_L - 6} y={y(l.v) + 3} textAnchor="end">{l.label}</text>
        </g>
      ))}
      {values.map((v, i) => {
        const h = Math.max(v > 0 ? 2 : 0, (v / max) * plotH);
        return (
          <g className="col" key={i}>
            <rect className={"bar" + (v === max && v > 0 ? " peak" : "")}
              x={PAD_L + i * slot + (slot - barW) / 2} y={PAD_T + plotH - h}
              width={barW} height={h} rx={3}>
              <title>{`${labels[i]} — ${v} arrival${v === 1 ? "" : "s"}`}</title>
            </rect>
            <text className="ax" x={PAD_L + i * slot + slot / 2} y={H - 6} textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DistRow({ label, value, max, suffix }) {
  return (
    <div className="dist-row">
      <span className="fillbar" style={{ width: `${(value / max) * 100}%`, background: "var(--accent-bar)" }} />
      <span className="lb">{label}</span>
      <span className="vl num">{FMT.int(value)}</span>
      <span className="pc">{suffix}</span>
    </div>
  );
}

export default function Reports() {
  const { visits, expand } = useOrgData();
  const { user, org } = useSession();
  const toast = useToast();
  const [range, setRange] = useState("month");

  const since = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (range === "week" ? 6 : 29));
    return d;
  }, [range]);

  const inRange = useMemo(
    () => visits.filter(v => v.checkInAt && new Date(v.checkInAt) >= since).map(expand),
    [visits, since, expand]
  );

  const stats = useMemo(() => {
    const total = inRange.length;
    const unique = new Set(inRange.map(v => v.visitorId)).size;

    const byDay = DAY_NAMES.map(day => ({ day, value: 0 }));
    const byHour = Array.from({ length: HOUR_COUNT }, () => 0);
    const byPurpose = new Map(PURPOSES.map(p => [p, 0]));
    const byHost = new Map();

    let dwellSum = 0, dwellCount = 0, waitSum = 0, waitCount = 0;

    for (const v of inRange) {
      const d = new Date(v.checkInAt);
      byDay[d.getDay()].value++;

      const slot = d.getHours() - HOUR_START;
      if (slot >= 0 && slot < HOUR_COUNT) byHour[slot]++;

      byPurpose.set(v.purpose, (byPurpose.get(v.purpose) || 0) + 1);

      const hostName = v.host?.name || "Unassigned";
      byHost.set(hostName, (byHost.get(hostName) || 0) + 1);

      if (v.checkOutAt) {
        dwellSum += minutesBetween(v.checkInAt, v.checkOutAt);
        dwellCount++;
      }
      if (v.meetingAt) {
        waitSum += minutesBetween(v.checkInAt, v.meetingAt);
        waitCount++;
      }
    }

    const dayRows = DAY_ORDER.map(i => byDay[i]).filter(r => r.value > 0 || total === 0);
    const peakSlot = byHour.indexOf(Math.max(...byHour));

    const purposeSegments = PURPOSES.map((p, i) => ({
      label: p,
      value: byPurpose.get(p) || 0,
      color: PURPOSE_COLORS[i % PURPOSE_COLORS.length],
      pct: total ? Math.round(((byPurpose.get(p) || 0) / total) * 100) : 0,
    })).filter(s => s.value > 0);

    const topHosts = [...byHost.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return {
      total, unique, dayRows, byHour, peakSlot,
      avgDwell: dwellCount ? Math.round(dwellSum / dwellCount) : 0,
      avgWait: waitCount ? Math.round(waitSum / waitCount) : 0,
      completed: dwellCount,
      purposeSegments, topHosts,
      onsite: visits.filter(v => ONSITE.includes(v.status)).length,
      kiosk: inRange.filter(v => v.source === "kiosk").length,
    };
  }, [inRange, visits]);

  const exportCSV = () => {
    if (!inRange.length) {
      toast("Nothing to export", "warn", "No visits in the selected range");
      return;
    }
    const csv = toCSV(inRange, [
      { label: "Badge", get: v => v.badgeNo },
      { label: "Visitor ID", get: v => v.visitorId },
      { label: "Visitor", get: v => v.visitor?.name || "" },
      { label: "Mobile", get: v => v.visitor?.mobile || "" },
      { label: "Visitor organization", get: v => v.visitor?.organization || "" },
      { label: "Host", get: v => v.host?.name || "" },
      { label: "Department", get: v => v.host?.department || "" },
      { label: "Purpose", get: v => v.purpose },
      { label: "Checked in", get: v => new Date(v.checkInAt).toLocaleString("en-GB") },
      { label: "Meeting started", get: v => (v.meetingAt ? new Date(v.meetingAt).toLocaleString("en-GB") : "") },
      { label: "Checked out", get: v => (v.checkOutAt ? new Date(v.checkOutAt).toLocaleString("en-GB") : "") },
      { label: "Wait (min)", get: v => (v.meetingAt ? minutesBetween(v.checkInAt, v.meetingAt) : "") },
      { label: "Dwell (min)", get: v => (v.checkOutAt ? minutesBetween(v.checkInAt, v.checkOutAt) : "") },
      { label: "Source", get: v => v.source },
    ]);
    downloadFile(`foyer-${org.orgId}-${range}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast(`Exported ${inRange.length} visits`, "ok", `${range === "week" ? "Last 7" : "Last 30"} days · CSV`);
  };

  const clock = h => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
  const peakHour = HOUR_START + stats.peakSlot;
  const peakLabel = stats.total ? `${clock(peakHour)}–${clock(peakHour + 1)}` : "—";
  const rangeLabel = range === "week" ? "Last 7 days" : "Last 30 days";

  const summary = [
    { k: "Total visits", v: FMT.int(stats.total), s: rangeLabel },
    { k: "Unique visitors", v: FMT.int(stats.unique), s: stats.unique ? `${(stats.total / stats.unique).toFixed(1)} visits each` : "—" },
    { k: "Peak hour", v: peakLabel, s: `${FMT.int(Math.max(0, ...stats.byHour))} arrivals in that hour` },
    { k: "Avg wait", v: humanDuration(stats.avgWait), s: "Check-in to meeting start" },
    { k: "Avg dwell", v: humanDuration(stats.avgDwell), s: `${stats.completed} completed visits` },
    { k: "Self check-in", v: FMT.share(stats.total ? (stats.kiosk / stats.total) * 100 : 0), s: "Arrived via the kiosk" },
  ];

  const dayMax = Math.max(1, ...stats.dayRows.map(d => d.value));
  const hostMax = Math.max(1, ...stats.topHosts.map(h => h.value));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-sub">{org.name} · {rangeLabel.toLowerCase()}</div>
        </div>
        <span className="spacer" />
        <div className="seg">
          <button className={range === "week" ? "on" : ""} onClick={() => setRange("week")}>Week</button>
          <button className={range === "month" ? "on" : ""} onClick={() => setRange("month")}>Month</button>
        </div>
        {user.userType !== "host" && (
          <button className="btn" onClick={exportCSV}><Icon name="download" /> Export CSV</button>
        )}
      </div>

      <div className="grid g-6" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginBottom: 14 }}>
        {summary.map(s => (
          <div className="stat-card" key={s.k}>
            <span className="lbl">{s.k}</span>
            <div className="big">{s.v}</div>
            <div className="sub trunc">{s.s}</div>
          </div>
        ))}
      </div>

      <div className="grid g-2" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}>
        <section className="panel">
          <div className="panel-head">
            <h3>Arrivals by hour</h3>
            <span className="spacer" />
            <span className="badge blue"><span className="badge-dot" />Peak {peakLabel}</span>
          </div>
          <div className="panel-body">
            <HourChart values={stats.byHour} labels={HOUR_LABELS} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Visits by day</h3>
            <span className="spacer" />
            <span className="faint num" style={{ fontSize: 11.5 }}>{FMT.int(stats.total)} total</span>
          </div>
          <div className="panel-body" style={{ padding: "8px 6px" }}>
            {stats.dayRows.map(d => (
              <DistRow key={d.day} label={d.day} value={d.value} max={dayMax}
                suffix={stats.total ? `${Math.round((d.value / stats.total) * 100)}%` : "0%"} />
            ))}
            {stats.dayRows.length === 0 && <div className="empty">No visits in this range.</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Visit purpose</h3>
            <span className="spacer" />
            <span className="faint" style={{ fontSize: 11.5 }}>{rangeLabel}</span>
          </div>
          <div className="panel-body">
            <div className="breadth">
              {stats.purposeSegments.map(s => (
                <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} title={`${s.label} — ${s.pct}%`} />
              ))}
            </div>
          </div>
          <table className="dt">
            <thead>
              <tr><th>Purpose</th><th>Visits</th><th>Share</th></tr>
            </thead>
            <tbody>
              {stats.purposeSegments.map(s => (
                <tr key={s.label}>
                  <td>
                    <span className="sym-cell">
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flex: "none" }} />
                      {s.label}
                    </span>
                  </td>
                  <td className="num">{FMT.int(s.value)}</td>
                  <td className="num dim">{FMT.share(s.pct)}</td>
                </tr>
              ))}
              {stats.purposeSegments.length === 0 && (
                <tr><td colSpan={3}><div className="empty">No visits in this range.</div></td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Busiest hosts</h3>
            <span className="spacer" />
            <span className="faint" style={{ fontSize: 11.5 }}>By visitors received</span>
          </div>
          <div className="panel-body" style={{ padding: "8px 6px" }}>
            {stats.topHosts.map(h => (
              <DistRow key={h.name} label={h.name} value={h.value} max={hostMax}
                suffix={stats.total ? `${Math.round((h.value / stats.total) * 100)}%` : "0%"} />
            ))}
            {stats.topHosts.length === 0 && <div className="empty">No visits in this range.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
