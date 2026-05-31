import { useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAppStore } from "../store/appStore";
import { ollamaService } from "../services/ollamaService";
import type { ChatMessage, OllamaRequest } from "../types";

export function useOllama() {
  const { settings, setOllamaStatus, setAvailableModels, addMessage, updateMessage, activeModel, chatMessages } = useAppStore();
  const abortRef = useRef<AbortController | null>(null);

  const checkHealth = useCallback(async () => {
    setOllamaStatus("checking");
    ollamaService.setHost(settings.ollamaHost);
    const healthy = await ollamaService.checkHealth();
    if (healthy) {
      setOllamaStatus("connected");
      try {
        const models = await ollamaService.listModels();
        setAvailableModels(models);
      } catch { }
    } else {
      setOllamaStatus("error");
    }
  }, [settings.ollamaHost, setOllamaStatus, setAvailableModels]);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    const userMsg: ChatMessage = { id: uuidv4(), role: "user", content, timestamp: new Date() };
    addMessage(userMsg);
    setOllamaStatus("streaming");

    const assistantId = uuidv4();
    const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true };
    addMessage(assistantMsg);

    abortRef.current = new AbortController();
    const request: OllamaRequest = {
      model: activeModel,
      messages: ollamaService.buildMessages(chatMessages, content, ollamaService.buildSystemPrompt()),
      stream: true,
      options: { temperature: settings.ai.temperature, num_ctx: settings.ai.contextWindow, num_predict: settings.ai.maxTokens },
    };

    try {
      let fullContent = "";
      for await (const chunk of ollamaService.chatStream(request, abortRef.current.signal)) {
        fullContent += chunk;
        updateMessage(assistantId, { content: fullContent });
      }
      updateMessage(assistantId, { isStreaming: false });
      setOllamaStatus("connected");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        updateMessage(assistantId, { content: "Error: " + (err.message ?? "Failed to get response"), isStreaming: false });
      }
      setOllamaStatus("error");
    }
  }, [activeModel, chatMessages, settings.ai, addMessage, updateMessage, setOllamaStatus]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setOllamaStatus("connected");
  }, [setOllamaStatus]);

  const isStreaming = useAppStore((s) => s.ollamaStatus === "streaming");
  const status = useAppStore((s) => s.ollamaStatus);

  return { checkHealth, sendMessage, cancelStream, isStreaming, status };
}
