import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { runSecurityAudit, runPerformanceAudit } from '../services/tauriService';
import type { SecurityAuditReport, PerformanceAuditReport, SeverityLevel } from '../types';

export function useAudit() {
  const {
    activeProjectId, projects,
    setSecurityReport, setPerformanceReport,
    setAuditRunning, setAuditProgress,
    addNotification,
  } = useAppStore();

  const activeProject = projects.find(p => p.id === activeProjectId);

  const runAudit = useCallback(async () => {
    if (!activeProject) {
      addNotification({ type: 'warning', title: 'No Project', message: 'Open a project first' });
      return;
    }

    setAuditRunning(true, 0);
    try {
      setAuditProgress(10);
      const secFindings = await runSecurityAudit(activeProject.path);
      setAuditProgress(50);

      const perfFindings = await runPerformanceAudit(activeProject.path);
      setAuditProgress(90);

      const secReport: SecurityAuditReport = {
        projectId: activeProject.id,
        generatedAt: new Date(),
        totalFindings: secFindings.length,
        criticalCount: secFindings.filter(f => f.severity === 'critical').length,
        highCount: secFindings.filter(f => f.severity === 'high').length,
        mediumCount: secFindings.filter(f => f.severity === 'medium').length,
        lowCount: secFindings.filter(f => f.severity === 'low').length,
        securityScore: Math.max(0, 100 - secFindings.filter(f => f.severity === 'critical').length * 20 - secFindings.filter(f => f.severity === 'high').length * 10),
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
      addNotification({ type: 'success', title: 'Audit Complete', message: `Found ${secReport.totalFindings + perfReport.totalFindings} total issues` });
    } catch (err: any) {
      setAuditRunning(false);
      addNotification({ type: 'error', title: 'Audit Failed', message: err.message });
    }
  }, [activeProject, setAuditRunning, setAuditProgress, setSecurityReport, setPerformanceReport, addNotification]);

  return { runAudit, activeProject };
}
