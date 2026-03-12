import { useState } from "react";
import { colors, fonts, radii, shadows } from "../../styles/tokens";

/**
 * KpiBar — barre de 5 KPIs pour le header du dashboard.
 *
 * @param {Object}   props
 * @param {Array}    props.controls - liste des contrôles ({status, pass_rate, ...})
 * @param {Array}    props.signals  - liste des signaux IA
 * @param {Function} [props.onKpiClick] - callback optionnel (kpiKey) => void
 */
export default function KpiBar({ controls = [], signals = [], onKpiClick }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // --- KPI calculations ---
  const done = controls.filter((c) => c.status === "done");
  const pending = controls.filter((c) => c.status === "pending");
  const overdue = controls.filter((c) => c.status === "overdue");

  const successRate =
    done.length > 0
      ? Math.round(done.reduce((sum, c) => sum + (c.pass_rate || 0), 0) / done.length)
      : 0;

  const kpis = [
    { key: "completed", label: "Complétés", value: done.length, color: colors.low },
    { key: "pending", label: "En cours", value: pending.length, color: colors.accent },
    { key: "overdue", label: "En retard", value: overdue.length, color: colors.critical },
    { key: "signals", label: "Signaux IA", value: signals.length, color: colors.ai },
    { key: "success_rate", label: "Taux de succès", value: `${successRate}%`, color: colors.medium },
  ];

  return (
    <div style={styles.bar}>
      {kpis.map((kpi, index) => (
        <div
          key={kpi.key}
          role="button"
          tabIndex={0}
          style={{
            ...styles.card,
            ...(hoveredIndex === index ? styles.cardHover : {}),
          }}
          onClick={() => onKpiClick?.(kpi.key)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onKpiClick?.(kpi.key);
            }
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <span style={styles.label}>{kpi.label}</span>
          <span style={{ ...styles.value, color: kpi.color }}>{kpi.value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  bar: {
    display: "flex",
    gap: 12,
    flexShrink: 0,
  },

  card: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 12px",
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    boxShadow: shadows.card,
    cursor: "pointer",
    transition: "border-color 0.15s ease, transform 0.15s ease",
    outline: "none",
  },

  cardHover: {
    borderColor: colors.border2,
    transform: "translateY(-1px)",
  },

  label: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".6px",
    color: colors.text2,
    lineHeight: 1,
  },

  value: {
    fontFamily: fonts.dmMono,
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1,
  },
};
