import { useState } from "react";
import Icon from "../components/Icon";
import Toggle from "../components/Toggle";
import ConfirmModal from "../components/ConfirmModal";
import { useApp, useOrgData, useSession, useSettings, useToast } from "../store/AppStore";
import { ONSITE } from "../data/constants";
import { FMT } from "../utils/format";

const SECTIONS = [
  {
    title: "Notifications", icon: "bell",
    items: [
      { key: "email", icon: "mail", name: "Email host on arrival", desc: "Send an email the moment their visitor checks in" },
      { key: "sms", icon: "phone", name: "SMS notifications", desc: "Text-message alert to the host's mobile" },
      { key: "slack", icon: "slack", name: "Slack integration", desc: "Post an arrival message to the host's Slack DM" },
    ],
  },
  {
    title: "Security", icon: "shield",
    items: [
      { key: "watch", icon: "shield", name: "Watchlist screening", desc: "Check every visitor name against the block list" },
      { key: "id", icon: "scan", name: "Require ID scan", desc: "Visitor must scan a government-issued ID" },
      { key: "photo", icon: "camera", name: "Photo capture", desc: "Take a visitor photo at check-in for the badge" },
    ],
  },
  {
    title: "Check-in flow", icon: "checkin",
    items: [
      { key: "nda", icon: "doc", name: "Require NDA / agreement", desc: "Show the policy consent step during check-in" },
      { key: "health", icon: "shield", name: "Health declaration", desc: "Ask visitors to confirm they are not unwell" },
      { key: "auto", icon: "badge", name: "Auto badge print", desc: "Print the badge automatically after check-in" },
    ],
  },
];

export default function Settings() {
  const [settings, setSetting] = useSettings();
  const { dispatch, visits: allVisits } = useApp();
  const { org } = useSession();
  const { visits } = useOrgData();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);

  const onSite = visits.filter(v => ONSITE.includes(v.status)).length;
  const active = Object.values(settings).filter(Boolean).length;

  const checkOutAll = () => {
    if (!onSite) {
      toast("Nobody is on-site", "warn", "There is nothing to check out");
      setConfirm(null);
      return;
    }
    dispatch({ type: "check-out-all", orgId: org.orgId });
    toast(`Checked out ${onSite} visitor${onSite === 1 ? "" : "s"}`, "ok", "End-of-day sweep complete");
    setConfirm(null);
  };

  const reset = () => {
    dispatch({ type: "reset" });
    setConfirm(null);
    toast("Demo data restored", "warn", "Every master and visit was rebuilt from the seed");
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">How Foyer welcomes and screens every guest</div>
        </div>
        <span className="spacer" />
        <span className="badge green"><span className="badge-dot" />Saved automatically</span>
      </div>

      <div className="grid g-3" style={{ gridTemplateColumns: "repeat(3, 1fr)", alignItems: "start" }}>
        {SECTIONS.map(section => (
          <section className="panel" key={section.title}>
            <div className="panel-head">
              <span className="set-ic"><Icon name={section.icon} size={15} /></span>
              <h3>{section.title}</h3>
              <span className="spacer" />
              <span className="faint num" style={{ fontSize: 11 }}>
                {section.items.filter(i => settings[i.key]).length}/{section.items.length}
              </span>
            </div>
            {section.items.map(item => (
              <div className={"set-row" + (settings[item.key] ? " on" : "")} key={item.key}>
                <span className="set-ic"><Icon name={item.icon} size={16} /></span>
                <div className="set-text">
                  <div className="set-name">{item.name}</div>
                  <div className="set-desc">{item.desc}</div>
                </div>
                <Toggle on={settings[item.key]} label={item.name}
                  onClick={() => setSetting(item.key, !settings[item.key])} />
              </div>
            ))}
          </section>
        ))}
      </div>

      <div className="grid g-2" style={{ gridTemplateColumns: "1fr 380px", alignItems: "start", marginTop: 14 }}>
        <section className="panel">
          <div className="panel-head">
            <span className="set-ic"><Icon name="clock" size={15} /></span>
            <h3>End of day</h3>
          </div>
          <div className="set-row">
            <span className="set-ic"><Icon name="arrowOut" size={16} /></span>
            <div className="set-text">
              <div className="set-name">Check out everyone on-site</div>
              <div className="set-desc">
                {onSite
                  ? `${onSite} visitor${onSite === 1 ? " is" : "s are"} still signed in at ${org.name}.`
                  : "Everyone has signed out."}
              </div>
            </div>
            <button className="btn" onClick={() => (onSite ? setConfirm("sweep") : checkOutAll())}>
              Check out all
            </button>
          </div>
          <div className="set-row">
            <span className="set-ic"><Icon name="trash" size={16} /></span>
            <div className="set-text">
              <div className="set-name">Reset demo data</div>
              <div className="set-desc">
                Discards every master record and visit stored in this browser and rebuilds the sample dataset.
              </div>
            </div>
            <button className="btn" onClick={() => setConfirm("reset")}>Reset</button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h3>Policy summary</h3></div>
          <div className="kv-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="kv"><span className="k">Policies enabled</span><span className="v">{FMT.int(active)} / 9</span></div>
            <div className="kv"><span className="k">Agreement step</span>
              <span className={"v " + (settings.nda || settings.health ? "up" : "faint")}>
                {settings.nda || settings.health ? "Shown" : "Skipped"}
              </span></div>
            <div className="kv"><span className="k">Notification channels</span>
              <span className="v">{FMT.int([settings.email, settings.sms, settings.slack].filter(Boolean).length)}</span></div>
            <div className="kv"><span className="k">Visiting hours</span><span className="v">{org.slotStart}–{org.slotEnd}</span></div>
            <div className="kv" style={{ borderBottom: "none" }}><span className="k">Retention</span><span className="v">90 days</span></div>
          </div>
          <div className="panel-foot">
            <Icon name="shield" size={14} style={{ color: settings.watch ? "var(--up)" : "var(--warn)" }} />
            {settings.watch ? "Watchlist screening is active" : "Watchlist screening is off"}
          </div>
        </section>
      </div>

      {confirm === "sweep" && (
        <ConfirmModal
          title={`Check out ${onSite} visitor${onSite === 1 ? "" : "s"}?`}
          body="Everyone still signed in — waiting or in a meeting — is checked out at the current time. Their dwell times are recorded as ending now."
          rows={[
            { k: "Visitors on-site", v: FMT.int(onSite) },
            { k: "Reversible", v: "No", tone: "down" },
          ]}
          confirmLabel="Check out all"
          onConfirm={checkOutAll}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm === "reset" && (
        <ConfirmModal
          danger
          title="Reset demo data?"
          body="Every organization, user, host, visitor and visit stored in this browser is discarded and the sample dataset is rebuilt. This cannot be undone."
          rows={[
            { k: "Visits on record", v: FMT.int(allVisits.length) },
            { k: "Reversible", v: "No", tone: "down" },
          ]}
          confirmLabel="Reset everything"
          onConfirm={reset}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
