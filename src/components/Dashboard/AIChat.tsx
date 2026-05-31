import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Trash2, Copy, Download, Zap, Bot, User,
  StopCircle, Code2, AlertTriangle, Terminal, RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useOllama } from '../../hooks/useOllama';
import { ThinkingDots, Button, EmptyState, LoadingSpinner } from '../ui';
import { applyCodeEdit, saveFileDialog } from '../../services/tauriService';
import type { ChatMessage } from '../../types';

// ─── Custom Code Block ────────────────────────────────────────

const CustomCodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const meta = node?.data?.meta || node?.meta || props.meta || '';
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    try {
      setApplying(true);
      const codeToApply = String(children).replace(/\n$/, '');
      const store = useAppStore.getState();
      const activeProject = store.projects.find(p => p.id === store.activeProjectId);
      
      let targetPath = '';
      if (meta && activeProject) {
        const cleanMeta = meta.trim();
        if (cleanMeta.startsWith('/') || cleanMeta.match(/^[a-zA-Z]:\\/)) {
          targetPath = cleanMeta;
        } else {
          const separator = activeProject.path.includes('\\') ? '\\' : '/';
          const normalizedMeta = cleanMeta.replace(/[\\/]/g, separator);
          targetPath = `${activeProject.path}${activeProject.path.endsWith(separator) ? '' : separator}${normalizedMeta}`;
        }
      }

      let finalPath = targetPath;
      if (!finalPath) {
        finalPath = await saveFileDialog() || '';
      }

      if (finalPath) {
        await applyCodeEdit(finalPath, codeToApply);
        alert('Applied successfully to: ' + finalPath);
      }
    } catch (e: any) {
      alert('Failed to apply to file: ' + e);
    } finally {
      setApplying(false);
    }
  };

  if (!inline && match) {
    return (
      <div style={{ position: 'relative', marginTop: '16px', marginBottom: '16px', border: 'var(--border-width) solid #000', boxShadow: '4px 4px 0px #000' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#000', padding: '8px 12px',
          borderBottom: 'var(--border-width) solid #000',
        }}>
          <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'var(--font-mono)' }}>
            {match[1]} {meta && <span style={{ color: '#ccc', marginLeft: '6px' }}>{meta}</span>}
          </span>
          <button
            onClick={handleApply}
            disabled={applying}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--accent-cyan)',
              color: '#000',
              border: 'none',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            <CheckCircle size={14} style={{ color: '#000' }} />
            {applying ? 'Applying...' : 'Apply to File'}
          </button>
        </div>
        <pre className={className} style={{
          margin: 0, padding: '16px', background: '#000', color: '#fff',
          overflowX: 'auto',
          fontSize: '0.875rem',
          fontFamily: 'var(--font-mono)'
        }} {...props}>
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
        width: 32, height: 32, flexShrink: 0,
        border: '2px solid #000',
        background: isUser
          ? 'var(--accent-purple)'
          : 'var(--accent-cyan)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '2px 2px 0px #000',
      }}>
        {isUser
          ? <User size={14} style={{ color: '#000' }} />
          : <Bot size={14} style={{ color: '#000' }} />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          padding: isUser ? '10px 16px' : '12px 16px',
          background: isUser
            ? '#fff'
            : '#fff',
          border: 'var(--border-width) solid #000',
          boxShadow: '4px 4px 0px #000',
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
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-surface)', border: 'var(--border-width) solid #000',
      boxShadow: '4px 4px 0px #000', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: 'var(--border-width) solid #000',
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--accent-cyan)', border: '2px solid #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '2px 2px 0px #000',
          }}>
            <Bot size={16} style={{ color: '#000' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              BlameBot AI
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: 10, height: 10, flexShrink: 0, border: '2px solid #000',
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
                      padding: '8px 12px',
                      background: '#fff', border: '2px solid #000', boxShadow: '2px 2px 0px #000',
                      color: '#000', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase',
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

      {/* Input Area */}
      <div style={{
        padding: '14px 16px',
        borderTop: 'var(--border-width) solid #000',
        background: '#fff',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-end',
          background: '#fff',
          border: 'var(--border-width) solid #000',
          padding: '10px 12px',
          boxShadow: '4px 4px 0px #000',
          transition: 'all 0.1s step-end',
        }}
          onFocusCapture={(e) => {
            e.currentTarget.style.background = 'var(--accent-yellow)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.background = '#fff';
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
    </div>
  );
};

export default AIChat;
