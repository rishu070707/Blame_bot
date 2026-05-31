import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Zap, Shield, BarChart2, FolderOpen, Settings,
  ArrowRight, Terminal, Bug, Code2, FileSearch, Cpu,
  ChevronRight, Command, X,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useOllama } from '../../hooks/useOllama';
import { useScanner } from '../../hooks/useScanner';
import { LoadingSpinner } from '../ui';
import type { CommandCategory } from '../../types';

// ─── Command Definitions ──────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: CommandCategory;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
  shortcut?: string;
}

// ─── Main CommandBar Component ────────────────────────────────

export const CommandBar: React.FC = () => {
  const { isCommandBarOpen, closeCommandBar, setCurrentView, addNotification } = useAppStore();
  const { sendMessage, isStreaming, status } = useOllama();
  const { openAndScanProject } = useScanner();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aiMode, setAiMode] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── AI Prompt Prefixes ───────────────────────────────────

  const AI_PREFIXES = [
    { prefix: 'generate ', label: 'Generate Code', icon: <Code2 size={14} /> },
    { prefix: 'fix ', label: 'Fix Error', icon: <Bug size={14} /> },
    { prefix: 'explain ', label: 'Explain Code', icon: <Terminal size={14} /> },
    { prefix: 'audit ', label: 'Audit Project', icon: <Shield size={14} /> },
    { prefix: 'find ', label: 'Find in Code', icon: <FileSearch size={14} /> },
    { prefix: 'optimize ', label: 'Optimize', icon: <Cpu size={14} /> },
  ];

  // ─── Static Commands ──────────────────────────────────────

  const commands: CommandItem[] = [
    {
      id: 'open-project',
      label: 'Open Project Folder',
      description: 'Scan and index a local project',
      category: 'project',
      icon: <FolderOpen size={16} />,
      keywords: ['open', 'project', 'folder', 'scan', 'index'],
      shortcut: 'Ctrl+O',
      action: async () => {
        closeCommandBar();
        await openAndScanProject();
      },
    },
    {
      id: 'go-dashboard',
      label: 'Go to Dashboard',
      description: 'Project overview and AI chat',
      category: 'navigation',
      icon: <Zap size={16} />,
      keywords: ['dashboard', 'home', 'main'],
      action: () => { closeCommandBar(); setCurrentView('dashboard'); },
    },
    {
      id: 'run-security-audit',
      label: 'Run Security Audit',
      description: 'Detect vulnerabilities in your project',
      category: 'audit',
      icon: <Shield size={16} />,
      keywords: ['security', 'audit', 'vulnerability', 'scan', 'secrets'],
      action: () => { closeCommandBar(); setCurrentView('audit'); },
    },
    {
      id: 'run-perf-audit',
      label: 'Run Performance Audit',
      description: 'Find bottlenecks and N+1 queries',
      category: 'audit',
      icon: <BarChart2 size={16} />,
      keywords: ['performance', 'audit', 'speed', 'bottleneck', 'n+1'],
      action: () => { closeCommandBar(); setCurrentView('audit'); },
    },
    {
      id: 'code-search',
      label: 'Search Codebase',
      description: 'Semantic search across indexed files',
      category: 'project',
      icon: <FileSearch size={16} />,
      keywords: ['search', 'code', 'find', 'semantic'],
      shortcut: 'Ctrl+F',
      action: () => { closeCommandBar(); setCurrentView('search'); },
    },
    {
      id: 'settings',
      label: 'Open Settings',
      description: 'Configure models, shortcuts, indexing',
      category: 'settings',
      icon: <Settings size={16} />,
      keywords: ['settings', 'config', 'model', 'ollama', 'shortcut'],
      shortcut: 'Ctrl+,',
      action: () => { closeCommandBar(); setCurrentView('settings'); },
    },
  ];

  // ─── AI Suggestion Templates ──────────────────────────────

  const aiSuggestions = [
    'Generate Spring Boot CRUD API',
    'Fix this stack trace: ...',
    'Explain how this code works',
    'Find memory leaks in my project',
    'Generate unit tests for this service',
    'Review security vulnerabilities',
    'Optimize this SQL query',
    'Explain what this regex does',
  ];

  // ─── Filtering ────────────────────────────────────────────

  const isAiQuery = query.length > 3 && !commands.some(
    (c) => c.label.toLowerCase().startsWith(query.toLowerCase())
  );

  const filteredCommands = commands.filter((cmd) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.includes(q))
    );
  });

  const displayedSuggestions = query
    ? aiSuggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : aiSuggestions.slice(0, 4);

  const allItems = [
    ...filteredCommands,
    ...(isAiQuery || !query ? [] : []),
  ];

  // ─── Keyboard Navigation ──────────────────────────────────

  useEffect(() => {
    if (isCommandBarOpen) {
      setQuery('');
      setSelectedIndex(0);
      setAiMode(false);
      setAiResponse('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandBarOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (aiMode) {
            setAiMode(false);
            setAiResponse('');
          } else {
            closeCommandBar();
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (aiMode || (query && !filteredCommands.length)) {
            handleAiQuery();
          } else if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (displayedSuggestions[0]) {
            setQuery(displayedSuggestions[0]);
          }
          break;
      }
    },
    [filteredCommands, selectedIndex, aiMode, query, closeCommandBar]
  );

  const handleAiQuery = () => {
    if (!query.trim()) return;
    setAiMode(true);
    // Send to chat and switch to dashboard
    closeCommandBar();
    setCurrentView('dashboard');
    sendMessage(query);
  };

  const CATEGORY_LABELS: Record<CommandCategory, string> = {
    ai_action: 'AI Actions',
    navigation: 'Navigation',
    audit: 'Audits',
    project: 'Project',
    settings: 'Settings',
    recent: 'Recent',
  };

  const groupedCommands = filteredCommands.reduce<Record<string, CommandItem[]>>(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {}
  );

  // ─── Render ───────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isCommandBarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeCommandBar}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '680px',
              maxWidth: 'calc(100vw - 32px)',
              zIndex: 1001,
              borderRadius: 'var(--radius-2xl)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-hover)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.6), var(--shadow-glow-cyan)',
              overflow: 'hidden',
            }}
          >
            {/* Search Input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-base)',
            }}>
              <Search size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Ask BlameBot anything, or search commands..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: '1rem',
                  fontFamily: 'var(--font-sans)',
                  caretColor: 'var(--accent-cyan)',
                }}
              />
              {isStreaming && <LoadingSpinner size={16} />}
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              )}
              <kbd style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem',
                background: 'var(--bg-base)', border: '1px solid var(--border-base)',
                color: 'var(--text-dim)', fontFamily: 'var(--font-mono)',
              }}>
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '8px' }}>

              {/* AI Prompt suggestion banner */}
              {query.length > 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    margin: '4px 0 8px', padding: '12px 16px',
                    background: 'var(--accent-cyan-dim)',
                    border: '1px solid rgba(34,211,238,0.2)',
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}
                  onClick={handleAiQuery}
                >
                  <Zap size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      Ask AI: <span style={{ color: 'var(--accent-cyan)' }}>{query}</span>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Press Enter to send to BlameBot
                    </p>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--accent-cyan)' }} />
                </motion.div>
              )}

              {/* Command Groups */}
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} style={{ marginBottom: '4px' }}>
                  <p style={{
                    fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '6px 12px 4px',
                  }}>
                    {CATEGORY_LABELS[category as CommandCategory]}
                  </p>
                  {cmds.map((cmd, idx) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <motion.div
                        key={cmd.id}
                        onClick={cmd.action}
                        whileHover={{ backgroundColor: 'var(--bg-elevated)' }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 12px', borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                          transition: 'background var(--transition-fast)',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32,
                          background: isSelected ? 'var(--accent-cyan-dim)' : 'var(--bg-base)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          flexShrink: 0,
                          border: '1px solid var(--border-base)',
                          transition: 'all var(--transition-fast)',
                        }}>
                          {cmd.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {cmd.label}
                          </p>
                          {cmd.description && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {cmd.description}
                            </p>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {cmd.shortcut.split('+').map((k) => (
                              <kbd key={k} style={{
                                padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem',
                                background: 'var(--bg-base)', border: '1px solid var(--border-base)',
                                color: 'var(--text-dim)', fontFamily: 'var(--font-mono)',
                              }}>{k}</kbd>
                            ))}
                          </div>
                        )}
                        {isSelected && <ChevronRight size={14} style={{ color: 'var(--accent-cyan)' }} />}
                      </motion.div>
                    );
                  })}
                </div>
              ))}

              {/* AI Suggestions (when no query) */}
              {!query && (
                <div style={{ marginTop: '8px' }}>
                  <p style={{
                    fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '6px 12px 4px',
                  }}>
                    AI Quick Prompts
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {displayedSuggestions.map((s) => (
                      <motion.div
                        key={s}
                        onClick={() => setQuery(s)}
                        whileHover={{ backgroundColor: 'var(--bg-elevated)' }}
                        style={{
                          padding: '8px 12px', borderRadius: 'var(--radius-md)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        <Zap size={12} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty */}
              {query && !filteredCommands.length && (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Press <kbd style={{ background: 'var(--bg-base)', border: '1px solid var(--border-base)', borderRadius: '4px', padding: '1px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>Enter</kbd> to ask AI about "<span style={{ color: 'var(--accent-cyan)' }}>{query}</span>"
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 20px',
              borderTop: '1px solid var(--border-base)',
              display: 'flex', alignItems: 'center', gap: '16px',
              fontSize: '0.72rem', color: 'var(--text-dim)',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Command size={10} /> BlameBot
              </span>
              <span>↑↓ navigate</span>
              <span>↵ select / ask AI</span>
              <span>Tab autocomplete</span>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: status === 'connected' || status === 'streaming'
                    ? 'var(--success)' : status === 'error'
                    ? 'var(--danger)' : 'var(--warning)',
                }} />
                <span>
                  {status === 'connected' ? 'Ollama Connected'
                    : status === 'error' ? 'Ollama Offline'
                    : status === 'streaming' ? 'AI Thinking...'
                    : 'Checking...'}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandBar;
