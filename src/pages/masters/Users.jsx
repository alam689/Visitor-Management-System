import { useMemo, useState } from "react";
import Icon from "../../components/Icon";
import Avatar from "../../components/Avatar";
import Field from "../../components/Field";
import Drawer from "../../components/Drawer";
import Toggle from "../../components/Toggle";
import ConfirmModal from "../../components/ConfirmModal";
import MasterShell, { EmptyRow } from "./MasterShell";
import { USER_TYPES, userTypeLabel } from "../../data/constants";
import { nextKey, useApp, useOrgData, useSession, useToast } from "../../store/AppStore";
import { FMT } from "../../utils/format";

const EMPTY = {
  userId: "", orgId: "", loginId: "", password: "", userType: "reception",
  employeeId: "", name: "", active: true,
};

const TYPE_TONE = { admin: "blue", reception: "green", host: "grey" };

export default function Users() {
  const { users: allUsers, dispatch } = useApp();
  const { org, user: me } = useSession();
  const { users, hosts } = useOrgData();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [showPw, setShowPw] = useState(false);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter(u => !q || u.loginId.toLowerCase().includes(q) || (u.name || "").toLowerCase().includes(q)
        || (u.employeeId || "").toLowerCase().includes(q) || u.userType.includes(q))
      .sort((a, b) => a.userType.localeCompare(b.userType) || a.loginId.localeCompare(b.loginId));
  }, [users, search]);

  const open = record => {
    setEditing(record ? { ...record } : { ...EMPTY, userId: nextKey(allUsers, "userId", "USR"), orgId: org.orgId });
    setErrors({});
    setShowPw(false);
  };

  const set = (k, v) => {
    setEditing(e => ({ ...e, [k]: v }));
    setErrors(e => (e[k] ? { ...e, [k]: null } : e));
  };

  const save = () => {
    const next = {};
    if (!editing.loginId.trim()) next.loginId = "User ID is required";
    else if (allUsers.some(u => u.loginId.toLowerCase() === editing.loginId.trim().toLowerCase()
      && u.userId !== editing.userId)) {
      /* Sign-in matches on login ID alone, so it has to be unique across
         every organization, not just this one. */
      next.loginId = "That user ID is already taken";
    }
    if (!editing.password) next.password = "Password is required";
    else if (editing.password.length < 6) next.password = "Use at least six characters";
    setErrors(next);
    if (Object.keys(next).length) return;

    const isNew = !allUsers.some(u => u.userId === editing.userId);
    dispatch({
      type: "upsert",
      entity: "users",
      record: { ...editing, loginId: editing.loginId.trim().toLowerCase(), name: editing.name.trim() },
    });
    toast(isNew ? "User added" : "User updated", "ok", `${editing.loginId} · ${userTypeLabel(editing.userType)}`);
    setEditing(null);
  };

  const remove = () => {
    dispatch({ type: "remove", entity: "users", id: confirm.userId });
    toast("User deleted", "warn", confirm.loginId);
    setConfirm(null);
    setEditing(null);
  };

  const isMe = u => u.userId === me.userId;
  const admins = users.filter(u => u.userType === "admin" && u.active !== false);
  /* Never let the last administrator lock everyone out of the org. */
  const lastAdmin = u => u.userType === "admin" && admins.length <= 1 && admins.some(a => a.userId === u.userId);

  return (
    <>
      <MasterShell
        title="Users"
        sub={`Sign-in accounts for ${org.name}`}
        search={search} onSearch={setSearch} placeholder="User ID, name or role…"
        onNew={() => open(null)} newLabel="New user"
        count={FMT.int(rows.length)} countLabel="User master"
      >
        <table className="dt">
          <thead>
            <tr>
              <th>User</th>
              <th className="t">User type</th>
              <th className="t">Employee ID</th>
              <th className="t">Linked host</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={6} search={search} noun="user" />}
            {rows.map(u => {
              const host = hosts.find(h => h.employeeId === u.employeeId);
              return (
                <tr key={u.userId}>
                  <td>
                    <div className="sym-cell">
                      <Avatar name={u.name || u.loginId} size={30} src={host?.photo} />
                      <div className="trunc">
                        <div className="tk trunc">
                          {u.name || u.loginId}
                          {isMe(u) && <span className="badge blue" style={{ marginLeft: 8 }}>You</span>}
                        </div>
                        <div className="ds">{u.loginId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="t">
                    <span className={"badge " + TYPE_TONE[u.userType]}>{userTypeLabel(u.userType)}</span>
                  </td>
                  <td className="t num dim">{u.employeeId || "—"}</td>
                  <td className="t dim trunc">{host ? `${host.name} · ${host.department}` : "—"}</td>
                  <td>
                    <span className={"badge " + (u.active === false ? "grey" : "green")}>
                      <span className="badge-dot" />{u.active === false ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td>
                    <button className="row-action" onClick={() => open(u)}
                      title="Edit" aria-label={`Edit ${u.loginId}`}>
                      <Icon name="doc" size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </MasterShell>

      {editing && (
        <Drawer
          title={allUsers.some(u => u.userId === editing.userId) ? editing.loginId || "User" : "New user"}
          subtitle={`${editing.userId} · ${org.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              {allUsers.some(u => u.userId === editing.userId) && !isMe(editing) && !lastAdmin(editing) && (
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
          {isMe(editing) && (
            <div className="alert info">
              <Icon name="user" size={16} />
              <span>This is the account you are signed in with. It can't be deleted from here.</span>
            </div>
          )}

          <div className="f2">
            <Field label="User ID" required error={errors.loginId} icon="user"
              hint="Used to sign in — unique across all organizations.">
              <input value={editing.loginId} onChange={e => set("loginId", e.target.value)}
                placeholder="reception" autoComplete="off" />
            </Field>
            <Field label="Password" required error={errors.password} icon="shield">
              <input type={showPw ? "text" : "password"} value={editing.password}
                onChange={e => set("password", e.target.value)} placeholder="••••••" autoComplete="new-password" />
              <button className="link-btn" onClick={() => setShowPw(s => !s)}>{showPw ? "Hide" : "Show"}</button>
            </Field>
          </div>

          <div className="rf">
            <label>User type<span className="req"> *</span></label>
            {USER_TYPES.map(t => (
              <button key={t.id} className={"method-card" + (editing.userType === t.id ? " on" : "")}
                onClick={() => set("userType", t.id)}
                disabled={isMe(editing) && lastAdmin(editing) && t.id !== "admin"}>
                <span className="set-ic">
                  <Icon name={t.id === "admin" ? "shield" : t.id === "reception" ? "checkin" : "user"} size={16} />
                </span>
                <div className="method-body">
                  <div className="method-name">{t.label}</div>
                  <div className="method-detail" style={{ fontFamily: "var(--font)" }}>{t.desc}</div>
                </div>
                <span className="method-radio" />
              </button>
            ))}
          </div>

          <div className="divider" />

          <div className="f2">
            <Field label="Display name" icon="user">
              <input value={editing.name} onChange={e => set("name", e.target.value)} placeholder="Rumana Haque" />
            </Field>
            <Field label="Employee ID" icon="badge"
              hint="Match a host's employee ID to link the account.">
              <input value={editing.employeeId} onChange={e => set("employeeId", e.target.value)} placeholder="EMP-1001" />
            </Field>
          </div>

          <div className="set-row" style={{ padding: "12px 0", borderBottom: "none" }}>
            <span className="set-ic"><Icon name="shield" size={16} /></span>
            <div className="set-text">
              <div className="set-name">Account active</div>
              <div className="set-desc">
                {lastAdmin(editing)
                  ? "The last administrator must stay active."
                  : "A disabled account cannot sign in."}
              </div>
            </div>
            <Toggle
              on={editing.active !== false}
              label="Account active"
              onClick={() => !lastAdmin(editing) && set("active", editing.active === false)}
            />
          </div>
        </Drawer>
      )}

      {confirm && (
        <ConfirmModal
          danger
          title={`Delete ${confirm.loginId}?`}
          body="The sign-in account is removed. Visits recorded while it was in use are unaffected."
          rows={[
            { k: "User type", v: userTypeLabel(confirm.userType) },
            { k: "Reversible", v: "No", tone: "down" },
          ]}
          confirmLabel="Delete user"
          onConfirm={remove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
