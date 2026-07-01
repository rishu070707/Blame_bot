import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Extension, ThemeColors, ExtensionConfig } from '../types/extensions';
import { EXTENSION_CATALOG } from '../data/extensions';

// ─── Theme Application Service ────────────────────────────────

export function applyTheme(colors: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--vscode-base', colors.base);
  root.style.setProperty('--vscode-panel', colors.panel);
  root.style.setProperty('--vscode-sidebar', colors.sidebar);
  root.style.setProperty('--vscode-activity-bar', colors.activityBar);
  root.style.setProperty('--vscode-title-bar', colors.titleBar);
  root.style.setProperty('--vscode-tab-active', colors.tabActive);
  root.style.setProperty('--vscode-tab-inactive', colors.tabInactive);
  root.style.setProperty('--vscode-border', colors.border);
  root.style.setProperty('--vscode-accent', colors.accent);
  root.style.setProperty('--vscode-accent-hover', colors.accentHover);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--vscode-selection', colors.selection);
  root.style.setProperty('--vscode-hover', colors.hover);
  root.style.setProperty('--vscode-list-active', colors.listActive);
  root.style.setProperty('--vscode-widget', colors.widget);
  root.style.setProperty('--vscode-input-bg', colors.inputBg);
  root.style.setProperty('--vscode-input-border', colors.border);
  root.style.setProperty('--success', colors.success);
  root.style.setProperty('--bg-base', colors.base);
  root.style.setProperty('--bg-surface', colors.panel);
  root.style.setProperty('--bg-card', colors.sidebar);
  root.style.setProperty('--vscode-list-hover', colors.hover);
}

export function applyMonacoTheme(monaco: any, ext: Extension) {
  if (!ext.themeColors?.monacoTheme) return;
  const { monacoTheme, monacoRules = [], monacoColors = {} } = ext.themeColors;

  if (monacoTheme !== 'blamebot-dark') {
    monaco.editor.defineTheme(monacoTheme, {
      base: 'vs-dark',
      inherit: true,
      rules: monacoRules,
      colors: monacoColors,
    });
  }
  monaco.editor.setTheme(monacoTheme);
}

// ─── Extension Store ──────────────────────────────────────────

interface ExtensionState {
  extensions: Extension[];
  activeThemeId: string;
  installedIds: Set<string>;
  enabledIds: Set<string>;
  searchQuery: string;
  selectedCategory: string;
  detailExtensionId: string | null;

  // Actions
  installExtension: (id: string) => void;
  uninstallExtension: (id: string) => void;
  enableExtension: (id: string, monaco?: any) => void;
  disableExtension: (id: string) => void;
  setActiveTheme: (id: string, monaco?: any) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string) => void;
  setDetailExtension: (id: string | null) => void;

  // Computed helpers
  getExtension: (id: string) => Extension | undefined;
  getInstalledExtensions: () => Extension[];
  getEnabledExtensions: () => Extension[];
  getActiveTheme: () => Extension | undefined;
  getEffectiveEditorConfig: () => ExtensionConfig;

  // Reapply active theme (e.g., after Monaco loads)
  reapplyTheme: (monaco?: any) => void;
}

