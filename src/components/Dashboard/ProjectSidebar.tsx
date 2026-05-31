import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Plus, ChevronRight, Files, Code2,
  Trash2, Clock, Activity, Database,
} from 'lucide-react';
import { useAppStore, selectActiveProject } from '../../store/appStore';
import { useScanner } from '../../hooks/useScanner';
import { Button, EmptyState, LoadingSpinner, Progress } from '../ui';
import type { Project } from '../../types';

// ─── Project Card ─────────────────────────────────────────────

const ProjectCard: React.FC<{
  project: Project;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}> = ({ project, isActive, onClick, onRemove }) => {
  const topLanguage = project.languages
    ? Object.entries(project.languages).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ x: 2 }}
      style={{
        padding: '12px',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        background: isActive ? 'var(--accent-cyan-dim)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(34,211,238,0.2)' : 'transparent'}`,
        transition: 'all var(--transition-fast)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          background: isActive ? 'var(--accent-cyan-dim)' : 'var(--bg-base)',
          border: `1px solid ${isActive ? 'rgba(34,211,238,0.3)' : 'var(--border-base)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
        }}>
          <FolderOpen size={16} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.875rem', fontWeight: 600,
            color: isActive ? 'var(--accent-cyan)' : 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {project.name}
          </p>
          <p style={{
            fontSize: '0.75rem', color: 'var(--text-dim)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {project.path.split(/[\\/]/).slice(-2).join('/')}
          </p>

          {project.fileCount && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Files size={10} />
                {project.fileCount} files
              </span>
              {topLanguage && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Code2 size={10} />
                  {topLanguage}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          {isActive && <ChevronRight size={14} style={{ color: 'var(--accent-cyan)' }} />}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              background: 'none', border: 'none', color: 'var(--text-dim)',
              cursor: 'pointer', padding: '2px', opacity: 0,
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Health score bar */}
      {project.healthScore && (
        <div style={{ marginTop: '10px' }}>
          <Progress
            value={project.healthScore.overall}
            height={3}
            color={
              project.healthScore.overall >= 80 ? 'var(--success)'
                : project.healthScore.overall >= 60 ? 'var(--warning)'
                : 'var(--danger)'
            }
          />
        </div>
      )}
    </motion.div>
  );
};

// ─── Sidebar Component ────────────────────────────────────────

export const ProjectSidebar: React.FC = () => {
  const {
    projects,
    activeProjectId,
    setActiveProject,
    removeProject,
    isIndexing,
    indexingProgress,
    indexedFiles,
  } = useAppStore();
  const { openAndScanProject } = useScanner();

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-surface)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-base)',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Projects
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={openAndScanProject}
          title="Open Project"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Indexing Progress */}
      <AnimatePresence>
        {isIndexing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-base)', flexShrink: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <LoadingSpinner size={12} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Indexing... {indexingProgress}%
              </span>
            </div>
            <Progress value={indexingProgress} height={3} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={32} />}
            title="No projects yet"
            description="Open a project folder to get started"
            action={
              <Button variant="primary" size="sm" onClick={openAndScanProject} leftIcon={<Plus size={13} />}>
                Open Project
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                onClick={() => setActiveProject(project.id)}
                onRemove={() => removeProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {activeProject && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-base)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <StatItem icon={<Files size={12} />} label="Files" value={`${activeProject.fileCount ?? 0}`} />
            <StatItem icon={<Database size={12} />} label="Indexed" value={`${indexedFiles.length}`} />
            <StatItem icon={<Activity size={12} />} label="Lines" value={formatNum(activeProject.totalLines ?? 0)} />
            <StatItem
              icon={<Clock size={12} />}
              label="Scanned"
              value={activeProject.lastScannedAt
                ? new Date(activeProject.lastScannedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : 'Never'}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div style={{
    padding: '8px 10px',
    background: 'var(--bg-base)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-base)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', marginBottom: '2px' }}>
      {icon}
      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    </div>
    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{value}</p>
  </div>
);

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default ProjectSidebar;
