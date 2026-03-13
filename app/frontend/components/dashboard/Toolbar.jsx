import { useState, useRef } from "react";
import { colors, fonts, radii } from "../../styles/tokens";
import { useTranslation } from "../../lib/useTranslation";

// ---------------------------------------------------------------------------
// Domain config
// ---------------------------------------------------------------------------

const DOMAIN_COLORS = {
  finance: "#2563eb",
  it: "#7c3aed",
  rh: "#0891b2",
  achats: "#d97706",
  logistique: "#db2777",
  juridique: "#059669",
};

const DOMAINS = ["finance", "it", "rh", "achats", "logistique", "juridique"];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        backgroundColor: colors.border,
        flexShrink: 0,
      }}
    />
  );
}

function NavButton({ label, ariaLabel, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.navBtn,
        backgroundColor: hovered ? colors.s3 : colors.s2,
      }}
    >
      {label}
    </button>
  );
}

function Chip({ label, active, activeBackground, activeBorder, onClick }) {
  const [hovered, setHovered] = useState(false);

  const bg = active ? activeBackground : colors.s1;
  const fg = active ? "#fff" : colors.text2;
  const bc = active ? (activeBorder || activeBackground) : colors.border;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.chip,
        backgroundColor: bg,
        color: fg,
        borderColor: bc,
        opacity: hovered && !active ? 0.8 : 1,
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

/**
 * Toolbar — barre d'outils du dashboard.
 *
 * Composant purement de présentation. Toute la logique vient du hook useFilters.
 */
export default function Toolbar({
  periodMode,
  setPeriodMode,
  periodLabel,
  prev,
  next,
  goToToday,
  setCustomRange,
  activeDomains,
  toggleDomain,
  criticalOnly,
  toggleCriticalOnly,
  overdueOnly,
  toggleOverdueOnly,
  searchQuery,
  setSearchQuery,
  hasActiveFilters,
  resetFilters,
}) {
  const { t } = useTranslation();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // Dynamic period modes (built inside component so t() is available)
  const periodModes = [
    { key: "week", label: t("dashboard.toolbar.week") },
    { key: "month", label: t("dashboard.toolbar.month") },
    { key: "quarter", label: t("dashboard.toolbar.quarter") },
  ];

  // Dynamic domain labels
  const domainLabels = {
    finance: t("domains.finance"),
    it: t("domains.it"),
    rh: t("domains.rh"),
    achats: t("domains.achats"),
    logistique: t("domains.logistique"),
    juridique: t("domains.juridique"),
  };

  // Custom date picker state
  const [customOpen, setCustomOpen] = useState(false);
  const [customStartInput, setCustomStartInput] = useState("");
  const [customEndInput, setCustomEndInput] = useState("");

  const handleToggleCustom = () => {
    if (periodMode === "custom" && customOpen) {
      // Already in custom mode and open — just close the form
      setCustomOpen(false);
    } else {
      setCustomOpen((v) => !v);
    }
  };

  const handleApplyCustom = () => {
    if (!customStartInput || !customEndInput) return;
    const [sy, sm, sd] = customStartInput.split("-").map(Number);
    const [ey, em, ed] = customEndInput.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    if (start > end) return; // invalid range
    setCustomRange(start, end);
    setCustomOpen(false);
  };

  return (
    <div style={styles.bar}>
      {/* ---- 1. Sélecteur de période ---- */}
      <div style={styles.section}>
        <NavButton label="‹" ariaLabel={t("dashboard.toolbar.previous")} onClick={prev} />

        <span style={styles.periodLabel}>{periodLabel}</span>

        <NavButton label="›" ariaLabel={t("dashboard.toolbar.next")} onClick={next} />

        {periodModes.map(({ key, label }) => (
          <Chip
            key={key}
            label={label}
            active={periodMode === key}
            activeBackground={colors.text}
            activeBorder={colors.text}
            onClick={() => setPeriodMode(key)}
          />
        ))}

        <Chip
          label={t("dashboard.toolbar.custom")}
          active={periodMode === "custom"}
          activeBackground={colors.accent}
          activeBorder={colors.accent}
          onClick={handleToggleCustom}
        />

        {customOpen && (
          <div style={styles.customRangeForm}>
            <label style={styles.customLabel}>
              {t("common.from")}
              <input
                type="date"
                value={customStartInput}
                onChange={(e) => setCustomStartInput(e.target.value)}
                style={styles.customDateInput}
              />
            </label>
            <label style={styles.customLabel}>
              {t("common.to")}
              <input
                type="date"
                value={customEndInput}
                onChange={(e) => setCustomEndInput(e.target.value)}
                style={styles.customDateInput}
              />
            </label>
            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={!customStartInput || !customEndInput}
              style={{
                ...styles.applyBtn,
                opacity: !customStartInput || !customEndInput ? 0.5 : 1,
              }}
            >
              {t("common.apply")}
            </button>
          </div>
        )}

        <button type="button" onClick={goToToday} style={styles.todayBtn}>
          {t("common.today")}
        </button>
      </div>

      <Divider />

      {/* ---- 2. Filtres domaines ---- */}
      <div style={styles.sectionWrap}>
        {DOMAINS.map((domain) => {
          const isActive = activeDomains.has(domain);
          return (
            <Chip
              key={domain}
              label={domainLabels[domain]}
              active={isActive}
              activeBackground={DOMAIN_COLORS[domain]}
              activeBorder={DOMAIN_COLORS[domain]}
              onClick={() => toggleDomain(domain)}
            />
          );
        })}
      </div>

      <Divider />

      {/* ---- 3. Filtres spéciaux ---- */}
      <div style={styles.section}>
        <Chip
          label={t("criticality.critical")}
          active={criticalOnly}
          activeBackground={colors.critical}
          activeBorder={colors.critical}
          onClick={toggleCriticalOnly}
        />
        <Chip
          label={t("dashboard.kpi.overdue")}
          active={overdueOnly}
          activeBackground={colors.critical}
          activeBorder={colors.critical}
          onClick={toggleOverdueOnly}
        />
      </div>

      <Divider />

      {/* ---- 4. Recherche ---- */}
      <input
        ref={searchRef}
        type="text"
        placeholder={t("common.search")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
        style={{
          ...styles.search,
          borderColor: searchFocused ? colors.border2 : colors.border,
        }}
      />

      {/* ---- 5. Reset ---- */}
      {hasActiveFilters && (
        <button type="button" onClick={resetFilters} style={styles.resetBtn}>
          ✕ {t("common.reset")}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  bar: {
    minHeight: 42,
    height: "auto",
    flexShrink: 0,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
    borderRadius: radii.card, // 7px
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    overflow: "hidden",
  },

  section: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },

  sectionWrap: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },

  // --- Nav arrows ---
  navBtn: {
    width: 26,
    height: 26,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${colors.border}`,
    borderRadius: 5,
    color: colors.text2,
    backgroundColor: colors.s2,
    cursor: "pointer",
    fontFamily: fonts.outfit,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1,
    padding: 0,
    transition: "background-color .12s",
  },

  // --- Period label ---
  periodLabel: {
    fontFamily: fonts.outfit,
    fontWeight: 600,
    fontSize: 13,
    color: colors.text,
    minWidth: 160,
    textAlign: "center",
    whiteSpace: "nowrap",
  },

  // --- Chip (shared) ---
  chip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3px 9px",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: fonts.outfit,
    lineHeight: 1.4,
    borderRadius: 20,
    border: "1px solid",
    cursor: "pointer",
    transition: "all .12s",
    whiteSpace: "nowrap",
    outline: "none",
    background: "none", // overridden inline
  },

  // --- Today button ---
  todayBtn: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    color: colors.text2,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 6px",
    whiteSpace: "nowrap",
    transition: "color .12s",
  },

  // --- Search input ---
  search: {
    width: 180,
    fontSize: 12,
    fontFamily: fonts.outfit,
    padding: "5px 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: 5,
    backgroundColor: colors.s2,
    color: colors.text,
    outline: "none",
    transition: "border-color .12s",
    flexShrink: 0,
  },

  // --- Reset button ---
  resetBtn: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    color: colors.text3,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 4px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "color .12s",
  },

  // --- Custom date range form ---
  customRangeForm: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },

  customLabel: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text2,
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  },

  customDateInput: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    padding: "3px 6px",
    border: `1px solid ${colors.border}`,
    borderRadius: 5,
    backgroundColor: colors.s2,
    color: colors.text,
    outline: "none",
    cursor: "pointer",
  },

  applyBtn: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: 5,
    padding: "4px 10px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "opacity .12s",
  },
};
