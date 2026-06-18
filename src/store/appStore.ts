import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, ChatMessage, OllamaModel, OllamaStatus, SecurityAuditReport, PerformanceAuditReport, AppSettings, AppView, NotificationItem, IndexedFile, EditorTab, TerminalSession, PanelLayout } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export interface ContextFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

interface AppState {
  currentView: AppView; isCommandBarOpen: boolean;
  projects: Project[]; activeProjectId: string | null;
  chatMessages: ChatMessage[]; ollamaStatus: OllamaStatus;
  availableModels: OllamaModel[]; activeModel: string;
  securityReport: SecurityAuditReport | null; performanceReport: PerformanceAuditReport | null;
  isAuditRunning: boolean; auditProgress: number;
  indexedFiles: IndexedFile[]; isIndexing: boolean; indexingProgress: number; lastSearchQuery: string;
  settings: AppSettings; notifications: NotificationItem[]; isSidebarCollapsed: boolean;
  contextFiles: ContextFile[];

  // Editor State
  openTabs: EditorTab[];
  activeTabId: string | null;
  expandedDirs: Set<string>;
  
  // Terminal State
  terminals: TerminalSession[];
  activeTerminalId: string | null;

  // Panel Layout
  panelLayout: PanelLayout;

  setCurrentView: (v: AppView) => void; toggleCommandBar: () => void;
  openCommandBar: () => void; closeCommandBar: () => void;
  addProject: (p: Project) => void; removeProject: (id: string) => void;
  setActiveProject: (id: string | null) => void; updateProject: (id: string, u: Partial<Project>) => void;
  addMessage: (m: ChatMessage) => void; updateMessage: (id: string, u: Partial<ChatMessage>) => void;
  clearChat: () => void; setOllamaStatus: (s: OllamaStatus) => void;
  setAvailableModels: (m: OllamaModel[]) => void; setActiveModel: (m: string) => void;
  setSecurityReport: (r: SecurityAuditReport | null) => void;
  setPerformanceReport: (r: PerformanceAuditReport | null) => void;
  setAuditRunning: (r: boolean, p?: number) => void; setAuditProgress: (p: number) => void;
  setIndexedFiles: (f: IndexedFile[]) => void; setIndexing: (i: boolean, p?: number) => void;
  setLastSearchQuery: (q: string) => void;
  updateSettings: (u: Partial<AppSettings>) => void; resetSettings: () => void;
  addNotification: (n: Omit<NotificationItem, 'id'>) => void; removeNotification: (id: string) => void;
  toggleSidebar: () => void;
  addContextFile: (f: ContextFile) => void;
  removeContextFile: (path: string) => void;
  clearContextFiles: () => void;

