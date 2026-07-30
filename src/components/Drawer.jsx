import { useEffect } from "react";
import Icon from "./Icon";

/* Modal = decision, drawer = inspection. Master records are edited here. */
export default function Drawer({ title, subtitle, onClose, footer, wide, children }) {
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className={"drawer" + (wide ? " wide" : "")} role="dialog" aria-label={title}>
        <div className="drawer-head">
          <div style={{ minWidth: 0 }}>
            <h3 className="trunc">{title}</h3>
            {subtitle && <div className="faint" style={{ fontSize: 11.5 }}>{subtitle}</div>}
          </div>
          <span className="spacer" />
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" size={17} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>
  );
}
