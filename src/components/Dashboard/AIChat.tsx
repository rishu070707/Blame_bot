import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Trash2, Copy, Download, Zap, Bot, User,
  StopCircle, Code2, AlertTriangle, Terminal, RefreshCw,
  CheckCircle, FilePen, X, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useOllama } from '../../hooks/useOllama';
import { ThinkingDots, Button, EmptyState, LoadingSpinner } from '../ui';
import { saveFileDialog } from '../../services/tauriService';
import {
  parseCodeFenceMeta,
  resolvePath,
  applyFullFile,
  readCurrentFile,
  computeDiff,
  type ApplyStatus,
  type DiffLine,
} from '../../services/codeEditService';
import { FileContextBar } from './FileContextBar';
import type { ChatMessage } from '../../types';

// ─── Inline Diff Preview ──────────────────────────────────────

const DiffPreview: React.FC<{ diff: DiffLine[] }> = ({ diff }) => (
  <div style={{
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    lineHeight: '1.5',
    overflowX: 'auto',
    maxHeight: '200px',
    overflowY: 'auto',
    background: '#0d0d0d',
    borderTop: '1px solid #333',
    padding: '8px 0',
  }}>
    {diff.map((line, i) => {
      const bg =
        line.type === 'added' ? 'rgba(34,197,94,0.15)' :
        line.type === 'removed' ? 'rgba(239,68,68,0.15)' :
        'transparent';
      const color =
        line.type === 'added' ? '#86efac' :
        line.type === 'removed' ? '#fca5a5' :
        '#666';
      const prefix =
        line.type === 'added' ? '+' :
        line.type === 'removed' ? '-' :
        ' ';
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
  const [appliedPath, setAppliedPath] = useState<string>('');
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

    // If no path found from meta, ask with file picker
    if (!finalPath) {
      finalPath = (await saveFileDialog()) || '';
      if (!finalPath) return;
    }

    setApplyStatus('applying');
    const result = await applyFullFile(finalPath, codeToApply);

    if (result.status === 'applied') {
      setApplyStatus('applied');
      setAppliedPath(result.path);
      // Fire a toast notification
      useAppStore.getState().addNotification({
        type: 'success',
        title: '✓ Applied',
        message: result.path.split(/[\\/]/).pop() ?? result.path,
        duration: 3500,
      });
      // Reset to idle after a bit so user can re-apply if needed
      setTimeout(() => setApplyStatus('idle'), 8000);
    } else {
      setApplyStatus('error');
      useAppStore.getState().addNotification({
        type: 'error',
        title: 'Apply failed',
        message: result.error ?? 'Unknown error',
        duration: 5000,
      });
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
      const newContent = String(children).replace(/\n$/, '');
      setDiff(computeDiff(current, newContent));
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
      <div style={{ position: 'relative', marginTop: '16px', marginBottom: '16px', border: '1px solid var(--vscode-border)', borderRadius: '4px', overflow: 'hidden' }}>
        {/* Code block header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--vscode-sidebar)', padding: '6px 10px',
          borderBottom: '1px solid var(--vscode-border)',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {/* Left: language + path */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '0.72rem', color: '#888', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              {match[1]}
            </span>
            {rawPath && (
              <span style={{
                fontSize: '0.72rem', color: '#aaa', fontFamily: 'var(--font-mono)',
                background: '#1a1a1a', padding: '1px 6px', borderRadius: '3px',
                border: '1px solid #333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '280px', display: 'block',
              }} title={resolvedPath || rawPath}>
                {rawPath}
              </span>
            )}
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            {/* Diff toggle (only if path known) */}
            {hasPath && (
              <button
                onClick={handleShowDiff}
                title={showDiff ? 'Hide diff' : 'Preview diff'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: showDiff ? 'rgba(34,211,238,0.15)' : 'transparent',
                  color: showDiff ? 'var(--accent-cyan)' : '#666',
                  border: `1px solid ${showDiff ? 'rgba(34,211,238,0.3)' : '#333'}`,
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s ease',
                }}
              >
                {diffLoading ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : (showDiff ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                Diff
              </button>
            )}

            {/* Copy */}
            <button
              onClick={handleCopy}
              title="Copy code"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'transparent', color: copied ? '#86efac' : '#666',
                border: '1px solid #333', padding: '3px 8px',
                fontSize: '0.7rem', cursor: 'pointer', borderRadius: '3px',
                fontFamily: 'var(--font-sans)', transition: 'all 0.15s ease',
              }}
            >
              <Copy size={10} />
              {copied ? 'Copied' : 'Copy'}
            </button>

            {/* Apply button */}
            <motion.button
              whileHover={!isApplying ? { scale: 1.03 } : {}}
              whileTap={!isApplying ? { scale: 0.97 } : {}}
              onClick={!isApplying && !isApplied ? handleApply : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: isApplied ? '#166534' : isError ? '#7f1d1d' : 'var(--accent-cyan)',
                color: isApplied || isError ? '#fff' : '#000',
                border: 'none',
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                cursor: isApplying || isApplied ? 'default' : 'pointer',
                letterSpacing: '0.03em',
                transition: 'background 0.2s ease',
                borderRadius: '2px',
                opacity: isApplying ? 0.7 : 1,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {isApplying ? (
                <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Applying…</>
              ) : isApplied ? (
                <><CheckCircle size={12} /> Applied</>
              ) : isError ? (
                <><X size={12} /> Failed</>
              ) : (
                <><FilePen size={12} /> Apply to File</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Inline diff preview */}
        <AnimatePresence>
          {showDiff && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden' }}
            >
              {diffLoading ? (
                <div style={{ background: '#0d0d0d', padding: '12px', textAlign: 'center' }}>
                  <Loader2 size={14} style={{ color: '#555', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : diff && diff.length > 0 ? (
                <DiffPreview diff={diff} />
              ) : (
                <div style={{ background: '#0d0d0d', padding: '10px 14px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#555' }}>
                    {diff === null ? 'File not found on disk — this will create a new file' : 'No differences detected'}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Code */}
        <pre style={{ margin: 0, padding: '14px 16px', background: '#000', color: '#fff', overflowX: 'auto', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }} {...props}>
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }
  return <code className={className} {...props}>{children}</code>;
};

// ─── Message Bubble ───────────────────────────────────────────

const MessageBubble: React.FC<{ message: ChatMessage; index: number }> = ({
  message,
  index,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
        marginBottom: '16px',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        borderRadius: '4px',
        background: isUser ? 'var(--vscode-selection)' : 'var(--vscode-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser
          ? <User size={14} style={{ color: '#fff' }} />
          : <Bot size={14} style={{ color: '#fff' }} />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          padding: isUser ? '8px 12px' : '0',
          background: isUser ? 'var(--vscode-sidebar)' : 'transparent',
          borderRadius: '4px',
          border: isUser ? '1px solid var(--vscode-border)' : 'none',
        }}>
          {message.isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <div className="prose" style={{ color: 'var(--text-primary)' }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CustomCodeBlock as any,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Message Meta */}
        {!message.isStreaming && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.metadata?.model && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                · {message.metadata.model}
              </span>
            )}
            {!isUser && (
              <button
                onClick={handleCopy}
                style={{
                  background: 'none', border: 'none', color: copied ? 'var(--success)' : 'var(--text-dim)',
                  cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center',
                  fontSize: '0.7rem', gap: '3px', transition: 'color var(--transition-fast)',
                }}
              >
                <Copy size={11} />
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Quick Action Pills ───────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'Generate API', prompt: 'Generate a RESTful API with proper error handling', icon: <Code2 size={12} /> },
  { label: 'Fix Bug', prompt: 'Help me debug and fix this issue: ', icon: <AlertTriangle size={12} /> },
  { label: 'Explain Code', prompt: 'Explain how this code works step by step', icon: <Terminal size={12} /> },
  { label: 'Write Tests', prompt: 'Generate comprehensive unit tests for this code', icon: <Zap size={12} /> },
];

// ─── AI Chat Component ────────────────────────────────────────

export const AIChat: React.FC = () => {
  const { chatMessages, clearChat, ollamaStatus, activeModel } = useAppStore();
  const { sendMessage, cancelStream, checkHealth, isStreaming } = useOllama();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

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

  const isConnected = ollamaStatus === 'connected' || ollamaStatus === 'streaming';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      background: 'var(--vscode-sidebar)', borderLeft: '1px solid var(--vscode-border)',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--vscode-border)',
        background: 'var(--vscode-panel)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 28, height: 28,
            background: 'var(--vscode-accent)', borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={16} style={{ color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              BlameBot AI
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: 8, height: 8, flexShrink: 0, borderRadius: '50%',
                background: isConnected ? 'var(--success)' : 'var(--danger)',
              }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                {isConnected ? activeModel : 'Ollama Offline'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              leftIcon={<RefreshCw size={13} />}
            >
              Reconnect
            </Button>
          )}
          {chatMessages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              title="Clear chat"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column',
      }}>
        {chatMessages.length === 0 ? (
          <EmptyState
            icon={<Bot size={40} />}
            title="BlameBot is ready"
            description="Ask me to generate code, fix bugs, explain errors, or audit your project."
            action={
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
                {QUICK_ACTIONS.map((a) => (
                  <motion.button
                    key={a.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setInput(a.prompt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 10px', borderRadius: '4px',
                      background: 'var(--vscode-panel)', border: '1px solid var(--vscode-border)',
                      color: 'var(--text-primary)', fontSize: '0.8rem',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {a.icon}
                    {a.label}
                  </motion.button>
                ))}
              </div>
            }
          />
        ) : (
          <>
            {chatMessages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} index={i} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Ollama offline banner */}
      {!isConnected && ollamaStatus === 'error' && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          style={{
            padding: '10px 16px', background: 'var(--danger-dim)',
            borderTop: '1px solid rgba(239,68,68,0.2)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <AlertTriangle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>
            Ollama is not running. Start it with <code style={{ fontFamily: 'var(--font-mono)' }}>ollama serve</code>
          </span>
        </motion.div>
      )}

      {/* File Context Bar — pin files for real-time editing */}
      <FileContextBar />

      {/* Input Area */}
      <div style={{
        padding: '14px',
        borderTop: '1px solid var(--vscode-border)',
        background: 'var(--vscode-sidebar)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-end',
          background: 'var(--vscode-base)',
          border: '1px solid var(--vscode-border)',
          borderRadius: '4px',
          padding: '8px 12px',
          transition: 'border 0.2s ease',
        }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--vscode-focus)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--vscode-border)';
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected
              ? "Ask BlameBot to generate, fix, explain, or audit code... (Enter to send, Shift+Enter for newline)"
              : "Connect Ollama to start chatting..."
            }
            disabled={!isConnected && ollamaStatus !== 'idle' && ollamaStatus !== 'checking'}
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem', lineHeight: '1.5', resize: 'none',
              caretColor: 'var(--accent-cyan)', minHeight: '22px',
            }}
          />

          {isStreaming ? (
            <Button variant="danger" size="icon" onClick={cancelStream} title="Stop generation">
              <StopCircle size={16} />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || (!isConnected && ollamaStatus !== 'idle')}
              title="Send (Enter)"
            >
              <Send size={15} />
            </Button>
          )}
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px', paddingLeft: '4px' }}>
          All processing is local. No data leaves your machine.
        </p>
      </div>

      {/* Spin keyframe for loader icons */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AIChat;
