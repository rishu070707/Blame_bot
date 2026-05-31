import type { OllamaModel, OllamaRequest, ChatMessage } from '../types';

const DEFAULT_HOST = 'http://localhost:11434';

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

  buildSystemPrompt(context?: string): string {
    return `You are BlameBot, an expert AI developer assistant specialized in code analysis, debugging, security vulnerability detection, and performance optimization. You provide precise, actionable responses with code examples. Always consider security implications and production readiness.
    
CRITICAL: When providing code blocks, you MUST specify the target file path in the markdown language tag like so:
\`\`\`language /path/to/target/file.ts
// code here
\`\`\`
${context ? `\n\nProject Context:\n${context}` : ''}`;
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
