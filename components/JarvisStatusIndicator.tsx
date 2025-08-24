'use client';

import { useEffect, useState, useRef } from 'react';
import { useJarvis } from '@/app/hooks/useJarvis';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { JarvisAudioLevelsCompact } from '@/components/JarvisAudioLevels';
import { JarvisConfidenceCompact } from '@/components/JarvisConfidence';
import { JarvisStatusIndicatorProps } from '@/types/jarvis';
import { format } from 'date-fns';
import clsx from 'clsx';

export function JarvisStatusIndicator({ 
  status: propStatus,
  isConnected: propIsConnected,
  isConnecting: propIsConnecting,
  showDetails = false,
  variant = 'full',
  className
}: Partial<JarvisStatusIndicatorProps> = {}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionHistory, setConnectionHistory] = useState<Array<{ timestamp: number; connected: boolean }>>([]);
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  
  const { 
    capabilities, 
    error, 
    audioLevels, 
    confidence, 
    mcpEnhanced,
    activeStreams,
    connectionState,
    refreshStatus,
    status: hookStatus,
    isConnected: hookIsConnected,
    isConnecting: hookIsConnecting
  } = useJarvis();

  // Use props if provided, otherwise fall back to hook values
  const status = propStatus || hookStatus;
  const isConnected = propIsConnected !== undefined ? propIsConnected : hookIsConnected;
  const isConnecting = propIsConnecting !== undefined ? propIsConnecting : hookIsConnecting;

  // Track connection history
  useEffect(() => {
    setConnectionHistory(prev => {
      const newEntry = { timestamp: Date.now(), connected: isConnected };
      const updated = [...prev, newEntry];
      return updated.slice(-20); // Keep last 20 entries
    });
  }, [isConnected]);

  // Simulate heartbeat tracking
  useEffect(() => {
    if (isConnected) {
      setLastHeartbeat(Date.now());
      const interval = setInterval(() => {
        setLastHeartbeat(Date.now());
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isConnecting) return 'bg-yellow-500';
    if (status?.health?.status === 'degraded') return 'bg-orange-500';
    if (status?.health?.status === 'healthy') return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (!isConnected) return 'Offline';
    if (status?.health?.status === 'healthy') return 'Online';
    if (status?.health?.status === 'degraded') return 'Limited';
    if (status?.health?.status === 'offline') return 'Offline';
    return 'Unknown';
  };

  const getConnectionQuality = (): number => {
    if (!isConnected) return 0;
    if (status?.health?.status === 'healthy') return 100;
    if (status?.health?.status === 'degraded') return 70;
    return 50;
  };

  const getServiceHealthCount = () => {
    if (!status?.health?.service_health) return { total: 0, healthy: 0 };
    
    const services = status.health.service_health;
    const total = Object.keys(services).length;
    const healthy = Object.values(services).filter(Boolean).length;
    
    return { total, healthy };
  };

  // Dot variant - minimal indicator
  if (variant === 'dot') {
    return (
      <div 
        className={clsx('relative group cursor-pointer', className)}
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
        title={`JARVIS: ${getStatusText()}`}
      >
        <div className="relative">
          <div className={clsx(
            'w-3 h-3 rounded-full transition-all duration-300',
            getStatusColor(),
            isConnected ? 'animate-pulse' : ''
          )} />
          
          {/* Activity ring for streaming */}
          {activeStreams.size > 0 && (
            <div className="absolute inset-0 w-3 h-3 rounded-full border-2 border-blue-400 animate-ping" />
          )}
          
          {/* Connection quality indicator */}
          {isConnected && (
            <div 
              className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-white border"
              style={{
                borderColor: getConnectionQuality() > 80 ? '#22c55e' : 
                           getConnectionQuality() > 50 ? '#eab308' : '#ef4444'
              }}
            />
          )}
        </div>
        
        {/* Enhanced tooltip */}
        {showDetails && (
          <div className="absolute hidden group-hover:block z-50 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl -top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <div className="space-y-1">
              <div className="font-medium">JARVIS: {getStatusText()}</div>
              {isConnected && (
                <>
                  <div>Quality: {getConnectionQuality()}%</div>
                  {confidence > 0 && <div>Confidence: {confidence.toFixed(1)}%</div>}
                  {mcpEnhanced && <div>⚡ MCP Enhanced</div>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Badge variant - compact status badge
  if (variant === 'badge') {
    return (
      <Badge 
        className={clsx(
          'flex items-center gap-2 cursor-pointer transition-all duration-200 hover:scale-105',
          isConnected ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200',
          className
        )}
        variant="outline"
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-1">
          <div className={clsx(
            'w-2 h-2 rounded-full',
            getStatusColor()
          )} />
          <span className="text-xs font-medium">JARVIS</span>
        </div>
        
        {isConnecting && (
          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        )}
        
        {!isConnecting && (
          <span className="text-xs">{getStatusText()}</span>
        )}
        
        {/* Additional indicators */}
        <div className="flex items-center gap-1">
          {confidence > 0 && (
            <JarvisConfidenceCompact confidence={confidence} showLabel={false} />
          )}
          {mcpEnhanced && (
            <span className="text-blue-600">⚡</span>
          )}
          {activeStreams.size > 0 && (
            <span className="text-xs text-blue-600">📡</span>
          )}
        </div>
      </Badge>
    );
  }

  // Full variant - comprehensive status display
  return (
    <Card className={clsx('transition-all duration-300', isExpanded ? 'shadow-lg' : '', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={clsx(
              'w-4 h-4 rounded-full transition-all duration-300',
              getStatusColor(),
              isConnected ? 'animate-pulse' : ''
            )} />
            {activeStreams.size > 0 && (
              <div className="absolute inset-0 w-4 h-4 rounded-full border-2 border-blue-400 animate-ping" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">JARVIS Assistant</h3>
            <p className="text-sm text-gray-600">{getStatusText()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status badges */}
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {getStatusText()}
          </Badge>
          
          {mcpEnhanced && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              ⚡ Enhanced
            </Badge>
          )}
          
          {activeStreams.size > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              📡 {activeStreams.size} streaming
            </Badge>
          )}
          
          {/* Expand/collapse button */}
          {showDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▲' : '▼'}
            </Button>
          )}
        </div>
      </div>

      {/* Connection Quality Bar */}
      {isConnected && (
        <div className="px-4 py-2 bg-gray-50">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
            <span>Connection Quality</span>
            <span>{getConnectionQuality()}%</span>
          </div>
          <Progress value={getConnectionQuality()} className="h-1" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 rounded">
          <div className="flex items-start gap-2">
            <span className="text-red-500">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 text-red-700 border-red-300"
                onClick={refreshStatus}
              >
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time indicators */}
      <div className="p-4 space-y-3">
        {/* Audio levels */}
        {audioLevels && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Audio Levels</span>
            <JarvisAudioLevelsCompact levels={audioLevels} />
          </div>
        )}
        
        {/* Confidence score */}
        {confidence > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Confidence</span>
            <JarvisConfidenceCompact confidence={confidence} />
          </div>
        )}
        
        {/* Active streams */}
        {activeStreams.size > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Active Streams</span>
            <Badge variant="outline" className="text-xs">
              {activeStreams.size} running
            </Badge>
          </div>
        )}
      </div>

      {/* Detailed status (expanded) */}
      {isExpanded && status && (
        <div className="border-t p-4 space-y-4">
          {/* Service Health */}
          {status?.health?.service_health && (
            <div>
              <h4 className="font-medium text-sm mb-2">Service Health</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(status.health.service_health).map(([service, healthy]) => (
                  <div key={service} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-xs text-gray-600 capitalize">
                      {service.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs">
                      {healthy ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Services Status</span>
                  <span>{getServiceHealthCount().healthy}/{getServiceHealthCount().total} healthy</span>
                </div>
                <Progress 
                  value={(getServiceHealthCount().healthy / getServiceHealthCount().total) * 100} 
                  className="h-1 mt-1" 
                />
              </div>
            </div>
          )}

          {/* JARVIS Capabilities */}
          {status?.health?.jarvis_status && (
            <div>
              <h4 className="font-medium text-sm mb-2">JARVIS Status</h4>
              <div className="space-y-1">
                {[
                  { key: 'listening', label: 'Voice Recognition', value: status.health.jarvis_status.listening },
                  { key: 'processing', label: 'Processing', value: status.health.jarvis_status.processing },
                  { key: 'model_loaded', label: 'AI Model', value: status.health.jarvis_status.model_loaded },
                  { key: 'audio_devices_ok', label: 'Audio Devices', value: status.health.jarvis_status.audio_devices_ok },
                  { key: 'obsidian_connected', label: 'Memory Storage', value: status.health.jarvis_status.obsidian_connected },
                  { key: 'tts_available', label: 'Text-to-Speech', value: status.health.jarvis_status.tts_available },
                ].map(({ key, label, value }) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{label}</span>
                    <span>{value ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capabilities */}
          {capabilities && (
            <div>
              <h4 className="font-medium text-sm mb-2">Available Capabilities</h4>
              <div className="flex flex-wrap gap-1">
                {Object.entries(capabilities).map(([key, enabled]) => (
                  <Badge 
                    key={key}
                    variant={enabled ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {key.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Connection Info */}
          <div>
            <h4 className="font-medium text-sm mb-2">Connection Details</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">WebSocket State</span>
                <span className="font-mono">
                  {connectionState === 0 ? 'CONNECTING' :
                   connectionState === 1 ? 'OPEN' :
                   connectionState === 2 ? 'CLOSING' :
                   connectionState === 3 ? 'CLOSED' : 'UNKNOWN'}
                </span>
              </div>
              {lastHeartbeat && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Heartbeat</span>
                  <span>{format(new Date(lastHeartbeat), 'HH:mm:ss')}</span>
                </div>
              )}
              {status.metadata?.version && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Version</span>
                  <span className="font-mono">v{status.metadata.version}</span>
                </div>
              )}
              {status.metadata?.uptime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Uptime</span>
                  <span>{Math.floor(status.metadata.uptime / 1000 / 60)} minutes</span>
                </div>
              )}
            </div>
          </div>

          {/* Connection History */}
          {connectionHistory.length > 1 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Connection History</h4>
              <div className="flex gap-1">
                {connectionHistory.slice(-10).map((entry, index) => (
                  <div
                    key={index}
                    className={clsx(
                      'w-2 h-2 rounded-full',
                      entry.connected ? 'bg-green-400' : 'bg-red-400'
                    )}
                    title={`${entry.connected ? 'Connected' : 'Disconnected'} at ${format(new Date(entry.timestamp), 'HH:mm:ss')}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last 10 connection states
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isConnecting && !status && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-600">Connecting to JARVIS...</span>
        </div>
      )}

      {/* Disconnected State */}
      {!isConnected && !isConnecting && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔌</div>
          <p className="text-sm text-gray-600 mb-2">
            JARVIS service is not available
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Please ensure the JARVIS backend is running
          </p>
          <Button 
            size="sm" 
            variant="outline"
            onClick={refreshStatus}
          >
            Try to Connect
          </Button>
        </div>
      )}
    </Card>
  );
}

// Floating status widget for always-visible status
export function JarvisFloatingStatus() {
  const { isConnected, isConnecting, confidence, activeStreams } = useJarvis();
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isConnecting) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-xl border transition-all duration-300 hover:shadow-2xl">
        {isMinimized ? (
          <div 
            className="p-3 cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center gap-2">
              <div className={clsx(
                'w-3 h-3 rounded-full',
                getStatusColor(),
                isConnected && 'animate-pulse'
              )} />
              <span className="text-sm font-medium">JARVIS</span>
            </div>
          </div>
        ) : (
          <div className="p-4 min-w-48">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={clsx(
                  'w-3 h-3 rounded-full',
                  getStatusColor(),
                  isConnected && 'animate-pulse'
                )} />
                <span className="text-sm font-medium">JARVIS</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  −
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Status</span>
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {confidence > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Confidence</span>
                  <span>{confidence.toFixed(1)}%</span>
                </div>
              )}
              
              {activeStreams.size > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Streaming</span>
                  <span className="text-blue-600">{activeStreams.size} active</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Header status bar component
export function JarvisHeaderStatus() {
  const { isConnected, confidence, mcpEnhanced, activeStreams } = useJarvis();
  
  return (
    <div className="flex items-center gap-3">
      <JarvisStatusIndicator
        variant="badge"
        showDetails={false}
        className="text-xs"
      />
      
      {confidence > 0 && (
        <JarvisConfidenceCompact confidence={confidence} />
      )}
      
      {mcpEnhanced && (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
          ⚡ Enhanced
        </Badge>
      )}
      
      {activeStreams.size > 0 && (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
          📡 Streaming
        </Badge>
      )}
    </div>
  );
}

export default JarvisStatusIndicator;