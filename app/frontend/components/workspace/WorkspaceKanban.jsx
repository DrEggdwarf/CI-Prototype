import { useState, useCallback, useMemo } from "react";
import { router } from "@inertiajs/react";
import { colors, fonts, radii } from "../../styles/tokens";
import { useToast } from "../../lib/useToast";
import { useTranslation } from "../../lib/useTranslation";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CRIT_STRIPE = {
  critical: "#dc2626",
  high: "#ea6c10",
  medium: "#b58a00",
  low: "#16a34a",
};

const CRIT_BADGE = {
  critical: { background: "#fef2f2", color: "#dc2626" },
  high: { background: "#fff7ed", color: "#c2410c" },
  medium: { background: "#fefce8", color: "#92400e" },
  low: { background: "#f0fdf4", color: "#15803d" },
};

const MONTH_SHORT_FR = [
  "janv.", "f\u00e9vr.", "mars", "avr.", "mai", "juin",
  "juil.", "ao\u00fbt", "sept.", "oct.", "nov.", "d\u00e9c.",
];

const ALL_CRITS = ["critical", "high", "medium", "low"];

function makeInitialFilters() {
  return {
    pending: { search: "", criticalities: new Set(ALL_CRITS) },
    in_progress: { search: "", criticalities: new Set(ALL_CRITS) },
    done: { search: "", criticalities: new Set(ALL_CRITS) },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateFr(iso) {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_SHORT_FR[m - 1]}`;
}

function isOverdue(control) {
  if (control.status === "overdue") return true;
  if (control.status === "done") return false;
  if (!control.due_date) return false;
  return new Date(control.due_date) < new Date();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CountBadge({ count }) {
  const { filtered, total } = typeof count === "object" ? count : { filtered: count, total: count };
  const label = filtered !== total ? `${filtered}/${total}` : `${total}`;
  return (
    <span style={styles.countBadge}>
      {label}
    </span>
  );
}

function ColumnFilterBar({ filters, onChange, filterPlaceholder, resetTitle, critFilterOptions }) {
  const hasFilter =
    filters.search.trim() !== "" || filters.criticalities.size < ALL_CRITS.length;

  const toggleCrit = (key) => {
    const next = new Set(filters.criticalities);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    onChange({ ...filters, criticalities: next });
  };

  return (
    <div style={styles.filterBar}>
      <input
        type="text"
        placeholder={filterPlaceholder}
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        style={styles.filterInput}
      />
      <div style={styles.filterChips}>
        {critFilterOptions.map(({ key, label, color }) => {
          const active = filters.criticalities.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleCrit(key)}
              style={{
                ...styles.filterChip,
                backgroundColor: active ? color : colors.s2,
                color: active ? "#fff" : colors.text3,
                borderColor: active ? color : colors.border,
                opacity: active ? 1 : 0.5,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      {hasFilter && (
        <button
          type="button"
          onClick={() =>
            onChange({ search: "", criticalities: new Set(ALL_CRITS) })
          }
          style={styles.filterClear}
          title={resetTitle}
        >
          {"\u2715"}
        </button>
      )}
    </div>
  );
}

function KanbanCard({ control, onMarkDone, onClick, draggable, critLabels, domainLabels, markDoneLabel }) {
  const [hovered, setHovered] = useState(false);
  const [marking, setMarking] = useState(false);

  const crit = control.criticality || "medium";
  const stripeColor = control.status === "done"
    ? "#94a3b8"
    : (CRIT_STRIPE[crit] || CRIT_STRIPE.medium);
  const critBadge = CRIT_BADGE[crit] || CRIT_BADGE.medium;
  const isDone = control.status === "done";
  const overdue = isOverdue(control);

  const handleMarkDone = useCallback(
    (e) => {
      e.stopPropagation();
      if (marking || isDone) return;
      setMarking(true);
      onMarkDone(control.id, () => setMarking(false));
    },
    [control.id, marking, isDone, onMarkDone],
  );

  const handleDragStart = useCallback((e) => {
    e.dataTransfer.setData("text/plain", String(control.id));
    e.dataTransfer.effectAllowed = "move";
  }, [control.id]);

  const handleClick = useCallback(() => {
    onClick?.(control);
  }, [control, onClick]);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.card,
        opacity: isDone ? 0.6 : 1,
        borderColor: hovered ? colors.border2 : colors.border,
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered
          ? "0 3px 10px rgba(0,0,0,.07)"
          : "0 1px 3px rgba(0,0,0,.04)",
        cursor: draggable ? "grab" : "pointer",
      }}
    >
      {/* Stripe gauche */}
      <div
        aria-hidden="true"
        style={{
          ...styles.stripe,
          backgroundColor: stripeColor,
        }}
      />

      {/* Nom */}
      <div
        style={{
          ...styles.cardName,
          textDecoration: isDone ? "line-through" : "none",
        }}
        title={control.name}
      >
        {control.name}
      </div>

      {/* Badges */}
      <div style={styles.badges}>
        <span
          style={{
            ...styles.badgeBase,
            backgroundColor: critBadge.background,
            color: critBadge.color,
          }}
        >
          {critLabels[crit] || crit}
        </span>

        {control.domain && domainLabels[control.domain] && (
          <span style={styles.badgeDomain}>
            {domainLabels[control.domain]}
          </span>
        )}
      </div>

      {/* Date + action */}
      <div style={styles.cardFooter}>
        {control.due_date && (
          <span
            style={{
              ...styles.cardDate,
              color: overdue && !isDone ? colors.critical : colors.text3,
            }}
          >
            {formatDateFr(control.due_date)}
          </span>
        )}

        {!isDone && (
          <button
            type="button"
            onClick={handleMarkDone}
            disabled={marking}
            style={{
              ...styles.doneBtn,
              opacity: marking ? 0.5 : 1,
              cursor: marking ? "default" : "pointer",
            }}
          >
            {marking ? "..." : markDoneLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function WorkspaceKanban({ controls = [], onControlClick }) {
  const toast = useToast();
  const { t } = useTranslation();

  // Dynamic constants (depend on translations)
  const COLUMN_DEFS = [
    { key: "pending", label: t("workspace.columns.assigned_to_me"), accentColor: colors.accent, targetStatus: "pending" },
    { key: "in_progress", label: t("workspace.columns.in_progress"), accentColor: "#d97706", targetStatus: "in_progress" },
    { key: "done", label: t("workspace.columns.completed"), accentColor: colors.low, targetStatus: "done" },
  ];

  const CRIT_LABELS = {
    critical: t("criticality.critical"),
    high: t("criticality.high"),
    medium: t("criticality.medium"),
    low: t("criticality.low"),
  };

  const CRIT_FILTER_OPTIONS = [
    { key: "critical", label: t("criticality.critical_short"), color: "#dc2626" },
    { key: "high", label: t("criticality.high_short"), color: "#ea6c10" },
    { key: "medium", label: t("criticality.medium_short"), color: "#b58a00" },
    { key: "low", label: t("criticality.low_short"), color: "#16a34a" },
  ];

  const DOMAIN_LABELS = {
    finance: t("domains.finance"),
    it: t("domains.it"),
    rh: t("domains.rh"),
    achats: t("domains.achats"),
    logistique: t("domains.logistique"),
    juridique: t("domains.juridique"),
  };

  const [dragOverCol, setDragOverCol] = useState(null);
  const [columnFilters, setColumnFilters] = useState(makeInitialFilters);
  const [collapsedColumns, setCollapsedColumns] = useState(() => new Set());

  const toggleColumn = useCallback((columnKey) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnKey)) {
        next.delete(columnKey);
      } else {
        next.add(columnKey);
      }
      return next;
    });
  }, []);

  const updateColumnFilter = useCallback((columnKey, newFilter) => {
    setColumnFilters((prev) => ({ ...prev, [columnKey]: newFilter }));
  }, []);

  // Partition controls into 3 columns
  const columns = useMemo(() => {
    const pending = [];
    const in_progress = [];
    const done = [];

    for (const ctrl of controls) {
      if (ctrl.status === "done") {
        done.push(ctrl);
      } else if (ctrl.status === "in_progress") {
        in_progress.push(ctrl);
      } else {
        // pending, overdue, and anything else → "ASSIGNÉ À MOI"
        pending.push(ctrl);
      }
    }

    return { pending, in_progress, done };
  }, [controls]);

  // Apply per-column filters
  const applyColumnFilter = useCallback((items, columnKey) => {
    const f = columnFilters[columnKey];
    if (!f) return items;
    let result = items;
    if (f.search.trim()) {
      const q = f.search.trim().toLowerCase();
      result = result.filter((c) => (c.name || "").toLowerCase().includes(q));
    }
    if (f.criticalities && f.criticalities.size < ALL_CRITS.length) {
      result = result.filter((c) => f.criticalities.has(c.criticality || "medium"));
    }
    return result;
  }, [columnFilters]);

  const filteredColumns = useMemo(() => ({
    pending: applyColumnFilter(columns.pending, "pending"),
    in_progress: applyColumnFilter(columns.in_progress, "in_progress"),
    done: applyColumnFilter(columns.done, "done"),
  }), [columns, applyColumnFilter]);

  const columnCounts = useMemo(() => ({
    pending: { filtered: filteredColumns.pending.length, total: columns.pending.length },
    in_progress: { filtered: filteredColumns.in_progress.length, total: columns.in_progress.length },
    done: { filtered: filteredColumns.done.length, total: columns.done.length },
  }), [filteredColumns, columns]);

  // Update a control status via API
  const updateControlStatus = useCallback(
    (controlId, newStatus, onFinally) => {
      fetch(`/api/controls/${controlId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ control: { status: newStatus } }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Erreur ${res.status}`);
          toast.addToast(newStatus === "done" ? t("dashboard.modal.control_done") : t("dashboard.modal.control_updated"), { type: "success" });
          router.reload();
        })
        .catch((err) => {
          console.error("Status update error:", err);
          toast.addToast(t("dashboard.modal.update_error"), { type: "error" });
          onFinally?.();
        });
    },
    [toast],
  );

  // Mark as done shortcut
  const handleMarkDone = useCallback(
    (controlId, onFinally) => updateControlStatus(controlId, "done", onFinally),
    [updateControlStatus],
  );

  // Drag & drop handlers — all columns are drop targets
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const colKey = e.currentTarget.dataset.colkey;
    setDragOverCol(colKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const colKey = e.currentTarget.dataset.colkey;
      setDragOverCol(null);
      const controlId = e.dataTransfer.getData("text/plain");
      if (!controlId) return;

      const colDef = COLUMN_DEFS.find((c) => c.key === colKey);
      if (!colDef) return;

      updateControlStatus(Number(controlId), colDef.targetStatus);
    },
    [updateControlStatus],
  );

  return (
    <div style={styles.board}>
      {COLUMN_DEFS.map((col) => {
        const items = filteredColumns[col.key] || [];
        const isDoneCol = col.key === "done";
        const isDropTarget = dragOverCol === col.key;
        const isCollapsed = collapsedColumns.has(col.key);

        if (isCollapsed) {
          return (
            <div
              key={col.key}
              style={styles.columnCollapsed}
              onClick={() => toggleColumn(col.key)}
            >
              <div style={styles.columnHeaderCollapsed}>
                <span style={styles.collapseChevron}>&#9658;</span>
                <span style={styles.columnLabelCollapsed}>{col.label}</span>
                <CountBadge count={columnCounts[col.key]} />
              </div>
            </div>
          );
        }

        return (
          <div
            key={col.key}
            data-colkey={col.key}
            style={{
              ...styles.column,
              ...(isDropTarget ? styles.columnDropTarget : {}),
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Column header */}
            <div style={styles.columnHeader}>
              <button
                type="button"
                onClick={() => toggleColumn(col.key)}
                style={styles.collapseChevronBtn}
                title="R\u00e9duire la colonne"
              >
                &#9660;
              </button>
              <div
                style={{
                  ...styles.columnDot,
                  backgroundColor: col.accentColor,
                }}
              />
              <span style={styles.columnLabel}>{col.label}</span>
              <CountBadge count={columnCounts[col.key]} />
            </div>

            {/* Per-column filter bar */}
            <ColumnFilterBar
              filters={columnFilters[col.key]}
              onChange={(f) => updateColumnFilter(col.key, f)}
              filterPlaceholder={t("common.filter")}
              resetTitle={t("common.reset")}
              critFilterOptions={CRIT_FILTER_OPTIONS}
            />

            {/* Cards */}
            <div style={styles.columnBody}>
              {items.length === 0 ? (
                <p style={styles.emptyMsg}>
                  {isDropTarget ? t("workspace.actions.drop_here") : t("workspace.actions.no_controls")}
                </p>
              ) : (
                items.map((ctrl) => (
                  <KanbanCard
                    key={ctrl.id}
                    control={ctrl}
                    onMarkDone={handleMarkDone}
                    onClick={onControlClick}
                    draggable={!isDoneCol}
                    critLabels={CRIT_LABELS}
                    domainLabels={DOMAIN_LABELS}
                    markDoneLabel={t("workspace.actions.mark_done")}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  // Board layout
  board: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    width: "100%",
    height: "100%",
    minHeight: 0,
    alignItems: "stretch",
  },

  // Column — expanded
  column: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    padding: 8,
    minWidth: 0,
    minHeight: 0,
    transition: "flex .3s ease, width .3s ease, min-width .3s ease, padding .3s ease, border-color .15s ease, background-color .15s ease",
  },

  // Column — collapsed
  columnCollapsed: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    padding: "8px 4px",
    width: 40,
    minWidth: 40,
    maxWidth: 40,
    flexShrink: 0,
    minHeight: 0,
    overflow: "hidden",
    cursor: "pointer",
    transition: "flex .3s ease, width .3s ease, min-width .3s ease, padding .3s ease",
  },

  // Column header — collapsed (vertical text)
  columnHeaderCollapsed: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    cursor: "pointer",
    outline: "none",
    userSelect: "none",
    padding: "4px 0",
  },

  collapseChevron: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    color: colors.text3,
    lineHeight: 1,
    flexShrink: 0,
  },

  columnLabelCollapsed: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    color: colors.text2,
    whiteSpace: "nowrap",
  },

  columnDropTarget: {
    borderColor: colors.low,
    backgroundColor: "#f0fdf4",
  },

  // Column header — expanded
  columnHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    flexShrink: 0,
  },

  collapseChevronBtn: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    color: colors.text3,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
    outline: "none",
  },

  columnDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },

  columnLabel: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    color: colors.text2,
  },

  countBadge: {
    fontFamily: fonts.dmMono,
    fontSize: 9,
    fontWeight: 700,
    backgroundColor: colors.s3,
    color: colors.text2,
    padding: "1px 5px",
    borderRadius: 3,
    lineHeight: 1.5,
    marginLeft: "auto",
  },

  // Filter bar
  filterBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
    flexShrink: 0,
  },

  filterInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontFamily: fonts.outfit,
    padding: "4px 8px",
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    backgroundColor: colors.s1,
    color: colors.text,
    outline: "none",
  },

  filterChips: {
    display: "flex",
    flexDirection: "row",
    gap: 2,
    flexShrink: 0,
  },

  filterChip: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    fontWeight: 600,
    padding: "2px 5px",
    borderRadius: 3,
    border: "1px solid",
    cursor: "pointer",
    outline: "none",
    lineHeight: 1.4,
    whiteSpace: "nowrap",
    transition: "all .12s",
  },

  filterClear: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text3,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 4px",
    lineHeight: 1,
    flexShrink: 0,
  },

  columnBody: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
  },

  emptyMsg: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text3,
    textAlign: "center",
    margin: 0,
    paddingTop: 20,
  },

  // Card
  card: {
    position: "relative",
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    padding: "10px 12px 10px 14px",
    minHeight: 72,
    flexShrink: 0,
    overflow: "hidden",
    transition: "border-color .15s ease, transform .15s ease, box-shadow .15s ease",
    outline: "none",
    userSelect: "none",
  },

  stripe: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 3,
    height: "100%",
    borderRadius: `${radii.card} 0 0 ${radii.card}`,
  },

  cardName: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    marginBottom: 5,
  },

  badges: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 6,
  },

  badgeBase: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 3,
    lineHeight: 1.5,
    whiteSpace: "nowrap",
  },

  badgeDomain: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 3,
    lineHeight: 1.5,
    whiteSpace: "nowrap",
    backgroundColor: colors.s3,
    color: colors.text2,
  },

  cardFooter: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  cardDate: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    whiteSpace: "nowrap",
    lineHeight: 1.4,
  },

  doneBtn: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: colors.low,
    border: "none",
    borderRadius: radii.button,
    padding: "3px 8px",
    lineHeight: 1.4,
    transition: "opacity .12s",
    flexShrink: 0,
  },
};
