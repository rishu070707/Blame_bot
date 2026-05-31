import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { FileNode } from "../types";

export interface ScanResult {
  tree: FileNode; total_files: number; total_lines: number; language_counts: Record<string, number>;
}

export async function scanProject(path: string): Promise<ScanResult> {
  return invoke<ScanResult>("scan_project", { path });
}

export async function readFileContent(path: string): Promise<string> {
  return invoke<string>("read_file_content", { path });
}

export async function getFilesForIndexing(projectPath: string, excludePatterns: string[], extensions: string[]): Promise<Array<{ path: string; content: string; language: string }>> {
  return invoke("get_files_for_indexing", { projectPath, excludePatterns, extensions });
}

export async function openProjectFolder(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false, title: "Select Project Folder" });
  return selected as string | null;
}

export interface RustSecurityFinding {
  id: string; severity: string; finding_type: string; title: string;
  description: string; file: string; line: number | null; snippet: string | null;
  cwe: string | null; suggested_fix: string | null; confidence: number;
}

export async function runSecurityAudit(projectPath: string): Promise<RustSecurityFinding[]> {
  return invoke<RustSecurityFinding[]>("run_security_audit", { projectPath });
}

export interface RustPerfFinding {
  id: string; severity: string; issue_type: string; title: string;
  description: string; file: string; line: number | null; snippet: string | null;
  impact: string; suggested_fix: string | null;
}

export async function runPerformanceAudit(projectPath: string): Promise<RustPerfFinding[]> {
  return invoke<RustPerfFinding[]>("run_performance_audit", { projectPath });
}

export async function openInExplorer(path: string): Promise<void> {
  return invoke("open_in_explorer", { path });
}

export async function hideWindow(): Promise<void> { return invoke("hide_window"); }
export async function showWindow(): Promise<void> { return invoke("show_window"); }

export async function applyCodeEdit(path: string, content: string): Promise<void> {
  return invoke("apply_code_edit", { path, content });
}

export async function replaceInFile(path: string, target: string, replacement: string): Promise<void> {
  return invoke("replace_in_file", { path, target, replacement });
}

export async function saveFileDialog(defaultPath?: string): Promise<string | null> {
  const selected = await save({ title: "Apply Code to File", defaultPath });
  return selected as string | null;
}

