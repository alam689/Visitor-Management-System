import { useState } from "react";
import Icon from "./Icon";
import { dataUrlSize, readImage } from "../utils/image";

/* Photos and visiting cards are downscaled to a data URL before they reach the
   store — see utils/image.js for why. */
export default function ImagePicker({ label, value, onChange, card, maxDim = 640 }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await readImage(file, { maxDim }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rf">
      {label && <label>{label}</label>}
      <div className="img-pick">
        <span className={"img-thumb" + (card ? " card" : "")}>
          {value ? <img src={value} alt="" /> : <Icon name={card ? "scan" : "camera"} size={18} />}
        </span>
        <div>
          <div className="img-actions">
            <span className="btn file-btn">
              <Icon name="plus" /> {busy ? "Processing…" : value ? "Replace" : "Upload"}
              <input type="file" accept="image/*" onChange={pick} aria-label={label || "Upload image"} />
            </span>
            {value && (
              <button className="btn btn-ghost" onClick={() => { onChange(""); setError(""); }}>
                Remove
              </button>
            )}
          </div>
          <div className="img-note">
            {error
              ? <span className="down">{error}</span>
              : value ? `Stored at ~${dataUrlSize(value)} KB` : `JPEG or PNG · downscaled to ${maxDim}px`}
          </div>
        </div>
      </div>
    </div>
  );
}
