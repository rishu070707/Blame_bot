import type { IndexedFile, SearchResult, SupportedLanguage } from "../types";

const STOP_WORDS = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","it","this","that","be","have","do","not","so"]);
const EXT_MAP: Record<string, SupportedLanguage> = { ".ts":"typescript",".tsx":"typescript",".js":"javascript",".jsx":"javascript",".py":"python",".java":"java",".rs":"rust",".go":"go",".css":"css",".html":"html",".json":"json",".yaml":"yaml",".yml":"yaml",".toml":"toml",".sql":"sql",".md":"markdown" };

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/([a-z])([A-Z])/g,"$1 $2").split(/[^a-zA-Z0-9_]+/).filter(t => t.length > 2 && !STOP_WORDS.has(t));
}
function computeTF(tokens: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;
  const total = tokens.length || 1;
  return Object.fromEntries(Object.entries(freq).map(([k,v]) => [k, v/total]));
}
function detectLanguage(path: string): SupportedLanguage {
  const ext = path.substring(path.lastIndexOf("."));
  return EXT_MAP[ext] ?? "unknown";
}

class IndexingService {
  private index = new Map<string, IndexedFile>();
  private idfCache = new Map<string, number>();

  buildIndex(files: Array<{ path: string; content: string }>, onProgress?: (p: number) => void): IndexedFile[] {
    this.index.clear(); this.idfCache.clear();
    files.forEach(({ path, content }, i) => {
      const tokens = tokenize(content);
      this.index.set(path, { path, language: detectLanguage(path), content, tokens, tfScores: computeTF(tokens), lineCount: content.split("\n").length, size: content.length });
      if (onProgress && i % 10 === 0) onProgress(Math.round(i/files.length*100));
    });
    this.computeIDF();
    onProgress?.(100);
    return Array.from(this.index.values());
  }

  private computeIDF() {
    const N = this.index.size; if (!N) return;
    const df = new Map<string, number>();
    for (const f of this.index.values()) for (const t of new Set(Object.keys(f.tfScores))) df.set(t, (df.get(t)??0)+1);
    this.idfCache.clear();
    for (const [t, c] of df) this.idfCache.set(t, Math.log(N/c));
  }

  search(query: string, opts: { languages?: SupportedLanguage[]; maxResults?: number } = {}): SearchResult[] {
    const { languages, maxResults = 20 } = opts;
    const qTokens = tokenize(query);
    if (!qTokens.length) return [];
    const scores: Array<{ file: IndexedFile; score: number }> = [];
    for (const f of this.index.values()) {
      if (languages?.length && !languages.includes(f.language)) continue;
      let score = 0;
      for (const t of qTokens) score += (f.tfScores[t]??0) * (this.idfCache.get(t)??0);
      if (score > 0) scores.push({ file: f, score });
    }
    scores.sort((a,b) => b.score - a.score);
    return scores.slice(0, maxResults).map(({ file, score }) => ({
      file: file.path, language: file.language, score,
      matchedLines: this.findMatches(file.content, qTokens),
    }));
  }

  private findMatches(content: string, tokens: string[]): SearchResult["matchedLines"] {
    const matched: SearchResult["matchedLines"] = [];
    content.split("\n").forEach((line, i) => {
      if (tokens.some(t => line.toLowerCase().includes(t))) {
        let h = line;
        for (const t of tokens) h = h.replace(new RegExp(`(${t})`,"gi"),"**$1**");
        matched.push({ lineNumber: i+1, content: line.trim(), highlight: h.trim() });
        if (matched.length >= 5) return;
      }
    });
    return matched;
  }

  clear() { this.index.clear(); this.idfCache.clear(); }
  get size() { return this.index.size; }
  getAllFiles() { return Array.from(this.index.values()); }
}

export const indexingService = new IndexingService();
export default indexingService;
