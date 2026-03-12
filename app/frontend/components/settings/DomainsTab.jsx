import { useState, useCallback, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { router } from "@inertiajs/react";
import { colors, fonts, radii, shadows, zIndex } from "../../styles/tokens";
import { useToast } from "../../lib/useToast";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const EMPTY_FORM = {
  name: "",
  key: "",
  color: "#2563eb",
  description: "",
  position: 0,
};

// ---------------------------------------------------------------------------
// Keyframes — injected once
// ---------------------------------------------------------------------------

let stylesInjected = false;

function injectKeyframes() {
  if (stylesInjected) return;
  stylesInjected = true;

  const sheet = document.createElement("style");
  sheet.textContent = `
    @keyframes dt-fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes dt-slideUp {
      from { transform: translateY(12px); opacity: 0; }
      to   { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(sheet);
}

// ---------------------------------------------------------------------------
// DomainCard
// ---------------------------------------------------------------------------

function DomainCard({ domain, onEdit, onDelete }) {
  return (
    <div style={styles.card}>
      {/* Action buttons — top right */}
      <div style={styles.cardActions}>
        <button
          type="button"
          style={styles.cardActionBtn}
          onClick={() => onEdit(domain)}
          aria-label={`Modifier ${domain.name}`}
          title="Modifier"
        >
          &#x270E;
        </button>
        <button
          type="button"
          style={{ ...styles.cardActionBtn, color: colors.critical }}
          onClick={() => onDelete(domain)}
          aria-label={`Supprimer ${domain.name}`}
          title="Supprimer"
        >
          &#x2715;
        </button>
      </div>

      {/* Color dot + Name */}
      <div style={styles.cardHeader}>
        <span
          style={{
            ...styles.colorDot,
            backgroundColor: domain.color || colors.accent,
          }}
        />
        <span style={styles.cardName}>{domain.name}</span>
      </div>

      {/* Key */}
      <div style={styles.cardKey}>{domain.key}</div>

      {/* Description */}
      {domain.description && (
        <div style={styles.cardDesc}>{domain.description}</div>
      )}

      {/* Position */}
      <div style={styles.cardPosition}>Position : {domain.position}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DomainModal (create / edit)
// ---------------------------------------------------------------------------

function DomainModal({ domain, onClose, onSave }) {
  const isEdit = !!domain;
  const panelRef = useRef(null);
  const [form, setForm] = useState(() => {
    if (domain) {
      return {
        name: domain.name || "",
        key: domain.key || "",
        color: domain.color || "#2563eb",
        description: domain.description || "",
        position: domain.position ?? 0,
      };
    }
    return { ...EMPTY_FORM };
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    injectKeyframes();
  }, []);

  // Focus panel on mount
  useEffect(() => {
    if (panelRef.current) panelRef.current.focus();
  }, []);

  // Escape to close
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleChange = useCallback(
    (field, value) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        // Auto-generate key from name in create mode
        if (!isEdit && field === "name") {
          next.key = slugify(value);
        }
        return next;
      });
    },
    [isEdit],
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!form.name.trim() || !form.key.trim()) return;
      setSaving(true);
      onSave(form);
    },
    [form, onSave],
  );

  const modal = (
    <div
      style={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? `Modifier le domaine ${domain.name}` : "Ajouter un domaine"}
    >
      <div ref={panelRef} tabIndex={-1} style={styles.modalPanel}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>
            {isEdit ? "Modifier le domaine" : "Ajouter un domaine"}
          </span>
          <button
            type="button"
            style={styles.closeBtn}
            onClick={onClose}
            aria-label="Fermer"
          >
            &#x2715;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.modalBody}>
          {/* Name */}
          <label style={styles.label}>
            <span style={styles.labelText}>Nom *</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Finance"
              style={styles.input}
            />
          </label>

          {/* Key */}
          <label style={styles.label}>
            <span style={styles.labelText}>
              Cle technique *
              {isEdit && (
                <span style={styles.readonlyHint}> (non modifiable)</span>
              )}
            </span>
            <input
              type="text"
              required
              value={form.key}
              onChange={(e) => handleChange("key", e.target.value)}
              placeholder="finance"
              readOnly={isEdit}
              style={{
                ...styles.input,
                fontFamily: fonts.dmMono,
                fontSize: 12,
                ...(isEdit
                  ? { backgroundColor: colors.s2, color: colors.text3, cursor: "default" }
                  : {}),
              }}
            />
          </label>

          {/* Color */}
          <label style={styles.label}>
            <span style={styles.labelText}>Couleur</span>
            <div style={styles.colorRow}>
              <input
                type="color"
                value={form.color}
                onChange={(e) => handleChange("color", e.target.value)}
                style={styles.colorInput}
              />
              <span style={styles.colorHex}>{form.color}</span>
            </div>
          </label>

          {/* Description */}
          <label style={styles.label}>
            <span style={styles.labelText}>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Description optionnelle..."
              rows={3}
              style={styles.textarea}
            />
          </label>

          {/* Position */}
          <label style={styles.label}>
            <span style={styles.labelText}>Position</span>
            <input
              type="number"
              value={form.position}
              onChange={(e) => handleChange("position", parseInt(e.target.value, 10) || 0)}
              min={0}
              style={{ ...styles.input, width: 80 }}
            />
          </label>

          {/* Actions */}
          <div style={styles.modalActions}>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim() || !form.key.trim()}
              style={{
                ...styles.submitBtn,
                opacity: saving || !form.name.trim() || !form.key.trim() ? 0.5 : 1,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Enregistrement..." : isEdit ? "Mettre a jour" : "Creer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DomainsTab({ domains: rawDomains = [] }) {
  const domains = Array.isArray(rawDomains) ? rawDomains : [];
  const toast = useToast();
  const [modalDomain, setModalDomain] = useState(null); // null = closed, {} = create, domain = edit
  const [modalOpen, setModalOpen] = useState(false);

  const openCreate = useCallback(() => {
    setModalDomain(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((domain) => {
    setModalDomain(domain);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalDomain(null);
  }, []);

  // ---- Create ----
  const handleCreate = useCallback(
    (form) => {
      fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: form }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Erreur ${res.status}`);
          toast.addToast("Domaine cree avec succes", { type: "success" });
          closeModal();
          router.reload();
        })
        .catch((err) => {
          console.error("Create domain error:", err);
          toast.addToast("Impossible de creer le domaine", { type: "error" });
          closeModal();
        });
    },
    [toast, closeModal],
  );

  // ---- Update ----
  const handleUpdate = useCallback(
    (form) => {
      if (!modalDomain?.id) return;
      fetch(`/api/domains/${modalDomain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: form }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Erreur ${res.status}`);
          toast.addToast("Domaine mis a jour", { type: "success" });
          closeModal();
          router.reload();
        })
        .catch((err) => {
          console.error("Update domain error:", err);
          toast.addToast("Impossible de mettre a jour le domaine", { type: "error" });
          closeModal();
        });
    },
    [modalDomain, toast, closeModal],
  );

  // ---- Delete ----
  const handleDelete = useCallback(
    (domain) => {
      if (!window.confirm(`Supprimer le domaine "${domain.name}" ?`)) return;

      fetch(`/api/domains/${domain.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })
        .then(async (res) => {
          if (!res.ok) {
            // Try to get error message from backend (422 = domain has controls)
            let message = "Impossible de supprimer le domaine";
            try {
              const data = await res.json();
              if (data.error) message = data.error;
              if (data.errors) message = [].concat(data.errors).join(", ");
            } catch {
              // ignore parse error
            }
            throw new Error(message);
          }
          toast.addToast("Domaine supprime", { type: "success" });
          router.reload();
        })
        .catch((err) => {
          console.error("Delete domain error:", err);
          toast.addToast(err.message || "Impossible de supprimer le domaine", {
            type: "error",
            duration: 6000,
          });
        });
    },
    [toast],
  );

  const handleSave = modalDomain ? handleUpdate : handleCreate;

  const sorted = [...domains].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div style={styles.container}>
      {/* Header row */}
      <div style={styles.topBar}>
        <span style={styles.heading}>Domaines</span>
        <button type="button" style={styles.addBtn} onClick={openCreate}>
          + Ajouter un domaine
        </button>
      </div>

      {/* Grid of cards */}
      {sorted.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyText}>Aucun domaine configure</span>
        </div>
      ) : (
        <div style={styles.grid}>
          {sorted.map((d) => (
            <DomainCard
              key={d.id}
              domain={d}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <DomainModal
          domain={modalDomain}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    padding: 0,
  },

  // ---- Top bar ----
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  heading: {
    fontFamily: fonts.outfit,
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
  },

  addBtn: {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: fonts.outfit,
    color: "#fff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: radii.button,
    cursor: "pointer",
    lineHeight: 1,
    transition: "opacity .12s",
  },

  // ---- Grid ----
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },

  // ---- Card ----
  card: {
    position: "relative",
    backgroundColor: colors.s1,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.card,
    padding: 16,
    boxShadow: shadows.card,
  },

  cardActions: {
    position: "absolute",
    top: 10,
    right: 10,
    display: "flex",
    gap: 4,
  },

  cardActionBtn: {
    width: 26,
    height: 26,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    color: colors.text3,
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
    transition: "background-color .12s, color .12s",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
    paddingRight: 60, // leave space for action buttons
  },

  colorDot: {
    display: "inline-block",
    width: 24,
    height: 24,
    borderRadius: "50%",
    flexShrink: 0,
  },

  cardName: {
    fontFamily: fonts.outfit,
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.3,
  },

  cardKey: {
    fontFamily: fonts.dmMono,
    fontSize: 12,
    color: colors.text3,
    marginBottom: 6,
    marginLeft: 34, // align with name (24 dot + 10 gap)
  },

  cardDesc: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text2,
    lineHeight: 1.4,
    marginBottom: 6,
  },

  cardPosition: {
    fontFamily: fonts.outfit,
    fontSize: 11,
    color: colors.text3,
    marginTop: 4,
  },

  // ---- Empty state ----
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },

  emptyText: {
    fontFamily: fonts.outfit,
    fontSize: 14,
    fontWeight: 500,
    color: colors.text3,
  },

  // ---- Modal overlay ----
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,.35)",
    zIndex: zIndex.modal,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "dt-fadeIn .18s ease-out",
  },

  modalPanel: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: colors.s1,
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,.12)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    outline: "none",
    animation: "dt-slideUp .18s ease-out",
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px 12px",
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
  },

  modalTitle: {
    fontFamily: fonts.outfit,
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
  },

  closeBtn: {
    width: 26,
    height: 26,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.s2,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    color: colors.text2,
    fontSize: 12,
    fontFamily: fonts.outfit,
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
    lineHeight: 1,
    transition: "background-color .12s",
  },

  modalBody: {
    padding: "16px 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  labelText: {
    fontFamily: fonts.outfit,
    fontSize: 12,
    fontWeight: 600,
    color: colors.text2,
  },

  readonlyHint: {
    fontWeight: 400,
    fontStyle: "italic",
    color: colors.text3,
  },

  input: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    padding: "8px 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    backgroundColor: colors.s1,
    outline: "none",
    lineHeight: 1.4,
    transition: "border-color .12s",
  },

  textarea: {
    fontFamily: fonts.outfit,
    fontSize: 13,
    color: colors.text,
    padding: "8px 10px",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    backgroundColor: colors.s1,
    resize: "vertical",
    minHeight: 60,
    outline: "none",
    lineHeight: 1.5,
    transition: "border-color .12s",
  },

  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  colorInput: {
    width: 48,
    height: 32,
    border: "none",
    cursor: "pointer",
    padding: 0,
    backgroundColor: "transparent",
  },

  colorHex: {
    fontFamily: fonts.dmMono,
    fontSize: 12,
    color: colors.text3,
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },

  cancelBtn: {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: fonts.outfit,
    color: colors.text2,
    backgroundColor: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.button,
    cursor: "pointer",
    lineHeight: 1,
    transition: "background-color .12s",
  },

  submitBtn: {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: fonts.outfit,
    color: "#fff",
    backgroundColor: colors.accent,
    border: "none",
    borderRadius: radii.button,
    cursor: "pointer",
    lineHeight: 1,
    transition: "opacity .12s",
  },
};
