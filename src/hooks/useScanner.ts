import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "../store/appStore";
import { openProjectFolder, scanProject, getFilesForIndexing } from "../services/tauriService";
import { indexingService } from "../services/indexingService";
import type { Project } from "../types";

export function useScanner() {
  const { addProject, setIndexing, setIndexedFiles, addNotification, settings } = useAppStore();

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
    } catch (err: any) {
      setIndexing(false);
      addNotification({ type: "error", title: "Scan Failed", message: err.message });
    }
  }, [addProject, setIndexing, setIndexedFiles, addNotification, settings.indexing]);

  return { openAndScanProject };
}
