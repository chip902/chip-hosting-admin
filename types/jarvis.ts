// JARVIS TypeScript Definitions
// Comprehensive types for JARVIS AI assistant integration

import { ReadyState } from 'react-use-websocket';

// ============================================================================
// Core JARVIS Types
// ============================================================================

export interface JarvisStatusResponse {
  health: {
    is_connected: boolean;
    jarvis_status: {
      listening: boolean;
      processing: boolean;
      model_loaded: boolean;
      audio_devices_ok: boolean;
      obsidian_connected: boolean;
      tts_available: boolean;
      capabilities: JarvisCapabilities;
    };
    status: 'healthy' | 'degraded' | 'offline';
    service_health: {
      ollama: boolean;
      whisper: boolean;
      tts: boolean;
      vector_db: boolean;
      mcp_servers: boolean;
    };
  };
  metadata?: {
    version: string;
    uptime: number;
    last_restart: string;
  };
}

export interface JarvisCapabilities {
  voice_activation: boolean;
  text_input: boolean;
  enhanced_search: boolean;
  mcp_integration: boolean;
  confidence_scoring: boolean;
  audio_streaming: boolean;
  memory_persistence: boolean;
  web_search: boolean;
  document_search: boolean;
  [key: string]: boolean;
}

// ============================================================================
// Message Types
// ============================================================================

export interface JarvisMessageRequest {
  message: string;
  userId?: string;
  metadata?: {
    source?: 'text' | 'voice' | 'api';
    session_id?: string;
    timestamp?: number;
    context?: Record<string, any>;
  };
}

export interface JarvisMessageResponse {
  response: string;
  metadata: {
    response_time: number;
    confidence: number;
    search_sources?: string[];
    mcp_enhanced?: boolean;
    confidence_breakdown?: ConfidenceBreakdown;
    token_count?: number;
    model_used?: string;
    session_id?: string;
  };
  status: 'success' | 'error' | 'partial';
}

export interface ConfidenceBreakdown {
  search_quality: number;
  tool_success: number;
  response_quality: number;
  model_behavior: number;
  overall_score: number;
}

// ============================================================================
// Streaming Types
// ============================================================================

export interface StreamingMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isComplete?: boolean;
  responseId?: string;
  metadata?: {
    confidence?: number;
    search_sources?: string[];
    mcp_enhanced?: boolean;
    confidence_breakdown?: ConfidenceBreakdown;
    source?: 'text' | 'voice' | 'api';
    token_count?: number;
    final_response?: boolean;
  };
}

export interface StreamingState {
  activeStreams: Map<string, string>;
  streamingResponses: Map<string, StreamingMessage>;
  pendingTokens: Map<string, string[]>;
}

// ============================================================================
// WebSocket Message Types
// ============================================================================

export type JarvisWebSocketMessageType = 
  | 'jarvis_response'
  | 'jarvis_response_stream' 
  | 'jarvis_response_end'
  | 'status_update'
  | 'wake_word_detected'
  | 'audio_level'
  | 'error'
  | 'heartbeat'
  | 'user_message'
  | 'system_notification'
  | 'start_meeting_mode'
  | 'stop_meeting_mode'
  | 'meeting_transcription'
  | 'listening_mode_changed';

export interface JarvisWebSocketMessage {
  type: JarvisWebSocketMessageType;
  data: any;
  timestamp: number;
  id?: string;
}

export interface JarvisStreamingData {
  response_id: string;
  token?: string;
  stream_started?: boolean;
  stream_ended?: boolean;
  final_response?: string;
  metadata?: {
    confidence?: number;
    search_sources?: string[];
    mcp_enhanced?: boolean;
    confidence_breakdown?: ConfidenceBreakdown;
    total_tokens?: number;
  };
}

// ============================================================================
// Audio Types
// ============================================================================

export interface AudioLevels {
  primary: number;
  system: number;
  microphone?: number;
  speaker?: number;
  timestamp: number;
}

