/* Brand mark: a doorway / arch — the threshold.
   Rendered as the system's gradient tile (.brand-mark) with the glyph in
   currentColor, so it sits on the dark rail without any per-theme logic. */

export default function FoyerMark({ size = 30, className = "" }) {
  const r = Math.round(size * 0.23);
  return (
    <span
      className={"brand-mark " + className}
      style={{ width: size, height: size, borderRadius: r }}
      aria-hidden="true"
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 20V12a6 6 0 0 1 12 0v8" />
        <path d="M4 20h16" />
      </svg>
    </span>
  );
}
