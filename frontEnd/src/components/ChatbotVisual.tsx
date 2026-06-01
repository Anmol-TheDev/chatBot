import { MoreVertical, Clock, Bot, Package, ArrowLeftRight, CreditCard, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";

export function ChatbotVisual() {
  const placeholders = [
    "Type your message...",
    "Track my recent order...",
    "How do I return an item?",
    "Payment methods accepted",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
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
            <ScrollArea className="h-full px-6 py-4">
              <div className="space-y-6">
                {/* Bot Message 1 */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 border border-border shrink-0 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[280px]">
                    <p className="text-sm text-foreground">Welcome 👋 How can I assist you today?</p>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex justify-end gap-3">
                  <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-3 max-w-[280px]">
                    <p className="text-sm text-primary-foreground">I need help with my order.</p>
                  </div>
                </div>

                {/* Bot Message 2 */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 border border-border shrink-0 mt-1">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-3">
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[280px]">
                      <p className="text-sm text-foreground">I can help with that. Choose an option below:</p>
                    </div>

                    {/* Quick Action Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-auto py-2 px-2 sm:py-2.5 sm:px-3 rounded-xl justify-start bg-card hover:bg-accent border-border/50 text-foreground group">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-1.5 sm:mr-2 shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Package className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium">Track Order</span>
                      </Button>

                      <Button variant="outline" className="h-auto py-2 px-2 sm:py-2.5 sm:px-3 rounded-xl justify-start bg-card hover:bg-accent border-border/50 text-foreground group">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-1.5 sm:mr-2 shrink-0 group-hover:bg-primary/20 transition-colors">
                          <ArrowLeftRight className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium">Return</span>
                      </Button>

                      <Button variant="outline" className="h-auto py-2 px-2 sm:py-2.5 sm:px-3 rounded-xl justify-start bg-card hover:bg-accent border-border/50 text-foreground group">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-1.5 sm:mr-2 shrink-0 group-hover:bg-primary/20 transition-colors">
                          <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium">Payment</span>
                      </Button>

                      <Button variant="outline" className="h-auto py-2 px-2 sm:py-2.5 sm:px-3 rounded-xl justify-start bg-card hover:bg-accent border-border/50 text-foreground group">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-1.5 sm:mr-2 shrink-0 group-hover:bg-primary/20 transition-colors">
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium">Other</span>
                      </Button>
                    </div>
                  </div>
                </div>
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
