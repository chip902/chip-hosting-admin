"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mic, 
  Brain, 
  FileText, 
  Settings, 
  MessageCircle, 
  Search, 
  Code, 
  Database,
  Globe,
  Volume2,
  HeadphonesIcon,
  Zap,
  Clock,
  HelpCircle
} from "lucide-react";
import { useJarvis } from "@/app/hooks/useJarvis";
import { JarvisListeningIndicator } from "@/components/JarvisListeningIndicator";

interface CapabilityItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  examples: string[];
  status: "available" | "limited" | "offline";
  prompt?: string;
}

interface JarvisCapabilityDashboardProps {
  onPromptSelect?: (prompt: string) => void;
  onClose?: () => void;
}

export function JarvisCapabilityDashboard({ onPromptSelect, onClose }: JarvisCapabilityDashboardProps) {
  const { isConnected, sendMessage, capabilities } = useJarvis();
  const [activeTab, setActiveTab] = useState("voice");

  const handlePromptClick = async (prompt: string) => {
    if (onPromptSelect) {
      onPromptSelect(prompt);
    } else if (isConnected) {
      await sendMessage(prompt);
    }
    if (onClose) {
      onClose();
    }
  };

  const voiceCapabilities: CapabilityItem[] = [
    {
      icon: <Mic className="h-4 w-4" />,
      title: "Wake Word Activation",
      description: "Say 'JARVIS' or 'Hey JARVIS' to activate voice mode",
      examples: ["JARVIS, what's the weather?", "Hey JARVIS, help me with this code"],
      status: isConnected ? "available" : "offline",
      prompt: "show capabilities"
    },
    {
      icon: <HeadphonesIcon className="h-4 w-4" />,
      title: "Passive Listening",
      description: "Always-on note-taking without interrupting your workflow",
      examples: ["Just think out loud", "JARVIS captures everything"],
      status: isConnected ? "available" : "offline",
      prompt: "Tell me about passive listening mode"
    },
    {
      icon: <Volume2 className="h-4 w-4" />,
      title: "Meeting Mode",
      description: "Transcribe meetings with dual audio capture",
      examples: ["Automatic meeting transcription", "System + microphone audio"],
      status: isConnected ? "available" : "offline",
      prompt: "How do I use meeting mode?"
    },
    {
      icon: <Settings className="h-4 w-4" />,
      title: "Audio Management",
      description: "Smart device detection and configuration",
      examples: ["Auto-detect devices", "Dock/undock handling"],
      status: isConnected ? "available" : "offline",
      prompt: "refresh audio devices"
    }
  ];

  const intelligenceCapabilities: CapabilityItem[] = [
    {
      icon: <Search className="h-4 w-4" />,
      title: "Enhanced Search",
      description: "Multi-source search with confidence scoring",
      examples: ["Search documents", "Web research", "RAG queries"],
      status: isConnected ? "available" : "offline",
      prompt: "Search for information about AI and machine learning"
    },
    {
      icon: <Globe className="h-4 w-4" />,
      title: "Web Research",
      description: "Real-time web search for current information",
      examples: ["Latest news", "Current events", "Real-time data"],
      status: capabilities?.web_search ? "available" : "limited",
      prompt: "Search the web for today's technology news"
    },
    {
      icon: <Code className="h-4 w-4" />,
      title: "Code Execution",
      description: "Run Python code and perform data analysis",
      examples: ["Data calculations", "Code debugging", "Visualizations"],
      status: capabilities?.code_execution ? "available" : "limited",
      prompt: "Execute this Python code: print('Hello from JARVIS!')"
    },
    {
      icon: <Database className="h-4 w-4" />,
      title: "SQL Queries",
      description: "Query databases for specific information",
      examples: ["Database searches", "Data analysis", "Report generation"],
      status: capabilities?.sql_query ? "available" : "limited",
      prompt: "What data sources are available for SQL queries?"
    }
  ];

  const memoryCapabilities: CapabilityItem[] = [
    {
      icon: <Brain className="h-4 w-4" />,
      title: "Smart Memory",
      description: "Remember conversations and past interactions",
      examples: ["Previous conversations", "Personal preferences", "Context awareness"],
      status: isConnected ? "available" : "offline",
      prompt: "What did we talk about in our previous conversations?"
    },
    {
      icon: <FileText className="h-4 w-4" />,
      title: "Obsidian Integration",
      description: "Save conversations with smart formatting",
      examples: ["Auto-organized notes", "Callout formatting", "File categorization"],
      status: isConnected ? "available" : "offline",
      prompt: "How do you organize and save our conversations?"
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Content Classification",
      description: "Automatically categorize different types of input",
      examples: ["Questions → Callouts", "Thinking → Notes", "Commands → Actions"],
      status: isConnected ? "available" : "offline",
      prompt: "Explain how you classify and format different types of content"
    },
    {
      icon: <Clock className="h-4 w-4" />,
      title: "Long-term Memory",
      description: "Remember important information across sessions",
      examples: ["Personal details", "Project history", "Preferences"],
      status: capabilities?.mem0 ? "available" : "limited",
      prompt: "Tell me about your long-term memory capabilities"
    }
  ];

  const getStatusColor = (status: CapabilityItem["status"]) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "limited": return "bg-yellow-500";
      case "offline": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: CapabilityItem["status"]) => {
    switch (status) {
      case "available": return "Available";
      case "limited": return "Limited";
      case "offline": return "Offline";
      default: return "Unknown";
    }
  };

  const CapabilityCard = ({ capability }: { capability: CapabilityItem }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-blue-600">
          {capability.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{capability.title}</h4>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(capability.status)}`} />
              <Badge variant={capability.status === "available" ? "default" : "secondary"} className="text-xs h-4">
                {getStatusText(capability.status)}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {capability.description}
          </p>
          <div className="space-y-1">
            {capability.examples.map((example, idx) => (
              <div key={idx} className="text-xs text-gray-500 dark:text-gray-500">
                • {example}
              </div>
            ))}
          </div>
          {capability.prompt && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 text-xs h-6"
              onClick={() => handlePromptClick(capability.prompt!)}
              disabled={!isConnected}
            >
              Try It
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-sm">JARVIS Capabilities</h3>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
          {isConnected ? "Online" : "Offline"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="voice" className="text-xs">
            <Mic className="h-3 w-3 mr-1" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="text-xs">
            <Brain className="h-3 w-3 mr-1" />
            AI
          </TabsTrigger>
          <TabsTrigger value="memory" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="status" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="space-y-3">
          {voiceCapabilities.map((capability, idx) => (
            <CapabilityCard key={idx} capability={capability} />
          ))}
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-3">
          {intelligenceCapabilities.map((capability, idx) => (
            <CapabilityCard key={idx} capability={capability} />
          ))}
        </TabsContent>

        <TabsContent value="memory" className="space-y-3">
          {memoryCapabilities.map((capability, idx) => (
            <CapabilityCard key={idx} capability={capability} />
          ))}
        </TabsContent>

        <TabsContent value="status" className="space-y-3">
          <JarvisListeningIndicator variant="detailed" />
          
          <Card className="p-3">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Zap className="h-3 w-3 text-blue-600" />
              System Health
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Connection Status:</span>
                <Badge variant={isConnected ? "default" : "secondary"} className="text-xs h-4">
                  {isConnected ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>RAG Search:</span>
                <Badge variant={capabilities?.rag ? "default" : "secondary"} className="text-xs h-4">
                  {capabilities?.rag ? "Available" : "Limited"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Web Search:</span>
                <Badge variant={capabilities?.web_search ? "default" : "secondary"} className="text-xs h-4">
                  {capabilities?.web_search ? "Available" : "Limited"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Code Execution:</span>
                <Badge variant={capabilities?.code_execution ? "default" : "secondary"} className="text-xs h-4">
                  {capabilities?.code_execution ? "Available" : "Limited"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Memory System:</span>
                <Badge variant={capabilities?.mem0 ? "default" : "secondary"} className="text-xs h-4">
                  {capabilities?.mem0 ? "Enhanced" : "Basic"}
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Clock className="h-3 w-3 text-green-600" />
              Quick Diagnostics
            </h4>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-6 justify-start"
                onClick={() => handlePromptClick("show audio status")}
                disabled={!isConnected}
              >
                🔊 Check Audio Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-6 justify-start"
                onClick={() => handlePromptClick("refresh audio devices")}
                disabled={!isConnected}
              >
                🔄 Refresh Audio Devices
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-6 justify-start"
                onClick={() => handlePromptClick("test microphone levels")}
                disabled={!isConnected}
              >
                🎤 Test Microphone
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="h-3 w-3 text-blue-600" />
          <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Quick Start</span>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
          Try these commands to get started:
        </p>
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-6 justify-start"
            onClick={() => handlePromptClick("show capabilities")}
            disabled={!isConnected}
          >
            💡 "What can you do?"
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-6 justify-start"
            onClick={() => handlePromptClick("show audio status")}
            disabled={!isConnected}
          >
            🔊 "Show audio status"
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-6 justify-start"
            onClick={() => handlePromptClick("Search for information about artificial intelligence")}
            disabled={!isConnected}
          >
            🔍 "Search for AI info"
          </Button>
        </div>
      </div>
    </div>
  );
}