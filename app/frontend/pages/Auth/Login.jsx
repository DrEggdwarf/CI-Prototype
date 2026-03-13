import { useState, useEffect } from "react";
import { useForm, usePage } from "@inertiajs/react";
import { colors, fonts, radii, shadows } from "../../styles/tokens";
import { useTranslation } from "../../lib/useTranslation";

export default function Login() {
  const { errors: pageErrors } = usePage().props;
  const { t } = useTranslation();

  const { data, setData, post, processing, errors } = useForm({
    member: {
      email: "",
      password: "",
    },
  });

  // Merge Inertia redirect errors (from page props) with useForm errors
  const allErrors = { ...pageErrors, ...errors };

  // --- Animation d'entree ---
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // --- Focus states ---
  const [focusedField, setFocusedField] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    post("/members/sign_in");
  }

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.card,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>{t("nav.app_name") || "CI Dashboard"}</h1>
          <p style={styles.subtitle}>{t("auth.sign_in") || "Connexion"}</p>
        </div>

        {/* Global error (e.g. invalid credentials) */}
        {allErrors.base && (
          <div style={styles.globalError}>{allErrors.base}</div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div style={styles.fieldGroup}>
            <label htmlFor="login-email" style={styles.label}>
              {t("auth.email") || "Adresse email"}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={data.member.email}
              onChange={(e) => setData("member", { ...data.member, email: e.target.value })}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.input,
                ...(focusedField === "email" ? styles.inputFocus : {}),
                ...(allErrors.email ? styles.inputError : {}),
              }}
              placeholder="nom@entreprise.com"
            />
            {allErrors.email && (
              <span style={styles.error}>{allErrors.email}</span>
            )}
          </div>

          {/* Password */}
          <div style={styles.fieldGroup}>
            <label htmlFor="login-password" style={styles.label}>
              {t("auth.password") || "Mot de passe"}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={data.member.password}
              onChange={(e) => setData("member", { ...data.member, password: e.target.value })}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.input,
                ...(focusedField === "password" ? styles.inputFocus : {}),
                ...(allErrors.password ? styles.inputError : {}),
              }}
              placeholder="••••••••"
            />
            {allErrors.password && (
              <span style={styles.error}>{allErrors.password}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={processing}
            style={{
              ...styles.button,
              ...(processing ? styles.buttonDisabled : {}),
            }}
            onMouseEnter={(e) => {
              if (!processing) {
                e.currentTarget.style.backgroundColor = "#1d4ed8";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = processing
                ? colors.text3
                : colors.accent;
            }}
          >
            {processing ? (t("auth.signing_in") || "Connexion...") : (t("auth.submit") || "Se connecter")}
          </button>
        </form>
      </div>
    </div>
  );
}

// Prevent AppLayout wrapping — login is a standalone full-screen page
Login.layout = (page) => page;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    fontFamily: fonts.outfit,
    padding: 16,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.s1,
    borderRadius: 12,
    boxShadow: shadows.dropdown,
    padding: 32,
    transition: "opacity .4s ease, transform .4s ease",
  },

  header: {
    textAlign: "center",
    marginBottom: 28,
  },

  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: colors.text,
    fontFamily: fonts.outfit,
    letterSpacing: "-0.3px",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    fontWeight: 400,
    color: colors.text2,
    fontFamily: fonts.outfit,
  },

  globalError: {
    backgroundColor: "#fef2f2",
    border: `1px solid ${colors.critical}`,
    borderRadius: radii.button,
    padding: "10px 12px",
    marginBottom: 20,
    fontSize: 13,
    color: colors.critical,
    fontFamily: fonts.outfit,
    lineHeight: 1.4,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  label: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: ".5px",
    color: colors.text2,
    fontFamily: fonts.outfit,
  },

  input: {
    width: "100%",
    padding: 12,
    fontSize: 14,
    fontFamily: fonts.outfit,
    color: colors.text,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    outline: "none",
    transition: "border-color .2s ease, box-shadow .2s ease",
    boxSizing: "border-box",
  },

  inputFocus: {
    borderColor: colors.accent,
    boxShadow: `0 0 0 3px rgba(37, 99, 235, 0.12)`,
  },

  inputError: {
    borderColor: colors.critical,
  },

  error: {
    fontSize: 12,
    color: colors.critical,
    fontFamily: fonts.outfit,
    lineHeight: 1.3,
  },

  button: {
    width: "100%",
    padding: 12,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: fonts.outfit,
    color: "#ffffff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background-color .2s ease",
    marginTop: 4,
  },

  buttonDisabled: {
    backgroundColor: colors.text3,
    cursor: "not-allowed",
  },
};
