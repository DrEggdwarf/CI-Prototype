import { useState, useRef } from "react";
import { colors, fonts, radii } from "../../styles/tokens";

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

const DOMAIN_LABELS = {
  finance: "Finance",
  it: "IT",
  rh: "RH",
  achats: "Achats",
  logistique: "Logistique",
  juridique: "Juridique",
};

const PERIOD_MODES = [
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "quarter", label: "Trimestre" },
];

const DOMAINS = Object.keys(DOMAIN_LABELS);

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

function NavButton({ label, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      aria-label={label === "‹" ? "Période précédente" : "Période suivante"}
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
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

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
        <NavButton label="‹" onClick={prev} />

        <span style={styles.periodLabel}>{periodLabel}</span>

        <NavButton label="›" onClick={next} />

        {PERIOD_MODES.map(({ key, label }) => (
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
          label="Personnalisé"
          active={periodMode === "custom"}
          activeBackground={colors.accent}
          activeBorder={colors.accent}
          onClick={handleToggleCustom}
        />

        {customOpen && (
          <div style={styles.customRangeForm}>
            <label style={styles.customLabel}>
              Du
              <input
                type="date"
                value={customStartInput}
                onChange={(e) => setCustomStartInput(e.target.value)}
                style={styles.customDateInput}
              />
            </label>
            <label style={styles.customLabel}>
              au
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
              Appliquer
            </button>
          </div>
        )}

        <button type="button" onClick={goToToday} style={styles.todayBtn}>
          Aujourd'hui
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
              label={DOMAIN_LABELS[domain]}
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
          label="Critique"
          active={criticalOnly}
          activeBackground={colors.critical}
          activeBorder={colors.critical}
          onClick={toggleCriticalOnly}
        />
        <Chip
          label="En retard"
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
        placeholder="Rechercher..."
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
          ✕ Réinitialiser
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
    height: 42,
    flexShrink: 0,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card, // 7px
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
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
