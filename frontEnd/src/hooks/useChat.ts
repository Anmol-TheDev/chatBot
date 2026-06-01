import { useState } from 'react';
import apiClient from '@/lib/axios';

export type Message = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  suggestedQuestions?: string[] | null;
  isStreaming?: boolean;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: "Welcome 👋 How can I assist you today?",
      suggestedQuestions: [
        "Track my recent order",
        "How do I return an item?",
        "Payment methods accepted"
      ]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: question }]);
    setIsLoading(true);

    try {
      // Use standard fetch to read the stream instead of axios, which fails on concatenated JSON
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${baseUrl}/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to fetch stream");
      }

      setIsLoading(false); // Stop loading spinner, start streaming

      const botMsgId = Date.now().toString();
      // Initialize empty bot message
      setMessages(prev => [...prev, { id: botMsgId, role: 'bot', content: "", isStreaming: false }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";
      let parsedSuggestedQuestions = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // A trick to parse concatenated JSON objects like `{"token": "..."}{"type": "metadata"}`
        // We replace `}{` with `}SPLIT{` to easily separate them, even if no newlines exist.
        const stringChunks = buffer.replace(/\}\s*\{/g, '}SPLIT{').split('SPLIT');
        
        // Keep the last chunk in the buffer if it's incomplete
        buffer = stringChunks.pop() || "";

        for (const chunkStr of stringChunks) {
          try {
            const parsed = JSON.parse(chunkStr);
            if (parsed.token) {
              accumulatedContent += parsed.token;
              // Update state with new token
              setMessages(prev => prev.map(msg => 
                msg.id === botMsgId 
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ));
            } else if (parsed.type === "metadata" && parsed.data) {
               if (parsed.data.suggestedQuestions) {
                  parsedSuggestedQuestions = parsed.data.suggestedQuestions;
               }
               // Could also handle answer fallback if token wasn't provided
               if (!accumulatedContent && parsed.data.answer) {
                  accumulatedContent = parsed.data.answer;
               }
               setMessages(prev => prev.map(msg => 
                msg.id === botMsgId 
                  ? { ...msg, content: accumulatedContent, suggestedQuestions: parsedSuggestedQuestions }
                  : msg
               ));
            }
          } catch (e) {
            // Should not happen for complete chunks, but safe fallback
            console.warn("Failed to parse inner chunk", chunkStr);
          }
        }
      }

      // Try to parse whatever is left in the buffer when stream ends
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.token) {
             accumulatedContent += parsed.token;
          } else if (parsed.type === "metadata" && parsed.data?.suggestedQuestions) {
             parsedSuggestedQuestions = parsed.data.suggestedQuestions;
          }
        } catch (e) {
          // ignore
        }
      }

      // Final update to attach suggested questions if they weren't attached yet
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId 
          ? { ...msg, content: accumulatedContent, suggestedQuestions: parsedSuggestedQuestions }
          : msg
      ));

    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'bot',
          content: "I'm sorry, I'm having trouble connecting to the server right now. Please try again later.",
        }
      ]);
    }
  };

  const markStreamComplete = (msgId: string) => {
    // Left empty or for future use since true streaming updates content directly
  };

  return {
    messages,
    isLoading,
    handleAsk,
    markStreamComplete
  };
}
