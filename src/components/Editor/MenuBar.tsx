import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScanner } from '../../hooks/useScanner';
import { useAppStore } from '../../store/appStore';

const MENU_ITEMS = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'];

export const MenuBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openAndScanProject } = useScanner();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (item: string) => {
    setActiveMenu(activeMenu === item ? null : item);
  };

  const handleMouseEnter = (item: string) => {
    if (activeMenu) setActiveMenu(item);
  };

  return (
    <div
      data-tauri-drag-region
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '30px',
        backgroundColor: 'var(--vscode-title-bar)',
        color: 'var(--text-secondary)',
        fontSize: '13px',
        userSelect: 'none',
        flexShrink: 0,
        position: 'relative',
        zIndex: 9999,
      }}
    >
      {/* App Icon / Logo Placeholder */}
      <div 
        style={{ 
          padding: '0 12px', 
          display: 'flex', 
          alignItems: 'center', 
          color: 'var(--vscode-accent)',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontSize: '18px', marginRight: '6px' }}>⚛</span>
      </div>

      {/* Menu Items */}
      <div style={{ display: 'flex', alignItems: 'center' }} ref={menuRef}>
        {MENU_ITEMS.map((item) => (
          <div key={item} style={{ position: 'relative' }}>
            <div
              onClick={() => handleMenuClick(item)}
              onMouseEnter={() => handleMouseEnter(item)}
              style={{
                padding: '0 8px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: '4px',
                margin: '0 2px',
                backgroundColor: activeMenu === item ? 'var(--vscode-selection)' : 'transparent',
                color: activeMenu === item ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              onMouseOver={(e) => {
                if (activeMenu !== item) {
                  e.currentTarget.style.backgroundColor = 'var(--vscode-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseOut={(e) => {
                if (activeMenu !== item) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {item}
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {activeMenu === item && item === 'File' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.1 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: 'var(--vscode-panel)',
                    border: '1px solid var(--vscode-border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    padding: '4px 0',
                    minWidth: '220px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <MenuItem label="New File..." shortcut="Ctrl+N" />
                  <MenuItem label="New Window" shortcut="Ctrl+Shift+N" />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem 
                    label="Open Folder..." 
                    shortcut="Ctrl+K Ctrl+O" 
                    onClick={() => {
                      setActiveMenu(null);
                      openAndScanProject();
                    }} 
                  />
                  <MenuItem label="Open Workspace from File..." />
                  <MenuItem label="Open Recent" hasSubmenu />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem label="Save" shortcut="Ctrl+S" />
                  <MenuItem label="Save As..." shortcut="Ctrl+Shift+S" />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem label="Exit" shortcut="Alt+F4" />
                </motion.div>
              )}
              {/* Edit Menu */}
              {activeMenu === item && item === 'Edit' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.1 }}
                  style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: 'var(--vscode-panel)', border: '1px solid var(--vscode-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0', minWidth: '200px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}
                >
                  <MenuItem label="Undo" shortcut="Ctrl+Z" onClick={() => { document.execCommand('undo'); setActiveMenu(null); }} />
                  <MenuItem label="Redo" shortcut="Ctrl+Y" onClick={() => { document.execCommand('redo'); setActiveMenu(null); }} />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem label="Cut" shortcut="Ctrl+X" onClick={() => { document.execCommand('cut'); setActiveMenu(null); }} />
                  <MenuItem label="Copy" shortcut="Ctrl+C" onClick={() => { document.execCommand('copy'); setActiveMenu(null); }} />
                  <MenuItem label="Paste" shortcut="Ctrl+V" onClick={() => { document.execCommand('paste'); setActiveMenu(null); }} />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem label="Find" shortcut="Ctrl+F" onClick={() => setActiveMenu(null)} />
                  <MenuItem label="Replace" shortcut="Ctrl+H" onClick={() => setActiveMenu(null)} />
                </motion.div>
              )}

              {/* Selection Menu */}
              {activeMenu === item && item === 'Selection' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.1 }}
                  style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: 'var(--vscode-panel)', border: '1px solid var(--vscode-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0', minWidth: '200px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}
                >
                  <MenuItem label="Select All" shortcut="Ctrl+A" onClick={() => { document.execCommand('selectAll'); setActiveMenu(null); }} />
                  <MenuItem label="Expand Selection" shortcut="Shift+Alt+Right" onClick={() => setActiveMenu(null)} />
                  <MenuItem label="Shrink Selection" shortcut="Shift+Alt+Left" onClick={() => setActiveMenu(null)} />
                </motion.div>
              )}

              {/* View Menu */}
              {activeMenu === item && item === 'View' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.1 }}
                  style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: 'var(--vscode-panel)', border: '1px solid var(--vscode-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0', minWidth: '220px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}
                >
                  <MenuItem label="Dashboard" onClick={() => { useAppStore.getState().setCurrentView('dashboard'); setActiveMenu(null); }} />
                  <MenuItem label="Audit Reports" onClick={() => { useAppStore.getState().setCurrentView('audit'); setActiveMenu(null); }} />
                  <MenuItem label="Search" shortcut="Ctrl+Shift+F" onClick={() => { useAppStore.getState().setCurrentView('search'); setActiveMenu(null); }} />
                  <MenuItem label="Settings" onClick={() => { useAppStore.getState().setCurrentView('settings'); setActiveMenu(null); }} />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem label="Toggle Sidebar" shortcut="Ctrl+B" onClick={() => { useAppStore.getState().toggleSidebar(); setActiveMenu(null); }} />
                  <MenuItem label="Toggle Terminal" shortcut="Ctrl+`" onClick={() => { 
                    const store = useAppStore.getState();
                    store.updatePanelLayout({ terminalOpen: !store.panelLayout.terminalOpen });
                    setActiveMenu(null);
                  }} />
                  <MenuItem label="Command Palette" shortcut="Ctrl+Shift+P" onClick={() => { useAppStore.getState().openCommandBar(); setActiveMenu(null); }} />
                </motion.div>
              )}

              {/* Go Menu */}
              {activeMenu === item && item === 'Go' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.1 }}
                  style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: 'var(--vscode-panel)', border: '1px solid var(--vscode-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0', minWidth: '200px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}
                >
                  <MenuItem label="Go to File..." shortcut="Ctrl+P" onClick={() => { useAppStore.getState().openCommandBar(); setActiveMenu(null); }} />
                  <MenuItem label="Go to Symbol in Workspace..." shortcut="Ctrl+T" onClick={() => setActiveMenu(null)} />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem label="Go to Line/Column..." shortcut="Ctrl+G" onClick={() => setActiveMenu(null)} />
                </motion.div>
              )}

              {/* Run Menu */}
              {activeMenu === item && item === 'Run' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.1 }}
                  style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: 'var(--vscode-panel)', border: '1px solid var(--vscode-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0', minWidth: '220px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}
                >
                  <MenuItem label="Start Debugging" shortcut="F5" onClick={() => setActiveMenu(null)} />
                  <MenuItem label="Run Without Debugging" shortcut="Ctrl+F5" onClick={() => setActiveMenu(null)} />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem label="Run Security Audit" onClick={() => { useAppStore.getState().setCurrentView('audit'); setActiveMenu(null); }} />
                  <MenuItem label="Run Performance Audit" onClick={() => { useAppStore.getState().setCurrentView('audit'); setActiveMenu(null); }} />
                </motion.div>
              )}

              {/* Terminal Menu */}
              {activeMenu === item && item === 'Terminal' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.1 }}
                  style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: 'var(--vscode-panel)', border: '1px solid var(--vscode-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0', minWidth: '200px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}
                >
                  <MenuItem label="New Terminal" shortcut="Ctrl+Shift+`" onClick={() => {
                    const store = useAppStore.getState();
                    const id = `term-${Date.now()}`;
                    store.addTerminal({ id, title: 'cmd', output: ['Microsoft Windows [Version 10.0]', '(c) Microsoft Corporation. All rights reserved.', '', `C:\\Project>`] });
                    store.updatePanelLayout({ terminalOpen: true });
                    setActiveMenu(null);
                  }} />
                  <MenuItem label="Split Terminal" onClick={() => setActiveMenu(null)} />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem label="Run Task..." onClick={() => setActiveMenu(null)} />
                  <MenuItem label="Clear Terminal" onClick={() => {
                     const store = useAppStore.getState();
                     if (store.activeTerminalId) {
                       store.updatePanelLayout({ terminalOpen: false });
                     }
                     setActiveMenu(null);
                  }} />
                </motion.div>
              )}

              {/* Help Menu */}
              {activeMenu === item && item === 'Help' && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.1 }}
                  style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: 'var(--vscode-panel)', border: '1px solid var(--vscode-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0', minWidth: '200px', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}
                >
                  <MenuItem label="Welcome" onClick={() => { useAppStore.getState().setCurrentView('landing'); setActiveMenu(null); }} />
                  <MenuItem label="Keyboard Shortcuts" shortcut="Ctrl+K Ctrl+S" onClick={() => setActiveMenu(null)} />
                  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
                  <MenuItem label="About BlameBot" onClick={() => setActiveMenu(null)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Spacer for Window Dragging */}
      <div style={{ flex: 1, height: '100%' }} data-tauri-drag-region />
      
      {/* Search / Title Area */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', pointerEvents: 'none', color: 'var(--text-muted)' }}>
        BlameBot Editor
      </div>
    </div>
  );
};

// ─── MenuItem Helper ──────────────────────────────────────────

interface MenuItemProps {
  label: string;
  shortcut?: string;
  hasSubmenu?: boolean;
  onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, shortcut, hasSubmenu, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 24px 6px 32px',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        fontSize: '13px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--vscode-accent)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
    >
      <span>{label}</span>
      {shortcut && <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '24px' }}>{shortcut}</span>}
      {hasSubmenu && <span style={{ marginLeft: '16px' }}>▶</span>}
    </div>
  );
};
