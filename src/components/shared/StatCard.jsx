import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * StatCard – displays a single KPI metric.
 *
 * Props:
 *  - title (string)     : Metric label
 *  - value (string)     : Primary value to display
 *  - delta (string)     : e.g. "+12.4%"
 *  - deltaType (string) : "up" | "down" | "neutral"
 *  - icon (Component)   : Lucide icon component
 *  - accent (string)    : CSS variable name or hex color for icon bg
 *  - subtitle (string)  : Optional small descriptor below value
 */
export default function StatCard({
  title,
  value,
  delta,
  deltaType = "neutral",
  icon: Icon,
  accent = "var(--accent-blue)",
  subtitle,
}) {
  const DeltaIcon =
    deltaType === "up"
      ? TrendingUp
      : deltaType === "down"
      ? TrendingDown
      : Minus;

  const deltaClass =
    deltaType === "up"
      ? "delta--up"
      : deltaType === "down"
      ? "delta--down"
      : "delta--neutral";

  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <div className="stat-card__icon" style={{ background: accent + "22", color: accent }}>
          {Icon && <Icon size={20} />}
        </div>
        {delta && (
          <div className={`stat-card__delta ${deltaClass}`}>
            <DeltaIcon size={12} />
            <span>{delta}</span>
          </div>
        )}
      </div>
      <div className="stat-card__body">
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__title">{title}</div>
        {subtitle && <div className="stat-card__subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}
