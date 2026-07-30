import { useMemo, useState } from "react";
import Icon from "../../components/Icon";
import Avatar from "../../components/Avatar";
import Field from "../../components/Field";
import Drawer from "../../components/Drawer";
import ImagePicker from "../../components/ImagePicker";
import ConfirmModal from "../../components/ConfirmModal";
import MasterShell, { EmptyRow } from "./MasterShell";
import { ONSITE, DEPARTMENTS } from "../../data/constants";
import { nextKey, useApp, useOrgData, useSession, useToast } from "../../store/AppStore";
import { FMT, isToday } from "../../utils/format";

const EMPTY = {
  hostId: "", orgId: "", employeeId: "", name: "",
  department: DEPARTMENTS[0], designation: "", concern: "", photo: "",
};

export default function Hosts() {
  const { hosts: allHosts, dispatch } = useApp();
  const { org } = useSession();
  const { hosts, visits } = useOrgData();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hosts
      .filter(h => !q || h.name.toLowerCase().includes(q) || h.employeeId.toLowerCase().includes(q)
        || h.department.toLowerCase().includes(q) || (h.concern || "").toLowerCase().includes(q))
      .map(h => {
        const own = visits.filter(v => v.hostId === h.hostId);
        return {
          ...h,
          total: own.length,
          today: own.filter(v => v.checkInAt && isToday(v.checkInAt)).length,
          onsite: own.filter(v => ONSITE.includes(v.status)).length,
        };
      })
      .sort((a, b) => b.today - a.today || a.name.localeCompare(b.name));
  }, [hosts, visits, search]);

  const open = record => {
    setEditing(record
      ? { ...record }
      : { ...EMPTY, hostId: nextKey(allHosts, "hostId", "HST"), orgId: org.orgId, employeeId: "" });
    setErrors({});
  };

  const set = (k, v) => {
    setEditing(e => ({ ...e, [k]: v }));
    setErrors(e => (e[k] ? { ...e, [k]: null } : e));
  };

  const save = () => {
    const next = {};
    if (!editing.name.trim()) next.name = "Host name is required";
    if (!editing.employeeId.trim()) next.employeeId = "Employee ID is required";
    else if (hosts.some(h => h.employeeId.toLowerCase() === editing.employeeId.trim().toLowerCase()
      && h.hostId !== editing.hostId)) {
      next.employeeId = "Another host already has this employee ID";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const isNew = !allHosts.some(h => h.hostId === editing.hostId);
    dispatch({
      type: "upsert",
      entity: "hosts",
      record: { ...editing, name: editing.name.trim(), employeeId: editing.employeeId.trim() },
    });
    toast(isNew ? "Host added" : "Host updated", "ok", `${editing.hostId} · ${editing.name}`);
    setEditing(null);
  };

  const remove = () => {
    dispatch({ type: "remove", entity: "hosts", id: confirm.hostId });
    toast("Host deleted", "warn", confirm.name);
    setConfirm(null);
    setEditing(null);
  };

  const refCount = id => visits.filter(v => v.hostId === id).length;

  return (
    <>
      <MasterShell
        title="Host master"
        sub={`Employees who receive visitors at ${org.name}`}
        search={search} onSearch={setSearch} placeholder="Name, ID or department…"
        onNew={() => open(null)} newLabel="New host"
        count={FMT.int(rows.length)} countLabel="Hosts"
      >
        <table className="dt">
          <thead>
            <tr>
              <th>Host</th>
              <th className="t">Department</th>
              <th className="t">Designation</th>
              <th className="t">Concern</th>
              <th>On-site</th>
              <th>Today</th>
              <th>Total</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={8} search={search} noun="host" />}
            {rows.map(h => (
              <tr key={h.hostId}>
                <td>
                  <div className="sym-cell">
                    <Avatar name={h.name} size={30} src={h.photo} />
                    <div className="trunc">
                      <div className="tk trunc">{h.name}</div>
                      <div className="ds">{h.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="t">{h.department}</td>
                <td className="t dim">{h.designation || "—"}</td>
                <td className="t dim trunc">{h.concern || "—"}</td>
                <td className="num">
                  {h.onsite
                    ? <span className="badge green"><span className="badge-dot" />{h.onsite}</span>
                    : <span className="faint">—</span>}
                </td>
                <td className="num">{FMT.int(h.today)}</td>
                <td className="num dim">{FMT.int(h.total)}</td>
                <td>
                  <button className="row-action" onClick={() => open(h)}
                    title="Edit" aria-label={`Edit ${h.name}`}>
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
          title={allHosts.some(h => h.hostId === editing.hostId) ? editing.name || "Host" : "New host"}
          subtitle={`${editing.hostId} · ${org.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              {allHosts.some(h => h.hostId === editing.hostId) && (
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
            <Avatar name={editing.name || "?"} size={44} src={editing.photo} />
            <div className="trunc">
              <div className="n trunc">{editing.name || "New host"}</div>
              <div className="s">{editing.employeeId || "no employee ID"}</div>
            </div>
          </div>

          <ImagePicker label="Photo" value={editing.photo} onChange={v => set("photo", v)} maxDim={320} />

          <div className="f2">
            <Field label="Employee ID" required error={errors.employeeId} icon="badge">
              <input value={editing.employeeId} onChange={e => set("employeeId", e.target.value)} placeholder="EMP-1001" />
            </Field>
            <Field label="Full name" required error={errors.name} icon="user">
              <input value={editing.name} onChange={e => set("name", e.target.value)} placeholder="Sarah Ahmed" />
            </Field>
          </div>

          <div className="f2">
            <Field label="Department" select icon="users">
              <select value={editing.department} onChange={e => set("department", e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Designation" icon="doc">
              <input value={editing.designation} onChange={e => set("designation", e.target.value)}
                placeholder="Engineering Manager" />
            </Field>
          </div>

          <Field label="Concern" icon="pin" hint="What this host is the point of contact for.">
            <input value={editing.concern} onChange={e => set("concern", e.target.value)}
              placeholder="Product & platform teams" />
          </Field>
        </Drawer>
      )}

      {confirm && (
        <ConfirmModal
          danger
          title={`Delete ${confirm.name}?`}
          body={refCount(confirm.hostId)
            ? "This host has visits on record. Those visits are kept, but their host column will read as unassigned."
            : "This host has no visits on record and can be removed cleanly."}
          rows={[
            { k: "Visits referencing this host", v: FMT.int(refCount(confirm.hostId)) },
            { k: "Reversible", v: "No", tone: "down" },
          ]}
          confirmLabel="Delete host"
          onConfirm={remove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
