import React, { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/appStore';

// Components
import { ActivityBar } from '../Editor/ActivityBar';
import { FileExplorer } from '../Editor/FileExplorer';
import { EditorTabBar } from '../Editor/EditorTabBar';
import { BreadcrumbBar } from '../Editor/BreadcrumbBar';
import { MonacoPane } from '../Editor/MonacoPane';
import { TerminalPanel } from '../Editor/TerminalPanel';
import { StatusBar } from '../Editor/StatusBar';
import { AuditReport } from '../AuditReport/AuditReport';
import { CodeSearch } from '../CodeSearch/CodeSearch';
import { Settings } from '../Settings/Settings';
import { AIChat } from './AIChat';
import { MenuBar } from '../Editor/MenuBar';
import { ExtensionsPanel } from '../Extensions/ExtensionsPanel';

export const Dashboard: React.FC = () => {
  const { panelLayout, currentView, isSidebarCollapsed, updatePanelLayout } = useAppStore();

  // Resizable sidebar
  const isResizingSidebar = useRef(false);
  const isResizingRight = useRef(false);

  const handleSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSidebar.current = true;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar.current) return;
      const newWidth = Math.min(500, Math.max(150, e.clientX - 48));
      updatePanelLayout({ sidebarWidth: newWidth });
    };
    const onMouseUp = () => {
      isResizingSidebar.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [updatePanelLayout]);

  const handleRightResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRight.current = true;

    const startX = e.clientX;
    const startWidth = panelLayout.rightPanelWidth;

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingRight.current) return;
      const delta = startX - e.clientX;
      const newWidth = Math.min(700, Math.max(240, startWidth + delta));
      updatePanelLayout({ rightPanelWidth: newWidth });
    };
    const onMouseUp = () => {
      isResizingRight.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [panelLayout.rightPanelWidth, updatePanelLayout]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw',
      background: 'var(--vscode-base)', color: 'var(--text-primary)',
      overflow: 'hidden',
    }}>
      {/* Menu Bar */}
      <MenuBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Activity Bar */}
        <ActivityBar />

        {/* Primary Sidebar (File Explorer) */}
        <AnimatePresence>
          {currentView === 'dashboard' && !isSidebarCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: panelLayout.sidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              style={{ flexShrink: 0, height: '100%', position: 'relative' }}
            >
              <div style={{ width: panelLayout.sidebarWidth, height: '100%', overflow: 'hidden' }}>
                <FileExplorer />
              </div>

              {/* Sidebar resize handle */}
              <div
                onMouseDown={handleSidebarResize}
                style={{
                  position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px',
                  cursor: 'col-resize', zIndex: 10,
                  background: 'transparent',
                  transition: 'background 80ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Editor Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--vscode-base)', overflow: 'hidden' }}>
          {currentView === 'dashboard' && (
            <>
              <EditorTabBar />
              <BreadcrumbBar />
            </>
          )}

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            {currentView === 'dashboard' && <MonacoPane />}
            {currentView === 'search' && <CodeSearch />}
            {currentView === 'audit' && <AuditReport />}
            {currentView === 'settings' && <Settings />}
            {currentView === 'landing' && <MonacoPane />}
            {currentView === 'extensions' && <ExtensionsPanel />}
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
              transition={{ type: 'spring', stiffness: 350, damping: 38 }}
              style={{ height: '100%', flexShrink: 0, position: 'relative' }}
            >
              {/* Right panel resize handle */}
              <div
                onMouseDown={handleRightResize}
                style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                  cursor: 'col-resize', zIndex: 10,
                  background: 'transparent',
                  transition: 'background 80ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              />
              <div style={{ width: '100%', height: '100%' }}>
                <AIChat />
              </div>
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
