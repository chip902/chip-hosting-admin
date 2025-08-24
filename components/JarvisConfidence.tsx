'use client';

import React, { memo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  JarvisConfidenceProps, 
  ConfidenceBreakdown 
} from '@/types/jarvis';
import { 
  getConfidenceColor, 
  getConfidenceBadgeColor 
} from '@/app/hooks/useJarvis';
import clsx from 'clsx';

// Confidence level indicators
const getConfidenceLevel = (confidence: number): {
  level: string;
  description: string;
  color: string;
} => {
  if (confidence >= 95) {
    return {
      level: 'Excellent',
      description: 'Very high confidence, highly reliable response',
      color: 'text-green-700'
    };
  } else if (confidence >= 90) {
    return {
      level: 'Very High',
      description: 'High confidence, reliable response',
      color: 'text-green-600'
    };
  } else if (confidence >= 80) {
    return {
      level: 'High',
      description: 'Good confidence, generally reliable',
      color: 'text-blue-600'
    };
  } else if (confidence >= 70) {
    return {
      level: 'Moderate',
      description: 'Moderate confidence, use with caution',
      color: 'text-yellow-600'
    };
  } else if (confidence >= 60) {
    return {
      level: 'Low',
      description: 'Low confidence, verify information',
      color: 'text-orange-600'
    };
  } else {
    return {
      level: 'Very Low',
      description: 'Very low confidence, high likelihood of errors',
      color: 'text-red-600'
    };
  }
};

// Progress bar with custom colors based on confidence
const ConfidenceProgressBar = memo(({ 
  value, 
  className 
}: { 
  value: number; 
  className?: string;
}) => {
  const getProgressColor = (confidence: number): string => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 80) return 'bg-blue-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={clsx('relative w-full', className)}>
      <Progress 
        value={value} 
        className="h-2"
      />
      <div 
        className={clsx(
          'absolute top-0 left-0 h-2 rounded-full transition-all duration-300',
          getProgressColor(value)
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
});

ConfidenceProgressBar.displayName = 'ConfidenceProgressBar';

// Detailed breakdown component
const ConfidenceBreakdownDetails = memo(({ 
  breakdown,
  className 
}: { 
  breakdown: ConfidenceBreakdown;
  className?: string;
}) => {
  const breakdownItems = [
    {
      label: 'Search Quality',
      value: breakdown.search_quality,
      description: 'Quality of retrieved information'
    },
    {
      label: 'Tool Success',
      value: breakdown.tool_success,
      description: 'Success rate of external tools'
    },
    {
      label: 'Response Quality',
      value: breakdown.response_quality,
      description: 'Quality of generated response'
    },
    {
      label: 'Model Behavior',
      value: breakdown.model_behavior,
      description: 'Consistency with expected behavior'
    }
  ];

  return (
    <div className={clsx('space-y-3', className)}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Confidence Breakdown
      </h4>
      <div className="space-y-2">
        {breakdownItems.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {item.label}
              </span>
              <span className={clsx(
                'text-xs font-medium',
                getConfidenceColor(item.value)
              )}>
                {item.value.toFixed(1)}%
              </span>
            </div>
            <ConfidenceProgressBar value={item.value} />
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

ConfidenceBreakdownDetails.displayName = 'ConfidenceBreakdownDetails';

// Main confidence component
export const JarvisConfidence = memo<JarvisConfidenceProps>(({
  confidence,
  breakdown,
  showBreakdown = false,
  size = 'md',
  variant = 'badge',
  className
}) => {
  const [showDetails, setShowDetails] = useState(showBreakdown);
  const confidenceInfo = getConfidenceLevel(confidence);

  // Size variations
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Inline variant (simple text with color)
  if (variant === 'inline') {
    return (
      <span className={clsx(
        'font-medium',
        sizeClasses[size],
        getConfidenceColor(confidence),
        className
      )}>
        {confidence.toFixed(1)}% confidence
      </span>
    );
  }

  // Badge variant (compact badge)
  if (variant === 'badge') {
    return (
      <Badge
        className={clsx(
          sizeClasses[size],
          getConfidenceBadgeColor(confidence),
          breakdown ? 'cursor-pointer hover:opacity-80' : '',
          className
        )}
        onClick={breakdown ? () => setShowDetails(!showDetails) : undefined}
      >
        <div className="flex items-center gap-1">
          <span>{confidence.toFixed(1)}%</span>
          <span className="hidden sm:inline">confidence</span>
          {breakdown && (
            <span className="text-xs">
              {showDetails ? '▼' : '▶'}
            </span>
          )}
        </div>
      </Badge>
    );
  }

  // Detailed variant (full card with breakdown)
  return (
    <Card className={clsx('p-4', className)}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className={clsx(
              'font-semibold',
              sizeClasses[size],
              confidenceInfo.color
            )}>
              {confidenceInfo.level} Confidence
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {confidenceInfo.description}
            </p>
          </div>
          <div className="text-right">
            <div className={clsx(
              'font-bold',
              size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg',
              getConfidenceColor(confidence)
            )}>
              {confidence.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Confidence Level</span>
            <span>{confidence.toFixed(1)}%</span>
          </div>
          <ConfidenceProgressBar value={confidence} />
        </div>

        {/* Breakdown Toggle */}
        {breakdown && (
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-xs"
            >
              {showDetails ? 'Hide' : 'Show'} Breakdown
              <span className="ml-1">
                {showDetails ? '▲' : '▼'}
              </span>
            </Button>
          </div>
        )}

        {/* Detailed Breakdown */}
        {showDetails && breakdown && (
          <div className="border-t pt-3">
            <ConfidenceBreakdownDetails breakdown={breakdown} />
          </div>
        )}
      </div>
    </Card>
  );
});

JarvisConfidence.displayName = 'JarvisConfidence';

// Compact confidence indicator for lists
export const JarvisConfidenceCompact = memo(({
  confidence,
  showLabel = true,
  className
}: {
  confidence: number;
  showLabel?: boolean;
  className?: string;
}) => {
  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <div 
        className={clsx(
          'w-2 h-2 rounded-full',
          confidence >= 90 ? 'bg-green-500' :
          confidence >= 80 ? 'bg-blue-500' :
          confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
        )}
      />
      {showLabel && (
        <span className={clsx(
          'text-xs',
          getConfidenceColor(confidence)
        )}>
          {confidence.toFixed(0)}%
        </span>
      )}
    </div>
  );
});

JarvisConfidenceCompact.displayName = 'JarvisConfidenceCompact';

// Confidence trend component (for multiple confidence scores over time)
export const JarvisConfidenceTrend = memo(({
  scores,
  className
}: {
  scores: Array<{ value: number; timestamp: number; label?: string }>;
  className?: string;
}) => {
  if (scores.length === 0) return null;

  const latest = scores[scores.length - 1];
  const trend = scores.length > 1 ? 
    latest.value - scores[scores.length - 2].value : 0;

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <JarvisConfidenceCompact confidence={latest.value} />
      {Math.abs(trend) > 0.1 && (
        <span className={clsx(
          'text-xs flex items-center',
          trend > 0 ? 'text-green-600' : 'text-red-600'
        )}>
          {trend > 0 ? '↗' : '↘'}
          {Math.abs(trend).toFixed(1)}%
        </span>
      )}
    </div>
  );
});

JarvisConfidenceTrend.displayName = 'JarvisConfidenceTrend';

export default JarvisConfidence;