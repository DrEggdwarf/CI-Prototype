import { useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import { colors, fonts, radii, shadows, zIndex } from "../../styles/tokens";
import { useToast } from "../../lib/useToast";
import { useTranslation } from "../../lib/useTranslation";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FORM = { name: "", role: "", initials: "", color: "#2563eb", load: 50 };

const PRIORITY_COLORS = {
  high: colors.critical,
  medium: colors.medium,
  low: colors.low,
};

// ---------------------------------------------------------------------------
// MembersTab
// ---------------------------------------------------------------------------

export default function MembersTab({ members = [], todos = [] }) {
  const toast = useToast();
  const { t } = useTranslation();

  const PRIORITY_LABELS = {
    high: t("dock.todo_modal.priority.high"),
    medium: t("dock.todo_modal.priority.medium"),
    low: t("dock.todo_modal.priority.low"),
  };
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  // -- Open modal ----------------------------------------------------------

  const openCreate = useCallback(() => {
    setEditingMember(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((member) => {
    setEditingMember(member);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingMember(null);
  }, []);

  // -- Toggle todos section ------------------------------------------------

  const toggleTodos = useCallback((memberId) => {
    setExpandedMemberId((prev) => (prev === memberId ? null : memberId));
  }, []);

  // -- Delete member -------------------------------------------------------

  const handleDelete = useCallback(
    (member) => {
      if (!window.confirm(`Supprimer le membre "${member.name}" ?`)) return;

      setLoading(true);
      fetch(`/api/members/${member.id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`Delete failed (${res.status})`);
          toast.addToast(t("dock.todo_modal.task_deleted"), { type: "success" });
          router.reload();
        })
        .catch(() => {
          toast.addToast(t("dock.todo_modal.error_delete"), { type: "error" });
        })
        .finally(() => setLoading(false));
    },
    [toast],
  );

  // -- Save (create or update) member --------------------------------------

  const handleSave = useCallback(
    (formData) => {
      setLoading(true);
      const isEdit = !!editingMember;
      const url = isEdit ? `/api/members/${editingMember.id}` : "/api/members";
      const method = isEdit ? "PATCH" : "POST";

      fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member: formData }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Save failed (${res.status})`);
          toast.addToast(isEdit ? t("dock.todo_modal.task_updated") : t("dock.todo_modal.task_added"), {
            type: "success",
          });
          closeModal();
          router.reload();
        })
        .catch(() => {
          toast.addToast(t("dock.todo_modal.error_update"), { type: "error" });
        })
        .finally(() => setLoading(false));
    },
    [editingMember, toast, closeModal],
  );

  // -- Todo actions --------------------------------------------------------

  const handleAddTodo = useCallback(
    (memberId, content, priority) => {
      setLoading(true);
      fetch(`/api/members/${memberId}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todo: { content, priority } }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Create todo failed (${res.status})`);
          toast.addToast(t("dock.todo_modal.task_added"), { type: "success" });
          router.reload();
        })
        .catch(() => {
          toast.addToast(t("dock.todo_modal.error_add"), { type: "error" });
        })
        .finally(() => setLoading(false));
    },
    [toast],
  );

  const handleToggleTodo = useCallback(
    (memberId, todo) => {
      setLoading(true);
      fetch(`/api/members/${memberId}/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todo: { completed: !todo.completed } }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Toggle todo failed (${res.status})`);
          toast.addToast(
            todo.completed ? t("dock.todo_modal.task_reactivated") : t("dock.todo_modal.task_done"),
            { type: "success" },
          );
          router.reload();
        })
        .catch(() => {
          toast.addToast(t("dock.todo_modal.error_update"), { type: "error" });
        })
        .finally(() => setLoading(false));
    },
    [toast],
  );

  const handleDeleteTodo = useCallback(
    (memberId, todoId) => {
      if (!window.confirm("Supprimer cette tache ?")) return;

      setLoading(true);
      fetch(`/api/members/${memberId}/todos/${todoId}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`Delete todo failed (${res.status})`);
          toast.addToast(t("dock.todo_modal.task_deleted"), { type: "success" });
          router.reload();
        })
        .catch(() => {
          toast.addToast(t("dock.todo_modal.error_delete"), { type: "error" });
        })
        .finally(() => setLoading(false));
    },
    [toast],
  );

  // -- Render --------------------------------------------------------------

  return (
    <div style={styles.wrapper}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <span style={styles.sectionLabel}>{t("settings.tabs.members")}</span>
          <span style={styles.countBadge}>{members.length}</span>
        </div>
        <button
          type="button"
          style={styles.addBtn}
          onClick={openCreate}
          disabled={loading}
        >
          + {t("settings.members.add")}
        </button>
      </div>

      {/* Table */}
      {members.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyText}>Aucun membre configure</span>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 44 }}></th>
                <th style={styles.th}>{t("settings.members.name")}</th>
                <th style={styles.th}>{t("settings.members.role")}</th>
                <th style={{ ...styles.th, width: 160 }}>{t("workspace.charge")}</th>
                <th style={{ ...styles.th, width: 110, textAlign: "right" }}>
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const load = member.load ?? 0;
                const isExpanded = expandedMemberId === member.id;
                const memberTodos = todos.filter(
                  (t) => t.member_id === member.id,
                );
                return (
                  <MemberRow
                    key={member.id}
                    member={member}
                    load={load}
                    isExpanded={isExpanded}
                    memberTodos={memberTodos}
                    loading={loading}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggleTodos={toggleTodos}
                    onAddTodo={handleAddTodo}
                    onToggleTodo={handleToggleTodo}
                    onDeleteTodo={handleDeleteTodo}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <MemberModal
          member={editingMember}
          loading={loading}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemberRow (extracted for clarity with expand)
// ---------------------------------------------------------------------------

function MemberRow({
  member,
  load,
  isExpanded,
  memberTodos,
  loading,
  onEdit,
  onDelete,
  onToggleTodos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}) {
  const { t } = useTranslation();
  return (
    <>
      <tr style={styles.tr}>
        {/* Avatar */}
        <td style={styles.td}>
          <div
            style={{
              ...styles.avatar,
              backgroundColor: member.color || colors.s3,
            }}
          >
            {member.initials || "??"}
          </div>
        </td>

        {/* Name */}
        <td style={styles.td}>
          <span style={styles.memberName}>{member.name}</span>
        </td>

        {/* Role */}
        <td style={styles.td}>
          <span style={styles.memberRole}>
            {member.role || "\u2014"}
          </span>
        </td>

        {/* Load bar */}
        <td style={styles.td}>
          <div style={styles.chargeWrapper}>
            <div style={styles.chargeTrack}>
              <div
                style={{
                  ...styles.chargeFill,
                  width: `${Math.min(load, 100)}%`,
                  backgroundColor:
                    load > 80 ? colors.critical : colors.accent,
                }}
              />
            </div>
            <span style={styles.chargeValue}>{load}%</span>
          </div>
        </td>

        {/* Actions */}
        <td style={{ ...styles.td, textAlign: "right" }}>
          <button
            type="button"
            title={t("nav.workspace")}
            style={{
              ...styles.iconBtn,
              color: isExpanded ? colors.accent : "var(--text3)",
            }}
            onClick={() => onToggleTodos(member.id)}
            disabled={loading}
          >
            {"\u2261"}
          </button>
          <button
            type="button"
            title="Modifier"
            style={{ ...styles.iconBtn, marginLeft: 4 }}
            onClick={() => onEdit(member)}
            disabled={loading}
          >
            {"\u270E"}
          </button>
          <button
            type="button"
            title="Supprimer"
            style={{ ...styles.iconBtn, marginLeft: 4 }}
            onClick={() => onDelete(member)}
            disabled={loading}
          >
            {"\u2716"}
          </button>
        </td>
      </tr>

      {/* Expanded todos section */}
      {isExpanded && (
        <tr>
          <td colSpan={5} style={{ padding: 0 }}>
            <TodosSection
              memberId={member.id}
              todos={memberTodos}
              loading={loading}
              onAddTodo={onAddTodo}
              onToggleTodo={onToggleTodo}
              onDeleteTodo={onDeleteTodo}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// TodosSection (expanded under a member row)
// ---------------------------------------------------------------------------

function TodosSection({
  memberId,
  todos,
  loading,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
}) {
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const { t } = useTranslation();

  const PRIORITY_LABELS = {
    high: t("dock.todo_modal.priority.high"),
    medium: t("dock.todo_modal.priority.medium"),
    low: t("dock.todo_modal.priority.low"),
  };

  const handleAdd = () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    onAddTodo(memberId, trimmed, newPriority);
    setNewContent("");
    setNewPriority("medium");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div style={todoStyles.wrapper}>
      {/* Header */}
      <div style={todoStyles.header}>
        <span style={todoStyles.headerLabel}>
          {t("dock.todo_modal.title")} ({todos.length})
        </span>
      </div>

      {/* Todo list */}
      {todos.length === 0 ? (
        <div style={todoStyles.emptyRow}>
          <span style={todoStyles.emptyText}>{t("dock.todo_modal.empty")}</span>
        </div>
      ) : (
        <div style={todoStyles.list}>
          {todos.map((todo) => (
            <div key={todo.id} style={todoStyles.todoRow}>
              {/* Checkbox */}
              <button
                type="button"
                style={{
                  ...todoStyles.checkbox,
                  backgroundColor: todo.completed ? colors.accent : "transparent",
                  borderColor: todo.completed ? colors.accent : colors.border2,
                }}
                onClick={() => onToggleTodo(memberId, todo)}
                disabled={loading}
                title={todo.completed ? t("dock.todo_modal.task_reactivated") : t("dock.todo_modal.task_done")}
              >
                {todo.completed && (
                  <span style={todoStyles.checkmark}>{"\u2713"}</span>
                )}
              </button>

              {/* Content */}
              <span
                style={{
                  ...todoStyles.todoText,
                  textDecoration: todo.completed ? "line-through" : "none",
                  opacity: todo.completed ? 0.5 : 1,
                }}
              >
                {todo.content}
              </span>

              {/* Priority badge */}
              {todo.priority && (
                <span
                  style={{
                    ...todoStyles.priorityBadge,
                    backgroundColor: PRIORITY_COLORS[todo.priority] || colors.medium,
                  }}
                >
                  {PRIORITY_LABELS[todo.priority] || todo.priority}
                </span>
              )}

              {/* Delete */}
              <button
                type="button"
                style={todoStyles.deleteBtn}
                onClick={() => onDeleteTodo(memberId, todo.id)}
                disabled={loading}
                title="Supprimer"
              >
                {"\u2715"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add todo inline form */}
      <div style={todoStyles.addRow}>
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("dock.todo_modal.add_placeholder")}
          style={todoStyles.addInput}
          disabled={loading}
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value)}
          style={todoStyles.addSelect}
          disabled={loading}
        >
          <option value="high">{t("dock.todo_modal.priority.high")}</option>
          <option value="medium">{t("dock.todo_modal.priority.medium")}</option>
          <option value="low">{t("dock.todo_modal.priority.low")}</option>
        </select>
        <button
          type="button"
          style={{
            ...todoStyles.addBtn,
            opacity: loading || !newContent.trim() ? 0.5 : 1,
            cursor: loading || !newContent.trim() ? "not-allowed" : "pointer",
          }}
          onClick={handleAdd}
          disabled={loading || !newContent.trim()}
        >
          + {t("settings.members.add")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemberModal (create / edit)
// ---------------------------------------------------------------------------

function MemberModal({ member, loading, onSave, onClose }) {
  const isEdit = !!member;
  const { t } = useTranslation();
  const [form, setForm] = useState(
    isEdit
      ? {
          name: member.name || "",
          role: member.role || "",
          initials: member.initials || "",
          color: member.color || "#2563eb",
          load: member.load ?? 50,
        }
      : { ...EMPTY_FORM },
  );
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Le nom est requis";
    if (form.initials.length > 2)
      errs.initials = "2 caracteres max";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      name: form.name.trim(),
      role: form.role.trim(),
      initials: form.initials.trim().toUpperCase(),
      color: form.color,
      load: Number(form.load),
    });
  };

  return (
    <div style={modalStyles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modalStyles.panel}>
        {/* Header */}
        <div style={modalStyles.header}>
          <span style={modalStyles.title}>
            {isEdit ? t("settings.members.title") : t("settings.members.add")}
          </span>
          <button type="button" style={modalStyles.closeBtn} onClick={onClose}>
            {"\u2715"}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={modalStyles.body}>
          {/* Name */}
          <label style={modalStyles.label}>
            {t("settings.members.name")}
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              style={{
                ...modalStyles.input,
                ...(errors.name ? modalStyles.inputError : {}),
              }}
              placeholder="Jean Dupont"
              autoFocus
            />
            {errors.name && <span style={modalStyles.errorText}>{errors.name}</span>}
          </label>

          {/* Role */}
          <label style={modalStyles.label}>
            {t("settings.members.role")}
            <input
              type="text"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              style={modalStyles.input}
              placeholder="Auditeur interne"
            />
          </label>

          {/* Initials + Color row */}
          <div style={modalStyles.row}>
            <label style={{ ...modalStyles.label, flex: 1 }}>
              Initiales
              <input
                type="text"
                value={form.initials}
                onChange={(e) => handleChange("initials", e.target.value.slice(0, 2))}
                maxLength={2}
                style={{
                  ...modalStyles.input,
                  ...(errors.initials ? modalStyles.inputError : {}),
                }}
                placeholder="JD"
              />
              {errors.initials && (
                <span style={modalStyles.errorText}>{errors.initials}</span>
              )}
            </label>

            <label style={{ ...modalStyles.label, flex: 1 }}>
              Couleur
              <div style={modalStyles.colorRow}>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  style={modalStyles.colorInput}
                />
                <span style={modalStyles.colorHex}>{form.color}</span>
              </div>
            </label>
          </div>

          {/* Load */}
          <label style={modalStyles.label}>
            Charge ({form.load}%)
            <input
              type="range"
              min={0}
              max={100}
              value={form.load}
              onChange={(e) => handleChange("load", e.target.value)}
              style={modalStyles.range}
            />
          </label>

          {/* Footer buttons */}
          <div style={modalStyles.footer}>
            <button
              type="button"
              style={modalStyles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              style={{
                ...modalStyles.saveBtn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              disabled={loading}
            >
              {loading ? "..." : isEdit ? t("common.save") : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table styles
// ---------------------------------------------------------------------------

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  sectionLabel: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".6px",
    color: "var(--text2)",
  },

  countBadge: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text3)",
    backgroundColor: "var(--s3)",
    padding: "2px 8px",
    borderRadius: 10,
  },

  addBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: radii.button,
    padding: "6px 14px",
    cursor: "pointer",
    lineHeight: 1.3,
    transition: "opacity .12s",
  },

  // Table
  tableWrap: {
    backgroundColor: "var(--s1)",
    border: "1px solid var(--border)",
    borderRadius: radii.card,
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    color: "var(--text3)",
    textAlign: "left",
    padding: "10px 14px",
    borderBottom: "1px solid var(--border)",
    backgroundColor: "var(--s2)",
  },

  tr: {
    borderBottom: "1px solid var(--border)",
  },

  td: {
    padding: "10px 14px",
    verticalAlign: "middle",
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },

  memberName: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
  },

  memberRole: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: "var(--text3)",
  },

  chargeWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  chargeTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "var(--s3)",
    borderRadius: 3,
    overflow: "hidden",
  },

  chargeFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width .3s ease",
  },

  chargeValue: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text2)",
    minWidth: 32,
    textAlign: "right",
  },

  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "var(--text3)",
    padding: "4px 6px",
    borderRadius: radii.button,
    lineHeight: 1,
    transition: "color .12s, background-color .12s",
  },

  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    backgroundColor: "var(--s1)",
    border: "1px solid var(--border)",
    borderRadius: radii.card,
  },

  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 14,
    color: "var(--text3)",
  },
};

// ---------------------------------------------------------------------------
// Todo section styles
// ---------------------------------------------------------------------------

const todoStyles = {
  wrapper: {
    backgroundColor: colors.s2,
    padding: 12,
    borderTop: `1px solid ${colors.border}`,
  },

  header: {
    marginBottom: 8,
  },

  headerLabel: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    color: colors.text2,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  todoRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 0",
  },

  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    border: `1.5px solid ${colors.border2}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
    transition: "all .12s",
  },

  checkmark: {
    fontSize: 9,
    color: "#fff",
    lineHeight: 1,
    fontWeight: 700,
  },

  todoText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    flex: 1,
    lineHeight: 1.4,
  },

  priorityBadge: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    fontWeight: 700,
    color: "#fff",
    padding: "1px 6px",
    borderRadius: 8,
    textTransform: "uppercase",
    letterSpacing: ".3px",
    lineHeight: 1.5,
    flexShrink: 0,
  },

  deleteBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 11,
    color: colors.text3,
    padding: "2px 4px",
    borderRadius: 3,
    lineHeight: 1,
    transition: "color .12s",
    flexShrink: 0,
  },

  emptyRow: {
    padding: "8px 0",
  },

  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text3,
    fontStyle: "italic",
  },

  addRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },

  addInput: {
    flex: 1,
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 500,
    color: colors.text,
    padding: "5px 8px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    backgroundColor: colors.s1,
    outline: "none",
    transition: "border-color .12s",
  },

  addSelect: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text2,
    padding: "5px 6px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    backgroundColor: colors.s1,
    outline: "none",
    cursor: "pointer",
  },

  addBtn: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: radii.button,
    padding: "5px 10px",
    lineHeight: 1.3,
    transition: "opacity .12s",
    whiteSpace: "nowrap",
  },
};

