import React, { useState } from 'react';
import { GitBranch, AlertCircle, XCircle, Terminal, Bot, ChevronUp, Wifi, WifiOff, Loader } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { AnimatePresence, motion } from 'framer-motion';

const LANGUAGE_DISPLAY: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  rust: 'Rust',
  go: 'Go',
  java: 'Java',
  json: 'JSON',
  yaml: 'YAML',
  toml: 'TOML',
  css: 'CSS',
  html: 'HTML',
  sql: 'SQL',
  markdown: 'Markdown',
  unknown: 'Plain Text',
};

interface StatusItemProps {
  icon?: React.ReactNode;
  text: string;
  title?: string;
  onClick?: () => void;
  color?: string;
  className?: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ icon, text, title, onClick, color = 'inherit' }) => (
  <div
    onClick={onClick}
    title={title}
    style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      padding: '0 8px', height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      color, fontSize: '12px',
      transition: 'background 80ms ease',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => {
      if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.1)';
    }}
    onMouseLeave={(e) => {
      if (onClick) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
    }}
  >
    {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
    {text && <span>{text}</span>}
  </div>
);

export const StatusBar: React.FC = () => {
  const {
    ollamaStatus, activeModel, activeTabId, openTabs,
    panelLayout, updatePanelLayout, cursorPosition,
    projects, activeProjectId,
  } = useAppStore();

  const activeTab = openTabs.find(t => t.id === activeTabId);
  const activeProject = projects.find(p => p.id === activeProjectId);

  const lang = activeTab?.language;
  const langDisplay = lang ? (LANGUAGE_DISPLAY[lang] ?? lang) : 'Plain Text';

  const isConnected = ollamaStatus === 'connected' || ollamaStatus === 'streaming';
  const isStreaming = ollamaStatus === 'streaming';
  const isChecking = ollamaStatus === 'checking';
  const isError = ollamaStatus === 'error';

  const ollamaColor = isConnected ? '#89d185' : isError ? '#f14c4c' : '#cccccc';
  const ollamaText = isStreaming
    ? `$(loading~spin) ${activeModel}`
    : isChecking ? 'Connecting…'
    : isConnected ? activeModel
    : 'Ollama Offline';

  const ollamaIcon = isStreaming
    ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
    : isConnected ? <Bot size={11} />
    : <WifiOff size={11} />;

  return (
    <div style={{
      height: '22px',
      width: '100%',
      background: isError ? '#a12626' : 'var(--vscode-accent)',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      fontSize: '12px',
      userSelect: 'none',
    }}>
      {/* Left side */}
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        <StatusItem
          icon={<GitBranch size={12} />}
          text={activeProject ? 'main' : ''}
          title="Source Control Branch"
          onClick={() => useAppStore.getState().setCurrentView('audit')}
        />
        <StatusItem icon={<XCircle size={11} />} text="0" title="Errors" />
        <StatusItem icon={<AlertCircle size={11} />} text="0" title="Warnings" />
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        {/* AI Copilot Status */}
        <StatusItem
          icon={ollamaIcon}
          text={ollamaText}
          title={`BlameBot AI — ${ollamaStatus}`}
          color={ollamaColor}
          onClick={() => useAppStore.getState().setCurrentView('settings')}
        />

        {/* Cursor position */}
        {activeTab && (
          <>
            <div style={{ width: '1px', height: '60%', background: 'rgba(255,255,255,0.2)' }} />
            <StatusItem
              text={`Ln ${cursorPosition.line}, Col ${cursorPosition.column}`}
              title="Go to Line/Column"
              onClick={() => {}}
            />
            <div style={{ width: '1px', height: '60%', background: 'rgba(255,255,255,0.2)' }} />
            <StatusItem text="UTF-8" title="Select Encoding" onClick={() => {}} />
            <div style={{ width: '1px', height: '60%', background: 'rgba(255,255,255,0.2)' }} />
            <StatusItem text="CRLF" title="Select End of Line Sequence" onClick={() => {}} />
            <div style={{ width: '1px', height: '60%', background: 'rgba(255,255,255,0.2)' }} />
            <StatusItem
              text={langDisplay}
              title="Select Language Mode"
              onClick={() => {}}
            />
            <div style={{ width: '1px', height: '60%', background: 'rgba(255,255,255,0.2)' }} />
            <StatusItem text="Spaces: 2" title="Select Indentation" onClick={() => {}} />
          </>
        )}

        <div style={{ width: '1px', height: '60%', background: 'rgba(255,255,255,0.2)' }} />

        {/* Terminal toggle */}
        <StatusItem
          icon={<Terminal size={12} />}
          text=""
          title="Toggle Terminal (Ctrl+`)"
          onClick={() => updatePanelLayout({ terminalOpen: !panelLayout.terminalOpen })}
        />

        {/* Notifications bell */}
        <StatusItem
          icon={<ChevronUp size={12} />}
          text=""
          title="No Problems"
          onClick={() => {}}
        />
      </div>
    </div>
  );
};
