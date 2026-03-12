import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { router } from "@inertiajs/react";
import { colors, fonts, radii, shadows } from "../styles/tokens";
import { useFilters } from "../lib/useFilters";
import { useToast } from "../lib/useToast";
import Toolbar from "../components/dashboard/Toolbar";
import Timeline from "../components/dashboard/Timeline";
import WorkspaceKanban from "../components/workspace/WorkspaceKanban";
import WorkspaceFab from "../components/workspace/WorkspaceFab";
import ControlModal from "../components/dashboard/ControlModal";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Workspace({
  member = {},
  controls = [],
  todos = [],
  team_messages = [],
  all_members = [],
}) {
  const initials = member.initials || "??";
  const avatarColor = member.color || colors.accent;
  const charge = member.load ?? 0;
  const toast = useToast();

  // Modal state (click on timeline chip or kanban card)
  const [selectedControl, setSelectedControl] = useState(null);
  const handleControlClick = useCallback((control) => setSelectedControl(control), []);
  const handleCloseModal = useCallback(() => setSelectedControl(null), []);

  // Periodic reload — pick up admin assignments without manual refresh
  useEffect(() => {
    const interval = setInterval(() => {
      router.reload({ only: ["controls", "todos", "team_messages"] });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filters (shared with Toolbar + Timeline)
  const filters = useFilters();
  const filteredControls = filters.filterControls(controls);

  // Stats
  const stats = useMemo(() => {
    let overdue = 0;
    let done = 0;
    const now = new Date();
    for (const c of controls) {
      if (c.status === "done") done++;
      else if (c.status === "overdue" || (c.due_date && new Date(c.due_date) < now)) overdue++;
    }
    return { total: controls.length, overdue, done };
  }, [controls]);

  const chargeBarColor =
    charge > 80 ? colors.critical : charge > 60 ? colors.high : colors.accent;

  // --- Resizable split pane ---
  const [timelineHeight, setTimelineHeight] = useState(null);
  const panelRef = useRef(null);
  const mainZoneRef = useRef(null);
  const [resizing, setResizing] = useState(false);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    const panel = panelRef.current;
    const mainZone = mainZoneRef.current;
    if (!panel || !mainZone) return;

    const startY = e.clientY;
    const startHeight = panel.getBoundingClientRect().height;
    const maxH = mainZone.getBoundingClientRect().height - 120;

    setResizing(true);

    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      const newH = Math.max(100, Math.min(startHeight + dy, maxH));
      setTimelineHeight(newH);
    };

    const onUp = () => {
      setResizing(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const handleResizeReset = useCallback(() => {
    setTimelineHeight(null);
  }, []);

  return (
    <div style={styles.page}>
      {/* ---- Member header ---- */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{ ...styles.avatar, backgroundColor: avatarColor }}>
            {initials}
          </div>
          <div style={styles.memberText}>
            <span style={styles.memberName}>{member.name || "Membre"}</span>
            <span style={styles.memberRole}>{member.role || "--"}</span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <StatBadge label="Assign\u00e9s" value={stats.total} />
          <StatBadge label="En retard" value={stats.overdue} accent={stats.overdue > 0 ? colors.critical : undefined} />
          <StatBadge label="Compl\u00e9t\u00e9s" value={stats.done} accent={stats.done > 0 ? colors.low : undefined} />

          <div style={styles.chargeWrapper}>
            <div style={styles.chargeTrack}>
              <div style={{ ...styles.chargeFill, width: `${Math.min(charge, 100)}%`, backgroundColor: chargeBarColor }} />
            </div>
            <span style={styles.chargeValue}>{charge}%</span>
          </div>
        </div>
      </div>

      {/* ---- Toolbar (filtres + période) ---- */}
      <Toolbar
        periodMode={filters.periodMode}
        setPeriodMode={filters.setPeriodMode}
        periodLabel={filters.periodLabel}
        prev={filters.prev}
        next={filters.next}
        goToToday={filters.goToToday}
        setCustomRange={filters.setCustomRange}
        activeDomains={filters.activeDomains}
        toggleDomain={filters.toggleDomain}
        criticalOnly={filters.criticalOnly}
        toggleCriticalOnly={filters.toggleCriticalOnly}
        overdueOnly={filters.overdueOnly}
        toggleOverdueOnly={filters.toggleOverdueOnly}
        searchQuery={filters.searchQuery}
        setSearchQuery={filters.setSearchQuery}
        hasActiveFilters={filters.hasActiveFilters}
        resetFilters={filters.resetFilters}
      />

      {/* ---- Main zone: timeline + resize handle + kanban ---- */}
      <div
        ref={mainZoneRef}
        style={{
          ...styles.mainZone,
          cursor: resizing ? "row-resize" : undefined,
          userSelect: resizing ? "none" : undefined,
        }}
      >
        {/* Timeline panel */}
        <div
          ref={panelRef}
          style={{
            ...styles.timelinePanel,
            ...(timelineHeight != null
              ? { flex: "0 0 auto", height: timelineHeight }
              : {}),
          }}
        >
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Timeline</span>
            <span style={styles.panelCount}>
              {filteredControls.length} {filteredControls.length > 1 ? "contr\u00f4les" : "contr\u00f4le"}
            </span>
          </div>
          <Timeline
            controls={filteredControls}
            periodDays={filters.periodDays}
            periodStart={filters.periodStart}
            periodEnd={filters.periodEnd}
            onControlClick={handleControlClick}
          />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          onDoubleClick={handleResizeReset}
          style={styles.resizeHandle}
          title="Glisser pour redimensionner \u2014 double-clic pour r\u00e9initialiser"
        >
          <div style={styles.resizeBar} />
        </div>

        {/* Kanban — full width */}
        <div style={styles.kanbanWrapper}>
          <WorkspaceKanban
            controls={filteredControls}
            onControlClick={handleControlClick}
          />
        </div>
      </div>

      {/* FAB with expandable bubbles */}
      <WorkspaceFab
        todos={todos}
        memberId={member.id}
        teamMessages={team_messages}
        currentMemberId={member.id}
        allMembers={all_members}
      />

      {/* Control detail modal */}
      <ControlModal
        control={selectedControl}
        members={all_members}
        onClose={handleCloseModal}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatBadge({ label, value, accent }) {
  return (
    <div style={styles.statBadge}>
      <span style={{ ...styles.statValue, color: accent || colors.text }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "12px 16px",
    gap: 12,
    overflow: "hidden",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    boxShadow: shadows.card,
    flexShrink: 0,
    gap: 16,
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.outfit,
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  memberText: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  memberName: {
    fontFamily: fonts.outfit,
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
  },
  memberRole: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text3,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  statBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
    padding: "4px 12px",
    backgroundColor: colors.s2,
    borderRadius: radii.card,
    minWidth: 60,
  },
  statValue: {
    fontFamily: fonts.dmMono,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  statLabel: {
    fontFamily: fonts.outfit,
    fontSize: 9,
    fontWeight: 600,
    color: colors.text3,
    textTransform: "uppercase",
    letterSpacing: ".4px",
  },
  chargeWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  chargeTrack: {
    width: 100,
    height: 5,
    backgroundColor: colors.s3,
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
    color: colors.text2,
    minWidth: 28,
    textAlign: "right",
  },

  // Main zone
  mainZone: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    overflow: "hidden",
    minHeight: 0,
  },

  // Timeline panel
  timelinePanel: {
    flex: "0 0 auto",
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    overflow: "hidden",
    minHeight: 100,
    maxHeight: "70%",
  },

  // Resize handle
  resizeHandle: {
    height: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "row-resize",
    flexShrink: 0,
    userSelect: "none",
  },
  resizeBar: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  // Kanban wrapper
  kanbanWrapper: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    minHeight: 120,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },
  panelTitle: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".6px",
    color: colors.text2,
  },
  panelCount: {
    fontFamily: fonts.dmMono,
    fontSize: 11,
    color: colors.text3,
  },
};
