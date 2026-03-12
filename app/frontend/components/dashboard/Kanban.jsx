import { useState, useCallback, useMemo } from "react";
import { colors, fonts, radii } from "../../styles/tokens";
import KanbanCard from "./KanbanCard";
import SignalPanel from "./SignalPanel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Column config — defines label, flex, variant, and a key for the collapse state
const COLUMN_DEFS = [
  { key: "unassigned", label: "À ASSIGNER", flex: 1.1, variant: "default", filterable: true },
  { key: "inProgress", label: "EN COURS", flex: 2.2, variant: "default", filterable: true },
  { key: "done", label: "COMPLÉTÉS", flex: 1, variant: "default", filterable: true },
  { key: "picks", label: "PICKING IA", flex: 1.2, variant: "ai", filterable: false },
];

const CRIT_FILTER_OPTIONS = [
  { key: "critical", label: "Crit.", color: "#dc2626" },
  { key: "high", label: "Élev.", color: "#ea6c10" },
  { key: "medium", label: "Moy.", color: "#b58a00" },
  { key: "low", label: "Faib.", color: "#16a34a" },
];

const ALL_CRITS = ["critical", "high", "medium", "low"];

function makeInitialFilters() {
  return {
    unassigned: { search: "", criticalities: new Set(ALL_CRITS) },
    inProgress: { search: "", criticalities: new Set(ALL_CRITS) },
    done: { search: "", criticalities: new Set(ALL_CRITS) },
  };
}

// ---------------------------------------------------------------------------
// Badge count
// ---------------------------------------------------------------------------

