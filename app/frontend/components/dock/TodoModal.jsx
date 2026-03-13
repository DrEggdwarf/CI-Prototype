import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { colors, fonts, radii } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_OPTIONS = [
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
];

const PRIORITY_STYLES = {
  high: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" },
  medium: { backgroundColor: "#fefce8", color: "#92400e", border: "1px solid #fde68a" },
  low: { backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" },
};

const PRIORITY_LABELS = { high: "Haute", medium: "Moyenne", low: "Faible" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sortTodos(todos) {
  const incomplete = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);
  const sortFn = (a, b) => {
    if ((a.position ?? Infinity) !== (b.position ?? Infinity)) {
      return (a.position ?? Infinity) - (b.position ?? Infinity);
    }
    return new Date(a.created_at) - new Date(b.created_at);
  };
  incomplete.sort(sortFn);
  completed.sort(sortFn);
  return [...incomplete, ...completed];
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    const p = JSON.parse(tags);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiPost(memberId, body) {
  const res = await fetch(`/api/members/${memberId}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erreur cr\u00e9ation");
  return res.json();
}

async function apiPatch(memberId, todoId, body) {
  const res = await fetch(`/api/members/${memberId}/todos/${todoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erreur mise \u00e0 jour");
  return res.json();
}

async function apiDelete(memberId, todoId) {
  const res = await fetch(`/api/members/${memberId}/todos/${todoId}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Erreur suppression");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return (
    <span style={{ ...styles.priorityBadge, ...s }}>
      {PRIORITY_LABELS[priority] || "Moyenne"}
    </span>
  );
}

function PrioritySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.prioritySelect}
    >
      {PRIORITY_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TodoItem({ todo, memberId, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.content);
  const [editPriority, setEditPriority] = useState(todo.priority || "medium");
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleToggle = useCallback(async () => {
    try {
      await apiPatch(memberId, todo.id, { todo: { completed: !todo.completed } });
      onRefresh();
    } catch {
      // Silently ignore
    }
  }, [memberId, todo, onRefresh]);

  const handleDelete = useCallback(async () => {
    try {
      await apiDelete(memberId, todo.id);
      onRefresh();
    } catch {
      // Silently ignore
    }
  }, [memberId, todo.id, onRefresh]);

  const handleDoubleClick = () => {
    setEditText(todo.content);
    setEditPriority(todo.priority || "medium");
    setIsEditing(true);
  };

  const handleSaveEdit = useCallback(async () => {
    const trimmed = editText.trim();
    if (!trimmed) {
      setIsEditing(false);
      return;
    }
    try {
      await apiPatch(memberId, todo.id, {
        todo: { content: trimmed, priority: editPriority },
      });
      setIsEditing(false);
      onRefresh();
    } catch {
      setIsEditing(false);
    }
  }, [memberId, todo.id, editText, editPriority, onRefresh]);

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleSaveEdit(); }
    if (e.key === "Escape") setIsEditing(false);
  };

  const tags = parseTags(todo.tags);

  return (
    <div
      style={{
        ...styles.todoCard,
        opacity: todo.completed ? 0.55 : 1,
        backgroundColor: hovered ? colors.s2 : colors.s1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.todoRow}>
        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          style={{
            ...styles.checkbox,
            backgroundColor: todo.completed ? colors.accent : "transparent",
            borderColor: todo.completed ? colors.accent : colors.border2,
          }}
          title={todo.completed ? "Marquer comme non termin\u00e9e" : "Marquer comme termin\u00e9e"}
        >
          {todo.completed && <span style={styles.checkmark}>&#10003;</span>}
        </button>

        {/* Content */}
        <div style={styles.todoContent}>
          {isEditing ? (
            <div style={styles.editRow}>
              <input
                ref={inputRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={handleSaveEdit}
                style={styles.editInput}
              />
              <PrioritySelect value={editPriority} onChange={setEditPriority} />
            </div>
          ) : (
            <span
              onDoubleClick={handleDoubleClick}
              style={{
                ...styles.todoText,
                textDecoration: todo.completed ? "line-through" : "none",
                cursor: "text",
              }}
              title="Double-cliquez pour modifier"
            >
              {todo.content}
            </span>
          )}
        </div>

        {!isEditing && <PriorityBadge priority={todo.priority || "medium"} />}

        <button
          type="button"
          onClick={handleDelete}
          style={{ ...styles.deleteBtn, opacity: hovered ? 1 : 0 }}
          title="Supprimer"
        >
          &times;
        </button>
      </div>

      {tags.length > 0 && (
        <div style={styles.tagsRow}>
          {tags.map((tag, i) => (
            <span key={i} style={styles.tagBadge}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TodoModal() {
  const { props } = usePage();
  const currentMemberId = props.current_member_id;

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [hideCompleted, setHideCompleted] = useState(false);

  // Fetch todos
  const fetchTodos = useCallback(async () => {
    if (!currentMemberId) return;
    try {
      const res = await fetch(`/api/members/${currentMemberId}/todos`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setTodos(data);
      }
    } catch {
      // Silently ignore
    }
  }, [currentMemberId]);

  useEffect(() => {
    fetchTodos().finally(() => setLoading(false));
  }, [fetchTodos]);

  const onRefresh = useCallback(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAdd = useCallback(async () => {
    const trimmed = newContent.trim();
    if (!trimmed || !currentMemberId) return;

    const maxPosition = todos.reduce((max, t) => Math.max(max, t.position ?? 0), 0);
    try {
      await apiPost(currentMemberId, {
        todo: { content: trimmed, priority: newPriority, position: maxPosition + 1 },
      });
      setNewContent("");
      setNewPriority("medium");
      fetchTodos();
    } catch {
      // Silently ignore
    }
  }, [newContent, newPriority, currentMemberId, todos, fetchTodos]);

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
  };

  const sorted = useMemo(() => sortTodos(todos), [todos]);
  const displayed = useMemo(
    () => (hideCompleted ? sorted.filter((t) => !t.completed) : sorted),
    [sorted, hideCompleted],
  );
  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);

  return (
    <div style={styles.container}>
      {/* ---- Toolbar ---- */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <span style={styles.count}>{todos.length} t\u00e2che{todos.length !== 1 ? "s" : ""}</span>
        </div>
        {completedCount > 0 && (
          <button
            type="button"
            onClick={() => setHideCompleted((h) => !h)}
            style={styles.toggleBtn}
          >
            {hideCompleted
              ? `Afficher termin\u00e9es (${completedCount})`
              : "Masquer termin\u00e9es"}
          </button>
        )}
      </div>

      {/* ---- Add row ---- */}
      <div style={styles.addRow}>
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Nouvelle t\u00e2che\u2026"
          style={styles.addInput}
        />
        <PrioritySelect value={newPriority} onChange={setNewPriority} />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newContent.trim()}
          style={{
            ...styles.addBtn,
            opacity: newContent.trim() ? 1 : 0.45,
            cursor: newContent.trim() ? "pointer" : "not-allowed",
          }}
        >
          +
        </button>
      </div>

      {/* ---- List ---- */}
      <div style={styles.list}>
        {loading ? (
          <p style={styles.emptyText}>Chargement&hellip;</p>
        ) : displayed.length === 0 ? (
          <p style={styles.emptyText}>
            {hideCompleted ? "Toutes les t\u00e2ches sont termin\u00e9es" : "Aucune t\u00e2che"}
          </p>
        ) : (
          displayed.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              memberId={currentMemberId}
              onRefresh={onRefresh}
            />
          ))
        )}
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

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 24px",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  count: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text2,
  },
  toggleBtn: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.accent,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: radii.button,
  },

  addRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  addInput: {
    flex: 1,
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "8px 12px",
    outline: "none",
  },
  addBtn: {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.outfit,
    fontSize: 20,
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#059669",
    border: "none",
    borderRadius: radii.button,
    lineHeight: 1,
    flexShrink: 0,
    transition: "opacity 0.15s ease",
  },
  prioritySelect: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text2,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: "5px 6px",
    outline: "none",
    cursor: "pointer",
    flexShrink: 0,
  },

  list: {
    flex: 1,
    overflowY: "auto",
    padding: "10px 24px",
  },
  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text3,
    textAlign: "center",
    margin: 0,
    paddingTop: 32,
  },

  todoCard: {
    padding: "10px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    marginBottom: 6,
    transition: "background-color 0.1s ease",
  },
  todoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  checkbox: {
    width: 18,
    height: 18,
    minWidth: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1.5px solid",
    borderRadius: 4,
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },
  checkmark: {
    fontSize: 11,
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1,
  },

  todoContent: {
    flex: 1,
    minWidth: 0,
  },
  todoText: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    lineHeight: 1.4,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  editRow: { display: "flex", alignItems: "center", gap: 8 },
  editInput: {
    flex: 1,
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.accent}`,
    borderRadius: 4,
    padding: "4px 8px",
    outline: "none",
  },

  priorityBadge: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    padding: "2px 7px",
    borderRadius: 4,
    whiteSpace: "nowrap",
    flexShrink: 0,
    lineHeight: 1.4,
  },

  tagBadge: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text2,
    backgroundColor: colors.s3,
    borderRadius: 10,
    padding: "1px 7px",
    lineHeight: 1.4,
  },
  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 5,
    paddingLeft: 28,
  },

  deleteBtn: {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 600,
    color: colors.critical,
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    transition: "opacity 0.15s ease",
  },
};
