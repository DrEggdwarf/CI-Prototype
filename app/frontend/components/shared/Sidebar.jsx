import { useState, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { colors, fonts, radii, shadows, zIndex } from "../../styles/tokens";

const COLLAPSED_WIDTH = 60;
const EXPANDED_WIDTH = 220;
const LS_KEY = "sidebar_collapsed";

function getInitialCollapsed() {
  try {
    return localStorage.getItem(LS_KEY) === "true";
  } catch {
    return false;
  }
}

export default function Sidebar() {
  const { url, props } = usePage();
  const member = props.current_member;
  const memberId = props.current_member_id;
  const isAdmin = props.is_admin;
  const locale = props.locale;
  const availableLocales = props.available_locales || ["fr", "en"];

  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [hoveredLogout, setHoveredLogout] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const initials = member?.initials || "??";
  const avatarColor = member?.color || colors.s3;
  const memberName = member?.name || "Membre";
  const memberRole = member?.role || "";

  const navLinks = [];
  if (isAdmin) {
    navLinks.push({ key: "dashboard", label: "Dashboard", href: "/", icon: "\u25EB" });
  }
  navLinks.push({
    key: "workspace",
    label: "Mon espace",
    href: `/workspace/${memberId}`,
    icon: "\u25A3",
  });
  if (isAdmin) {
    navLinks.push({ key: "settings", label: "Param\u00E8tres", href: "/settings", icon: "\u2699" });
  }

  function isActive(href) {
    if (href === "/") return url === "/";
    return url.startsWith(href);
  }

  function switchLocale(newLocale) {
    router.get(window.location.pathname, { locale: newLocale }, { preserveScroll: true });
  }

  function handleLogout() {
    router.delete("/members/sign_out");
  }

  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <aside
      style={{
        ...s.sidebar,
        width: sidebarWidth,
        minWidth: sidebarWidth,
      }}
    >
      {/* Header: Logo + collapse toggle */}
      <div style={s.header}>
        {!collapsed && (
          <Link href="/" style={s.logo}>
            CI Dashboard
          </Link>
        )}
        {collapsed && (
          <Link href="/" style={s.logoCollapsed}>
            CI
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={s.collapseBtn}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "\u25B7" : "\u25C1"}
        </button>
      </div>

      {/* Navigation links */}
      <nav style={s.nav}>
        {navLinks.map(({ key, label, href, icon }) => {
          const active = isActive(href);
          const hovered = hoveredLink === key;
          return (
            <div key={key} style={{ position: "relative" }}>
              <Link
                href={href}
                style={{
                  ...s.navLink,
                  ...(active ? s.navLinkActive : {}),
                  ...(hovered && !active ? s.navLinkHover : {}),
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px 0" : "10px 16px",
                }}
                onMouseEnter={() => setHoveredLink(key)}
                onMouseLeave={() => setHoveredLink(null)}
                title={collapsed ? label : undefined}
              >
                {active && <div style={s.activeBar} />}
                <span style={s.navIcon}>{icon}</span>
                {!collapsed && <span style={s.navLabel}>{label}</span>}
              </Link>
              {/* Tooltip when collapsed and hovered */}
              {collapsed && hovered && (
                <div style={s.tooltip}>{label}</div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Separator */}
      <div style={s.separator} />

      {/* Profile section */}
      <div style={s.profileSection}>
        {/* Avatar row */}
        <div
          style={{
            ...s.profileRow,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <div style={{ ...s.avatar, backgroundColor: avatarColor }}>
            {initials}
          </div>
          {!collapsed && (
            <div style={s.profileInfo}>
              <div style={s.profileName}>{memberName}</div>
              <div style={s.profileRole}>{memberRole}</div>
            </div>
          )}
        </div>

        {/* Locale switcher */}
        {!collapsed && (
          <div style={s.localeRow}>
            {availableLocales.map((l) => (
              <button
                key={l}
                onClick={() => switchLocale(l)}
                style={{
                  ...s.localeBtn,
                  ...(l === locale ? s.localeBtnActive : {}),
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            ...s.logoutBtn,
            justifyContent: collapsed ? "center" : "flex-start",
            ...(hoveredLogout ? s.logoutBtnHover : {}),
          }}
          onMouseEnter={() => setHoveredLogout(true)}
          onMouseLeave={() => setHoveredLogout(false)}
          title={collapsed ? "D\u00E9connexion" : undefined}
          aria-label="D\u00E9connexion"
        >
          <span style={s.logoutIcon}>{"\u21AA"}</span>
          {!collapsed && <span>D\u00E9connexion</span>}
        </button>
      </div>
    </aside>
  );
}

const s = {
  sidebar: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: colors.s1,
    borderRight: `1px solid ${colors.border}`,
    boxShadow: shadows.header,
    transition: "width 0.2s ease, min-width 0.2s ease",
    overflow: "hidden",
    flexShrink: 0,
    zIndex: zIndex.sticky,
    position: "relative",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 12px 12px",
    minHeight: 52,
  },
  logo: {
    fontFamily: fonts.outfit,
    fontWeight: 800,
    fontSize: 18,
    color: colors.text,
    textDecoration: "none",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  logoCollapsed: {
    fontFamily: fonts.outfit,
    fontWeight: 800,
    fontSize: 18,
    color: colors.text,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  collapseBtn: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.s1,
    color: colors.text2,
    fontSize: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background 0.15s",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "4px 8px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text2,
    textDecoration: "none",
    padding: "10px 16px",
    borderRadius: 6,
    transition: "background 0.15s, color 0.15s",
    position: "relative",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  navLinkActive: {
    backgroundColor: "#eef2ff",
    color: colors.accent,
    fontWeight: 600,
  },
  navLinkHover: {
    backgroundColor: colors.s2,
  },
  activeBar: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  navIcon: {
    fontSize: 16,
    lineHeight: 1,
    flexShrink: 0,
    width: 20,
    textAlign: "center",
  },
  navLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tooltip: {
    position: "absolute",
    left: "calc(100% + 8px)",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: colors.text,
    color: "#fff",
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 4,
    whiteSpace: "nowrap",
    zIndex: zIndex.dropdown,
    pointerEvents: "none",
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    margin: "0 12px",
  },
  profileSection: {
    padding: "12px 8px",
  },
  profileRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 8px",
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
    flexShrink: 0,
  },
  profileInfo: {
    overflow: "hidden",
    minWidth: 0,
  },
  profileName: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  profileRole: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 400,
    color: colors.text2,
    marginTop: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  localeRow: {
    display: "flex",
    gap: 4,
    padding: "8px 8px 4px",
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
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 500,
    color: colors.text2,
    backgroundColor: "transparent",
    border: "none",
    padding: "8px 8px",
    borderRadius: 6,
    textAlign: "left",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    marginTop: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  logoutBtnHover: {
    backgroundColor: colors.s2,
    color: colors.text,
  },
  logoutIcon: {
    fontSize: 16,
    lineHeight: 1,
    flexShrink: 0,
    width: 20,
    textAlign: "center",
  },
};
