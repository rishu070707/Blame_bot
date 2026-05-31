import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, ChatMessage, OllamaModel, OllamaStatus, SecurityAuditReport, PerformanceAuditReport, AppSettings, AppView, NotificationItem, IndexedFile } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface AppState {
  currentView: AppView; isCommandBarOpen: boolean;
  projects: Project[]; activeProjectId: string | null;
  chatMessages: ChatMessage[]; ollamaStatus: OllamaStatus;
  availableModels: OllamaModel[]; activeModel: string;
  securityReport: SecurityAuditReport | null; performanceReport: PerformanceAuditReport | null;
  isAuditRunning: boolean; auditProgress: number;
  indexedFiles: IndexedFile[]; isIndexing: boolean; indexingProgress: number; lastSearchQuery: string;
  settings: AppSettings; notifications: NotificationItem[]; isSidebarCollapsed: boolean;

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
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentView: 'dashboard', isCommandBarOpen: false,
      projects: [], activeProjectId: null,
      chatMessages: [], ollamaStatus: 'idle', availableModels: [], activeModel: 'deepseek-coder',
      securityReport: null, performanceReport: null, isAuditRunning: false, auditProgress: 0,
      indexedFiles: [], isIndexing: false, indexingProgress: 0, lastSearchQuery: '',
      settings: DEFAULT_SETTINGS, notifications: [], isSidebarCollapsed: false,

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
        const id = `notif-${Date.now()}`;
        set((s) => ({ notifications: [...s.notifications, { ...n, id }] }));
        const dur = n.duration ?? 4000;
        if (dur > 0) setTimeout(() => get().removeNotification(id), dur);
      },
      removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) })),
      toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
    }),
    {
      name: 'blamebot-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ projects: s.projects, activeProjectId: s.activeProjectId, activeModel: s.activeModel, settings: s.settings, isSidebarCollapsed: s.isSidebarCollapsed }),
    }
  )
);

export const selectActiveProject = (s: AppState) => s.projects.find(p => p.id === s.activeProjectId) ?? null;
export const selectOllamaConnected = (s: AppState) => s.ollamaStatus === 'connected' || s.ollamaStatus === 'streaming';