function CountBadge({ count, variant = "default" }) {
  const bg = variant === "ai" ? hexToRgba(colors.ai, 0.12) : colors.s3;
  const fg = variant === "ai" ? colors.ai : colors.text2;
  const { filtered, total } = typeof count === "object" ? count : { filtered: count, total: count };
  const label = filtered !== total ? `${filtered}/${total}` : `${total}`;
  return (
    <span
      style={{
        fontFamily: fonts.dmMono,
        fontSize: 9,
        fontWeight: 700,
        backgroundColor: bg,
        color: fg,
        padding: "1px 5px",
        borderRadius: 3,
        lineHeight: 1.5,
        marginLeft: 5,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Column header (with collapse toggle)
// ---------------------------------------------------------------------------

function ColumnHeader({
  label,
  count,
  variant = "default",
  collapsed,
  onToggle,
}) {
  if (collapsed) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={styles.columnHeaderCollapsed}
      >
        <span style={styles.collapseToggle}>▸</span>
        <span style={styles.columnLabelCollapsed}>{label}</span>
        <CountBadge count={count} variant={variant} />
      </div>
    );
  }

  return (
    <div style={styles.columnHeader}>
      <span
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={styles.collapseToggle}
      >
        ▾
      </span>
      <span style={styles.columnLabel}>{label}</span>
      <CountBadge count={count} variant={variant} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// ColumnFilterBar
// ---------------------------------------------------------------------------

function ColumnFilterBar({ filters, onChange }) {
  const hasFilter =
    filters.search.trim() !== "" || filters.criticalities.size < ALL_CRITS.length;

  const toggleCrit = (key) => {
    const next = new Set(filters.criticalities);
    if (next.has(key)) {
      // Don't allow deselecting all — keep at least one
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
        placeholder="Filtrer..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        style={styles.filterInput}
      />
      <div style={styles.filterChips}>
        {CRIT_FILTER_OPTIONS.map(({ key, label, color }) => {
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
          title="Réinitialiser les filtres"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemberDrawer
// ---------------------------------------------------------------------------

function MemberDrawer({
  member,
  controls,
  isOpen,
  onToggle,
  onControlClick,
  onDrop,
}) {
  const [dragOver, setDragOver] = useState(false);

  const critCount = useMemo(() => {
    const c = controls.filter((ctrl) => ctrl.criticality === "critical").length;
    const h = controls.filter((ctrl) => ctrl.criticality === "high").length;
    return { critical: c, high: h };
  }, [controls]);

  // Workload — rough percentage based on controls count, cap at some reasonable number
  const workload = useMemo(() => {
    // Assume max 10 controls per member is 100%
    return Math.min(100, Math.round((controls.length / 10) * 100));
  }, [controls]);

  const barColor =
    workload <= 60 ? "#16a34a" : workload <= 80 ? "#d97706" : "#dc2626";

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const controlId = e.dataTransfer.getData("text/plain");
      if (controlId) {
        onDrop(controlId, member.id);
      }
    },
    [member.id, onDrop],
  );

  const memberColor = member.color || colors.ai;

  return (
    <div
      style={{
        ...styles.drawer,
        borderColor: dragOver ? colors.ai : colors.border,
        backgroundColor: dragOver ? "rgba(124,58,237,.03)" : colors.s2,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={styles.drawerHeader}
      >
        {/* Avatar */}
        <div
          style={{
            ...styles.avatar,
            backgroundColor: hexToRgba(memberColor, 0.18),
            color: memberColor,
          }}
        >
          {getInitials(member.name)}
        </div>

        {/* Name + role */}
        <div style={styles.drawerInfo}>
          <span style={styles.drawerName}>{member.name}</span>
          {member.role && (
            <span style={styles.drawerRole}>{member.role}</span>
          )}
        </div>

        {/* Crit badges */}
        <div style={styles.drawerBadges}>
          {critCount.critical > 0 && (
            <span style={styles.critBadgeC}>{critCount.critical}C</span>
          )}
          {critCount.high > 0 && (
            <span style={styles.critBadgeH}>{critCount.high}H</span>
          )}
        </div>

        {/* Workload bar */}
        <div style={styles.workloadBar}>
          <div
            style={{
              ...styles.workloadFill,
              width: `${workload}%`,
              backgroundColor: barColor,
            }}
          />
        </div>

        {/* Chevron */}
        <span
          style={{
            ...styles.chevron,
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          ›
        </span>
      </div>

      {/* Content */}
      {isOpen && (
        <div style={styles.drawerContent}>
          {controls.length === 0 && !dragOver && (
            <p style={styles.drawerEmpty}>Aucun contrôle assigné</p>
          )}
          {controls.map((control) => (
            <KanbanCard
              key={control.id}
              control={control}
              onClick={onControlClick}
              draggable={false}
              done={false}
            />
          ))}
          {dragOver && (
            <div style={styles.dropZone}>
              ↓ Déposer ici
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PickCard
// ---------------------------------------------------------------------------

function PickCard({ pick, control, onControlClick }) {
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (control) onControlClick?.(control);
  }, [control, onControlClick]);

  return (
    <div
      role="button"
      tabIndex={0}
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
        ...styles.pickCard,
        borderColor: hovered ? colors.ai : colors.border,
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered
          ? "0 3px 10px rgba(0,0,0,.07)"
          : "0 1px 3px rgba(0,0,0,.04)",
      }}
    >
      {/* Score circle */}
      <div style={styles.pickScore}>
        {pick.score != null ? pick.score : "–"}
      </div>

      <div style={styles.pickBody}>
        {/* Control name */}
        <div style={styles.pickName}>
          {control ? control.name : `Contrôle #${pick.control_id}`}
        </div>

        {/* Reason */}
        {pick.reason && (
          <div style={styles.pickReason}>{pick.reason}</div>
        )}

        {/* Tags */}
        {pick.tags && pick.tags.length > 0 && (
          <div style={styles.pickTags}>
            {pick.tags.map((tag, i) => (
              <span key={i} style={styles.pickTag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban (main)
// ---------------------------------------------------------------------------

export default function Kanban({
  controls = [],
  members = [],
  signals = [],
  picks = [],
  onControlClick,
  onAssign,
}) {
  // Open drawers — first member open by default
  const [openDrawers, setOpenDrawers] = useState(() => {
    const initial = new Set();
    if (members.length > 0) initial.add(members[0].id);
    return initial;
  });

  // Collapsed columns — none collapsed by default
  const [collapsedColumns, setCollapsedColumns] = useState(() => new Set());

  // Per-column filters
  const [columnFilters, setColumnFilters] = useState(makeInitialFilters);

  const updateColumnFilter = useCallback((columnKey, newFilter) => {
    setColumnFilters((prev) => ({ ...prev, [columnKey]: newFilter }));
  }, []);

  const toggleDrawer = useCallback((memberId) => {
    setOpenDrawers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

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

  // Partitioned controls
  const { unassigned, inProgress, done } = useMemo(() => {
    const unassigned = [];
    const inProgress = [];
    const done = [];

    for (const ctrl of controls) {
      if (ctrl.status === "done") {
        done.push(ctrl);
      } else if (!ctrl.assignee_id) {
        unassigned.push(ctrl);
      } else {
        inProgress.push(ctrl);
      }
    }

    return { unassigned, inProgress, done };
  }, [controls]);

  // Controls grouped by member
  const controlsByMember = useMemo(() => {
    const map = {};
    for (const m of members) {
      map[m.id] = [];
    }
    for (const ctrl of inProgress) {
      if (map[ctrl.assignee_id]) {
        map[ctrl.assignee_id].push(ctrl);
      }
    }
    return map;
  }, [members, inProgress]);

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

  const filteredUnassigned = useMemo(
    () => applyColumnFilter(unassigned, "unassigned"),
    [unassigned, applyColumnFilter],
  );
  const filteredInProgress = useMemo(
    () => applyColumnFilter(inProgress, "inProgress"),
    [inProgress, applyColumnFilter],
  );
  const filteredDone = useMemo(
    () => applyColumnFilter(done, "done"),
    [done, applyColumnFilter],
  );

  // Controls grouped by member (using filtered inProgress)
  const filteredControlsByMember = useMemo(() => {
    const map = {};
    for (const m of members) map[m.id] = [];
    for (const ctrl of filteredInProgress) {
      if (map[ctrl.assignee_id]) map[ctrl.assignee_id].push(ctrl);
    }
    return map;
  }, [members, filteredInProgress]);

  // Controls map for picks lookup
  const controlsById = useMemo(() => {
    const map = {};
    for (const ctrl of controls) {
      map[ctrl.id] = ctrl;
    }
    return map;
  }, [controls]);

  // Drop handler — assign + auto-open drawer
  const handleDrop = useCallback(
    (controlId, memberId) => {
      onAssign?.(controlId, memberId);
      // Auto-open the member's drawer
      setOpenDrawers((prev) => {
        const next = new Set(prev);
        next.add(memberId);
        return next;
      });
      // eslint-disable-next-line no-console
      console.log(`Assigné: contrôle ${controlId} → membre ${memberId}`);
    },
    [onAssign],
  );

  // Count map for column headers (filtered / total)
  const columnCounts = useMemo(
    () => ({
      unassigned: { filtered: filteredUnassigned.length, total: unassigned.length },
      inProgress: { filtered: filteredInProgress.length, total: inProgress.length },
      done: { filtered: filteredDone.length, total: done.length },
      picks: { filtered: picks.length, total: picks.length },
    }),
    [filteredUnassigned.length, unassigned.length, filteredInProgress.length, inProgress.length, filteredDone.length, done.length, picks.length],
  );

  // Column content renderers (using filtered data)
  const columnContent = {
    unassigned: (
      <>
        {filteredUnassigned.length === 0 ? (
          <p style={styles.emptyMsg}>
            {unassigned.length === 0
              ? "Tous les contrôles sont assignés"
              : "Aucun résultat pour ces filtres"}
          </p>
        ) : (
          filteredUnassigned.map((ctrl) => (
            <KanbanCard
              key={ctrl.id}
              control={ctrl}
              onClick={onControlClick}
              draggable={true}
              done={false}
            />
          ))
        )}
      </>
    ),
    inProgress: (
      <>
        {members.map((member) => (
          <MemberDrawer
            key={member.id}
            member={member}
            controls={filteredControlsByMember[member.id] || []}
            isOpen={openDrawers.has(member.id)}
            onToggle={() => toggleDrawer(member.id)}
            onControlClick={onControlClick}
            onDrop={handleDrop}
          />
        ))}
      </>
    ),
    done: (
      <>
        {filteredDone.length === 0 && done.length > 0 ? (
          <p style={styles.emptyMsg}>Aucun résultat pour ces filtres</p>
        ) : (
          filteredDone.map((ctrl) => (
            <KanbanCard
              key={ctrl.id}
              control={ctrl}
              onClick={onControlClick}
              draggable={false}
              done={true}
            />
          ))
        )}
      </>
    ),
    picks: (
      <>
        {picks.map((pick) => (
          <PickCard
            key={pick.id || pick.control_id}
            pick={pick}
            control={controlsById[pick.control_id]}
            onControlClick={onControlClick}
          />
        ))}
      </>
    ),
  };

  return (
    <div style={styles.board}>
      {COLUMN_DEFS.map((col) => {
        const isCollapsed = collapsedColumns.has(col.key);

        if (isCollapsed) {
          return (
            <div
              key={col.key}
              style={styles.columnCollapsed}
            >
              <ColumnHeader
                label={col.label}
                count={columnCounts[col.key]}
                variant={col.variant}
                collapsed={true}
                onToggle={() => toggleColumn(col.key)}
              />
            </div>
          );
        }

        return (
          <div
            key={col.key}
            style={{
              ...styles.column,
              flex: col.flex,
              transition: "flex .25s ease, width .25s ease, padding .25s ease",
            }}
          >
            <ColumnHeader
              label={col.label}
              count={columnCounts[col.key]}
              variant={col.variant}
              collapsed={false}
              onToggle={() => toggleColumn(col.key)}
            />
            {col.filterable && (
              <ColumnFilterBar
                filters={columnFilters[col.key]}
                onChange={(f) => updateColumnFilter(col.key, f)}
              />
            )}
            <div style={styles.columnBody}>
              {columnContent[col.key]}
            </div>
          </div>
        );
      })}

      {/* Signal panel */}
      <SignalPanel signals={signals} />
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
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    padding: 8,
    minWidth: 0,
    minHeight: 0,
  },

  // Column — collapsed
  columnCollapsed: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    padding: "8px 4px",
    width: 36,
    minWidth: 36,
    maxWidth: 36,
    flexShrink: 0,
    minHeight: 0,
    overflow: "hidden",
    transition: "width .25s ease, padding .25s ease",
    cursor: "pointer",
  },

  // Column header — expanded
  columnHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexShrink: 0,
  },

  // Column header — collapsed (vertical)
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

  collapseToggle: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text3,
    cursor: "pointer",
    outline: "none",
    userSelect: "none",
    lineHeight: 1,
    flexShrink: 0,
    marginRight: 4,
  },

  columnLabel: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    color: colors.text2,
  },

  columnLabelCollapsed: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    color: colors.text2,
    whiteSpace: "nowrap",
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
    fontSize: 10,
    color: colors.text3,
    textAlign: "center",
    margin: 0,
    paddingTop: 20,
  },

  // ColumnFilterBar
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
    backgroundColor: colors.s2,
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

  // MemberDrawer
  drawer: {
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    overflow: "hidden",
    flexShrink: 0,
    transition: "border-color .15s ease, background-color .15s ease",
  },

  drawerHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: "6px 8px",
    cursor: "pointer",
    userSelect: "none",
    outline: "none",
  },

  avatar: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.outfit,
    fontSize: 9,
    fontWeight: 700,
    flexShrink: 0,
    lineHeight: 1,
  },

  drawerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    minWidth: 0,
    flex: 1,
  },

  drawerName: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  drawerRole: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    fontWeight: 400,
    color: colors.text3,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  drawerBadges: {
    display: "flex",
    flexDirection: "row",
    gap: 3,
    flexShrink: 0,
  },

  critBadgeC: {
    fontFamily: fonts.dmMono,
    fontSize: 8,
    fontWeight: 700,
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "1px 3px",
    borderRadius: 3,
    lineHeight: 1.4,
  },

  critBadgeH: {
    fontFamily: fonts.dmMono,
    fontSize: 8,
    fontWeight: 700,
    backgroundColor: "#fff7ed",
    color: "#c2410c",
    padding: "1px 3px",
    borderRadius: 3,
    lineHeight: 1.4,
  },

  workloadBar: {
    width: 36,
    height: 3,
    backgroundColor: colors.s3,
    borderRadius: 2,
    overflow: "hidden",
    flexShrink: 0,
  },

  workloadFill: {
    height: "100%",
    borderRadius: 2,
    transition: "width .3s ease, background-color .3s ease",
  },

  chevron: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text3,
    transition: "transform .2s ease",
    flexShrink: 0,
    lineHeight: 1,
  },

  drawerContent: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    padding: "0 8px 8px 8px",
  },

  drawerEmpty: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    color: colors.text3,
    textAlign: "center",
    margin: 0,
    padding: "5px 0",
  },

  dropZone: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.ai,
    textAlign: "center",
    padding: "8px 0",
    border: `1px dashed ${colors.ai}`,
    borderRadius: radii.button,
    backgroundColor: "rgba(124,58,237,.03)",
  },

  // PickCard
  pickCard: {
    display: "flex",
    flexDirection: "row",
    gap: 7,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderLeft: `3px solid ${colors.ai}`,
    borderRadius: radii.button,
    padding: "7px 9px",
    flexShrink: 0,
    cursor: "pointer",
    outline: "none",
    transition: "border-color .15s ease, transform .15s ease, box-shadow .15s ease",
  },

  pickScore: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    backgroundColor: hexToRgba(colors.ai, 0.1),
    color: colors.ai,
    fontFamily: fonts.dmMono,
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    lineHeight: 1,
  },

  pickBody: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
    flex: 1,
  },

  pickName: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  pickReason: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    color: colors.text2,
    lineHeight: 1.3,
  },

  pickTags: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginTop: 2,
  },

  pickTag: {
    fontFamily: fonts.outfit,
    fontSize: 8,
    fontWeight: 600,
    textTransform: "uppercase",
    backgroundColor: hexToRgba(colors.ai, 0.1),
    color: colors.ai,
    padding: "1px 5px",
    borderRadius: 3,
    lineHeight: 1.4,
    whiteSpace: "nowrap",
  },
};
