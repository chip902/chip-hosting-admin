'use client';

import React, { memo, useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JarvisAudioLevelsProps, AudioLevels } from '@/types/jarvis';
import clsx from 'clsx';

// Single audio level bar
const AudioLevelBar = memo(({
  level,
  label,
  max = 100,
  orientation = 'horizontal',
  size = 'md',
  showPeak = true,
  className
}: {
  level: number;
  label: string;
  max?: number;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showPeak?: boolean;
  className?: string;
}) => {
  const [peak, setPeak] = useState(0);
  const [peakHold, setPeakHold] = useState(0);
  const peakHoldTimer = useRef<NodeJS.Timeout | null>(null);

  // Update peak detection
  useEffect(() => {
    if (level > peak) {
      setPeak(level);
      setPeakHold(level);
      
      // Clear existing timer
      if (peakHoldTimer.current) {
        clearTimeout(peakHoldTimer.current);
      }
      
      // Set new peak hold timer
      peakHoldTimer.current = setTimeout(() => {
        setPeakHold(0);
      }, 2000); // Hold peak for 2 seconds
    }
    
    return () => {
      if (peakHoldTimer.current) {
        clearTimeout(peakHoldTimer.current);
      }
    };
  }, [level, peak]);

  // Normalize level to percentage
  const percentage = Math.min((level / max) * 100, 100);
  const peakPercentage = Math.min((peakHold / max) * 100, 100);

  // Get color based on level
  const getColor = (value: number): string => {
    if (value > 80) return 'bg-red-500';
    if (value > 60) return 'bg-yellow-500';
    if (value > 30) return 'bg-green-500';
    return 'bg-blue-500';
  };

  // Size classes
  const sizeClasses = {
    sm: orientation === 'horizontal' ? 'h-1' : 'w-1 h-16',
    md: orientation === 'horizontal' ? 'h-2' : 'w-2 h-24',
    lg: orientation === 'horizontal' ? 'h-3' : 'w-3 h-32'
  };

  const labelClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (orientation === 'vertical') {
    return (
      <div className={clsx('flex flex-col items-center gap-2', className)}>
        <span className={clsx('font-medium text-center', labelClasses[size])}>
          {label}
        </span>
        <div className="relative flex flex-col-reverse">
          <div className={clsx(
            'relative rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
            sizeClasses[size]
          )}>
            {/* Level indicator */}
            <div
              className={clsx(
                'absolute bottom-0 left-0 right-0 transition-all duration-100 rounded-full',
                getColor(percentage)
              )}
              style={{ height: `${percentage}%` }}
            />
            
            {/* Peak hold indicator */}
            {showPeak && peakHold > 0 && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-white opacity-80"
                style={{ bottom: `${peakPercentage}%` }}
              />
            )}
          </div>
        </div>
        <span className={clsx('text-center', labelClasses[size])}>
          {level.toFixed(0)}
        </span>
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className={clsx('space-y-1', className)}>
      <div className="flex justify-between items-center">
        <span className={clsx('font-medium', labelClasses[size])}>
          {label}
        </span>
        <span className={clsx('text-gray-600', labelClasses[size])}>
          {level.toFixed(0)}
        </span>
      </div>
      <div className="relative">
        <div className={clsx(
          'relative rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden',
          sizeClasses[size]
        )}>
          {/* Level indicator */}
          <div
            className={clsx(
              'absolute left-0 top-0 bottom-0 transition-all duration-100 rounded-full',
              getColor(percentage)
            )}
            style={{ width: `${percentage}%` }}
          />
          
          {/* Peak hold indicator */}
          {showPeak && peakHold > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white opacity-80"
              style={{ left: `${peakPercentage}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

AudioLevelBar.displayName = 'AudioLevelBar';

// Circular audio level indicator
const CircularAudioLevel = memo(({
  level,
  label,
  max = 100,
  size = 'md',
  className
}: {
  level: number;
  label: string;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const percentage = Math.min((level / max) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  };

  const getColor = (value: number): string => {
    if (value > 80) return '#ef4444'; // red
    if (value > 60) return '#eab308'; // yellow
    if (value > 30) return '#22c55e'; // green
    return '#3b82f6'; // blue
  };

  return (
    <div className={clsx('flex flex-col items-center gap-2', className)}>
      <div className={clsx('relative', sizeClasses[size])}>
        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Level circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={getColor(percentage)}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {level.toFixed(0)}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium text-center">
        {label}
      </span>
    </div>
  );
});

CircularAudioLevel.displayName = 'CircularAudioLevel';

// Audio level history/waveform
const AudioWaveform = memo(({
  levels,
  max = 100,
  maxPoints = 50,
  className
}: {
  levels: number[];
  max?: number;
  maxPoints?: number;
  className?: string;
}) => {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    if (levels.length > 0) {
      const latestLevel = levels[levels.length - 1];
      setHistory(prev => {
        const newHistory = [...prev, latestLevel];
        return newHistory.slice(-maxPoints);
      });
    }
  }, [levels, maxPoints]);

  if (history.length === 0) return null;

  const width = 200;
  const height = 40;
  const stepWidth = width / maxPoints;

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <svg width={width} height={height} className="border rounded">
        {history.map((level, index) => {
          const normalizedLevel = (level / max) * height;
          const x = index * stepWidth;
          const barHeight = Math.max(normalizedLevel, 1);
          
          return (
            <rect
              key={index}
              x={x}
              y={height - barHeight}
              width={stepWidth - 1}
              height={barHeight}
              fill={
                level > 80 ? '#ef4444' :
                level > 60 ? '#eab308' :
                level > 30 ? '#22c55e' : '#3b82f6'
              }
              opacity={0.7 + (index / history.length) * 0.3}
            />
          );
        })}
      </svg>
    </div>
  );
});

AudioWaveform.displayName = 'AudioWaveform';

// Main JarvisAudioLevels component
export const JarvisAudioLevels = memo<JarvisAudioLevelsProps>(({
  levels,
  showLabels = true,
  orientation = 'horizontal',
  size = 'md',
  className,
  onRefreshComplete
}) => {
  const [levelHistory, setLevelHistory] = useState<AudioLevels[]>([]);

  // Update history
  useEffect(() => {
    if (levels) {
      setLevelHistory(prev => {
        const newHistory = [...prev, levels];
        return newHistory.slice(-20); // Keep last 20 readings
      });
    }
  }, [levels]);

  // Handle case where levels might not be provided
  if (!levels) {
    return (
      <Card className={clsx('p-4', className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Audio Levels
            </h3>
            <Badge variant="outline" className="text-xs">
              Disconnected
            </Badge>
          </div>
          <div className="text-center text-sm text-gray-500 py-4">
            No audio data available
          </div>
          {onRefreshComplete && (
            <button
              onClick={() => onRefreshComplete({ success: false, error: 'No levels data' })}
              className="w-full text-sm text-blue-500 hover:text-blue-600"
            >
              Refresh Audio Devices
            </button>
          )}
        </div>
      </Card>
    );
  }

  const audioInputs = [
    {
      key: 'primary',
      label: 'Primary',
      value: levels.primary,
      description: 'Main audio input level'
    },
    {
      key: 'system',
      label: 'System',
      value: levels.system,
      description: 'System audio level'
    }
  ];

  // Add optional microphone and speaker if available
  if (levels.microphone !== undefined) {
    audioInputs.push({
      key: 'microphone',
      label: 'Microphone',
      value: levels.microphone,
      description: 'Microphone input level'
    });
  }

  if (levels.speaker !== undefined) {
    audioInputs.push({
      key: 'speaker',
      label: 'Speaker',
      value: levels.speaker,
      description: 'Speaker output level'
    });
  }

  return (
    <Card className={clsx('p-4', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Audio Levels
          </h3>
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </div>

        {/* Audio level bars */}
        <div className={clsx(
          'gap-4',
          orientation === 'horizontal' ? 'space-y-3' : 'flex justify-center'
        )}>
          {audioInputs.map((input) => (
            <AudioLevelBar
              key={input.key}
              level={input.value}
              label={showLabels ? input.label : ''}
              orientation={orientation}
              size={size}
              className="flex-1"
            />
          ))}
        </div>

        {/* Timestamp */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Updated: {new Date(levels.timestamp).toLocaleTimeString()}</span>
          <span>{levelHistory.length} readings</span>
        </div>
      </div>
    </Card>
  );
});

JarvisAudioLevels.displayName = 'JarvisAudioLevels';

// Compact audio levels for status bars
export const JarvisAudioLevelsCompact = memo(({
  levels,
  className
}: {
  levels: AudioLevels;
  className?: string;
}) => {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">🎤</span>
        <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full transition-all duration-100',
              levels.primary > 80 ? 'bg-red-500' :
              levels.primary > 60 ? 'bg-yellow-500' :
              levels.primary > 30 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${Math.min(levels.primary, 100)}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">🔊</span>
        <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full transition-all duration-100',
              levels.system > 80 ? 'bg-red-500' :
              levels.system > 60 ? 'bg-yellow-500' :
              levels.system > 30 ? 'bg-green-500' : 'bg-blue-500'
            )}
            style={{ width: `${Math.min(levels.system, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
});

JarvisAudioLevelsCompact.displayName = 'JarvisAudioLevelsCompact';

// Circular visualization for dashboard
export const JarvisAudioLevelsCircular = memo(({
  levels,
  className
}: {
  levels: AudioLevels;
  className?: string;
}) => {
  return (
    <div className={clsx('flex gap-4', className)}>
      <CircularAudioLevel
        level={levels.primary}
        label="Primary"
        size="md"
      />
      <CircularAudioLevel
        level={levels.system}
        label="System"
        size="md"
      />
    </div>
  );
});

JarvisAudioLevelsCircular.displayName = 'JarvisAudioLevelsCircular';

export default JarvisAudioLevels;