import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/appStore';
import { useOllama } from './hooks/useOllama';
import { useScanner } from './hooks/useScanner';
import { CommandBar } from './components/CommandBar/CommandBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Toast } from './components/ui';
import './styles/globals.css';

// ─── Notification Layer ────────────────────────────────────────

const NotificationLayer: React.FC = () => {
  const { notifications, removeNotification } = useAppStore();
  return (
    <div className="toast-container">
      <AnimatePresence>
        {notifications.map((n) => (
          <Toast
            key={n.id}
            type={n.type}
            title={n.title}
            message={n.message}
            onClose={() => removeNotification(n.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ─── App Root ──────────────────────────────────────────────────

const App: React.FC = () => {
  const {
    toggleCommandBar, openCommandBar, activeProjectId, projects, indexedFiles, isIndexing,
    updatePanelLayout, panelLayout, setCurrentView, toggleSidebar,
    createChatSession, activeChatSessionId,
  } = useAppStore();
  const { checkHealth } = useOllama();
  const { reindexProject } = useScanner();

  // Check Ollama health on startup
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Restore project indexing on app reload
  useEffect(() => {
    if (activeProjectId && indexedFiles.length === 0 && !isIndexing) {
      const activeProject = projects.find(p => p.id === activeProjectId);
      if (activeProject) {
        reindexProject(activeProject.path, activeProject.name);
      }
    }
  }, [activeProjectId, indexedFiles.length, isIndexing, projects, reindexProject]);

  // Global keyboard shortcuts — VS Code complete set
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Prevent browser defaults for editor shortcuts
      if (!ctrl && !alt) return;

      // Ctrl+P or Ctrl+Shift+P — Command Palette
      if (ctrl && e.key === 'p' && !shift) {
        e.preventDefault();
        openCommandBar();
        return;
      }
      if (ctrl && shift && e.key === 'P') {
        e.preventDefault();
        openCommandBar();
        return;
      }

      // Ctrl+` — Toggle Terminal
      if (ctrl && e.key === '`') {
        e.preventDefault();
        const s = useAppStore.getState();
        s.updatePanelLayout({ terminalOpen: !s.panelLayout.terminalOpen });
        return;
      }

      // Ctrl+B — Toggle Sidebar
      if (ctrl && e.key === 'b' && !shift) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl+I — Toggle AI Chat
      if (ctrl && e.key === 'i' && !shift) {
        e.preventDefault();
        const s = useAppStore.getState();
        if (!s.activeChatSessionId) s.createChatSession();
        s.updatePanelLayout({ rightPanelOpen: !s.panelLayout.rightPanelOpen });
        return;
      }

      // Ctrl+Shift+E — Explorer
      if (ctrl && shift && e.key === 'E') {
        e.preventDefault();
        setCurrentView('dashboard');
        return;
      }

      // Ctrl+Shift+F — Search
      if (ctrl && shift && e.key === 'F') {
        e.preventDefault();
        setCurrentView('search');
        return;
      }

      // Ctrl+Shift+G — Source Control (Audit)
      if (ctrl && shift && e.key === 'G') {
        e.preventDefault();
        setCurrentView('audit');
        return;
      }

      // Ctrl+, — Settings
      if (ctrl && e.key === ',') {
        e.preventDefault();
        setCurrentView('settings');
        return;
      }

      // Ctrl+Shift+` — New Terminal
      if (ctrl && shift && e.key === '`') {
        e.preventDefault();
        const store = useAppStore.getState();
        const cwd = store.projects.find(p => p.id === store.activeProjectId)?.path ?? 'C:\\';
        store.addTerminal({
          id: `term-${Date.now()}`,
          title: 'pwsh',
          cwd,
          history: [],
          output: [`BlameBot Terminal  PowerShell`, `Working directory: ${cwd}`, ''],
        });
        return;
      }

      // Ctrl+W — Close active tab
      if (ctrl && e.key === 'w') {
        e.preventDefault();
        const store = useAppStore.getState();
        if (store.activeTabId) {
          store.closeTab(store.activeTabId);
        }
        return;
      }

      // Ctrl+Shift+N — New window (no-op for now)
      if (ctrl && shift && e.key === 'N') {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCommandBar, toggleSidebar, setCurrentView, updatePanelLayout, panelLayout]);

  return (
    <>
      <Dashboard />
      <CommandBar />
      <NotificationLayer />
    </>
  );
};

export default App;
