import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScanner } from '../../hooks/useScanner';
import { useAppStore } from '../../store/appStore';
import { Minus, Square, X, Search, ChevronRight } from 'lucide-react';

// ─── Window Controls (Tauri) ──────────────────────────────────

const WindowControls: React.FC = () => {
  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch { }
  };
  const handleMaximize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch { }
  };
  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch { }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} data-no-drag>
      <button className="window-control-btn" onClick={handleMinimize} title="Minimize" aria-label="Minimize">
        <Minus size={12} />
      </button>
      <button className="window-control-btn" onClick={handleMaximize} title="Maximize" aria-label="Maximize">
        <Square size={11} />
      </button>
      <button className="window-control-btn close" onClick={handleClose} title="Close" aria-label="Close">
        <X size={12} />
      </button>
    </div>
  );
};

// ─── Menu Items ───────────────────────────────────────────────

const MENU_ITEMS = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'];

// ─── MenuItem Component ───────────────────────────────────────

interface MenuItemProps {
  label: string;
  shortcut?: string;
  hasSubmenu?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, shortcut, hasSubmenu, disabled, onClick }) => (
  <div
    onClick={disabled ? undefined : onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '5px 24px 5px 28px',
      cursor: disabled ? 'default' : 'pointer',
      color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
      fontSize: '13px',
      gap: '24px',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = 'var(--vscode-list-active)';
        e.currentTarget.style.color = '#fff';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = disabled ? 'var(--text-muted)' : 'var(--text-primary)';
    }}
  >
    <span>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      {shortcut && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{shortcut}</span>}
      {hasSubmenu && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
    </div>
  </div>
);

const MenuSep: React.FC = () => (
  <div style={{ height: '1px', backgroundColor: 'var(--vscode-border)', margin: '4px 0' }} />
);

const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.08 }}
    style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      backgroundColor: 'var(--vscode-widget)',
      border: '1px solid var(--vscode-border)',
      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
      padding: '4px 0',
      minWidth: '230px',
      borderRadius: '2px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
    }}
  >
    {children}
  </motion.div>
);

// ─── Main MenuBar ─────────────────────────────────────────────

