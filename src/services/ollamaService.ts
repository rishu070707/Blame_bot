import type { OllamaModel, OllamaRequest, ChatMessage } from '../types';

const DEFAULT_HOST = 'http://127.0.0.1:11434';

class OllamaService {
  private host: string = DEFAULT_HOST;

  setHost(host: string) { this.host = host; }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.host}/api/tags`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  }

  async listModels(): Promise<OllamaModel[]> {
    const res = await fetch(`${this.host}/api/tags`);
    if (!res.ok) throw new Error(`Failed to list models: ${res.statusText}`);
    const data = await res.json();
    return data.models ?? [];
  }

  async *chatStream(request: OllamaRequest, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
    const res = await fetch(`${this.host}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }), signal,
    });
    if (!res.ok) throw new Error(`Ollama error: ${await res.text()}`);
    if (!res.body) throw new Error('No response body');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n').filter(Boolean)) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) yield parsed.message.content;
            if (parsed.done) return;
          } catch { }
        }
      }
    } finally { reader.releaseLock(); }
  }

  async *generateStream(model: string, prompt: string, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
    const res = await fetch(`${this.host}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: true }), signal,
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
    if (!res.body) throw new Error('No response body');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n').filter(Boolean)) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) yield parsed.response;
            if (parsed.done) return;
          } catch { }
        }
      }
    } finally { reader.releaseLock(); }
  }

  async generateFix(model: string, prompt: string, signal?: AbortSignal): Promise<string> {
    const res = await fetch(`${this.host}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }), signal,
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
    const data = await res.json();
    return data.response;
  }

  buildSystemPrompt(context?: string, contextFiles?: Array<{ path: string; content: string; name: string; language: string }>): string {
    let fileContext = '';
    if (contextFiles && contextFiles.length > 0) {
      fileContext = '\n\n## Pinned Files for Editing\n\nThe user has pinned the following files. When editing them, use their EXACT path in your code fence:\n\n';
      for (const f of contextFiles) {
        fileContext += `### ${f.name} (${f.path})\n\`\`\`${f.language}\n${f.content}\n\`\`\`\n\n`;
      }
    }

    return `You are BlameBot, an expert AI developer assistant specialized in code analysis, debugging, security vulnerability detection, and performance optimization. You provide precise, actionable responses with code examples. Always consider security implications and production readiness.

## CRITICAL RULES FOR CODE EDITS

1. **ALWAYS** put the target file path right after the language in every code fence. For example, if you are modifying a CSS file at src/App.css, write:
   \`\`\`css src/App.css
   /* your code here */
   \`\`\`
   Do NOT copy this example blindly. Use the correct language and the actual file path you are editing.

2. Use the EXACT file path shown in "Pinned Files for Editing" when editing those files.

3. For NEW files, use a sensible path relative to the project root.

4. NEVER omit the file path from a code fence — it is required for one-click application.

5. When modifying an existing file, output the COMPLETE new file content (not just the changed lines) unless the file is very large, in which case output only the changed function/block with enough surrounding context to locate it.
${fileContext}${context ? `\n\nProject Context:\n${context}` : ''}`;
  }

  buildSecurityAuditPrompt(code: string, language: string): string {
    return `Perform a security audit on this ${language} code. Identify vulnerabilities including hardcoded secrets, injection risks, weak crypto, and authentication flaws.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;
  }

  buildMessages(history: ChatMessage[], newContent: string, systemPrompt?: string): OllamaRequest['messages'] {
    const messages: OllamaRequest['messages'] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    for (const msg of history.slice(-10)) {
      if (msg.role !== 'system') messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: 'user', content: newContent });
    return messages;
  }
}

export const ollamaService = new OllamaService();
export default ollamaService;
