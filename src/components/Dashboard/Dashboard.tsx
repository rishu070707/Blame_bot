import React from 'react';
import { motion } from 'framer-motion';
import { ProjectSidebar } from './ProjectSidebar';
import { AIChat } from './AIChat';
import { ResultsPanel } from './ResultsPanel';
import { useAppStore, selectActiveProject } from '../../store/appStore';
import { ScoreRing, Badge } from '../ui';
import { Shield, Activity, TrendingDown, Zap } from 'lucide-react';

// ─── Health Score Widget ──────────────────────────────────────

const HealthScoreWidget: React.FC = () => {
  const { securityReport, performanceReport } = useAppStore();
  const activeProject = useAppStore(selectActiveProject);

  if (!activeProject || (!securityReport && !performanceReport)) return null;

  const secScore = securityReport?.securityScore ?? 0;
  const perfScore = performanceReport?.performanceScore ?? 0;
  const overall = securityReport && performanceReport
    ? Math.round((secScore + perfScore) / 2)
    : secScore || perfScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '12px 20px',
        background: '#fff',
        borderBottom: 'var(--border-width) solid #000',
        display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ScoreRing score={overall} size={52} label="" />
        <div>
          <p style={{ fontSize: '0.875rem', color: '#000', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Project Health
          </p>
          <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#000', textTransform: 'uppercase' }}>
            {activeProject.name}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {securityReport && (
          <MiniStat icon={<Shield size={12} />} label="Security" value={`${secScore}/100`} color={secScore >= 80 ? 'var(--success)' : secScore >= 60 ? 'var(--warning)' : 'var(--danger)'} />
        )}
        {performanceReport && (
          <MiniStat icon={<Activity size={12} />} label="Performance" value={`${perfScore}/100`} color={perfScore >= 80 ? 'var(--success)' : perfScore >= 60 ? 'var(--warning)' : 'var(--danger)'} />
        )}
        {securityReport && (
          <MiniStat icon={<Shield size={12} />} label="Vulns" value={String(securityReport.totalFindings)} color="var(--danger)" />
        )}
      </div>
    </motion.div>
  );
};

const MiniStat: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({
  icon, label, value, color,
}) => (
  <div style={{ textAlign: 'center', background: '#fff', border: '2px solid #000', padding: '8px 12px', boxShadow: '2px 2px 0px #000' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#000', marginBottom: '2px', justifyContent: 'center', fontWeight: 900 }}>
      {icon}
      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    </div>
    <p style={{ fontSize: '1.25rem', fontWeight: 900, color }}>{value}</p>
  </div>
);

// ─── Dashboard Layout ─────────────────────────────────────────

export const Dashboard: React.FC = () => {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Health Score Bar */}
      <HealthScoreWidget />

      {/* Three-column Layout */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '240px 1fr 280px',
        gap: '12px',
        padding: '12px',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Left: Projects */}
        <ProjectSidebar />

        {/* Center: AI Chat */}
        <AIChat />

        {/* Right: Audit Results */}
        <ResultsPanel />
      </div>
    </div>
  );
};

export default Dashboard;
