import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileCode, Filter, X, ChevronRight, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { indexingService } from '../../services/indexingService';
import { Input, Badge, EmptyState, LoadingSpinner } from '../ui';
import type { SearchResult, SupportedLanguage } from '../../types';

// ─── Language icons / colors ──────────────────────────────────

const LANG_COLOR: Record<string, string> = {
  typescript: '#3178C6',
  javascript: '#F7DF1E',
  python: '#3572A5',
  java: '#B07219',
  rust: '#DEA584',
  go: '#00ADD8',
  css: '#563D7C',
  html: '#E34C26',
  json: '#888',
  yaml: '#CB171E',
  sql: '#336791',
  markdown: '#aaa',
  unknown: '#666',
};

const LANG_BADGE: Record<string, 'cyan' | 'purple' | 'info' | 'medium' | 'success' | 'low'> = {
  typescript: 'cyan',
  javascript: 'medium',
  python: 'purple',
  java: 'medium',
  rust: 'low',
  go: 'cyan',
  default: 'info',
};

// ─── Search Result Card ───────────────────────────────────────

const ResultCard: React.FC<{ result: SearchResult; index: number }> = ({ result, index }) => {
  const fileName = result.file.split(/[\\/]/).pop() ?? result.file;
  const dirPath = result.file.split(/[\\/]/).slice(-3, -1).join('/');
  const langColor = LANG_COLOR[result.language] ?? LANG_COLOR.unknown;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ borderColor: 'var(--border-hover)' }}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-base)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        transition: 'border-color var(--transition-fast)',
      }}
    >
      {/* File Header */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '10px',
        borderBottom: result.matchedLines.length > 0 ? '1px solid var(--border-base)' : 'none',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: langColor,
          boxShadow: `0 0 8px ${langColor}60`,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {fileName}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {dirPath}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Badge variant={LANG_BADGE[result.language] ?? 'info'}>{result.language}</Badge>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {(result.score * 100).toFixed(0)}% match
          </span>
        </div>
      </div>

      {/* Matched Lines */}
      {result.matchedLines.length > 0 && (
        <div style={{ padding: '8px 0' }}>
          {result.matchedLines.map((line, i) => (
            <div
              key={i}
              style={{
                padding: '5px 16px',
                display: 'flex', gap: '12px',
                alignItems: 'flex-start',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}
            >
              <span style={{
                fontSize: '0.72rem', color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)', width: '32px', flexShrink: 0,
                userSelect: 'none', textAlign: 'right',
              }}>
                {line.lineNumber}
              </span>
              <pre style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                color: 'var(--text-secondary)', margin: 0, flex: 1,
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                lineHeight: '1.5',
              }}>
                {/* Simple highlight — **text** becomes highlighted */}
                {line.highlight.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                  j % 2 === 1
                    ? <mark key={j} style={{ background: 'rgba(34,211,238,0.2)', color: 'var(--accent-cyan)', borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
                    : <span key={j}>{part}</span>
                )}
              </pre>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ─── Code Search Screen ───────────────────────────────────────

export const CodeSearch: React.FC = () => {
  const { indexedFiles, lastSearchQuery, setLastSearchQuery, addNotification } = useAppStore();
  const [query, setQuery] = useState(lastSearchQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [langFilter, setLangFilter] = useState<SupportedLanguage | 'all'>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  const LANGUAGES: Array<SupportedLanguage | 'all'> = [
    'all', 'typescript', 'javascript', 'python', 'java', 'rust', 'go', 'sql',
  ];

  const doSearch = useCallback(
    (q: string, lang: typeof langFilter) => {
      if (!q.trim()) { setResults([]); return; }
      setIsSearching(true);
      setLastSearchQuery(q);

      // Small async delay to keep UI responsive
      setTimeout(() => {
        const res = indexingService.search(q, {
          languages: lang !== 'all' ? [lang] : undefined,
          maxResults: 30,
        });
        setResults(res);
        setIsSearching(false);
      }, 0);
    },
    [setLastSearchQuery]
  );

  // Debounced search
  const debouncedQuery = query;
  React.useEffect(() => {
    const t = setTimeout(() => doSearch(query, langFilter), 300);
    return () => clearTimeout(t);
  }, [query, langFilter, doSearch]);

  const isIndexed = indexedFiles.length > 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '20px', gap: '16px', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Code Search
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Semantic search across {indexedFiles.length.toLocaleString()} indexed files
        </p>
      </div>

      {/* Search Input */}
      <div style={{ flexShrink: 0 }}>
        <Input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isIndexed ? "Search code, functions, patterns..." : "Open and index a project first..."}
          disabled={!isIndexed}
          leftIcon={isSearching ? <LoadingSpinner size={16} /> : <Search size={16} />}
          rightIcon={query ? (
            <button onClick={() => { setQuery(''); setResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}>
              <X size={14} />
            </button>
          ) : undefined}
          style={{ fontSize: '1rem', padding: '12px 44px' }}
        />
      </div>

      {/* Language Filters */}
      {isIndexed && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setLangFilter(lang)}
              style={{
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                background: langFilter === lang ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${langFilter === lang ? 'var(--border-hover)' : 'var(--border-base)'}`,
                color: langFilter === lang ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', fontSize: '0.8rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              {lang !== 'all' && (
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: LANG_COLOR[lang] ?? '#888',
                }} />
              )}
              {lang === 'all' ? 'All Languages' : lang}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!isIndexed ? (
          <EmptyState
            icon={<FileCode size={40} />}
            title="No codebase indexed"
            description="Open a project from the dashboard to enable code search"
          />
        ) : !query ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Search size={32} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '8px' }}>
              {indexedFiles.length.toLocaleString()} files ready to search
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              Try: "database connection", "authentication", "SQL query", "error handler"
            </p>
          </div>
        ) : results.length === 0 && !isSearching ? (
          <EmptyState
            icon={<Search size={32} />}
            title="No results found"
            description={`No matches for "${query}" in ${langFilter === 'all' ? 'any language' : langFilter} files`}
          />
        ) : (
          <>
            {!isSearching && query && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', flexShrink: 0 }}
              >
                {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </motion.p>
            )}
            {results.map((r, i) => (
              <ResultCard key={r.file} result={r} index={i} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default CodeSearch;
