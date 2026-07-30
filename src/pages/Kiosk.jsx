import { useEffect, useMemo, useRef, useState } from "react";
import FoyerMark from "../components/FoyerMark";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import {
  nextBadge, nextKey, screenName, searchVisitors, useApp, useOrgData, useSession, useToast,
} from "../store/AppStore";
import { PURPOSES } from "../data/constants";

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="kiosk-clock">
      <span className="kiosk-time">{t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      <span className="kiosk-date">{t.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</span>
    </div>
  );
}

/* The idle hero uses the §12 recipe: two radial glows over a linear base. */
function KioskIdle({ orgName, onStart }) {
  return (
    <div className="kiosk-idle" onClick={onStart}>
      <Clock />
      <FoyerMark size={44} />
      <div className="kiosk-eyebrow">Visitor reception</div>
      <h1 className="kiosk-h1">Welcome to<br /><b>{orgName}</b></h1>
      <p className="kiosk-lede">Tap below to let us know you've arrived. It takes about thirty seconds.</p>
      <button className="btn btn-primary btn-lg kiosk-cta" onClick={onStart}>
        <Icon name="checkin" size={18} /> Tap to check in
      </button>
      <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
        I have a QR invite <Icon name="qr" size={15} />
      </button>
      <div className="kiosk-foot">Powered by <strong>Foyer</strong> · reception will assist if you need help</div>
    </div>
  );
}

const STEPS = 4;

