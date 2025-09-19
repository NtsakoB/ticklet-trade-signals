import React, { createContext, useContext, useState, useCallback } from "react";

type ChatContextType = {
  open: boolean;
  fullscreen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  toggleFullscreen: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  
  const openChat = useCallback(() => setOpen(true), []);
  const closeChat = useCallback(() => { 
    setOpen(false); 
    setFullscreen(false); 
  }, []);
  const toggleChat = useCallback(() => setOpen(v => !v), []);
  const toggleFullscreen = useCallback(() => setFullscreen(v => !v), []);

  return (
    <ChatContext.Provider value={{ open, fullscreen, openChat, closeChat, toggleChat, toggleFullscreen }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};