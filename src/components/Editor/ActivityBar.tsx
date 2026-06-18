import React from 'react';
import { Files, Search, GitBranch, Settings, LayoutTemplate } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { AppView } from '../../types';

export const ActivityBar: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();

  const IconBtn = ({ view, icon: Icon, title }: { view: AppView, icon: any, title: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => setCurrentView(view)}
        title={title}
        style={{
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: isActive ? '#ffffff' : '#858585',
          position: 'relative',
        }}
      >
        {isActive && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2px', background: 'var(--vscode-accent)' }} />
        )}
        <Icon size={24} strokeWidth={1.5} />
      </button>
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
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <IconBtn view="dashboard" icon={Files} title="Explorer" />
        <IconBtn view="search" icon={Search} title="Search" />
        <IconBtn view="audit" icon={GitBranch} title="Source Control / Audit" />
        <IconBtn view="landing" icon={LayoutTemplate} title="Projects" />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <IconBtn view="settings" icon={Settings} title="Settings" />
      </div>
    </div>
  );
};
