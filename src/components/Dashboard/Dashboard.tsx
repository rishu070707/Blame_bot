import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/appStore';

// Components
import { ActivityBar } from '../Editor/ActivityBar';
import { FileExplorer } from '../Editor/FileExplorer';
import { EditorTabBar } from '../Editor/EditorTabBar';
import { MonacoPane } from '../Editor/MonacoPane';
import { TerminalPanel } from '../Editor/TerminalPanel';
import { StatusBar } from '../Editor/StatusBar';
import { AuditReport } from '../AuditReport/AuditReport';
import { CodeSearch } from '../CodeSearch/CodeSearch';
import { Settings } from '../Settings/Settings';
import { AIChat } from './AIChat';
import { MenuBar } from '../Editor/MenuBar';

export const Dashboard: React.FC = () => {
  const { panelLayout, currentView } = useAppStore();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'var(--vscode-base)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    }}>
      {/* Custom Menu Bar */}
      <MenuBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Activity Bar */}
        <ActivityBar />

        {/* Primary Sidebar (File Explorer) */}
        {currentView === 'dashboard' && (
          <div style={{ width: panelLayout.sidebarWidth, flexShrink: 0, height: '100%' }}>
            <FileExplorer />
          </div>
        )}

        {/* Main Editor Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--vscode-base)' }}>
          {currentView === 'dashboard' && <EditorTabBar />}
          
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {currentView === 'dashboard' && <MonacoPane />}
            {currentView === 'search' && <CodeSearch />}
            {currentView === 'audit' && <AuditReport />}
            {currentView === 'settings' && <Settings />}
            {currentView === 'landing' && <MonacoPane />}
          </div>

          <TerminalPanel />
        </div>

        {/* Right Panel (AI Copilot / Chat) */}
        <AnimatePresence>
          {panelLayout.rightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: panelLayout.rightPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ height: '100%', flexShrink: 0 }}
            >
              <AIChat />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
};

export default Dashboard;
