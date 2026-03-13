import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faWandMagicSparkles,
  faEnvelope,
  faFolderOpen,
  faListCheck,
  faNewspaper,
  faGear,
  faCircleUser,
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/shared/Sidebar";
import DockBar from "../components/shared/DockBar";
import DockModal from "../components/dock/DockModal";
import ChatModal from "../components/dock/ChatModal";
import AiModal from "../components/dock/AiModal";
import TodoModal from "../components/dock/TodoModal";
import ProfileModal from "../components/dock/ProfileModal";
import EmailModal from "../components/dock/EmailModal";
import DocumentsModal from "../components/dock/DocumentsModal";
import NewsModal from "../components/dock/NewsModal";
import { ToastProvider } from "../lib/useToast";

// ---------------------------------------------------------------------------
// Modal configuration map
// ---------------------------------------------------------------------------

const MODAL_CONFIG = {
  chat: {
    title: "Chat d\u2019\u00e9quipe",
    icon: faComments,
    color: "#2563eb",
  },
  ai: {
    title: "Assistant IA",
    icon: faWandMagicSparkles,
    color: "#7c3aed",
  },
  email: {
    title: "Email & Reporting",
    icon: faEnvelope,
    color: "#dc2626",
  },
  documents: {
    title: "Documents",
    icon: faFolderOpen,
    color: "#d97706",
  },
  todo: {
    title: "Mes t\u00e2ches",
    icon: faListCheck,
    color: "#059669",
  },
  news: {
    title: "Actualit\u00e9",
    icon: faNewspaper,
    color: "#0891b2",
  },
  settings: {
    title: "Param\u00e8tres",
    icon: faGear,
    color: "#64748b",
  },
  profile: {
    title: "Mon profil",
    icon: faCircleUser,
    color: "#8b5cf6",
  },
};

// ---------------------------------------------------------------------------
// Placeholder for modals not yet implemented
// ---------------------------------------------------------------------------

function PlaceholderContent() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: 40,
        color: "#94a3b8",
        fontFamily:
          '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: 14,
      }}
    >
      <p style={{ margin: 0 }}>Cette fonctionnalit\u00e9 arrive bient\u00f4t.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal content resolver
// ---------------------------------------------------------------------------

function ModalContent({ modalKey }) {
  switch (modalKey) {
    case "chat":
      return <ChatModal />;
    case "ai":
      return <AiModal />;
    case "todo":
      return <TodoModal />;
    case "profile":
      return <ProfileModal />;
    case "email":
      return <EmailModal />;
    case "documents":
      return <DocumentsModal />;
    case "news":
      return <NewsModal />;
    case "settings":
    default:
      return <PlaceholderContent />;
  }
}

// ---------------------------------------------------------------------------
// AppLayout
// ---------------------------------------------------------------------------

export default function AppLayout({ children }) {
  const [activeModal, setActiveModal] = useState(null);

  const handleClose = () => setActiveModal(null);
  const config = activeModal ? MODAL_CONFIG[activeModal] : null;

  return (
    <ToastProvider>
      <div style={styles.root}>
        <Sidebar />
        <main style={styles.main}>{children}</main>
        <DockBar onItemClick={setActiveModal} unreadCount={0} />

        {/* ---- Dock modals ---- */}
        {config && (
          <DockModal
            title={config.title}
            icon={config.icon}
            color={config.color}
            isOpen={activeModal !== null}
            onClose={handleClose}
          >
            <ModalContent modalKey={activeModal} />
          </DockModal>
        )}
      </div>
    </ToastProvider>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "row",
    height: "100vh",
    overflow: "hidden",
  },
  main: {
    flex: 1,
    overflow: "hidden",
  },
};
