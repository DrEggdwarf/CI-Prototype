import { colors, fonts, radii, shadows } from "../../styles/tokens";
import { useTranslation } from "../../lib/useTranslation";

/**
 * KpiBar — barre de 5 KPIs pour le header du dashboard.
 *
 * @param {Object}   props
 * @param {Array}    props.controls - liste des contrôles ({status, pass_rate, ...})
 * @param {Array}    props.signals  - liste des signaux IA
 * @param {Function} [props.onKpiClick] - callback optionnel (kpiKey) => void
 */
export default function KpiBar({ controls = [], signals = [] }) {
  const { t } = useTranslation();

  // --- KPI calculations ---
  const done = controls.filter((c) => c.status === "done");
  const pending = controls.filter((c) => c.status === "pending");
  const overdue = controls.filter((c) => c.status === "overdue");

  const successRate =
    done.length > 0
      ? Math.round(done.reduce((sum, c) => sum + (c.pass_rate || 0), 0) / done.length)
      : 0;

  const kpis = [
    { key: "completed", label: t("dashboard.kpi.completed"), value: done.length, color: colors.low },
    { key: "pending", label: t("dashboard.kpi.pending"), value: pending.length, color: colors.accent },
    { key: "overdue", label: t("dashboard.kpi.overdue"), value: overdue.length, color: colors.critical },
    { key: "signals", label: t("dashboard.kpi.signals"), value: signals.length, color: colors.ai },
    { key: "success_rate", label: t("dashboard.kpi.success_rate"), value: `${successRate}%`, color: colors.medium },
  ];

  return (
    <div style={styles.bar}>
      {kpis.map((kpi) => (
        <div
          key={kpi.key}
          style={styles.card}
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
