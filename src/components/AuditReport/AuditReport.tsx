import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Play, AlertTriangle, ChevronDown, ChevronUp,
  Copy, ExternalLink, Filter, Download, RefreshCw,
  CheckCircle, XCircle, Info,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { runSecurityAudit, runPerformanceAudit, replaceInFile } from '../../services/tauriService';
import { ollamaService } from '../../services/ollamaService';
import {
  Button, Badge, Card, Progress, EmptyState,
  LoadingSpinner, ScoreRing,
} from '../ui';
import type { SecurityFinding, PerformanceFinding, SeverityLevel, SecurityAuditReport, PerformanceAuditReport } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// ─── Finding Card ─────────────────────────────────────────────

const FindingCard: React.FC<{
  finding: SecurityFinding | PerformanceFinding;
  type: 'security' | 'performance';
}> = ({ finding, type }) => {
  const [expanded, setExpanded] = useState(false);
  const [aiFixLoading, setAiFixLoading] = useState(false);
  const [aiFix, setAiFix] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const { activeModel } = useAppStore();

  const getAiFix = async () => {
    if (aiFix) { setExpanded(true); return; }
    setAiFixLoading(true);
    setExpanded(true);
    try {
      let accumulated = '';
      const prompt = ollamaService.buildSecurityAuditPrompt(
        finding.snippet ?? `Issue: ${finding.title}\nDescription: ${finding.description}`,
        'code'
      );
      for await (const chunk of ollamaService.generateStream(activeModel, prompt)) {
        accumulated += chunk;
        setAiFix(accumulated);
      }
    } catch {
      setAiFix('Could not get AI suggestion. Is Ollama running?');
    } finally {
      setAiFixLoading(false);
    }
  };

  const handleApplyFix = async () => {
    if (!aiFix || !finding.snippet) return;
    setApplyLoading(true);
    try {
      // Basic extraction of code block if it contains one
      let fixCode = aiFix;
      const codeMatch = aiFix.match(/```[a-z]*\n([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        fixCode = codeMatch[1].trim();
      }
      await replaceInFile(finding.file, finding.snippet, fixCode);
      alert('Fix applied successfully to ' + finding.file);
    } catch (e: any) {
      alert('Failed to apply fix: ' + e);
    } finally {
      setApplyLoading(false);
    }
  };

  const severityColor: Record<SeverityLevel, string> = {
    critical: 'var(--danger)',
    high: '#F97316',
    medium: 'var(--warning)',
    low: 'var(--accent-cyan)',
    info: 'var(--text-muted)',
  };

  const borderColor = severityColor[finding.severity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid var(--border-base)`,
        borderLeft: `3px solid ${borderColor}`,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header Row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '14px 16px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}
      >
        <div style={{ flexShrink: 0 }}>
          {finding.severity === 'critical' || finding.severity === 'high'
            ? <XCircle size={16} style={{ color: borderColor }} />
            : finding.severity === 'medium'
            ? <AlertTriangle size={16} style={{ color: borderColor }} />
            : <Info size={16} style={{ color: borderColor }} />
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {finding.title}
            </p>
            <Badge variant={finding.severity}>{finding.severity}</Badge>
            {'cwe' in finding && finding.cwe && (
              <Badge variant="info">{finding.cwe}</Badge>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {finding.file}
            {'line' in finding && finding.line ? `:${finding.line}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {'confidence' in finding && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {finding.confidence}% confidence
            </span>
          )}
          {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-dim)' }} />}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-base)', paddingTop: '14px' }}>
              {/* Description */}
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.6' }}>
                {finding.description}
              </p>

              {/* Code Snippet */}
              {finding.snippet && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Affected Code
                  </p>
                  <div style={{
                    background: 'var(--bg-base)', borderRadius: 'var(--radius-md)',
                    padding: '10px 12px', border: '1px solid var(--border-base)',
                    boxShadow: 'var(--shadow-inset-sm)',
                    overflowX: 'auto',
                  }}>
                    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {finding.snippet}
                    </pre>
                  </div>
                </div>
              )}

              {/* Static Suggestion */}
              {finding.suggestedFix && !aiFix && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    Suggested Fix
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {finding.suggestedFix}
                  </p>
                </div>
              )}

              {/* AI Fix */}
              {aiFix && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Zap size={12} style={{ color: 'var(--accent-cyan)' }} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                      AI-Generated Fix
                    </p>
                    {aiFixLoading && <LoadingSpinner size={12} />}
                  </div>
                  <div style={{
                    background: 'var(--bg-base)', borderRadius: 'var(--radius-md)',
                    padding: '10px 12px', border: '1px solid rgba(34,211,238,0.15)',
                    fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.6',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {aiFix}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button variant="secondary" size="sm" onClick={getAiFix} leftIcon={<Zap size={12} />} isLoading={aiFixLoading}>
                  {aiFix ? 'Regenerate Fix' : 'Get AI Fix'}
                </Button>
                {aiFix && finding.snippet && (
                  <Button variant="primary" size="sm" onClick={handleApplyFix} isLoading={applyLoading} leftIcon={<CheckCircle size={12} />}>
                    Apply Fix to File
                  </Button>
                )}
                {finding.snippet && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => navigator.clipboard.writeText(finding.snippet!)}
                    leftIcon={<Copy size={12} />}
                  >
                    Copy Snippet
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Audit Report Screen ──────────────────────────────────────

export const AuditReport: React.FC = () => {
  const {
    activeProjectId, projects,
    securityReport, performanceReport,
    isAuditRunning, auditProgress,
    setSecurityReport, setPerformanceReport,
    setAuditRunning, setAuditProgress,
    addNotification,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'security' | 'performance'>('security');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const runAudit = useCallback(async () => {
    if (!activeProject) {
      addNotification({ type: 'warning', title: 'No Project', message: 'Open a project first' });
      return;
    }

    setAuditRunning(true, 0);
    addNotification({ type: 'info', title: 'Audit Started', message: `Scanning ${activeProject.name}...`, duration: 2000 });

    try {
      // Security Audit
      setAuditProgress(10);
      const secFindings = await runSecurityAudit(activeProject.path);
      setAuditProgress(50);

      // Performance Audit
      const perfFindings = await runPerformanceAudit(activeProject.path);
      setAuditProgress(90);

      // Build reports
      const secReport: SecurityAuditReport = {
        projectId: activeProject.id,
        generatedAt: new Date(),
        totalFindings: secFindings.length,
        criticalCount: secFindings.filter(f => f.severity === 'critical').length,
        highCount: secFindings.filter(f => f.severity === 'high').length,
        mediumCount: secFindings.filter(f => f.severity === 'medium').length,
        lowCount: secFindings.filter(f => f.severity === 'low').length,
        securityScore: Math.max(0, 100 - (secFindings.filter(f => f.severity === 'critical').length * 20) - (secFindings.filter(f => f.severity === 'high').length * 10) - (secFindings.filter(f => f.severity === 'medium').length * 3)),
        findings: secFindings.map(f => ({
          id: f.id, severity: f.severity as SeverityLevel,
          type: f.finding_type as any, title: f.title,
          description: f.description, file: f.file,
          line: f.line ?? undefined, snippet: f.snippet ?? undefined,
          cwe: f.cwe ?? undefined, suggestedFix: f.suggested_fix ?? undefined,
          confidence: f.confidence,
        })),
      };

      const perfReport: PerformanceAuditReport = {
        projectId: activeProject.id,
        generatedAt: new Date(),
        totalFindings: perfFindings.length,
        performanceScore: Math.max(0, 100 - perfFindings.length * 8),
        findings: perfFindings.map(f => ({
          id: f.id, severity: f.severity as SeverityLevel,
          type: f.issue_type as any, title: f.title,
          description: f.description, file: f.file,
          line: f.line ?? undefined, snippet: f.snippet ?? undefined,
          impact: f.impact as any, suggestedFix: f.suggested_fix ?? undefined,
        })),
      };

      setSecurityReport(secReport);
      setPerformanceReport(perfReport);
      setAuditProgress(100);
      setAuditRunning(false);

      addNotification({
        type: 'success',
        title: 'Audit Complete',
        message: `Found ${secReport.totalFindings} security + ${perfReport.totalFindings} performance issues`,
      });
    } catch (err: any) {
      setAuditRunning(false);
      addNotification({
        type: 'error',
        title: 'Audit Failed',
        message: err.message ?? 'Could not complete audit',
      });
    }
  }, [activeProject, setAuditRunning, setAuditProgress, setSecurityReport, setPerformanceReport, addNotification]);

  const currentFindings = activeTab === 'security'
    ? (securityReport?.findings ?? [])
    : (performanceReport?.findings ?? []);

  const filteredFindings = severityFilter === 'all'
    ? currentFindings
    : currentFindings.filter(f => f.severity === severityFilter);

  const SEVERITY_OPTIONS: Array<{ value: SeverityLevel | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      padding: '20px', gap: '16px', overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Audit Report
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {activeProject ? activeProject.name : 'No project selected'}
            {securityReport && ` · ${new Date(securityReport.generatedAt).toLocaleDateString()}`}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={runAudit}
          isLoading={isAuditRunning}
          leftIcon={isAuditRunning ? undefined : <Play size={14} />}
          disabled={!activeProject}
        >
          {isAuditRunning ? `Scanning... ${auditProgress}%` : 'Run Audit'}
        </Button>
      </div>

      {/* Score Cards */}
      {(securityReport || performanceReport) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', flexShrink: 0 }}>
          {securityReport && (
            <>
              <StatCard title="Security Score" value={`${securityReport.securityScore}/100`} icon={<Shield size={16} />} color={securityReport.securityScore >= 80 ? 'var(--success)' : 'var(--warning)'} />
              <StatCard title="Critical Issues" value={String(securityReport.criticalCount)} icon={<XCircle size={16} />} color="var(--danger)" />
              <StatCard title="High Severity" value={String(securityReport.highCount)} icon={<AlertTriangle size={16} />} color="#F97316" />
              <StatCard title="Total Findings" value={String(securityReport.totalFindings)} icon={<Info size={16} />} color="var(--text-muted)" />
            </>
          )}
        </div>
      )}

      {/* Tabs + Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-base)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
          {(['security', 'performance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 16px', borderRadius: 'var(--radius-sm)',
                background: activeTab === tab ? 'var(--bg-card)' : 'transparent',
                border: activeTab === tab ? '1px solid var(--border-base)' : '1px solid transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {tab === 'security' ? <Shield size={14} /> : <Zap size={14} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{
                padding: '1px 6px', borderRadius: 'var(--radius-full)',
                background: 'var(--bg-base)', fontSize: '0.7rem', color: 'var(--text-muted)',
              }}>
                {tab === 'security' ? (securityReport?.totalFindings ?? 0) : (performanceReport?.totalFindings ?? 0)}
              </span>
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {SEVERITY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSeverityFilter(value)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--radius-full)',
                background: severityFilter === value ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${severityFilter === value ? 'var(--border-hover)' : 'var(--border-base)'}`,
                color: severityFilter === value ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)', fontSize: '0.75rem', cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!activeProject ? (
          <EmptyState icon={<Shield size={40} />} title="Open a project first" description="Select a project from the dashboard to run an audit" />
        ) : filteredFindings.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={40} />}
            title={!securityReport && !performanceReport ? "No audit run yet" : "No findings"}
            description={!securityReport && !performanceReport ? "Click Run Audit to start scanning" : "No issues found for this filter"}
            action={!securityReport && <Button variant="primary" onClick={runAudit} leftIcon={<Play size={13} />}>Run Audit</Button>}
          />
        ) : (
          filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              type={activeTab}
            />
          ))
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({
  title, value, icon, color,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      padding: '14px 16px',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-base)',
      boxShadow: 'var(--shadow-sm)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, marginBottom: '6px' }}>
      {icon}
      <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
        {title}
      </span>
    </div>
    <p style={{ fontSize: '1.5rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</p>
  </motion.div>
);

export default AuditReport;
