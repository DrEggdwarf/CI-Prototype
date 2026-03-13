import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { colors, fonts, radii } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLLING_INTERVAL = 5_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getDaySeparatorLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - target) / 86400000);

  if (diffDays === 0) return "Aujourd\u2019hui";
  if (diffDays === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function groupByDay(messages) {
  const groups = [];
  let currentDay = null;

  for (const msg of messages) {
    const d = new Date(msg.created_at);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    if (dayKey !== currentDay) {
      currentDay = dayKey;
      groups.push({
        type: "separator",
        label: getDaySeparatorLabel(msg.created_at),
        key: `sep-${dayKey}`,
      });
    }
    groups.push({ type: "message", data: msg, key: `msg-${msg.id}` });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({ member, size = 28 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        backgroundColor: member?.color || colors.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: fonts.outfit,
          fontSize: Math.round(size * 0.42),
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        {member?.initials || "?"}
      </span>
    </div>
  );
}

function DaySeparator({ label }) {
  return (
    <div style={styles.daySep}>
      <div style={styles.daySepLine} />
      <span style={styles.daySepText}>{label}</span>
      <div style={styles.daySepLine} />
    </div>
  );
}

function MessageBubble({ message, isMine }) {
  const member = message.member || {};

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMine ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        maxWidth: "100%",
      }}
    >
      <Avatar member={member} size={28} />

      <div
        style={{
          maxWidth: "72%",
          display: "flex",
          flexDirection: "column",
          alignItems: isMine ? "flex-end" : "flex-start",
          gap: 3,
        }}
      >
        {/* Name + time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexDirection: isMine ? "row-reverse" : "row",
          }}
        >
          <span style={styles.msgName}>{member.name || "Inconnu"}</span>
          <span style={styles.msgTime}>{formatTime(message.created_at)}</span>
        </div>

        {/* Bubble */}
        <div
          style={{
            ...styles.bubble,
            backgroundColor: isMine ? "#eef2ff" : colors.s2,
            borderBottomRightRadius: isMine ? 3 : 12,
            borderBottomLeftRadius: isMine ? 12 : 3,
          }}
        >
          <span style={styles.bubbleText}>{message.body}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ChatModal() {
  const { props } = usePage();
  const currentMemberId = props.current_member_id;
  const currentMember = props.current_member;

  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const textareaRef = useRef(null);

  // Build a member map for enriching messages
  const memberMap = useMemo(() => {
    const map = {};
    for (const m of members) map[m.id] = m;
    if (currentMember) map[currentMember.id] = currentMember;
    return map;
  }, [members, currentMember]);

  // Enrich messages with member data
  const enrichMessages = useCallback(
    (rawMessages) =>
      rawMessages.map((msg) => ({
        ...msg,
        member: msg.member || memberMap[msg.member_id] || null,
      })),
    [memberMap],
  );

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/team_messages", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(enrichMessages(data));
        }
      }
    } catch {
      // Silently ignore fetch errors
    }
  }, [enrichMessages]);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMembers(data);
      }
    } catch {
      // Silently ignore
    }
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await fetchMembers();
      if (!cancelled) {
        await fetchMessages();
        setLoading(false);
      }
    };

    init();

    // Start polling
    pollingRef.current = setInterval(() => {
      if (!cancelled) fetchMessages();
    }, POLLING_INTERVAL);

    return () => {
      cancelled = true;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Send message
  const handleSend = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/team_messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          team_message: { member_id: currentMemberId, body: trimmed },
        }),
      });

      if (res.ok) {
        setBody("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        await fetchMessages();
      }
    } catch {
      // Silently ignore
    } finally {
      setSending(false);
    }
  }, [body, sending, currentMemberId, fetchMessages]);

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
    setBody(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  };

  // Enrich messages with current member map
  const enrichedMessages = useMemo(
    () =>
      messages.map((msg) => ({
        ...msg,
        member: msg.member || memberMap[msg.member_id] || null,
      })),
    [messages, memberMap],
  );

  const grouped = useMemo(() => groupByDay(enrichedMessages), [enrichedMessages]);

  return (
    <div style={styles.container}>
      {/* ---- Messages ---- */}
      <div style={styles.messagesZone}>
        {loading ? (
          <p style={styles.emptyText}>Chargement des messages&hellip;</p>
        ) : grouped.length === 0 ? (
          <p style={styles.emptyText}>Aucun message pour le moment</p>
        ) : (
          grouped.map((item) => {
            if (item.type === "separator") {
              return <DaySeparator key={item.key} label={item.label} />;
            }
            const msg = item.data;
            const isMine = msg.member_id === currentMemberId;
            return (
              <MessageBubble key={item.key} message={msg} isMine={isMine} />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ---- Input ---- */}
      <div style={styles.inputZone}>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder={"Votre message\u2026 (Ctrl+Entr\u00e9e pour envoyer)"}
          rows={1}
          style={styles.textarea}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || sending}
          style={{
            ...styles.sendBtn,
            opacity: !body.trim() || sending ? 0.45 : 1,
            cursor: !body.trim() || sending ? "not-allowed" : "pointer",
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
    flex: 1,
    minHeight: 0,
    height: "100%",
  },

  messagesZone: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 0,
  },

  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text3,
    textAlign: "center",
    margin: 0,
    paddingTop: 32,
  },

  // Day separator
  daySep: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
  },
  daySepLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  daySepText: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text3,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },

  // Message bubble
  msgName: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 700,
    color: colors.text2,
  },
  msgTime: {
    fontFamily: fonts.dmMono,
    fontSize: 10,
    color: colors.text3,
  },
  bubble: {
    padding: "9px 13px",
    borderRadius: 12,
  },
  bubbleText: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  // Input zone
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
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.15s ease",
  },
};
