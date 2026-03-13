import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { colors, fonts, radii, shadows } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMAIL_COLOR = "#dc2626";

const PERIOD_OPTIONS = [
  { value: "week",    label: "Semaine" },
  { value: "month",   label: "Mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "custom",  label: "Personnalisé" },
];

const TEMPLATE_OPTIONS = [
  { value: "formal",     label: "Formel" },
  { value: "synthetic",  label: "Synthétique" },
  { value: "detailed",   label: "Détaillé" },
];

const ACCENT_COLORS = [
  { value: "#dc2626", label: "Rouge" },
  { value: "#2563eb", label: "Bleu" },
  { value: "#059669", label: "Vert" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#d97706", label: "Orange" },
  { value: "#0891b2", label: "Cyan" },
];

const CONTENT_OPTIONS = [
  { key: "kpis",       label: "Résumé des KPIs (complétés, en cours, en retard)", defaultChecked: true },
  { key: "domains",    label: "Détail par domaine",                                defaultChecked: true },
  { key: "overdue",    label: "Liste des contrôles en retard",                     defaultChecked: true },
  { key: "signals",    label: "Signaux IA",                                        defaultChecked: true },
  { key: "chart",      label: "Graphique de progression",                           defaultChecked: true },
  { key: "byMember",   label: "Détail par membre",                                 defaultChecked: false },
];

const DOMAIN_LABELS = {
  finance:    "Finance",
  it:         "IT",
  rh:         "RH",
  achats:     "Achats",
  logistique: "Logistique",
  juridique:  "Juridique",
};

const DOMAIN_COLORS = {
  finance:    "#2563eb",
  it:         "#7c3aed",
  rh:         "#0891b2",
  achats:     "#d97706",
  logistique: "#db2777",
  juridique:  "#059669",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function periodLabel(period, startDate, endDate) {
  switch (period) {
    case "week":    return "Semaine en cours";
    case "month":   return "Mois en cours";
    case "quarter": return "Trimestre en cours";
    case "custom":
      return startDate && endDate
        ? `${formatDate(startDate)} – ${formatDate(endDate)}`
        : "Période personnalisée";
    default: return "";
  }
}

function computePeriodDates(period) {
  const now = new Date();
  let start, end;
  if (period === "week") {
    const day = now.getDay(); // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day);
    start = new Date(now); start.setDate(now.getDate() + diff);
    end   = new Date(start); end.setDate(start.getDate() + 6);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), q * 3, 1);
    end   = new Date(now.getFullYear(), q * 3 + 3, 0);
  } else {
    return null;
  }
  return {
    start: start.toISOString().split("T")[0],
    end:   end.toISOString().split("T")[0],
  };
}

// Derive domain stats from controls list
function domainStats(controls) {
  const map = {};
  controls.forEach((c) => {
    const d = c.domain || "other";
    if (!map[d]) map[d] = { total: 0, done: 0 };
    map[d].total++;
    if (c.status === "done") map[d].done++;
  });
  return Object.entries(map)
    .map(([domain, { total, done }]) => ({
      domain,
      total,
      done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// EmailChip component
// ---------------------------------------------------------------------------

function EmailChip({ email, accentColor, onRemove }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        backgroundColor: `${accentColor}15`,
        border: `1px solid ${accentColor}40`,
        borderRadius: 20,
        padding: "3px 8px 3px 10px",
        fontFamily: fonts.outfit,
        fontSize: 12,
        color: accentColor,
        fontWeight: 500,
        maxWidth: 200,
        overflow: "hidden",
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {email}
      </span>
      <button
        type="button"
        onClick={() => onRemove(email)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color: hovered ? accentColor : `${accentColor}80`,
          fontSize: 14,
          lineHeight: 1,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          transition: "color 0.1s ease",
        }}
        aria-label={`Supprimer ${email}`}
      >
        &times;
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// CustomCheckbox component
// ---------------------------------------------------------------------------

function CustomCheckbox({ checked, onChange, accentColor }) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(); } }}
      style={{
        width: 16,
        height: 16,
        minWidth: 16,
        borderRadius: 4,
        border: `1.5px solid ${checked ? accentColor : colors.border2}`,
        backgroundColor: checked ? accentColor : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background-color 0.15s ease, border-color 0.15s ease",
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionLabel component
// ---------------------------------------------------------------------------

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: fonts.outfit,
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.6px",
        color: colors.text3,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmailPreview component
// ---------------------------------------------------------------------------

function EmailPreview({ config, controls, members }) {
  const {
    subject,
    period,
    startDate,
    endDate,
    content,
    template,
    accentColor,
    recipients,
  } = config;

  const done    = controls.filter((c) => c.status === "done");
  const pending = controls.filter((c) => c.status === "pending");
  const overdue = controls.filter((c) => c.status === "overdue");
  const successRate = done.length > 0
    ? Math.round(done.reduce((sum, c) => sum + (c.pass_rate || 0), 0) / done.length)
    : 0;

  const domains = useMemo(() => domainStats(controls), [controls]);

  const overdueControls = useMemo(
    () => controls.filter((c) => c.status === "overdue").slice(0, 8),
    [controls],
  );

  const periodStr = periodLabel(period, startDate, endDate);
  const today = formatDate(todayISO());

  // Helper: mini bar chart in email
  const ProgressBar = ({ pct, color }) => (
    <div style={{ height: 6, backgroundColor: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(pct, 100)}%`,
          backgroundColor: color || accentColor,
          borderRadius: 3,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        color: "#1a1a2e",
        lineHeight: 1.6,
        maxWidth: 620,
        margin: "0 auto",
      }}
    >
      {/* Email Header */}
      <div
        style={{
          backgroundColor: accentColor,
          padding: "24px 32px",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                fontFamily: "Arial, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.01em",
              }}
            >
              Verisure
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
              Plateforme de conformité
            </div>
          </div>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            {periodStr || "Rapport"}
          </div>
        </div>
      </div>

      {/* Subject bar */}
      <div
        style={{
          backgroundColor: "#f8f9ff",
          borderLeft: `4px solid ${accentColor}`,
          padding: "14px 32px",
          borderBottom: "1px solid #e8e8ee",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "#16213a" }}>
          {subject || "Rapport de conformité"}
        </div>
        {recipients.length > 0 && (
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            À : {recipients.join(", ")}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ backgroundColor: "#ffffff", padding: "24px 32px" }}>

        {/* Intro */}
        <p style={{ fontSize: 14, color: "#555", marginTop: 0, marginBottom: 24 }}>
          Bonjour,<br />
          Veuillez trouver ci-dessous le rapport de conformité de votre équipe pour la période :{" "}
          <strong style={{ color: "#16213a" }}>{periodStr || "—"}</strong>.
        </p>

        {/* KPI Cards */}
        {content.kpis && (
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                color: "#888",
                marginBottom: 14,
              }}
            >
              Résumé des KPIs
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Complétés",   value: done.length,    color: "#059669" },
                { label: "En cours",    value: pending.length, color: accentColor },
                { label: "En retard",   value: overdue.length, color: "#dc2626" },
                { label: "Taux succès", value: `${successRate}%`, color: "#b58a00" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "16px 8px",
                    backgroundColor: "#f8f9ff",
                    borderRadius: 8,
                    border: "1px solid #e8e8ee",
                  }}
                >
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: kpi.color,
                      lineHeight: 1.1,
                      fontFamily: '"Courier New", monospace',
                    }}
                  >
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 5, fontWeight: 600 }}>
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progression chart */}
        {content.chart && controls.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                color: "#888",
                marginBottom: 14,
              }}
            >
              Graphique de progression
            </div>
            <div
              style={{
                backgroundColor: "#f8f9ff",
                borderRadius: 8,
                border: "1px solid #e8e8ee",
                padding: "16px 20px",
              }}
            >
              {/* Simple bar chart representation */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
                {[
                  { label: "Fait",     pct: controls.length > 0 ? Math.round((done.length / controls.length) * 100) : 0,    color: "#059669" },
                  { label: "En cours", pct: controls.length > 0 ? Math.round((pending.length / controls.length) * 100) : 0, color: accentColor },
                  { label: "Retard",   pct: controls.length > 0 ? Math.round((overdue.length / controls.length) * 100) : 0, color: "#dc2626" },
                ].map((bar) => (
                  <div
                    key={bar.label}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: bar.color }}>{bar.pct}%</div>
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max(bar.pct * 0.5, 4)}px`,
                        backgroundColor: bar.color,
                        borderRadius: "4px 4px 0 0",
                        opacity: 0.85,
                      }}
                    />
                    <div style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>{bar.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: "#aaa", textAlign: "right" }}>
                Total : {controls.length} contrôle{controls.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        )}

        {/* Domains */}
        {content.domains && domains.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                color: "#888",
                marginBottom: 14,
              }}
            >
              Détail par domaine
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {domains.map(({ domain, total, done: d, pct }) => {
                const domainColor = DOMAIN_COLORS[domain] || accentColor;
                return (
                  <div key={domain}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#16213a" }}>
                        {DOMAIN_LABELS[domain] || domain}
                      </span>
                      <span style={{ fontSize: 12, color: "#888" }}>
                        {d}/{total} — {pct}%
                      </span>
                    </div>
                    <ProgressBar pct={pct} color={domainColor} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overdue table */}
        {content.overdue && overdueControls.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                color: "#888",
                marginBottom: 14,
              }}
            >
              Contrôles en retard ({overdueControls.length})
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9ff" }}>
                  {["Contrôle", "Domaine", "Échéance"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#888",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        borderBottom: "1px solid #e8e8ee",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overdueControls.map((c, i) => (
                  <tr
                    key={c.id || i}
                    style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}
                  >
                    <td style={{ padding: "9px 12px", color: "#16213a", fontWeight: 500 }}>
                      {c.name || c.title || `Contrôle #${c.id}`}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: `${DOMAIN_COLORS[c.domain] || "#888"}20`,
                          color: DOMAIN_COLORS[c.domain] || "#888",
                          borderRadius: 4,
                          padding: "2px 7px",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {DOMAIN_LABELS[c.domain] || c.domain || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", color: "#dc2626", fontSize: 12, fontWeight: 600 }}>
                      {c.due_date ? formatDate(c.due_date) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* AI Signals */}
        {content.signals && (
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                color: "#888",
                marginBottom: 14,
              }}
            >
              Signaux IA
            </div>
            <div
              style={{
                backgroundColor: "#faf5ff",
                border: "1px solid #e9d5ff",
                borderLeft: "4px solid #7c3aed",
                borderRadius: 8,
                padding: "14px 16px",
                fontSize: 13,
                color: "#4c1d95",
                lineHeight: 1.6,
              }}
            >
              {overdue.length > 0 ? (
                <>
                  <strong>⚠ {overdue.length} contrôle{overdue.length > 1 ? "s" : ""} en retard</strong> détecté{overdue.length > 1 ? "s" : ""} par l'IA.{" "}
                  Une attention particulière est recommandée sur les domaines :{" "}
                  {[...new Set(overdue.map((c) => DOMAIN_LABELS[c.domain] || c.domain).filter(Boolean))].join(", ") || "non identifiés"}.
                </>
              ) : done.length > 0 ? (
                <>
                  <strong>✓ Bonne conformité</strong> — Tous les contrôles planifiés sont à jour.
                  Taux de succès global : <strong>{successRate}%</strong>.
                </>
              ) : (
                "Aucun signal IA disponible pour cette période."
              )}
            </div>
          </div>
        )}

        {/* By member */}
        {content.byMember && members.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                color: "#888",
                marginBottom: 14,
              }}
            >
              Détail par membre
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {members.slice(0, 6).map((m) => {
                const memberControls = controls.filter((c) => c.member_id === m.id || c.assigned_to === m.id);
                const memberDone = memberControls.filter((c) => c.status === "done").length;
                const memberTotal = memberControls.length;
                const memberPct = memberTotal > 0 ? Math.round((memberDone / memberTotal) * 100) : 0;
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      backgroundColor: "#f8f9ff",
                      borderRadius: 8,
                      border: "1px solid #e8e8ee",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: m.color || accentColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {m.initials || (m.name ? m.name.slice(0, 2).toUpperCase() : "?")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#16213a" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>
                        {memberDone}/{memberTotal} contrôles
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: memberPct >= 80 ? "#059669" : memberPct >= 50 ? accentColor : "#dc2626" }}>
                        {memberPct}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: "#f8f9ff",
          borderTop: "1px solid #e8e8ee",
          padding: "16px 32px",
          borderRadius: "0 0 8px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, color: "#aaa" }}>
          Rapport généré le {today}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: accentColor,
            letterSpacing: "0.5px",
          }}
        >
          Verisure — Conformité
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main EmailModal component
// ---------------------------------------------------------------------------

export default function EmailModal() {
  // Data
  const [controls, setControls] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recipients
  const [recipients, setRecipients] = useState([]);
  const [recipientInput, setRecipientInput] = useState("");
  const recipientInputRef = useRef(null);

  // Subject
  const [subject, setSubject] = useState(
    `Rapport de conformité — ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`,
  );

  // Period
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Content checkboxes
  const [content, setContent] = useState(
    Object.fromEntries(CONTENT_OPTIONS.map((o) => [o.key, o.defaultChecked])),
  );

  // Style
  const [template, setTemplate] = useState("formal");
  const [accentColor, setAccentColor] = useState(EMAIL_COLOR);

  // UI
  const [copied, setCopied] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch data on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [controlsRes, membersRes] = await Promise.all([
          fetch("/api/controls", { headers: { Accept: "application/json" } }),
          fetch("/api/members",  { headers: { Accept: "application/json" } }),
        ]);
        const controlsData = controlsRes.ok ? await controlsRes.json() : [];
        const membersData  = membersRes.ok  ? await membersRes.json()  : [];
        if (!cancelled) {
          setControls(Array.isArray(controlsData) ? controlsData : []);
          setMembers(Array.isArray(membersData) ? membersData : []);
        }
      } catch {
        // Silently degrade
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------------------------------
  // Period date auto-fill
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (period !== "custom") {
      const dates = computePeriodDates(period);
      if (dates) { setStartDate(dates.start); setEndDate(dates.end); }
    }
  }, [period]);

  // ---------------------------------------------------------------------------
  // Recipients logic
  // ---------------------------------------------------------------------------

  const addRecipient = useCallback((email) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || recipients.includes(trimmed)) return;
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    setRecipients((prev) => [...prev, trimmed]);
  }, [recipients]);

  const removeRecipient = useCallback((email) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
  }, []);

  const handleRecipientKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRecipient(recipientInput);
      setRecipientInput("");
    } else if (e.key === "Backspace" && !recipientInput && recipients.length > 0) {
      setRecipients((prev) => prev.slice(0, -1));
    }
  }, [recipientInput, recipients, addRecipient]);

  const handleAddAllMembers = useCallback(() => {
    members.forEach((m) => {
      if (m.email) addRecipient(m.email);
    });
  }, [members, addRecipient]);

  // ---------------------------------------------------------------------------
  // Content checkbox toggle
  // ---------------------------------------------------------------------------

  const toggleContent = useCallback((key) => {
    setContent((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ---------------------------------------------------------------------------
  // Copy HTML
  // ---------------------------------------------------------------------------

  const handleCopyHtml = useCallback(() => {
    const previewEl = document.getElementById("email-preview-body");
    if (!previewEl) return;
    const html = `<!DOCTYPE html><html><body>${previewEl.innerHTML}</body></html>`;
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, []);

  // ---------------------------------------------------------------------------
  // Assembled config for preview
  // ---------------------------------------------------------------------------

  const previewConfig = useMemo(() => ({
    subject,
    period,
    startDate,
    endDate,
    content,
    template,
    accentColor,
    recipients,
  }), [subject, period, startDate, endDate, content, template, accentColor, recipients]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={styles.container}>
      {/* ============================================================
          LEFT PANEL — Configuration
      ============================================================ */}
      <div style={styles.leftPanel}>

        {/* 1. Destinataires */}
        <section style={styles.section}>
          <SectionLabel>Destinataires</SectionLabel>

          {/* Chips area */}
          <div
            style={styles.chipsArea}
            onClick={() => recipientInputRef.current?.focus()}
          >
            {recipients.map((email) => (
              <EmailChip
                key={email}
                email={email}
                accentColor={accentColor}
                onRemove={removeRecipient}
              />
            ))}
            <input
              ref={recipientInputRef}
              type="email"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyDown={handleRecipientKeyDown}
              onBlur={() => { if (recipientInput) { addRecipient(recipientInput); setRecipientInput(""); } }}
              placeholder={recipients.length === 0 ? "email@exemple.com, appuyer sur Entrée" : "Ajouter…"}
              style={styles.chipInput}
            />
          </div>

          {members.length > 0 && (
            <button
              type="button"
              onClick={handleAddAllMembers}
              style={{ ...styles.linkBtn, color: accentColor }}
            >
              + Ajouter tous les membres ({members.length})
            </button>
          )}
        </section>

        {/* 2. Objet */}
        <section style={styles.section}>
          <SectionLabel>Objet du mail</SectionLabel>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Rapport de conformité — [Date]"
            style={styles.textInput}
          />
        </section>

        {/* 3. Période */}
        <section style={styles.section}>
          <SectionLabel>Période du rapport</SectionLabel>
          <div style={styles.periodTabs}>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                style={{
                  ...styles.periodTab,
                  ...(period === opt.value ? { backgroundColor: accentColor, color: "#fff", borderColor: accentColor } : {}),
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {period === "custom" && (
            <div style={styles.dateRow}>
              <div style={styles.dateField}>
                <label style={styles.dateLabel}>Début</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.dateInput}
                />
              </div>
              <div style={styles.dateField}>
                <label style={styles.dateLabel}>Fin</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.dateInput}
                />
              </div>
            </div>
          )}

          {period !== "custom" && startDate && endDate && (
            <div style={styles.periodHint}>
              {formatDate(startDate)} – {formatDate(endDate)}
            </div>
          )}
        </section>

        {/* 4. Contenu */}
        <section style={styles.section}>
          <SectionLabel>Contenu à inclure</SectionLabel>
          <div style={styles.checkboxList}>
            {CONTENT_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                style={styles.checkboxRow}
                onClick={() => toggleContent(opt.key)}
              >
                <CustomCheckbox
                  checked={content[opt.key]}
                  onChange={() => toggleContent(opt.key)}
                  accentColor={accentColor}
                />
                <span style={styles.checkboxLabel}>{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* 5. Style */}
        <section style={styles.section}>
          <SectionLabel>Style du mail</SectionLabel>

          {/* Template selector */}
          <div style={{ marginBottom: 12 }}>
            <div style={styles.templateTabs}>
              {TEMPLATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTemplate(opt.value)}
                  style={{
                    ...styles.templateTab,
                    ...(template === opt.value ? { backgroundColor: colors.s3, color: colors.text, borderColor: colors.border2, fontWeight: 700 } : {}),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color circles */}
          <div style={styles.colorRow}>
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setAccentColor(c.value)}
                aria-label={`Couleur ${c.label}`}
                title={c.label}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  backgroundColor: c.value,
                  border: accentColor === c.value ? `3px solid ${colors.text}` : `2px solid transparent`,
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                  boxShadow: accentColor === c.value ? `0 0 0 1px ${colors.text}` : `0 1px 4px ${c.value}60`,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  outline: "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.18)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              />
            ))}
          </div>
        </section>

        {/* 6. Actions */}
        <section style={{ ...styles.section, borderBottom: "none", paddingBottom: 8 }}>
          <div style={styles.actionsCol}>
            {/* Copy HTML */}
            <button
              type="button"
              onClick={handleCopyHtml}
              style={styles.secondaryBtn}
            >
              {copied ? "✓ Copié !" : "Copier le HTML"}
            </button>

            {/* Send — disabled with tooltip */}
            <div style={{ position: "relative" }} className="send-btn-wrapper">
              <button
                type="button"
                disabled
                style={styles.sendBtn}
                title="Bientôt disponible"
              >
                Envoyer
              </button>
              <div style={styles.sendTooltip}>Bientôt disponible</div>
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================
          RIGHT PANEL — Preview
      ============================================================ */}
      <div style={styles.rightPanel}>
        <div style={styles.previewHeader}>
          <span style={styles.previewTitle}>Prévisualisation</span>
          {loading && (
            <span style={styles.previewLoading}>Chargement des données…</span>
          )}
          {!loading && controls.length === 0 && (
            <span style={styles.previewLoading}>Aucun contrôle disponible — aperçu fictif</span>
          )}
        </div>
        <div style={styles.previewBody}>
          <div id="email-preview-body" style={styles.previewInner}>
            <EmailPreview
              config={previewConfig}
              controls={controls}
              members={members}
            />
          </div>
        </div>
      </div>

      {/* Inline CSS for send tooltip */}
      <style>{`
        .send-btn-wrapper .email-send-tooltip {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .send-btn-wrapper:hover .email-send-tooltip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    display: "flex",
    flexDirection: "row",
    flex: 1,
    minHeight: 0,
    height: "100%",
  },

  // Left panel
  leftPanel: {
    width: "40%",
    minWidth: 220,
    maxWidth: 340,
    flexShrink: 0,
    backgroundColor: colors.s2,
    borderRight: `1px solid ${colors.border}`,
    overflowY: "auto",
    padding: "0 0 16px 0",
  },

  section: {
    padding: "16px 16px 14px",
    borderBottom: `1px solid ${colors.border}`,
  },

  // Recipients
  chipsArea: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
    alignItems: "center",
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    padding: "7px 10px",
    minHeight: 38,
    cursor: "text",
  },

  chipInput: {
    border: "none",
    outline: "none",
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    backgroundColor: "transparent",
    flex: 1,
    minWidth: 100,
    padding: 0,
    height: 22,
  },

  linkBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    padding: "5px 0 0",
    letterSpacing: "0.01em",
    display: "inline-block",
  },

  // Text input
  textInput: {
    width: "100%",
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    padding: "8px 11px",
    outline: "none",
    boxSizing: "border-box",
  },

  // Period tabs
  periodTabs: {
    display: "flex",
    gap: 4,
    flexWrap: "wrap",
    marginBottom: 8,
  },

  periodTab: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text2,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "5px 10px",
    cursor: "pointer",
    transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
  },

  dateRow: {
    display: "flex",
    gap: 10,
    marginTop: 8,
  },

  dateField: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  dateLabel: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    color: colors.text3,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },

  dateInput: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: "6px 8px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },

  periodHint: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text2,
    marginTop: 4,
    fontStyle: "italic",
  },

  // Checkboxes
  checkboxList: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    cursor: "pointer",
    userSelect: "none",
  },

  checkboxLabel: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text,
    lineHeight: 1.4,
    flex: 1,
  },

  // Template
  templateTabs: {
    display: "flex",
    gap: 4,
  },

  templateTab: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 500,
    color: colors.text2,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "5px 10px",
    cursor: "pointer",
    flex: 1,
    transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
  },

  // Color circles
  colorRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 4,
  },

  // Actions
  actionsCol: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  primaryBtn: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
    border: "none",
    borderRadius: radii.button,
    padding: "10px 16px",
    cursor: "pointer",
    width: "100%",
    letterSpacing: "0.02em",
    transition: "opacity 0.15s ease",
  },

  secondaryBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    color: colors.text2,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "8px 16px",
    cursor: "pointer",
    width: "100%",
    transition: "background-color 0.15s ease",
  },

  sendBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#059669",
    border: "none",
    borderRadius: radii.button,
    padding: "8px 16px",
    cursor: "not-allowed",
    width: "100%",
    opacity: 0.45,
    letterSpacing: "0.02em",
  },

  sendTooltip: {
    position: "absolute",
    bottom: "calc(100% + 6px)",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0,0,0,0.72)",
    color: "#fff",
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: "nowrap",
    padding: "4px 8px",
    borderRadius: 5,
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity 0.15s ease",
    zIndex: 10,
  },

  // Right panel
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#ffffff",
    minWidth: 0,
    overflow: "hidden",
  },

  previewHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 20px",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
    backgroundColor: colors.s2,
  },

  previewTitle: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: colors.text3,
  },

  previewLoading: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text3,
    fontStyle: "italic",
  },

  previewBody: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 20px",
    backgroundColor: "#e8eaf0",
  },

  previewInner: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    boxShadow: shadows.dropdown,
    overflow: "hidden",
  },
};
