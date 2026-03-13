import { useState, useEffect, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import { colors, fonts, radii } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle({ children }) {
  return <h3 style={styles.sectionTitle}>{children}</h3>;
}

function Field({ label, value }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <span style={styles.fieldValue}>{value || "\u2014"}</span>
    </div>
  );
}

function Avatar({ member, size = 72 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: member?.color || colors.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 4px 16px ${member?.color || colors.accent}44`,
      }}
    >
      <span
        style={{
          fontFamily: fonts.outfit,
          fontSize: Math.round(size * 0.38),
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {member?.initials || "?"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProfileModal() {
  const { props } = usePage();
  const currentMember = props.current_member || {};
  const currentLocale = props.locale || "fr";

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Format member since date
  const memberSince = currentMember.created_at
    ? new Date(currentMember.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "\u2014";

  // Fetch stats
  useEffect(() => {
    if (!currentMember.id) {
      setLoadingStats(false);
      return;
    }

    let cancelled = false;

    fetch(`/api/members/${currentMember.id}/stats`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentMember.id]);

  // Language switcher
  const handleLocaleChange = useCallback(
    (locale) => {
      if (locale === currentLocale) return;
      router.get(window.location.pathname, { locale });
    },
    [currentLocale],
  );

  return (
    <div style={styles.container}>
      {/* ---- Hero ---- */}
      <div style={styles.hero}>
        <Avatar member={currentMember} size={72} />
        <div style={styles.heroText}>
          <span style={styles.heroName}>{currentMember.name || "Membre"}</span>
          <span style={styles.heroRole}>{currentMember.role || "\u2014"}</span>
          <span style={styles.heroEmail}>{currentMember.email || "\u2014"}</span>
        </div>
      </div>

      <div style={styles.content}>
        {/* ---- Informations ---- */}
        <section style={styles.section}>
          <SectionTitle>Informations</SectionTitle>
          <div style={styles.fieldsGrid}>
            <Field label="Nom complet" value={currentMember.name} />
            <Field label="R\u00f4le" value={currentMember.role} />
            <Field label="Email" value={currentMember.email} />
            <Field label="Membre depuis" value={memberSince} />
          </div>
        </section>

        {/* ---- Pr\u00e9f\u00e9rences ---- */}
        <section style={styles.section}>
          <SectionTitle>Pr\u00e9f\u00e9rences</SectionTitle>
          <div style={styles.prefsRow}>
            <span style={styles.fieldLabel}>Langue de l\u2019interface</span>
            <div style={styles.localeButtons}>
              {[
                { code: "fr", label: "Fran\u00e7ais" },
                { code: "en", label: "English" },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLocaleChange(code)}
                  style={{
                    ...styles.localeBtn,
                    ...(currentLocale === code ? styles.localeBtnActive : {}),
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Statistiques ---- */}
        <section style={styles.section}>
          <SectionTitle>Statistiques</SectionTitle>
          {loadingStats ? (
            <p style={styles.loadingText}>Chargement&hellip;</p>
          ) : stats ? (
            <div style={styles.statsGrid}>
              <StatCard
                label="Contr\u00f4les assign\u00e9s"
                value={stats.assigned_controls ?? 0}
                color={colors.accent}
              />
              <StatCard
                label="Contr\u00f4les compl\u00e9t\u00e9s"
                value={stats.completed_controls ?? 0}
                color="#059669"
              />
              <StatCard
                label="En retard"
                value={stats.overdue_controls ?? 0}
                color={stats.overdue_controls > 0 ? colors.critical : colors.text3}
              />
              <StatCard
                label="T\u00e2ches actives"
                value={stats.active_todos ?? 0}
                color="#d97706"
              />
            </div>
          ) : (
            <p style={styles.loadingText}>Statistiques non disponibles</p>
          )}
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatCard sub-component
// ---------------------------------------------------------------------------

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
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
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  },

  // Hero
  hero: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "24px 32px",
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.s2,
    flexShrink: 0,
  },
  heroText: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  heroName: {
    fontFamily: fonts.outfit,
    fontSize: 22,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.2,
  },
  heroRole: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text2,
  },
  heroEmail: {
    fontFamily: fonts.dmMono,
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
    padding: "0 32px 32px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },

  // Section
  section: {
    paddingTop: 24,
    paddingBottom: 24,
    borderBottom: `1px solid ${colors.border}`,
  },
  sectionTitle: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    color: colors.text3,
    margin: "0 0 14px 0",
  },

  // Fields
  fieldsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 24px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "10px 12px",
    backgroundColor: colors.s2,
    borderRadius: radii.card,
    border: `1px solid ${colors.border}`,
  },
  fieldLabel: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    color: colors.text3,
  },
  fieldValue: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text,
  },

  // Preferences
  prefsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    backgroundColor: colors.s2,
    borderRadius: radii.card,
    border: `1px solid ${colors.border}`,
  },
  localeButtons: {
    display: "flex",
    gap: 6,
  },
  localeBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    color: colors.text2,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "5px 14px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  localeBtnActive: {
    backgroundColor: "#8b5cf6",
    color: "#ffffff",
    borderColor: "#8b5cf6",
  },

  // Stats
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "16px 12px",
    backgroundColor: colors.s2,
    borderRadius: radii.card,
    border: `1px solid ${colors.border}`,
    textAlign: "center",
  },
  statValue: {
    fontFamily: fonts.dmMono,
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.1,
  },
  statLabel: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    color: colors.text3,
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    lineHeight: 1.3,
  },

  loadingText: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text3,
    margin: 0,
  },
};
