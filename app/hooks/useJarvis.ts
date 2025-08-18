'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { jarvisApiClient, JarvisApiError } from '@/lib/jarvis-client';
import type { 
  JarvisStatusResponse, 
  JarvisConversationTurn,
  JarvisCapabilities,
  UseJarvisReturn,
  JarvisMessageResponse
} from '@/types/jarvis';

export function useJarvis(): UseJarvisReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<JarvisStatusResponse | null>(null);
  const [capabilities, setCapabilities] = useState<JarvisCapabilities | null>(null);
  const [conversations, setConversations] = useState<JarvisConversationTurn[]>([]);
  
  // Use ref to track if component is mounted
  const isMounted = useRef(true);

  // Check connection status
  const refreshStatus = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsConnecting(true);
    try {
      const statusResponse = await jarvisApiClient.getStatus();
      
      if (!isMounted.current) return;
      
      setStatus(statusResponse);
      setIsConnected(statusResponse.health.is_connected);
      
      // Update capabilities if available
      if (statusResponse.health.jarvis_status?.capabilities) {
        setCapabilities(statusResponse.health.jarvis_status.capabilities as JarvisCapabilities);
      }
      
      setError(null);
    } catch (err) {
      if (!isMounted.current) return;
      
      if (err instanceof JarvisApiError) {
        setError(err.getUserMessage());
      } else {
        setError(err instanceof Error ? err.message : 'Failed to connect to JARVIS');
      }
      setIsConnected(false);
      setStatus(null);
    } finally {
      if (isMounted.current) {
        setIsConnecting(false);
      }
    }
  }, []);

  // Send message to JARVIS
  const sendMessage = useCallback(async (
    message: string, 
    metadata?: Record<string, any>
  ): Promise<JarvisMessageResponse> => {
    if (!isConnected) {
      throw new Error('JARVIS is not connected');
    }

    try {
      setError(null);
      
      // Get user ID from session if available
      const userId = metadata?.userId || 'anonymous';
      
      const response = await jarvisApiClient.sendMessage({ 
        message, 
        userId,
        metadata 
      });
      
      // Add to conversation history
      const turn: JarvisConversationTurn = {
        id: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userMessage: message,
        jarvisResponse: response.response,
        timestamp: new Date(),
        metadata: response.metadata,
        source: 'text'
      };
      
      setConversations(prev => [...prev, turn]);
      
      return response;
    } catch (err) {
      if (err instanceof JarvisApiError) {
        const errorMessage = err.getUserMessage();
        setError(errorMessage);
        
        // If service is unavailable, update connection status
        if (err.status === 503 || err.status === 504) {
          setIsConnected(false);
        }
        
        throw new Error(errorMessage);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isConnected]);

  // Connect to JARVIS
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    setError(null);
    await refreshStatus();
  }, [isConnecting, isConnected, refreshStatus]);

  // Disconnect from JARVIS
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setStatus(null);
    setCapabilities(null);
    setError(null);
  }, []);

  // Clear conversation history
  const clearConversations = useCallback(() => {
    setConversations([]);
  }, []);

  // Initial connection on mount
  useEffect(() => {
    isMounted.current = true;
    
    // Initial connection attempt
    refreshStatus();
    
    // Set up periodic status checks
    const interval = setInterval(() => {
      if (isMounted.current) {
        refreshStatus();
      }
    }, 30000); // Check every 30 seconds
    
    // Cleanup
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [refreshStatus]);

  // Auto-reconnect on connection loss
  useEffect(() => {
    if (!isConnected && !isConnecting && !error) {
      const reconnectTimeout = setTimeout(() => {
        if (isMounted.current) {
          refreshStatus();
        }
      }, 5000); // Try to reconnect after 5 seconds
      
      return () => clearTimeout(reconnectTimeout);
    }
  }, [isConnected, isConnecting, error, refreshStatus]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,
    
    // JARVIS status
    status,
    capabilities,
    
    // Actions
    sendMessage,
    connect,
    disconnect,
    refreshStatus,
    
    // Conversation history
    conversations,
    clearConversations
  };
}

// Additional hook for WebSocket real-time updates
export function useJarvisWebSocket() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  const connect = useCallback(() => {
    const host = process.env.NEXT_PUBLIC_JARVIS_HOST || 'localhost';
    const port = process.env.NEXT_PUBLIC_JARVIS_PORT || '8765';
    const wsUrl = `ws://${host}:${port}`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('Connected to JARVIS WebSocket');
      setIsConnected(true);
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    websocket.onclose = () => {
      console.log('Disconnected from JARVIS WebSocket');
      setIsConnected(false);
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        connect();
      }, 5000);
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, []);
  
  const sendMessage = useCallback((type: string, data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type,
        data,
        timestamp: Date.now()
      }));
    }
  }, [ws]);
  
  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);
  
  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}