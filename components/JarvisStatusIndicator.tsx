'use client';

import { useEffect, useState } from 'react';
import { useJarvis } from '@/app/hooks/useJarvis';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import clsx from 'clsx';

interface JarvisStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  variant?: 'compact' | 'full' | 'minimal';
}

export function JarvisStatusIndicator({ 
  className, 
  showDetails = false,
  variant = 'compact'
}: JarvisStatusIndicatorProps) {
  const { isConnected, isConnecting, status, capabilities, error } = useJarvis();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isConnecting) return 'bg-yellow-500';
    if (status?.health.status === 'healthy') return 'bg-green-500';
    return 'bg-orange-500';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (!isConnected) return 'Offline';
    if (status?.health.status === 'healthy') return 'Online';
    if (status?.health.status === 'unhealthy') return 'Unhealthy';
    return 'Connected';
  };

  // Minimal variant - just a dot
  if (variant === 'minimal') {
    return (
      <div 
        className={clsx('relative group', className)}
        title={`JARVIS: ${getStatusText()}`}
      >
        <div className={clsx(
          'w-3 h-3 rounded-full',
          getStatusColor(),
          isConnected && 'animate-pulse'
        )} />
        
        {/* Tooltip on hover */}
        <div className="absolute hidden group-hover:block z-10 p-2 bg-gray-900 text-white text-xs rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          JARVIS: {getStatusText()}
        </div>
      </div>
    );
  }

  // Compact variant - status badge
  if (variant === 'compact') {
    return (
      <Badge 
        className={clsx('flex items-center gap-2 cursor-pointer', className)}
        variant={isConnected ? 'default' : 'secondary'}
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
      >
        <div className={clsx(
          'w-2 h-2 rounded-full',
          getStatusColor()
        )} />
        <span>JARVIS</span>
        {isConnecting && <Spinner className="w-3 h-3" />}
        {!isConnecting && <span>{getStatusText()}</span>}
      </Badge>
    );
  }

  // Full variant - detailed status card
  return (
    <Card className={clsx('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-3 h-3 rounded-full',
            getStatusColor(),
            isConnected && 'animate-pulse'
          )} />
          <h3 className="font-semibold">JARVIS Status</h3>
        </div>
        <Badge variant={isConnected ? 'default' : 'secondary'}>
          {getStatusText()}
        </Badge>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Connection Details */}
      {status && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">WebSocket:</span>
            <span className="font-mono">{status.config.websocket_url}</span>
          </div>
          
          {status.health.jarvis_status && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Listening:</span>
                <span>{status.health.jarvis_status.listening ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Model Loaded:</span>
                <span>{status.health.jarvis_status.model_loaded ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Audio OK:</span>
                <span>{status.health.jarvis_status.audio_devices_ok ? '✅' : '❌'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Obsidian:</span>
                <span>{status.health.jarvis_status.obsidian_connected ? '✅' : '❌'}</span>
              </div>
            </>
          )}

          {/* Capabilities */}
          {showDetails && capabilities && (
            <div className="mt-3 pt-3 border-t">
              <h4 className="font-medium mb-2">Capabilities</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(capabilities).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className="text-gray-600 text-xs">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-xs">{value ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Check */}
          {status.health.last_check && (
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-500 text-xs">Last check:</span>
              <span className="text-gray-500 text-xs">
                {new Date(status.health.last_check).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isConnecting && !status && (
        <div className="flex items-center justify-center py-4">
          <Spinner className="w-6 h-6" />
          <span className="ml-2 text-sm text-gray-600">Connecting to JARVIS...</span>
        </div>
      )}

      {/* Disconnected State */}
      {!isConnected && !isConnecting && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 mb-2">
            JARVIS service is not available
          </p>
          <p className="text-xs text-gray-500">
            Please ensure the JARVIS backend is running
          </p>
        </div>
      )}
    </Card>
  );
}

// Floating status widget for always-visible status
export function JarvisFloatingStatus() {
  const { isConnected, isConnecting } = useJarvis();
  const [isVisible, setIsVisible] = useState(true);

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    if (isConnecting) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-full shadow-lg p-3 flex items-center gap-2">
        <div className={clsx(
          'w-3 h-3 rounded-full',
          getStatusColor(),
          isConnected && 'animate-pulse'
        )} />
        <span className="text-sm font-medium">JARVIS</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}