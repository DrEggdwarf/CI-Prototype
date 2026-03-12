import { usePage } from "@inertiajs/react";
import Sidebar from "../components/shared/Sidebar";
import AiChatFab from "../components/shared/AiChatFab";
import { ToastProvider } from "../lib/useToast";

export default function AppLayout({ children }) {
  const { component } = usePage();
  const showAiChat = component !== "Workspace";

  return (
    <ToastProvider>
      <div style={styles.root}>
        <Sidebar />
        <main style={styles.main}>{children}</main>
        {showAiChat && <AiChatFab />}
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
