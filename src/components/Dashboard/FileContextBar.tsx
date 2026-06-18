// ============================================================
// BlameBot — File Context Bar
// Lets the user pin files so the AI knows exactly what to edit.
// Appears above the chat input inside AIChat.
// ============================================================

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilePlus2, X, FileCode2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useAppStore, type ContextFile } from '../../store/appStore';
import { readFileContent } from '../../services/tauriService';

// ─── Language helpers ─────────────────────────────────────────

function extToLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rs: 'rust', go: 'go', java: 'java', kt: 'kotlin',
    cs: 'csharp', cpp: 'cpp', c: 'c', rb: 'ruby', php: 'php',
    html: 'html', css: 'css', scss: 'scss', json: 'json',
    yaml: 'yaml', yml: 'yaml', toml: 'toml', md: 'markdown', sh: 'bash',
  };
  return map[ext] ?? ext ?? 'text';
}

function basename(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() ?? path;
}

// ─── File Picker Modal ────────────────────────────────────────

const FilePicker: React.FC<{
  onSelect: (path: string) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const { indexedFiles } = useAppStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const filtered = indexedFiles
    .filter(f => f.path.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 40);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-hover)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        marginBottom: '6px',
      }}
    >
      {/* Search input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-base)',
      }}>
        <Search size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
          placeholder="Search indexed files..."
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)',
          }}
        />
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
        >
          <X size={13} />
        </button>
      </div>

      {/* File list */}
      <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '6px' }}>
        {filtered.length === 0 ? (
          <p style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
            {indexedFiles.length === 0 ? 'No indexed files — open a project first' : 'No files match'}
          </p>
        ) : (
          filtered.map(f => (
            <motion.div
              key={f.path}
              whileHover={{ backgroundColor: 'var(--bg-elevated)' }}
              onClick={() => { onSelect(f.path); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <FileCode2 size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {basename(f.path)}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {f.path}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// ─── Context File Chip ────────────────────────────────────────

const FileChip: React.FC<{ file: ContextFile; onRemove: () => void }> = ({ file, onRemove }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85 }}
    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 8px 3px 6px',
      background: 'var(--accent-cyan-dim)',
      border: '1px solid rgba(34,211,238,0.35)',
      borderRadius: '20px',
      cursor: 'default',
      flexShrink: 0,
    }}
    title={file.path}
  >
    <FileCode2 size={11} style={{ color: 'var(--accent-cyan)' }} />
    <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {file.name}
    </span>
    <button
      onClick={onRemove}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', lineHeight: 1 }}
    >
      <X size={11} />
    </button>
  </motion.div>
);

// ─── Main FileContextBar ──────────────────────────────────────

export const FileContextBar: React.FC = () => {
  const { contextFiles, addContextFile, removeContextFile, clearContextFiles } = useAppStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectFile = async (path: string) => {
    setLoading(path);
    try {
      const content = await readFileContent(path);
      const name = basename(path);
      const language = extToLanguage(name);
      addContextFile({ path, name, content, language });
    } catch (e) {
      console.error('Failed to read context file:', e);
    } finally {
      setLoading(null);
    }
  };

  const hasFiles = contextFiles.length > 0;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        borderTop: '1px solid var(--border-base)',
        background: hasFiles ? 'rgba(34,211,238,0.04)' : 'transparent',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
    >
      {/* File Picker Dropdown */}
      <AnimatePresence>
        {pickerOpen && (
          <FilePicker onSelect={handleSelectFile} onClose={() => setPickerOpen(false)} />
        )}
      </AnimatePresence>

      {/* Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px',
        minHeight: '36px',
      }}>
        {/* Add button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setPickerOpen(v => !v)}
          title="Pin a file for AI context"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 9px',
            background: pickerOpen ? 'var(--accent-cyan-dim)' : 'var(--bg-base)',
            border: `1px solid ${pickerOpen ? 'rgba(34,211,238,0.4)' : 'var(--border-base)'}`,
            borderRadius: '20px',
            cursor: 'pointer',
            color: pickerOpen ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          <FilePlus2 size={12} />
          <span>Add file</span>
        </motion.button>

        {/* Chips */}
        <div style={{ display: 'flex', gap: '5px', flex: 1, flexWrap: 'nowrap', overflowX: 'auto', alignItems: 'center' }}>
          <AnimatePresence mode="popLayout">
            {contextFiles.map(f => (
              <FileChip key={f.path} file={f} onRemove={() => removeContextFile(f.path)} />
            ))}
          </AnimatePresence>

          {loading && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', flexShrink: 0 }}>
              Loading…
            </span>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {hasFiles && (
            <>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginRight: 2 }}>
                {contextFiles.length} file{contextFiles.length > 1 ? 's' : ''} in context
              </span>
              <button
                onClick={clearContextFiles}
                title="Clear all context files"
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', fontSize: '0.68rem', gap: 3 }}
              >
                <X size={11} /> Clear
              </button>
            </>
          )}
          {!hasFiles && (
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              Pin files · AI edits them in real time
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileContextBar;
