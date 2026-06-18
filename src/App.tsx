import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/appStore';
import { useOllama } from './hooks/useOllama';
import { useScanner } from './hooks/useScanner';
import { CommandBar } from './components/CommandBar/CommandBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Toast } from './components/ui';
import './styles/globals.css';

// ─── Notification Layer ───────────────────────────────────────

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

// ─── App Root ─────────────────────────────────────────────────

const App: React.FC = () => {
  const { toggleCommandBar, activeProjectId, projects, indexedFiles, isIndexing } = useAppStore();
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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Space opens command bar (handled by Tauri global shortcut in production)
      // We can also add other VS Code-like shortcuts here if needed.
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandBar]);

  return (
    <>
      <Dashboard />
      <CommandBar />
      <NotificationLayer />
    </>
  );
};

export default App;
