import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Trash2, Copy, Download, Zap, Bot, User,
  StopCircle, Code2, AlertTriangle, Terminal, RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useOllama } from '../../hooks/useOllama';
import { ThinkingDots, Button, EmptyState, LoadingSpinner } from '../ui';
import type { ChatMessage } from '../../types';

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
        borderRadius: isUser ? 'var(--radius-md)' : 'var(--radius-full)',
        background: isUser
          ? 'linear-gradient(135deg, var(--accent-purple), #A78BFA)'
          : 'linear-gradient(135deg, var(--accent-cyan), #0EA5E9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isUser ? 'var(--shadow-glow-purple)' : 'var(--shadow-glow-cyan)',
      }}>
        {isUser
          ? <User size={14} style={{ color: '#fff' }} />
          : <Bot size={14} style={{ color: '#0F172A' }} />
        }
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          padding: isUser ? '10px 16px' : '12px 16px',
          borderRadius: isUser
            ? 'var(--radius-xl) var(--radius-sm) var(--radius-xl) var(--radius-xl)'
            : 'var(--radius-sm) var(--radius-xl) var(--radius-xl) var(--radius-xl)',
          background: isUser
            ? 'linear-gradient(135deg, var(--accent-purple-dim), rgba(139,92,246,0.08))'
            : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'rgba(139,92,246,0.25)' : 'var(--border-base)'}`,
          boxShadow: 'var(--shadow-sm)',
        }}>
          {message.isStreaming && !message.content ? (
            <ThinkingDots />
          ) : (
            <div className="prose" style={{ color: 'var(--text-primary)' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
      background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-base)', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--accent-cyan), #0EA5E9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-cyan)',
          }}>
            <Bot size={16} style={{ color: '#0F172A' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              BlameBot AI
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isConnected ? 'var(--success)' : 'var(--danger)',
                ...(isConnected && { boxShadow: '0 0 6px var(--success)' }),
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
                      padding: '6px 12px', borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-card)', border: '1px solid var(--border-base)',
                      color: 'var(--text-secondary)', fontSize: '0.8rem',
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
        borderTop: '1px solid var(--border-base)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'flex-end',
          background: 'var(--bg-base)',
          border: '1px solid var(--border-base)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 12px',
          boxShadow: 'var(--shadow-inset)',
          transition: 'border-color var(--transition-fast)',
        }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-accent)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-base)';
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
