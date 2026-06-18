import React, { useState, useRef, useEffect } from 'react';
import { Command } from '@tauri-apps/plugin-shell';
import { TerminalSquare, X, Plus } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export const TerminalPanel: React.FC = () => {
  const { terminals, activeTerminalId, addTerminal, removeTerminal, setActiveTerminal, appendTerminalOutput, panelLayout, updatePanelLayout } = useAppStore();
  const [input, setInput] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminals, activeTerminalId]);

  const activeTerminal = terminals.find(t => t.id === activeTerminalId);

  const handleRunCommand = async () => {
    if (!input.trim() || !activeTerminalId) return;
    
    const cmd = input.trim();
    setInput('');
    appendTerminalOutput(activeTerminalId, `\r\n$ ${cmd}`);

    try {
      let args = cmd.split(' ');
      let executable = args.shift() || '';

      if (executable === 'npm' || executable === 'npx') {
        executable = executable + '.cmd'; // Windows specific for simple shell plugin without full path resolution
      }

      const command = Command.create(executable, args);
      
      command.stdout.on('data', line => appendTerminalOutput(activeTerminalId, line));
      command.stderr.on('data', line => appendTerminalOutput(activeTerminalId, `\x1b[31m${line}\x1b[0m`));
      command.on('error', err => appendTerminalOutput(activeTerminalId, `\x1b[31mCommand Error: ${err}\x1b[0m`));
      
      const child = await command.execute();
      if (child.code !== 0) {
        appendTerminalOutput(activeTerminalId, `\x1b[31mExited with code ${child.code}\x1b[0m`);
      }
    } catch (e: any) {
      appendTerminalOutput(activeTerminalId, `\x1b[31mError: ${e.message || e}\x1b[0m`);
    }
  };

  const createNewTerminal = () => {
    addTerminal({
      id: `term-${Date.now()}`,
      title: 'PowerShell',
      output: ['BlameBot Integrated Terminal', '----------------------------------------'],
    });
  };

  // Ensure there's always at least one terminal if open
  useEffect(() => {
    if (panelLayout.terminalOpen && terminals.length === 0) {
      createNewTerminal();
    }
  }, [panelLayout.terminalOpen, terminals.length]);

  if (!panelLayout.terminalOpen) return null;

  return (
    <div style={{
      height: panelLayout.terminalHeight,
      width: '100%',
      background: 'var(--vscode-panel)',
      borderTop: '1px solid var(--vscode-border)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Terminal Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: '35px',
        borderBottom: '1px solid var(--vscode-border)',
        paddingRight: '10px',
      }}>
        <div style={{ display: 'flex', flex: 1, overflowX: 'auto' }}>
          <div style={{ padding: '0 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', textTransform: 'uppercase' }}>
            Terminal
          </div>
          {terminals.map(term => {
            const isActive = term.id === activeTerminalId;
            return (
              <div
                key={term.id}
                onClick={() => setActiveTerminal(term.id)}
                style={{
                  padding: '0 10px',
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '1px solid var(--vscode-accent)' : '1px solid transparent',
                  fontSize: '12px',
                }}
              >
                <TerminalSquare size={13} />
                {term.title}
                <button
                  onClick={(e) => { e.stopPropagation(); removeTerminal(term.id); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', display: 'flex' }}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={createNewTerminal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <Plus size={14} />
          </button>
          <button onClick={() => updatePanelLayout({ terminalOpen: false })} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          ref={outputRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: '#cccccc',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {activeTerminal?.output.map((line, i) => (
            <div key={i} dangerouslySetInnerHTML={{ 
              __html: line
                .replace(/\x1b\[31m/g, '<span style="color: var(--danger)">')
                .replace(/\x1b\[0m/g, '</span>')
            }} />
          ))}
        </div>
        
        {/* Input */}
        <div style={{ display: 'flex', padding: '4px 14px 10px 14px', alignItems: 'center' }}>
          <span style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)', fontSize: '13px', marginRight: '8px' }}>$</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRunCommand(); }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#cccccc',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
            }}
            placeholder="Type command..."
          />
        </div>
      </div>
    </div>
  );
};
