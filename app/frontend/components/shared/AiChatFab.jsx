import { useState, useRef, useEffect, useCallback } from "react";
import { colors, fonts, shadows, radii } from "../../styles/tokens";

const WELCOME_MESSAGE = {
  role: "ai",
  text: "Bonjour ! Je suis l'assistant IA du CI Dashboard. Comment puis-je vous aider ?",
};

const AUTO_REPLY =
  "Cette fonctionnalité sera bientôt disponible. Le chat IA sera connecté dans une prochaine mise à jour.";

export default function AiChatFab() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [fabHover, setFabHover] = useState(false);
  const [sendHover, setSendHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "ai", text: AUTO_REPLY },
    ]);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px"; // max ~4 lines
  };

  const canSend = input.trim().length > 0;

  return (
    <>
      {/* Chat Panel */}
      <div
        style={{
          ...s.panel,
          ...(open ? s.panelOpen : s.panelClosed),
        }}
        role="dialog"
        aria-label="Assistant IA"
      >
        {/* Header */}
        <div style={s.header}>
          <span style={s.headerTitle}>✦ Assistant IA</span>
          <button
            onClick={() => setOpen(false)}
            style={{
              ...s.closeBtn,
              ...(closeHover ? s.closeBtnHover : {}),
            }}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            aria-label="Fermer le chat"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div style={s.messagesZone}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={msg.role === "user" ? s.bubbleRowUser : s.bubbleRowAi}
            >
              <div
                style={msg.role === "user" ? s.bubbleUser : s.bubbleAi}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input zone */}
        <div style={s.inputZone}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question…"
            rows={1}
            style={s.textarea}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              ...s.sendBtn,
              ...(canSend
                ? sendHover
                  ? s.sendBtnHover
                  : {}
                : s.sendBtnDisabled),
            }}
            onMouseEnter={() => setSendHover(true)}
            onMouseLeave={() => setSendHover(false)}
            aria-label="Envoyer"
          >
            ➤
          </button>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          ...s.fab,
          ...(fabHover ? s.fabHover : {}),
          ...(open ? s.fabOpen : {}),
        }}
        onMouseEnter={() => setFabHover(true)}
        onMouseLeave={() => setFabHover(false)}
        aria-label="Ouvrir l'assistant IA"
      >
        <span style={s.fabIcon}>✦</span>
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const TRANSITION_PANEL = "opacity 0.2s ease, transform 0.2s ease";

const s = {
  // FAB -------------------------------------------------------------------
  fab: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: "50%",
    backgroundColor: colors.ai,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.45)",
    zIndex: 450,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  },
  fabHover: {
    transform: "scale(1.05)",
    boxShadow: "0 6px 20px rgba(124, 58, 237, 0.55)",
  },
  fabOpen: {
    transform: "rotate(45deg)",
  },
  fabIcon: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 1,
    userSelect: "none",
    pointerEvents: "none",
  },

  // Panel -----------------------------------------------------------------
  panel: {
    position: "fixed",
    bottom: 96,
    right: 24,
    width: 380,
    maxHeight: "70vh",
    height: 520,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,.12)",
    zIndex: 450,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: TRANSITION_PANEL,
  },
  panelOpen: {
    opacity: 1,
    transform: "translateY(0) scale(1)",
    pointerEvents: "auto",
  },
  panelClosed: {
    opacity: 0,
    transform: "translateY(10px) scale(0.95)",
    pointerEvents: "none",
  },

  // Header ----------------------------------------------------------------
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    backgroundColor: "#f5f0ff",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: fonts.outfit,
    fontWeight: 600,
    fontSize: 14,
    color: colors.ai,
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    color: colors.text2,
    width: 28,
    height: 28,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s, color 0.15s",
  },
  closeBtnHover: {
    backgroundColor: colors.s3,
    color: colors.text,
  },

  // Messages zone ---------------------------------------------------------
  messagesZone: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  // Bubble rows
  bubbleRowUser: {
    display: "flex",
    justifyContent: "flex-end",
  },
  bubbleRowAi: {
    display: "flex",
    justifyContent: "flex-start",
  },

  // Bubbles
  bubbleUser: {
    maxWidth: "80%",
    padding: "8px 12px",
    borderRadius: "12px 12px 2px 12px",
    backgroundColor: "#eef2ff",
    color: colors.text,
    fontFamily: fonts.outfit,
    fontSize: 13,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  bubbleAi: {
    maxWidth: "80%",
    padding: "8px 12px",
    borderRadius: "12px 12px 12px 2px",
    backgroundColor: colors.s2,
    color: colors.text,
    fontFamily: fonts.outfit,
    fontSize: 13,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  // Input zone ------------------------------------------------------------
  inputZone: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    padding: "10px 12px",
    borderTop: `1px solid ${colors.border}`,
    flexShrink: 0,
    backgroundColor: colors.s1,
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    fontFamily: fonts.outfit,
    fontSize: 13,
    lineHeight: 1.5,
    color: colors.text,
    outline: "none",
    backgroundColor: colors.s2,
    maxHeight: 96,
    overflowY: "auto",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "none",
    backgroundColor: colors.ai,
    color: "#ffffff",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.15s, transform 0.15s",
  },
  sendBtnHover: {
    backgroundColor: colors.ai2,
    transform: "scale(1.05)",
  },
  sendBtnDisabled: {
    backgroundColor: colors.s3,
    color: colors.text3,
    cursor: "not-allowed",
  },
};
