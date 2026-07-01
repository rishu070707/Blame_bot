import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Star, Download, Shield, CheckCircle, Package,
  Zap, ArrowLeft, RefreshCw, Settings, ChevronRight,
  Puzzle, Paintbrush, Keyboard, Globe, FileCode, Sparkles,
  GitBranch, Plus, Minus, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useExtensionStore } from '../../store/extensionStore';
import { useMonaco } from '@monaco-editor/react';
import type { Extension, ExtensionCategory } from '../../types/extensions';
import { EXTENSION_CATEGORIES } from '../../data/extensions';

// ─── Stars ───────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 11 }) => (
  <div style={{ display: 'flex', gap: '1px', alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={size}
        fill={i <= Math.round(rating) ? '#cca700' : 'none'}
        style={{ color: i <= Math.round(rating) ? '#cca700' : 'var(--text-muted)' }}
      />
    ))}
    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '3px' }}>
      {rating.toFixed(1)}
    </span>
  </div>
);

// ─── Category Icon ────────────────────────────────────────────

const CategoryIcon: React.FC<{ category: ExtensionCategory; size?: number }> = ({ category, size = 14 }) => {
  const iconMap: Record<ExtensionCategory, React.ReactNode> = {
    themes: <Paintbrush size={size} />,
    keymaps: <Keyboard size={size} />,
    languages: <Globe size={size} />,
    snippets: <FileCode size={size} />,
    formatters: <Zap size={size} />,
    linters: <Shield size={size} />,
    ai: <Sparkles size={size} />,
    productivity: <Package size={size} />,
    git: <GitBranch size={size} />,
  };
  return <>{iconMap[category] ?? <Puzzle size={size} />}</>;
};

// ─── Extension Card ───────────────────────────────────────────

