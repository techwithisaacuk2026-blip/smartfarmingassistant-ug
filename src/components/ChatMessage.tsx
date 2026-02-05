import { Sprout, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export function ChatMessage({ role, content, imageUrl }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 animate-slide-up ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "gradient-hero text-primary-foreground"
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Sprout className="w-5 h-5" />}
      </div>
      <div
        className={`max-w-[80%] ${
          isUser ? "chat-bubble-user" : "chat-bubble-assistant"
        }`}
      >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Uploaded plant"
            className="rounded-lg mb-2 max-h-48 object-cover"
          />
        )}
        <div className="prose prose-sm prose-green max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
              ),
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => (
                <strong className="font-bold text-primary">{children}</strong>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
