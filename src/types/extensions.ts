// ─── Extension System Types ───────────────────────────────────

export type ExtensionCategory =
  | 'themes'
  | 'keymaps'
  | 'languages'
  | 'snippets'
  | 'formatters'
  | 'linters'
  | 'ai'
  | 'productivity'
  | 'git';

export type ExtensionCapability =
  | 'theme'
  | 'keybindings'
  | 'snippets'
  | 'formatter'
  | 'language'
  | 'ai'
  | 'editor-config';

export interface ThemeColors {
  base: string;
  panel: string;
  sidebar: string;
  activityBar: string;
  titleBar: string;
  tabActive: string;
  tabInactive: string;
  border: string;
  accent: string;
  accentHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  selection: string;
  hover: string;
  listActive: string;
  widget: string;
  inputBg: string;
  success: string;
  monacoTheme?: string; // 'vs-dark' | 'vs' | 'hc-black' | custom name
  monacoRules?: Array<{ token: string; foreground?: string; fontStyle?: string }>;
  monacoColors?: Record<string, string>;
}

export interface ExtensionConfig {
  // Editor settings this extension modifies
  formatOnSave?: boolean;
  tabSize?: number;
  insertSpaces?: boolean;
  wordWrap?: boolean;
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative';
  rulers?: number[];
  fontFamily?: string;
  fontSize?: number;
  vimMode?: boolean;
  renderWhitespace?: 'all' | 'boundary' | 'selection' | 'none';
}

export interface Extension {
  id: string;
  name: string;
  displayName: string;
  description: string;
  longDescription?: string;
  version: string;
  publisher: string;
  publisherVerified?: boolean;
  category: ExtensionCategory;
  icon: string;        // emoji
  iconBg?: string;     // background color for icon
  installed: boolean;
  enabled: boolean;
  isBuiltin?: boolean;
  featured?: boolean;
  rating: number;      // 0-5
  ratingCount: number;
  downloads: string;
  tags: string[];
  capabilities: ExtensionCapability[];
  themeColors?: ThemeColors;
  config?: ExtensionConfig;
  changelog?: string;
  homepage?: string;
}
