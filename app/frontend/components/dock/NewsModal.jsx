import { useState, useEffect, useCallback, useMemo } from "react";
import { colors, fonts, radii } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "juridique", label: "Juridique", color: "#2563eb" },
  { value: "cyber",     label: "Cyber",     color: "#7c3aed" },
  { value: "rh",        label: "RH",        color: "#0891b2" },
  { value: "finance",   label: "Finance",   color: "#d97706" },
  { value: "interne",   label: "Interne",   color: "#059669" },
  { value: "general",   label: "Général",   color: "#64748b" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  if (diffDays < 7) return `il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  if (diffWeeks < 5) return `il y a ${diffWeeks} semaine${diffWeeks > 1 ? "s" : ""}`;
  if (diffMonths < 12) return `il y a ${diffMonths} mois`;
  const diffYears = Math.floor(diffMonths / 12);
  return `il y a ${diffYears} an${diffYears > 1 ? "s" : ""}`;
}

function getCategoryInfo(value) {
  return CATEGORY_MAP[value] || { label: value, color: "#64748b" };
}

function parseTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  try {
    const p = JSON.parse(tags);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Article card
// ---------------------------------------------------------------------------

function ArticleCard({ article, isExpanded, onToggle, onTagClick }) {
  const cat = getCategoryInfo(article.category);
  const tags = parseTags(article.tags);
  const isPinned = article.pinned === true;

  return (
    <div
      style={{
        ...styles.articleCard,
        borderLeft: `4px solid ${cat.color}`,
        backgroundColor: isPinned ? `${cat.color}08` : colors.s1,
      }}
      onClick={onToggle}
    >
      {/* Top row: badges + pin */}
      <div style={styles.articleTopRow}>
        <span
          style={{
            ...styles.categoryBadge,
            backgroundColor: `${cat.color}18`,
            color: cat.color,
          }}
        >
          {cat.label}
        </span>
        {isPinned && (
          <span style={styles.pinIcon} title="Épinglé">📌</span>
        )}
      </div>

      {/* Title */}
      <p style={styles.articleTitle}>{article.title}</p>

      {/* Summary */}
      <p
        style={{
          ...styles.articleSummary,
          WebkitLineClamp: isExpanded ? "unset" : 3,
          display: isExpanded ? "block" : "-webkit-box",
        }}
      >
        {article.summary || article.content || ""}
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={styles.tagsRow}>
          {tags.map((tag, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              style={styles.tagChip}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={styles.articleFooter}>
        <div style={styles.sourceRow}>
          {article.source && (
            <span style={styles.sourceName}>{article.source}</span>
          )}
          {article.source_url && isExpanded && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={styles.sourceLink}
            >
              Lire la source ↗
            </a>
          )}
        </div>
        <span style={styles.articleDate} title={article.published_at}>
          {timeAgo(article.published_at || article.created_at)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar tags
// ---------------------------------------------------------------------------

function TagSidebar({ allTags, activeTag, onTagClick }) {
  return (
    <div style={styles.sidebar}>
      <p style={styles.sidebarTitle}>Tags</p>
      <div style={styles.sidebarTagList}>
        {allTags.map(({ tag, count }) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagClick(tag)}
            style={{
              ...styles.sidebarTag,
              backgroundColor: activeTag === tag ? colors.accent : colors.s3,
              color: activeTag === tag ? "#fff" : colors.text2,
              borderColor: activeTag === tag ? colors.accent : colors.border,
            }}
          >
            <span style={styles.sidebarTagLabel}>{tag}</span>
            <span style={{
              ...styles.sidebarTagCount,
              backgroundColor: activeTag === tag ? "rgba(255,255,255,0.25)" : colors.border,
              color: activeTag === tag ? "#fff" : colors.text3,
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NewsModal() {
  const [articles, setArticles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [activeCategories, setActive]   = useState(() => new Set(CATEGORIES.map((c) => c.value)));
  const [activeTag, setActiveTag]       = useState(null);
  const [sortMode, setSortMode]         = useState("recent"); // "recent" | "pinned"
  const [expandedId, setExpandedId]     = useState(null);

  // Fetch articles
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/news_items", {
          headers: { Accept: "application/json" },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setArticles(Array.isArray(data) ? data : (data.news_items || []));
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Toggle a category
  const toggleCategory = useCallback((value) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.size === CATEGORIES.length) {
        // All selected → select only this one
        return new Set([value]);
      }
      if (next.has(value)) {
        next.delete(value);
        if (next.size === 0) return new Set(CATEGORIES.map((c) => c.value));
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  // All unique tags with counts
  const allTags = useMemo(() => {
    const map = {};
    articles.forEach((a) => {
      parseTags(a.tags).forEach((tag) => {
        map[tag] = (map[tag] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [articles]);

  // Filtered + sorted articles
  const displayed = useMemo(() => {
    let list = articles;

    // Category filter
    if (activeCategories.size < CATEGORIES.length) {
      list = list.filter((a) => activeCategories.has(a.category));
    }

    // Tag filter
    if (activeTag) {
      list = list.filter((a) => parseTags(a.tags).includes(activeTag));
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.summary || "").toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortMode === "pinned") {
      list = [...list].sort((a, b) => {
        if (a.pinned === b.pinned) {
          return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
        }
        return a.pinned ? -1 : 1;
      });
    } else {
      list = [...list].sort((a, b) =>
        new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
      );
    }

    return list;
  }, [articles, activeCategories, activeTag, search, sortMode]);

  const handleTagClick = useCallback((tag) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }, []);

  const handleToggleExpand = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Whether all categories are selected
  const allSelected = activeCategories.size === CATEGORIES.length;

  return (
    <div style={styles.container}>
      {/* ---- Header bar ---- */}
      <div style={styles.headerBar}>
        {/* Row 1: Search + Sort */}
        <div style={styles.headerRow}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article…"
              style={styles.searchInput}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={styles.clearBtn}
              >
                ×
              </button>
            )}
          </div>

          {/* Sort toggles */}
          <div style={styles.sortGroup}>
            <button
              type="button"
              onClick={() => setSortMode("recent")}
              style={{
                ...styles.sortBtn,
                backgroundColor: sortMode === "recent" ? colors.accent : colors.s3,
                color: sortMode === "recent" ? "#fff" : colors.text2,
                borderColor: sortMode === "recent" ? colors.accent : colors.border,
              }}
            >
              Plus récent
            </button>
            <button
              type="button"
              onClick={() => setSortMode("pinned")}
              style={{
                ...styles.sortBtn,
                backgroundColor: sortMode === "pinned" ? colors.accent : colors.s3,
                color: sortMode === "pinned" ? "#fff" : colors.text2,
                borderColor: sortMode === "pinned" ? colors.accent : colors.border,
              }}
            >
              📌 Épinglés d'abord
            </button>
          </div>
        </div>

        {/* Row 2: Category chips */}
        <div style={styles.chipsRow}>
          {/* "Tous" chip */}
          <button
            type="button"
            onClick={() => setActive(new Set(CATEGORIES.map((c) => c.value)))}
            style={{
              ...styles.catChip,
              backgroundColor: allSelected ? "#16213a" : colors.s3,
              color: allSelected ? "#fff" : colors.text2,
              borderColor: allSelected ? "#16213a" : colors.border,
            }}
          >
            Tous
          </button>

          {CATEGORIES.map((cat) => {
            const isOn = activeCategories.has(cat.value) && !allSelected;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                style={{
                  ...styles.catChip,
                  backgroundColor: isOn ? cat.color : colors.s3,
                  color: isOn ? "#fff" : colors.text2,
                  borderColor: isOn ? cat.color : colors.border,
                }}
              >
                {cat.label}
              </button>
            );
          })}

          <span style={styles.countLabel}>
            {displayed.length} article{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Active tag filter pill */}
        {activeTag && (
          <div style={styles.activeTagRow}>
            <span style={styles.activeTagLabel}>Tag actif :</span>
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              style={styles.activeTagPill}
            >
              {activeTag} ×
            </button>
          </div>
        )}
      </div>

      {/* ---- Body ---- */}
      <div style={styles.body}>
        {/* Article list */}
        <div style={styles.articleList}>
          {loading ? (
            <p style={styles.emptyText}>Chargement…</p>
          ) : displayed.length === 0 ? (
            <p style={styles.emptyText}>
              {articles.length === 0
                ? "Aucun article disponible"
                : "Aucun article ne correspond aux filtres"}
            </p>
          ) : (
            displayed.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isExpanded={expandedId === article.id}
                onToggle={() => handleToggleExpand(article.id)}
                onTagClick={handleTagClick}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        {allTags.length > 0 && (
          <TagSidebar
            allTags={allTags}
            activeTag={activeTag}
            onTagClick={handleTagClick}
          />
        )}
      </div>
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
    height: "100%",
  },

  // Header bar
  headerBar: {
    backgroundColor: colors.s1,
    borderBottom: `1px solid ${colors.border}`,
    padding: "12px 20px 10px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  // Search
  searchWrap: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    fontSize: 13,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "7px 30px 7px 30px",
    outline: "none",
  },
  clearBtn: {
    position: "absolute",
    right: 8,
    fontSize: 16,
    color: colors.text3,
    background: "none",
    border: "none",
    cursor: "pointer",
    lineHeight: 1,
    padding: 0,
  },

  // Sort
  sortGroup: {
    display: "flex",
    gap: 6,
    flexShrink: 0,
  },
  sortBtn: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: radii.button,
    border: "1px solid",
    cursor: "pointer",
    transition: "background-color 0.15s, color 0.15s",
    whiteSpace: "nowrap",
  },

  // Chips
  chipsRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  catChip: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: radii.pill,
    border: "1px solid",
    cursor: "pointer",
    transition: "background-color 0.15s, color 0.15s",
    lineHeight: 1.4,
  },
  countLabel: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text3,
    marginLeft: "auto",
  },

  // Active tag filter
  activeTagRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  activeTagLabel: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text3,
  },
  activeTagPill: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.accent,
    backgroundColor: `${colors.accent}14`,
    border: `1px solid ${colors.accent}40`,
    borderRadius: radii.pill,
    padding: "3px 10px",
    cursor: "pointer",
  },

  // Body (list + sidebar)
  body: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    overflow: "hidden",
  },

  // Article list
  articleList: {
    flex: 1,
    overflowY: "auto",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text3,
    textAlign: "center",
    paddingTop: 48,
    margin: 0,
  },

  // Article card
  articleCard: {
    borderRadius: radii.card,
    border: `1px solid ${colors.border}`,
    padding: "12px 14px 12px 14px",
    cursor: "pointer",
    transition: "box-shadow 0.15s ease, background-color 0.15s ease",
    display: "flex",
    flexDirection: "column",
    gap: 7,
    flexShrink: 0,
  },
  articleTopRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "2px 8px",
    borderRadius: 4,
    lineHeight: 1.5,
  },
  pinIcon: {
    fontSize: 12,
    lineHeight: 1,
  },
  articleTitle: {
    fontFamily: fonts.outfit,
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    margin: 0,
    lineHeight: 1.3,
  },
  articleSummary: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text2,
    margin: 0,
    lineHeight: 1.55,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },

  // Tags row
  tagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
  },
  tagChip: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 500,
    color: colors.text2,
    backgroundColor: colors.s3,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.pill,
    padding: "2px 8px",
    cursor: "pointer",
    lineHeight: 1.5,
    transition: "background-color 0.12s ease",
  },

  // Footer
  articleFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 2,
  },
  sourceRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  sourceName: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text3,
    fontStyle: "italic",
  },
  sourceLink: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.accent,
    textDecoration: "none",
  },
  articleDate: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text3,
    flexShrink: 0,
  },

  // Sidebar
  sidebar: {
    width: 160,
    minWidth: 160,
    borderLeft: `1px solid ${colors.border}`,
    padding: "14px 12px",
    overflowY: "auto",
    backgroundColor: colors.s2,
    flexShrink: 0,
  },
  sidebarTitle: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: colors.text3,
    margin: "0 0 10px",
  },
  sidebarTagList: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  sidebarTag: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 500,
    padding: "5px 8px",
    borderRadius: radii.button,
    border: "1px solid",
    cursor: "pointer",
    transition: "background-color 0.12s, color 0.12s",
    textAlign: "left",
    width: "100%",
  },
  sidebarTagLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  sidebarTagCount: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 5px",
    borderRadius: 8,
    marginLeft: 5,
    flexShrink: 0,
  },
};
