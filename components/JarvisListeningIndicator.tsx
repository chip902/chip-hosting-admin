"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeOff, Users, Brain, Zap } from "lucide-react";
import { useJarvis } from "@/app/hooks/useJarvis";
import clsx from "clsx";

type JarvisListeningMode = "wake_word" | "passive" | "meeting" | "hybrid";

interface ListeningMode {
  id: JarvisListeningMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

interface JarvisListeningIndicatorProps {
  variant?: "compact" | "detailed";
  className?: string;
}

export function JarvisListeningIndicator({ variant = "compact", className }: JarvisListeningIndicatorProps) {
  const { isConnected, status, lastVoiceActivation } = useJarvis();

  // Mock data - in real implementation, this would come from the audio manager
  const currentMode = (status?.health?.jarvis_status?.listening_mode ?? "wake_word") as JarvisListeningMode;
  const microphoneActive = true;
  const systemAudioActive = true;
  const isPassiveMode = currentMode === "passive";
  const isActivelyLogging = isPassiveMode || currentMode === "meeting";
  const lastNoteTimestamp = Date.now() - 30000; // 30 seconds ago

  const listeningModes: ListeningMode[] = [
    {
      id: "wake_word",
      name: "Wake Word",
      description: "Traditional 'Hey JARVIS' activation",
      icon: <Mic className="h-3 w-3" />,
      color: "bg-blue-500",
      features: ["Wake word detection", "Voice responses", "Command processing"]
    },
    {
      id: "passive",
      name: "Passive",
      description: "Continuous note-taking without responses",
      icon: <Brain className="h-3 w-3" />,
      color: "bg-purple-500",
      features: ["Continuous transcription", "Silent logging", "No interruptions"]
    },
    {
      id: "meeting",
      name: "Meeting",
      description: "Dual audio capture for meetings",
      icon: <Users className="h-3 w-3" />,
      color: "bg-green-500",
      features: ["Dual audio capture", "Meeting transcription", "Speaker identification"]
    },
    {
      id: "hybrid",
      name: "Hybrid",
      description: "Combination of multiple modes",
      icon: <Zap className="h-3 w-3" />,
      color: "bg-orange-500",
      features: ["Multi-mode operation", "Context switching", "Adaptive behavior"]
    }
  ];

  const getCurrentModeInfo = () => {
    return listeningModes.find(mode => mode.id === currentMode) || listeningModes[0];
  };

  const modeInfo = getCurrentModeInfo();

  if (variant === "compact") {
    return (
      <div className={clsx("flex items-center gap-2", className)}>
        {/* Mode Indicator */}
        <Badge 
          variant="outline" 
          className={clsx(
            "text-xs flex items-center gap-1",
            isConnected ? "border-current" : "opacity-50"
          )}
        >
          <div className={clsx("w-2 h-2 rounded-full", modeInfo.color, isConnected && "animate-pulse")} />
          {modeInfo.icon}
          {modeInfo.name}
        </Badge>

        {/* Audio Status */}
        <div className="flex items-center gap-1">
          <div className={clsx(
            "flex items-center gap-1",
            microphoneActive && isConnected ? "text-green-600" : "text-gray-400"
          )}>
            {microphoneActive ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
          </div>
          <div className={clsx(
            "flex items-center gap-1",
            systemAudioActive && isConnected ? "text-blue-600" : "text-gray-400"
          )}>
            {systemAudioActive ? <Volume2 className="h-3 w-3" /> : <VolumeOff className="h-3 w-3" />}
          </div>
        </div>

        {/* Note-Taking Indicator */}
        {isActivelyLogging && (
          <Badge variant="outline" className="text-xs animate-pulse bg-purple-50 text-purple-700 border-purple-200">
            📝 Taking Notes
          </Badge>
        )}

        {/* Wake Word Detection */}
        {lastVoiceActivation?.wake_word_detected && (
          <Badge variant="outline" className="text-xs animate-pulse bg-green-50 text-green-700">
            🎤 Activated
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={clsx("p-4", className)}>
      <div className="space-y-4">
        {/* Current Mode */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Listening Mode</h4>
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? "Active" : "Offline"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className={clsx("p-2 rounded", modeInfo.color, "text-white")}>
              {modeInfo.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{modeInfo.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{modeInfo.description}</div>
            </div>
            <div className={clsx("w-3 h-3 rounded-full", modeInfo.color, isConnected && "animate-pulse")} />
          </div>
        </div>

        {/* Audio Status */}
        <div>
          <h5 className="font-medium text-sm mb-2">Audio Status</h5>
          <div className="grid grid-cols-2 gap-2">
            <div className={clsx(
              "flex items-center gap-2 p-2 rounded-lg border",
              microphoneActive && isConnected 
                ? "bg-green-50 border-green-200 text-green-700" 
                : "bg-gray-50 border-gray-200 text-gray-500"
            )}>
              {microphoneActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <span className="text-xs">Microphone</span>
            </div>
            <div className={clsx(
              "flex items-center gap-2 p-2 rounded-lg border",
              systemAudioActive && isConnected 
                ? "bg-blue-50 border-blue-200 text-blue-700" 
                : "bg-gray-50 border-gray-200 text-gray-500"
            )}>
              {systemAudioActive ? <Volume2 className="h-4 w-4" /> : <VolumeOff className="h-4 w-4" />}
              <span className="text-xs">System Audio</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div>
          <h5 className="font-medium text-sm mb-2">Active Features</h5>
          <div className="space-y-1">
            {modeInfo.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className={clsx("w-1.5 h-1.5 rounded-full", modeInfo.color)} />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Note-Taking Status */}
        <div>
          <h5 className="font-medium text-sm mb-2">Note-Taking Status</h5>
          <div className={clsx(
            "p-3 rounded-lg border",
            isActivelyLogging 
              ? "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800" 
              : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <div className={clsx(
                "w-2 h-2 rounded-full",
                isActivelyLogging ? "bg-purple-500 animate-pulse" : "bg-gray-400"
              )} />
              <span className={clsx(
                "text-sm font-medium",
                isActivelyLogging ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"
              )}>
                {isActivelyLogging ? "Actively Logging" : "Standby"}
              </span>
            </div>
            
            <div className="text-xs space-y-1">
              {isActivelyLogging ? (
                <>
                  <div className="text-purple-600 dark:text-purple-400">
                    📝 Capturing conversation to Obsidian
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">
                    🏷️ Auto-classifying content type
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">
                    💾 Saving to appropriate folder
                  </div>
                </>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  Ready to log conversations when activated
                </div>
              )}
              
              {lastNoteTimestamp && (
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-1 mt-2 border-t border-gray-200 dark:border-gray-600">
                  Last Note: {new Date(lastNoteTimestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs" disabled={!isConnected}>
              🎤 Test Mic
            </Button>
            <Button variant="outline" size="sm" className="text-xs" disabled={!isConnected}>
              🔄 Refresh Audio
            </Button>
          </div>
        </div>

        {/* Status Details */}
        {isConnected && (
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
            <div>Wake Words: "jarvis", "hey jarvis"</div>
            <div>Sample Rate: 16kHz</div>
            {lastVoiceActivation && (
              <div>Last Activation: {new Date(lastVoiceActivation.timestamp || Date.now()).toLocaleTimeString()}</div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}