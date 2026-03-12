import { useState, useCallback, useRef, useMemo } from "react";
import { router } from "@inertiajs/react";
import { colors, fonts, radii } from "../styles/tokens";
import { useFilters } from "../lib/useFilters";
import { useToast } from "../lib/useToast";
import KpiBar from "../components/dashboard/KpiBar";
import Toolbar from "../components/dashboard/Toolbar";
import Timeline from "../components/dashboard/Timeline";
import Kanban from "../components/dashboard/Kanban";
import ControlModal from "../components/dashboard/ControlModal";

export default function Dashboard({ controls = [], members = [], signals = [], picks = [] }) {
  const filters = useFilters();
  const filteredControls = filters.filterControls(controls);
  const toast = useToast();

  // Modal state
  const [selectedControl, setSelectedControl] = useState(null);

  const handleControlClick = useCallback((control) => {
    setSelectedControl(control);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedControl(null);
  }, []);

  // Pre-compute workload per member for toast warnings
  const workloadByMember = useMemo(() => {
    const map = {};
    for (const m of members) map[m.id] = 0;
    for (const c of controls) {
      if (c.assignee_id && c.status !== "done" && map[c.assignee_id] != null) {
        map[c.assignee_id]++;
      }
    }
    return map;
  }, [controls, members]);

  // Drag & drop assign — PATCH API then reload Inertia props
  const handleAssign = useCallback((controlId, memberId) => {
    // Workload warning (> 80% = 8+ controls out of assumed max 10)
    const currentLoad = (workloadByMember[memberId] || 0) + 1;
    const loadPct = Math.round((currentLoad / 10) * 100);
    const member = members.find((m) => m.id === Number(memberId));

    fetch(`/api/controls/${controlId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ control: { assignee_id: memberId } }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Assign failed (${res.status})`);
        const memberName = member ? member.name : `#${memberId}`;
        toast.addToast(`Contrôle assigné à ${memberName}`, { type: "success" });
        if (loadPct > 80) {
          toast.addToast(
            `Attention : ${memberName} est à ${loadPct}% de charge`,
            { type: "warning", duration: 6000 },
          );
        }
        router.reload();
      })
      .catch((err) => {
        console.error("handleAssign error:", err);
        toast.addToast("Impossible d'assigner le contrôle", { type: "error" });
      });
  }, [workloadByMember, members, toast]);

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
      {/* Header KPIs */}
      <KpiBar controls={controls} signals={signals} />

      {/* Toolbar */}
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

      {/* Main zone — timeline + resize handle + kanban */}
      <div
        ref={mainZoneRef}
        style={{
          ...styles.mainZone,
          cursor: resizing ? "row-resize" : undefined,
          userSelect: resizing ? "none" : undefined,
        }}
      >
        {/* Timeline */}
        <div
          ref={panelRef}
          style={{
            ...styles.panel,
            ...(timelineHeight != null
              ? { flex: "0 0 auto", height: timelineHeight }
              : {}),
          }}
        >
          <div style={styles.panelHeader}>
            <span style={styles.sectionLabel}>Timeline</span>
            <span style={styles.panelCount}>
              {filteredControls.length} contrôles
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
          title="Glisser pour redimensionner — double-clic pour réinitialiser"
        >
          <div style={styles.resizeBar} />
        </div>

        {/* Kanban */}
        <div style={styles.kanbanWrapper}>
          <Kanban
            controls={filteredControls}
            members={members}
            signals={signals}
            picks={picks}
            onControlClick={handleControlClick}
            onAssign={handleAssign}
          />
        </div>
      </div>

      {/* Modal détail contrôle */}
      <ControlModal
        control={selectedControl}
        members={members}
        onClose={handleCloseModal}
      />
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
    padding: "16px 20px",
    gap: 12,
    overflow: "hidden",
  },

  mainZone: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    overflow: "hidden",
    minHeight: 0,
  },

  panel: {
    flex: "0 0 auto",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "var(--s1)",
    border: "1px solid var(--border)",
    borderRadius: radii.card,
    overflow: "hidden",
    minHeight: 100,
    maxHeight: "70%",
  },

  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    borderBottom: "1px solid var(--border)",
    flexShrink: 0,
  },

  sectionLabel: {
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

  kanbanWrapper: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    minHeight: 120,
  },
};
