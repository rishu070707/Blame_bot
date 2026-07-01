import React, { useEffect, useRef, useCallback } from 'react';
import Editor, { useMonaco, Monaco } from '@monaco-editor/react';
import { useAppStore } from '../../store/appStore';
import { useExtensionStore } from '../../store/extensionStore';
import { applyCodeEdit } from '../../services/tauriService';
import { Files, Search, FolderOpen, Bot, Keyboard } from 'lucide-react';
import { useScanner } from '../../hooks/useScanner';

// ─── VS Code Welcome Screen ───────────────────────────────────

const WelcomeScreen: React.FC = () => {
  const { setCurrentView, projects, updatePanelLayout, openCommandBar, createChatSession, activeChatSessionId } = useAppStore();
  const { openAndScanProject } = useScanner();

  const shortcuts = [
    { keys: 'Ctrl+P', desc: 'Go to File' },
    { keys: 'Ctrl+Shift+P', desc: 'Command Palette' },
    { keys: 'Ctrl+`', desc: 'Toggle Terminal' },
    { keys: 'Ctrl+B', desc: 'Toggle Sidebar' },
    { keys: 'Ctrl+I', desc: 'Toggle AI Chat' },
    { keys: 'Ctrl+Shift+E', desc: 'Explorer' },
    { keys: 'Ctrl+Shift+F', desc: 'Search' },
    { keys: 'Ctrl+,', desc: 'Settings' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', width: '100%', background: 'var(--vscode-base)',
      color: 'var(--text-primary)', overflow: 'auto',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '700px', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
            <path d="M74.5 3L95 25.5V75L74.5 97H25.5L5 75V25.5L25.5 3H74.5Z" fill="#007ACC" />
            <path d="M38 67L62 33M38 33L62 67" stroke="white" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              BlameBot
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Offline VS Code with Unlimited AI — powered by Ollama
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Start */}
          <div>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Start
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  icon: <Files size={16} style={{ color: 'var(--vscode-accent)' }} />,
                  label: 'Open Folder…',
                  shortcut: 'Ctrl+K Ctrl+O',
                  onClick: openAndScanProject,
                },
                {
                  icon: <Search size={16} style={{ color: 'var(--vscode-accent)' }} />,
                  label: 'Go to File…',
                  shortcut: 'Ctrl+P',
                  onClick: openCommandBar,
                },
                {
                  icon: <Bot size={16} style={{ color: 'var(--vscode-accent)' }} />,
                  label: 'Open AI Chat',
                  shortcut: 'Ctrl+I',
                  onClick: () => {
                    if (!activeChatSessionId) createChatSession();
                    updatePanelLayout({ rightPanelOpen: true });
                  },
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-primary)', padding: '6px 8px',
                    borderRadius: '4px', textAlign: 'left', width: '100%',
                    fontSize: '13px', transition: 'background 80ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--vscode-hover)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                  }}
                >
                  {item.icon}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.shortcut}</span>
                </button>
              ))}
            </div>

            {/* Recent projects */}
            {projects.length > 0 && (
              <>
                <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginTop: '28px', marginBottom: '16px' }}>
                  Recent
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {projects.slice(0, 5).map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        useAppStore.getState().setActiveProject(p.id);
                        setCurrentView('dashboard');
                      }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-primary)', padding: '6px 8px',
                        borderRadius: '4px', width: '100%', textAlign: 'left',
                        transition: 'background 80ms ease',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--vscode-hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FolderOpen size={14} style={{ color: '#dcb67a', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: 'var(--vscode-accent)' }}>{p.name}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '22px', marginTop: '1px' }}>
                        {p.path}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h2 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Keyboard size={12} />
              Keyboard Shortcuts
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {shortcuts.map(s => (
                <div key={s.keys} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--vscode-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.desc}</span>
                  <kbd style={{
                    background: 'var(--vscode-panel)', border: '1px solid var(--vscode-border)',
                    borderRadius: '3px', padding: '2px 6px', fontSize: '11px',
                    color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                  }}>
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ marginTop: '40px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
          All AI processing is local — no data leaves your machine. Powered by Ollama.
        </p>
      </div>
    </div>
  );
};

// ─── Monaco Pane ──────────────────────────────────────────────

