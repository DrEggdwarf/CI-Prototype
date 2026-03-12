import { useState, useEffect, useRef } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { colors, fonts, radii, shadows, zIndex } from "../../styles/tokens";

export default function Navbar() {
  const { url, props } = usePage();
  const member = props.current_member;
  const memberId = props.current_member_id;
  const locale = props.locale;
  const availableLocales = props.available_locales || ["fr", "en"];

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const NAV_LINKS = [
    { label: "Dashboard", href: "/" },
  ];

  function isActive(href) {
    if (href === "/") return url === "/";
    return url.startsWith(href);
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;

    function handleMouseDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [dropdownOpen]);

  function switchLocale(newLocale) {
    setDropdownOpen(false);
    router.get(window.location.pathname, { locale: newLocale }, { preserveScroll: true });
  }

  function handleLinkClick() {
    setDropdownOpen(false);
  }

  const initials = member?.initials || "??";
  const avatarColor = member?.color || colors.s3;
  const memberName = member?.name || "Membre";
  const memberRole = member?.role || "";

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Zone gauche : Logo */}
        <Link href="/" style={styles.logo}>
          CI Dashboard
        </Link>

        {/* Zone centre : Navigation links */}
        <div style={styles.links}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{
                ...styles.link,
                ...(isActive(href) ? styles.linkActive : {}),
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Zone droite : Avatar + Dropdown */}
        <div style={styles.profileWrapper} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{ ...styles.avatar, backgroundColor: avatarColor }}
            aria-label="Menu profil"
            aria-expanded={dropdownOpen}
          >
            {initials}
          </button>

          {/* Dropdown */}
          <div
            style={{
              ...styles.dropdown,
              ...(dropdownOpen ? styles.dropdownOpen : {}),
            }}
          >
            {/* Header : nom + role */}
            <div style={styles.dropdownHeader}>
              <div style={styles.dropdownName}>{memberName}</div>
              <div style={styles.dropdownRole}>{memberRole}</div>
            </div>

            <div style={styles.separator} />

            {/* Links */}
            <Link
              href={`/workspace/${memberId}`}
              style={styles.dropdownItem}
              onClick={handleLinkClick}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.s2)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Mon espace
            </Link>
            <Link
              href="/settings"
              style={styles.dropdownItem}
              onClick={handleLinkClick}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.s2)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Paramètres
            </Link>

            <div style={styles.separator} />

            {/* Locale switcher */}
            <div style={styles.localeSection}>
              <div style={styles.localeSectionLabel}>Langue</div>
              <div style={styles.localeButtons}>
                {availableLocales.map((l) => (
                  <button
                    key={l}
                    onClick={() => switchLocale(l)}
                    style={{
                      ...styles.localeBtn,
                      ...(l === locale ? styles.localeBtnActive : {}),
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.separator} />

            {/* Deconnexion (disabled) */}
            <button
              style={styles.logoutBtn}
              disabled
              title="Authentification non implémentée"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    height: 52,
    minHeight: 52,
    backgroundColor: colors.s1,
    borderBottom: `1px solid ${colors.border}`,
    boxShadow: shadows.header,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 1400,
    margin: "0 auto",
  },
  logo: {
    fontFamily: fonts.outfit,
    fontWeight: 700,
    fontSize: 15,
    color: colors.text,
    textDecoration: "none",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  links: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flex: 1,
  },
  link: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text2,
    textDecoration: "none",
    padding: "6px 12px",
    borderRadius: 6,
    transition: "color 0.15s, background 0.15s",
  },
  linkActive: {
    color: colors.accent,
    backgroundColor: "#eef2ff",
    fontWeight: 600,
  },
  profileWrapper: {
    position: "relative",
    flexShrink: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: fonts.outfit,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "none",
    outline: "none",
    transition: "opacity 0.15s",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    minWidth: 220,
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    boxShadow: shadows.dropdown,
    zIndex: zIndex.dropdown,
    opacity: 0,
    transform: "translateY(-4px)",
    pointerEvents: "none",
    transition: "opacity 0.18s ease, transform 0.18s ease",
    overflow: "hidden",
  },
  dropdownOpen: {
    opacity: 1,
    transform: "translateY(0)",
    pointerEvents: "auto",
  },
  dropdownHeader: {
    padding: "12px 16px 8px",
  },
  dropdownName: {
    fontFamily: fonts.outfit,
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.3,
  },
  dropdownRole: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 400,
    color: colors.text2,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    margin: "4px 0",
  },
  dropdownItem: {
    display: "block",
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text,
    textDecoration: "none",
    padding: "8px 16px",
    transition: "background 0.12s",
    cursor: "pointer",
  },
  localeSection: {
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  localeSectionLabel: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 500,
    color: colors.text2,
  },
  localeButtons: {
    display: "flex",
    gap: 4,
  },
  localeBtn: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: radii.pill,
    border: `1px solid ${colors.border}`,
    backgroundColor: "transparent",
    color: colors.text2,
    cursor: "pointer",
    transition: "all 0.15s",
    lineHeight: 1.5,
  },
  localeBtnActive: {
    backgroundColor: colors.accent,
    color: "#ffffff",
    borderColor: colors.accent,
  },
  logoutBtn: {
    display: "block",
    width: "100%",
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text3,
    backgroundColor: "transparent",
    border: "none",
    padding: "8px 16px",
    textAlign: "left",
    cursor: "not-allowed",
    opacity: 0.6,
  },
};
