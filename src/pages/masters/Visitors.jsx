import { useMemo, useState } from "react";
import Icon from "../../components/Icon";
import Avatar from "../../components/Avatar";
import Field from "../../components/Field";
import Drawer from "../../components/Drawer";
import ImagePicker from "../../components/ImagePicker";
import ConfirmModal from "../../components/ConfirmModal";
import MasterShell, { EmptyRow } from "./MasterShell";
import { ONSITE, STATUS_LABEL, STATUS_STYLE } from "../../data/constants";
import { nextKey, useApp, useOrgData, useSession, useToast } from "../../store/AppStore";
import { FMT, dateLabel, humanDuration, minutesBetween, timeOf } from "../../utils/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[+\d][\d\s-]{6,}$/;

const EMPTY = { visitorId: "", orgId: "", name: "", mobile: "", email: "", organization: "", cardImage: "" };

export default function Visitors() {
  const { visitors: allVisitors, dispatch } = useApp();
  const { org } = useSession();
  const { visitors, visits, hostById } = useOrgData();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return visitors
      .filter(v => !q
        || v.name.toLowerCase().includes(q)
        || (digits.length >= 3 && v.mobile.replace(/\D/g, "").includes(digits))
        || (v.organization || "").toLowerCase().includes(q)
        || v.visitorId.toLowerCase().includes(q))
      .map(v => {
        const own = visits.filter(x => x.visitorId === v.visitorId);
        const last = own.reduce(
          (a, b) => (!a || new Date(b.checkInAt || 0) > new Date(a.checkInAt || 0) ? b : a),
          null
        );
        return {
          ...v,
          total: own.length,
          last,
          onsite: own.some(x => ONSITE.includes(x.status)),
        };
      })
      .sort((a, b) => new Date(b.last?.checkInAt || 0) - new Date(a.last?.checkInAt || 0));
  }, [visitors, visits, search]);

  const open = record => {
    setEditing(record
      ? { ...record }
      : { ...EMPTY, visitorId: nextKey(allVisitors, "visitorId", "VIS"), orgId: org.orgId });
    setErrors({});
  };

  const set = (k, v) => {
    setEditing(e => ({ ...e, [k]: v }));
    setErrors(e => (e[k] ? { ...e, [k]: null } : e));
  };

  const save = () => {
    const next = {};
    if (!editing.name.trim()) next.name = "Visitor name is required";
    if (!editing.mobile.trim()) next.mobile = "Mobile number is required";
    else if (!MOBILE_RE.test(editing.mobile.trim())) next.mobile = "That doesn't look like a phone number";
    else if (visitors.some(v => v.mobile.replace(/\D/g, "") === editing.mobile.replace(/\D/g, "")
      && v.visitorId !== editing.visitorId)) {
      next.mobile = "Another visitor already has this mobile number";
    }
    if (editing.email && !EMAIL_RE.test(editing.email)) next.email = "That doesn't look like an email address";
    setErrors(next);
    if (Object.keys(next).length) return;

    const isNew = !allVisitors.some(v => v.visitorId === editing.visitorId);
    dispatch({
      type: "upsert",
      entity: "visitors",
      record: {
        ...editing,
        name: editing.name.trim(),
        mobile: editing.mobile.trim(),
        createdAt: editing.createdAt || new Date().toISOString(),
      },
    });
    toast(isNew ? "Visitor added" : "Visitor updated", "ok", `${editing.visitorId} · ${editing.name}`);
    setEditing(null);
  };

  const remove = () => {
    dispatch({ type: "remove", entity: "visitors", id: confirm.visitorId });
    toast("Visitor deleted", "warn", confirm.name);
    setConfirm(null);
    setEditing(null);
  };

  const history = id => visits
    .filter(v => v.visitorId === id)
    .sort((a, b) => new Date(b.checkInAt || b.expectedAt || 0) - new Date(a.checkInAt || a.expectedAt || 0))
    .slice(0, 6);

  const refCount = id => visits.filter(v => v.visitorId === id).length;

  return (
    <>
      <MasterShell
        title="Visitor master"
        sub="Everyone who has ever signed in — matched on mobile at the next check-in"
        search={search} onSearch={setSearch} placeholder="Mobile, name or company…"
        onNew={() => open(null)} newLabel="New visitor"
        count={FMT.int(rows.length)} countLabel="Visitors"
      >
        <table className="dt">
          <thead>
            <tr>
              <th>Visitor</th>
              <th className="t">Mobile</th>
              <th className="t">Organization</th>
              <th className="t">Email</th>
              <th>Visits</th>
              <th>Last visit</th>
              <th>Card</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={8} search={search} noun="visitor" />}
            {rows.map(v => (
              <tr key={v.visitorId}>
                <td>
                  <div className="sym-cell">
                    <Avatar name={v.name} size={30} src={v.cardImage} />
                    <div className="trunc">
                      <div className="tk trunc">
                        {v.name}
                        {v.onsite && <span className="badge green" style={{ marginLeft: 8 }}>On-site</span>}
                      </div>
                      <div className="ds">{v.visitorId}</div>
                    </div>
                  </div>
                </td>
                <td className="t num">{v.mobile}</td>
                <td className="t dim trunc">{v.organization || "—"}</td>
                <td className="t faint trunc">{v.email || "—"}</td>
                <td className="num">{FMT.int(v.total)}</td>
                <td className="num dim">
                  {v.last?.checkInAt ? dateLabel(new Date(v.last.checkInAt)) : "—"}
                </td>
                <td>
                  {v.cardImage
                    ? <span className="badge blue">Stored</span>
                    : <span className="faint">—</span>}
                </td>
                <td>
                  <button className="row-action" onClick={() => open(v)}
                    title="Open record" aria-label={`Open ${v.name}`}>
                    <Icon name="doc" size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </MasterShell>

      {editing && (
        <Drawer
          wide
          title={allVisitors.some(v => v.visitorId === editing.visitorId) ? editing.name || "Visitor" : "New visitor"}
          subtitle={`${editing.visitorId} · ${org.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              {allVisitors.some(v => v.visitorId === editing.visitorId) && (
                <button className="btn btn-ghost" onClick={() => setConfirm(editing)}>
                  <Icon name="trash" /> Delete
                </button>
              )}
              <span style={{ flex: 1 }} />
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </>
          }
        >
          <div className="rec-head">
            <Avatar name={editing.name || "?"} size={44} src={editing.cardImage} />
            <div className="trunc">
              <div className="n trunc">{editing.name || "New visitor"}</div>
              <div className="s">{editing.mobile || "no mobile on file"}</div>
            </div>
          </div>

          <div className="f2">
            <Field label="Mobile number" required error={errors.mobile} icon="phone">
              <input value={editing.mobile} onChange={e => set("mobile", e.target.value)}
                placeholder="+880 17…" inputMode="tel" />
            </Field>
            <Field label="Full name" required error={errors.name} icon="user">
              <input value={editing.name} onChange={e => set("name", e.target.value)} placeholder="Amina Rahman" />
            </Field>
          </div>

          <div className="f2">
            <Field label="Email address" error={errors.email} icon="mail">
              <input value={editing.email} onChange={e => set("email", e.target.value)}
                placeholder="amina@company.com" inputMode="email" />
            </Field>
            <Field label="Visitor organization" icon="pin">
              <input value={editing.organization} onChange={e => set("organization", e.target.value)}
                placeholder="Sunstone Partners" />
            </Field>
          </div>

          <ImagePicker label="Visiting card" card value={editing.cardImage} onChange={v => set("cardImage", v)} />

          {refCount(editing.visitorId) > 0 && (
            <>
              <div className="divider" />
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Visit history</h3>
              <div className="timeline" style={{ margin: 0 }}>
                {history(editing.visitorId).map(v => {
                  const host = hostById(v.hostId);
                  return (
                    <div className={"tl-row " + (ONSITE.includes(v.status) ? "active" : "done")} key={v.id}>
                      <div className="tl-dot"><span className="d" /><span className="ln" /></div>
                      <div className="tl-body">
                        <div className="t trunc">
                          {v.purpose} <span className="faint" style={{ fontWeight: 400 }}>· {host?.name || "—"}</span>
                        </div>
                        <div className="s">
                          {v.checkInAt ? `${dateLabel(new Date(v.checkInAt))} · ${timeOf(v.checkInAt)}` : "Expected"}
                          {v.checkOutAt && ` · stayed ${humanDuration(minutesBetween(v.checkInAt, v.checkOutAt))}`}
                        </div>
                      </div>
                      <span className={"badge " + STATUS_STYLE[v.status]} style={{ flex: "none" }}>
                        {STATUS_LABEL[v.status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Drawer>
      )}

      {confirm && (
        <ConfirmModal
          danger
          title={`Delete ${confirm.name}?`}
          body={refCount(confirm.visitorId)
            ? "This visitor has visits on record. Those visits are kept, but their visitor column will read as unknown."
            : "This visitor has never signed in and can be removed cleanly."}
          rows={[
            { k: "Visits referencing this visitor", v: FMT.int(refCount(confirm.visitorId)) },
            { k: "Reversible", v: "No", tone: "down" },
          ]}
          confirmLabel="Delete visitor"
          onConfirm={remove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
