import { useState, useMemo, useCallback } from "react";
import { router } from "@inertiajs/react";
import { useToast } from "../../lib/useToast";
import { useTranslation } from "../../lib/useTranslation";
import { colors, fonts, radii, shadows, zIndex } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CRITICALITY_COLORS = {
  critical: { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  high: { bg: "#fff7ed", color: "#ea6c10", border: "#fdba74" },
  medium: { bg: "#fefce8", color: "#b58a00", border: "#fde68a" },
  low: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
};

const STATUS_COLORS = {
  pending: { bg: "#eef2ff", color: "#2563eb", border: "#bfdbfe" },
  overdue: { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  done: { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
};

const EMPTY_FORM = {
  name: "",
  domain: "",
  criticality: "",
  frequency: "",
  due_date: "",
  status: "pending",
  pass_rate: "",
  duration: "",
  assignee_id: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr) {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAssigneeName(control, members) {
  if (control.assignee?.name) return control.assignee.name;
  if (control.assignee_id && members?.length) {
    const m = members.find((mem) => mem.id === control.assignee_id);
    if (m) return m.name;
  }
  return "Non assigne";
}

function getDomainInfo(control, domains) {
  if (!control.domain) return null;
  const d = domains.find(
    (dom) => dom.key === control.domain || dom.name === control.domain
  );
  return d || null;
}

// ---------------------------------------------------------------------------
// Badge sub-component
// ---------------------------------------------------------------------------

function Badge({ label, bg, color, border }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 600,
        fontFamily: fonts.outfit,
        lineHeight: 1.4,
        borderRadius: 20,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Confirm Dialog sub-component
// ---------------------------------------------------------------------------

function ConfirmDialog({ message, onConfirm, onCancel }) {
  const { t } = useTranslation();
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div
        style={styles.confirmBox}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={styles.confirmMessage}>{message}</p>
        <div style={styles.confirmActions}>
          <button
            type="button"
            onClick={onCancel}
            style={styles.btnSecondary}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={styles.btnDanger}
          >
            {t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Control Form Modal sub-component
// ---------------------------------------------------------------------------

function ControlFormModal({ mode, initialData, domains, members, onClose, onSubmit, criticalityOptions, frequencyOptions, statusOptions }) {
  const [form, setForm] = useState(() => {
    if (mode === "edit" && initialData) {
      return {
        name: initialData.name || "",
        domain: initialData.domain || "",
        criticality: initialData.criticality || "",
        frequency: initialData.frequency || "",
        due_date: initialData.due_date || "",
        status: initialData.status || "pending",
        pass_rate: initialData.pass_rate != null ? String(initialData.pass_rate) : "",
        duration: initialData.duration != null ? String(initialData.duration) : "",
        assignee_id: initialData.assignee_id != null ? String(initialData.assignee_id) : "",
      };
    }
    return { ...EMPTY_FORM };
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback(() => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Le nom est requis";
    if (!form.domain) errs.domain = "Le domaine est requis";
    if (!form.criticality) errs.criticality = "La criticite est requise";
    return errs;
  }, [form]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setSubmitting(true);

      const payload = {
        name: form.name.trim(),
        domain: form.domain,
        criticality: form.criticality,
        frequency: form.frequency || null,
        due_date: form.due_date || null,
        status: form.status,
        pass_rate: form.pass_rate !== "" ? Number(form.pass_rate) : null,
        duration: form.duration !== "" ? Number(form.duration) : null,
        assignee_id: form.assignee_id !== "" ? Number(form.assignee_id) : null,
      };

      onSubmit(payload, () => setSubmitting(false));
    },
    [form, validate, onSubmit]
  );

  const { t } = useTranslation();
  const title = mode === "edit" ? t("settings.controls.title") : t("settings.controls.add");

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Modal header */}
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>{title}</span>
          <button
            type="button"
            onClick={onClose}
            style={styles.modalClose}
            aria-label="Fermer"
          >
            \u2715
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {/* Nom */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>{t("settings.controls.name")} *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              style={{
                ...styles.input,
                borderColor: errors.name ? colors.critical : colors.border,
              }}
              placeholder={t("settings.controls.name")}
            />
            {errors.name && <span style={styles.fieldError}>{errors.name}</span>}
          </div>

          {/* Domaine */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>{t("settings.controls.domain")} *</label>
            <select
              value={form.domain}
              onChange={(e) => handleChange("domain", e.target.value)}
              style={{
                ...styles.select,
                borderColor: errors.domain ? colors.critical : colors.border,
              }}
            >
              <option value="">--</option>
              {domains.map((d) => (
                <option key={d.id} value={d.key || d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.domain && <span style={styles.fieldError}>{errors.domain}</span>}
          </div>

          {/* Row: Criticite + Frequence */}
          <div style={styles.fieldRow}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}>{t("settings.controls.criticality")} *</label>
              <select
                value={form.criticality}
                onChange={(e) => handleChange("criticality", e.target.value)}
                style={{
                  ...styles.select,
                  borderColor: errors.criticality ? colors.critical : colors.border,
                }}
              >
                <option value="">--</option>
                {criticalityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.criticality && (
                <span style={styles.fieldError}>{errors.criticality}</span>
              )}
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}>{t("settings.controls.periodicity")}</label>
              <select
                value={form.frequency}
                onChange={(e) => handleChange("frequency", e.target.value)}
                style={styles.select}
              >
                <option value="">--</option>
                {frequencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Echeance + Statut */}
          <div style={styles.fieldRow}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}>{t("settings.controls.due_date")}</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => handleChange("due_date", e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}>{t("common.status")}</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                style={styles.select}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Taux de reussite + Duree */}
          <div style={styles.fieldRow}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}>%</label>
              <div style={styles.inputWithSuffix}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.pass_rate}
                  onChange={(e) => handleChange("pass_rate", e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                  placeholder="0-100"
                />
                <span style={styles.inputSuffix}>%</span>
              </div>
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.fieldLabel}>{t("common.date")} (jours)</label>
              <input
                type="number"
                min="1"
                value={form.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                style={styles.input}
                placeholder="Nb jours"
              />
            </div>
          </div>

          {/* Assigne */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>{t("settings.controls.assignee")}</label>
            <select
              value={form.assignee_id}
              onChange={(e) => handleChange("assignee_id", e.target.value)}
              style={styles.select}
            >
              <option value="">--</option>
              {members.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.btnSecondary}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                ...styles.btnPrimary,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "default" : "pointer",
              }}
            >
              {submitting
                ? t("common.loading")
                : mode === "edit"
                  ? t("common.save")
                  : t("common.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable Column Header
// ---------------------------------------------------------------------------

function SortableHeader({ label, sortKey, currentSort, onSort, style }) {
  const isActive = currentSort.key === sortKey;
  const arrow = isActive ? (currentSort.dir === "asc" ? " \u25B2" : " \u25BC") : "";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort(sortKey);
        }
      }}
      style={{
        ...styles.colHeader,
        ...style,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {label}
      {arrow && (
        <span style={{ fontSize: 8, marginLeft: 2 }}>{arrow}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ControlsTab({ controls = [], members = [], domains = [] }) {
  const toast = useToast();
  const { t } = useTranslation();

  // Dynamic constants
  const CRITICALITY_OPTIONS = [
    { value: "critical", label: t("criticality.critical") },
    { value: "high", label: t("criticality.high") },
    { value: "medium", label: t("criticality.medium") },
    { value: "low", label: t("criticality.low") },
  ];

  const FREQUENCY_OPTIONS = [
    { value: "daily", label: "Quotidien" },
    { value: "weekly", label: "Hebdomadaire" },
    { value: "monthly", label: "Mensuel" },
    { value: "quarterly", label: "Trimestriel" },
    { value: "yearly", label: "Annuel" },
  ];

  const FREQUENCY_LABELS = {
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
    quarterly: "Trimestriel",
    yearly: "Annuel",
  };

  const STATUS_OPTIONS = [
    { value: "pending", label: t("dashboard.kpi.pending") },
    { value: "overdue", label: t("dashboard.kpi.overdue") },
    { value: "done", label: t("dashboard.kpi.completed") },
  ];

  const STATUS_LABELS = {
    pending: t("dashboard.kpi.pending"),
    overdue: t("dashboard.kpi.overdue"),
    done: t("dashboard.kpi.completed"),
  };

  const CRITICALITY_LABELS = {
    critical: t("criticality.critical"),
    high: t("criticality.high"),
    medium: t("criticality.medium"),
    low: t("criticality.low"),
  };

  // Search
  const [search, setSearch] = useState("");

  // Sort
  const [sort, setSort] = useState({ key: "name", dir: "asc" });

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingControl, setEditingControl] = useState(null);

  // Confirm delete
  const [deletingId, setDeletingId] = useState(null);

  // Hover tracking for rows
  const [hoveredRow, setHoveredRow] = useState(null);

  // Sort handler
  const handleSort = useCallback(
    (key) => {
      setSort((prev) => ({
        key,
        dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
      }));
    },
    []
  );

  // Filtered + sorted controls
  const filteredControls = useMemo(() => {
    let list = [...controls];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => (c.name || "").toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const aVal = a[sort.key];
      const bVal = b[sort.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * dir;
      }

      return String(aVal).localeCompare(String(bVal), "fr") * dir;
    });

    return list;
  }, [controls, search, sort]);

  // Open create modal
  const handleOpenCreate = useCallback(() => {
    setEditingControl(null);
    setModalOpen(true);
  }, []);

  // Open edit modal
  const handleOpenEdit = useCallback((control) => {
    setEditingControl(control);
    setModalOpen(true);
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingControl(null);
  }, []);

  // Submit create/edit
  const handleSubmit = useCallback(
    (payload, resetSubmitting) => {
      const isEdit = editingControl != null;
      const url = isEdit
        ? `/api/controls/${editingControl.id}`
        : "/api/controls";
      const method = isEdit ? "PATCH" : "POST";

      fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ control: payload }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          toast.addToast(
            isEdit ? t("dock.todo_modal.task_updated") : t("dock.todo_modal.task_added"),
            { type: "success" }
          );
          handleCloseModal();
          router.reload();
        })
        .catch((err) => {
          console.error("ControlsTab submit error:", err);
          toast.addToast(t("dock.todo_modal.error_update"), { type: "error" });
          resetSubmitting();
        });
    },
    [editingControl, toast, handleCloseModal]
  );

  // Delete
  const handleDelete = useCallback(
    (id) => {
      fetch(`/api/controls/${id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          toast.addToast(t("dock.todo_modal.task_deleted"), { type: "success" });
          setDeletingId(null);
          router.reload();
        })
        .catch((err) => {
          console.error("ControlsTab delete error:", err);
          toast.addToast(t("dock.todo_modal.error_delete"), { type: "error" });
          setDeletingId(null);
        });
    },
    [toast]
  );

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div style={styles.toolbarRight}>
          <span style={styles.counter}>
            {filteredControls.length} {filteredControls.length !== 1 ? t("common.controls") : t("common.control")}
          </span>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={styles.btnPrimary}
          >
            + {t("settings.controls.add")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        {/* Table header */}
        <div style={styles.tableRow}>
          <SortableHeader label={t("common.name")} sortKey="name" currentSort={sort} onSort={handleSort} style={{ flex: 2.5 }} />
          <SortableHeader label={t("settings.controls.domain")} sortKey="domain" currentSort={sort} onSort={handleSort} style={{ flex: 1.2 }} />
          <SortableHeader label={t("settings.controls.criticality")} sortKey="criticality" currentSort={sort} onSort={handleSort} style={{ flex: 1 }} />
          <SortableHeader label={t("settings.controls.periodicity")} sortKey="frequency" currentSort={sort} onSort={handleSort} style={{ flex: 1.1 }} />
          <SortableHeader label={t("settings.controls.due_date")} sortKey="due_date" currentSort={sort} onSort={handleSort} style={{ flex: 1.1 }} />
          <SortableHeader label={t("common.status")} sortKey="status" currentSort={sort} onSort={handleSort} style={{ flex: 1 }} />
          <SortableHeader label={t("settings.controls.assignee")} sortKey="assignee_id" currentSort={sort} onSort={handleSort} style={{ flex: 1.2 }} />
          <div style={{ ...styles.colHeader, width: 68, flexShrink: 0 }}>{t("common.actions")}</div>
        </div>

        {/* Table body */}
        {filteredControls.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyText}>
              {controls.length === 0
                ? t("dashboard.kanban.no_filter_results")
                : t("common.no_results")}
            </span>
          </div>
        ) : (
          filteredControls.map((control) => {
            const crit = CRITICALITY_COLORS[control.criticality] || CRITICALITY_COLORS.medium;
            const stat = STATUS_COLORS[control.status] || STATUS_COLORS.pending;
            const domainInfo = getDomainInfo(control, domains);
            const domainColor = domainInfo?.color || colors.accent;
            const domainName = domainInfo?.name || control.domain || "\u2014";
            const isHovered = hoveredRow === control.id;

            return (
              <div
                key={control.id}
                style={{
                  ...styles.tableRow,
                  ...styles.tableBodyRow,
                  backgroundColor: isHovered ? colors.s2 : "transparent",
                }}
                onMouseEnter={() => setHoveredRow(control.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Nom */}
                <div style={{ ...styles.cell, flex: 2.5 }}>
                  <span style={styles.cellName}>{control.name}</span>
                </div>

                {/* Domaine */}
                <div style={{ ...styles.cell, flex: 1.2 }}>
                  <Badge
                    label={domainName}
                    bg={`${domainColor}11`}
                    color={domainColor}
                    border={`${domainColor}33`}
                  />
                </div>

                {/* Criticite */}
                <div style={{ ...styles.cell, flex: 1 }}>
                  <Badge
                    label={CRITICALITY_LABELS[control.criticality] || control.criticality || "\u2014"}
                    bg={crit.bg}
                    color={crit.color}
                    border={crit.border}
                  />
                </div>

                {/* Frequence */}
                <div style={{ ...styles.cell, flex: 1.1 }}>
                  <span style={styles.cellText}>
                    {FREQUENCY_LABELS[control.frequency] || control.frequency || "\u2014"}
                  </span>
                </div>

                {/* Echeance */}
                <div style={{ ...styles.cell, flex: 1.1 }}>
                  <span style={styles.cellMono}>{formatDate(control.due_date)}</span>
                </div>

                {/* Statut */}
                <div style={{ ...styles.cell, flex: 1 }}>
                  <Badge
                    label={STATUS_LABELS[control.status] || control.status || "\u2014"}
                    bg={stat.bg}
                    color={stat.color}
                    border={stat.border}
                  />
                </div>

                {/* Assigne */}
                <div style={{ ...styles.cell, flex: 1.2 }}>
                  <span style={styles.cellText}>
                    {getAssigneeName(control, members)}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ ...styles.cell, width: 68, flexShrink: 0, gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(control)}
                    style={styles.actionBtn}
                    title="Modifier"
                    aria-label={`Modifier ${control.name}`}
                  >
                    {"\u270E"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(control.id)}
                    style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
                    title="Supprimer"
                    aria-label={`Supprimer ${control.name}`}
                  >
                    {"\u2715"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <ControlFormModal
          mode={editingControl ? "edit" : "create"}
          initialData={editingControl}
          domains={domains}
          members={members}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          criticalityOptions={CRITICALITY_OPTIONS}
          frequencyOptions={FREQUENCY_OPTIONS}
          statusOptions={STATUS_OPTIONS}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId != null && (
        <ConfirmDialog
          message={t("settings.controls.confirm_delete")}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
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
    gap: 16,
  },

  // Toolbar
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  searchInput: {
    flex: 1,
    minWidth: 180,
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 400,
    color: colors.text,
    padding: "8px 14px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    backgroundColor: colors.s1,
    outline: "none",
    transition: "border-color .15s ease",
  },

  toolbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },

  counter: {
    fontFamily: fonts.dmMono,
    fontSize: 12,
    fontWeight: 600,
    color: colors.text2,
    whiteSpace: "nowrap",
  },

  // Table wrapper
  tableWrapper: {
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    boxShadow: shadows.card,
    overflow: "hidden",
  },

  // Table row (both header and body)
  tableRow: {
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    minHeight: 40,
  },

  tableBodyRow: {
    borderTop: `1px solid ${colors.border}`,
    transition: "background-color .1s ease",
  },

  // Column header cell
  colHeader: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    color: colors.text3,
    padding: "10px 6px",
    lineHeight: 1.3,
  },

  // Body cell
  cell: {
    display: "flex",
    alignItems: "center",
    padding: "8px 6px",
    minWidth: 0,
  },

  cellName: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  cellText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 500,
    color: colors.text2,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  cellMono: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    fontWeight: 500,
    color: colors.text2,
    lineHeight: 1.3,
  },

  // Action buttons
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    backgroundColor: colors.s1,
    color: colors.text2,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    transition: "all .12s ease",
  },

  actionBtnDanger: {
    color: colors.critical,
    borderColor: "#fca5a5",
  },

  // Empty state
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },

  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text3,
  },

  // Overlay (shared by modal and confirm)
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: zIndex.modal,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal
  modal: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: colors.s1,
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    maxHeight: "85vh",
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },

  modalTitle: {
    fontFamily: fonts.outfit,
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
  },

  modalClose: {
    width: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    color: colors.text2,
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    transition: "background-color .12s",
  },

  modalBody: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    overflowY: "auto",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 8,
    borderTop: `1px solid ${colors.border}`,
    marginTop: 4,
  },

  // Confirm dialog
  confirmBox: {
    backgroundColor: colors.s1,
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,.12)",
    padding: 24,
    maxWidth: 400,
    width: "100%",
  },

  confirmMessage: {
    fontFamily: fonts.outfit,
    fontSize: 14,
    fontWeight: 500,
    color: colors.text,
    lineHeight: 1.5,
    margin: "0 0 20px 0",
  },

  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  // Form fields
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  fieldRow: {
    display: "flex",
    gap: 12,
  },

  fieldLabel: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text2,
    lineHeight: 1.3,
  },

  fieldError: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 500,
    color: colors.critical,
    lineHeight: 1.3,
  },

  input: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 400,
    color: colors.text,
    padding: "8px 12px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    backgroundColor: colors.s1,
    outline: "none",
    transition: "border-color .15s ease",
    lineHeight: 1.4,
  },

  select: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 400,
    color: colors.text,
    padding: "8px 12px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    backgroundColor: colors.s1,
    outline: "none",
    transition: "border-color .15s ease",
    lineHeight: 1.4,
    appearance: "auto",
  },

  inputWithSuffix: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  inputSuffix: {
    fontFamily: fonts.dmMono,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text3,
    flexShrink: 0,
  },

  // Buttons
  btnPrimary: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: radii.button,
    padding: "8px 18px",
    cursor: "pointer",
    lineHeight: 1.3,
    transition: "opacity .15s ease",
    whiteSpace: "nowrap",
  },

  btnSecondary: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text2,
    backgroundColor: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "8px 18px",
    cursor: "pointer",
    lineHeight: 1.3,
    transition: "all .15s ease",
    whiteSpace: "nowrap",
  },

  btnDanger: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: colors.critical,
    border: "none",
    borderRadius: radii.button,
    padding: "8px 18px",
    cursor: "pointer",
    lineHeight: 1.3,
    transition: "opacity .15s ease",
    whiteSpace: "nowrap",
  },
};
