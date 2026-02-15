import { useRef, useEffect, useState } from "react";
import { Trash2, Sprout, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { useFarmingChat } from "@/hooks/useFarmingChat";

const Index = () => {
  const { messages, isLoading, sendMessage, clearChat, conversationId, selectConversation, language, setLanguage } =
    useFarmingChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleExampleClick = (question: string) => {
    sendMessage(question);
  };

  const handleNewConversation = () => {
    clearChat();
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ConversationSidebar
        currentConversationId={conversationId}
        onSelectConversation={selectConversation}
        onNewConversation={handleNewConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 ml-10 md:ml-0">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
                <Sprout className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">
                  {language === "lg" ? "Obulimi obw'Amagezi" : "Smart Farming"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {language === "lg" ? "Omuyambi wo ow'ebirime" : "Your crop assistant"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "en" ? "lg" : "en")}
                className="text-xs font-medium"
              >
                <Languages className="w-4 h-4 mr-1" />
                {language === "en" ? "Luganda" : "English"}
              </Button>

              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewConversation}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {language === "lg" ? "Jjamu" : "Clear"}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <WelcomeScreen onExampleClick={handleExampleClick} language={language} />
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    imageUrl={message.imageUrl}
                  />
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-9 h-9 rounded-full gradient-hero flex items-center justify-center">
                      <Sprout className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="chat-bubble-assistant">
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 bg-primary rounded-full animate-pulse-gentle"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Input Area */}
        <footer className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <ChatInput onSend={sendMessage} isLoading={isLoading} language={language} />
            <p className="text-center text-xs text-muted-foreground mt-3">
              Created by <span className="font-medium text-foreground">Kazibwe Isaac</span> in Uganda · <a href="mailto:techwithisaacuk2026@gmail.com" className="underline hover:text-primary transition-colors">techwithisaacuk2026@gmail.com</a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
