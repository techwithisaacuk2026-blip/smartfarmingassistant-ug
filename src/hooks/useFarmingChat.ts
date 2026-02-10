import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farming-assistant`;

export function useFarmingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "lg">("en");
  const { user } = useAuth();

  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId && user) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId, user]);

  const loadConversation = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = (data || []).map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        imageUrl: msg.image_url || undefined,
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const createConversation = async (title: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: title.slice(0, 50) || "New Conversation",
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const saveMessage = async (
    convId: string,
    role: "user" | "assistant",
    content: string,
    imageUrl?: string
  ) => {
    try {
      await supabase.from("messages").insert({
        conversation_id: convId,
        role,
        content,
        image_url: imageUrl || null,
      });

      // Update conversation's updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const updateConversationTitle = async (convId: string, title: string) => {
    try {
      await supabase
        .from("conversations")
        .update({ title: title.slice(0, 50) })
        .eq("id", convId);
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const sendMessage = useCallback(
    async (content: string, imageBase64?: string) => {
      const userMessageId = crypto.randomUUID();

      // Build the user message content
      let userContent: any = content || "Please analyze this image and provide farming advice.";

      // If there's an image, format for multimodal
      if (imageBase64) {
        userContent = [
          {
            type: "image_url",
            image_url: { url: imageBase64 },
          },
          {
            type: "text",
            text:
              content ||
              "Please analyze this plant image and tell me if there are any problems. Give me advice on how to care for it.",
          },
        ];
      }

      // Add user message to UI
      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        content:
          typeof userContent === "string"
            ? userContent
            : content || "Analyzing uploaded image...",
        imageUrl: imageBase64,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Create conversation if needed
      let activeConvId = conversationId;
      if (!activeConvId && user) {
        const title = typeof userContent === "string" ? userContent : content || "Image Analysis";
        activeConvId = await createConversation(title);
        if (activeConvId) {
          setConversationId(activeConvId);
        }
      }

      // Save user message to database
      if (activeConvId) {
        await saveMessage(activeConvId, "user", userMessage.content, imageBase64);
      }

      try {
        // Prepare messages for API (convert to proper format)
        const apiMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Add current message
        apiMessages.push({
          role: "user" as const,
          content: userContent,
        });

        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: apiMessages, language }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Stream the response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        const assistantMessageId = crypto.randomUUID();
        let textBuffer = "";

        // Add empty assistant message
        setMessages((prev) => [
          ...prev,
          { id: assistantMessageId, role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          // Process line-by-line
          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
                  )
                );
              }
            } catch {
              // Incomplete JSON, put back and wait
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Flush remaining buffer
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
                  )
                );
              }
            } catch {
              // ignore
            }
          }
        }

        // Save assistant message to database
        if (activeConvId && assistantContent) {
          await saveMessage(activeConvId, "assistant", assistantContent);

          // Update title if this is the first exchange
          if (messages.length === 0) {
            const title =
              typeof userContent === "string" ? userContent : content || "Farming Question";
            await updateConversationTitle(activeConvId, title);
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to get response. Please try again."
        );
        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((msg) => msg.content !== ""));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, conversationId, user, language]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const selectConversation = useCallback((id: string | null) => {
    setConversationId(id);
    if (!id) {
      setMessages([]);
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    conversationId,
    selectConversation,
    language,
    setLanguage,
  };
}
