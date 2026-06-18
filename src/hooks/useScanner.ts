import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "../store/appStore";
import { openProjectFolder, scanProject, getFilesForIndexing, runSecurityAudit, runPerformanceAudit } from "../services/tauriService";
import { indexingService } from "../services/indexingService";
import { autoFixService } from "../services/autoFixService";
import type { Project, SecurityAuditReport, PerformanceAuditReport, SeverityLevel } from "../types";

export function useScanner() {
  const { 
    addProject, setIndexing, setIndexedFiles, addNotification, settings,
    setSecurityReport, setPerformanceReport, setAuditRunning, setAuditProgress, activeModel
  } = useAppStore();

  const openAndScanProject = useCallback(async () => {
    const path = await openProjectFolder();
    if (!path) return;

    const name = path.split(/[\\/]/).pop() ?? path;
    addNotification({ type: "info", title: "Scanning Project", message: `Indexing ${name}...`, duration: 2000 });
    setIndexing(true, 5);

    try {
      const result = await scanProject(path);
      setIndexing(true, 30);

      const files = await getFilesForIndexing(path, settings.indexing.excludePatterns, settings.indexing.includedExtensions);
      setIndexing(true, 60);

      const indexed = indexingService.buildIndex(files, (p) => setIndexing(true, 60 + p * 0.4));
      setIndexedFiles(indexed);
      setIndexing(false, 100);

      const project: Project = {
        id: uuidv4(), name, path, createdAt: new Date(), lastScannedAt: new Date(),
        fileCount: result.total_files, totalLines: result.total_lines,
        languages: result.language_counts as any,
      };
      addProject(project);
      addNotification({ type: "success", title: "Project Indexed", message: `${result.total_files} files ready to search` });

      // Automatically run audits
      addNotification({ type: "info", title: "Auto-Audit Started", message: `Running security and performance audits...` });
      setAuditRunning(true, 10);
      
      const secFindings = await runSecurityAudit(path);
      setAuditProgress(50);
      
      const perfFindings = await runPerformanceAudit(path);
      setAuditProgress(90);

      const secReport: SecurityAuditReport = {
        projectId: project.id,
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
        projectId: project.id,
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

      // Auto Fix
      const allFindings = [...secReport.findings, ...perfReport.findings].filter(f => f.snippet);
      if (allFindings.length > 0) {
        addNotification({ type: "info", title: "Auto-Fix Started", message: `AI is automatically fixing ${allFindings.length} issues...`, duration: 10000 });
        
        await autoFixService.autoFixFindings(allFindings, activeModel, (current, total, file) => {
          addNotification({ type: "info", title: "Auto-Fixing", message: `Fixing ${current}/${total}: ${file}`, duration: 2000 });
        });

        addNotification({ type: "success", title: "Auto-Fix Complete", message: `Successfully applied fixes to ${allFindings.length} issues.` });
      }

    } catch (err: any) {
      console.error("Scanner Error:", err);
      setIndexing(false);
      setAuditRunning(false);
      addNotification({ type: "error", title: "Operation Failed", message: err?.message || typeof err === 'string' ? err : JSON.stringify(err) });
    }
  }, [addProject, setIndexing, setIndexedFiles, addNotification, settings.indexing, setSecurityReport, setPerformanceReport, setAuditRunning, setAuditProgress, activeModel]);

  const reindexProject = useCallback(async (path: string, name: string) => {
    addNotification({ type: "info", title: "Restoring Project", message: `Indexing ${name}...`, duration: 2000 });
    setIndexing(true, 5);
    try {
      const result = await scanProject(path);
      setIndexing(true, 30);
      const files = await getFilesForIndexing(path, settings.indexing.excludePatterns, settings.indexing.includedExtensions);
      setIndexing(true, 60);
      const indexed = indexingService.buildIndex(files, (p) => setIndexing(true, 60 + p * 0.4));
      setIndexedFiles(indexed);
      setIndexing(false, 100);
      addNotification({ type: "success", title: "Project Ready", message: `${result.total_files} files ready to search` });
    } catch (err: any) {
      console.error("Scanner Error:", err);
      setIndexing(false);
      addNotification({ type: "error", title: "Failed to load project", message: err?.message || typeof err === 'string' ? err : JSON.stringify(err) });
    }
  }, [setIndexing, setIndexedFiles, addNotification, settings.indexing]);

  return { openAndScanProject, reindexProject };
}
