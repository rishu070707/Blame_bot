import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { TerminalSquare, X, Plus, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

// ─── ANSI color parser ─────────────────────────────────────────

const parseAnsi = (text: string): React.ReactNode[] => {
  // Basic ANSI escape code parsing
  const parts: React.ReactNode[] = [];
  const regex = /\x1b\[([0-9;]*)m/g;
  let lastIndex = 0;
  let currentStyle: React.CSSProperties = {};
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  const colorMap: Record<string, string> = {
    '30': '#1e1e1e', '31': '#f14c4c', '32': '#89d185', '33': '#cca700',
    '34': '#6796e6', '35': '#b267e6', '36': '#2bbac5', '37': '#cccccc',
    '90': '#666666', '91': '#f1897f', '92': '#b5d5a0', '93': '#e9c46a',
    '94': '#82b4ff', '95': '#d7a0f9', '96': '#67e7f9', '97': '#f0f0f0',
  };

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const fragment = text.substring(lastIndex, match.index);
      if (fragment) parts.push(<span key={keyIdx++} style={currentStyle}>{fragment}</span>);
    }

    const codes = match[1].split(';').map(Number);
    const newStyle: React.CSSProperties = { ...currentStyle };

    for (const code of codes) {
      if (code === 0) {
        Object.keys(newStyle).forEach(k => delete (newStyle as any)[k]);
      } else if (code === 1) { newStyle.fontWeight = 'bold'; }
      else if (code === 3) { newStyle.fontStyle = 'italic'; }
      else if (code === 4) { newStyle.textDecoration = 'underline'; }
      else if (colorMap[String(code)]) { newStyle.color = colorMap[String(code)]; }
      else if (code >= 40 && code <= 47) { /* background - skip for now */ }
    }
    currentStyle = newStyle;
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    if (remaining) parts.push(<span key={keyIdx++} style={currentStyle}>{remaining}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
};

// ─── Terminal Panel ───────────────────────────────────────────

export const TerminalPanel: React.FC = () => {
  const {
    terminals, activeTerminalId, addTerminal, removeTerminal,
    setActiveTerminal, appendTerminalOutput, addToTerminalHistory,
    updateTerminalCwd, panelLayout, updatePanelLayout, projects, activeProjectId,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTerminal = terminals.find(t => t.id === activeTerminalId);
  const activeProject = projects.find(p => p.id === activeProjectId);

  const termHeight = isMaximized ? 400 : panelLayout.terminalHeight;

  // Scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminals, activeTerminalId]);

  // Focus input when terminal opens
  useEffect(() => {
    if (panelLayout.terminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [panelLayout.terminalOpen, activeTerminalId]);

  const getPrompt = useCallback(() => {
    const cwd = activeTerminal?.cwd ?? activeProject?.path ?? 'C:\\';
    const shortCwd = cwd.length > 40 ? '…' + cwd.slice(-37) : cwd;
    return shortCwd;
  }, [activeTerminal, activeProject]);

  const handleRunCommand = async () => {
    if (!input.trim() || !activeTerminalId) return;
    const cmd = input.trim();
    setInput('');
    setHistoryIndex(-1);

    const activeCwd = activeTerminal?.cwd ?? activeProject?.path ?? 'C:\\';

    // Add to history
    addToTerminalHistory(activeTerminalId, cmd);
    appendTerminalOutput(activeTerminalId, `\x1b[32m${getPrompt()}\x1b[0m \x1b[34m›\x1b[0m ${cmd}`);

    try {
      const parts = cmd.split(' ');
      const executable = parts[0]?.toLowerCase();
      const args = parts.slice(1);

      // Handle CD (Change Directory) commands
      if (executable === 'cd') {
        const targetPath = args.join(' ').trim().replace(/^['"]|['"]$/g, '');
        if (!targetPath) {
          appendTerminalOutput(activeTerminalId, activeCwd);
          return;
        }

        const isWin = navigator.userAgent.toLowerCase().includes('win');
        let checkCmd: Command<any>;

        if (isWin) {
          checkCmd = Command.create('run-powershell', [
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            `Set-Location -LiteralPath '${targetPath.replace(/'/g, "''")}'; (Get-Location).Path`
          ], { cwd: activeCwd });
        } else {
          checkCmd = Command.create('run-sh', [
            '-c',
            `cd "${targetPath.replace(/"/g, '\\"')}" && pwd`
          ], { cwd: activeCwd });
        }

        const out = await checkCmd.execute();
        if (out.code === 0) {
          const newCwd = out.stdout.trim();
          if (newCwd) {
            updateTerminalCwd(activeTerminalId, newCwd);
          }
        } else {
          appendTerminalOutput(activeTerminalId, `\x1b[31m${out.stderr.trim() || 'The system cannot find the path specified.'}\x1b[0m`);
        }
        return;
      }

      // Execute command wrapped in powershell or sh
      const isWin = navigator.userAgent.toLowerCase().includes('win');
      let command: Command<any>;

      if (isWin) {
        command = Command.create('run-powershell', [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-Command',
          cmd
        ], { cwd: activeCwd });
      } else {
        command = Command.create('run-sh', [
          '-c',
          cmd
        ], { cwd: activeCwd });
      }

      command.stdout.on('data', line => appendTerminalOutput(activeTerminalId, line));
      command.stderr.on('data', line => appendTerminalOutput(activeTerminalId, `\x1b[31m${line}\x1b[0m`));
      command.on('error', err => appendTerminalOutput(activeTerminalId, `\x1b[31mError: ${err}\x1b[0m`));
      command.on('close', data => {
        if ((data.code ?? 0) !== 0 && data.code !== null) {
          appendTerminalOutput(activeTerminalId, `\x1b[31mProcess exited with code ${data.code}\x1b[0m`);
        }
      });

      await command.spawn();
    } catch (e: any) {
      appendTerminalOutput(activeTerminalId, `\x1b[31m${e.message ?? String(e)}\x1b[0m`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const history = activeTerminal?.history ?? [];

    if (e.key === 'Enter') {
      handleRunCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIndex);
      setInput(history[history.length - 1 - nextIndex] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(nextIndex);
      setInput(nextIndex === -1 ? '' : (history[history.length - 1 - nextIndex] ?? ''));
    } else if (e.key === 'c' && e.ctrlKey) {
      appendTerminalOutput(activeTerminalId ?? '', '^C');
      setInput('');
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      if (activeTerminalId) {
        useAppStore.getState().terminals.find(t => t.id === activeTerminalId);
        // Clear by pushing empty lines
        appendTerminalOutput(activeTerminalId, '\x1bc');
      }
    }
  };

  const createNewTerminal = () => {
    const cwd = activeProject?.path ?? 'C:\\';
    addTerminal({
      id: `term-${Date.now()}`,
      title: 'pwsh',
      cwd,
      history: [],
      output: [
        `\x1b[36mBlameBot Terminal\x1b[0m  \x1b[90mPowerShell\x1b[0m`,
        `Working directory: \x1b[33m${cwd}\x1b[0m`,
        '',
      ],
    });
  };

  // Ensure at least one terminal when open
  useEffect(() => {
    if (panelLayout.terminalOpen && terminals.length === 0) {
      createNewTerminal();
    }
  }, [panelLayout.terminalOpen, terminals.length]);

  if (!panelLayout.terminalOpen) return null;

  // Resize handle drag
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = termHeight;

    const onMouseMove = (e: MouseEvent) => {
      const delta = startY - e.clientY;
      const newHeight = Math.min(600, Math.max(80, startHeight + delta));
      updatePanelLayout({ terminalHeight: newHeight });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const renderOutput = (line: string, i: number) => {
    // Handle clear escape
    if (line === '\x1bc') {
      return null;
    }
    return (
      <div key={i} style={{ minHeight: '1px', lineHeight: '1.4' }}>
        {parseAnsi(line)}
      </div>
    );
  };

  // Find the last clear index
  const outputLines = activeTerminal?.output ?? [];
  let startIdx = 0;
  for (let i = outputLines.length - 1; i >= 0; i--) {
    if (outputLines[i] === '\x1bc') {
      startIdx = i + 1;
      break;
    }
  }
  const visibleLines = outputLines.slice(startIdx);

  return (
    <div style={{
      height: `${termHeight}px`,
      width: '100%',
      background: '#1e1e1e',
      borderTop: '1px solid var(--vscode-border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Resize handle */}
      <div
        className="resize-handle resize-handle-top"
        onMouseDown={handleResizeMouseDown}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', cursor: 'row-resize', zIndex: 10 }}
      />

      {/* Tab Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', height: '35px',
        borderBottom: '1px solid var(--vscode-border)',
        background: 'var(--vscode-panel)', paddingRight: '4px',
        flexShrink: 0,
      }}>
        {/* Panel title tabs */}
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto', height: '100%', alignItems: 'flex-end' }}>
          <div style={{
            padding: '0 16px', fontSize: '11px', fontWeight: 700,
            color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
            textTransform: 'uppercase', letterSpacing: '0.05em', height: '100%',
          }}>
            Terminal
          </div>

          {terminals.map(term => {
            const isActive = term.id === activeTerminalId;
            return (
              <div
                key={term.id}
                onClick={() => setActiveTerminal(term.id)}
                style={{
                  padding: '0 12px', height: '35px', display: 'flex', alignItems: 'center',
                  gap: '6px', cursor: 'pointer', fontSize: '12px', flexShrink: 0,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '1px solid var(--vscode-accent)' : '1px solid transparent',
                  background: isActive ? 'var(--vscode-base)' : 'transparent',
                  transition: 'color 80ms ease',
                }}
              >
                <TerminalSquare size={13} />
                <span>{term.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeTerminal(term.id); }}
                  style={{
                    background: 'none', border: 'none', color: 'inherit',
                    cursor: 'pointer', padding: '2px', display: 'flex',
                    borderRadius: '2px', transition: 'background 80ms ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={createNewTerminal}
            title="New Terminal (Ctrl+Shift+`)"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 6px', display: 'flex', borderRadius: '2px' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore' : 'Maximize'}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 6px', display: 'flex', borderRadius: '2px' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            {isMaximized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={() => updatePanelLayout({ terminalOpen: false })}
            title="Close Terminal Panel"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 6px', display: 'flex', borderRadius: '2px' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Output */}
      <div
        ref={outputRef}
        onClick={() => inputRef.current?.focus()}
        style={{
          flex: 1, overflowY: 'auto', padding: '6px 14px',
          fontFamily: 'var(--font-mono)', fontSize: '13px',
          color: '#cccccc', lineHeight: '1.4', cursor: 'text',
        }}
      >
        {visibleLines.map((line, i) => renderOutput(line, i))}
      </div>

      {/* Input Row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '4px 14px 8px 14px', gap: '6px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ color: '#89d185', fontFamily: 'var(--font-mono)', fontSize: '13px', flexShrink: 0 }}>
          {getPrompt()} <span style={{ color: '#6796e6' }}>›</span>
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#cccccc', fontFamily: 'var(--font-mono)', fontSize: '13px',
            caretColor: '#aeafad',
          }}
          placeholder="Type a command…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
