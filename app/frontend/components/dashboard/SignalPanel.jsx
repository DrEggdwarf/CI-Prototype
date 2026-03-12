import { colors, fonts, radii } from "../../styles/tokens";

/**
 * SignalPanel — panel latéral fixe affichant les signaux faibles IA.
 *
 * @param {Object}  props
 * @param {Array}   props.signals - [{ id, icon, title, description, severity }]
 *                                  severity: "h" | "m" | "l"
 */
export default function SignalPanel({ signals = [] }) {
  const visibleSignals = signals.slice(0, 5);

  return (
    <aside style={styles.container}>
      <div style={styles.header}>SIGNAUX IA</div>

      {visibleSignals.length === 0 ? (
        <p style={styles.empty}>Aucun signal détecté</p>
      ) : (
        visibleSignals.map((signal) => (
          <div key={signal.id} style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.titleRow}>
                <span style={styles.icon}>{signal.icon}</span>
                <span style={styles.title}>{signal.title}</span>
              </div>
              <span style={{ ...styles.badge, ...severityStyles[signal.severity] }}>
                {severityLabels[signal.severity]}
              </span>
            </div>
            <p style={styles.description}>{signal.description}</p>
          </div>
        ))
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Severity config
// ---------------------------------------------------------------------------

const severityLabels = {
  h: "Élevé",
  m: "Moyen",
  l: "Faible",
};

const severityStyles = {
  h: { backgroundColor: "#fef2f2", color: "#dc2626" },
  m: { backgroundColor: "#fefce8", color: "#92400e" },
  l: { backgroundColor: "#f0fdf4", color: "#15803d" },
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    width: 242,
    flexShrink: 0,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    height: "100%",
    overflowY: "auto",
    padding: 12,
    boxSizing: "border-box",
  },

  header: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".6px",
    color: colors.ai,
    marginBottom: 10,
  },

  empty: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text3,
    textAlign: "center",
    margin: 0,
    paddingTop: 24,
  },

  card: {
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "8px 10px",
    marginBottom: 8,
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },

  icon: {
    fontSize: 14,
    lineHeight: 1,
    flexShrink: 0,
  },

  title: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  badge: {
    fontFamily: fonts.outfit,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    padding: "1px 5px",
    borderRadius: 3,
    whiteSpace: "nowrap",
    flexShrink: 0,
    lineHeight: 1.4,
  },

  description: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text2,
    lineHeight: 1.4,
    margin: "4px 0 0 0",
  },
};