// ---------------------------------------------------------------------------
// Modal styles
// ---------------------------------------------------------------------------

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,.35)",
    zIndex: zIndex.modal,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  panel: {
    width: 440,
    maxHeight: "85vh",
    backgroundColor: colors.s1,
    borderRadius: 10,
    boxShadow: shadows.dropdown,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },

  title: {
    fontFamily: fonts.outfit,
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
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
    padding: 0,
    lineHeight: 1,
  },

  body: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "16px 20px 20px",
    overflowY: "auto",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text2,
    textTransform: "uppercase",
    letterSpacing: ".4px",
  },

  input: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text,
    padding: "8px 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    backgroundColor: colors.s1,
    outline: "none",
    transition: "border-color .12s",
    textTransform: "none",
    letterSpacing: "normal",
  },

  inputError: {
    borderColor: colors.critical,
  },

  errorText: {
    fontSize: 11,
    fontWeight: 500,
    color: colors.critical,
    textTransform: "none",
    letterSpacing: "normal",
  },

  row: {
    display: "flex",
    gap: 14,
  },

  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  colorInput: {
    width: 36,
    height: 32,
    padding: 0,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    cursor: "pointer",
    backgroundColor: "transparent",
  },

  colorHex: {
    fontFamily: fonts.dmMono,
    fontSize: 12,
    color: colors.text2,
  },

  range: {
    width: "100%",
    accentColor: colors.accent,
    cursor: "pointer",
  },

  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },

  cancelBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    color: colors.text2,
    backgroundColor: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "7px 16px",
    cursor: "pointer",
    lineHeight: 1.3,
  },

  saveBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: radii.button,
    padding: "7px 16px",
    lineHeight: 1.3,
    transition: "opacity .12s",
  },
};
