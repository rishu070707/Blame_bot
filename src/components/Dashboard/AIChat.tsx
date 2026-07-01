import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Trash2, Copy, Download, Zap, Bot, User,
  StopCircle, Code2, AlertTriangle, Terminal, RefreshCw,
  CheckCircle, FilePen, X, ChevronDown, ChevronUp, Loader2,
  Plus, MessageSquare, ChevronRight, Settings, Sparkles,
  History, Edit3, MoreHorizontal,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useOllama } from '../../hooks/useOllama';
import { ThinkingDots, Button, EmptyState, LoadingSpinner } from '../ui';
import { saveFileDialog } from '../../services/tauriService';
import {
  parseCodeFenceMeta, resolvePath, applyFullFile, readCurrentFile,
  computeDiff, type ApplyStatus, type DiffLine,
} from '../../services/codeEditService';
import { FileContextBar } from './FileContextBar';
import type { ChatMessage, ChatSession } from '../../types';

// ─── Inline Diff Preview ──────────────────────────────────────

const DiffPreview: React.FC<{ diff: DiffLine[] }> = ({ diff }) => (
  <div style={{
    fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: '1.5',
    overflowX: 'auto', maxHeight: '200px', overflowY: 'auto',
    background: '#0d0d0d', borderTop: '1px solid #333', padding: '8px 0',
  }}>
    {diff.map((line, i) => {
      const bg = line.type === 'added' ? 'rgba(34,197,94,0.15)' : line.type === 'removed' ? 'rgba(239,68,68,0.15)' : 'transparent';
      const color = line.type === 'added' ? '#86efac' : line.type === 'removed' ? '#fca5a5' : '#666';
      const prefix = line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';
      return (
        <div key={i} style={{ background: bg, padding: '0 12px', display: 'flex', gap: '8px' }}>
          <span style={{ color: line.type === 'unchanged' ? '#444' : color, userSelect: 'none', flexShrink: 0 }}>{prefix}</span>
          <span style={{ color, whiteSpace: 'pre', flex: 1 }}>{line.content}</span>
        </div>
      );
    })}
  </div>
);

// ─── Custom Code Block ────────────────────────────────────────

const CustomCodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const meta: string = node?.data?.meta || node?.meta || props.meta || '';
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>('idle');
  const [showDiff, setShowDiff] = useState(false);
  const [diff, setDiff] = useState<DiffLine[] | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const store = useAppStore.getState();
  const activeProject = store.projects.find(p => p.id === store.activeProjectId);
  const rawPath = meta.trim();
  const resolvedPath = resolvePath(rawPath, activeProject?.path);

  const handleApply = useCallback(async () => {
    const codeToApply = String(children).replace(/\n$/, '');
    let finalPath = resolvedPath;
    if (!finalPath) {
      finalPath = (await saveFileDialog()) || '';
      if (!finalPath) return;
    }
    setApplyStatus('applying');
    const result = await applyFullFile(finalPath, codeToApply);
    if (result.status === 'applied') {
      setApplyStatus('applied');
      useAppStore.getState().addNotification({ type: 'success', title: '✓ Applied', message: result.path.split(/[\\\/]/).pop() ?? result.path, duration: 3500 });
      setTimeout(() => setApplyStatus('idle'), 8000);
    } else {
      setApplyStatus('error');
      useAppStore.getState().addNotification({ type: 'error', title: 'Apply failed', message: result.error ?? 'Unknown error', duration: 5000 });
      setTimeout(() => setApplyStatus('idle'), 5000);
    }
  }, [children, resolvedPath]);

  const handleShowDiff = useCallback(async () => {
    if (showDiff) { setShowDiff(false); return; }
    if (!resolvedPath) return;
    setDiffLoading(true);
    setShowDiff(true);
    const current = await readCurrentFile(resolvedPath);
    if (current !== null) {
      setDiff(computeDiff(current, String(children).replace(/\n$/, '')));
    } else {
      setDiff(null);
    }
    setDiffLoading(false);
  }, [resolvedPath, showDiff, children]);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    const isApplying = applyStatus === 'applying';
    const isApplied = applyStatus === 'applied';
    const isError = applyStatus === 'error';
    const hasPath = !!resolvedPath;

    return (
      <div style={{ position: 'relative', marginTop: '12px', marginBottom: '12px', border: '1px solid var(--vscode-border)', borderRadius: '6px', overflow: 'hidden' }}>
        {/* Code block header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#252526', padding: '5px 10px',
          borderBottom: '1px solid var(--vscode-border)',
          gap: '8px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--syntax-keyword)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              {match[1]}
            </span>
            {rawPath && (
              <span style={{
                fontSize: '0.72rem', color: '#aaa', fontFamily: 'var(--font-mono)',
                background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '3px',
                border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px',
              }} title={resolvedPath || rawPath}>
                {rawPath}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {hasPath && (
              <button onClick={handleShowDiff} title={showDiff ? 'Hide diff' : 'Preview diff'} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: showDiff ? 'rgba(0,122,204,0.2)' : 'transparent',
                color: showDiff ? 'var(--vscode-accent)' : 'var(--text-secondary)',
                border: `1px solid ${showDiff ? 'rgba(0,122,204,0.4)' : 'rgba(255,255,255,0.1)'}`,
                padding: '2px 7px', fontSize: '0.7rem', cursor: 'pointer', borderRadius: '3px',
                transition: 'all 0.12s ease',
              }}>
                {diffLoading ? <Loader2 size={10} className="animate-spin" /> : (showDiff ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                Diff
              </button>
            )}
            <button onClick={handleCopy} title="Copy code" style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'transparent', color: copied ? 'var(--success)' : 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.1)', padding: '2px 7px',
              fontSize: '0.7rem', cursor: 'pointer', borderRadius: '3px', transition: 'all 0.12s ease',
            }}>
              <Copy size={10} />{copied ? 'Copied!' : 'Copy'}
            </button>
            <motion.button
              whileHover={!isApplying ? { scale: 1.03 } : {}}
              whileTap={!isApplying ? { scale: 0.97 } : {}}
              onClick={!isApplying && !isApplied ? handleApply : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: isApplied ? '#166534' : isError ? '#7f1d1d' : 'var(--vscode-accent)',
                color: '#fff', border: 'none', padding: '3px 10px',
                fontSize: '0.72rem', fontWeight: 600,
                cursor: isApplying || isApplied ? 'default' : 'pointer',
                transition: 'background 0.2s ease', borderRadius: '3px',
                opacity: isApplying ? 0.7 : 1,
              }}
            >
              {isApplying ? <><Loader2 size={11} className="animate-spin" /> Applying…</>
                : isApplied ? <><CheckCircle size={11} /> Applied</>
                : isError ? <><X size={11} /> Failed</>
                : <><FilePen size={11} /> Apply</>}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {showDiff && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
              {diffLoading ? (
                <div style={{ background: '#0d0d0d', padding: '12px', textAlign: 'center' }}>
                  <Loader2 size={14} style={{ color: '#555' }} className="animate-spin" />
                </div>
              ) : diff && diff.length > 0 ? <DiffPreview diff={diff} /> : (
                <div style={{ background: '#0d0d0d', padding: '10px 14px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#555' }}>
                    {diff === null ? 'File not found — will create new file' : 'No differences detected'}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <pre style={{ margin: 0, padding: '12px 16px', background: '#0d1117', color: '#e6edf3', overflowX: 'auto', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }} {...props}>
          <code className={className}>{children}</code>
        </pre>
      </div>
    );
  }
  return <code className={className} style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.85em', color: 'var(--syntax-string)', fontFamily: 'var(--font-mono)' }} {...props}>{children}</code>;
};

// ─── Message Bubble ───────────────────────────────────────────

const MessageBubble: React.FC<{ message: ChatMessage; index: number }> = ({ message, index }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2), type: 'spring', stiffness: 400, damping: 35 }}
      style={{
        display: 'flex', gap: '10px', alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
        marginBottom: '16px',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 26, height: 26, flexShrink: 0, borderRadius: '4px',
        background: isUser ? '#264f78' : '#007acc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser
          ? <User size={13} style={{ color: '#fff' }} />
          : <Sparkles size={13} style={{ color: '#fff' }} />
        }
      </div>

      {/* Content */}
      <div style={{ maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <div style={{
          padding: isUser ? '8px 12px' : '0',
          background: isUser ? '#264f7899' : 'transparent',
          borderRadius: '6px',
          border: isUser ? '1px solid rgba(0,122,204,0.3)' : 'none',
        }}>
          {message.isStreaming && !message.content ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--vscode-accent)' }}
                  animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }} />
              ))}
            </div>
          ) : (
            <div className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CustomCodeBlock as any }}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta row */}
        {!message.isStreaming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.metadata?.model && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {message.metadata.model}</span>
            )}
            {!isUser && (
              <button onClick={handleCopy} style={{
                background: 'none', border: 'none', color: copied ? 'var(--success)' : 'var(--text-muted)',
                cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center',
                fontSize: '11px', gap: '3px', transition: 'color 80ms ease',
              }}>
                <Copy size={10} />{copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Model Switcher Dropdown ──────────────────────────────────

const ModelSwitcher: React.FC = () => {
  const { availableModels, activeModel, setActiveModel } = useAppStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)}GB`;
    if (bytes > 1e6) return `${(bytes / 1e6).toFixed(0)}MB`;
    return `${bytes}B`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="model-badge"
        onClick={() => setOpen(!open)}
        title="Switch AI Model"
      >
        <Sparkles size={10} />
        <span>{activeModel}</span>
        <ChevronDown size={9} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: '6px',
              background: 'var(--vscode-widget)', border: '1px solid var(--vscode-border)',
              borderRadius: '6px', boxShadow: 'var(--shadow-overlay)',
              padding: '4px', minWidth: '240px', maxHeight: '300px', overflowY: 'auto',
              zIndex: 9999,
            }}
          >
            {availableModels.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                No models found. Run <code style={{ color: 'var(--syntax-string)' }}>ollama pull &lt;model&gt;</code>
              </div>
            ) : (
              availableModels.map(m => (
                <div
                  key={m.name}
                  onClick={() => { setActiveModel(m.name); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', cursor: 'pointer', borderRadius: '4px',
                    background: m.name === activeModel ? 'var(--vscode-list-active)' : 'transparent',
                    color: m.name === activeModel ? '#fff' : 'var(--text-primary)',
                    fontSize: '13px', gap: '8px',
                    transition: 'background 60ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (m.name !== activeModel) (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-hover)';
                  }}
                  onMouseLeave={(e) => {
                    if (m.name !== activeModel) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {m.name === activeModel && <CheckCircle size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {m.size ? formatSize(m.size) : ''}
                  </span>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Chat Session Sidebar ─────────────────────────────────────

const ChatSessionSidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { chatSessions, activeChatSessionId, setActiveChatSession, deleteChatSession, createChatSession, renameChatSession } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleNewChat = () => {
    createChatSession();
    onClose();
  };

  const startEdit = (sess: ChatSession) => {
    setEditingId(sess.id);
    setEditValue(sess.title);
  };

  const commitEdit = (id: string) => {
    if (editValue.trim()) renameChatSession(id, editValue.trim());
    setEditingId(null);
  };

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: 'var(--vscode-sidebar)', display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--vscode-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--vscode-border)', flexShrink: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Chat History</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={handleNewChat} title="New Chat" style={{ background: 'none', border: 'none', color: 'var(--vscode-accent)', cursor: 'pointer', padding: '3px', display: 'flex', borderRadius: '3px' }}>
            <Plus size={16} />
          </button>
          <button onClick={onClose} title="Close" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '3px', display: 'flex', borderRadius: '3px' }}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
        {chatSessions.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            No chat history yet
          </div>
        )}
        {chatSessions.map(sess => {
          const isActive = sess.id === activeChatSessionId;
          return (
            <div
              key={sess.id}
              onClick={() => { setActiveChatSession(sess.id); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 8px',
                borderRadius: '4px', cursor: 'pointer',
                background: isActive ? 'var(--vscode-list-active)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-primary)',
                transition: 'background 60ms ease', marginBottom: '1px',
              }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-hover)'; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <MessageSquare size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === sess.id ? (
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => commitEdit(sess.id)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(sess.id); if (e.key === 'Escape') setEditingId(null); }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                    style={{ width: '100%', background: 'var(--vscode-input-bg)', border: '1px solid var(--vscode-accent)', color: 'var(--text-primary)', fontSize: '12px', padding: '1px 4px', borderRadius: '2px', outline: 'none' }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sess.title}
                    </div>
                    <div style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', marginTop: '1px' }}>
                      {sess.messages.length} messages · {sess.model}
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => startEdit(sess)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', opacity: 0.6, display: 'flex', borderRadius: '2px' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.6'; }}>
                  <Edit3 size={11} />
                </button>
                <button onClick={() => deleteChatSession(sess.id)} style={{ background: 'none', border: 'none', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '2px' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'; }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ─── Quick Actions ────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Generate API', prompt: 'Generate a RESTful API with proper error handling, validation, and TypeScript types', icon: <Code2 size={12} /> },
  { label: 'Fix Bug', prompt: 'Analyze this code for bugs and fix them with an explanation: \n\n', icon: <AlertTriangle size={12} /> },
  { label: 'Explain Code', prompt: 'Explain how this code works step by step, including its purpose and any edge cases', icon: <Terminal size={12} /> },
  { label: 'Write Tests', prompt: 'Generate comprehensive unit tests for this code with edge cases and mocks', icon: <Zap size={12} /> },
  { label: 'Optimize', prompt: 'Analyze and optimize this code for performance, readability, and best practices', icon: <Sparkles size={12} /> },
  { label: 'Add Docs', prompt: 'Add comprehensive JSDoc/docstring documentation to this code', icon: <FilePen size={12} /> },
];

// ─── AI Chat Component ────────────────────────────────────────

export const AIChat: React.FC = () => {
  const {
    chatMessages, clearChat, ollamaStatus, activeModel,
    createChatSession, activeChatSessionId, chatSessions,
  } = useAppStore();
  const { sendMessage, cancelStream, checkHealth, isStreaming } = useOllama();

  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Auto-create session if none exists
  useEffect(() => {
    if (!activeChatSessionId) {
      createChatSession();
    }
  }, []);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExport = () => {
    const md = chatMessages.map(m => `**${m.role === 'user' ? 'You' : 'BlameBot'}**: ${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blamebot-chat.md';
    a.click();
  };

  const isConnected = ollamaStatus === 'connected' || ollamaStatus === 'streaming';

  const activeSession = chatSessions.find(s => s.id === activeChatSessionId);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      background: 'var(--vscode-sidebar)', borderLeft: '1px solid var(--vscode-border)',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Chat Session Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <ChatSessionSidebar onClose={() => setShowHistory(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--vscode-border)',
        background: 'var(--vscode-panel)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{
            width: 26, height: 26, background: 'var(--vscode-accent)', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Sparkles size={14} style={{ color: '#fff' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              BlameBot Copilot
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isConnected ? 'var(--success)' : ollamaStatus === 'checking' ? 'var(--warning)' : 'var(--danger)',
                animation: ollamaStatus === 'streaming' ? 'pulse-glow 1s ease infinite' : 'none',
              }} />
              <ModelSwitcher />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button onClick={() => setShowHistory(!showHistory)} title="Chat History" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '3px' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--vscode-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}>
            <History size={15} />
          </button>
          <button onClick={() => createChatSession()} title="New Chat" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '3px' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--vscode-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}>
            <Plus size={15} />
          </button>
          {chatMessages.length > 0 && (
            <>
              <button onClick={handleExport} title="Export chat as Markdown" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '3px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--vscode-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}>
                <Download size={15} />
              </button>
              <button onClick={clearChat} title="Clear chat" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '3px' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--vscode-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}>
                <Trash2 size={15} />
              </button>
            </>
          )}
          {!isConnected && (
            <button onClick={checkHealth} title="Reconnect to Ollama" style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '3px' }}>
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 14px',
        display: 'flex', flexDirection: 'column',
      }}>
        {chatMessages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '24px', padding: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'rgba(0,122,204,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Sparkles size={24} style={{ color: 'var(--vscode-accent)' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                BlameBot Copilot
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Unlimited AI assistance, entirely offline.<br />
                Powered by Ollama — no data leaves your machine.
              </p>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '100%' }}>
              {QUICK_ACTIONS.map((a) => (
                <motion.button
                  key={a.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInput(a.prompt)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 10px', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--vscode-border)',
                    color: 'var(--text-secondary)', fontSize: '12px',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 80ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,122,204,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,122,204,0.3)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--vscode-border)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }}
                >
                  <span style={{ color: 'var(--vscode-accent)', flexShrink: 0 }}>{a.icon}</span>
                  {a.label}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatMessages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} index={i} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Offline Banner */}
      <AnimatePresence>
        {!isConnected && ollamaStatus === 'error' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              padding: '8px 14px', background: 'var(--danger-dim)',
              borderTop: '1px solid rgba(241,76,76,0.2)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <AlertTriangle size={13} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--danger)' }}>
              Ollama is offline. Run <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>ollama serve</code> to start it.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Context Bar */}
      <FileContextBar />

      {/* Input Area */}
      <div style={{
        padding: '10px 12px 12px',
        borderTop: '1px solid var(--vscode-border)',
        background: 'var(--vscode-sidebar)',
        flexShrink: 0,
      }}>
        <div className="copilot-input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected
              ? 'Ask BlameBot anything… (Enter to send, Shift+Enter for newline)'
              : 'Connect Ollama to start chatting…'
            }
            disabled={!isConnected && ollamaStatus !== 'idle' && ollamaStatus !== 'checking'}
            rows={1}
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              fontSize: '13px', lineHeight: '1.5', resize: 'none',
              caretColor: 'var(--vscode-accent)', minHeight: '22px',
              padding: '10px 12px 4px',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {activeSession?.title ?? 'New Chat'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {isStreaming ? (
                <button
                  onClick={cancelStream}
                  title="Stop generation"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'rgba(241,76,76,0.15)', color: 'var(--danger)',
                    border: '1px solid rgba(241,76,76,0.3)', padding: '4px 10px',
                    borderRadius: '4px', cursor: 'pointer', fontSize: '12px',
                    transition: 'all 80ms ease',
                  }}
                >
                  <StopCircle size={13} />Stop
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || (!isConnected && ollamaStatus !== 'idle')}
                  title="Send (Enter)"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: input.trim() ? 'var(--vscode-accent)' : 'rgba(255,255,255,0.05)',
                    color: input.trim() ? '#fff' : 'var(--text-muted)',
                    border: 'none', padding: '5px 12px', borderRadius: '4px',
                    cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: '12px',
                    transition: 'all 80ms ease',
                    opacity: (!isConnected && ollamaStatus !== 'idle') ? 0.5 : 1,
                  }}
                >
                  <Send size={13} />Send
                </button>
              )}
            </div>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', paddingLeft: '2px' }}>
          All processing is local. No data leaves your machine.
        </p>
      </div>
    </div>
  );
};

export default AIChat;