  // Editor Actions
  openTab: (tab: EditorTab) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string | null) => void;
  updateTab: (id: string, updates: Partial<EditorTab>) => void;
  toggleDirExpanded: (path: string) => void;

  // Terminal Actions
  addTerminal: (term: TerminalSession) => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string | null) => void;
  appendTerminalOutput: (id: string, output: string) => void;

  // Panel Actions
  updatePanelLayout: (updates: Partial<PanelLayout>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'dashboard', isCommandBarOpen: false,
      projects: [], activeProjectId: null,
      chatMessages: [], ollamaStatus: 'idle', availableModels: [], activeModel: 'qwen2.5-coder:1.5b',
      securityReport: null, performanceReport: null, isAuditRunning: false, auditProgress: 0,
      indexedFiles: [], isIndexing: false, indexingProgress: 0, lastSearchQuery: '',
      settings: DEFAULT_SETTINGS, notifications: [], isSidebarCollapsed: false,
      contextFiles: [],

      openTabs: [], activeTabId: null, expandedDirs: new Set(),
      terminals: [], activeTerminalId: null,
      panelLayout: { sidebarWidth: 260, rightPanelWidth: 320, terminalHeight: 200, terminalOpen: false, rightPanelOpen: true },

      setCurrentView: (v) => set({ currentView: v }),
      toggleCommandBar: () => set((s) => ({ isCommandBarOpen: !s.isCommandBarOpen })),
      openCommandBar: () => set({ isCommandBarOpen: true }),
      closeCommandBar: () => set({ isCommandBarOpen: false }),
      addProject: (p) => set((s) => ({ projects: [p, ...s.projects], activeProjectId: p.id })),
      removeProject: (id) => set((s) => ({ projects: s.projects.filter(p => p.id !== id), activeProjectId: s.activeProjectId === id ? null : s.activeProjectId })),
      setActiveProject: (id) => set({ activeProjectId: id }),
      updateProject: (id, u) => set((s) => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...u } : p) })),
      addMessage: (m) => set((s) => ({ chatMessages: [...s.chatMessages, m] })),
      updateMessage: (id, u) => set((s) => ({ chatMessages: s.chatMessages.map(m => m.id === id ? { ...m, ...u } : m) })),
      clearChat: () => set({ chatMessages: [] }),
      setOllamaStatus: (s) => set({ ollamaStatus: s }),
      setAvailableModels: (m) => set({ availableModels: m }),
      setActiveModel: (m) => set((s) => ({ activeModel: m, settings: { ...s.settings, defaultModel: m } })),
      setSecurityReport: (r) => set({ securityReport: r }),
      setPerformanceReport: (r) => set({ performanceReport: r }),
      setAuditRunning: (r, p = 0) => set({ isAuditRunning: r, auditProgress: p }),
      setAuditProgress: (p) => set({ auditProgress: p }),
      setIndexedFiles: (f) => set({ indexedFiles: f }),
      setIndexing: (i, p = 0) => set({ isIndexing: i, indexingProgress: p }),
      setLastSearchQuery: (q) => set({ lastSearchQuery: q }),
      updateSettings: (u) => set((s) => ({ settings: { ...s.settings, ...u } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      addNotification: (n) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        set((s) => ({ notifications: [...s.notifications, { ...n, id }] }));
        const dur = n.duration ?? 4000;
        if (dur > 0) setTimeout(() => get().removeNotification(id), dur);
      },
      removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) })),
      toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
      addContextFile: (f) => set((s) => ({ contextFiles: s.contextFiles.some(c => c.path === f.path) ? s.contextFiles : [...s.contextFiles, f] })),
      removeContextFile: (path) => set((s) => ({ contextFiles: s.contextFiles.filter(c => c.path !== path) })),
      clearContextFiles: () => set({ contextFiles: [] }),

      // Editor Actions
      openTab: (tab) => set((s) => {
        if (s.openTabs.some(t => t.id === tab.id)) return { activeTabId: tab.id };
        return { openTabs: [...s.openTabs, tab], activeTabId: tab.id };
      }),
      closeTab: (id) => set((s) => {
        const newTabs = s.openTabs.filter(t => t.id !== id);
        let newActive = s.activeTabId;
        if (s.activeTabId === id) {
          newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
        }
        return { openTabs: newTabs, activeTabId: newActive };
      }),
      setActiveTab: (id) => set({ activeTabId: id }),
      updateTab: (id, updates) => set((s) => ({
        openTabs: s.openTabs.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      toggleDirExpanded: (path) => set((s) => {
        const newExpanded = new Set(s.expandedDirs);
        if (newExpanded.has(path)) newExpanded.delete(path);
        else newExpanded.add(path);
        return { expandedDirs: newExpanded };
      }),

      // Terminal Actions
      addTerminal: (term) => set((s) => ({ terminals: [...s.terminals, term], activeTerminalId: term.id, panelLayout: { ...s.panelLayout, terminalOpen: true } })),
      removeTerminal: (id) => set((s) => {
        const newTerms = s.terminals.filter(t => t.id !== id);
        let newActive = s.activeTerminalId;
        if (s.activeTerminalId === id) {
          newActive = newTerms.length > 0 ? newTerms[newTerms.length - 1].id : null;
        }
        return { terminals: newTerms, activeTerminalId: newActive, panelLayout: { ...s.panelLayout, terminalOpen: newTerms.length > 0 } };
      }),
      setActiveTerminal: (id) => set({ activeTerminalId: id }),
      appendTerminalOutput: (id, output) => set((s) => ({
        terminals: s.terminals.map(t => t.id === id ? { ...t, output: [...t.output, output] } : t)
      })),

      // Panel Actions
      updatePanelLayout: (updates) => set((s) => ({ panelLayout: { ...s.panelLayout, ...updates } })),
    }),
    {
      name: 'blamebot-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ projects: s.projects, activeProjectId: s.activeProjectId, activeModel: s.activeModel, settings: s.settings, isSidebarCollapsed: s.isSidebarCollapsed, panelLayout: s.panelLayout }),
    }
  )
);

export const selectActiveProject = (s: AppState) => s.projects.find(p => p.id === s.activeProjectId) ?? null;
export const selectOllamaConnected = (s: AppState) => s.ollamaStatus === 'connected' || s.ollamaStatus === 'streaming';
