import { useState, useMemo, useCallback } from "react";

const ALL_DOMAINS = ["finance", "it", "rh", "achats", "logistique", "juridique"];

const MONTH_NAMES_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Format a Date as "12 mars" (French short date). */
function formatFrenchShort(d) {
  return `${d.getDate()} ${MONTH_NAMES_FR[d.getMonth()]}`;
}

// ---------------------------------------------------------------------------
// Date helpers (pure functions, no external deps)
// ---------------------------------------------------------------------------

/** Returns a new Date set to midnight local time for the given year/month/day. */
function dateOnly(year, month, day) {
  return new Date(year, month, day);
}

/** Monday of the week containing `d` (ISO week: Monday = first day). */
function startOfWeek(d) {
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  return dateOnly(d.getFullYear(), d.getMonth(), d.getDate() + diff);
}

/** Sunday of the week containing `d`. */
function endOfWeek(d) {
  const mon = startOfWeek(d);
  return dateOnly(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
}

/** First day of the month containing `d`. */
function startOfMonth(d) {
  return dateOnly(d.getFullYear(), d.getMonth(), 1);
}

/** Last day of the month containing `d`. */
function endOfMonth(d) {
  return dateOnly(d.getFullYear(), d.getMonth() + 1, 0);
}

/** First day of the quarter containing `d`. */
function startOfQuarter(d) {
  const qMonth = Math.floor(d.getMonth() / 3) * 3;
  return dateOnly(d.getFullYear(), qMonth, 1);
}

/** Last day of the quarter containing `d`. */
function endOfQuarter(d) {
  const qMonth = Math.floor(d.getMonth() / 3) * 3 + 2;
  return dateOnly(d.getFullYear(), qMonth + 1, 0);
}

/** Generate an inclusive array of Date objects from `start` to `end`. */
function dateRange(start, end) {
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** Shift `ref` by `delta` units according to `mode`. */
function shiftRef(ref, mode, delta) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const d = ref.getDate();

  switch (mode) {
    case "week":
      return dateOnly(y, m, d + delta * 7);
    case "month":
      return dateOnly(y, m + delta, 1);
    case "quarter":
      return dateOnly(y, m + delta * 3, 1);
    default:
      return ref;
  }
}

/** ISO week number (1-53) for a given date. */
function isoWeekNumber(d) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
}

/** Build a human-readable French label for the active period. */
function buildLabel(mode, start, end) {
  switch (mode) {
    case "week": {
      const weekNum = isoWeekNumber(start);
      const sDay = start.getDate();
      const eDay = end.getDate();
      const sMonth = MONTH_NAMES_FR[start.getMonth()];
      if (start.getMonth() === end.getMonth()) {
        return `Sem. ${weekNum} — ${sDay}-${eDay} ${sMonth}`;
      }
      const eMonth = MONTH_NAMES_FR[end.getMonth()];
      return `Sem. ${weekNum} — ${sDay} ${sMonth} - ${eDay} ${eMonth}`;
    }
    case "month": {
      const name = MONTH_NAMES_FR[start.getMonth()];
      return `${name.charAt(0).toUpperCase() + name.slice(1)} ${start.getFullYear()}`;
    }
    case "quarter": {
      const q = Math.floor(start.getMonth() / 3) + 1;
      return `T${q} ${start.getFullYear()}`;
    }
    case "custom": {
      return `${formatFrenchShort(start)} — ${formatFrenchShort(end)}`;
    }
    default:
      return "";
  }
}

