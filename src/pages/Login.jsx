import { useState } from "react";
import FoyerMark from "../components/FoyerMark";
import Icon from "../components/Icon";
import { authenticate, useApp } from "../store/AppStore";
import { userTypeLabel } from "../data/constants";
import { FMT } from "../utils/format";

/* Split-screen auth (§12): dark branded panel left, form right.
   Credentials are demo data in localStorage — this is not real authentication. */
export default function Login() {
  const { users, organizations, visits, dispatch } = useApp();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const submit = e => {
    e?.preventDefault();
    const { user, error: err } = authenticate(users, loginId, password);
    if (err) {
      setError(err);
      return;
    }
    dispatch({ type: "sign-in", userId: user.userId, orgId: user.orgId });
  };

  const useDemo = u => {
    setLoginId(u.loginId);
    setPassword(u.password);
    setError("");
  };

  const orgName = orgId => organizations.find(o => o.orgId === orgId)?.name || orgId;

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="brand" style={{ background: "none", height: "auto", padding: 0, cursor: "default" }}>
          <FoyerMark size={30} />
          <div className="brand-text">
            <div className="brand-name">Foyer <b>Desk</b></div>
            <div className="brand-sub">Visitor management</div>
          </div>
        </div>

        <div className="login-hero">
          <h1>Every arrival, accounted for.</h1>
          <p>
            Front-desk and kiosk check-in, host notification, watchlist screening and a
            complete visit record — for every organization on one desk.
          </p>
        </div>

        <div className="login-facts">
          <div className="f">
            <div className="k">Organizations</div>
            <div className="v">{FMT.int(organizations.length)}</div>
          </div>
          <div className="f">
            <div className="k">Hosts &amp; users</div>
            <div className="v">{FMT.int(users.length)}</div>
          </div>
          <div className="f">
            <div className="k">Visits on record</div>
            <div className="v">{FMT.int(visits.length)}</div>
          </div>
        </div>
      </div>

      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <h2>Sign in</h2>
          <p className="page-sub" style={{ margin: "6px 0 22px" }}>
            Use your organization's user ID and password.
          </p>

          {error && (
            <div className="login-error">
              <Icon name="alert" size={15} /> {error}
            </div>
          )}

          <div className="rf">
            <label>User ID</label>
            <div className="login-input">
              <Icon name="user" size={16} className="faint" />
              <input
                value={loginId}
                onChange={e => { setLoginId(e.target.value); setError(""); }}
                placeholder="reception"
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="rf">
            <label>Password</label>
            <div className="login-input">
              <Icon name="shield" size={16} className="faint" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" className="link-btn" onClick={() => setShow(s => !s)}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-block btn-lg" type="submit" style={{ marginTop: 4 }}>
            Sign in <Icon name="arrowRight" />
          </button>

          <div className="login-sep">DEMO ACCOUNTS</div>

          {users.map(u => (
            <button type="button" className="demo-cred" key={u.userId} onClick={() => useDemo(u)}>
              <Icon name="user" size={15} className="faint" />
              <span className="who">
                <span className="n">{userTypeLabel(u.userType)} · {orgName(u.orgId)}</span>
                <span className="u">{u.loginId} / {u.password}</span>
              </span>
              <Icon name="arrowRight" size={14} className="faint" />
            </button>
          ))}
        </form>
      </div>
    </div>
  );
}