export const MonacoPane: React.FC = () => {
  const { openTabs, activeTabId, updateTab, setCursorPosition, settings } = useAppStore();
  const { activeThemeId, getEffectiveEditorConfig, reapplyTheme } = useExtensionStore();
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  const activeTab = openTabs.find(t => t.id === activeTabId);
  const extConfig = getEffectiveEditorConfig();

  // Hot-reload theme when activeThemeId changes
  useEffect(() => {
    if (monaco) {
      reapplyTheme(monaco);
    }
  }, [monaco, activeThemeId, reapplyTheme]);

  // Setup Monaco theme & config
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('blamebot-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
          { token: 'keyword', foreground: '569cd6' },
          { token: 'string', foreground: 'ce9178' },
          { token: 'number', foreground: 'b5cea8' },
          { token: 'type', foreground: '4ec9b0' },
          { token: 'function', foreground: 'dcdcaa' },
          { token: 'variable', foreground: '9cdcfe' },
          { token: 'constant', foreground: '4fc1ff' },
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
          'editor.lineHighlightBackground': '#2a2a2a',
          'editor.selectionBackground': '#264f78',
          'editor.inactiveSelectionBackground': '#3a3d41',
          'editorCursor.foreground': '#aeafad',
          'editorLineNumber.foreground': '#858585',
          'editorLineNumber.activeForeground': '#c6c6c6',
          'editorIndentGuide.background': '#404040',
          'editorIndentGuide.activeBackground': '#707070',
          'editorBracketMatch.background': '#0064001a',
          'editorBracketMatch.border': '#888888',
          'editorWidget.background': '#252526',
          'editorSuggestWidget.background': '#252526',
          'editorSuggestWidget.border': '#454545',
          'editorSuggestWidget.selectedBackground': '#094771',
          'editorOverviewRuler.border': '#3c3c3c',
          'scrollbarSlider.background': '#79797966',
          'scrollbarSlider.hoverBackground': '#646464b3',
          'scrollbarSlider.activeBackground': '#bfbfbf66',
        },
      });
      monaco.editor.setTheme('blamebot-dark');
    }
  }, [monaco]);

  const handleEditorDidMount = useCallback((editor: any, monacoInstance: Monaco) => {
    editorRef.current = editor;

    // Live cursor position tracking
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
    });

    // Ctrl+S to save
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, async () => {
      const currentTab = useAppStore.getState().openTabs.find(t => t.id === useAppStore.getState().activeTabId);
      if (currentTab && currentTab.isDirty && currentTab.content !== undefined) {
        try {
          await applyCodeEdit(currentTab.path, currentTab.content);
          useAppStore.getState().updateTab(currentTab.id, { isDirty: false });
          useAppStore.getState().addNotification({
            type: 'success', title: 'Saved', message: currentTab.name, duration: 1500,
          });
        } catch (e: any) {
          useAppStore.getState().addNotification({
            type: 'error', title: 'Save Failed', message: e.toString(), duration: 5000,
          });
        }
      }
    });

    // Ctrl+Shift+P — command palette
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyP,
      () => { useAppStore.getState().openCommandBar(); }
    );

    // Ctrl+` — terminal
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Backquote, () => {
      const s = useAppStore.getState();
      s.updatePanelLayout({ terminalOpen: !s.panelLayout.terminalOpen });
    });

    // Ctrl+I — AI chat
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyI, () => {
      const s = useAppStore.getState();
      if (!s.activeChatSessionId) s.createChatSession();
      s.updatePanelLayout({ rightPanelOpen: !s.panelLayout.rightPanelOpen });
    });
  }, [setCursorPosition]);

  if (!activeTab) {
    return <WelcomeScreen />;
  }

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateTab(activeTab.id, { content: value, isDirty: true });
    }
  };

  const getMonacoLanguage = (lang?: string): string => {
    if (!lang) return 'plaintext';
    const map: Record<string, string> = {
      typescript: 'typescript', javascript: 'javascript',
      python: 'python', rust: 'rust', go: 'go',
      java: 'java', json: 'json', yaml: 'yaml',
      toml: 'toml', css: 'css', html: 'html',
      sql: 'sql', markdown: 'markdown',
    };
    return map[lang] ?? lang;
  };

  return (
    <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
      <Editor
        height="100%"
        width="100%"
        theme="blamebot-dark"
        language={getMonacoLanguage(activeTab.language)}
        path={activeTab.path}
        value={activeTab.content ?? ''}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: extConfig.minimap ?? settings.ui?.minimap ?? true },
          fontSize: extConfig.fontSize ?? 14,
          fontFamily: extConfig.fontFamily ?? "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
          fontLigatures: settings.ui?.fontLigatures ?? true,
          lineHeight: 21,
          padding: { top: 12, bottom: 12 },
          wordWrap: (extConfig.wordWrap ?? settings.ui?.wordWrap ?? true) ? 'on' : 'off',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          cursorStyle: 'line',
          formatOnPaste: true,
          formatOnType: false,
          tabSize: extConfig.tabSize ?? 2,
          insertSpaces: extConfig.insertSpaces ?? true,
          detectIndentation: true,
          renderLineHighlight: 'line',
          lineNumbers: extConfig.lineNumbers ?? 'on',
          glyphMargin: true,
          folding: true,
          foldingHighlight: true,
          showFoldingControls: 'mouseover',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          suggest: { showIcons: true, showMethods: true },
          quickSuggestions: { other: true, comments: false, strings: false },
          acceptSuggestionOnEnter: 'on',
          snippetSuggestions: 'top',
          parameterHints: { enabled: true },
          hover: { enabled: true },
          links: true,
          mouseWheelZoom: true,
          occurrencesHighlight: 'singleFile',
          renderWhitespace: extConfig.renderWhitespace ?? 'selection',
          rulers: extConfig.rulers ?? [],
          overviewRulerLanes: 3,
          scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
};
