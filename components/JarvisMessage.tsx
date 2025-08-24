'use client';

import React, { memo, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  JarvisMessageProps, 
  StreamingMessage, 
  SearchSource 
} from '@/types/jarvis';
import { 
  getSourceIcon, 
  getSourceLabel, 
  getConfidenceColor, 
  getConfidenceBadgeColor 
} from '@/app/hooks/useJarvis';
import clsx from 'clsx';

// Typewriter effect for streaming messages
const TypewriterText = memo(({ 
  content, 
  isStreaming = false,
  speed = 20 
}: { 
  content: string; 
  isStreaming?: boolean;
  speed?: number;
}) => {
  const [displayContent, setDisplayContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayContent(content);
      return;
    }

    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [content, currentIndex, isStreaming, speed]);

  return (
    <span className="whitespace-pre-wrap">
      {displayContent}
      {isStreaming && currentIndex < content.length && (
        <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1" />
      )}
    </span>
  );
});

TypewriterText.displayName = 'TypewriterText';

// Source attribution badges
const SourceBadges = memo(({ 
  sources, 
  mcpEnhanced = false 
}: { 
  sources?: string[]; 
  mcpEnhanced?: boolean;
}) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {sources.map((source, index) => (
        <Badge
          key={`${source}-${index}`}
          variant="secondary"
          className="text-xs flex items-center gap-1"
        >
          {getSourceIcon(source as SearchSource)}
          {getSourceLabel(source as SearchSource)}
        </Badge>
      ))}
      {mcpEnhanced && (
        <Badge
          variant="outline"
          className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
        >
          ⚡ Enhanced
        </Badge>
      )}
    </div>
  );
});

SourceBadges.displayName = 'SourceBadges';

// Confidence indicator
const ConfidenceIndicator = memo(({ 
  confidence, 
  breakdown,
  showBreakdown = false 
}: { 
  confidence?: number; 
  breakdown?: any;
  showBreakdown?: boolean;
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (confidence === undefined || confidence === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <Badge
          className={clsx(
            'text-xs cursor-pointer transition-colors',
            getConfidenceBadgeColor(confidence)
          )}
          onClick={() => breakdown && setShowDetails(!showDetails)}
        >
          {confidence.toFixed(1)}% confidence
          {breakdown && (
            <span className="ml-1">
              {showDetails ? '▼' : '▶'}
            </span>
          )}
        </Badge>
      </div>
      
      {showDetails && breakdown && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <div className="grid grid-cols-2 gap-2">
            <div>Search Quality: {breakdown.search_quality?.toFixed(1)}%</div>
            <div>Tool Success: {breakdown.tool_success?.toFixed(1)}%</div>
            <div>Response Quality: {breakdown.response_quality?.toFixed(1)}%</div>
            <div>Model Behavior: {breakdown.model_behavior?.toFixed(1)}%</div>
          </div>
        </div>
      )}
    </div>
  );
});

ConfidenceIndicator.displayName = 'ConfidenceIndicator';

// Message metadata display
const MessageMetadata = memo(({ 
  message, 
  showTimestamp = true,
  showDetails = false 
}: { 
  message: StreamingMessage;
  showTimestamp?: boolean;
  showDetails?: boolean;
}) => {
  if (!showTimestamp && !showDetails) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
      {showTimestamp && (
        <span>
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      )}
      
      {message.isStreaming && (
        <Badge variant="outline" className="text-xs">
          Streaming...
        </Badge>
      )}
      
      {message.metadata?.source && (
        <Badge variant="outline" className="text-xs">
          {message.metadata.source}
        </Badge>
      )}
      
      {showDetails && message.metadata?.token_count && (
        <span>
          {message.metadata.token_count} tokens
        </span>
      )}
      
      {showDetails && (
        <span>
          Processing time unavailable
        </span>
      )}
    </div>
  );
});

MessageMetadata.displayName = 'MessageMetadata';

