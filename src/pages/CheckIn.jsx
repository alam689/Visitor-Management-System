import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import Avatar from "../components/Avatar";
import Field from "../components/Field";
import ImagePicker from "../components/ImagePicker";
import VisitorBadge from "../components/VisitorBadge";
import {
  nextBadge, nextKey, screenName, searchVisitors, useApp, useOrgData, useSession, useToast, withinSlot,
} from "../store/AppStore";
import { PURPOSES } from "../data/constants";
import { timeOf } from "../utils/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[+\d][\d\s-]{6,}$/;

const EMPTY_VISITOR = { name: "", mobile: "", email: "", organization: "", cardImage: "" };
const EMPTY_VISIT = { hostId: "", purpose: PURPOSES[0], vehicle: "", notes: "", terms: false, health: false };

function Stepper({ step, labels }) {
  return (
    <div className="stepper">
      {labels.map((l, i) => (
        <Fragment key={l}>
          {i > 0 && <div className={"step-line" + (i <= step ? " done" : "")} />}
          <div className={"step" + (i < step ? " done" : "") + (i === step ? " on" : "")}>
            <span className="step-num">{i < step ? <Icon name="check" size={13} /> : i + 1}</span>
            <span className="step-label">{l}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

/* Result screen recipe: badge → headline → explanation → reference → timeline → actions. */
function Success({ visit, visitor, host, settings, onAgain, onDesk }) {
  const print = () => {
    document.body.classList.add("printing-doc");
    window.print();
    document.body.classList.remove("printing-doc");
  };

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
      <div className="success-badge ok"><Icon name="check" size={30} /></div>
      <div className="page-title" style={{ fontSize: 23 }}>Welcome, {visitor.name.split(" ")[0]}.</div>
      <p className="page-sub" style={{ marginTop: 6 }}>
        {host.name} has been notified. Please take a seat — you're in the waiting list now.
      </p>

      <div className="ref-box">
        <div className="k">Badge number</div>
        <div className="v">{visit.badgeNo}</div>
      </div>

      <div className="timeline">
        <div className="tl-row done">
          <div className="tl-dot"><span className="d" /><span className="ln" /></div>
          <div className="tl-body">
            <div className="t">Signed in</div>
            <div className="s">{timeOf(visit.checkInAt)} · front desk</div>
          </div>
        </div>
        <div className="tl-row done">
          <div className="tl-dot"><span className="d" /><span className="ln" /></div>
          <div className="tl-body">
            <div className="t">Host notified</div>
            <div className="s">{host.name} · {host.department}</div>
          </div>
        </div>
        <div className="tl-row active">
          <div className="tl-dot"><span className="d" /><span className="ln" /></div>
          <div className="tl-body">
            <div className="t">In waiting</div>
            <div className="s">Reception marks the meeting as started when the host arrives</div>
          </div>
        </div>
        <div className="tl-row">
          <div className="tl-dot"><span className="d" /><span className="ln" /></div>
          <div className="tl-body">
            <div className="t">Badge {settings.auto ? "printing" : "ready to print"}</div>
            <div className="s">{settings.auto ? "Collect it from the printer" : "Print it when you're ready"}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "22px 0" }}>
        <VisitorBadge visit={visit} visitor={visitor} host={host} />
      </div>

      <div className="doc-print-hide" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button className="btn" onClick={onDesk}>Back to desk</button>
        <button className="btn" onClick={print}><Icon name="printer" /> Print badge</button>
        <button className="btn btn-primary" onClick={onAgain}>Check in another <Icon name="arrowRight" /></button>
      </div>
    </div>
  );
}

export default function CheckIn() {
  const { settings, dispatch, visitors: allVisitors } = useApp();
  const { org } = useSession();
  const { hosts, visitors } = useOrgData();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);      // existing visitor master record
  const [draft, setDraft] = useState(EMPTY_VISITOR); // new visitor being captured
  const [isNew, setIsNew] = useState(false);
  const [visit, setVisit] = useState({ ...EMPTY_VISIT, hostId: hosts[0]?.hostId || "" });
  const [errors, setErrors] = useState({});
  const [denied, setDenied] = useState(false);
  const [done, setDone] = useState(null);

  const needsAgreement = settings.nda || settings.health;
  const labels = useMemo(
    () => (needsAgreement ? ["Visitor", "Host & purpose", "Agreement"] : ["Visitor", "Host & purpose"]),
    [needsAgreement]
  );

  const matches = useMemo(() => searchVisitors(visitors, query), [visitors, query]);
  const current = picked || (isNew ? draft : null);
  const host = hosts.find(h => h.hostId === visit.hostId) || hosts[0] || null;
  const outsideSlot = !withinSlot(org);

  const setDraftField = (k, v) => {
    setDraft(d => ({ ...d, [k]: v }));
    setErrors(e => (e[k] ? { ...e, [k]: null } : e));
  };

  const startNew = () => {
    setIsNew(true);
    setPicked(null);
    /* Whatever reception already typed is the visitor's mobile or name. */
    const digits = query.replace(/\D/g, "");
    setDraft({ ...EMPTY_VISITOR, mobile: digits.length >= 6 ? query.trim() : "", name: digits.length >= 6 ? "" : query.trim() });
  };

  const validateVisitor = () => {
    if (picked) return true;
    const next = {};
    if (!draft.name.trim()) next.name = "Visitor name is required";
    if (!draft.mobile.trim()) next.mobile = "Mobile number is required";
    else if (!MOBILE_RE.test(draft.mobile.trim())) next.mobile = "That doesn't look like a phone number";
    else if (visitors.some(v => v.mobile.replace(/\D/g, "") === draft.mobile.replace(/\D/g, ""))) {
      next.mobile = "A visitor with this mobile already exists — search for them instead";
    }
    if (draft.email && !EMAIL_RE.test(draft.email)) next.email = "That doesn't look like an email address";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const agreementOk = (!settings.nda || visit.terms) && (!settings.health || visit.health);

  const submit = () => {
    const name = (picked?.name || draft.name).trim();

    if (settings.watch && screenName(name)) {
      setDenied(true);
      toast("Watchlist match — entry not granted", "error", `${name} is on the security block list`);
      return;
    }

    /* A visitor who is not already on record is added to the master now, so
       their next visit starts from a search hit instead of re-typing. */
    let visitorRecord = picked;
    if (!visitorRecord) {
      visitorRecord = {
        visitorId: nextKey(allVisitors, "visitorId", "VIS"),
        orgId: org.orgId,
        name,
        mobile: draft.mobile.trim(),
        email: draft.email.trim(),
        organization: draft.organization.trim(),
        cardImage: draft.cardImage,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: "upsert", entity: "visitors", record: visitorRecord });
    }

    const record = {
      orgId: org.orgId,
      visitorId: visitorRecord.visitorId,
      hostId: visit.hostId,
      purpose: visit.purpose,
      vehicle: visit.vehicle.trim(),
      notes: visit.notes.trim(),
      badgeNo: nextBadge(),
      checkInAt: new Date().toISOString(),
      source: "desk",
    };
    dispatch({ type: "check-in", visit: record });

    const channels = [settings.email && "email", settings.sms && "SMS", settings.slack && "Slack"].filter(Boolean);
    toast(
      channels.length ? `${host.name} notified` : `${name} checked in`,
      "ok",
      channels.length ? `Sent by ${channels.join(" + ")}` : "No notification channels are enabled"
    );
    if (!picked) toast("Visitor added to the master", "ok", visitorRecord.visitorId);
    if (settings.auto) toast("Badge sent to the printer", "warn", record.badgeNo);

    setDone({ visit: { ...record, status: "waiting" }, visitor: visitorRecord, host });
  };

  const restart = () => {
    setStep(0);
    setQuery("");
    setPicked(null);
    setDraft(EMPTY_VISITOR);
    setIsNew(false);
    setVisit({ ...EMPTY_VISIT, hostId: hosts[0]?.hostId || "" });
    setErrors({});
    setDenied(false);
    setDone(null);
  };

  if (done) {
    return (
      <div className="page">
        <Success {...done} settings={settings} onAgain={restart} onDesk={() => navigate("/")} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Check-in</div>
          <div className="page-sub">Staffed sign-in · step {step + 1} of {labels.length}</div>
        </div>
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={() => navigate("/")}>
          <Icon name="arrowLeft" /> Back to desk
        </button>
      </div>

      <div className="grid g-2" style={{ gridTemplateColumns: "1fr 380px", alignItems: "start" }}>
        <section className="panel">
          <div className="panel-body" style={{ padding: "18px 20px 20px" }}>
            <Stepper step={step} labels={labels} />

            {denied && (
              <div className="alert">
                <Icon name="alert" size={16} />
                <span>
                  <strong>Watchlist match.</strong> This visitor cannot be checked in automatically.
                  Call security and complete a manual sign-in.
                </span>
              </div>
            )}

            {outsideSlot && step === 0 && (
              <div className="alert info">
                <Icon name="clock" size={16} />
                <span>
                  <strong>Outside visiting hours.</strong> {org.name} accepts visitors {org.slotStart}–{org.slotEnd}.
                  You can still check this visitor in.
                </span>
              </div>
            )}

            {/* ---- step 0: find or create the visitor ---- */}
            {step === 0 && (
              <>
                {!isNew && (
                  <>
                    <Field label="Search the visitor master" icon="search"
                      hint="Type a mobile number or name — at least two characters.">
                      <input
                        value={query}
                        onChange={e => { setQuery(e.target.value); setPicked(null); }}
                        placeholder="+8801… or Fatima"
                        autoFocus
                      />
                    </Field>

                    {query.trim().length >= 2 && (
                      <div style={{ marginBottom: 14 }}>
                        {matches.map(v => (
                          <button key={v.visitorId}
                            className={"method-card" + (picked?.visitorId === v.visitorId ? " on" : "")}
                            onClick={() => setPicked(v)}>
                            <Avatar name={v.name} size={40} src={v.cardImage} />
                            <div className="method-body">
                              <div className="method-name trunc">{v.name}</div>
                              <div className="method-detail trunc">{v.mobile} · {v.organization || "no organization"}</div>
                            </div>
                            <span className="method-radio" />
                          </button>
                        ))}

                        {matches.length === 0 && (
                          <div className="alert info" style={{ marginBottom: 0 }}>
                            <Icon name="user" size={16} />
                            <span>
                              No visitor on record matches <strong>{query.trim()}</strong>. Add them as a new visitor
                              and they'll be found by mobile next time.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <button className="btn btn-block" onClick={startNew} style={{ marginBottom: 12 }}>
                      <Icon name="plus" /> New visitor — not on record
                    </button>
                  </>
                )}

                {isNew && (
                  <>
                    <div className="rec-head">
                      <Avatar name={draft.name || "?"} size={38} src={draft.cardImage} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="n">New visitor record</div>
                        <div className="s">Saved to the visitor master on sign-in</div>
                      </div>
                      <button className="btn btn-ghost" onClick={() => { setIsNew(false); setErrors({}); }}>
                        <Icon name="search" /> Search instead
                      </button>
                    </div>

                    <Field label="Mobile number" required error={errors.mobile} icon="phone">
                      <input value={draft.mobile} onChange={e => setDraftField("mobile", e.target.value)}
                        placeholder="+880 17…" inputMode="tel" autoFocus />
                    </Field>
                    <Field label="Full name" required error={errors.name} icon="user">
                      <input value={draft.name} onChange={e => setDraftField("name", e.target.value)}
                        placeholder="Amina Rahman" />
                    </Field>
                    <div className="f2">
                      <Field label="Email address" error={errors.email} icon="mail">
                        <input value={draft.email} onChange={e => setDraftField("email", e.target.value)}
                          placeholder="amina@company.com" inputMode="email" />
                      </Field>
                      <Field label="Visitor organization" icon="pin">
                        <input value={draft.organization} onChange={e => setDraftField("organization", e.target.value)}
                          placeholder="Sunstone Partners" />
                      </Field>
                    </div>
                    <ImagePicker label="Visiting card" card value={draft.cardImage}
                      onChange={v => setDraftField("cardImage", v)} />
                  </>
                )}

                <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 4 }}
                  disabled={!picked && !isNew}
                  onClick={() => {
                    if (!validateVisitor()) return;
                    setErrors({});
                    setStep(1);
                  }}>
                  Continue <Icon name="arrowRight" />
                </button>
              </>
            )}

            {/* ---- step 1: host and purpose ---- */}
            {step === 1 && (
              <>
                <div className="rf">
                  <label>Host<span className="req"> *</span></label>
                  <div className="rf-input sel">
                    <Icon name="user" size={16} />
                    <select value={visit.hostId} onChange={e => setVisit(s => ({ ...s, hostId: e.target.value }))}>
                      {hosts.map(h => (
                        <option key={h.hostId} value={h.hostId}>{h.name} — {h.department}</option>
                      ))}
                    </select>
                  </div>
                  {host && <span className="rf-err" style={{ color: "var(--text-faint)" }}>
                    {host.designation} · {host.concern}
                  </span>}
                </div>

                <div className="rf">
                  <label>Purpose of visit<span className="req"> *</span></label>
                  <div className="pill-row">
                    {PURPOSES.map(p => (
                      <button key={p} className={"pill-opt" + (visit.purpose === p ? " on" : "")}
                        onClick={() => setVisit(s => ({ ...s, purpose: p }))}>{p}</button>
                    ))}
                  </div>
                </div>

                <div className="f2">
                  <Field label="Vehicle reg." icon="car">
                    <input value={visit.vehicle} onChange={e => setVisit(s => ({ ...s, vehicle: e.target.value }))}
                      placeholder="DHA-1234" />
                  </Field>
                  <Field label="Note for host" icon="doc">
                    <input value={visit.notes} onChange={e => setVisit(s => ({ ...s, notes: e.target.value }))}
                      placeholder="Anything to add…" />
                  </Field>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button className="btn btn-ghost" onClick={() => setStep(0)}>
                    <Icon name="arrowLeft" /> Back
                  </button>
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }}
                    onClick={() => (needsAgreement ? setStep(2) : submit())}>
                    {needsAgreement
                      ? <>Continue <Icon name="arrowRight" /></>
                      : <>Sign in &amp; print badge <Icon name="badge" /></>}
                  </button>
                </div>
              </>
            )}

            {/* ---- step 2: agreement ---- */}
            {step === 2 && needsAgreement && (
              <>
                <div className="alert info" style={{ marginBottom: 14 }}>
                  <Icon name="doc" size={16} />
                  <span>
                    By signing in you agree to the visitor policy and consent to your data being
                    processed for security and operational purposes. Records are kept for 90 days.
                  </span>
                </div>

                {settings.nda && (
                  <button className={"check-row" + (visit.terms ? " on" : "")}
                    onClick={() => setVisit(s => ({ ...s, terms: !s.terms }))} style={{ marginBottom: 9 }}>
                    <span className={"check-box" + (visit.terms ? " on" : "")}>
                      {visit.terms && <Icon name="check" size={12} />}
                    </span>
                    I have read and agree to the visitor terms &amp; conditions
                  </button>
                )}
                {settings.health && (
                  <button className={"check-row" + (visit.health ? " on" : "")}
                    onClick={() => setVisit(s => ({ ...s, health: !s.health }))}>
                    <span className={"check-box" + (visit.health ? " on" : "")}>
                      {visit.health && <Icon name="check" size={12} />}
                    </span>
                    I confirm I am not experiencing any illness symptoms
                  </button>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>
                    <Icon name="arrowLeft" /> Back
                  </button>
                  <button className="btn btn-primary btn-lg" style={{ flex: 1 }}
                    disabled={!agreementOk} onClick={submit}>
                    Sign in &amp; print badge <Icon name="badge" />
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ---- context rail: what is about to be recorded ---- */}
        <div className="grid" style={{ gap: 14 }}>
          <section className="panel">
            <div className="panel-head">
              <h3>This visit</h3>
              <span className="spacer" />
              {current && (
                <span className={"badge " + (picked ? "green" : "blue")}>
                  <span className="badge-dot" />{picked ? "On record" : "New record"}
                </span>
              )}
            </div>
            <div className="panel-body">
              <div className="sym-cell" style={{ marginBottom: 12 }}>
                <Avatar name={current?.name || "?"} size={38} src={current?.cardImage} />
                <div className="trunc">
                  <div className="tk trunc" style={{ fontSize: 14 }}>{current?.name || "No visitor selected"}</div>
                  <div className="ds trunc">{current?.mobile || "search by mobile or name"}</div>
                </div>
              </div>

              <div className="ov-box" style={{ margin: 0 }}>
                <div className="ov-row"><span className="k">Visitor ID</span>
                  <span className="v">{picked?.visitorId || "on sign-in"}</span></div>
                <div className="ov-row"><span className="k">Organization</span>
                  <span className="v">{current?.organization || "—"}</span></div>
                <div className="ov-row"><span className="k">Host</span><span className="v">{host?.name || "—"}</span></div>
                <div className="ov-row"><span className="k">Department</span><span className="v">{host?.department || "—"}</span></div>
                <div className="ov-row"><span className="k">Purpose</span><span className="v">{visit.purpose}</span></div>
                <div className="ov-row total"><span className="k">Status on sign-in</span>
                  <span className="v" style={{ color: "var(--warn)" }}>In waiting</span></div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3>On sign-in</h3></div>
            <div className="kv-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="kv"><span className="k">Watchlist screening</span>
                <span className={"v " + (settings.watch ? "up" : "faint")}>{settings.watch ? "On" : "Off"}</span></div>
              <div className="kv"><span className="k">Email host</span>
                <span className={"v " + (settings.email ? "up" : "faint")}>{settings.email ? "On" : "Off"}</span></div>
              <div className="kv"><span className="k">SMS host</span>
                <span className={"v " + (settings.sms ? "up" : "faint")}>{settings.sms ? "On" : "Off"}</span></div>
              <div className="kv"><span className="k">Slack host</span>
                <span className={"v " + (settings.slack ? "up" : "faint")}>{settings.slack ? "On" : "Off"}</span></div>
              <div className="kv" style={{ borderBottom: "none" }}><span className="k">Auto badge print</span>
                <span className={"v " + (settings.auto ? "up" : "faint")}>{settings.auto ? "On" : "Off"}</span></div>
            </div>
            <div className="panel-foot">
              <Icon name="clock" size={14} />
              <span>Visiting hours {org.slotStart}–{org.slotEnd}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
