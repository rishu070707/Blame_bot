import React, { useEffect, useRef, useState } from 'react';
import Editor, { useMonaco, Monaco } from '@monaco-editor/react';
import { useAppStore } from '../../store/appStore';
import { applyCodeEdit } from '../../services/tauriService';

export const MonacoPane: React.FC = () => {
  const { openTabs, activeTabId, updateTab } = useAppStore();
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  const activeTab = openTabs.find(t => t.id === activeTabId);

  // Setup Monaco theme & shortcuts
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('blamebot-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1e1e1e',
        }
      });
      monaco.editor.setTheme('blamebot-dark');
    }
  }, [monaco]);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      const currentTab = useAppStore.getState().openTabs.find(t => t.id === useAppStore.getState().activeTabId);
      if (currentTab && currentTab.isDirty && currentTab.content) {
        try {
          await applyCodeEdit(currentTab.path, currentTab.content);
          useAppStore.getState().updateTab(currentTab.id, { isDirty: false });
          useAppStore.getState().addNotification({
            type: 'success',
            title: 'Saved',
            message: currentTab.name,
            duration: 2000,
          });
        } catch (e: any) {
          useAppStore.getState().addNotification({
            type: 'error',
            title: 'Save Failed',
            message: e.toString(),
            duration: 5000,
          });
        }
      }
    });
  };

  if (!activeTab) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', width: '100%', background: 'var(--vscode-base)',
        color: 'var(--text-muted)', fontSize: '24px', fontWeight: 500, letterSpacing: '0.05em'
      }}>
        BlameBot
      </div>
    );
  }

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateTab(activeTab.id, { content: value, isDirty: true });
    }
  };

  const getLanguage = (lang?: string) => {
    if (!lang) return 'plaintext';
    if (lang === 'typescript') return 'typescript';
    if (lang === 'javascript') return 'javascript';
    if (lang === 'python') return 'python';
    if (lang === 'rust') return 'rust';
    if (lang === 'go') return 'go';
    if (lang === 'json') return 'json';
    if (lang === 'css') return 'css';
    if (lang === 'html') return 'html';
    return lang;
  };

  return (
    <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
      <Editor
        height="100%"
        width="100%"
        theme="blamebot-dark"
        language={getLanguage(activeTab.language)}
        path={activeTab.path}
        value={activeTab.content || ''}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.5,
          padding: { top: 16 },
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          formatOnPaste: true,
        }}
      />
    </div>
  );
};
