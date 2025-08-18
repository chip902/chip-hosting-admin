'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useJarvis } from '@/app/hooks/useJarvis';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import clsx from 'clsx';

interface JarvisChatProps {
  className?: string;
  showStatus?: boolean;
  maxHeight?: string;
}

export function JarvisChat({ 
  className, 
  showStatus = true,
  maxHeight = '600px'
}: JarvisChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    isConnected, 
    isConnecting,
    sendMessage, 
    conversations, 
    error,
    status,
    clearConversations,
    refreshStatus
  } = useJarvis();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [conversations]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || isLoading) return;

    const message = input.trim();
    setInput('');
    setIsLoading(true);
    
    try {
      await sendMessage(message);
      // Focus back on input after sending
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore the input on error
      setInput(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isConnecting) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (!isConnected) return 'Offline';
    if (status?.health.status === 'healthy') return 'Online';
    return 'Connected';
  };

  return (
    <Card className={clsx('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={clsx('w-3 h-3 rounded-full animate-pulse', getStatusColor())} />
            <h3 className="font-semibold text-lg">JARVIS Assistant</h3>
          </div>
          {showStatus && (
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {getStatusText()}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStatus}
            disabled={isConnecting}
          >
            {isConnecting ? <Spinner className="w-4 h-4" /> : '🔄'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearConversations}
            disabled={conversations.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">⚠️</div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversation History */}
      <ScrollArea 
        className="flex-1 p-4"
        style={{ maxHeight }}
        ref={scrollAreaRef}
      >
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isConnected ? (
              <div>
                <p className="text-lg mb-2">👋 Hello! I'm JARVIS.</p>
                <p className="text-sm">How can I assist you today?</p>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-2">🔌 JARVIS is offline</p>
                <p className="text-sm">Please ensure the JARVIS service is running.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((turn) => (
              <div key={turn.id} className="space-y-2">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="bg-blue-500 text-white rounded-lg px-4 py-2">
                      <p className="text-sm">{turn.userMessage}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {format(new Date(turn.timestamp), 'HH:mm')}
                    </p>
                  </div>
                </div>
                
                {/* JARVIS Response */}
                <div className="flex justify-start">
                  <div className="max-w-[80%]">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <p className="text-sm whitespace-pre-wrap">{turn.jarvisResponse}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      JARVIS • {format(new Date(turn.timestamp), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    <span className="text-sm text-gray-600">JARVIS is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isConnected 
                ? "Ask JARVIS anything..." 
                : "JARVIS is offline"
            }
            disabled={!isConnected || isLoading}
            className="flex-1"
            autoFocus
          />
          <Button 
            type="submit" 
            disabled={!isConnected || isLoading || !input.trim()}
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </Button>
        </div>
        
        {/* Quick Actions */}
        {isConnected && (
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput("What's the weather like today?")}
            >
              Weather
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput("What time is it?")}
            >
              Time
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInput("Tell me a joke")}
            >
              Joke
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}

// Minimal version for embedding in other pages
export function JarvisChatMinimal({ className }: { className?: string }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, sendMessage, conversations } = useJarvis();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || isLoading) return;

    const message = input.trim();
    setInput('');
    setIsLoading(true);
    
    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
      setInput(message);
    } finally {
      setIsLoading(false);
    }
  };

  const lastConversation = conversations[conversations.length - 1];

  return (
    <div className={clsx('space-y-2', className)}>
      {lastConversation && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">You: {lastConversation.userMessage}</p>
          <p className="text-sm mt-1">JARVIS: {lastConversation.jarvisResponse}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask JARVIS..."
          disabled={!isConnected || isLoading}
          className="flex-1"
        />
        <Button type="submit" disabled={!isConnected || isLoading}>
          {isLoading ? <Spinner className="w-4 h-4" /> : 'Ask'}
        </Button>
      </form>
    </div>
  );
}