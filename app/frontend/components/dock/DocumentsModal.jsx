import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { colors, fonts, radii, shadows } from "../../styles/tokens";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILE_TYPES = [
  { value: "all",   label: "Tous" },
  { value: "pdf",   label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "word",  label: "Word" },
  { value: "image", label: "Image" },
  { value: "other", label: "Autre" },
];

const TYPE_ICONS = {
  pdf:   "📄",
  excel: "📊",
  word:  "📝",
  image: "🖼️",
  other: "📁",
};

const TYPE_COLORS = {
  pdf:   "#dc2626",
  excel: "#16a34a",
  word:  "#2563eb",
  image: "#7c3aed",
  other: "#64748b",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes) {
  if (!bytes || bytes === 0) return "–";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileType(doc) {
  const t = (doc.file_type || doc.type || "other").toLowerCase();
  if (FILE_TYPES.map((f) => f.value).includes(t)) return t;
  return "other";
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Upload form (slide-down inline)
// ---------------------------------------------------------------------------

function UploadForm({ controls, onCancel, onCreated }) {
  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [controlId, setControl] = useState("");
  const [shared, setShared]     = useState(false);
  const [submitting, setSubmit] = useState(false);
  const [error, setError]       = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmit(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          document: {
            name: trimmed,
            description: description.trim(),
            file_type: fileType,
            control_id: controlId || null,
            shared,
          },
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      const data = await res.json();
      onCreated(data);
    } catch (err) {
      setError(err.message);
      setSubmit(false);
    }
  }, [name, description, fileType, controlId, shared, onCreated]);

  return (
    <div style={styles.uploadForm}>
      <form onSubmit={handleSubmit}>
        <div style={styles.uploadGrid}>
          {/* Nom */}
          <div style={styles.formField}>
            <label style={styles.formLabel}>Nom du document *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rapport Q3 2024.pdf"
              style={styles.formInput}
              required
            />
          </div>

          {/* Type */}
          <div style={styles.formField}>
            <label style={styles.formLabel}>Type</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              style={styles.formSelect}
            >
              {FILE_TYPES.filter((f) => f.value !== "all").map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ ...styles.formField, gridColumn: "1 / -1" }}>
            <label style={styles.formLabel}>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brève description du document…"
              style={styles.formInput}
            />
          </div>

          {/* Contrôle lié */}
          <div style={styles.formField}>
            <label style={styles.formLabel}>Lié au contrôle (optionnel)</label>
            <select
              value={controlId}
              onChange={(e) => setControl(e.target.value)}
              style={styles.formSelect}
            >
              <option value="">– Aucun –</option>
              {(controls || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.reference ? `${c.reference} – ` : ""}{c.name || c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Partagé */}
          <div style={{ ...styles.formField, justifyContent: "flex-end" }}>
            <label style={styles.formLabel}>&nbsp;</label>
            <label style={styles.toggleLabel}>
              <div
                role="checkbox"
                aria-checked={shared}
                tabIndex={0}
                onClick={() => setShared((s) => !s)}
                onKeyDown={(e) => e.key === " " && setShared((s) => !s)}
                style={{
                  ...styles.toggleTrack,
                  backgroundColor: shared ? colors.accent : colors.border2,
                }}
              >
                <div style={{
                  ...styles.toggleThumb,
                  transform: shared ? "translateX(14px)" : "translateX(0px)",
                }} />
              </div>
              <span style={styles.toggleText}>Partagé</span>
            </label>
          </div>
        </div>

        {error && <p style={styles.errorMsg}>{error}</p>}

        <div style={styles.uploadActions}>
          <button type="button" onClick={onCancel} style={styles.cancelBtn}>
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            style={{
              ...styles.createBtn,
              opacity: !name.trim() || submitting ? 0.5 : 1,
              cursor: !name.trim() || submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Création…" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document card
// ---------------------------------------------------------------------------

function DocCard({ doc, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const type = getFileType(doc);
  const icon = TYPE_ICONS[type] || TYPE_ICONS.other;
  const typeColor = TYPE_COLORS[type] || TYPE_COLORS.other;

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Supprimer « ${doc.name} » ?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (res.ok) onDelete(doc.id);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }, [doc, onDelete]);

  const uploaderName = doc.uploaded_by?.name || doc.uploader_name || "Inconnu";

  return (
    <div
      style={{
        ...styles.docCard,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 6px 18px rgba(0,0,0,0.10)"
          : "0 1px 3px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div style={{ ...styles.docIcon, backgroundColor: `${typeColor}14` }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>

      {/* Content */}
      <div style={styles.docContent}>
        <p style={styles.docName} title={doc.name}>{doc.name}</p>
        {doc.description && (
          <p style={styles.docDesc}>{doc.description}</p>
        )}
        <div style={styles.docMeta}>
          {doc.file_size != null && (
            <span style={styles.docMetaItem}>{formatSize(doc.file_size)}</span>
          )}
          {doc.shared && (
            <span style={{ ...styles.docBadge, backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
              Partagé
            </span>
          )}
        </div>
        {doc.control && (
          <p style={styles.docControl}>
            Contrôle : <span style={styles.docControlLink}>{doc.control.reference || doc.control.name || doc.control.title}</span>
          </p>
        )}
        <div style={styles.docFooter}>
          <div style={styles.uploaderRow}>
            <div style={styles.initials}>{getInitials(uploaderName)}</div>
            <span style={styles.uploaderName}>{uploaderName}</span>
          </div>
          <span style={styles.docDate}>{formatDate(doc.created_at || doc.uploaded_at)}</span>
        </div>
      </div>

      {/* Hover overlay */}
      {hovered && (
        <div style={styles.hoverOverlay}>
          {doc.file_url && (
            <a
              href={doc.file_url}
              download
              onClick={(e) => e.stopPropagation()}
              style={styles.overlayBtn}
            >
              ⬇ Télécharger
            </a>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{ ...styles.overlayBtn, ...styles.overlayBtnDanger }}
          >
            {deleting ? "…" : "🗑 Supprimer"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DocumentsModal() {
  const [documents, setDocuments]   = useState([]);
  const [controls, setControls]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [mineOnly, setMineOnly]     = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : (data.documents || []));
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch controls for upload select
  const fetchControls = useCallback(async () => {
    try {
      const res = await fetch("/api/controls", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setControls(Array.isArray(data) ? data : (data.controls || []));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchDocuments(), fetchControls()]).finally(() => setLoading(false));
  }, [fetchDocuments, fetchControls]);

  const handleDelete = useCallback((id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleCreated = useCallback((doc) => {
    setDocuments((prev) => [doc, ...prev]);
    setShowUpload(false);
  }, []);

  // Filtered list
  const filtered = useMemo(() => {
    let list = documents;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((d) => (d.name || "").toLowerCase().includes(q));
    }
    if (typeFilter !== "all") {
      list = list.filter((d) => getFileType(d) === typeFilter);
    }
    if (mineOnly) {
      list = list.filter((d) => d.is_mine === true || d.mine === true);
    }
    return list;
  }, [documents, search, typeFilter, mineOnly]);

  return (
    <div style={styles.container}>
      {/* ---- Header bar ---- */}
      <div style={styles.headerBar}>
        <div style={styles.headerRow}>
          {/* Search */}
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un document…"
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

          {/* Mine toggle */}
          <label style={styles.mineToggle}>
            <div
              role="checkbox"
              aria-checked={mineOnly}
              tabIndex={0}
              onClick={() => setMineOnly((m) => !m)}
              onKeyDown={(e) => e.key === " " && setMineOnly((m) => !m)}
              style={{
                ...styles.toggleTrack,
                backgroundColor: mineOnly ? colors.accent : colors.border2,
              }}
            >
              <div style={{
                ...styles.toggleThumb,
                transform: mineOnly ? "translateX(14px)" : "translateX(0px)",
              }} />
            </div>
            <span style={styles.toggleText}>Mes documents</span>
          </label>

          {/* Upload button */}
          <button
            type="button"
            onClick={() => setShowUpload((s) => !s)}
            style={{
              ...styles.uploadBtn,
              backgroundColor: showUpload ? colors.s3 : colors.accent,
              color: showUpload ? colors.text : "#fff",
            }}
          >
            {showUpload ? "✕ Annuler" : "+ Uploader"}
          </button>
        </div>

        {/* Type chips */}
        <div style={styles.chipsRow}>
          {FILE_TYPES.map((ft) => (
            <button
              key={ft.value}
              type="button"
              onClick={() => setTypeFilter(ft.value)}
              style={{
                ...styles.chip,
                backgroundColor: typeFilter === ft.value ? colors.accent : colors.s3,
                color: typeFilter === ft.value ? "#fff" : colors.text2,
                borderColor: typeFilter === ft.value ? colors.accent : colors.border,
              }}
            >
              {ft.label}
            </button>
          ))}
          <span style={styles.countLabel}>
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ---- Upload form (slide-down) ---- */}
      {showUpload && (
        <UploadForm
          controls={controls}
          onCancel={() => setShowUpload(false)}
          onCreated={handleCreated}
        />
      )}

      {/* ---- Grid ---- */}
      <div style={styles.gridArea}>
        {loading ? (
          <p style={styles.emptyText}>Chargement…</p>
        ) : filtered.length === 0 ? (
          <p style={styles.emptyText}>
            {documents.length === 0
              ? "Aucun document disponible"
              : "Aucun document ne correspond aux filtres"}
          </p>
        ) : (
          <div style={styles.grid}>
            {filtered.map((doc) => (
              <DocCard key={doc.id} doc={doc} onDelete={handleDelete} />
            ))}
          </div>
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
    backgroundColor: colors.s2,
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

  // Mine toggle
  mineToggle: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    flexShrink: 0,
  },
  toggleTrack: {
    width: 30,
    height: 16,
    borderRadius: 8,
    position: "relative",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    flexShrink: 0,
  },
  toggleThumb: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 12,
    height: 12,
    borderRadius: "50%",
    backgroundColor: "#fff",
    transition: "transform 0.2s ease",
    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
  },
  toggleText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.text2,
    userSelect: "none",
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
  },

  // Upload button
  uploadBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    borderRadius: radii.button,
    padding: "7px 14px",
    cursor: "pointer",
    flexShrink: 0,
    transition: "background-color 0.15s ease, color 0.15s ease",
    whiteSpace: "nowrap",
  },

  // Chips
  chipsRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
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

  // Upload form
  uploadForm: {
    backgroundColor: colors.s1,
    borderBottom: `1px solid ${colors.border}`,
    padding: "16px 20px",
    flexShrink: 0,
    borderTop: `2px solid ${colors.accent}`,
  },
  uploadGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 12,
  },
  formField: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  formLabel: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    fontWeight: 600,
    color: colors.text2,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  formInput: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "7px 10px",
    outline: "none",
  },
  formSelect: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "7px 10px",
    outline: "none",
    cursor: "pointer",
  },
  uploadActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    color: colors.text2,
    backgroundColor: colors.s3,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    padding: "7px 16px",
    cursor: "pointer",
  },
  createBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: radii.button,
    padding: "7px 16px",
    transition: "opacity 0.15s ease",
  },
  errorMsg: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    color: colors.critical,
    margin: "0 0 8px",
  },

  // Grid area
  gridArea: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 14,
  },
  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text3,
    textAlign: "center",
    paddingTop: 48,
    margin: 0,
  },

  // Document card
  docCard: {
    backgroundColor: colors.s1,
    borderRadius: radii.card,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    cursor: "default",
  },
  docIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px 0 10px",
    flexShrink: 0,
  },
  docContent: {
    padding: "0 12px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    flex: 1,
  },
  docName: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 700,
    color: colors.text,
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  docDesc: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text2,
    margin: 0,
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    overflow: "hidden",
    lineHeight: 1.45,
  },
  docMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  docMetaItem: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text3,
  },
  docBadge: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    fontWeight: 600,
    padding: "1px 6px",
    borderRadius: 4,
    lineHeight: 1.5,
  },
  docControl: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text3,
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  docControlLink: {
    color: colors.accent,
    fontWeight: 600,
  },
  docFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  uploaderRow: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  initials: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    backgroundColor: colors.s3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.outfit,
    fontSize: 9,
    fontWeight: 700,
    color: colors.text2,
    flexShrink: 0,
  },
  uploaderName: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 80,
  },
  docDate: {
    fontFamily: fonts.outfit,
    fontSize: 10,
    color: colors.text3,
    flexShrink: 0,
  },

  // Hover overlay
  hoverOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(22, 33, 58, 0.72)",
    backdropFilter: "blur(4px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.card,
  },
  overlayBtn: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: radii.button,
    padding: "7px 14px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    transition: "background-color 0.15s ease",
  },
  overlayBtnDanger: {
    backgroundColor: "rgba(220,38,38,0.4)",
    borderColor: "rgba(220,38,38,0.5)",
  },
};