export const useExtensionStore = create<ExtensionState>()(
  persist(
    (set, get) => ({
      extensions: EXTENSION_CATALOG,
      activeThemeId: 'blamebot.theme-dark-plus',
      installedIds: new Set(EXTENSION_CATALOG.filter(e => e.installed).map(e => e.id)),
      enabledIds: new Set(EXTENSION_CATALOG.filter(e => e.enabled).map(e => e.id)),
      searchQuery: '',
      selectedCategory: 'all',
      detailExtensionId: null,

      installExtension: (id) => {
        set(state => {
          const newInstalled = new Set(state.installedIds);
          newInstalled.add(id);
          return {
            installedIds: newInstalled,
            extensions: state.extensions.map(e =>
              e.id === id ? { ...e, installed: true } : e
            ),
          };
        });
      },

      uninstallExtension: (id) => {
        set(state => {
          const newInstalled = new Set(state.installedIds);
          newInstalled.delete(id);
          const newEnabled = new Set(state.enabledIds);
          newEnabled.delete(id);
          // Don't let active theme be uninstalled
          const newThemeId = state.activeThemeId === id ? 'blamebot.theme-dark-plus' : state.activeThemeId;
          return {
            installedIds: newInstalled,
            enabledIds: newEnabled,
            activeThemeId: newThemeId,
            extensions: state.extensions.map(e =>
              e.id === id ? { ...e, installed: false, enabled: false } : e
            ),
          };
        });
      },

      enableExtension: (id, monaco) => {
        const ext = get().extensions.find(e => e.id === id);
        if (!ext) return;

        set(state => {
          const newEnabled = new Set(state.enabledIds);
          newEnabled.add(id);
          return {
            enabledIds: newEnabled,
            extensions: state.extensions.map(e =>
              e.id === id ? { ...e, enabled: true } : e
            ),
          };
        });

        // Apply theme if it's a theme extension
        if (ext.capabilities.includes('theme') && ext.themeColors) {
          get().setActiveTheme(id, monaco);
        }
      },

      disableExtension: (id) => {
        const ext = get().extensions.find(e => e.id === id);
        if (ext?.isBuiltin) return; // can't disable builtins

        set(state => {
          const newEnabled = new Set(state.enabledIds);
          newEnabled.delete(id);
          // If this was the active theme, revert to Dark+
          let newThemeId = state.activeThemeId;
          if (state.activeThemeId === id) {
            newThemeId = 'blamebot.theme-dark-plus';
            const darkPlus = state.extensions.find(e => e.id === 'blamebot.theme-dark-plus');
            if (darkPlus?.themeColors) {
              applyTheme(darkPlus.themeColors);
            }
          }
          return {
            enabledIds: newEnabled,
            activeThemeId: newThemeId,
            extensions: state.extensions.map(e =>
              e.id === id ? { ...e, enabled: false } : e
            ),
          };
        });
      },

      setActiveTheme: (id, monaco) => {
        const ext = get().extensions.find(e => e.id === id);
        if (!ext?.themeColors) return;

        // Disable all other themes
        set(state => {
          const newEnabled = new Set(state.enabledIds);
          // Remove other themes from enabled
          state.extensions.forEach(e => {
            if (e.capabilities.includes('theme') && e.id !== id) {
              newEnabled.delete(e.id);
            }
          });
          newEnabled.add(id);
          return {
            activeThemeId: id,
            enabledIds: newEnabled,
            extensions: state.extensions.map(e => {
              if (e.capabilities.includes('theme')) {
                return { ...e, enabled: e.id === id };
              }
              return e;
            }),
          };
        });

        // Apply CSS variables
        applyTheme(ext.themeColors);

        // Apply Monaco theme
        if (monaco && ext.themeColors.monacoTheme) {
          applyMonacoTheme(monaco, ext);
        }
      },

      setSearchQuery: (q) => set({ searchQuery: q }),
      setSelectedCategory: (c) => set({ selectedCategory: c }),
      setDetailExtension: (id) => set({ detailExtensionId: id }),

      getExtension: (id) => get().extensions.find(e => e.id === id),
      getInstalledExtensions: () => get().extensions.filter(e => get().installedIds.has(e.id)),
      getEnabledExtensions: () => get().extensions.filter(e => get().enabledIds.has(e.id)),
      getActiveTheme: () => get().extensions.find(e => e.id === get().activeThemeId),

      getEffectiveEditorConfig: (): ExtensionConfig => {
        const enabled = get().getEnabledExtensions();
        const config: ExtensionConfig = {
          formatOnSave: false, minimap: true, wordWrap: true,
          vimMode: false, renderWhitespace: 'selection',
        };
        for (const ext of enabled) {
          if (ext.config) {
            Object.assign(config, ext.config);
          }
        }
        return config;
      },

      reapplyTheme: (monaco) => {
        const state = get();
        const activeTheme = state.extensions.find(e => e.id === state.activeThemeId);
        if (activeTheme?.themeColors) {
          applyTheme(activeTheme.themeColors);
          if (monaco) applyMonacoTheme(monaco, activeTheme);
        }
      },
    }),
    {
      name: 'blamebot-extensions-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeThemeId: state.activeThemeId,
        installedIds: Array.from(state.installedIds),
        enabledIds: Array.from(state.enabledIds),
      }),
      merge: (persisted: any, current) => {
        // Restore Set from array
        const installedIds = new Set<string>(persisted.installedIds ?? []);
        const enabledIds = new Set<string>(persisted.enabledIds ?? []);
        return {
          ...current,
          activeThemeId: persisted.activeThemeId ?? current.activeThemeId,
          installedIds,
          enabledIds,
          extensions: current.extensions.map(e => ({
            ...e,
            installed: installedIds.has(e.id),
            enabled: enabledIds.has(e.id),
          })),
        };
      },
    }
  )
);
