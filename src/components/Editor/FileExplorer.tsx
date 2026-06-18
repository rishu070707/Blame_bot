import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, FileCode, FileText, FileJson, Image, Folder, FolderOpen } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { IndexedFile } from '../../types';
import { readFileContent } from '../../services/tauriService';

// Helper to build tree from flat paths
interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: Record<string, TreeNode>;
  file?: IndexedFile;
}

function buildTree(files: IndexedFile[], projectPath: string): TreeNode {
  const root: TreeNode = { name: 'root', path: projectPath, isDir: true, children: {} };

  // Normalize project path
  const normalizedProjectPath = projectPath.replace(/\\/g, '/');

  for (const file of files) {
    // Normalize file path and strip the project path
    const normalizedFilePath = file.path.replace(/\\/g, '/');
    let relativePath = normalizedFilePath;
    
    if (normalizedFilePath.startsWith(normalizedProjectPath)) {
      relativePath = normalizedFilePath.substring(normalizedProjectPath.length);
      if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
    }

    if (!relativePath) continue; // It's the root folder itself

    const parts = relativePath.split('/');
    let current = root;
    let currentPath = projectPath;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      currentPath = currentPath + '/' + part;
      const isFile = i === parts.length - 1;

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: currentPath, // Use the proper directory/file path
          isDir: !isFile,
          children: {},
          file: isFile ? file : undefined,
        };
      }
      current = current.children[part];
    }
  }
  return root;
}

// ─── File Icon ────────────────────────────────────────────────

const getFileIcon = (name: string, size = 14) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'go', 'java', 'cpp', 'c', 'cs'].includes(ext || '')) {
    return <FileCode size={size} style={{ color: '#519aba' }} />;
  }
  if (['json', 'yaml', 'yml', 'toml'].includes(ext || '')) {
    return <FileJson size={size} style={{ color: '#cbcb41' }} />;
  }
  if (['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(ext || '')) {
    return <Image size={size} style={{ color: '#a074c4' }} />;
  }
  return <FileText size={size} style={{ color: '#858585' }} />;
};

// ─── Tree Node Component ──────────────────────────────────────

const FileTreeNode: React.FC<{ node: TreeNode; depth: number }> = ({ node, depth }) => {
  const { expandedDirs, toggleDirExpanded, openTab, activeTabId } = useAppStore();
  const isExpanded = expandedDirs.has(node.path);
  const isActive = activeTabId === node.file?.path;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isDir) {
      toggleDirExpanded(node.path);
    } else if (node.file) {
      // Open in editor
      try {
        const content = await readFileContent(node.file.path);
        openTab({
          id: node.file.path,
          path: node.file.path,
          name: node.name,
          isDirty: false,
          content,
          language: node.file.language,
        });
      } catch (err) {
        console.error("Failed to read file", err);
      }
    }
  };

  const childrenNodes = Object.values(node.children).sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: `4px 8px 4px ${depth * 12 + 8}px`,
          cursor: 'pointer',
          background: isActive ? 'var(--vscode-selection)' : 'transparent',
          color: isActive ? '#ffffff' : 'var(--text-primary)',
          fontSize: '13px',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--vscode-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
          {node.isDir ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : null}
        </span>
        <span style={{ marginRight: 6, display: 'flex', alignItems: 'center' }}>
          {node.isDir ? (
            isExpanded ? <FolderOpen size={14} style={{ color: '#dcb67a' }} /> : <Folder size={14} style={{ color: '#dcb67a' }} />
          ) : (
            getFileIcon(node.name)
          )}
        </span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {node.name}
        </span>
      </div>

      {node.isDir && isExpanded && (
        <div>
          {childrenNodes.map(child => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

import { useScanner } from '../../hooks/useScanner';
import { Button } from '../ui';

// ─── Main Explorer Component ──────────────────────────────────

export const FileExplorer: React.FC = () => {
  const { indexedFiles, activeProjectId, projects } = useAppStore();
  const { openAndScanProject } = useScanner();
  const activeProject = projects.find(p => p.id === activeProjectId);

  const tree = useMemo(() => {
    if (!activeProject) return { name: 'root', path: '', isDir: true, children: {} };
    return buildTree(indexedFiles, activeProject.path);
  }, [indexedFiles, activeProject]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--vscode-sidebar)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--vscode-border)',
    }}>
      <div style={{
        padding: '10px 20px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#cccccc',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        flexShrink: 0,
      }}>
        Explorer
      </div>
      
      {activeProject ? (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          >
            <ChevronDown size={14} style={{ marginRight: 4 }} />
            {activeProject.name}
          </div>
          <div style={{ paddingBottom: '20px' }}>
            {Object.values(tree.children)
              .sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return a.name.localeCompare(b.name);
              })
              .map(child => (
              <FileTreeNode key={child.path} node={child} depth={0} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          No project opened.
          <Button variant="primary" size="sm" onClick={openAndScanProject}>
            Open Folder
          </Button>
        </div>
      )}
    </div>
  );
};
