import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight, ChevronDown, FileCode, FileText, FileJson, Image,
  Folder, FolderOpen, Plus, RefreshCw, FilePlus, FolderPlus,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { IndexedFile } from '../../types';
import { readFileContent } from '../../services/tauriService';
import { useScanner } from '../../hooks/useScanner';
import { Button } from '../ui';

// ─── Tree Node Structure ──────────────────────────────────────

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: Record<string, TreeNode>;
  file?: IndexedFile;
}

function buildTree(files: IndexedFile[], projectPath: string): TreeNode {
  const root: TreeNode = { name: 'root', path: projectPath, isDir: true, children: {} };
  const norm = (p: string) => p.replace(/\\/g, '/');
  const normProject = norm(projectPath);

  for (const file of files) {
    const normFile = norm(file.path);
    let relativePath = normFile.startsWith(normProject)
      ? normFile.substring(normProject.length).replace(/^\//, '')
      : normFile;
    if (!relativePath) continue;

    const parts = relativePath.split('/');
    let current = root;
    let currentPath = projectPath;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      currentPath = currentPath.replace(/\\/g, '/') + '/' + part;
      const isFile = i === parts.length - 1;
      if (!current.children[part]) {
        current.children[part] = {
          name: part, path: currentPath, isDir: !isFile,
          children: {}, file: isFile ? file : undefined,
        };
      }
      current = current.children[part];
    }
  }
  return root;
}

// ─── File Icon ────────────────────────────────────────────────

const getFileIcon = (name: string, size = 14) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['ts', 'tsx'].includes(ext)) return <span style={{ color: '#007acc', fontSize: '11px', fontWeight: 700, lineHeight: 1 }}>TS</span>;
  if (['js', 'jsx'].includes(ext)) return <span style={{ color: '#f1e05a', fontSize: '11px', fontWeight: 700, lineHeight: 1 }}>JS</span>;
  if (ext === 'py') return <FileCode size={size} style={{ color: '#3572A5' }} />;
  if (ext === 'rs') return <FileCode size={size} style={{ color: '#dea584' }} />;
  if (ext === 'go') return <FileCode size={size} style={{ color: '#00add8' }} />;
  if (ext === 'java') return <FileCode size={size} style={{ color: '#b07219' }} />;
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) return <FileJson size={size} style={{ color: '#cbcb41' }} />;
  if (ext === 'css') return <FileCode size={size} style={{ color: '#563d7c' }} />;
  if (ext === 'html') return <FileCode size={size} style={{ color: '#e34c26' }} />;
  if (ext === 'md') return <FileText size={size} style={{ color: '#083fa1' }} />;
  if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'ico'].includes(ext)) return <Image size={size} style={{ color: '#a074c4' }} />;
  if (['sql'].includes(ext)) return <FileCode size={size} style={{ color: '#e38c00' }} />;
  return <FileText size={size} style={{ color: '#858585' }} />;
};

// ─── Context Menu ─────────────────────────────────────────────

interface ContextMenuProps {
  x: number; y: number;
  node: TreeNode;
  onClose: () => void;
  onOpenInEditor: () => void;
  onCopyPath: () => void;
  onCopyRelativePath: () => void;
  onRevealInExplorer: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, node, onClose, onOpenInEditor, onCopyPath, onCopyRelativePath, onRevealInExplorer }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const MenuItem = ({ label, shortcut, disabled, onClick }: { label: string; shortcut?: string; disabled?: boolean; onClick?: () => void }) => (
    <div
      className={`context-menu-item${disabled ? ' disabled' : ''}`}
      onClick={disabled ? undefined : () => { onClick?.(); onClose(); }}
    >
      <span>{label}</span>
      {shortcut && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '16px' }}>{shortcut}</span>}
    </div>
  );

  // Adjust position if near screen edge
  const adjustedX = x + 220 > window.innerWidth ? x - 220 : x;
  const adjustedY = y + 300 > window.innerHeight ? y - 200 : y;

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {!node.isDir && (
        <>
          <MenuItem label="Open" onClick={onOpenInEditor} />
          <MenuItem label="Open to the Side" />
          <div className="context-menu-separator" />
        </>
      )}
      <MenuItem label="Copy Path" shortcut="Shift+Alt+C" onClick={onCopyPath} />
      <MenuItem label="Copy Relative Path" shortcut="Ctrl+K Ctrl+Shift+C" onClick={onCopyRelativePath} />
      <div className="context-menu-separator" />
      <MenuItem label="Reveal in File Explorer" onClick={onRevealInExplorer} />
      <div className="context-menu-separator" />
      <MenuItem label="New File…" />
      <MenuItem label="New Folder…" />
      <div className="context-menu-separator" />
      <MenuItem label="Cut" shortcut="Ctrl+X" disabled />
      <MenuItem label="Copy" shortcut="Ctrl+C" disabled />
      <MenuItem label="Paste" shortcut="Ctrl+V" disabled />
      <div className="context-menu-separator" />
      <MenuItem label="Rename…" shortcut="F2" disabled />
      <MenuItem label="Delete" shortcut="Delete" disabled />
    </div>
  );
};

// ─── Tree Node Component ──────────────────────────────────────