function KioskFlow({ onExit }) {
  const { settings, dispatch, visitors: allVisitors } = useApp();
  const { org } = useSession();
  const { hosts, visitors } = useOrgData();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [mobile, setMobile] = useState("");
  const [picked, setPicked] = useState(null);
  const [draft, setDraft] = useState({ name: "", organization: "" });
  const [hostId, setHostId] = useState(hosts[0]?.hostId || "");
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const submitted = useRef(false);

  const needsAgreement = settings.nda || settings.health;
  const host = hosts.find(h => h.hostId === hostId) || null;
  const matches = useMemo(() => searchVisitors(visitors, mobile), [visitors, mobile]);
  const name = picked?.name || draft.name.trim();

  /* Return to the idle screen a few seconds after a successful check-in. */
  useEffect(() => {
    if (step !== 4) return;
    const id = setTimeout(onExit, 6000);
    return () => clearTimeout(id);
  }, [step, onExit]);

  const findVisitor = () => {
    if (mobile.replace(/\D/g, "").length < 6) {
      setError("Please enter your mobile number.");
      return;
    }
    const hit = matches[0];
    if (hit) {
      setPicked(hit);
      setDraft({ name: hit.name, organization: hit.organization || "" });
    } else {
      setPicked(null);
    }
    setError("");
    setStep(1);
  };

  const submit = () => {
    if (submitted.current) return;

    if (settings.watch && screenName(name)) {
      setError("We can't complete self check-in — please see reception.");
      toast("Watchlist match at the kiosk", "error", name);
      return;
    }

    let visitor = picked;
    if (!visitor) {
      visitor = {
        visitorId: nextKey(allVisitors, "visitorId", "VIS"),
        orgId: org.orgId,
        name,
        mobile: mobile.trim(),
        email: "",
        organization: draft.organization.trim(),
        cardImage: "",
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "upsert", entity: "visitors", record: visitor });
    }

    submitted.current = true;
    dispatch({
      type: "check-in",
      visit: {
        orgId: org.orgId,
        visitorId: visitor.visitorId,
        hostId,
        purpose,
        badgeNo: nextBadge(),
        checkInAt: new Date().toISOString(),
        source: "kiosk",
      },
    });
    toast(`${name} checked in at the kiosk`, "ok", `${host?.name || "Host"} notified`);
    setStep(4);
  };

  return (
    <div className="kiosk-flow">
      <div className="kiosk-top">
        <FoyerMark size={26} />
        <div className="kdots">
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={"kdot" + (i <= step ? " on" : "")} />
          ))}
        </div>
        <button className="btn btn-ghost" onClick={onExit}>Cancel</button>
      </div>

      {/* ---- 0: identify by mobile ---- */}
      {step === 0 && (
        <div className="kiosk-pane">
          <div className="kiosk-q">What's your mobile number?</div>
          <div className="login-input">
            <Icon name="phone" size={17} className="faint" />
            <input placeholder="+880 17…" value={mobile} inputMode="tel" autoFocus
              onChange={e => { setMobile(e.target.value); setError(""); }} />
          </div>
          <p className="faint" style={{ fontSize: 12, textAlign: "center", marginTop: 10 }}>
            We use it to find you if you've visited before.
          </p>
          {error && <span className="rf-err" style={{ textAlign: "center" }}>{error}</span>}
          <div className="kiosk-actions">
            <button className="btn btn-lg" onClick={onExit}><Icon name="arrowLeft" /> Back</button>
            <button className="btn btn-primary btn-lg" onClick={findVisitor}>Continue <Icon name="arrowRight" /></button>
          </div>
        </div>
      )}

      {/* ---- 1: confirm the match, or introduce yourself ---- */}
      {step === 1 && (
        <div className="kiosk-pane">
          {picked ? (
            <>
              <div className="kiosk-q">Welcome back.</div>
              <button className="method-card on" onClick={() => {}}>
                <Avatar name={picked.name} size={40} src={picked.cardImage} />
                <div className="method-body">
                  <div className="method-name">{picked.name}</div>
                  <div className="method-detail">{picked.mobile} · {picked.organization || "no organization"}</div>
                </div>
                <span className="method-radio" />
              </button>
              <button className="link-btn" style={{ marginTop: 12, alignSelf: "center" }}
                onClick={() => { setPicked(null); setDraft({ name: "", organization: "" }); }}>
                Not you? Enter your details
              </button>
            </>
          ) : (
            <>
              <div className="kiosk-q">Tell us who you are.</div>
              <div className="login-input" style={{ marginBottom: 10 }}>
                <Icon name="user" size={17} className="faint" />
                <input placeholder="Full name" value={draft.name} autoFocus
                  onChange={e => { setDraft(d => ({ ...d, name: e.target.value })); setError(""); }} />
              </div>
              <div className="login-input">
                <Icon name="pin" size={17} className="faint" />
                <input placeholder="Your organization (optional)" value={draft.organization}
                  onChange={e => setDraft(d => ({ ...d, organization: e.target.value }))} />
              </div>
            </>
          )}
          {error && <span className="rf-err" style={{ textAlign: "center" }}>{error}</span>}
          <div className="kiosk-actions">
            <button className="btn btn-lg" onClick={() => setStep(0)}><Icon name="arrowLeft" /> Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => {
              if (!name) { setError("Please enter your name."); return; }
              setError("");
              setStep(2);
            }}>
              Continue <Icon name="arrowRight" />
            </button>
          </div>
        </div>
      )}

      {/* ---- 2: host ---- */}
      {step === 2 && (
        <div className="kiosk-pane tall">
          <div className="kiosk-q">Who are you visiting?</div>
          <div className="kiosk-scroll">
            {hosts.map(h => (
              <button key={h.hostId} className={"method-card" + (hostId === h.hostId ? " on" : "")}
                onClick={() => setHostId(h.hostId)}>
                <Avatar name={h.name} size={40} src={h.photo} />
                <div className="method-body">
                  <div className="method-name">{h.name}</div>
                  <div className="method-detail">{h.department} · {h.designation}</div>
                </div>
                <span className="method-radio" />
              </button>
            ))}
          </div>
          <div className="kiosk-actions" style={{ marginTop: 0 }}>
            <button className="btn btn-lg" onClick={() => setStep(1)}><Icon name="arrowLeft" /> Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Continue <Icon name="arrowRight" /></button>
          </div>
        </div>
      )}

      {/* ---- 3: purpose + confirm ---- */}
      {step === 3 && (
        <div className="kiosk-pane">
          <div className="kiosk-q">Why are you here?</div>
          <div className="pill-row" style={{ justifyContent: "center", marginBottom: 14 }}>
            {PURPOSES.map(p => (
              <button key={p} className={"pill-opt" + (purpose === p ? " on" : "")}
                onClick={() => setPurpose(p)}>{p}</button>
            ))}
          </div>

          {needsAgreement && (
            <button className={"check-row" + (agree ? " on" : "")} onClick={() => setAgree(a => !a)}>
              <span className={"check-box" + (agree ? " on" : "")}>
                {agree && <Icon name="check" size={12} />}
              </span>
              I agree to the visitor terms and confirm I'm feeling well
            </button>
          )}

          <div className="ov-box" style={{ marginTop: 12 }}>
            <div className="ov-row"><span className="k">Visitor</span><span className="v">{name}</span></div>
            <div className="ov-row"><span className="k">Host</span><span className="v">{host?.name || "—"}</span></div>
            <div className="ov-row total"><span className="k">Purpose</span><span className="v">{purpose}</span></div>
          </div>

          {error && <span className="rf-err" style={{ textAlign: "center" }}>{error}</span>}

          <div className="kiosk-actions" style={{ marginTop: 4 }}>
            <button className="btn btn-lg" onClick={() => setStep(2)}><Icon name="arrowLeft" /> Back</button>
            <button className="btn btn-primary btn-lg" disabled={needsAgreement && !agree} onClick={submit}>
              Confirm &amp; check in <Icon name="check" />
            </button>
          </div>
        </div>
      )}

      {/* ---- 4: done ---- */}
      {step === 4 && (
        <div className="kiosk-pane kiosk-done">
          <div className="success-badge pending"><Icon name="clock" size={30} /></div>
          <div className="q-last">Thanks, {name.split(" ")[0]}.</div>
          <p className="page-sub" style={{ marginTop: 10, maxWidth: 360 }}>
            <strong style={{ color: "var(--text)" }}>{host?.name}</strong> has been notified.
            Please take a seat — you're in the waiting list and they'll come to collect you.
          </p>
          {settings.auto && (
            <span className="badge blue" style={{ marginTop: 16, padding: "6px 12px" }}>
              <Icon name="printer" size={13} /> Printing badge…
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function Kiosk() {
  const { org } = useSession();
  const [mode, setMode] = useState("idle");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Kiosk</div>
          <div className="page-sub">Tablet self check-in · arrivals appear on the welcome desk immediately</div>
        </div>
        <span className="spacer" />
        <span className="badge green"><span className="badge-dot" />Device online</span>
      </div>

      <div className="kiosk-stage">
        <div className="tablet">
          <div className="tablet-cam" />
          <div className="tablet-screen">
            {mode === "idle"
              ? <KioskIdle orgName={org.name} onStart={() => setMode("flow")} />
              : <KioskFlow key="flow" onExit={() => setMode("idle")} />}
          </div>
        </div>
        <p className="faint" style={{ fontSize: 12 }}>
          Returning visitors are matched on their mobile number · new ones are added to the visitor master
        </p>
      </div>
    </div>
  );
}
