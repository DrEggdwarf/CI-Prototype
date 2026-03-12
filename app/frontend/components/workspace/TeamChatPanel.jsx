import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { router } from "@inertiajs/react";
import { createConsumer } from "@rails/actioncable";
import { colors, fonts, radii } from "../../styles/tokens";
import { useToast } from "../../lib/useToast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLLING_INTERVAL = 10_000; // 10 seconds fallback polling

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a date string to "HH:MM". */
function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Return a day separator label for a given date. */
function getDaySeparator(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = today - target;
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays === 0) return "Aujourd\u2019hui";
  if (diffDays === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Group messages by day for separator rendering. */
function groupMessagesByDay(messages) {
  const groups = [];
  let currentDay = null;

  for (const msg of messages) {
    const d = new Date(msg.created_at);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    if (dayKey !== currentDay) {
      currentDay = dayKey;
      groups.push({ type: "separator", label: getDaySeparator(msg.created_at), key: `sep-${dayKey}` });
    }
    groups.push({ type: "message", data: msg, key: `msg-${msg.id}` });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({ member, size = 24 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        backgroundColor: member.color || colors.accent,
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
        {member.initials || "?"}
      </span>
    </div>
  );
}

function DaySeparator({ label }) {
  return (
    <div style={styles.daySeparator}>
      <div style={styles.daySeparatorLine} />
      <span style={styles.daySeparatorText}>{label}</span>
      <div style={styles.daySeparatorLine} />
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
        gap: 6,
        maxWidth: "100%",
      }}
    >
      <Avatar member={member} size={24} />

      <div
        style={{
          maxWidth: "75%",
          display: "flex",
          flexDirection: "column",
          alignItems: isMine ? "flex-end" : "flex-start",
        }}
      >
        {/* Name + time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
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
            borderBottomRightRadius: isMine ? 4 : 12,
            borderBottomLeftRadius: isMine ? 12 : 4,
          }}
        >
          <span style={styles.bubbleText}>{message.body}</span>
        </div>
      </div>
    </div>
  );
}

function ConnectionIndicator({ connected }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: connected ? "#16a34a" : "#dc2626",
        flexShrink: 0,
      }}
      title={connected ? "Connect\u00E9" : "D\u00E9connect\u00E9"}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TeamChatPanel({
  messages: initialMessages = [],
  currentMemberId,
  allMembers = [],
}) {
  const toast = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const subscriptionRef = useRef(null);
  const consumerRef = useRef(null);
  const pollingRef = useRef(null);

  // Sync with incoming props (Inertia reload)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Build a map of member data for enriching cable messages
  const memberMap = useMemo(() => {
    const map = {};
    for (const m of allMembers) {
      map[m.id] = m;
    }
    return map;
  }, [allMembers]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ---------------------------------------------------------------------------
  // ActionCable connection
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    try {
      const consumer = createConsumer();
      consumerRef.current = consumer;

      const subscription = consumer.subscriptions.create("TeamChatChannel", {
        connected() {
          if (!cancelled) {
            setConnected(true);
            // Clear polling fallback if connected
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        },

        disconnected() {
          if (!cancelled) {
            setConnected(false);
            // Start polling fallback
            startPolling();
          }
        },

        received(data) {
          if (!cancelled && data) {
            // Enrich member data if not present
            const enriched = {
              ...data,
              member: data.member || memberMap[data.member_id] || null,
            };
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === enriched.id)) return prev;
              return [...prev, enriched];
            });
          }
        },
      });

      subscriptionRef.current = subscription;
    } catch {
      // ActionCable not available — use polling fallback
      setConnected(false);
      startPolling();
    }

    function startPolling() {
      if (pollingRef.current) return;
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch("/api/team_messages", {
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled && Array.isArray(data)) {
              setMessages(data);
            }
          }
        } catch {
          // Silently ignore polling errors
        }
      }, POLLING_INTERVAL);
    }

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (consumerRef.current) {
        consumerRef.current.disconnect();
        consumerRef.current = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [memberMap]);

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
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

      if (!res.ok) throw new Error("Erreur envoi");

      setBody("");
      // The cable subscription will add the message; also reload for safety
      router.reload();
    } catch {
      toast.addToast("Erreur lors de l\u2019envoi du message", { type: "error" });
    } finally {
      setSending(false);
    }
  }, [body, sending, currentMemberId, toast]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const grouped = useMemo(() => groupMessagesByDay(messages), [messages]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>{"Chat d\u2019\u00e9quipe"}</span>
        </div>
        <ConnectionIndicator connected={connected} />
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} style={styles.messagesContainer}>
        {grouped.length === 0 ? (
          <p style={styles.emptyText}>Aucun message pour le moment</p>
        ) : (
          grouped.map((item) => {
            if (item.type === "separator") {
              return <DaySeparator key={item.key} label={item.label} />;
            }
            const msg = item.data;
            const isMine = msg.member?.id === currentMemberId;
            return (
              <MessageBubble key={item.key} message={msg} isMine={isMine} />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message... (Ctrl+Entr\u00E9e pour envoyer)"
          style={styles.textarea}
          rows={1}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || sending}
          style={{
            ...styles.sendBtn,
            opacity: !body.trim() || sending ? 0.5 : 1,
          }}
          title="Envoyer"
        >
          {"\u25B8"}
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
    backgroundColor: colors.s1,
    borderRadius: radii.card,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderBottom: `1px solid ${colors.border}`,
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  headerTitle: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 700,
    color: colors.text,
  },

  // Messages
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text3,
    textAlign: "center",
    margin: 0,
    paddingTop: 24,
  },

  // Day separator
  daySeparator: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 0",
  },

  daySeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  daySeparatorText: {
    fontFamily: fonts.outfit,
    fontSize: 10,
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
    padding: "8px 12px",
    borderRadius: 12,
  },

  bubbleText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  // Input area
  inputContainer: {
    display: "flex",
    alignItems: "flex-end",
    gap: 6,
    padding: 8,
    borderTop: `1px solid ${colors.border}`,
  },

  textarea: {
    flex: 1,
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "8px 10px",
    outline: "none",
    resize: "none",
    minHeight: 36,
    maxHeight: 80,
    lineHeight: 1.4,
  },

  sendBtn: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    color: "#ffffff",
    border: "none",
    borderRadius: radii.button,
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
    flexShrink: 0,
    transition: "opacity 0.15s ease",
  },
};
