import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { colors, fonts, radii, zIndex } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Animation CSS — injected once into head
// ---------------------------------------------------------------------------

const MODAL_CSS = `
@keyframes dockModalIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
.dock-modal-inner {
  animation: dockModalIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
}
`;

let cssInjected = false;
function ensureCss() {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement("style");
  style.textContent = MODAL_CSS;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// DockModal
// ---------------------------------------------------------------------------

/**
 * Generic portal modal for dock items.
 *
 * Props:
 *   title    {string}  — Modal title
 *   icon     {object}  — FontAwesome icon object
 *   color    {string}  — Accent color (hex)
 *   isOpen   {boolean}
 *   onClose  {func}
 *   children {node}
 */
export default function DockModal({ title, icon, color, isOpen, onClose, children }) {
  const innerRef = useRef(null);

  // Inject animation CSS on first render
  useEffect(() => {
    ensureCss();
  }, []);

  // Trap focus & keyboard close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    // Focus the modal container for accessibility
    innerRef.current?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const accent = color || colors.accent;

  return createPortal(
    <div
      style={styles.overlay}
      onClick={(e) => {
        // Only close when clicking the overlay itself
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={innerRef}
        className="dock-modal-inner"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={styles.modal}
      >
        {/* ---- Header ---- */}
        <div
          style={{
            ...styles.header,
            borderBottom: `2px solid ${accent}20`,
          }}
        >
          <div style={styles.headerLeft}>
            {/* Icon pill */}
            <div
              style={{
                ...styles.iconPill,
                backgroundColor: `${accent}18`,
              }}
            >
              <FontAwesomeIcon
                icon={icon}
                style={{ fontSize: 16, color: accent }}
              />
            </div>
            <span
              style={{
                ...styles.title,
                color: accent,
              }}
            >
              {title}
            </span>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={styles.closeBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.s3;
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = colors.text2;
            }}
          >
            &times;
          </button>
        </div>

        {/* ---- Body ---- */}
        <div style={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: zIndex.modal,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "85vw",
    maxWidth: 900,
    height: "80vh",
    maxHeight: 700,
    backgroundColor: colors.s1,
    borderRadius: 16,
    boxShadow:
      "0 24px 64px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    outline: "none",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    flexShrink: 0,
    backgroundColor: colors.s1,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  title: {
    fontFamily: fonts.outfit,
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.2,
  },

  closeBtn: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 22,
    fontWeight: 400,
    color: colors.text2,
    lineHeight: 1,
    transition: "background-color 0.15s ease, color 0.15s ease",
    padding: 0,
    flexShrink: 0,
  },

  body: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },
};