export const MenuBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openAndScanProject } = useScanner();
  const { projects, activeProjectId, openCommandBar, updatePanelLayout, panelLayout, setCurrentView } = useAppStore();
  const activeProject = projects.find(p => p.id === activeProjectId);

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

  const closeMenu = () => setActiveMenu(null);

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
      {/* App Icon */}
      <div
        style={{
          padding: '0 10px',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--vscode-accent)',
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
          <path d="M74.5 3L95 25.5V75L74.5 97H25.5L5 75V25.5L25.5 3H74.5Z" fill="#007ACC" />
          <path d="M38 67L62 33M38 33L62 67" stroke="white" strokeWidth="8" strokeLinecap="round" />
        </svg>
      </div>

      {/* Menu Items */}
      <div style={{ display: 'flex', alignItems: 'center' }} ref={menuRef} data-no-drag>
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
                borderRadius: '2px',
                backgroundColor: activeMenu === item ? 'var(--vscode-selection)' : 'transparent',
                color: activeMenu === item ? '#fff' : 'var(--text-secondary)',
              }}
              onMouseOver={(e) => {
                if (activeMenu !== item) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
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

            <AnimatePresence>
              {/* File Menu */}
              {activeMenu === item && item === 'File' && (
                <DropdownMenu>
                  <MenuItem label="New File" shortcut="Ctrl+N" onClick={closeMenu} />
                  <MenuItem label="New Window" shortcut="Ctrl+Shift+N" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Open File…" shortcut="Ctrl+O" onClick={closeMenu} />
                  <MenuItem label="Open Folder…" shortcut="Ctrl+K Ctrl+O" onClick={() => { closeMenu(); openAndScanProject(); }} />
                  <MenuItem label="Open Recent" hasSubmenu onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Save" shortcut="Ctrl+S" onClick={closeMenu} />
                  <MenuItem label="Save As…" shortcut="Ctrl+Shift+S" onClick={closeMenu} />
                  <MenuItem label="Save All" shortcut="Ctrl+K S" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Auto Save" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Close Editor" shortcut="Ctrl+W" onClick={closeMenu} />
                  <MenuItem label="Close Folder" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Exit" shortcut="Alt+F4" onClick={closeMenu} />
                </DropdownMenu>
              )}

              {/* Edit Menu */}
              {activeMenu === item && item === 'Edit' && (
                <DropdownMenu>
                  <MenuItem label="Undo" shortcut="Ctrl+Z" onClick={() => { document.execCommand('undo'); closeMenu(); }} />
                  <MenuItem label="Redo" shortcut="Ctrl+Y" onClick={() => { document.execCommand('redo'); closeMenu(); }} />
                  <MenuSep />
                  <MenuItem label="Cut" shortcut="Ctrl+X" onClick={() => { document.execCommand('cut'); closeMenu(); }} />
                  <MenuItem label="Copy" shortcut="Ctrl+C" onClick={() => { document.execCommand('copy'); closeMenu(); }} />
                  <MenuItem label="Paste" shortcut="Ctrl+V" onClick={() => { document.execCommand('paste'); closeMenu(); }} />
                  <MenuSep />
                  <MenuItem label="Find" shortcut="Ctrl+F" onClick={closeMenu} />
                  <MenuItem label="Replace" shortcut="Ctrl+H" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Find in Files" shortcut="Ctrl+Shift+F" onClick={() => { setCurrentView('search'); closeMenu(); }} />
                </DropdownMenu>
              )}

              {/* Selection Menu */}
              {activeMenu === item && item === 'Selection' && (
                <DropdownMenu>
                  <MenuItem label="Select All" shortcut="Ctrl+A" onClick={() => { document.execCommand('selectAll'); closeMenu(); }} />
                  <MenuSep />
                  <MenuItem label="Expand Selection" shortcut="Shift+Alt+→" onClick={closeMenu} />
                  <MenuItem label="Shrink Selection" shortcut="Shift+Alt+←" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Add Cursor Above" shortcut="Ctrl+Alt+↑" onClick={closeMenu} />
                  <MenuItem label="Add Cursor Below" shortcut="Ctrl+Alt+↓" onClick={closeMenu} />
                  <MenuItem label="Add Cursors to Line Ends" shortcut="Shift+Alt+I" onClick={closeMenu} />
                </DropdownMenu>
              )}

              {/* View Menu */}
              {activeMenu === item && item === 'View' && (
                <DropdownMenu>
                  <MenuItem label="Command Palette…" shortcut="Ctrl+Shift+P" onClick={() => { openCommandBar(); closeMenu(); }} />
                  <MenuItem label="Open View…" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Explorer" shortcut="Ctrl+Shift+E" onClick={() => { setCurrentView('dashboard'); closeMenu(); }} />
                  <MenuItem label="Search" shortcut="Ctrl+Shift+F" onClick={() => { setCurrentView('search'); closeMenu(); }} />
                  <MenuItem label="Audit Reports" onClick={() => { setCurrentView('audit'); closeMenu(); }} />
                  <MenuItem label="Settings" shortcut="Ctrl+," onClick={() => { setCurrentView('settings'); closeMenu(); }} />
                  <MenuSep />
                  <MenuItem label="Toggle Sidebar" shortcut="Ctrl+B" onClick={() => { useAppStore.getState().toggleSidebar(); closeMenu(); }} />
                  <MenuItem label="Toggle AI Chat" shortcut="Ctrl+I" onClick={() => {
                    const s = useAppStore.getState();
                    s.updatePanelLayout({ rightPanelOpen: !s.panelLayout.rightPanelOpen });
                    closeMenu();
                  }} />
                  <MenuItem label="Toggle Terminal" shortcut="Ctrl+`" onClick={() => {
                    updatePanelLayout({ terminalOpen: !panelLayout.terminalOpen });
                    closeMenu();
                  }} />
                  <MenuSep />
                  <MenuItem label="Zoom In" shortcut="Ctrl+=" onClick={closeMenu} />
                  <MenuItem label="Zoom Out" shortcut="Ctrl+-" onClick={closeMenu} />
                  <MenuItem label="Reset Zoom" shortcut="Ctrl+0" onClick={closeMenu} />
                </DropdownMenu>
              )}

              {/* Go Menu */}
              {activeMenu === item && item === 'Go' && (
                <DropdownMenu>
                  <MenuItem label="Go to File…" shortcut="Ctrl+P" onClick={() => { openCommandBar(); closeMenu(); }} />
                  <MenuItem label="Go to Symbol in Workspace…" shortcut="Ctrl+T" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Go to Line/Column…" shortcut="Ctrl+G" onClick={closeMenu} />
                  <MenuItem label="Go to Definition" shortcut="F12" onClick={closeMenu} />
                  <MenuItem label="Go to References" shortcut="Shift+F12" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Go Back" shortcut="Alt+←" onClick={closeMenu} />
                  <MenuItem label="Go Forward" shortcut="Alt+→" onClick={closeMenu} />
                </DropdownMenu>
              )}

              {/* Run Menu */}
              {activeMenu === item && item === 'Run' && (
                <DropdownMenu>
                  <MenuItem label="Start Debugging" shortcut="F5" onClick={closeMenu} />
                  <MenuItem label="Run Without Debugging" shortcut="Ctrl+F5" onClick={closeMenu} />
                  <MenuItem label="Stop Debugging" shortcut="Shift+F5" onClick={closeMenu} disabled />
                  <MenuSep />
                  <MenuItem label="Run Security Audit" onClick={() => { setCurrentView('audit'); closeMenu(); }} />
                  <MenuItem label="Run Performance Audit" onClick={() => { setCurrentView('audit'); closeMenu(); }} />
                </DropdownMenu>
              )}

              {/* Terminal Menu */}
              {activeMenu === item && item === 'Terminal' && (
                <DropdownMenu>
                  <MenuItem label="New Terminal" shortcut="Ctrl+Shift+`" onClick={() => {
                    const store = useAppStore.getState();
                    const id = `term-${Date.now()}`;
                    const cwd = store.projects.find(p => p.id === store.activeProjectId)?.path ?? 'C:\\';
                    store.addTerminal({ id, title: 'pwsh', cwd, history: [], output: [`PowerShell  BlameBot Terminal`, `Working directory: ${cwd}`, ''] });
                    closeMenu();
                  }} />
                  <MenuItem label="Split Terminal" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Run Task…" onClick={closeMenu} />
                  <MenuItem label="Run Active File" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Clear Terminal" onClick={() => {
                    const store = useAppStore.getState();
                    if (store.activeTerminalId) {
                      const cwd = store.terminals.find(t => t.id === store.activeTerminalId)?.cwd ?? '';
                      store.appendTerminalOutput(store.activeTerminalId, '\x1bc');
                    }
                    closeMenu();
                  }} />
                </DropdownMenu>
              )}

              {/* Help Menu */}
              {activeMenu === item && item === 'Help' && (
                <DropdownMenu>
                  <MenuItem label="Welcome" onClick={() => { setCurrentView('landing'); closeMenu(); }} />
                  <MenuItem label="Show All Commands" shortcut="Ctrl+Shift+P" onClick={() => { openCommandBar(); closeMenu(); }} />
                  <MenuItem label="Keyboard Shortcuts" shortcut="Ctrl+K Ctrl+S" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="Check for Updates…" onClick={closeMenu} />
                  <MenuSep />
                  <MenuItem label="About BlameBot" onClick={closeMenu} />
                </DropdownMenu>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Centered Search/Title */}
      <div
        data-no-drag
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '4px',
          padding: '2px 10px',
          cursor: 'pointer',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          minWidth: '320px',
          justifyContent: 'center',
          transition: 'background var(--transition-fast)',
        }}
        onClick={openCommandBar}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        }}
      >
        <Search size={11} />
        <span>{activeProject ? activeProject.name : 'BlameBot'}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>Ctrl+P</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} data-tauri-drag-region />

      {/* Window Controls */}
      <WindowControls />
    </div>
  );
};
