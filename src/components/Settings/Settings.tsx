import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, Keyboard, Database, Cpu, Palette, ChevronRight,
  Save, RefreshCw, Plus, Minus, Check, Wifi, WifiOff,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useOllama } from '../../hooks/useOllama';
import { Button, Input, Card, Badge, LoadingSpinner } from '../ui';

// ─── Settings Section ─────────────────────────────────────────

const Section: React.FC<{
  icon: React.ReactNode; title: string; description: string; children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-base)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <div style={{
      padding: '16px 20px', borderBottom: '1px solid var(--border-base)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: 'var(--accent-cyan-dim)', border: '1px solid rgba(34,211,238,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent-cyan)', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{title}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{description}</p>
      </div>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </motion.div>
);

// ─── Toggle ───────────────────────────────────────────────────

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; label: string; description?: string }> = ({
  value, onChange, label, description,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
    <div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</p>
      {description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</p>}
    </div>
    <motion.div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 'var(--radius-full)',
        background: value ? 'var(--accent-cyan)' : 'var(--bg-base)',
        border: `1px solid ${value ? 'transparent' : 'var(--border-hover)'}`,
        cursor: 'pointer', position: 'relative',
        boxShadow: value ? 'var(--shadow-glow-cyan)' : 'var(--shadow-inset-sm)',
        flexShrink: 0,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <motion.div
        animate={{ x: value ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute', top: 2, width: 18, height: 18,
          borderRadius: '50%',
          background: value ? '#0F172A' : 'var(--text-dim)',
        }}
      />
    </motion.div>
  </div>
);

// ─── Slider ───────────────────────────────────────────────────

const SliderField: React.FC<{
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; formatValue?: (v: number) => string;
}> = ({ label, value, min, max, step = 1, onChange, formatValue }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <label style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</label>
      <span style={{ fontSize: '0.875rem', color: 'var(--accent-cyan)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%', accentColor: 'var(--accent-cyan)',
        background: 'var(--bg-base)', cursor: 'pointer',
      }}
    />
  </div>
);

// ─── Settings Screen ──────────────────────────────────────────

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings, availableModels, activeModel, setActiveModel } = useAppStore();
  const { checkHealth, status } = useOllama();

  const [saved, setSaved] = useState(false);
  const [excludeInput, setExcludeInput] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addExcludePattern = () => {
    if (!excludeInput.trim()) return;
    updateSettings({
      indexing: {
        ...settings.indexing,
        excludePatterns: [...settings.indexing.excludePatterns, excludeInput.trim()],
      },
    });
    setExcludeInput('');
  };

  const removeExcludePattern = (pattern: string) => {
    updateSettings({
      indexing: {
        ...settings.indexing,
        excludePatterns: settings.indexing.excludePatterns.filter((p) => p !== pattern),
      },
    });
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--border-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Settings
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Configure BlameBot to your workflow
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={resetSettings}>
            Reset to Defaults
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} leftIcon={saved ? <Check size={13} /> : <Save size={13} />}>
            {saved ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Ollama / AI Models */}
        <Section icon={<Bot size={18} />} title="AI Model" description="Configure your local Ollama instance and model selection">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Ollama Host */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Ollama Host"
                  value={settings.ollamaHost}
                  onChange={(e) => updateSettings({ ollamaHost: e.target.value })}
                  placeholder="http://localhost:11434"
                />
              </div>
              <Button variant="secondary" size="md" onClick={checkHealth} leftIcon={status === 'checking' ? <LoadingSpinner size={13} /> : (status === 'connected' ? <Wifi size={13} /> : <WifiOff size={13} />)}>
                {status === 'checking' ? 'Checking...' : status === 'connected' ? 'Connected' : 'Test Connection'}
              </Button>
            </div>

            {/* Model Selection */}
            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px' }}>
                Active Model
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {availableModels.length > 0 ? availableModels.map((m) => (
                  <div
                    key={m.name}
                    onClick={() => setActiveModel(m.name)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${activeModel === m.name ? 'rgba(34,211,238,0.3)' : 'var(--border-base)'}`,
                      background: activeModel === m.name ? 'var(--accent-cyan-dim)' : 'var(--bg-base)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: activeModel === m.name ? 'var(--accent-cyan)' : 'var(--text-dim)',
                    }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: activeModel === m.name ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        {m.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {m.details?.parameter_size ?? ''} · {(m.size / 1e9).toFixed(1)}GB
                      </p>
                    </div>
                    {activeModel === m.name && <Check size={14} style={{ color: 'var(--accent-cyan)' }} />}
                  </div>
                )) : (
                  <div style={{
                    padding: '12px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-base)', border: '1px solid var(--border-base)',
                    color: 'var(--text-dim)', fontSize: '0.8125rem', textAlign: 'center',
                  }}>
                    {status === 'error' || status === 'idle'
                      ? 'Connect to Ollama to see available models'
                      : 'Loading models...'}
                  </div>
                )}
              </div>

              {availableModels.length === 0 && status !== 'error' && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                  Run <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: '3px' }}>ollama pull deepseek-coder</code> to download a model
                </p>
              )}
            </div>

            {/* AI Parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SliderField
                label="Temperature"
                value={settings.ai.temperature}
                min={0} max={1} step={0.05}
                onChange={(v) => updateSettings({ ai: { ...settings.ai, temperature: v } })}
                formatValue={(v) => v.toFixed(2)}
              />
              <SliderField
                label="Context Window"
                value={settings.ai.contextWindow}
                min={1024} max={32768} step={512}
                onChange={(v) => updateSettings({ ai: { ...settings.ai, contextWindow: v } })}
                formatValue={(v) => `${v.toLocaleString()} tokens`}
              />
              <SliderField
                label="Max Output Tokens"
                value={settings.ai.maxTokens}
                min={256} max={8192} step={256}
                onChange={(v) => updateSettings({ ai: { ...settings.ai, maxTokens: v } })}
                formatValue={(v) => `${v.toLocaleString()} tokens`}
              />
              <Toggle
                label="Streaming Responses"
                description="Show AI responses as they are generated"
                value={settings.ai.streamingEnabled}
                onChange={(v) => updateSettings({ ai: { ...settings.ai, streamingEnabled: v } })}
              />
            </div>
          </div>
        </Section>

        {/* Keyboard Shortcuts */}
        <Section icon={<Keyboard size={18} />} title="Keyboard Shortcuts" description="Global hotkeys to summon BlameBot">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Open Command Bar', shortcut: 'Ctrl + Space', description: 'Summon the floating command bar' },
              { label: 'Open Dashboard', shortcut: 'Ctrl + Shift + B', description: 'Focus the main dashboard' },
              { label: 'Quick Search', shortcut: 'Ctrl + F', description: 'Search the codebase' },
              { label: 'Run Audit', shortcut: 'Ctrl + Shift + A', description: 'Start a security + performance audit' },
            ].map(({ label, shortcut, description }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-base)', border: '1px solid var(--border-base)',
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>{description}</p>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {shortcut.split(' + ').map((k) => (
                    <kbd key={k} style={{
                      padding: '3px 8px', borderRadius: '5px', fontSize: '0.75rem',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)',
                      color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                    }}>{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Indexing */}
        <Section icon={<Database size={18} />} title="Indexing" description="Control which files are scanned and indexed">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SliderField
              label="Max File Size"
              value={settings.indexing.maxFileSizeKB}
              min={50} max={2000} step={50}
              onChange={(v) => updateSettings({ indexing: { ...settings.indexing, maxFileSizeKB: v } })}
              formatValue={(v) => `${v} KB`}
            />

            <div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '8px' }}>
                Exclude Patterns
              </p>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <Input
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  placeholder="e.g. node_modules, .env"
                  onKeyDown={(e) => e.key === 'Enter' && addExcludePattern()}
                  style={{ fontSize: '0.875rem' }}
                />
                <Button variant="secondary" size="md" onClick={addExcludePattern} leftIcon={<Plus size={13} />}>
                  Add
                </Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {settings.indexing.excludePatterns.map((p) => (
                  <div key={p} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '3px 10px', borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-base)', border: '1px solid var(--border-base)',
                    fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                  }}>
                    {p}
                    <button
                      onClick={() => removeExcludePattern(p)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '1px', display: 'flex' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Performance */}
        <Section icon={<Cpu size={18} />} title="Performance" description="Tune memory and rendering for your machine">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Toggle
              label="Enable Animations"
              description="Smooth transitions and micro-animations"
              value={settings.ui.animationsEnabled}
              onChange={(v) => updateSettings({ ui: { ...settings.ui, animationsEnabled: v } })}
            />
          </div>
        </Section>

      </div>
    </div>
  );
};

// Fix missing import
function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default Settings;
