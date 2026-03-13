import { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { router } from "@inertiajs/react";
import { colors, fonts, zIndex } from "../../styles/tokens";
import { useTranslation } from "../../lib/useTranslation";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 680;
const RIGHT_COL_W = 248;

const CRITICALITY_COLORS = {
  critical: { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  high: { bg: "#fff7ed", color: "#ea6c10", border: "#fdba74" },
  medium: { bg: "#fefce8", color: "#b58a00", border: "#fde68a" },
  low: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
};


const STATUS_COLORS = {
  pending: { bg: "#eef2ff", color: "#2563eb", border: "#bfdbfe" },
  overdue: { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  done: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
};

const ACTION_DOT_COLORS = {
  comment: colors.accent,
  status_change: colors.medium,
  assignment: "#0891b2",
  creation: colors.low,
  ai_analysis: colors.ai,
};

// ---------------------------------------------------------------------------
// Keyframes — injected once
// ---------------------------------------------------------------------------

let stylesInjected = false;

function injectKeyframes() {
  if (stylesInjected) return;
  stylesInjected = true;

  const sheet = document.createElement("style");
  sheet.textContent = `
    @keyframes cm-fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes cm-slideUp {
      from { transform: translateY(12px); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(sheet);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAssigneeName(control, members) {
  if (control.assignee?.name) return control.assignee.name;
  if (control.assignee_id && members?.length) {
    const m = members.find((mem) => mem.id === control.assignee_id);
    if (m) return m.name;
  }
  return "Non assigné";
}

function getRiskInfo(passRate) {
  const score = Math.round(100 - (passRate || 0));
  if (score > 35) {
    return { score, bg: "#fef2f2", color: "#dc2626", border: "#fca5a5", level: "high" };
  }
  if (score >= 20) {
    return { score, bg: "#fefce8", color: "#b58a00", border: "#fde68a", level: "medium" };
  }
  return { score, bg: "#f0fdf4", color: "#16a34a", border: "#86efac", level: "low" };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Badge({ label, bg, color, border }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 600,
        fontFamily: fonts.outfit,
        lineHeight: 1.4,
        borderRadius: 20,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function TimelineEntry({ comment, isLast }) {
  const dotColor = ACTION_DOT_COLORS[comment.action_type] || colors.text3;
  const hasAi = comment.ai_question || comment.ai_answer;

  return (
    <div style={{ display: "flex", gap: 10, position: "relative" }}>
      {/* Dot + vertical line */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: 12,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: dotColor,
            flexShrink: 0,
            marginTop: 3,
          }}
        />
        {!isLast && (
          <div
            style={{
              width: 1,
              flex: 1,
              backgroundColor: colors.border,
              marginTop: 4,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            fontFamily: fonts.outfit,
            color: colors.text,
            lineHeight: 1.3,
          }}
        >
          {comment.action_type || "Commentaire"}
        </div>
        <div
          style={{
            fontSize: 10,
            fontFamily: fonts.outfit,
            color: colors.text3,
            marginTop: 2,
          }}
        >
          {comment.author || "Système"} &middot; {formatDateTime(comment.created_at)}
        </div>
        {comment.body && (
          <div
            style={{
              fontSize: 11,
              fontFamily: fonts.outfit,
              color: colors.text2,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {comment.body}
          </div>
        )}

        {/* AI analysis block */}
        {hasAi && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              backgroundColor: "rgba(124,58,237,.04)",
              border: "1px solid rgba(124,58,237,.12)",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                fontFamily: fonts.outfit,
                textTransform: "uppercase",
                letterSpacing: ".5px",
                color: colors.ai,
                marginBottom: 6,
              }}
            >
              ANALYSE IA
            </div>
            {comment.ai_question && (
              <div
                style={{
                  fontSize: 11,
                  fontFamily: fonts.outfit,
                  fontStyle: "italic",
                  color: colors.text2,
                  lineHeight: 1.5,
                  marginBottom: comment.ai_answer ? 4 : 0,
                }}
              >
                {comment.ai_question}
              </div>
            )}
            {comment.ai_answer && (
              <div
                style={{
                  fontSize: 11,
                  fontFamily: fonts.outfit,
                  color: colors.text2,
                  lineHeight: 1.5,
                }}
              >
                {comment.ai_answer}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 0",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          fontFamily: fonts.outfit,
          color: colors.text3,
          textTransform: "uppercase",
          letterSpacing: ".3px",
          flexShrink: 0,
          minWidth: 72,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          fontFamily: fonts.outfit,
          fontWeight: 500,
          color: colors.text,
          marginLeft: "auto",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ControlModal({ control, members, onClose }) {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState(null);

  // Inject keyframes on first render
  useEffect(() => {
    injectKeyframes();
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!control) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [control, onClose]);

  // Focus trap — focus panel on mount
  useEffect(() => {
    if (!control || !panelRef.current) return;
    panelRef.current.focus();
  }, [control]);

  // Reset local comments when control changes (new modal open or Inertia reload)
  useEffect(() => {
    setLocalComments(null);
  }, [control]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose?.();
      }
    },
    [onClose],
  );

  const handleSendComment = useCallback(() => {
    const body = commentText.trim();
    if (!body || !control?.id) return;

    // Optimistic UI — add the comment locally right away
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      author: "Admin",
      body,
      action_type: "note",
      created_at: new Date().toISOString(),
    };

    setLocalComments((prev) => {
      const base = prev || control.comments || [];
      return [optimisticComment, ...base];
    });
    setCommentText("");

    fetch(`/api/controls/${control.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment: { author: "Admin", body, action_type: "note" },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Comment failed (${res.status})`);
        // Background reload to sync server state into Inertia props
        router.reload({ only: ["controls"] });
      })
      .catch((err) => {
        console.error("handleSendComment error:", err);
        alert("Impossible d'envoyer le commentaire. Veuillez réessayer.");
        // Roll back optimistic update
        setLocalComments(null);
      });
  }, [commentText, control]);

  // Don't render anything if no control
  if (!control) return null;

  const criticalityLabels = {
    critical: t("criticality.critical"),
    high:     t("criticality.high"),
    medium:   t("criticality.medium"),
    low:      t("criticality.low"),
  };

  const domainLabels = {
    finance:    t("domains.finance"),
    it:         t("domains.it"),
    rh:         t("domains.rh"),
    achats:     t("domains.achats"),
    logistique: t("domains.logistique"),
    juridique:  t("domains.juridique"),
  };

  const statusLabels = {
    pending: t("dashboard.kpi.pending"),
    overdue: t("dashboard.kpi.overdue"),
    done:    t("dashboard.kpi.completed"),
  };

  const riskLabels = {
    high:   t("criticality.high"),
    medium: t("criticality.medium"),
    low:    t("criticality.low"),
  };

  const comments = localComments || control.comments || [];
  const critColor = CRITICALITY_COLORS[control.criticality] || CRITICALITY_COLORS.medium;
  const statusColor = STATUS_COLORS[control.status] || STATUS_COLORS.pending;
  const domainColor = colors.domains?.[control.domain] || colors.accent;
  const risk = { ...getRiskInfo(control.pass_rate) };
  risk.label = riskLabels[risk.level];
  const assigneeName = getAssigneeName(control, members);

  const modal = (
    <div
      style={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`${t("dashboard.modal.details")} — ${control.name}`}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        style={styles.panel}
      >
        {/* ---- Header ---- */}
        <div style={styles.header}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.controlName}>{control.name}</div>
            <div style={styles.badges}>
              <Badge
                label={criticalityLabels[control.criticality] || control.criticality}
                bg={critColor.bg}
                color={critColor.color}
                border={critColor.border}
              />
              {control.domain && (
                <Badge
                  label={domainLabels[control.domain] || control.domain}
                  bg={`${domainColor}11`}
                  color={domainColor}
                  border={`${domainColor}33`}
                />
              )}
              <Badge
                label={statusLabels[control.status] || control.status}
                bg={statusColor.bg}
                color={statusColor.color}
                border={statusColor.border}
              />
            </div>
          </div>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            style={styles.closeBtn}
          >
            ✕
          </button>
        </div>

        {/* ---- Body — 2 columns ---- */}
        <div style={styles.body}>
          {/* Left column — Historique */}
          <div style={styles.leftCol}>
            <div style={styles.colTitle}>{t("dashboard.modal.comments")}</div>

            {comments.length === 0 ? (
              <div style={styles.emptyHistory}>
                <span style={styles.emptyText}>{t("dashboard.modal.no_comments")}</span>
              </div>
            ) : (
              <div style={styles.timeline}>
                {comments.map((comment, idx) => (
                  <TimelineEntry
                    key={comment.id || idx}
                    comment={comment}
                    isLast={idx === comments.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Comment input zone */}
            <div style={styles.commentZone}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t("dashboard.modal.add_comment")}
                style={styles.textarea}
              />
              <button
                type="button"
                onClick={handleSendComment}
                disabled={!commentText.trim()}
                style={{
                  ...styles.sendBtn,
                  opacity: commentText.trim() ? 1 : 0.5,
                  cursor: commentText.trim() ? "pointer" : "default",
                }}
              >
                {t("common.send")}
              </button>
            </div>
          </div>

          {/* Right column — Analyse IA */}
          <div style={styles.rightCol}>
            <div style={styles.colTitle}>{t("dashboard.modal.details")}</div>

            {/* Risk score circle */}
            <div style={styles.riskSection}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: `2px solid ${risk.border}`,
                  backgroundColor: risk.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: fonts.dmMono,
                    fontSize: 15,
                    fontWeight: 800,
                    color: risk.color,
                    lineHeight: 1,
                  }}
                >
                  {risk.score}
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: fonts.outfit,
                    textTransform: "uppercase",
                    letterSpacing: ".4px",
                    color: colors.text3,
                    lineHeight: 1,
                  }}
                >
                  {t("dashboard.kpi.success_rate")}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: fonts.outfit,
                    color: risk.color,
                    marginTop: 3,
                    lineHeight: 1,
                  }}
                >
                  {risk.label}
                </div>
              </div>
            </div>

            {/* Metadata list */}
            <div style={styles.metaList}>
              <MetaRow icon="📅" label={t("dashboard.modal.due_date")} value={formatDate(control.due_date)} />
              <MetaRow icon="🔄" label={t("dashboard.modal.status")} value={control.frequency || "—"} />
              <MetaRow icon="⏱️" label={t("common.controls")} value={control.duration ? `${control.duration} jours` : "—"} />
              <MetaRow icon="👤" label={t("dashboard.modal.assignee")} value={assigneeName} />
              <MetaRow icon="📊" label={t("dashboard.kpi.success_rate")} value={control.pass_rate != null ? `${control.pass_rate}%` : "—"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,.3)",
    zIndex: zIndex.modal,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "cm-fadeIn .18s ease-out",
  },

  panel: {
    width: PANEL_WIDTH,
    maxHeight: "80vh",
    backgroundColor: colors.s1,
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    outline: "none",
    animation: "cm-slideUp .18s ease-out",
  },

  // ---- Header ----
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "16px 20px 12px",
    borderBottom: `1px solid ${colors.border}`,
    position: "relative",
    flexShrink: 0,
  },

  controlName: {
    fontFamily: fonts.outfit,
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.3,
    marginBottom: 8,
  },

  badges: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },

  closeBtn: {
    width: 26,
    height: 26,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.text2,
    fontSize: 12,
    fontFamily: fonts.outfit,
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
    lineHeight: 1,
    transition: "background-color .12s",
  },

  // ---- Body ----
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    minHeight: 0,
  },

  // ---- Left column ----
  leftCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "14px 16px",
    borderRight: `1px solid ${colors.border}`,
    overflow: "hidden",
    minWidth: 0,
  },

  colTitle: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".6px",
    color: colors.text3,
    marginBottom: 12,
    flexShrink: 0,
  },

  timeline: {
    flex: 1,
    overflowY: "auto",
    paddingRight: 4,
  },

  emptyHistory: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text3,
  },

  commentZone: {
    flexShrink: 0,
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 12,
  },

  textarea: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    padding: "8px 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    backgroundColor: colors.s1,
    resize: "vertical",
    minHeight: 60,
    outline: "none",
    lineHeight: 1.5,
    transition: "border-color .12s",
  },

  sendBtn: {
    alignSelf: "flex-end",
    padding: "6px 14px",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: fonts.outfit,
    color: "#fff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: 6,
    lineHeight: 1,
    transition: "opacity .12s",
  },

  // ---- Right column ----
  rightCol: {
    width: RIGHT_COL_W,
    flexShrink: 0,
    padding: "14px 16px",
    overflowY: "auto",
  },

  riskSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  metaList: {
    display: "flex",
    flexDirection: "column",
  },
};
