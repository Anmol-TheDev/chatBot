import { useState } from 'react';

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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to fetch stream");
      }

      // Artificial delay to let the user enjoy the ThinkingLoader animation
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsLoading(false); // Stop loading spinner, start streaming

      const botMsgId = Date.now().toString();
      // Initialize empty bot message
      setMessages(prev => [...prev, { id: botMsgId, role: 'bot', content: "", isStreaming: true }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";
      let parsedSuggestedQuestions: string[] | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Robust parsing of concatenated JSON objects using a bracket counter
        let startIndex = 0;
        
        while (startIndex < buffer.length) {
          // Skip any whitespace between objects
          while (startIndex < buffer.length && /\s/.test(buffer[startIndex])) {
            startIndex++;
          }
          if (startIndex >= buffer.length) break;
          if (buffer[startIndex] !== '{') break; // Malformed data? Stop parsing here.

          let openBraces = 0;
          let inString = false;
          let escapeNext = false;
          let endIndex = -1;

          for (let i = startIndex; i < buffer.length; i++) {
            const char = buffer[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            if (char === '"') {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') openBraces++;
              else if (char === '}') openBraces--;
              
              if (openBraces === 0) {
                endIndex = i;
                break;
              }
            }
          }

          if (endIndex !== -1) {
            // Found a complete JSON object
            const jsonStr = buffer.substring(startIndex, endIndex + 1);
            startIndex = endIndex + 1; // Advance for the next object
            
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.token) {
                accumulatedContent += parsed.token;
                // Update state in real-time as soon as the token is complete
                setMessages(prev => prev.map(msg => 
                  msg.id === botMsgId 
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ));
              } else if (parsed.type === "metadata" && parsed.data) {
                 if (parsed.data.suggestedQuestions) {
                    parsedSuggestedQuestions = parsed.data.suggestedQuestions;
                 }
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
              console.warn("Failed to parse extracted JSON object:", jsonStr);
            }
          } else {
            // The JSON object is incomplete, wait for more chunks
            break;
          }
        }
        
        // Retain only the incomplete portion of the buffer
        buffer = buffer.substring(startIndex);
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
          ? { ...msg, content: accumulatedContent, suggestedQuestions: parsedSuggestedQuestions, isStreaming: false }
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

  const markStreamComplete = (_msgId: string) => {
    // Left empty or for future use since true streaming updates content directly
  };

  return {
    messages,
    isLoading,
    handleAsk,
    markStreamComplete
  };
}
