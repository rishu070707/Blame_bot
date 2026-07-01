import React, { useState } from 'react';
import { Files, Search, GitBranch, Settings, Bot, LayoutGrid, Code2, BookOpen } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { AppView } from '../../types';

interface ActivityItem {
  id: string;
  view?: AppView;
  icon: React.ElementType;
  title: string;
  action?: () => void;
  isBottom?: boolean;
}

export const ActivityBar: React.FC = () => {
  const { currentView, setCurrentView, panelLayout, updatePanelLayout, createChatSession, activeChatSessionId } = useAppStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const topItems: ActivityItem[] = [
    { id: 'explorer', view: 'dashboard', icon: Files, title: 'Explorer (Ctrl+Shift+E)' },
    { id: 'search', view: 'search', icon: Search, title: 'Search (Ctrl+Shift+F)' },
    { id: 'source-control', view: 'audit', icon: GitBranch, title: 'Source Control / Audit' },
    { id: 'extensions', view: 'extensions', icon: LayoutGrid, title: 'Extensions (Ctrl+Shift+X)' },
  ];

  const bottomItems: ActivityItem[] = [
    {
      id: 'ai-chat',
      icon: Bot,
      title: 'BlameBot Copilot (Ctrl+I)',
      action: () => {
        if (!activeChatSessionId) {
          createChatSession();
        }
        updatePanelLayout({ rightPanelOpen: !panelLayout.rightPanelOpen });
      },
      isBottom: true,
    },
    { id: 'settings', view: 'settings', icon: Settings, title: 'Settings (Ctrl+,)', isBottom: true },
  ];

  const renderItem = (item: ActivityItem) => {
    const isViewActive = item.view && currentView === item.view;
    const isAiActive = item.id === 'ai-chat' && panelLayout.rightPanelOpen;
    const isActive = isViewActive || isAiActive;
    const isHovered = hoveredId === item.id;

    const handleClick = () => {
      if (item.action) {
        item.action();
      } else if (item.view) {
        setCurrentView(item.view);
      }
    };

    return (
      <div key={item.id} style={{ position: 'relative' }}>
        <button
          onClick={handleClick}
          title={item.title}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: isActive ? '#ffffff' : isHovered ? '#cccccc' : '#858585',
            position: 'relative',
            transition: 'color 80ms ease',
          }}
        >
          {/* Active indicator bar */}
          {isActive && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: '8px',
              bottom: '8px',
              width: '2px',
              background: 'var(--vscode-accent)',
              borderRadius: '0 1px 1px 0',
            }} />
          )}

          {/* AI active dot */}
          {item.id === 'ai-chat' && panelLayout.rightPanelOpen && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--success)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }} />
          )}

          <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
        </button>

        {/* Tooltip */}
        {isHovered && (
          <div style={{
            position: 'absolute',
            left: '52px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--vscode-widget)',
            border: '1px solid var(--vscode-border)',
            padding: '4px 8px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 99999,
            boxShadow: 'var(--shadow-raised)',
            borderRadius: '2px',
          }}>
            {item.title}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      width: '48px',
      height: '100%',
      background: 'var(--vscode-activity-bar)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      flexShrink: 0,
      borderRight: '1px solid rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {topItems.map(renderItem)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {bottomItems.map(renderItem)}
      </div>
    </div>
  );
};
