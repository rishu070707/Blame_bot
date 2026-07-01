// BlameBot TypeScript Types

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: { format: string; family: string; parameter_size: string; quantization_level: string; };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: { model?: string; tokenCount?: number; duration?: number; };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
}

export interface OllamaRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  options?: { temperature?: number; top_p?: number; num_ctx?: number; num_predict?: number; };
}

export type OllamaStatus = 'idle' | 'checking' | 'connected' | 'error' | 'streaming';

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'rust' | 'go' | 'css' | 'html' | 'json' | 'yaml' | 'toml' | 'sql' | 'markdown' | 'unknown';

export interface FileNode {
  name: string; path: string; isDir: boolean; size?: number;
  language?: SupportedLanguage; lineCount?: number; children?: FileNode[];
}

export interface Project {
  id: string; name: string; path: string; createdAt: Date;
  lastScannedAt?: Date; fileCount?: number; totalLines?: number;
  languages?: Record<SupportedLanguage, number>; healthScore?: ProjectHealthScore;
}

export interface ProjectHealthScore {
  overall: number; security: number; performance: number; quality: number; debt: number;
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  id: string; severity: SeverityLevel; type: string; title: string;
  description: string; file: string; line?: number; snippet?: string;
  cwe?: string; suggestedFix?: string; confidence: number;
}

export interface SecurityAuditReport {
  projectId: string; generatedAt: Date; totalFindings: number;
  criticalCount: number; highCount: number; mediumCount: number; lowCount: number;
  securityScore: number; findings: SecurityFinding[];
}

export interface PerformanceFinding {
  id: string; severity: SeverityLevel; type: string; title: string;
  description: string; file: string; line?: number; snippet?: string;
  impact: 'high' | 'medium' | 'low'; suggestedFix?: string;
}

export interface PerformanceAuditReport {
  projectId: string; generatedAt: Date; totalFindings: number;
  performanceScore: number; findings: PerformanceFinding[];
}

export interface IndexedFile {
  path: string; language: SupportedLanguage; content: string;
  tokens: string[]; tfScores: Record<string, number>; lineCount: number; size: number;
}

export interface SearchResult {
  file: string; language: SupportedLanguage; score: number;
  matchedLines: Array<{ lineNumber: number; content: string; highlight: string; }>;
}

export type CommandCategory = 'ai_action' | 'navigation' | 'audit' | 'project' | 'settings' | 'recent';

export interface AppSettings {
  ollamaHost: string; defaultModel: string; globalShortcut: string;
  indexing: { excludePatterns: string[]; maxFileSizeKB: number; includedExtensions: string[]; };
  ai: { temperature: number; contextWindow: number; maxTokens: number; streamingEnabled: boolean; systemPromptVisible: boolean; };
  ui: { theme: 'dark'; animationsEnabled: boolean; fontSize: 'sm' | 'md' | 'lg'; fontLigatures: boolean; minimap: boolean; wordWrap: boolean; };
}

export const DEFAULT_SETTINGS: AppSettings = {
  ollamaHost: 'http://127.0.0.1:11434',
  defaultModel: 'qwen2.5-coder:1.5b',
  globalShortcut: 'Ctrl+Space',
  indexing: {
    excludePatterns: ['node_modules', '.git', 'dist', 'build', 'target', '.next', '__pycache__'],
    maxFileSizeKB: 500,
    includedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.rs', '.go', '.sql', '.json', '.yaml', '.yml', '.toml', '.css', '.html', '.md'],
  },
  ai: { temperature: 0.3, contextWindow: 8192, maxTokens: 4096, streamingEnabled: true, systemPromptVisible: false },
  ui: { theme: 'dark', animationsEnabled: true, fontSize: 'md', fontLigatures: true, minimap: true, wordWrap: true },
};

export type AppView = 'landing' | 'dashboard' | 'audit' | 'search' | 'settings' | 'extensions';

export interface NotificationItem {
  id: string; type: 'success' | 'error' | 'warning' | 'info';
  title: string; message?: string; duration?: number;
}

// ─── VS Code Editor Types ─────────────────────────────────────

export interface EditorTab {
  id: string;           // usually the absolute path
  path: string;
  name: string;         // filename
  isDirty: boolean;     // has unsaved changes
  content?: string;     // current unsaved content
  language?: SupportedLanguage;
}

export interface TerminalSession {
  id: string;
  title: string;
  output: string[];     // lines of output
  cwd?: string;         // current working directory
  history?: string[];   // command history
}

export interface PanelLayout {
  sidebarWidth: number;
  rightPanelWidth: number;
  terminalHeight: number;
  terminalOpen: boolean;
  rightPanelOpen: boolean;
}

export interface CursorPosition {
  line: number;
  column: number;
}
