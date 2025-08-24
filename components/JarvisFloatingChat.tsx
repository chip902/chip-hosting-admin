"use client";

import { useState, useEffect } from "react";
import { useJarvisFloating } from "@/hooks/use-jarvis-floating";
import { useJarvis } from "@/app/hooks/useJarvis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JarvisChat, JarvisChatMinimal } from "@/components/JarvisChat";
import { JarvisAudioLevels as JarvisAudioRefresh } from "./JarvisAudioLevels";
import { JarvisCapabilityDashboard } from "@/components/JarvisCapabilityDashboard";
import { JarvisListeningIndicator } from "@/components/JarvisListeningIndicator";
import { JarvisWelcomeTutorial } from "@/components/JarvisWelcomeTutorial";
import { X, Minus, Square, Settings, MessageCircle, HelpCircle, GraduationCap } from "lucide-react";
import clsx from "clsx";

type ChatState = "closed" | "minimized" | "expanded";

export function JarvisFloatingChat() {
  const { chatState, setChatState, toggleChat, closeChat, minimizeChat, expandChat } = useJarvisFloating();
  const [showSettings, setShowSettings] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { isConnected, sendMessage } = useJarvis();

  // Check if user is first time (in real app, this would use localStorage or user preferences)
  const isFirstTime = localStorage.getItem('jarvis-tutorial-completed') !== 'true';

  // Listen for keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.contentEditable === 'true';
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInInput) {
        e.preventDefault();
        toggleChat();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleChat]);

  const handleToggleChat = () => {
    toggleChat();
  };

  const handleCloseChat = () => {
    closeChat();
    setShowSettings(false);
    setShowCapabilities(false);
    setShowTutorial(false);
  };

  const handleMinimizeChat = () => {
    minimizeChat();
    setShowSettings(false);
    setShowCapabilities(false);
    setShowTutorial(false);
  };

  const handleMaximizeChat = () => {
    expandChat();
  };

  return (
    <>
      {/* Floating Chat Button - Always Visible */}
      {chatState === "closed" && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          {/* Tutorial Button for First-time Users */}
          {isFirstTime && (
            <Button
              onClick={() => {
                setShowTutorial(true);
                expandChat();
              }}
              size="sm"
              className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg animate-pulse"
            >
              <GraduationCap className="h-4 w-4 text-white mr-1" />
              <span className="text-xs text-white">Tutorial</span>
            </Button>
          )}
          
          <Button
            onClick={handleToggleChat}
            size="lg"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 relative group"
          >
            {/* Connection Status Indicator */}
            <div className={clsx(
              "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
              isConnected ? "bg-green-400" : "bg-red-400"
            )} />
            
            <MessageCircle className="h-6 w-6 text-white" />
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Ask JARVIS (⌘K)
            </div>
          </Button>
        </div>
      )}

      {/* Minimized Chat Bar */}
      {chatState === "minimized" && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="w-80 sm:w-80 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 shadow-lg border-0 ring-1 ring-gray-200 dark:ring-gray-700">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded text-white text-xs">
                  🤖
                </div>
                <span className="font-medium text-sm">JARVIS</span>
                <JarvisListeningIndicator variant="compact" className="ml-1" />
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTutorial(!showTutorial)}
                  className="h-6 w-6 p-0"
                  title="Tutorial"
                >
                  <GraduationCap className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCapabilities(!showCapabilities)}
                  className="h-6 w-6 p-0"
                  title="Show capabilities"
                >
                  <HelpCircle className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-6 w-6 p-0"
                  title="Audio settings"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaximizeChat}
                  className="h-6 w-6 p-0"
                >
                  <Square className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseChat}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {showTutorial && (
              <div className="border-t p-3">
                <JarvisWelcomeTutorial 
                  onComplete={() => {
                    localStorage.setItem('jarvis-tutorial-completed', 'true');
                    setShowTutorial(false);
                  }}
                  onSkip={() => setShowTutorial(false)}
                  onTryFeature={async (prompt) => {
                    await sendMessage(prompt);
                    setShowTutorial(false);
                  }}
                />
              </div>
            )}

            {showCapabilities && (
              <div className="border-t">
                <JarvisCapabilityDashboard 
                  onPromptSelect={async (prompt) => {
                    await sendMessage(prompt);
                    setShowCapabilities(false);
                  }}
                  onClose={() => setShowCapabilities(false)}
                />
              </div>
            )}
            
            {showSettings && (
              <div className="p-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium">Audio Device Management</span>
                </div>
                <JarvisAudioRefresh className="w-full" />
              </div>
            )}
            
            {!showSettings && !showCapabilities && !showTutorial && (
              <div className="p-3">
                <JarvisChatMinimal />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Expanded Chat Panel */}
      {chatState === "expanded" && (
        <div className="fixed bottom-6 right-6 z-50 max-h-[calc(100vh-3rem)]">
          <Card className="w-[500px] h-[700px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] bg-white dark:bg-gray-800 shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-t-lg border-b">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded text-white text-xs">
                  🤖
                </div>
                <div>
                  <h3 className="font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    JARVIS Assistant
                  </h3>
                  <p className="text-xs text-gray-500">
                    AI Assistant • Press ⌘K to toggle
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <JarvisListeningIndicator variant="compact" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTutorial(!showTutorial)}
                  className="h-6 w-6 p-0"
                  title="Tutorial"
                >
                  <GraduationCap className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCapabilities(!showCapabilities)}
                  className="h-6 w-6 p-0"
                  title="Show capabilities"
                >
                  <HelpCircle className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-6 w-6 p-0"
                  title="Audio settings"
                >
                  <Settings className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimizeChat}
                  className="h-6 w-6 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseChat}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Tutorial Panel */}
            {showTutorial && (
              <div className="border-b bg-gray-50 dark:bg-gray-800 p-4">
                <JarvisWelcomeTutorial 
                  onComplete={() => {
                    localStorage.setItem('jarvis-tutorial-completed', 'true');
                    setShowTutorial(false);
                  }}
                  onSkip={() => setShowTutorial(false)}
                  onTryFeature={async (prompt) => {
                    await sendMessage(prompt);
                    setShowTutorial(false);
                  }}
                />
              </div>
            )}

            {/* Capabilities Panel */}
            {showCapabilities && (
              <div className="border-b bg-gray-50 dark:bg-gray-800">
                <JarvisCapabilityDashboard 
                  onPromptSelect={async (prompt) => {
                    await sendMessage(prompt);
                    setShowCapabilities(false);
                  }}
                  onClose={() => setShowCapabilities(false)}
                />
              </div>
            )}

            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">Audio Device Management</span>
                  <Badge variant="outline" className="text-xs">
                    JARVIS Integration
                  </Badge>
                </div>
                <JarvisAudioRefresh className="w-full" />
              </div>
            )}

            {/* Chat Content */}
            <div className="flex-1 min-h-0">
              <JarvisChat
                className="h-full border-none rounded-none rounded-b-lg"
                showStatus={false} // Hide status since we show it in header
                enableVoice={true}
                enableStreaming={true}
                showConfidence={true}
                showSources={true}
                maxHeight="none"
                theme="auto"
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}