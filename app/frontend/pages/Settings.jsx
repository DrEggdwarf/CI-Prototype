import { useState } from "react";
import { colors, fonts, radii } from "../styles/tokens";
import MembersTab from "../components/settings/MembersTab";
import ControlsTab from "../components/settings/ControlsTab";
import DomainsTab from "../components/settings/DomainsTab";

const TABS = [
  { key: "members", label: "Membres" },
  { key: "controls", label: "Controles" },
  { key: "domains", label: "Domaines" },
];

export default function Settings({ members: rawMembers, controls: rawControls, domains: rawDomains, todos: rawTodos }) {
  const members = Array.isArray(rawMembers) ? rawMembers : [];
  const controls = Array.isArray(rawControls) ? rawControls : [];
  const domains = Array.isArray(rawDomains) ? rawDomains : [];
  const todos = Array.isArray(rawTodos) ? rawTodos : [];
  const [activeTab, setActiveTab] = useState("members");

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Parametres</h1>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={styles.content}>
        {activeTab === "members" && <MembersTab members={members} todos={todos} />}
        {activeTab === "controls" && (
          <ControlsTab controls={controls} members={members} domains={domains} />
        )}
        {activeTab === "domains" && <DomainsTab domains={domains} />}
      </div>
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
    padding: "20px 24px",
    gap: 0,
    overflow: "hidden",
  },

  header: {
    flexShrink: 0,
    marginBottom: 16,
  },

  title: {
    fontFamily: fonts.outfit,
    fontSize: 20,
    fontWeight: 700,
    color: "var(--text)",
    margin: 0,
    lineHeight: 1.3,
  },

  tabBar: {
    display: "flex",
    gap: 8,
    flexShrink: 0,
    marginBottom: 20,
  },

  tab: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text3)",
    backgroundColor: "transparent",
    border: `1px solid var(--border)`,
    borderRadius: radii.pill,
    padding: "6px 16px",
    cursor: "pointer",
    lineHeight: 1.3,
    transition: "all .15s ease",
  },

  tabActive: {
    color: "#fff",
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },

  content: {
    flex: 1,
    overflow: "auto",
    minHeight: 0,
  },
};