const ExtensionCard: React.FC<{
  ext: Extension;
  onSelect: (id: string) => void;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  isActive?: boolean;
}> = ({ ext, onSelect, onInstall, onUninstall, onEnable, onDisable, isActive }) => {
  const [hovered, setHovered] = useState(false);
  const isInstalled = ext.installed;
  const isEnabled = ext.enabled;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInstalled) { onInstall(ext.id); onEnable(ext.id); }
    else if (isEnabled) onDisable(ext.id);
    else onEnable(ext.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      onClick={() => onSelect(ext.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: '12px', padding: '12px',
        cursor: 'pointer', borderRadius: '4px',
        background: isActive
          ? 'var(--vscode-list-active)'
          : hovered ? 'var(--vscode-list-hover)' : 'transparent',
        transition: 'background 80ms ease',
        alignItems: 'flex-start',
        border: '1px solid transparent',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: '6px', flexShrink: 0,
        background: ext.iconBg ?? '#1e1e1e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {ext.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: isActive ? '#fff' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ext.displayName}
          </span>
          {ext.isBuiltin && (
            <span style={{ fontSize: '10px', padding: '1px 5px', background: 'rgba(0,122,204,0.15)', color: 'var(--vscode-accent)', border: '1px solid rgba(0,122,204,0.3)', borderRadius: '3px', flexShrink: 0 }}>
              built-in
            </span>
          )}
          {isInstalled && isEnabled && !ext.isBuiltin && (
            <CheckCircle size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
          )}
        </div>
        <p style={{ fontSize: '12px', color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', marginBottom: '6px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {ext.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
            {ext.publisher}{ext.publisherVerified && ' ✓'}
          </span>
          <StarRating rating={ext.rating} />
          <span style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Download size={10} />{ext.downloads}
          </span>
        </div>
      </div>

      {/* Action Button */}
      {!ext.isBuiltin && (
        <button
          onClick={handleAction}
          style={{
            flexShrink: 0, padding: '4px 10px', fontSize: '12px', borderRadius: '3px',
            border: '1px solid',
            background: !isInstalled ? 'var(--vscode-accent)' : isEnabled ? 'transparent' : 'var(--vscode-accent)',
            borderColor: !isInstalled ? 'var(--vscode-accent)' : isEnabled ? 'var(--vscode-border)' : 'var(--vscode-accent)',
            color: !isInstalled ? '#fff' : isEnabled ? 'var(--text-primary)' : '#fff',
            cursor: 'pointer', transition: 'all 80ms ease', alignSelf: 'center',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          {!isInstalled ? <><Plus size={11} />Install</>
            : isEnabled ? <><Minus size={11} />Disable</>
            : <><Plus size={11} />Enable</>
          }
        </button>
      )}
    </motion.div>
  );
};

// ─── Extension Detail Panel ───────────────────────────────────

const ExtensionDetail: React.FC<{
  ext: Extension;
  onClose: () => void;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  onSetTheme: (id: string) => void;
  activeThemeId: string;
}> = ({ ext, onClose, onInstall, onUninstall, onEnable, onDisable, onSetTheme, activeThemeId }) => {
  const isInstalled = ext.installed;
  const isEnabled = ext.enabled;
  const isTheme = ext.capabilities.includes('theme');
  const isActiveTheme = activeThemeId === ext.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        position: 'absolute', inset: 0, background: 'var(--vscode-base)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--vscode-border)', flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', marginBottom: '16px', padding: 0 }}
        >
          <ArrowLeft size={14} /> Back to Extensions
        </button>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '10px', flexShrink: 0,
            background: ext.iconBg ?? '#1e1e1e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {ext.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ext.displayName}
              </h1>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '2px 6px', background: 'var(--vscode-panel)', borderRadius: '3px' }}>
                v{ext.version}
              </span>
              {ext.isBuiltin && (
                <span style={{ fontSize: '11px', padding: '2px 6px', background: 'rgba(0,122,204,0.15)', color: 'var(--vscode-accent)', border: '1px solid rgba(0,122,204,0.3)', borderRadius: '3px' }}>
                  built-in
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              {ext.publisher}{ext.publisherVerified && <span style={{ color: 'var(--vscode-accent)', marginLeft: '4px' }}>✓ Verified</span>}
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <StarRating rating={ext.rating} size={13} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({ext.ratingCount.toLocaleString()} ratings)</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Download size={12} />{ext.downloads} downloads
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {!ext.isBuiltin && (
            <>
              {!isInstalled ? (
                <button
                  onClick={() => { onInstall(ext.id); onEnable(ext.id); }}
                  style={{ padding: '6px 16px', background: 'var(--vscode-accent)', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} />Install
                </button>
              ) : (
                <>
                  <button
                    onClick={() => isEnabled ? onDisable(ext.id) : onEnable(ext.id)}
                    style={{ padding: '6px 16px', background: isEnabled ? 'transparent' : 'var(--vscode-accent)', color: isEnabled ? 'var(--text-primary)' : '#fff', border: `1px solid ${isEnabled ? 'var(--vscode-border)' : 'var(--vscode-accent)'}`, borderRadius: '3px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isEnabled ? <><ToggleRight size={14} style={{ color: 'var(--success)' }} />Enabled</> : <><ToggleLeft size={14} />Disabled</>}
                  </button>
                  <button
                    onClick={() => onUninstall(ext.id)}
                    style={{ padding: '6px 16px', background: 'transparent', color: 'var(--danger)', border: '1px solid rgba(241,76,76,0.3)', borderRadius: '3px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Minus size={14} />Uninstall
                  </button>
                </>
              )}
            </>
          )}

          {isTheme && isInstalled && (
            <button
              onClick={() => onSetTheme(ext.id)}
              style={{
                padding: '6px 16px', borderRadius: '3px', cursor: isActiveTheme ? 'default' : 'pointer',
                fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                background: isActiveTheme ? 'var(--vscode-list-active)' : 'transparent',
                color: isActiveTheme ? '#fff' : 'var(--vscode-accent)',
                border: `1px solid ${isActiveTheme ? 'transparent' : 'rgba(0,122,204,0.4)'}`,
              }}
            >
              <Paintbrush size={14} />{isActiveTheme ? 'Active Theme ✓' : 'Set Theme'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
        {/* Description */}
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Description
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {ext.longDescription ?? ext.description}
          </p>
        </section>

        {/* Theme Preview */}
        {isTheme && ext.themeColors && (
          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Color Preview
            </h2>
            <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              {/* Fake editor preview */}
              <div style={{ background: ext.themeColors.titleBar, height: '22px', display: 'flex', alignItems: 'center', padding: '0 8px', gap: '6px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
                <span style={{ fontSize: '10px', color: ext.themeColors.textSecondary, marginLeft: '8px' }}>BlameBot — editor.ts</span>
              </div>
              <div style={{ display: 'flex', height: '140px' }}>
                <div style={{ width: '24px', background: ext.themeColors.activityBar, borderRight: `1px solid ${ext.themeColors.border}` }} />
                <div style={{ width: '80px', background: ext.themeColors.sidebar, padding: '8px 6px', borderRight: `1px solid ${ext.themeColors.border}` }}>
                  <div style={{ fontSize: '9px', color: ext.themeColors.textMuted, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.08em' }}>Explorer</div>
                  {['src/', 'index.ts', 'App.tsx', 'style.css'].map(f => (
                    <div key={f} style={{ fontSize: '10px', color: f.includes('/') ? ext.themeColors.textMuted : ext.themeColors.textPrimary, padding: '2px 0', paddingLeft: f.includes('/') ? 0 : 8 }}>
                      {f}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, background: ext.themeColors.base, padding: '8px 12px', fontFamily: 'monospace', fontSize: '10px', lineHeight: '1.6', overflow: 'hidden' }}>
                  <span style={{ color: ext.themeColors.monacoRules?.find(r => r.token === 'keyword')?.foreground ? `#${ext.themeColors.monacoRules.find(r => r.token === 'keyword')?.foreground}` : '#569cd6' }}>const </span>
                  <span style={{ color: ext.themeColors.monacoRules?.find(r => r.token === 'function')?.foreground ? `#${ext.themeColors.monacoRules.find(r => r.token === 'function')?.foreground}` : '#dcdcaa' }}>greet </span>
                  <span style={{ color: ext.themeColors.textPrimary }}>= (</span>
                  <span style={{ color: ext.themeColors.monacoRules?.find(r => r.token === 'variable')?.foreground ? `#${ext.themeColors.monacoRules.find(r => r.token === 'variable')?.foreground}` : '#9cdcfe' }}>name</span>
                  <span style={{ color: ext.themeColors.textPrimary }}>) =&gt; {'{'}</span>
                  <br />
                  <span style={{ color: ext.themeColors.textPrimary }}>  </span>
                  <span style={{ color: ext.themeColors.monacoRules?.find(r => r.token === 'keyword')?.foreground ? `#${ext.themeColors.monacoRules.find(r => r.token === 'keyword')?.foreground}` : '#569cd6' }}>return </span>
                  <span style={{ color: ext.themeColors.monacoRules?.find(r => r.token === 'string')?.foreground ? `#${ext.themeColors.monacoRules.find(r => r.token === 'string')?.foreground}` : '#ce9178' }}>{`\`Hello \${name}\``}</span>
                  <br />
                  <span style={{ color: ext.themeColors.textPrimary }}>{'}'}</span>
                  <br /><br />
                  <span style={{ color: ext.themeColors.monacoRules?.find(r => r.token === 'comment')?.foreground ? `#${ext.themeColors.monacoRules.find(r => r.token === 'comment')?.foreground}` : '#6a9955' }}>// Unlimited AI — Ollama</span>
                </div>
              </div>
              <div style={{ background: ext.themeColors.accent, height: '18px', display: 'flex', alignItems: 'center', padding: '0 8px', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '9px', color: '#fff', opacity: 0.9 }}>{ext.displayName}</span>
                <span style={{ fontSize: '9px', color: '#fff', opacity: 0.9 }}>Ln 1, Col 1</span>
              </div>
            </div>
          </section>
        )}

        {/* Tags */}
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Categories & Tags
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ padding: '3px 8px', background: 'rgba(0,122,204,0.15)', color: 'var(--vscode-accent)', border: '1px solid rgba(0,122,204,0.3)', borderRadius: '12px', fontSize: '11px' }}>
              {ext.category}
            </span>
            {ext.tags.map(tag => (
              <span key={tag} style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--vscode-border)', borderRadius: '12px', fontSize: '11px' }}>
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Info */}
        <section>
          <h2 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Extension Info
          </h2>
          {[
            { label: 'Version', value: ext.version },
            { label: 'Publisher', value: `${ext.publisher}${ext.publisherVerified ? ' (Verified)' : ''}` },
            { label: 'Category', value: ext.category },
            { label: 'Downloads', value: ext.downloads },
            { label: 'Rating', value: `${ext.rating}/5 (${ext.ratingCount.toLocaleString()} ratings)` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid var(--vscode-border)', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </section>
      </div>
    </motion.div>
  );
};

// ─── Extensions Panel ─────────────────────────────────────────

export const ExtensionsPanel: React.FC = () => {
  const {
    extensions, searchQuery, selectedCategory, detailExtensionId,
    setSearchQuery, setSelectedCategory, setDetailExtension,
    installExtension, uninstallExtension, enableExtension, disableExtension, setActiveTheme,
    activeThemeId, installedIds, enabledIds,
  } = useExtensionStore();
  const monaco = useMonaco();
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Reapply theme when Monaco loads
  useEffect(() => {
    if (monaco) {
      useExtensionStore.getState().reapplyTheme(monaco);
    }
  }, [monaco]);

  const handleSetTheme = (id: string) => {
    setActiveTheme(id, monaco);
  };

  const handleEnable = (id: string) => {
    enableExtension(id, monaco);
  };

  const detailExt = detailExtensionId ? extensions.find(e => e.id === detailExtensionId) : null;

  // Filtered & sorted extensions
  const filtered = useMemo(() => {
    let list = extensions;
    if (selectedCategory !== 'all') {
      list = list.filter(e => e.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.displayName.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.publisher.toLowerCase().includes(q) ||
        e.tags.some(t => t.includes(q))
      );
    }
    // Sort: installed first, then featured, then by downloads
    return [...list].sort((a, b) => {
      if (installedIds.has(a.id) && !installedIds.has(b.id)) return -1;
      if (!installedIds.has(a.id) && installedIds.has(b.id)) return 1;
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.ratingCount - a.ratingCount;
    });
  }, [extensions, selectedCategory, searchQuery, installedIds]);

  const installedList = useMemo(() => extensions.filter(e => installedIds.has(e.id)), [extensions, installedIds]);

  const isShowingInstalled = selectedCategory === 'installed';

  const displayList = isShowingInstalled ? installedList : filtered;

  return (
    <div style={{
      display: 'flex', height: '100%', background: 'var(--vscode-sidebar)',
      fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', overflow: 'hidden',
    }}>
      {/* Left Sidebar */}
      <div style={{
        width: '200px', flexShrink: 0, borderRight: '1px solid var(--vscode-border)',
        display: 'flex', flexDirection: 'column', background: 'var(--vscode-sidebar)',
        overflow: 'hidden',
      }}>
        {/* Search */}
        <div style={{ padding: '8px', borderBottom: '1px solid var(--vscode-border)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search extensions…"
              style={{
                width: '100%', background: 'var(--vscode-input-bg)', border: '1px solid var(--vscode-border)',
                color: 'var(--text-primary)', fontSize: '12px', padding: '5px 8px 5px 24px',
                borderRadius: '2px', outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--vscode-accent)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--vscode-border)'; }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          <div
            onClick={() => setSelectedCategory('installed')}
            style={{
              padding: '7px 12px', cursor: 'pointer', fontSize: '12px',
              background: selectedCategory === 'installed' ? 'var(--vscode-list-active)' : 'transparent',
              color: selectedCategory === 'installed' ? '#fff' : 'var(--text-primary)',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'background 60ms ease',
            }}
            onMouseEnter={e => { if (selectedCategory !== 'installed') (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-hover)'; }}
            onMouseLeave={e => { if (selectedCategory !== 'installed') (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <CheckCircle size={13} />
            <span>Installed</span>
            <span style={{ marginLeft: 'auto', fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '8px' }}>
              {installedIds.size}
            </span>
          </div>

          <div style={{ height: '1px', background: 'var(--vscode-border)', margin: '4px 0' }} />

          {EXTENSION_CATEGORIES.map(cat => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '7px 12px', cursor: 'pointer', fontSize: '12px',
                background: selectedCategory === cat.id ? 'var(--vscode-list-active)' : 'transparent',
                color: selectedCategory === cat.id ? '#fff' : 'var(--text-primary)',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'background 60ms ease',
              }}
              onMouseEnter={e => { if (selectedCategory !== cat.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--vscode-hover)'; }}
              onMouseLeave={e => { if (selectedCategory !== cat.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>

        {/* Active Theme display */}
        <div style={{ padding: '10px', borderTop: '1px solid var(--vscode-border)', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Active Theme</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>{extensions.find(e => e.id === activeThemeId)?.icon ?? '🌑'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {extensions.find(e => e.id === activeThemeId)?.displayName ?? 'Dark+'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--vscode-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isShowingInstalled ? 'Installed Extensions'
                : searchQuery ? `Results for "${searchQuery}"`
                : selectedCategory === 'all' ? 'Marketplace'
                : EXTENSION_CATEGORIES.find(c => c.id === selectedCategory)?.label ?? 'Extensions'}
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {displayList.length} extension{displayList.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            title="Refresh"
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '3px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--vscode-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Extension List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0', position: 'relative' }}>
          <AnimatePresence>
            {detailExt ? (
              <ExtensionDetail
                key={detailExt.id}
                ext={detailExt}
                onClose={() => setDetailExtension(null)}
                onInstall={installExtension}
                onUninstall={uninstallExtension}
                onEnable={handleEnable}
                onDisable={disableExtension}
                onSetTheme={handleSetTheme}
                activeThemeId={activeThemeId}
              />
            ) : null}
          </AnimatePresence>

          {displayList.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', gap: '8px' }}>
              <Puzzle size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '13px' }}>No extensions found</p>
              {searchQuery && <p style={{ fontSize: '12px' }}>Try a different search term</p>}
            </div>
          ) : (
            <AnimatePresence>
              {displayList.map(ext => (
                <ExtensionCard
                  key={ext.id}
                  ext={ext}
                  isActive={detailExtensionId === ext.id}
                  onSelect={setDetailExtension}
                  onInstall={installExtension}
                  onUninstall={uninstallExtension}
                  onEnable={handleEnable}
                  onDisable={disableExtension}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
