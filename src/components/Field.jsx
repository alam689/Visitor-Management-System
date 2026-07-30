import Icon from "./Icon";

/* The standard field density (§6b) — every form in the app uses this. */
export default function Field({ label, required, error, icon, hint, select, children }) {
  return (
    <div className="rf">
      {label && <label>{label}{required && <span className="req"> *</span>}</label>}
      <div className={"rf-input" + (select ? " sel" : "") + (error ? " bad" : "")}>
        {icon && <Icon name={icon} size={16} />}
        {children}
      </div>
      {error
        ? <span className="rf-err">{error}</span>
        : hint ? <span className="rf-err faint" style={{ color: "var(--text-faint)" }}>{hint}</span> : null}
    </div>
  );
}
