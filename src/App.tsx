import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Shield, Search, Settings as SettingsIcon,
  Command, Zap, Menu, X,
} from 'lucide-react';
import { useAppStore } from './store/appStore';
import { useOllama } from './hooks/useOllama';
import { CommandBar } from './components/CommandBar/CommandBar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AuditReport } from './components/AuditReport/AuditReport';
import { CodeSearch } from './components/CodeSearch/CodeSearch';
import { Settings } from './components/Settings/Settings';
import { Toast } from './components/ui';
import type { AppView } from './types';
import './styles/globals.css';

// ─── Navigation Items ─────────────────────────────────────────

const NAV_ITEMS: Array<{
  view: AppView; label: string; icon: React.ReactNode; shortcut?: string;
}> = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, shortcut: '1' },
  { view: 'audit', label: 'Audit', icon: <Shield size={18} />, shortcut: '2' },
  { view: 'search', label: 'Search', icon: <Search size={18} />, shortcut: '3' },
  { view: 'settings', label: 'Settings', icon: <SettingsIcon size={18} />, shortcut: '4' },
];

// ─── Sidebar ──────────────────────────────────────────────────

const Sidebar: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  const { currentView, setCurrentView, openCommandBar, ollamaStatus, isSidebarCollapsed, toggleSidebar } = useAppStore();

  const isConnected = ollamaStatus === 'connected' || ollamaStatus === 'streaming';

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 200 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderRight: 'var(--border-width) solid var(--border-base)',
        height: '100%', flexShrink: 0, overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '16px 0' : '16px 16px',
        borderBottom: 'var(--border-width) solid var(--border-base)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius-md)',
              background: 'var(--accent-cyan)', border: '2px solid #000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Zap size={15} style={{ color: '#000' }} />
            </div>
            <span style={{
              fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', color: '#000',
            }}>
              BlameBot
            </span>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--radius-md)',
            background: 'var(--accent-cyan)', border: '2px solid #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={15} style={{ color: '#000' }} />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={toggleSidebar}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px', display: 'flex' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Command Bar Button */}
      <div style={{ padding: collapsed ? '10px 8px' : '10px 10px', flexShrink: 0 }}>
        <motion.button
          onClick={openCommandBar}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', padding: collapsed ? '8px' : '8px 12px',
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--accent-yellow)', border: 'var(--border-width) solid var(--border-base)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            color: '#000', fontFamily: 'var(--font-sans)', fontWeight: 800, textTransform: 'uppercase',
            fontSize: '0.8125rem', boxShadow: 'var(--shadow-raised)',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <Command size={14} />
          {!collapsed && (
            <>
              <span style={{ flex: 1, textAlign: 'left' }}>Ask AI...</span>
              <kbd style={{
                fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px',
                background: '#fff', border: '2px solid #000',
                color: '#000', fontFamily: 'var(--font-mono)', fontWeight: 900
              }}>⌃ Space</kbd>
            </>
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: collapsed ? '4px 8px' : '4px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(({ view, label, icon }) => {
          const isActive = currentView === view;
          return (
            <motion.button
              key={view}
              onClick={() => setCurrentView(view)}
              whileHover={{ x: collapsed ? 0 : 2 }}
              style={{
                width: '100%', padding: collapsed ? '10px' : '10px 12px',
                display: 'flex', alignItems: 'center', gap: '10px',
                background: isActive ? 'var(--accent-cyan)' : 'transparent',
                border: isActive ? 'var(--border-width) solid #000' : 'var(--border-width) solid transparent',
                boxShadow: isActive ? '4px 4px 0px #000' : 'none',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                color: isActive ? '#000' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase',
                textAlign: 'left', transition: 'all 0.1s step-end',
                justifyContent: collapsed ? 'center' : 'flex-start',
                marginBottom: '4px',
              }}
              title={collapsed ? label : undefined}
            >
              {icon}
              {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
              {!collapsed && isActive && (
                <div style={{ width: 8, height: 8, background: '#000', flexShrink: 0, border: '1px solid #000' }} />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Collapse Toggle (when expanded) */}
      {!collapsed && (
        <div style={{ padding: '10px', borderTop: 'var(--border-width) solid var(--border-base)', flexShrink: 0 }}>
          <button
            onClick={toggleSidebar}
            style={{
              width: '100%', padding: '8px', background: '#fff', border: '2px solid #000',
              color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.75rem', fontFamily: 'var(--font-sans)', fontWeight: 800, textTransform: 'uppercase',
              boxShadow: '2px 2px 0px #000',
            }}
          >
            <Menu size={13} /> Collapse
          </button>
        </div>
      )}

      {/* Ollama Status */}
      {!collapsed && (
        <div style={{
          padding: '10px 14px', borderTop: 'var(--border-width) solid var(--border-base)',
          display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
        }}>
          <div style={{
            width: 10, height: 10, flexShrink: 0,
            background: isConnected ? 'var(--success)' : 'var(--danger)',
            border: '2px solid #000'
          }} />
          <span style={{ fontSize: '0.75rem', color: '#000', fontWeight: 800, textTransform: 'uppercase' }}>
            {isConnected ? 'Ollama Running' : 'Ollama Offline'}
          </span>
        </div>
      )}
    </motion.aside>
  );
};

// ─── Main Content ─────────────────────────────────────────────

const MainContent: React.FC = () => {
  const { currentView } = useAppStore();

  const VIEWS: Record<AppView, React.ReactNode> = {
    landing: <Dashboard />, // redirect landing to dashboard
    dashboard: <Dashboard />,
    audit: <AuditReport />,
    search: <CodeSearch />,
    settings: <Settings />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        style={{ height: '100%', overflow: 'hidden' }}
      >
        {VIEWS[currentView]}
      </motion.div>
    </AnimatePresence>
  );
};

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
  const { isSidebarCollapsed, toggleSidebar } = useAppStore();
  const { checkHealth } = useOllama();

  // Check Ollama health on startup
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Space opens command bar (handled by Tauri global shortcut in production)
      // Additional in-app shortcuts:
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      {/* Sidebar */}
      <Sidebar collapsed={isSidebarCollapsed} />

      {/* Main Content Area */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MainContent />
      </main>

      {/* Global Overlays */}
      <CommandBar />
      <NotificationLayer />
    </div>
  );
};

export default App;
