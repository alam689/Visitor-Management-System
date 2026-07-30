import FoyerMark from "./FoyerMark";
import Icon from "./Icon";
import { initials } from "./Avatar";

/* The printed badge is a fixed dark surface — it ignores the app theme, the
   same way §11 keeps paper as paper. Its colours are literals, not tokens. */
export default function VisitorBadge({ visit, visitor, host }) {
  const name = visitor?.name || "New Visitor";
  const stamp = new Date(visit?.checkInAt || Date.now()).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).replace(",", " ·");

  return (
    <div className="badge-card">
      <div className="badge-top">
        <span className="badge-brand"><FoyerMark size={18} /> FOYER · VISITOR</span>
        <span className="badge-zone">ZONE A</span>
      </div>

      <div className="badge-main">
        <span className="sym-tag">
          {visitor?.cardImage
            ? <img className="avatar-img" src={visitor.cardImage} alt="" width={46} height={46} />
            : initials(name)}
        </span>
        <div>
          <div className="badge-name">{name}</div>
          <div className="badge-host">
            {visitor?.organization ? <>{visitor.organization} · </> : null}
            Visiting <strong>{host?.name || "—"}</strong>
          </div>
        </div>
      </div>

      <div className="badge-foot">
        <div>
          <div className="badge-meta-l">Badge {visit?.badgeNo}</div>
          <div className="badge-meta-v">{stamp}</div>
        </div>
        <div className="badge-qr"><Icon name="qr" size={38} stroke={1.4} /></div>
      </div>
    </div>
  );
}