export interface VoiceActivation {
  wake_word_detected: boolean;
  confidence: number;
  timestamp: number;
  wake_word: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface JarvisConversationTurn {
  id: string;
  userMessage: string;
  jarvisResponse: string;
  timestamp: Date;
  metadata?: {
    response_time?: number;
    confidence?: number;
    search_sources?: string[];
    mcp_enhanced?: boolean;
    confidence_breakdown?: ConfidenceBreakdown;
    token_count?: number;
    model_used?: string;
  };
  source: 'text' | 'voice' | 'api';
  status?: 'pending' | 'streaming' | 'complete' | 'error';
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseJarvisReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connectionState: ReadyState;
  
  // Real-time data
  messages: StreamingMessage[];
  audioLevels: AudioLevels | null;
  status: JarvisStatusResponse | null;
  capabilities: JarvisCapabilities | null;
  
  // Streaming support
  activeStreams: Set<string>;
  
  // Methods
  sendMessage: (message: string, metadata?: Record<string, any>) => Promise<JarvisMessageResponse | void>;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearMessages: () => void;
  refreshStatus: () => Promise<void>;
  
  // Enhanced features
  confidence: number;
  searchSources: string[];
  mcpEnhanced: boolean;
  lastVoiceActivation: VoiceActivation | null;
  
  // Meeting mode state
  isMeetingMode: boolean;
  meetingStartTime: number | null;
  
  // Conversation history (legacy support)
  conversations: JarvisConversationTurn[];
  clearConversations: () => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface JarvisChatProps {
  className?: string;
  showStatus?: boolean;
  maxHeight?: string;
  enableVoice?: boolean;
  enableStreaming?: boolean;
  showConfidence?: boolean;
  showSources?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export interface JarvisMessageProps {
  message: StreamingMessage;
  showMetadata?: boolean;
  showConfidence?: boolean;
  showSources?: boolean;
  onRetry?: (messageId: string) => void;
  className?: string;
}

export interface JarvisConfidenceProps {
  confidence: number;
  breakdown?: ConfidenceBreakdown;
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'inline' | 'badge' | 'detailed';
  className?: string;
}

export interface JarvisAudioLevelsProps {
  levels?: AudioLevels;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onRefreshComplete?: (result: any) => void;
}

export interface JarvisStatusIndicatorProps {
  status: JarvisStatusResponse | null;
  isConnected: boolean;
  isConnecting: boolean;
  showDetails?: boolean;
  variant?: 'dot' | 'badge' | 'full';
  className?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class JarvisApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'JarvisApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  getUserMessage(): string {
    switch (this.status) {
      case 503:
        return 'JARVIS service is temporarily unavailable. Please try again later.';
      case 504:
        return 'Connection to JARVIS timed out. Please check your connection.';
      case 429:
        return 'Too many requests. Please wait a moment before trying again.';
      case 401:
        return 'Authentication required to access JARVIS.';
      case 403:
        return 'Access to JARVIS is forbidden.';
      default:
        return this.message || 'An unexpected error occurred with JARVIS.';
    }
  }
}

export interface JarvisErrorState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  lastRetry: number | null;
  isRetrying: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface JarvisConfig {
  websocket: {
    url: string;
    reconnectAttempts: number;
    reconnectInterval: number;
    heartbeatInterval: number;
    timeout: number;
  };
  features: {
    enableVoice: boolean;
    enableStreaming: boolean;
    enableConfidenceScoring: boolean;
    enableMcpIntegration: boolean;
    enableAudioLevels: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    showTimestamps: boolean;
    showMetadata: boolean;
    enableAnimations: boolean;
    maxMessages: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type JarvisEventHandler<T = any> = (data: T) => void;

export interface JarvisEventHandlers {
  onConnect?: JarvisEventHandler<void>;
  onDisconnect?: JarvisEventHandler<void>;
  onMessage?: JarvisEventHandler<StreamingMessage>;
  onStatusUpdate?: JarvisEventHandler<JarvisStatusResponse>;
  onAudioLevel?: JarvisEventHandler<AudioLevels>;
  onVoiceActivation?: JarvisEventHandler<VoiceActivation>;
  onError?: JarvisEventHandler<Error>;
  onStreamStart?: JarvisEventHandler<{ responseId: string }>;
  onStreamEnd?: JarvisEventHandler<{ responseId: string; finalResponse: string }>;
}

// Source attribution types
export type SearchSource = 'documents' | 'crawled_pages' | 'web_search' | 'memory' | 'tools';

export interface SourceAttribution {
  type: SearchSource;
  label: string;
  icon: string;
  count?: number;
  quality?: number;
}

// Export all types for easy importing
export * from './jarvis';