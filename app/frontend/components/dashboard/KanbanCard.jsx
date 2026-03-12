import { useState, useCallback } from "react";
import { colors, fonts, radii } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CRIT_LABELS = {
  critical: "Critique",
  high: "Élevé",
  medium: "Moyen",
  low: "Faible",
};

const CRIT_STRIPE = {
  critical: "#dc2626",
  high: "#ea6c10",
  medium: "#b58a00",
  low: "#16a34a",
};

const CRIT_BADGE = {
  critical: { background: "#fef2f2", color: "#dc2626" },
  high: { background: "#fff7ed", color: "#c2410c" },
  medium: { background: "#fefce8", color: "#92400e" },
  low: { background: "#f0fdf4", color: "#15803d" },
};

const DOMAIN_LABELS = {
  finance: "Finance",
  it: "IT",
  rh: "RH",
  achats: "Achats",
  logistique: "Logistique",
  juridique: "Juridique",
};

const MONTH_SHORT_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format "YYYY-MM-DD" into short French date: "12 mars", "3 avr."
 * @param {string} iso - Date string in YYYY-MM-DD format
 * @returns {string}
 */
function formatDateFr(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_SHORT_FR[m - 1]}`;
}

// ---------------------------------------------------------------------------
// KanbanCard
// ---------------------------------------------------------------------------

/**
 * KanbanCard — carte de contrôle réutilisable pour le kanban board.
 *
 * @param {Object}   props
 * @param {Object}   props.control   - { id, name, domain, criticality, due_date, status, pass_rate, assignee, duration }
 * @param {Function} props.onClick   - (control) => void — ouvre la modal détail
 * @param {boolean}  [props.draggable=false] - si la carte est draggable
 * @param {boolean}  [props.done=false]      - si true, style grisé + barré
 */
export default function KanbanCard({
  control,
  onClick,
  draggable = false,
  done = false,
}) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const crit = control.criticality || "medium";
  const stripeColor = done ? "#94a3b8" : (CRIT_STRIPE[crit] || CRIT_STRIPE.medium);
  const critBadge = CRIT_BADGE[crit] || CRIT_BADGE.medium;

  const handleClick = useCallback(() => {
    onClick?.(control);
  }, [control, onClick]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.(control);
      }
    },
    [control, onClick],
  );

  const handleDragStart = useCallback(
    (e) => {
      if (!draggable) return;
      e.dataTransfer.setData("text/plain", String(control.id));
      e.dataTransfer.effectAllowed = "move";
      setDragging(true);
    },
    [draggable, control.id],
  );

  const handleDragEnd = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.card,
        cursor: draggable ? "grab" : "pointer",
        opacity: done ? 0.6 : dragging ? 0.5 : 1,
        borderColor: hovered ? colors.border2 : colors.border,
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered
          ? "0 3px 10px rgba(0,0,0,.07)"
          : "0 1px 3px rgba(0,0,0,.04)",
      }}
    >
      {/* Stripe gauche — criticité */}
      <div
        aria-hidden="true"
        style={{
          ...styles.stripe,
          backgroundColor: stripeColor,
        }}
      />

      {/* Ligne 1 — Nom du contrôle */}
      <div
        style={{
          ...styles.name,
          textDecoration: done ? "line-through" : "none",
        }}
        title={control.name}
      >
        {control.name}
      </div>

      {/* Ligne 2 — Badges */}
      <div style={styles.badges}>
        <span
          style={{
            ...styles.badgeBase,
            backgroundColor: critBadge.background,
            color: critBadge.color,
          }}
        >
          {CRIT_LABELS[crit] || crit}
        </span>

        {control.domain && DOMAIN_LABELS[control.domain] && (
          <span style={styles.badgeDomain}>
            {DOMAIN_LABELS[control.domain]}
          </span>
        )}
      </div>

      {/* Ligne 3 — Métadonnées */}
      <div style={styles.meta}>
        {control.due_date && (
          <span style={styles.metaItem}>
            📅 {formatDateFr(control.due_date)}
          </span>
        )}
        {control.duration != null && (
          <span style={styles.metaItem}>
            🔄 {control.duration}j
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  card: {
    position: "relative",
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    padding: "10px 12px 10px 14px",
    minHeight: 72,
    flexShrink: 0,
    overflow: "hidden",
    transition: "border-color .15s ease, transform .15s ease, box-shadow .15s ease",
    outline: "none",
    userSelect: "none",
  },

  stripe: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 3,
    height: "100%",
    borderRadius: `${radii.card} 0 0 ${radii.card}`,
  },

  name: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    marginBottom: 5,
  },

  badges: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 5,
  },

  badgeBase: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 3,
    lineHeight: 1.5,
    whiteSpace: "nowrap",
  },

  badgeDomain: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 3,
    lineHeight: 1.5,
    whiteSpace: "nowrap",
    backgroundColor: colors.s3,
    color: colors.text2,
  },

  meta: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
  },

  metaItem: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text3,
    lineHeight: 1.4,
    whiteSpace: "nowrap",
  },
};