/** Parse a "YYYY-MM-DD" string into a local-midnight Date. */
function parseISO(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFilters() {
  // --- Period state ---
  const [periodMode, setPeriodModeRaw] = useState("month");
  const [ref, setRef] = useState(() => new Date());

  // --- Custom date range state ---
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);

  // --- Filter state ---
  const [activeDomains, setActiveDomains] = useState(() => new Set(ALL_DOMAINS));
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Wrap setPeriodMode so switching away from custom clears custom dates
  const setPeriodMode = useCallback((mode) => {
    setPeriodModeRaw(mode);
  }, []);

  // Set a custom date range (switches to "custom" mode automatically)
  const setCustomRange = useCallback((start, end) => {
    setCustomStart(start);
    setCustomEnd(end);
    setPeriodModeRaw("custom");
  }, []);

  // --- Period computation ---
  const { periodStart, periodEnd, periodDays } = useMemo(() => {
    let start, end;
    if (periodMode === "custom" && customStart && customEnd) {
      start = customStart;
      end = customEnd;
    } else {
      switch (periodMode) {
        case "week":
          start = startOfWeek(ref);
          end = endOfWeek(ref);
          break;
        case "quarter":
          start = startOfQuarter(ref);
          end = endOfQuarter(ref);
          break;
        case "month":
        default:
          start = startOfMonth(ref);
          end = endOfMonth(ref);
          break;
      }
    }
    return { periodStart: start, periodEnd: end, periodDays: dateRange(start, end) };
  }, [periodMode, ref, customStart, customEnd]);

  const periodLabel = useMemo(
    () => buildLabel(periodMode, periodStart, periodEnd),
    [periodMode, periodStart, periodEnd],
  );

  // --- Navigation (disabled in custom mode) ---
  const prev = useCallback(() => {
    if (periodMode === "custom") return;
    setRef((r) => shiftRef(r, periodMode, -1));
  }, [periodMode]);
  const next = useCallback(() => {
    if (periodMode === "custom") return;
    setRef((r) => shiftRef(r, periodMode, 1));
  }, [periodMode]);
  const goToToday = useCallback(() => setRef(new Date()), []);

  // --- Domain toggle ---
  const toggleDomain = useCallback((domain) => {
    setActiveDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  }, []);

  // --- Boolean toggles ---
  const toggleCriticalOnly = useCallback(() => setCriticalOnly((v) => !v), []);
  const toggleOverdueOnly = useCallback(() => setOverdueOnly((v) => !v), []);

  // --- Active filters detection ---
  const hasActiveFilters = useMemo(() => {
    if (activeDomains.size !== ALL_DOMAINS.length) return true;
    if (criticalOnly) return true;
    if (overdueOnly) return true;
    if (searchQuery.trim() !== "") return true;
    return false;
  }, [activeDomains, criticalOnly, overdueOnly, searchQuery]);

  // --- Reset ---
  const resetFilters = useCallback(() => {
    setActiveDomains(new Set(ALL_DOMAINS));
    setCriticalOnly(false);
    setOverdueOnly(false);
    setSearchQuery("");
  }, []);

  // --- Filter function ---
  const filterControls = useCallback(
    (controls) => {
      return controls.filter((control) => {
        // 1. Period filter — due_date must be within [periodStart, periodEnd]
        if (control.due_date) {
          const due = parseISO(control.due_date);
          if (due < periodStart || due > periodEnd) return false;
        }

        // 2. Domain filter
        if (activeDomains.size < ALL_DOMAINS.length && control.domain) {
          if (!activeDomains.has(control.domain)) return false;
        }

        // 3. Critical only
        if (criticalOnly && control.criticality !== "critical") return false;

        // 4. Overdue only
        if (overdueOnly && control.status !== "overdue") return false;

        // 5. Search query
        if (searchQuery.trim() !== "") {
          const q = searchQuery.trim().toLowerCase();
          const name = (control.name || "").toLowerCase();
          if (!name.includes(q)) return false;
        }

        return true;
      });
    },
    [periodStart, periodEnd, activeDomains, criticalOnly, overdueOnly, searchQuery],
  );

  return {
    // Period
    periodMode,
    setPeriodMode,
    periodStart,
    periodEnd,
    periodDays,
    periodLabel,
    prev,
    next,
    goToToday,

    // Custom date range
    customStart,
    customEnd,
    setCustomRange,

    // Filters
    activeDomains,
    toggleDomain,
    criticalOnly,
    toggleCriticalOnly,
    overdueOnly,
    toggleOverdueOnly,
    searchQuery,
    setSearchQuery,

    // Application
    filterControls,
    hasActiveFilters,
    resetFilters,
  };
}
