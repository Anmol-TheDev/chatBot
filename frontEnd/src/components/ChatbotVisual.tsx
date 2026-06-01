import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Clock, Bot, Package, ArrowLeftRight, CreditCard, HelpCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { useChat } from '@/hooks/useChat';
import ThinkingLoader from "@/components/content/thinking-loader";

export function ChatbotVisual() {
  const { messages, isLoading, handleAsk } = useChat();
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const placeholders = [
    "Type your message...",
    "Track my recent order...",
    "How do I return an item?",
    "Payment methods accepted",
  ];

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue) {
      handleAsk(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="relative w-full">
      <div className="w-full max-w-[480px] mx-auto">
        <Card className="backdrop-blur-2xl bg-card/90 border-border/50 shadow-2xl w-full sm:w-2xl overflow-hidden flex flex-col h-[500px] sm:h-[600px]">
          {/* Header */}
          <CardHeader className="p-4 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">Oracle AI</CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground">
                <Clock className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <ScrollArea className="h-full px-6 py-4" ref={scrollAreaRef}>
              <div className="space-y-6 pb-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {msg.role === 'bot' ? (
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 border border-border shrink-0 mt-1">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-3">
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[280px]">
                            <p className="text-sm text-foreground whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>

                          {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                            <div className="flex flex-col gap-2 pt-1">
                              {msg.suggestedQuestions.map((sq, idx) => (
                                <Button
                                  key={idx}
                                  variant="outline"
                                  onClick={() => handleAsk(sq)}
                                  className="h-auto py-1.5 px-3 rounded-sm bg-background hover:bg-accent border-border text-xs font-medium text-muted-foreground hover:text-foreground text-left max-w-full whitespace-normal break-words"
                                >
                                  {sq}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3 max-w-[280px]">
                          <p className="text-sm text-primary-foreground">{msg.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 border border-border shrink-0 mt-1">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center">
                      <ThinkingLoader phrases={["Thinking..."]} className="text-xs" textClassName="w-28 text-xs" />
                    </div>
                  </div>
                )}
                <div ref={endOfMessagesRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input */}
          <CardFooter className=" pt-2 border-t border-border/50 bg-card ">
            <PlaceholdersAndVanishInput
              placeholders={placeholders}
              onChange={handleChange}
              onSubmit={onSubmit}
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
