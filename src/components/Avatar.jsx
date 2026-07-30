/* Identity tag (.sym-tag) — a square initials chip.

   The tint is hashed from the name so a person always reads the same way, but
   it only ever varies the *strength* of the one accent: a second hue family
   would compete with it. The label keeps a fixed, readable foreground. */

const STEPS = [8, 12, 17, 23, 30, 38];

export function tintFor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return STEPS[h % STEPS.length];
}

export function initials(name = "") {
  return name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

export default function Avatar({ name = "", size = 30, src = "", className = "" }) {
  const radius = Math.max(6, Math.round(size * 0.23));
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.36),
    borderRadius: radius,
    background: `color-mix(in srgb, var(--accent) ${tintFor(name)}%, var(--panel-3))`,
    color: "var(--accent-2)",
    overflow: "hidden",
  };

  return (
    <span className={"sym-tag " + className} style={style}>
      {src
        ? <img className="avatar-img" src={src} alt="" width={size} height={size} />
        : initials(name)}
    </span>
  );
}
