import { createContext, useContext, useState, useCallback, useRef } from "react";
import { createElement } from "react";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext(null);

let _nextId = 0;

/**
 * Toast Provider — wrap your app (or layout) with this.
 * Children get access to useToast().
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      const id = ++_nextId;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast],
  );

  const value = { addToast, removeToast };

  return createElement(
    ToastContext.Provider,
    { value },
    children,
    createElement(ToastContainer, { toasts, onDismiss: removeToast }),
  );
}

/**
 * Hook to show toasts from any component.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.addToast("Contrôle assigné", { type: "success" });
 *   toast.addToast("Charge > 80%", { type: "warning", duration: 6000 });
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Toast Container (renders the toast stack)
// ---------------------------------------------------------------------------

const TYPE_STYLES = {
  success: { bg: "#f0fdf4", border: "#86efac", color: "#15803d", icon: "\u2713" },
  error: { bg: "#fef2f2", border: "#fca5a5", color: "#dc2626", icon: "\u2717" },
  warning: { bg: "#fffbeb", border: "#fde68a", color: "#92400e", icon: "\u26A0" },
  info: { bg: "#eef2ff", border: "#c7d2fe", color: "#4338ca", icon: "\u2139" },
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return createElement(
    "div",
    {
      style: {
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 500,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 8,
        pointerEvents: "none",
      },
    },
    toasts.map((t) => createElement(Toast, { key: t.id, toast: t, onDismiss })),
  );
}

function Toast({ toast, onDismiss }) {
  const s = TYPE_STYLES[toast.type] || TYPE_STYLES.info;

  return createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,.1)",
        fontFamily: '"Outfit", sans-serif',
        fontSize: 13,
        fontWeight: 500,
        color: s.color,
        pointerEvents: "auto",
        animation: "toast-slide-in .25s ease-out",
        maxWidth: 380,
      },
    },
    createElement("span", { style: { fontSize: 16, lineHeight: 1 } }, s.icon),
    createElement("span", { style: { flex: 1 } }, toast.message),
    createElement(
      "button",
      {
        type: "button",
        onClick: () => onDismiss(toast.id),
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          color: s.color,
          opacity: 0.6,
          fontSize: 14,
          lineHeight: 1,
          padding: "0 2px",
        },
      },
      "\u00D7",
    ),
  );
}
