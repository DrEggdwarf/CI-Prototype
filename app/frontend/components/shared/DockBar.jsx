import { useState, useRef, useCallback } from "react";
import { usePage } from "@inertiajs/react";
import { fonts } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Dock items definition — using PNG icons from /icons/
// ---------------------------------------------------------------------------

const DOCK_ITEMS = [
  { key: "chat",      label: "Chat",        icon: "/icons/chat.png" },
  { key: "ai",        label: "IA",          icon: "/icons/ai.png" },
  { key: "email",     label: "Email",       icon: "/icons/email.png" },
  { key: "documents", label: "Documents",   icon: "/icons/documents.png" },
  { key: "todo",      label: "Todo",        icon: "/icons/todo.png" },
  { key: "news",      label: "Actualité",   icon: "/icons/news.png" },
  { key: "settings",  label: "Paramètres",  icon: "/icons/settings.png", adminOnly: true },
  { key: "profile",   label: "Profil",      icon: "/icons/profile.png" },
];

// ---------------------------------------------------------------------------
// CSS — faithful copy-paste from codepen, adapted for our dock
// ---------------------------------------------------------------------------

const DOCK_CSS = `
/* Nav list — em-based sizing, font-size controls the scale */
.dock-nav-list {
  flex-flow: row;
  justify-content: center;
  align-items: flex-end;
  margin: 0;
  padding: 0;
  display: flex;
  list-style: none;
  font-size: 0.8vw;
}

/* Each nav item — width in em, transitions smoothly */
.dock-nav-item {
  justify-content: center;
  align-items: center;
  width: 5em;
  transition: width .5s cubic-bezier(.16, 1, .3, 1);
  display: flex;
  position: relative;
}

.dock-nav-item:hover,
.dock-nav-item:focus-within {
  width: 8em;
}

.dock-nav-item:has(+ :hover),
.dock-nav-item:hover + *,
.dock-nav-item:has(+ :focus-within),
.dock-nav-item:focus-within + * {
  width: 7em;
}

.dock-nav-item:has(+ * + :hover),
.dock-nav-item:hover + * + *,
.dock-nav-item:has(+ * + :focus-within),
.dock-nav-item:focus-within + * + * {
  width: 6em;
}

/* Link inside each item */
.dock-nav-item__link {
  z-index: 1;
  pointer-events: auto;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-left: .5em;
  padding-right: .5em;
  display: flex;
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
}

/* Icon image — scales with container */
.dock-nav-item__link .dock-image {
  object-fit: contain;
  width: 100%;
  pointer-events: none;
  border-radius: 22%;
}

/* Tooltip */
.dock-nav-item__tooltip {
  z-index: 0;
  background-color: rgba(0, 0, 0, 0.78);
  color: #ffffff;
  opacity: 0;
  white-space: nowrap;
  border-radius: .25em;
  padding: .4em .5em;
  font-size: 1em;
  font-family: ${fonts.outfit}, sans-serif;
  font-weight: 500;
  transition: transform .5s cubic-bezier(.16, 1, .3, 1), opacity .5s cubic-bezier(.16, 1, .3, 1);
  position: absolute;
  top: 0;
  transform: translate(0, -80%);
  pointer-events: none;
}

.dock-nav-item:hover .dock-nav-item__tooltip,
.dock-nav-item:focus-within .dock-nav-item__tooltip {
  opacity: 1;
  transform: translate(0px, -140%);
}

/* Notification badge */
.dock-badge {
  position: absolute;
  top: -.2em;
  right: .2em;
  min-width: 1.2em;
  height: 1.2em;
  background-color: #ef4444;
  color: #ffffff;
  border-radius: 9999px;
  font-family: ${fonts.outfit}, sans-serif;
  font-size: .7em;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 .25em;
  border: .15em solid #ffffff;
  line-height: 1;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  pointer-events: none;
}
`;

// ---------------------------------------------------------------------------
// DockBar — main component (structure matches codepen faithfully)
// ---------------------------------------------------------------------------

export default function DockBar({ onItemClick, unreadCount = 0 }) {
  const { props } = usePage();
  const isAdmin = props.is_admin ?? false;

  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const visibleItems = DOCK_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const handleMouseEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 120);
  }, []);

  return (
    <>
      <style>{DOCK_CSS}</style>

      {/* Invisible hover trigger zone — bottom of screen */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 70,
          zIndex: 490,
        }}
        aria-hidden="true"
      />

      {/* Peek bar — always visible hint */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 5,
          backgroundColor: "rgba(100, 116, 139, 0.35)",
          borderRadius: "5px 5px 0 0",
          zIndex: 489,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          opacity: open ? 0 : 1,
        }}
        aria-hidden="true"
      />

      {/* Nav wrap — matches codepen .nav-wrap */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          zIndex: 490,
          pointerEvents: "none",
          justifyContent: "center",
          alignItems: "flex-end",
          display: "flex",
          position: "fixed",
          bottom: 12,
          left: 0,
          right: 0,
          // Slide in/out
          transform: open ? "translateY(0)" : "translateY(calc(100% + 20px))",
          transition: "transform 0.35s cubic-bezier(.16, 1, .3, 1)",
        }}
        role="toolbar"
        aria-label="Navigation principale"
      >
        {/* Nav bar — transparent background, matches codepen .nav-bar */}
        <nav
          style={{
            pointerEvents: "auto",
            padding: "8px 4px 10px",
            borderRadius: 18,
            // Glassmorphism subtle
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Nav list — faithful to codepen */}
          <ul className="dock-nav-list">
            {visibleItems.map((item) => {
              const showBadge = item.key === "chat" && unreadCount > 0;
              const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

              return (
                <li key={item.key} className="dock-nav-item" tabIndex={-1}>
                  <button
                    className="dock-nav-item__link"
                    onClick={() => onItemClick(item.key)}
                    aria-label={item.label}
                  >
                    <img
                      src={item.icon}
                      loading="eager"
                      alt={`${item.label} icon`}
                      className="dock-image"
                      draggable={false}
                    />
                  </button>
                  <div className="dock-nav-item__tooltip">
                    <div>{item.label}</div>
                  </div>
                  {showBadge && (
                    <span className="dock-badge" aria-label={`${unreadCount} messages non lus`}>
                      {badgeLabel}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
