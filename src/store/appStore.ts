import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Project, ChatMessage, ChatSession, OllamaModel, OllamaStatus,
  SecurityAuditReport, PerformanceAuditReport, AppSettings, AppView,
  NotificationItem, IndexedFile, EditorTab, TerminalSession, PanelLayout, CursorPosition
} from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface ContextFile {
  path: string;
  name: string;
  content: string;
  language: string;
}

const createDefaultSession = (model: string): ChatSession => ({
  id: uuidv4(),
  title: 'New Chat',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  model,
});

interface AppState {
  currentView: AppView;
  isCommandBarOpen: boolean;
  projects: Project[];
  activeProjectId: string | null;

  // Chat / AI
  chatMessages: ChatMessage[];   // legacy - active session messages shortcut
  ollamaStatus: OllamaStatus;
  availableModels: OllamaModel[];
  activeModel: string;
  chatSessions: ChatSession[];
  activeChatSessionId: string | null;

  // Audit
  securityReport: SecurityAuditReport | null;
  performanceReport: PerformanceAuditReport | null;
  isAuditRunning: boolean;
  auditProgress: number;

  // Indexing / Search
  indexedFiles: IndexedFile[];
  isIndexing: boolean;
  indexingProgress: number;
  lastSearchQuery: string;

  // App State
  settings: AppSettings;
  notifications: NotificationItem[];
  isSidebarCollapsed: boolean;
  contextFiles: ContextFile[];

  // Editor State
  openTabs: EditorTab[];
  activeTabId: string | null;
  expandedDirs: Set<string>;
  cursorPosition: CursorPosition;

  // Terminal State
  terminals: TerminalSession[];
  activeTerminalId: string | null;

  // Panel Layout
  panelLayout: PanelLayout;

  // ─── Actions ─────────────────────────────────────────────────
  setCurrentView: (v: AppView) => void;
  toggleCommandBar: () => void;
  openCommandBar: () => void;
  closeCommandBar: () => void;

  addProject: (p: Project) => void;
  removeProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  updateProject: (id: string, u: Partial<Project>) => void;

  // Legacy message actions (operate on active session)
  addMessage: (m: ChatMessage) => void;
  updateMessage: (id: string, u: Partial<ChatMessage>) => void;
  clearChat: () => void;

  // Chat session actions
  createChatSession: () => string;
  deleteChatSession: (id: string) => void;
  setActiveChatSession: (id: string) => void;
  renameChatSession: (id: string, title: string) => void;
  addMessageToSession: (sessionId: string, m: ChatMessage) => void;
  updateMessageInSession: (sessionId: string, msgId: string, u: Partial<ChatMessage>) => void;

  setOllamaStatus: (s: OllamaStatus) => void;
  setAvailableModels: (m: OllamaModel[]) => void;
  setActiveModel: (m: string) => void;

  setSecurityReport: (r: SecurityAuditReport | null) => void;
  setPerformanceReport: (r: PerformanceAuditReport | null) => void;
  setAuditRunning: (r: boolean, p?: number) => void;
  setAuditProgress: (p: number) => void;

  setIndexedFiles: (f: IndexedFile[]) => void;
  setIndexing: (i: boolean, p?: number) => void;
  setLastSearchQuery: (q: string) => void;

  updateSettings: (u: Partial<AppSettings>) => void;
  resetSettings: () => void;

  addNotification: (n: Omit<NotificationItem, 'id'>) => void;
  removeNotification: (id: string) => void;

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
  setCursorPosition: (pos: CursorPosition) => void;

