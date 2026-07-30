import Icon from "./Icon";

/* Irreversible actions get an itemised summary and an explicit confirm. */
export default function ConfirmModal({ title, body, rows = [], confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-head">
          <span className="err-icon"><Icon name={danger ? "trash" : "alert"} size={20} /></span>
          <h3>{title}</h3>
        </div>
        <div className="modal-body">{body}</div>
        {rows.length > 0 && (
          <div className="ov-box" style={{ margin: "0 20px 4px" }}>
            {rows.map((r, i) => (
              <div className={"ov-row" + (i === rows.length - 1 ? " total" : "")} key={r.k}>
                <span className="k">{r.k}</span>
                <span className={"v " + (r.tone || "")}>{r.v}</span>
              </div>
            ))}
          </div>
        )}
        <div className="modal-foot">
          <span style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={"btn " + (danger ? "btn-no" : "btn-primary")} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
