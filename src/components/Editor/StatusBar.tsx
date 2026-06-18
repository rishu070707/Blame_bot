import React from 'react';
import { GitBranch, AlertCircle, XCircle, Terminal, Bot } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export const StatusBar: React.FC = () => {
  const { ollamaStatus, activeTabId, openTabs, panelLayout, updatePanelLayout } = useAppStore();
  const activeTab = openTabs.find(t => t.id === activeTabId);

  const StatusItem = ({ icon: Icon, text, onClick, color = 'inherit' }: { icon?: any, text: string, onClick?: () => void, color?: string }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '0 8px',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        color,
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.background = 'transparent';
      }}
    >
      {Icon && <Icon size={12} />}
      <span style={{ fontSize: '11px' }}>{text}</span>
    </div>
  );

  return (
    <div style={{
      height: '22px',
      width: '100%',
      background: 'var(--vscode-accent)',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <StatusItem icon={GitBranch} text="main" />
        <StatusItem icon={XCircle} text="0" />
        <StatusItem icon={AlertCircle} text="0" />
      </div>

      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <StatusItem 
          icon={Bot} 
          text={ollamaStatus === 'streaming' ? 'BlameBot is typing...' : (ollamaStatus === 'connected' ? 'BlameBot Ready' : 'BlameBot Offline')} 
        />
        {activeTab && (
          <>
            <StatusItem text="Ln 1, Col 1" />
            <StatusItem text="UTF-8" />
            <StatusItem text={activeTab.language || 'plaintext'} />
          </>
        )}
        <StatusItem 
          icon={Terminal} 
          text="" 
          onClick={() => updatePanelLayout({ terminalOpen: !panelLayout.terminalOpen })} 
        />
      </div>
    </div>
  );
};
