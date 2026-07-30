import Icon from "../../components/Icon";

/* Every master screen is the same shape: a page head with a search box and a
   create button, then one panel holding a sticky-header table. */
export default function MasterShell({
  title, sub, search, onSearch, placeholder, onNew, newLabel, count, countLabel, actions, children,
}) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{sub}</div>
        </div>
        <span className="spacer" />
        {actions}
        {onNew && (
          <button className="btn btn-primary" onClick={onNew}>
            <Icon name="plus" /> {newLabel}
          </button>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>{countLabel}</h3>
          <span className="badge grey">{count}</span>
          <span className="spacer" />
          <label className="panel-search">
            <Icon name="search" size={14} />
            <input
              value={search}
              onChange={e => onSearch(e.target.value)}
              placeholder={placeholder}
              aria-label={`Search ${countLabel.toLowerCase()}`}
            />
          </label>
        </div>
        {children}
      </section>
    </div>
  );
}

export function EmptyRow({ colSpan, search, noun }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="empty">
          <span className="t">Nothing to show</span>
          {search ? `No ${noun} matches that search.` : `No ${noun} on record yet.`}
        </div>
      </td>
    </tr>
  );
}
