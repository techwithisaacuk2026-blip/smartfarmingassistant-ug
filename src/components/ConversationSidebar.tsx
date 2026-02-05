import { useState, useEffect } from "react";
import { MessageSquare, Plus, Trash2, LogOut, ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggle,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { signOut, user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setConversations((prev) => prev.filter((c) => c.id !== id));
      
      if (currentConversationId === id) {
        onSelectConversation(null);
      }
      
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={onToggle}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300",
          "md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">History</h2>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggle}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* New Conversation Button */}
        <div className="p-3">
          <Button
            onClick={() => {
              onNewConversation();
              if (window.innerWidth < 768) onToggle();
            }}
            className="w-full gradient-hero text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-3">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conversations yet.
              <br />
              Start chatting to save history!
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (window.innerWidth < 768) onToggle();
                  }}
                  className={cn(
                    "group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                    currentConversationId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => deleteConversation(conv.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* User Section */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
            <span className="truncate flex-1">{user?.email}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function refreshConversations() {
  // This will be called externally to refresh the list
}
