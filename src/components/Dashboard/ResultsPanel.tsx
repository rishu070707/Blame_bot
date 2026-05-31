import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Zap, AlertTriangle, CheckCircle, TrendingUp,
  FileText, ChevronRight, Activity,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { ScoreRing, Badge, EmptyState, Button, Progress } from '../ui';

// ─── Results Panel ────────────────────────────────────────────

export const ResultsPanel: React.FC = () => {
  const { securityReport, performanceReport, isAuditRunning, auditProgress, setCurrentView } = useAppStore();

  const hasResults = securityReport || performanceReport;

  if (isAuditRunning) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-base)', overflow: 'hidden',
        padding: '20px',
      }}>
        <AuditProgress progress={auditProgress} />
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-base)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--border-base)',
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Audit Results
          </span>
        </div>
        <EmptyState
          icon={<Shield size={32} />}
          title="No audit results"
          description="Run a security or performance audit to see results here"
          action={
            <Button variant="primary" size="sm" onClick={() => setCurrentView('audit')}>
              Run Audit
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-base)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Audit Results
        </span>
        <Button variant="ghost" size="sm" onClick={() => setCurrentView('audit')} rightIcon={<ChevronRight size={13} />}>
          Full Report
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Score Summary */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
        }}>
          {securityReport && (
            <ScoreCard
              title="Security"
              score={securityReport.securityScore}
              icon={<Shield size={14} />}
              color={securityReport.securityScore >= 80 ? 'var(--success)' : securityReport.securityScore >= 60 ? 'var(--warning)' : 'var(--danger)'}
              detail={`${securityReport.criticalCount} critical`}
            />
          )}
          {performanceReport && (
            <ScoreCard
              title="Performance"
              score={performanceReport.performanceScore}
              icon={<Activity size={14} />}
              color={performanceReport.performanceScore >= 80 ? 'var(--success)' : performanceReport.performanceScore >= 60 ? 'var(--warning)' : 'var(--danger)'}
              detail={`${performanceReport.totalFindings} issues`}
            />
          )}
        </div>

        {/* Recent Security Findings */}
        {securityReport && securityReport.findings.length > 0 && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Top Security Findings
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {securityReport.findings.slice(0, 3).map((f) => (
                <FindingRow
                  key={f.id}
                  severity={f.severity}
                  title={f.title}
                  file={f.file.split(/[\\/]/).pop() ?? f.file}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Performance Findings */}
        {performanceReport && performanceReport.findings.length > 0 && (
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Performance Issues
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {performanceReport.findings.slice(0, 3).map((f) => (
                <FindingRow
                  key={f.id}
                  severity={f.severity}
                  title={f.title}
                  file={f.file.split(/[\\/]/).pop() ?? f.file}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────

const ScoreCard: React.FC<{
  title: string; score: number; icon: React.ReactNode;
  color: string; detail: string;
}> = ({ title, score, icon, color, detail }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    style={{
      padding: '12px', background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-muted)' }}>
      {icon}
      <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
      <span style={{ fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>/100</span>
    </div>
    <Progress value={score} height={4} color={color} />
    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '6px' }}>{detail}</p>
  </motion.div>
);

const FindingRow: React.FC<{
  severity: string; title: string; file: string;
}> = ({ severity, title, file }) => (
  <div style={{
    padding: '8px 10px', background: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)',
    display: 'flex', alignItems: 'center', gap: '8px',
  }}>
    <div style={{
      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
      background: severity === 'critical' ? 'var(--danger)'
        : severity === 'high' ? '#F97316'
        : severity === 'medium' ? 'var(--warning)'
        : 'var(--accent-cyan)',
    }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </p>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{file}</p>
    </div>
    <Badge variant={severity as any} size="sm">{severity}</Badge>
  </div>
);

// ─── Audit Progress ───────────────────────────────────────────

const AuditProgress: React.FC<{ progress: number }> = ({ progress }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', height: '100%' }}
  >
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <ScoreRing score={progress} size={80} label="" />
    </div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Audit Running...</p>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Scanning files for issues</p>
    </div>
    <Progress value={progress} color="var(--accent-cyan)" label="Progress" showValue style={{ width: '100%' }} />

    {/* Animated scan steps */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {[
        { label: 'Parsing source files', done: progress > 20 },
        { label: 'Running security checks', done: progress > 50 },
        { label: 'Analyzing performance', done: progress > 75 },
        { label: 'Generating report', done: progress >= 100 },
      ].map(({ label, done }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {done
            ? <CheckCircle size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
            : <div style={{ width: 12, height: 12, flexShrink: 0, borderRadius: '50%', border: '1px solid var(--border-base)' }} />
          }
          <span style={{
            fontSize: '0.8125rem',
            color: done ? 'var(--text-secondary)' : 'var(--text-dim)',
            textDecoration: done ? 'none' : 'none',
          }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  </motion.div>
);

export default ResultsPanel;
