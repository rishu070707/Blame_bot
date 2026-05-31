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
  ai: { temperature: number; contextWindow: number; maxTokens: number; streamingEnabled: boolean; };
  ui: { theme: 'dark'; animationsEnabled: boolean; fontSize: 'sm' | 'md' | 'lg'; };
}

export const DEFAULT_SETTINGS: AppSettings = {
  ollamaHost: 'http://localhost:11434', defaultModel: 'deepseek-coder', globalShortcut: 'Ctrl+Space',
  indexing: {
    excludePatterns: ['node_modules', '.git', 'dist', 'build', 'target', '.next', '__pycache__'],
    maxFileSizeKB: 500,
    includedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.rs', '.go', '.sql', '.json', '.yaml', '.yml', '.toml', '.css', '.html', '.md'],
  },
  ai: { temperature: 0.3, contextWindow: 4096, maxTokens: 2048, streamingEnabled: true },
  ui: { theme: 'dark', animationsEnabled: true, fontSize: 'md' },
};

export type AppView = 'landing' | 'dashboard' | 'audit' | 'search' | 'settings';

export interface NotificationItem {
  id: string; type: 'success' | 'error' | 'warning' | 'info';
  title: string; message?: string; duration?: number;
}
