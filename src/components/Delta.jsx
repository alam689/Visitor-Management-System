import Icon from "./Icon";
import { FMT } from "../utils/format";

/* Change is signalled redundantly — arrow direction + colour + sign character —
   so it never depends on colour alone. */
export default function Delta({ pct, label, size = 12 }) {
  const cls = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return (
    <span className={"delta " + cls} style={{ fontSize: size }}>
      {pct !== 0 && pct != null && <Icon name={pct > 0 ? "arrowUp" : "arrowDown"} size={size - 1} />}
      <span>{FMT.pct(pct)}</span>
      {label && <span className="faint" style={{ marginLeft: 4 }}>{label}</span>}
    </span>
  );
}
