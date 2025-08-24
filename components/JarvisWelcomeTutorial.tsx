"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Mic, 
  Brain, 
  FileText, 
  MessageCircle,
  Zap,
  Volume2,
  Users,
  Search,
  Code,
  FolderOpen,
  Wrench,
  PenTool,
  Bot
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  actionButton?: {
    text: string;
    action: () => void;
  };
}

interface JarvisWelcomeTutorialProps {
  onComplete?: () => void;
  onSkip?: () => void;
  onTryFeature?: (prompt: string) => void;
}

export function JarvisWelcomeTutorial({ onComplete, onSkip, onTryFeature }: JarvisWelcomeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps: TutorialStep[] = [
    {
      id: "welcome",
      title: "Welcome to JARVIS",
      description: "Your AI assistant with advanced capabilities",
      icon: <MessageCircle className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl mb-4">
              <Bot className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Meet JARVIS</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your always-on AI assistant with voice activation, smart memory, and advanced search capabilities.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="font-medium text-sm text-blue-800 dark:text-blue-200"><Mic className="h-3 w-3 inline mr-1" />Voice Control</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Always listening</div>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="font-medium text-sm text-purple-800 dark:text-purple-200"><Brain className="h-3 w-3 inline mr-1" />Smart Memory</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Remembers everything</div>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="font-medium text-sm text-green-800 dark:text-green-200"><Search className="h-3 w-3 inline mr-1" />Enhanced Search</div>
              <div className="text-xs text-green-600 dark:text-green-400">Multi-source research</div>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="font-medium text-sm text-orange-800 dark:text-orange-200"><PenTool className="h-3 w-3 inline mr-1" />Auto Notes</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Passive logging</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "voice",
      title: "Voice Activation",
      description: "Wake words and listening modes",
      icon: <Mic className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Mic className="mx-auto h-12 w-12 text-blue-600 mb-3" />
            <h3 className="font-semibold text-lg">Voice Commands</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              JARVIS is always listening for wake words
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">Wake Words</Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div>• "JARVIS" - Quick activation</div>
                <div>• "Hey JARVIS" - Formal activation</div>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Volume2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Dual Audio Capture</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Microphone + system audio for complete context
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Meeting Mode</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Automatic transcription of meetings and calls
              </div>
            </div>
          </div>
        </div>
      ),
      actionButton: {
        text: "Try Voice Command",
        action: () => onTryFeature?.("JARVIS, what can you help me with today?")
      }
    },
    {
      id: "intelligence",
      title: "AI Capabilities",
      description: "Search, analysis, and code execution",
      icon: <Brain className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <Brain className="mx-auto h-12 w-12 text-purple-600 mb-3" />
            <h3 className="font-semibold text-lg">Intelligent Features</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Powered by advanced AI with multiple capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="p-3 border rounded-lg flex items-start gap-3">
              <Search className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Enhanced Search</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Multi-source search with confidence scoring
                </div>
                <Badge variant="outline" className="text-xs">RAG + Web + MCP</Badge>
              </div>
            </div>

            <div className="p-3 border rounded-lg flex items-start gap-3">
              <Code className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Code Execution</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Run Python code and analyze data
                </div>
                <Badge variant="outline" className="text-xs">Sandboxed</Badge>
              </div>
            </div>

            <div className="p-3 border rounded-lg flex items-start gap-3">
              <Zap className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Confidence Scoring</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Automatic quality assessment and enhancement
                </div>
                <Badge variant="outline" className="text-xs">0-100%</Badge>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              🎯 Smart Enhancement
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              When confidence is low (&lt;80%), JARVIS automatically searches external sources for better answers
            </div>
          </div>
        </div>
      ),
      actionButton: {
        text: "Try AI Search",
        action: () => onTryFeature?.("Search for information about artificial intelligence")
      }
    },
    {
      id: "memory",
      title: "Smart Memory",
      description: "Conversation storage and retrieval",
      icon: <FileText className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <FileText className="mx-auto h-12 w-12 text-green-600 mb-3" />
            <h3 className="font-semibold text-lg">Memory Systems</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              JARVIS remembers and organizes everything
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Obsidian Integration</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div>• Questions → Prominent callout boxes</div>
                <div>• Thinking → Organized paragraphs</div>
                <div>• Commands → Action tip callouts</div>
                <div>• Meetings → Structured transcripts</div>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Long-term Memory</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Sophisticated vector-based memory with context awareness
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Passive Logging</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Captures your thinking out loud without interrupting
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
              <FolderOpen className="h-3 w-3 inline mr-1" />Auto-Organization
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Content is automatically classified and saved to appropriate folders in your Obsidian vault
            </div>
          </div>
        </div>
      ),
      actionButton: {
        text: "Ask About Memory",
        action: () => onTryFeature?.("What did we talk about in our previous conversations?")
      }
    },
    {
      id: "getting-started",
      title: "Ready to Start!",
      description: "Quick tips and next steps",
      icon: <Zap className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl mb-4">
              🚀
            </div>
            <h3 className="font-semibold text-lg">You're All Set!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Here are some quick tips to get you started
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-1">
                💡 First Steps
              </div>
              <div className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
                <div>• Try saying "JARVIS, what can you do?"</div>
                <div>• Ask "Show me the system status"</div>
                <div>• Test with "Search for today's news"</div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <div className="font-medium text-sm text-purple-800 dark:text-purple-200 mb-1">
                🎯 Pro Tips
              </div>
              <div className="space-y-1 text-xs text-purple-600 dark:text-purple-400">
                <div>• Use ⌘K/Ctrl+K to quickly open this chat</div>
                <div>• Click the ? icon for capability dashboard</div>
                <div>• JARVIS can interrupt itself if you speak</div>
              </div>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="font-medium text-sm text-green-800 dark:text-green-200 mb-1">
                <Wrench className="h-3 w-3 inline mr-1" />Need Help?
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                Check the Status tab for system health and diagnostics
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onTryFeature?.("show capabilities")}
            >
              Try "What can you do?"
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onTryFeature?.("show audio status")}
            >
              Check Audio Status
            </Button>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = tutorialSteps[currentStep];

  return (
    <Card className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/20 rounded text-blue-600">
            {currentStepData.icon}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{currentStepData.title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{currentStepData.description}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Progress */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
          <span>{Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {currentStepData.content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-3 w-3" />
          Back
        </Button>

        <div className="flex gap-2">
          {currentStepData.actionButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={currentStepData.actionButton.action}
            >
              {currentStepData.actionButton.text}
            </Button>
          )}
          
          <Button
            size="sm"
            onClick={nextStep}
            className="flex items-center gap-1"
          >
            {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
            {currentStep < tutorialSteps.length - 1 && <ChevronRight className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}