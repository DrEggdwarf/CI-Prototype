import { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { colors, fonts, radii } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WELCOME_MESSAGE = {
  role: "ai",
  text: "Bonjour\u00a0! Je suis l\u2019assistant IA. Comment puis-je vous aider\u00a0?",
};

const AUTO_REPLY =
  "Cette fonctionnalit\u00e9 sera connect\u00e9e \u00e0 Claude dans une prochaine mise \u00e0 jour.";

const AI_COLOR = "#7c3aed";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AiBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 4,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: `${AI_COLOR}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 8,
            flexShrink: 0,
            alignSelf: "flex-end",
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>&#10022;</span>
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "9px 13px",
          borderRadius: isUser ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
          backgroundColor: isUser ? "#ede9fe" : colors.s2,
          color: colors.text,
          fontFamily: fonts.outfit,
          fontSize: 13,
          lineHeight: 1.55,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.text}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AiModal() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  const canSend = input.trim().length > 0;

  return (
    <div style={styles.container}>
      {/* ---- Messages zone ---- */}
      <div style={styles.messagesZone}>
        {messages.map((msg, i) => (
          <AiBubble key={i} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ---- Input zone ---- */}
      <div style={styles.inputZone}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder={"Posez votre question\u2026 (Ctrl+Entr\u00e9e pour envoyer)"}
          rows={1}
          style={styles.textarea}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          style={{
            ...styles.sendBtn,
            opacity: canSend ? 1 : 0.45,
            cursor: canSend ? "pointer" : "not-allowed",
          }}
          aria-label="Envoyer"
        >
          <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    flex: 1,
    minHeight: 0,
  },

  messagesZone: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 0,
  },

  inputZone: {
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "12px 20px",
    borderTop: `1px solid ${colors.border}`,
    flexShrink: 0,
    backgroundColor: colors.s1,
  },

  textarea: {
    flex: 1,
    resize: "none",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "10px 14px",
    fontFamily: fonts.outfit,
    fontSize: 13,
    lineHeight: 1.5,
    color: colors.text,
    outline: "none",
    backgroundColor: colors.s2,
    overflowY: "auto",
    transition: "border-color 0.15s ease",
  },

  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    border: "none",
    backgroundColor: AI_COLOR,
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.15s ease, transform 0.15s ease",
  },
};
