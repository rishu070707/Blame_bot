import { ollamaService } from './ollamaService';
import { replaceInFile } from './tauriService';
import type { SecurityFinding, PerformanceFinding } from '../types';

export class AutoFixService {
  async autoFixFindings(
    findings: (SecurityFinding | PerformanceFinding)[],
    model: string,
    onProgress: (currentIndex: number, total: number, currentFile: string) => void
  ) {
    const fixableFindings = findings.filter(f => f.snippet);
    const total = fixableFindings.length;
    let current = 0;

    for (const finding of fixableFindings) {
      if (!finding.snippet) continue;
      current++;
      onProgress(current, total, finding.file);

      try {
        const prompt = ollamaService.buildSecurityAuditPrompt(
          finding.snippet,
          'code'
        );
        
        const response = await ollamaService.generateFix(model, prompt);
        
        let fixCode = response;
        const codeMatch = response.match(/```[a-z]*\n([\s\S]*?)```/);
        if (codeMatch && codeMatch[1]) {
          fixCode = codeMatch[1].trim();
        }

        await replaceInFile(finding.file, finding.snippet, fixCode);
      } catch (e) {
        console.error(`Failed to auto-fix ${finding.file}:`, e);
      }
    }
  }
}

export const autoFixService = new AutoFixService();
export default autoFixService;
