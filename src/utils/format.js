export const pad2 = n => String(n).padStart(2, "0");

export const timeOf = iso => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const dateLabel = (d = new Date()) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export const isSameDay = (a, b) => {
  const x = new Date(a), y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
};

export const isToday = iso => isSameDay(iso, new Date());

export const daysAgo = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/** Minutes between two ISO stamps (or from `from` to now). */
export const minutesBetween = (from, to) =>
  Math.max(0, Math.round((new Date(to || Date.now()) - new Date(from)) / 60000));

/** 102 -> "1h 42m", 45 -> "45m" */
export const humanDuration = mins => {
  if (mins == null || Number.isNaN(mins)) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

/** Relative label for the activity feed. Falls back to a clock time for
    anything older than an hour — or scheduled in the future. */
export const relativeTime = iso => {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins >= 0 && mins < 1) return "just now";
  if (mins > 0 && mins < 60) return `${mins}m ago`;
  if (isToday(iso)) return timeOf(iso);
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export const fullName = v => `${v.first} ${v.last}`.trim();

/* Number formatting lives here and only here — never call toFixed in a
   component. `null` reads as an em dash, positives always carry their sign. */
export const FMT = {
  n:    (v, d = 2) => v == null ? "—" : Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }),
  int:  v => v == null ? "—" : Number(v).toLocaleString("en-US"),
  pct:  v => v == null ? "—" : (v > 0 ? "+" : "") + Number(v).toFixed(0) + "%",
  sign: (v, d = 0) => v == null ? "—" : (v > 0 ? "+" : "") + Number(v).toFixed(d),
  share: v => v == null ? "—" : Number(v).toFixed(0) + "%",
  big: v => {
    if (v == null) return "—";
    if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
    return String(v);
  },
};

export const toCSV = (rows, columns) => {
  const esc = val => {
    const s = val == null ? "" : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map(c => esc(c.label)).join(",");
  const body = rows.map(r => columns.map(c => esc(c.get(r))).join(",")).join("\n");
  return `${head}\n${body}`;
};

export const downloadFile = (filename, contents, mime = "text/csv;charset=utf-8") => {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
