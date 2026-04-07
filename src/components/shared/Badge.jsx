/**
 * Badge – coloured pill for status values.
 * Props: label (string), type ("success"|"warning"|"error"|"info"|"neutral")
 */
export default function Badge({ label, type = "neutral" }) {
  const cls = {
    success: "badge--success",
    warning: "badge--warning",
    error: "badge--error",
    info: "badge--info",
    neutral: "badge--neutral",
  }[type] ?? "badge--neutral";

  return <span className={`badge ${cls}`}>{label}</span>;
}
