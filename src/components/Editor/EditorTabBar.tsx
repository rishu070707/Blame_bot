import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { EditorTab } from '../../types';

export const EditorTabBar: React.FC = () => {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useAppStore();

  if (openTabs.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      height: '35px',
      background: 'var(--vscode-panel)',
      borderBottom: '1px solid var(--vscode-border)',
      overflowX: 'auto',
      overflowY: 'hidden',
    }}>
      {openTabs.map((tab: EditorTab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              height: '35px',
              minWidth: '120px',
              maxWidth: '200px',
              padding: '0 10px 0 16px',
              background: isActive ? 'var(--vscode-tab-active)' : 'var(--vscode-tab-inactive)',
              borderRight: '1px solid var(--vscode-border)',
              borderTop: isActive ? '1px solid var(--vscode-accent)' : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              userSelect: 'none',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab.name}
              </span>
              {tab.isDirty && (
                <div style={{
                  width: '8px', height: '8px',
                  borderRadius: '50%',
                  background: 'var(--text-primary)',
                  flexShrink: 0,
                }} />
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderRadius = '4px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
