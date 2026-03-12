import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { colors, fonts, radii, shadows, zIndex } from "../../styles/tokens";
import TodoPanel from "./TodoPanel";
import TeamChatPanel from "./TeamChatPanel";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANELS = [
  { key: "chat", label: "Chat", icon: "\u{1F4AC}" },
  { key: "todos", label: "T\u00e2ches", icon: "\u2713" },
  { key: "ai", label: "Chat IA", icon: "\u2728" },
];

const MODAL_W = 380;
const MODAL_H = 500;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FabBubble({ panel, index, onClick, visible }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onClick(panel.key)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...fabStyles.bubble,
        bottom: 68 + index * 52,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.3)",
        transitionDelay: visible ? `${index * 50}ms` : "0ms",
        backgroundColor: hovered ? colors.accent : colors.s1,
        color: hovered ? "#fff" : colors.text,
        borderColor: hovered ? colors.accent : colors.border,
      }}
      title={panel.label}
    >
      <span style={fabStyles.bubbleIcon}>{panel.icon}</span>
      {visible && (
        <span
          style={{
            ...fabStyles.bubbleLabel,
            opacity: visible ? 1 : 0,
            color: hovered ? "#fff" : colors.text2,
          }}
        >
          {panel.label}
        </span>
      )}
    </button>
  );
}

function ModalPanel({ panelKey, onClose, children }) {
  return createPortal(
    <div style={fabStyles.modalBackdrop} onClick={onClose}>
      <div
        style={fabStyles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={fabStyles.modalHeader}>
          <span style={fabStyles.modalTitle}>
            {PANELS.find((p) => p.key === panelKey)?.label || ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={fabStyles.modalClose}
            title="Fermer"
          >
            {"\u00D7"}
          </button>
        </div>
        <div style={fabStyles.modalBody}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WorkspaceFab({
  todos = [],
  memberId,
  teamMessages = [],
  currentMemberId,
  allMembers = [],
}) {
  const [expanded, setExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  const handleBubbleClick = useCallback((key) => {
    setActivePanel((prev) => (prev === key ? null : key));
    setExpanded(false);
  }, []);

  const handleClose = useCallback(() => {
    setActivePanel(null);
  }, []);

  return (
    <>
      {/* FAB container */}
      <div
        style={fabStyles.container}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* Sub-bubbles */}
        {PANELS.map((panel, i) => (
          <FabBubble
            key={panel.key}
            panel={panel}
            index={i}
            onClick={handleBubbleClick}
            visible={expanded}
          />
        ))}

        {/* Main FAB button */}
        <button
          type="button"
          style={{
            ...fabStyles.mainBtn,
            transform: expanded ? "rotate(45deg)" : "rotate(0deg)",
          }}
          title="Outils"
        >
          +
        </button>
      </div>

      {/* Active modal */}
      {activePanel === "chat" && (
        <ModalPanel panelKey="chat" onClose={handleClose}>
          <TeamChatPanel
            messages={teamMessages}
            currentMemberId={currentMemberId}
            allMembers={allMembers}
          />
        </ModalPanel>
      )}

      {activePanel === "todos" && (
        <ModalPanel panelKey="todos" onClose={handleClose}>
          <TodoPanel todos={todos} memberId={memberId} />
        </ModalPanel>
      )}

      {activePanel === "ai" && (
        <ModalPanel panelKey="ai" onClose={handleClose}>
          <div style={fabStyles.aiPlaceholder}>
            <span style={fabStyles.aiIcon}>{"\u2728"}</span>
            <span style={fabStyles.aiText}>
              {"Chat IA bient\u00f4t disponible"}
            </span>
          </div>
        </ModalPanel>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const fabStyles = {
  container: {
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: zIndex.overlay,
    // Extend the hover zone upward so mouse can reach bubbles without leaving
    paddingTop: 200,
    paddingLeft: 80,
    // Offset the padding so the button stays visually in the same place
    pointerEvents: "auto",
  },

  mainBtn: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    backgroundColor: colors.accent,
    color: "#fff",
    border: "none",
    fontSize: 24,
    fontWeight: 300,
    fontFamily: fonts.outfit,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(37,99,235,.35)",
    transition: "transform .2s ease, box-shadow .2s ease",
  },

  bubble: {
    position: "absolute",
    right: 4,
    width: "auto",
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 14px",
    cursor: "pointer",
    boxShadow: shadows.dropdown,
    transition: "all .2s ease",
    whiteSpace: "nowrap",
  },

  bubbleIcon: {
    fontSize: 16,
    lineHeight: 1,
    flexShrink: 0,
  },

  bubbleLabel: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    transition: "opacity .15s ease",
  },

  // Modal
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: zIndex.modal,
    backgroundColor: "transparent",
  },

  modal: {
    position: "fixed",
    bottom: 80,
    right: 24,
    width: MODAL_W,
    height: MODAL_H,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,.15)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: zIndex.modal,
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },

  modalTitle: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 700,
    color: colors.text,
  },

  modalClose: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 600,
    color: colors.text3,
    lineHeight: 1,
  },

  modalBody: {
    flex: 1,
    overflow: "hidden",
    minHeight: 0,
  },

  // AI placeholder
  aiPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 12,
    padding: 24,
  },

  aiIcon: {
    fontSize: 32,
  },

  aiText: {
    fontFamily: fonts.outfit,
    fontSize: 14,
    color: colors.text3,
    textAlign: "center",
  },
};
