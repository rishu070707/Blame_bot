import React, { useRef } from 'react';
import { X, Circle } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { EditorTab } from '../../types';

const getFileColor = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['ts', 'tsx'].includes(ext)) return '#007acc';
  if (['js', 'jsx'].includes(ext)) return '#f1e05a';
  if (ext === 'py') return '#3572A5';
  if (ext === 'rs') return '#dea584';
  if (ext === 'go') return '#00add8';
  if (ext === 'css') return '#563d7c';
  if (ext === 'html') return '#e34c26';
  if (ext === 'md') return '#083fa1';
  if (['json', 'yaml', 'yml'].includes(ext)) return '#cbcb41';
  return '#cccccc';
};

export const EditorTabBar: React.FC = () => {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useAppStore();
  const tabBarRef = useRef<HTMLDivElement>(null);

  if (openTabs.length === 0) return null;

  const handleMiddleClick = (e: React.MouseEvent, tabId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      closeTab(tabId);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (tabBarRef.current) {
      e.preventDefault();
      tabBarRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      ref={tabBarRef}
      onWheel={handleWheel}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: '35px',
        background: 'var(--vscode-panel)',
        borderBottom: '1px solid var(--vscode-border)',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        scrollbarWidth: 'none',
      }}
    >
      <style>{`.tab-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      {openTabs.map((tab: EditorTab) => {
        const isActive = tab.id === activeTabId;
        const fileColor = getFileColor(tab.name);

        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseDown={(e) => handleMiddleClick(e, tab.id)}
            style={{
              height: '35px',
              minWidth: '120px',
              maxWidth: '200px',
              padding: '0 8px 0 12px',
              background: isActive ? 'var(--vscode-tab-active)' : 'var(--vscode-tab-inactive)',
              borderRight: '1px solid var(--vscode-border)',
              borderTop: isActive ? `1px solid ${fileColor}` : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              userSelect: 'none',
              gap: '6px',
              flexShrink: 0,
              transition: 'background 80ms ease',
              position: 'relative',
            }}
            onMouseOver={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-hover)';
                (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
              }
            }}
            onMouseOut={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-tab-inactive)';
                (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', flex: 1 }}>
              {/* File type color dot */}
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: fileColor, flexShrink: 0, opacity: isActive ? 1 : 0.6,
              }} />
              <span style={{
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontSize: '13px',
              }}>
                {tab.name}
              </span>
            </div>

            {/* Close / Dirty indicator */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              title="Close (Ctrl+W)"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                flexShrink: 0,
                width: '18px',
                height: '18px',
                opacity: tab.isDirty ? 1 : (isActive ? 1 : 0),
                transition: 'opacity 80ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {tab.isDirty
                ? <Circle size={8} fill="currentColor" style={{ color: 'var(--text-primary)' }} />
                : <X size={13} />
              }
            </button>
          </div>
        );
      })}

      {/* Trailing space */}
      <div style={{ flex: 1, height: '100%', borderBottom: 'none' }} />
    </div>
  );
};
