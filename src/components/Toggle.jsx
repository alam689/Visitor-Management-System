export default function Toggle({ on, onClick, label }) {
  return (
    <button
      className={"switch" + (on ? " on" : "")}
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
    />
  );
}
