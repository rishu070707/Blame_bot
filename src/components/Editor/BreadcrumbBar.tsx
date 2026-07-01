import React from 'react';
import { ChevronRight, FileCode, FileText, FileJson, Folder } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['ts', 'tsx'].includes(ext)) return <span style={{ color: '#007acc', fontSize: '11px', fontWeight: 700 }}>TS</span>;
  if (['js', 'jsx'].includes(ext)) return <span style={{ color: '#f1e05a', fontSize: '11px', fontWeight: 700 }}>JS</span>;
  if (ext === 'py') return <FileCode size={12} style={{ color: '#3572A5' }} />;
  if (ext === 'rs') return <FileCode size={12} style={{ color: '#dea584' }} />;
  if (ext === 'go') return <FileCode size={12} style={{ color: '#00add8' }} />;
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return <FileJson size={12} style={{ color: '#cbcb41' }} />;
  if (ext === 'css') return <FileCode size={12} style={{ color: '#563d7c' }} />;
  if (ext === 'html') return <FileCode size={12} style={{ color: '#e34c26' }} />;
  if (ext === 'md') return <FileText size={12} style={{ color: '#083fa1' }} />;
  return <FileText size={12} style={{ color: '#858585' }} />;
};

export const BreadcrumbBar: React.FC = () => {
  const { openTabs, activeTabId, projects, activeProjectId } = useAppStore();
  const activeTab = openTabs.find(t => t.id === activeTabId);
  const activeProject = projects.find(p => p.id === activeProjectId);

  if (!activeTab) return null;

  // Build breadcrumb parts from path
  const buildParts = (): { label: string; isFile: boolean }[] => {
    let relativePath = activeTab.path;

    if (activeProject) {
      const norm = (p: string) => p.replace(/\\/g, '/');
      const projPath = norm(activeProject.path);
      const filePath = norm(relativePath);
      if (filePath.startsWith(projPath)) {
        relativePath = filePath.substring(projPath.length).replace(/^\//, '');
      } else {
        relativePath = filePath;
      }
    }

    const segments = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
    return segments.map((seg, i) => ({ label: seg, isFile: i === segments.length - 1 }));
  };

  const parts = buildParts();

  return (
    <div
      className="breadcrumb-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '22px',
        background: 'var(--vscode-base)',
        borderBottom: '1px solid var(--vscode-border)',
        padding: '0 10px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        gap: '2px',
        overflow: 'hidden',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* Project name */}
      {activeProject && (
        <>
          <div
            className="breadcrumb-item"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              cursor: 'pointer', padding: '1px 4px', borderRadius: '2px',
              whiteSpace: 'nowrap', color: 'var(--text-secondary)',
              transition: 'color 80ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--vscode-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Folder size={12} style={{ color: 'var(--icon-folder)', flexShrink: 0 }} />
            <span>{activeProject.name}</span>
          </div>
          {parts.length > 0 && (
            <ChevronRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          )}
        </>
      )}

      {/* Path segments */}
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <div
            className="breadcrumb-item"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              cursor: 'pointer', padding: '1px 4px', borderRadius: '2px',
              whiteSpace: 'nowrap',
              color: part.isFile ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: part.isFile ? 400 : 400,
              transition: 'color 80ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--vscode-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = part.isFile ? 'var(--text-primary)' : 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {part.isFile ? (
              <>
                {getFileIcon(part.label)}
                <span>{part.label}</span>
              </>
            ) : (
              <>
                <Folder size={12} style={{ color: 'var(--icon-folder)', flexShrink: 0 }} />
                <span>{part.label}</span>
              </>
            )}
          </div>
          {i < parts.length - 1 && (
            <ChevronRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