const FileTreeNode: React.FC<{
  node: TreeNode;
  depth: number;
  projectPath: string;
}> = ({ node, depth, projectPath }) => {
  const { expandedDirs, toggleDirExpanded, openTab, activeTabId } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const isExpanded = expandedDirs.has(node.path);
  const isActive = !node.isDir && activeTabId === node.file?.path;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isDir) {
      toggleDirExpanded(node.path);
    } else if (node.file) {
      openInEditor();
    }
  };

  const openInEditor = async () => {
    if (!node.file) return;
    try {
      const content = await readFileContent(node.file.path);
      openTab({
        id: node.file.path, path: node.file.path,
        name: node.name, isDirty: false,
        content, language: node.file.language,
      });
    } catch (err) {
      console.error('Failed to read file', err);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const childrenNodes = Object.values(node.children).sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });

  const norm = (p: string) => p.replace(/\\/g, '/');
  const getRelativePath = () => {
    const fp = norm(node.path);
    const pp = norm(projectPath);
    return fp.startsWith(pp) ? fp.substring(pp.length).replace(/^\//, '') : fp;
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          display: 'flex', alignItems: 'center',
          padding: `3px 8px 3px ${depth * 12 + 6}px`,
          cursor: 'pointer',
          background: isActive ? 'var(--vscode-list-active)' : 'transparent',
          color: isActive ? '#ffffff' : 'var(--text-primary)',
          fontSize: '13px', userSelect: 'none',
          transition: 'background 60ms ease',
        }}
        onMouseEnter={(e) => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-list-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
        }}
      >
        {/* Expand arrow */}
        <span style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 2, flexShrink: 0 }}>
          {node.isDir
            ? (isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />)
            : null
          }
        </span>

        {/* Icon */}
        <span style={{ marginRight: 6, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {node.isDir
            ? (isExpanded
              ? <FolderOpen size={14} style={{ color: '#dcb67a' }} />
              : <Folder size={14} style={{ color: '#dcb67a' }} />)
            : getFileIcon(node.name)
          }
        </span>

        {/* Name */}
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {node.name}
        </span>
      </div>

      {/* Children */}
      {node.isDir && isExpanded && (
        <div>
          {childrenNodes.map(child => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} projectPath={projectPath} />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={node}
          onClose={() => setContextMenu(null)}
          onOpenInEditor={openInEditor}
          onCopyPath={() => navigator.clipboard.writeText(node.path)}
          onCopyRelativePath={() => navigator.clipboard.writeText(getRelativePath())}
          onRevealInExplorer={() => {
            // Try to reveal in file explorer via Tauri
            try {
              import('@tauri-apps/plugin-opener').then(m => m.openPath(node.isDir ? node.path : node.path.substring(0, node.path.lastIndexOf('/'))));
            } catch {}
          }}
        />
      )}
    </div>
  );
};

// ─── File Explorer Component ──────────────────────────────────

export const FileExplorer: React.FC = () => {
  const { indexedFiles, activeProjectId, projects, isSidebarCollapsed, toggleSidebar, expandedDirs, toggleDirExpanded } = useAppStore();
  const { openAndScanProject } = useScanner();
  const activeProject = projects.find(p => p.id === activeProjectId);

  const tree = useMemo(() => {
    if (!activeProject) return { name: 'root', path: '', isDir: true, children: {} } as TreeNode;
    return buildTree(indexedFiles, activeProject.path);
  }, [indexedFiles, activeProject]);

  const collapseAll = () => {
    // Collapse all by clearing expanded dirs
    const expanded = Array.from(expandedDirs);
    expanded.forEach(dir => toggleDirExpanded(dir));
  };

  if (isSidebarCollapsed) return null;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--vscode-sidebar)',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--vscode-border)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px 8px 20px',
        fontSize: '11px', fontWeight: 700,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, userSelect: 'none',
      }}>
        <span>Explorer</span>

        {activeProject && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              title="New File"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 3px', display: 'flex', borderRadius: '2px' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <FilePlus size={14} />
            </button>
            <button
              title="New Folder"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 3px', display: 'flex', borderRadius: '2px' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <FolderPlus size={14} />
            </button>
            <button
              title="Collapse All Folders"
              onClick={collapseAll}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 3px', display: 'flex', borderRadius: '2px' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <ChevronDown size={14} />
            </button>
            <button
              title="Refresh Explorer"
              onClick={openAndScanProject}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 3px', display: 'flex', borderRadius: '2px' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        )}
      </div>

      {activeProject ? (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Project Root Header */}
          <div
            style={{
              padding: '4px 10px', fontSize: '11px', fontWeight: 700,
              color: 'var(--text-secondary)', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', cursor: 'pointer',
              letterSpacing: '0.05em', userSelect: 'none',
              transition: 'background 80ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <ChevronDown size={13} style={{ marginRight: 4, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProject.name}
            </span>
          </div>

          {/* File tree */}
          <div style={{ paddingBottom: '40px' }}>
            {Object.values(tree.children)
              .sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
              })
              .map(child => (
                <FileTreeNode key={child.path} node={child} depth={0} projectPath={activeProject.path} />
              ))
            }
          </div>
        </div>
      ) : (
        <div style={{
          padding: '20px 16px', fontSize: '13px',
          color: 'var(--text-secondary)', display: 'flex',
          flexDirection: 'column', gap: '12px', alignItems: 'center',
          textAlign: 'center',
        }}>
          <p>No folder opened</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            You can open a local folder to browse files.
          </p>
          <button
            onClick={openAndScanProject}
            style={{
              background: 'var(--vscode-accent)', color: '#fff', border: 'none',
              padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
              borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background 80ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--vscode-accent-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--vscode-accent)'; }}
          >
            Open Folder
          </button>
        </div>
      )}
    </div>
  );
};
