import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { router } from "@inertiajs/react";
import { colors, fonts, radii } from "../../styles/tokens";
import { useToast } from "../../lib/useToast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_OPTIONS = [
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
];

const PRIORITY_COLORS = {
  high: { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" },
  medium: { backgroundColor: "#fefce8", color: "#92400e", border: "1px solid #fde68a" },
  low: { backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" },
};

const PRIORITY_LABELS = {
  high: "Haute",
  medium: "Moyenne",
  low: "Faible",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiPost(memberId, body) {
  const res = await fetch(`/api/members/${memberId}/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erreur lors de la creation");
  return res.json();
}

async function apiPatch(memberId, todoId, body) {
  const res = await fetch(`/api/members/${memberId}/todos/${todoId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise a jour");
  return res.json();
}

async function apiDelete(memberId, todoId) {
  const res = await fetch(`/api/members/${memberId}/todos/${todoId}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PrioritySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.prioritySelect}
    >
      {PRIORITY_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function PriorityBadge({ priority }) {
  const colorStyle = PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
  const label = PRIORITY_LABELS[priority] || "Moyenne";

  return (
    <span style={{ ...styles.priorityBadge, ...colorStyle }}>
      {label}
    </span>
  );
}

function TagBadge({ tag }) {
  return <span style={styles.tagBadge}>{tag}</span>;
}

function TodoItem({ todo, memberId, onUpdate }) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.content);
  const [editPriority, setEditPriority] = useState(todo.priority || "medium");
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggle = async () => {
    try {
      await apiPatch(memberId, todo.id, {
        todo: { completed: !todo.completed },
      });
      router.reload();
      toast.addToast(
        todo.completed ? "Tache reactiv\u00E9e" : "Tache termin\u00E9e",
        { type: "success" },
      );
    } catch {
      toast.addToast("Erreur lors de la mise a jour", { type: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await apiDelete(memberId, todo.id);
      router.reload();
      toast.addToast("Tache supprim\u00E9e", { type: "success" });
    } catch {
      toast.addToast("Erreur lors de la suppression", { type: "error" });
    }
  };

  const handleDoubleClick = () => {
    setEditText(todo.content);
    setEditPriority(todo.priority || "medium");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
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
      router.reload();
      toast.addToast("Tache mise a jour", { type: "success" });
    } catch {
      toast.addToast("Erreur lors de la mise a jour", { type: "error" });
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const tags = parseTags(todo.tags);

  return (
    <div
      style={{
        ...styles.todoCard,
        opacity: todo.completed ? 0.5 : 1,
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
          title={todo.completed ? "Marquer comme non termin\u00E9e" : "Marquer comme termin\u00E9e"}
        >
          {todo.completed && (
            <span style={styles.checkmark}>{"\u2713"}</span>
          )}
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

        {/* Priority badge */}
        {!isEditing && <PriorityBadge priority={todo.priority || "medium"} />}

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          style={{
            ...styles.deleteBtn,
            opacity: hovered ? 1 : 0,
          }}
          title="Supprimer"
        >
          {"\u00D7"}
        </button>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={styles.tagsRow}>
          {tags.map((tag, i) => (
            <TagBadge key={i} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TodoPanel({ todos = [], memberId }) {
  const toast = useToast();
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [hideCompleted, setHideCompleted] = useState(false);

  const sortedTodos = useMemo(() => sortTodos(todos), [todos]);

  const displayTodos = useMemo(() => {
    if (hideCompleted) return sortedTodos.filter((t) => !t.completed);
    return sortedTodos;
  }, [sortedTodos, hideCompleted]);

  const completedCount = useMemo(
    () => todos.filter((t) => t.completed).length,
    [todos],
  );

  const handleAdd = async () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;

    try {
      const maxPosition = todos.reduce(
        (max, t) => Math.max(max, t.position ?? 0),
        0,
      );
      await apiPost(memberId, {
        todo: {
          content: trimmed,
          priority: newPriority,
          position: maxPosition + 1,
        },
      });
      setNewContent("");
      setNewPriority("medium");
      router.reload();
      toast.addToast("Tache ajout\u00E9e", { type: "success" });
    } catch {
      toast.addToast("Erreur lors de l'ajout", { type: "error" });
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>T\u00E2ches</span>
          <span style={styles.headerCount}>{todos.length}</span>
        </div>
        {completedCount > 0 && (
          <button
            type="button"
            onClick={() => setHideCompleted((h) => !h)}
            style={styles.collapseBtn}
          >
            {hideCompleted
              ? `Afficher termin\u00E9es (${completedCount})`
              : "Masquer termin\u00E9es"}
          </button>
        )}
      </div>

      {/* Add input */}
      <div style={styles.addRow}>
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Nouvelle t\u00E2che..."
          style={styles.addInput}
        />
        <PrioritySelect value={newPriority} onChange={setNewPriority} />
        <button
          type="button"
          onClick={handleAdd}
          style={styles.addBtn}
          disabled={!newContent.trim()}
        >
          +
        </button>
      </div>

      {/* Todo list */}
      <div style={styles.listContainer}>
        {displayTodos.length === 0 ? (
          <p style={styles.emptyText}>
            {hideCompleted
              ? "Toutes les t\u00E2ches sont termin\u00E9es"
              : "Aucune t\u00E2che"}
          </p>
        ) : (
          displayTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              memberId={memberId}
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

  headerCount: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text3,
    backgroundColor: colors.s3,
    borderRadius: 10,
    padding: "1px 7px",
    lineHeight: 1.4,
  },

  collapseBtn: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    color: colors.accent,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "2px 4px",
  },

  // Add row
  addRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderBottom: `1px solid ${colors.border}`,
  },

  addInput: {
    flex: 1,
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    backgroundColor: "transparent",
    border: "none",
    borderBottom: `1px solid ${colors.border}`,
    padding: "6px 0",
    outline: "none",
  },

  addBtn: {
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.outfit,
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: radii.button,
    cursor: "pointer",
    lineHeight: 1,
    flexShrink: 0,
  },

  prioritySelect: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text2,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: "3px 4px",
    outline: "none",
    cursor: "pointer",
    flexShrink: 0,
  },

  // List
  listContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "6px 8px",
  },

  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text3,
    textAlign: "center",
    margin: 0,
    paddingTop: 24,
  },

  // Todo card
  todoCard: {
    padding: "8px 12px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    marginBottom: 4,
    transition: "background-color 0.1s ease",
  },

  todoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  // Checkbox
  checkbox: {
    width: 16,
    height: 16,
    minWidth: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1.5px solid",
    borderRadius: 3,
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },

  checkmark: {
    fontSize: 10,
    fontWeight: 700,
    color: "#ffffff",
    lineHeight: 1,
  },

  // Content
  todoContent: {
    flex: 1,
    minWidth: 0,
  },

  todoText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    lineHeight: 1.4,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  // Edit
  editRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  editInput: {
    flex: 1,
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.accent}`,
    borderRadius: 3,
    padding: "3px 6px",
    outline: "none",
  },

  // Priority badge
  priorityBadge: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    padding: "2px 6px",
    borderRadius: 3,
    whiteSpace: "nowrap",
    flexShrink: 0,
    lineHeight: 1.4,
  },

  // Tag badge
  tagBadge: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    color: colors.text2,
    backgroundColor: colors.s3,
    borderRadius: radii.pill,
    padding: "1px 6px",
    lineHeight: 1.4,
  },

  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
    paddingLeft: 24,
  },

  // Delete button
  deleteBtn: {
    width: 20,
    height: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.outfit,
    fontSize: 16,
    fontWeight: 600,
    color: colors.critical,
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    transition: "opacity 0.15s ease",
  },
};
