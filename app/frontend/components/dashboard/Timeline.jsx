import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { colors, fonts, radii } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CW = 48; // column width in px — one day = one column
const LANE_H = 42; // lane height in px
const CHIP_H = 32; // chip height in px
const CHIP_TOP = (LANE_H - CHIP_H) / 2; // vertical centering within lane
const HEADER_H = 48; // day-header height
const MAX_CHIP_COLS = 6; // maximum chip width in columns

const DAY_ABBR_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// ---------------------------------------------------------------------------
// Criticality color map
// ---------------------------------------------------------------------------

const CHIP_COLORS = {
  critical: { background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" },
  high:     { background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74" },
  medium:   { background: "#fefce8", color: "#92400e", border: "1px solid #fde68a" },
  low:      { background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" },
  done:     { background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0", opacity: 0.6 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "YYYY-MM-DD" into a local-midnight Date. */
function parseISO(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Number of days between two dates (a - b), signed. */
function diffDays(a, b) {
  return Math.round((a - b) / 86400000);
}

/** Check if two dates represent the same calendar day. */
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Check if a date falls on a weekend (Saturday or Sunday). */
function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

// ---------------------------------------------------------------------------
// Lane assignment algorithm
// ---------------------------------------------------------------------------

/**
 * Assign each control to a lane so that no two controls overlap on the same
 * lane. Returns an array of lanes, each being an array of
 * { control, startCol, spanCols }.
 *
 * @param {Array}  controls    - Controls already filtered for the period
 * @param {Date}   periodStart - First day of the visible period
 * @param {Date}   periodEnd   - Last day of the visible period
 * @param {number} totalDays   - Number of days in the period
 */
function assignLanes(controls, periodStart, periodEnd, totalDays) {
  // 1. Sort by due_date ascending
  const sorted = [...controls].sort((a, b) => {
    const da = parseISO(a.due_date);
    const db = parseISO(b.due_date);
    return da - db;
  });

  // Each lane is an array of placed items + a simple occupancy bitset (Set of col indices)
  const lanes = []; // { items: [], occupied: Set<colIndex> }

  for (const control of sorted) {
    const dueDate = parseISO(control.due_date);
    const duration = Math.min(control.duration || 1, MAX_CHIP_COLS);

    // The control spans from (due_date - duration + 1) to due_date
    const startDate = new Date(dueDate);
    startDate.setDate(startDate.getDate() - duration + 1);

    // Convert to column indices relative to periodStart
    const startCol = diffDays(startDate, periodStart);
    const endCol = diffDays(dueDate, periodStart);

    // Clamp to visible range
    const visStart = Math.max(startCol, 0);
    const visEnd = Math.min(endCol, totalDays - 1);

    // If fully outside the visible range, skip
    if (visStart > totalDays - 1 || visEnd < 0) continue;

    // Find the first lane with no overlap
    let placed = false;
    for (let li = 0; li < lanes.length; li++) {
      const lane = lanes[li];
      let free = true;
      for (let c = visStart; c <= visEnd; c++) {
        if (lane.occupied.has(c)) {
          free = false;
          break;
        }
      }
      if (free) {
        // Place here
        for (let c = visStart; c <= visEnd; c++) lane.occupied.add(c);
        lane.items.push({ control, startCol, endCol, visStart, visEnd });
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Create a new lane
      const occupied = new Set();
      for (let c = visStart; c <= visEnd; c++) occupied.add(c);
      lanes.push({ items: [{ control, startCol, endCol, visStart, visEnd }], occupied });
    }
  }

  // Guarantee at least 2 lanes for visual consistency
  while (lanes.length < 2) {
    lanes.push({ items: [], occupied: new Set() });
  }

  return lanes;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DayHeader({ day, isToday }) {
  const dayNum = day.getDate();
  const dayAbbr = DAY_ABBR_FR[day.getDay()];
  const weekend = isWeekend(day);

  return (
    <div
      style={{
        width: CW,
        minWidth: CW,
        height: HEADER_H,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        backgroundColor: isToday ? "#eef2ff" : weekend ? colors.s2 : colors.s1,
        borderRight: `1px solid ${colors.border}`,
        userSelect: "none",
      }}
    >
      <span
        style={{
          fontFamily: fonts.dmMono,
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1,
          color: isToday ? "#2563eb" : colors.text,
        }}
      >
        {dayNum}
      </span>
      <span
        style={{
          fontFamily: fonts.outfit,
          fontSize: 9,
          fontWeight: 600,
          lineHeight: 1,
          color: isToday ? "#2563eb" : colors.text3,
          textTransform: "uppercase",
          letterSpacing: ".4px",
        }}
      >
        {dayAbbr}
      </span>
    </div>
  );
}

function TimelineChip({ item, onControlClick }) {
  const [hovered, setHovered] = useState(false);
  const { control, visStart, visEnd } = item;

  const spanCols = visEnd - visStart + 1;
  const chipWidth = Math.max(CW * spanCols - 4, CW - 4);
  const leftPx = visStart * CW + 2;

  const colorKey = control.status === "done" ? "done" : (control.criticality || "medium");
  const chipColor = CHIP_COLORS[colorKey] || CHIP_COLORS.medium;

  const handleClick = useCallback(() => {
    onControlClick?.(control);
  }, [control, onControlClick]);

  return (
    <div
      role="button"
      tabIndex={0}
      title={control.name}
      style={{
        position: "absolute",
        top: CHIP_TOP,
        left: leftPx,
        width: chipWidth,
        height: CHIP_H,
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: fonts.outfit,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        padding: "0 10px",
        lineHeight: `${CHIP_H}px`,
        boxShadow: hovered
          ? "0 3px 12px rgba(0,0,0,.14)"
          : "0 1px 3px rgba(0,0,0,.09)",
        cursor: "pointer",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
        transform: hovered ? "translateY(-1px)" : "none",
        zIndex: hovered ? 10 : 1,
        ...chipColor,
      }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {control.name}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Timeline({
  controls = [],
  periodDays = [],
  periodStart,
  periodEnd,
  onControlClick,
}) {
  const containerRef = useRef(null);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const totalDays = periodDays.length;
  const gridWidth = CW * totalDays;

  // --- Drag-to-scroll state ---
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, hasMoved: false });

  const handleMouseDown = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    dragState.current = {
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
    };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const el = containerRef.current;
    if (!el) return;
    const dx = e.clientX - dragState.current.startX;
    // Only consider it a real drag after 3px of movement
    if (!dragState.current.hasMoved && Math.abs(dx) >= 3) {
      dragState.current.hasMoved = true;
    }
    if (dragState.current.hasMoved) {
      el.scrollLeft = dragState.current.scrollLeft - dx;
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) setIsDragging(false);
  }, [isDragging]);

  // Block click on chips when user was dragging (> 3px movement)
  const handleClickCapture = useCallback((e) => {
    if (dragState.current.hasMoved) {
      e.stopPropagation();
      e.preventDefault();
      dragState.current.hasMoved = false;
    }
  }, []);

  // --- Lane computation (memoized — expensive with many controls) ---
  const lanes = useMemo(
    () => assignLanes(controls, periodStart, periodEnd, totalDays),
    [controls, periodStart, periodEnd, totalDays],
  );

  // --- Today column index ---
  const todayCol = useMemo(() => {
    if (!periodStart) return -1;
    const col = diffDays(today, periodStart);
    return col >= 0 && col < totalDays ? col : -1;
  }, [today, periodStart, totalDays]);

  // --- Auto-scroll to center today on mount ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el || todayCol < 0) return;
    const todayPx = todayCol * CW + CW / 2;
    const viewWidth = el.clientWidth;
    el.scrollLeft = todayPx - viewWidth / 2;
  }, [todayCol]);

  // --- Empty state ---
  if (totalDays === 0) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyText}>Aucun contrôle sur cette période</span>
      </div>
    );
  }

  const hasVisibleControls = lanes.some((lane) => lane.items.length > 0);

  return (
    <div
      ref={containerRef}
      style={{
        ...styles.container,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: isDragging ? "none" : "auto",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClickCapture={handleClickCapture}
    >
      <div style={{ ...styles.grid, width: gridWidth }}>
        {/* Day headers — sticky top */}
        <div style={styles.dayHeaders}>
          {periodDays.map((day, i) => (
            <DayHeader key={i} day={day} isToday={isSameDay(day, today)} />
          ))}
        </div>

        {/* Lanes area */}
        <div style={styles.lanesContainer}>
          {/* Vertical grid lines */}
          {periodDays.map((day, i) => {
            const isT = isSameDay(day, today);
            const weekend = isWeekend(day);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: 0,
                  left: i * CW,
                  width: CW,
                  height: "100%",
                  borderRight: `1px solid ${colors.border}`,
                  opacity: isT ? 1 : 0.5,
                  backgroundColor: isT
                    ? "#eef2ff"
                    : weekend
                      ? colors.s2
                      : "transparent",
                  pointerEvents: "none",
                }}
              />
            );
          })}

          {/* Today line */}
          {todayCol >= 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: todayCol * CW + CW / 2,
                width: 2,
                height: "100%",
                backgroundColor: "#2563eb",
                opacity: 0.55,
                zIndex: 3,
                pointerEvents: "none",
                borderRadius: 1,
              }}
            />
          )}

          {/* Lanes */}
          {lanes.map((lane, li) => (
            <div key={li} style={styles.lane}>
              {lane.items.map((item) => (
                <TimelineChip
                  key={item.control.id}
                  item={item}
                  onControlClick={onControlClick}
                />
              ))}
            </div>
          ))}

          {/* Empty message overlay */}
          {!hasVisibleControls && (
            <div style={styles.emptyOverlay}>
              <span style={styles.emptyText}>
                Aucun contrôle sur cette période
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    overflowX: "auto",
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
  },

  grid: {
    position: "relative",
    minWidth: "100%",
  },

  dayHeaders: {
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "row",
    zIndex: 5,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.s1,
  },

  lanesContainer: {
    position: "relative",
    minHeight: LANE_H * 2,
  },

  lane: {
    position: "relative",
    height: LANE_H,
  },

  empty: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },

  emptyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  },

  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 14,
    color: colors.text3,
  },
};
