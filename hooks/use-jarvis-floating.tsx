"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type ChatState = "closed" | "minimized" | "expanded";

interface JarvisFloatingContextType {
  chatState: ChatState;
  setChatState: (state: ChatState) => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  expandChat: () => void;
}

const JarvisFloatingContext = createContext<JarvisFloatingContextType | undefined>(undefined);

export function JarvisFloatingProvider({ children }: { children: ReactNode }) {
  const [chatState, setChatState] = useState<ChatState>("closed");

  const toggleChat = () => {
    if (chatState === "closed") {
      setChatState("expanded");
    } else if (chatState === "expanded") {
      setChatState("minimized");
    } else {
      setChatState("expanded");
    }
  };

  const openChat = () => setChatState("expanded");
  const closeChat = () => setChatState("closed");
  const minimizeChat = () => setChatState("minimized");
  const expandChat = () => setChatState("expanded");

  return (
    <JarvisFloatingContext.Provider value={{ 
      chatState, 
      setChatState, 
      toggleChat, 
      openChat, 
      closeChat, 
      minimizeChat, 
      expandChat 
    }}>
      {children}
    </JarvisFloatingContext.Provider>
  );
}

export function useJarvisFloating() {
  const context = useContext(JarvisFloatingContext);
  if (context === undefined) {
    throw new Error('useJarvisFloating must be used within a JarvisFloatingProvider');
  }
  return context;
}