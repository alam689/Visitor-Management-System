import { useMemo, useState } from "react";
import Icon from "../../components/Icon";
import Field from "../../components/Field";
import Drawer from "../../components/Drawer";
import ConfirmModal from "../../components/ConfirmModal";
import MasterShell, { EmptyRow } from "./MasterShell";
import { nextKey, useApp, useSession, useToast } from "../../store/AppStore";
import { WEEKDAYS } from "../../data/constants";
import { FMT } from "../../utils/format";

const EMPTY = {
  orgId: "", name: "", address: "", contactNumber: "", email: "", website: "",
  contactPerson: "", slotStart: "09:00", slotEnd: "18:00", slotDays: [0, 1, 2, 3, 4],
};

export default function Organizations() {
  const { organizations, users, hosts, visits, dispatch } = useApp();
  const { org: currentOrg } = useSession();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return organizations
      .filter(o => !q || o.name.toLowerCase().includes(q) || o.orgId.toLowerCase().includes(q)
        || (o.contactPerson || "").toLowerCase().includes(q))
      .map(o => ({
        ...o,
        users: users.filter(u => u.orgId === o.orgId).length,
        hosts: hosts.filter(h => h.orgId === o.orgId).length,
        visits: visits.filter(v => v.orgId === o.orgId).length,
      }));
  }, [organizations, users, hosts, visits, search]);

  const open = record => {
    setEditing(record ? { ...record } : { ...EMPTY, orgId: nextKey(organizations, "orgId", "ORG") });
    setErrors({});
  };

  const set = (k, v) => {
    setEditing(e => ({ ...e, [k]: v }));
    setErrors(e => (e[k] ? { ...e, [k]: null } : e));
  };

  const toggleDay = d =>
    setEditing(e => ({
      ...e,
      slotDays: e.slotDays.includes(d) ? e.slotDays.filter(x => x !== d) : [...e.slotDays, d].sort(),
    }));

  const save = () => {
    const next = {};
    if (!editing.name.trim()) next.name = "Organization name is required";
    if (editing.slotEnd <= editing.slotStart) next.slotEnd = "Closing time must be after opening";
    setErrors(next);
    if (Object.keys(next).length) return;

    const isNew = !organizations.some(o => o.orgId === editing.orgId);
    dispatch({
      type: "upsert",
      entity: "organizations",
      record: { ...editing, name: editing.name.trim(), createdAt: editing.createdAt || new Date().toISOString() },
    });
    toast(isNew ? "Organization added" : "Organization updated", "ok", `${editing.orgId} · ${editing.name}`);
    setEditing(null);
  };

  const remove = () => {
    dispatch({ type: "remove", entity: "organizations", id: confirm.orgId });
    toast("Organization deleted", "warn", confirm.orgId);
    setConfirm(null);
    setEditing(null);
  };

  return (
    <>
      <MasterShell
        title="Organizations"
        sub="Tenant records — each one has its own hosts, visitors and visit history"
        search={search} onSearch={setSearch} placeholder="Name or ID…"
        onNew={() => open(null)} newLabel="New organization"
        count={FMT.int(rows.length)} countLabel="Organization master"
      >
        <table className="dt">
          <thead>
            <tr>
              <th>Organization</th>
              <th className="t">Contact person</th>
              <th className="t">Contact</th>
              <th>Visiting slot</th>
              <th>Hosts</th>
              <th>Users</th>
              <th>Visits</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={8} search={search} noun="organization" />}
            {rows.map(o => (
              <tr key={o.orgId}>
                <td>
                  <div className="sym-cell">
                    <span className="sym-tag"><Icon name="pin" size={14} /></span>
                    <div className="trunc">
                      <div className="tk trunc">
                        {o.name}
                        {o.orgId === currentOrg.orgId && (
                          <span className="badge blue" style={{ marginLeft: 8 }}>Signed in</span>
                        )}
                      </div>
                      <div className="ds">{o.orgId}</div>
                    </div>
                  </div>
                </td>
                <td className="t">{o.contactPerson || "—"}</td>
                <td className="t dim">
                  <div className="trunc">{o.contactNumber || "—"}</div>
                  <div className="faint trunc" style={{ fontSize: 11 }}>{o.email || ""}</div>
                </td>
                <td className="num">{o.slotStart}–{o.slotEnd}</td>
                <td className="num">{FMT.int(o.hosts)}</td>
                <td className="num">{FMT.int(o.users)}</td>
                <td className="num dim">{FMT.int(o.visits)}</td>
                <td>
                  <button className="row-action" onClick={() => open(o)}
                    title="Edit" aria-label={`Edit ${o.name}`}>
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
          title={organizations.some(o => o.orgId === editing.orgId) ? editing.name || "Organization" : "New organization"}
          subtitle={editing.orgId}
          onClose={() => setEditing(null)}
          footer={
            <>
              {organizations.some(o => o.orgId === editing.orgId) && editing.orgId !== currentOrg.orgId && (
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
          <Field label="Organization name" required error={errors.name} icon="pin">
            <input value={editing.name} onChange={e => set("name", e.target.value)} placeholder="Northwind Studios" />
          </Field>
          <Field label="Address" icon="pin">
            <input value={editing.address} onChange={e => set("address", e.target.value)}
              placeholder="House 42, Road 11, Banani, Dhaka" />
          </Field>
          <div className="f2">
            <Field label="Contact number" icon="phone">
              <input value={editing.contactNumber} onChange={e => set("contactNumber", e.target.value)}
                placeholder="+880 2 9876543" inputMode="tel" />
            </Field>
            <Field label="Contact person" icon="user">
              <input value={editing.contactPerson} onChange={e => set("contactPerson", e.target.value)}
                placeholder="Nadia Islam" />
            </Field>
          </div>
          <div className="f2">
            <Field label="Email" icon="mail">
              <input value={editing.email} onChange={e => set("email", e.target.value)}
                placeholder="reception@example.com" inputMode="email" />
            </Field>
            <Field label="Website" icon="search">
              <input value={editing.website} onChange={e => set("website", e.target.value)}
                placeholder="www.example.com" />
            </Field>
          </div>

          <div className="divider" />

          <div className="f2">
            <Field label="Visiting from" icon="clock">
              <input type="time" value={editing.slotStart} onChange={e => set("slotStart", e.target.value)} />
            </Field>
            <Field label="Visiting until" error={errors.slotEnd} icon="clock">
              <input type="time" value={editing.slotEnd} onChange={e => set("slotEnd", e.target.value)} />
            </Field>
          </div>

          <div className="rf">
            <label>Visiting days</label>
            <div className="pill-row">
              {WEEKDAYS.map((d, i) => (
                <button key={d} className={"pill-opt" + (editing.slotDays.includes(i) ? " on" : "")}
                  onClick={() => toggleDay(i)}>{d}</button>
              ))}
            </div>
            <span className="rf-err" style={{ color: "var(--text-faint)" }}>
              Check-in outside these hours is flagged, not blocked.
            </span>
          </div>
        </Drawer>
      )}

      {confirm && (
        <ConfirmModal
          danger
          title={`Delete ${confirm.name}?`}
          body="The organization record is removed. Its hosts, users, visitors and visits stay in storage but will no longer be reachable."
          rows={[
            { k: "Hosts", v: FMT.int(hosts.filter(h => h.orgId === confirm.orgId).length) },
            { k: "Users", v: FMT.int(users.filter(u => u.orgId === confirm.orgId).length) },
            { k: "Visits", v: FMT.int(visits.filter(v => v.orgId === confirm.orgId).length) },
            { k: "Reversible", v: "No", tone: "down" },
          ]}
          confirmLabel="Delete organization"
          onConfirm={remove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