// Main JarvisMessage component
export const JarvisMessage = memo<JarvisMessageProps>(({
  message,
  showMetadata = true,
  showConfidence = true,
  showSources = true,
  onRetry,
  className
}) => {
  const isUser = message.type === 'user';
  const isAssistant = message.type === 'assistant';

  return (
    <div className={clsx('flex w-full', className)}>
      <div className={clsx(
        'flex max-w-[85%]',
        isUser ? 'ml-auto' : 'mr-auto'
      )}>
        <div className={clsx(
          'rounded-lg px-4 py-3 shadow-sm',
          isUser 
            ? 'bg-blue-500 text-white ml-auto' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-auto'
        )}>
          {/* Message Content */}
          <div className="text-sm">
            {isAssistant && message.isStreaming ? (
              <TypewriterText
                content={message.content}
                isStreaming={true}
                speed={30}
              />
            ) : (
              <span className="whitespace-pre-wrap">
                {message.content}
              </span>
            )}
          </div>

          {/* Assistant-specific features */}
          {isAssistant && (
            <>
              {/* Confidence Indicator */}
              {showConfidence && message.metadata?.confidence && (
                <ConfidenceIndicator
                  confidence={message.metadata.confidence}
                  breakdown={message.metadata.confidence_breakdown}
                  showBreakdown={true}
                />
              )}

              {/* Source Attribution */}
              {showSources && (
                <SourceBadges
                  sources={message.metadata?.search_sources}
                  mcpEnhanced={message.metadata?.mcp_enhanced}
                />
              )}
            </>
          )}

          {/* Message Metadata */}
          {showMetadata && (
            <MessageMetadata
              message={message}
              showTimestamp={true}
              showDetails={false}
            />
          )}

          {/* Retry Button for failed messages */}
          {message.metadata?.final_response === false && onRetry && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRetry(message.id)}
                className="text-xs"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

JarvisMessage.displayName = 'JarvisMessage';

// Compact version for lists
export const JarvisMessageCompact = memo<JarvisMessageProps>(({
  message,
  showMetadata = false,
  showConfidence = false,
  showSources = false,
  className
}) => {
  const isUser = message.type === 'user';

  return (
    <div className={clsx('flex items-start gap-2 py-2', className)}>
      {/* Avatar */}
      <div className={clsx(
        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs',
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-700'
      )}>
        {isUser ? 'U' : 'J'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {message.isStreaming ? (
            <TypewriterText
              content={message.content}
              isStreaming={true}
              speed={50}
            />
          ) : (
            <span className="line-clamp-2">
              {message.content}
            </span>
          )}
        </div>

        {showConfidence && message.metadata?.confidence && (
          <div className="mt-1">
            <span className={clsx(
              'text-xs',
              getConfidenceColor(message.metadata.confidence)
            )}>
              {message.metadata.confidence.toFixed(1)}%
            </span>
          </div>
        )}

        {showMetadata && (
          <div className="text-xs text-gray-500 mt-1">
            {format(new Date(message.timestamp), 'HH:mm')}
          </div>
        )}
      </div>
    </div>
  );
});

JarvisMessageCompact.displayName = 'JarvisMessageCompact';

// Message list component
export const JarvisMessageList = memo(({
  messages,
  showMetadata = true,
  showConfidence = true,
  showSources = true,
  onRetry,
  className
}: {
  messages: StreamingMessage[];
  showMetadata?: boolean;
  showConfidence?: boolean;
  showSources?: boolean;
  onRetry?: (messageId: string) => void;
  className?: string;
}) => {
  return (
    <div className={clsx('space-y-4', className)}>
      {messages.map((message) => (
        <JarvisMessage
          key={message.id}
          message={message}
          showMetadata={showMetadata}
          showConfidence={showConfidence}
          showSources={showSources}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
});

JarvisMessageList.displayName = 'JarvisMessageList';

export default JarvisMessage;