import React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "./chat/ChatProvider";

export const TopBarChatButton: React.FC = () => {
  const { toggleChat, open } = useChat();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleChat}
      className={`relative ${open ? "bg-accent" : ""}`}
      aria-label="Toggle chat"
      title="Chat"
    >
      <MessageCircle className="h-5 w-5" />
      <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${
        open ? "bg-green-500" : "bg-transparent"
      }`} />
    </Button>
  );
};