  // Terminal Actions
  addTerminal: (term: TerminalSession) => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string | null) => void;
  appendTerminalOutput: (id: string, output: string) => void;
  addToTerminalHistory: (id: string, cmd: string) => void;
  updateTerminalCwd: (id: string, cwd: string) => void;

  // Panel Actions
  updatePanelLayout: (updates: Partial<PanelLayout>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'dashboard',
      isCommandBarOpen: false,
      projects: [],
      activeProjectId: null,

      chatMessages: [],
      ollamaStatus: 'idle',
      availableModels: [],
      activeModel: 'qwen2.5-coder:1.5b',
      chatSessions: [],
      activeChatSessionId: null,

      securityReport: null,
      performanceReport: null,
      isAuditRunning: false,
      auditProgress: 0,

      indexedFiles: [],
      isIndexing: false,
      indexingProgress: 0,
      lastSearchQuery: '',

      settings: DEFAULT_SETTINGS,
      notifications: [],
      isSidebarCollapsed: false,
      contextFiles: [],

      openTabs: [],
      activeTabId: null,
      expandedDirs: new Set(),
      cursorPosition: { line: 1, column: 1 },

      terminals: [],
      activeTerminalId: null,
      panelLayout: {
        sidebarWidth: 260,
        rightPanelWidth: 340,
        terminalHeight: 220,
        terminalOpen: false,
        rightPanelOpen: true,
      },

      // View / Command Bar
      setCurrentView: (v) => set({ currentView: v }),
      toggleCommandBar: () => set((s) => ({ isCommandBarOpen: !s.isCommandBarOpen })),
      openCommandBar: () => set({ isCommandBarOpen: true }),
      closeCommandBar: () => set({ isCommandBarOpen: false }),

      // Projects
      addProject: (p) => set((s) => ({ projects: [p, ...s.projects], activeProjectId: p.id })),
      removeProject: (id) => set((s) => ({
        projects: s.projects.filter(p => p.id !== id),
        activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
      })),
      setActiveProject: (id) => set({ activeProjectId: id }),
      updateProject: (id, u) => set((s) => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...u } : p) })),

      // Legacy message actions (operate on active session's messages + chatMessages mirror)
      addMessage: (m) => set((s) => {
        const sessionId = s.activeChatSessionId;
        if (!sessionId) {
          return { chatMessages: [...s.chatMessages, m] };
        }
        return {
          chatMessages: [...s.chatMessages, m],
          chatSessions: s.chatSessions.map(sess =>
            sess.id === sessionId
              ? { ...sess, messages: [...sess.messages, m], updatedAt: new Date() }
              : sess
          ),
        };
      }),
      updateMessage: (id, u) => set((s) => {
        const sessionId = s.activeChatSessionId;
        const updated = s.chatMessages.map(m => m.id === id ? { ...m, ...u } : m);
        return {
          chatMessages: updated,
          chatSessions: sessionId ? s.chatSessions.map(sess =>
            sess.id === sessionId
              ? { ...sess, messages: sess.messages.map(m => m.id === id ? { ...m, ...u } : m), updatedAt: new Date() }
              : sess
          ) : s.chatSessions,
        };
      }),
      clearChat: () => set((s) => {
        const sessionId = s.activeChatSessionId;
        return {
          chatMessages: [],
          chatSessions: sessionId ? s.chatSessions.map(sess =>
            sess.id === sessionId ? { ...sess, messages: [], updatedAt: new Date() } : sess
          ) : s.chatSessions,
        };
      }),

      // Chat Sessions
      createChatSession: () => {
        const state = get();
        const session = createDefaultSession(state.activeModel);
        set((s) => ({
          chatSessions: [session, ...s.chatSessions],
          activeChatSessionId: session.id,
          chatMessages: [],
        }));
        return session.id;
      },
      deleteChatSession: (id) => set((s) => {
        const remaining = s.chatSessions.filter(sess => sess.id !== id);
        const newActive = s.activeChatSessionId === id
          ? (remaining[0]?.id ?? null)
          : s.activeChatSessionId;
        const activeSess = remaining.find(sess => sess.id === newActive);
        return {
          chatSessions: remaining,
          activeChatSessionId: newActive,
          chatMessages: activeSess?.messages ?? [],
        };
      }),
      setActiveChatSession: (id) => set((s) => {
        const sess = s.chatSessions.find(sess => sess.id === id);
        return { activeChatSessionId: id, chatMessages: sess?.messages ?? [] };
      }),
      renameChatSession: (id, title) => set((s) => ({
        chatSessions: s.chatSessions.map(sess => sess.id === id ? { ...sess, title } : sess),
      })),
      addMessageToSession: (sessionId, m) => set((s) => ({
        chatSessions: s.chatSessions.map(sess =>
          sess.id === sessionId ? { ...sess, messages: [...sess.messages, m], updatedAt: new Date() } : sess
        ),
      })),
      updateMessageInSession: (sessionId, msgId, u) => set((s) => ({
        chatSessions: s.chatSessions.map(sess =>
          sess.id === sessionId
            ? { ...sess, messages: sess.messages.map(m => m.id === msgId ? { ...m, ...u } : m) }
            : sess
        ),
      })),

      // Ollama
      setOllamaStatus: (s) => set({ ollamaStatus: s }),
      setAvailableModels: (m) => set({ availableModels: m }),
      setActiveModel: (m) => set((s) => ({ activeModel: m, settings: { ...s.settings, defaultModel: m } })),

      // Audit
      setSecurityReport: (r) => set({ securityReport: r }),
      setPerformanceReport: (r) => set({ performanceReport: r }),
      setAuditRunning: (r, p = 0) => set({ isAuditRunning: r, auditProgress: p }),
      setAuditProgress: (p) => set({ auditProgress: p }),

      // Indexing
      setIndexedFiles: (f) => set({ indexedFiles: f }),
      setIndexing: (i, p = 0) => set({ isIndexing: i, indexingProgress: p }),
      setLastSearchQuery: (q) => set({ lastSearchQuery: q }),

      // Settings
      updateSettings: (u) => set((s) => ({ settings: { ...s.settings, ...u } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

      // Notifications
      addNotification: (n) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        set((s) => ({ notifications: [...s.notifications, { ...n, id }] }));
        const dur = n.duration ?? 4000;
        if (dur > 0) setTimeout(() => get().removeNotification(id), dur);
      },
      removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) })),

      toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

      // Context Files
      addContextFile: (f) => set((s) => ({ contextFiles: s.contextFiles.some(c => c.path === f.path) ? s.contextFiles : [...s.contextFiles, f] })),
      removeContextFile: (path) => set((s) => ({ contextFiles: s.contextFiles.filter(c => c.path !== path) })),
      clearContextFiles: () => set({ contextFiles: [] }),

      // Editor
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
        openTabs: s.openTabs.map(t => t.id === id ? { ...t, ...updates } : t),
      })),
      toggleDirExpanded: (path) => set((s) => {
        const newExpanded = new Set(s.expandedDirs);
        if (newExpanded.has(path)) newExpanded.delete(path);
        else newExpanded.add(path);
        return { expandedDirs: newExpanded };
      }),
      setCursorPosition: (pos) => set({ cursorPosition: pos }),

      // Terminals
      addTerminal: (term) => set((s) => ({
        terminals: [...s.terminals, { ...term, history: term.history ?? [] }],
        activeTerminalId: term.id,
        panelLayout: { ...s.panelLayout, terminalOpen: true },
      })),
      removeTerminal: (id) => set((s) => {
        const newTerms = s.terminals.filter(t => t.id !== id);
        let newActive = s.activeTerminalId;
        if (s.activeTerminalId === id) {
          newActive = newTerms.length > 0 ? newTerms[newTerms.length - 1].id : null;
        }
        return {
          terminals: newTerms,
          activeTerminalId: newActive,
          panelLayout: { ...s.panelLayout, terminalOpen: newTerms.length > 0 },
        };
      }),
      setActiveTerminal: (id) => set({ activeTerminalId: id }),
      appendTerminalOutput: (id, output) => set((s) => ({
        terminals: s.terminals.map(t => t.id === id ? { ...t, output: [...t.output, output] } : t),
      })),
      addToTerminalHistory: (id, cmd) => set((s) => ({
        terminals: s.terminals.map(t => t.id === id
          ? { ...t, history: [...(t.history ?? []).filter(c => c !== cmd), cmd].slice(-100) }
          : t
        ),
      })),
      updateTerminalCwd: (id, cwd) => set((s) => ({
        terminals: s.terminals.map(t => t.id === id ? { ...t, cwd } : t),
      })),

      // Panel
      updatePanelLayout: (updates) => set((s) => ({ panelLayout: { ...s.panelLayout, ...updates } })),
    }),
    {
      name: 'blamebot-v2-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        projects: s.projects,
        activeProjectId: s.activeProjectId,
        activeModel: s.activeModel,
        settings: s.settings,
        isSidebarCollapsed: s.isSidebarCollapsed,
        panelLayout: s.panelLayout,
        chatSessions: s.chatSessions.slice(0, 20), // keep last 20 sessions
        activeChatSessionId: s.activeChatSessionId,
      }),
    }
  )
);

export const selectActiveProject = (s: AppState) => s.projects.find(p => p.id === s.activeProjectId) ?? null;
export const selectOllamaConnected = (s: AppState) => s.ollamaStatus === 'connected' || s.ollamaStatus === 'streaming';
export const selectActiveSession = (s: AppState) => s.chatSessions.find(sess => sess.id === s.activeChatSessionId) ?? null;
