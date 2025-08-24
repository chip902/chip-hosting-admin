"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { useJarvis } from "@/app/hooks/useJarvis";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { JarvisMessageList } from "@/components/JarvisMessage";
import { JarvisConfidence } from "@/components/JarvisConfidence";
import { JarvisAudioLevelsCompact } from "@/components/JarvisAudioLevels";
import JarvisErrorBoundary from "@/components/JarvisErrorBoundary";
import { JarvisChatProps } from "@/types/jarvis";
import { format } from "date-fns";
import clsx from "clsx";
import { Settings, RotateCcw, Trash2, Mic, Hand, Plug, BarChart3, FileText, Clock, Newspaper, AlertTriangle, Globe, Search, Brain, Wrench, Zap, NotebookPen, Square } from "lucide-react";

export function JarvisChat({
	className,
	showStatus = true,
	maxHeight = "600px",
	enableVoice = false,
	enableStreaming = true,
	showConfidence = true,
	showSources = true,
}: JarvisChatProps) {
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const {
		isConnected,
		isConnecting,
		sendMessage,
		sendCustomMessage,
		messages,
		error,
		status,
		capabilities,
		clearMessages,
		refreshStatus,
		isMeetingMode,
		meetingStartTime,
		confidence,
		searchSources,
		mcpEnhanced,
		audioLevels,
		lastVoiceActivation,
		activeStreams,
		connectionState,
	} = useJarvis();

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollElement = scrollAreaRef.current;
			scrollElement.scrollTop = scrollElement.scrollHeight;
		}
	}, [messages]);

	// Focus input when connected
	useEffect(() => {
		if (isConnected && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isConnected]);

	// Listen for meeting mode changes from WebSocket
	useEffect(() => {
		// Check if the last message indicates a mode change
		const lastMessage = messages[messages.length - 1];
		if (lastMessage && lastMessage.type === "assistant") {
			const content = lastMessage.content.toLowerCase();
			// Meeting mode state is already handled by the useJarvis hook's handleListeningModeChange
			// This effect is just for observing changes in the messages
			if (content.includes("started taking meeting notes")) {
				console.log("Meeting mode activated via message content");
			} else if (content.includes("stopped taking notes")) {
				console.log("Meeting mode deactivated via message content");
			}
		}
	}, [messages]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim() || !isConnected || isTyping) return;

		const message = input.trim();
		setInput("");
		setIsTyping(true);

		try {
			await sendMessage(message, {
				source: "text",
				enableStreaming,
			});

			// Focus back on input after sending
			inputRef.current?.focus();
		} catch (err) {
			console.error("Failed to send message:", err);
			// Restore the input on error
			setInput(message);
		} finally {
			setIsTyping(false);
		}
	};

	const handleRetryMessage = (messageId: string) => {
		const message = messages.find((m) => m.id === messageId);
		if (message && message.type === "user") {
			setInput(message.content);
		}
	};

	// Meeting mode handlers
	const handleStartMeetingMode = async () => {
		if (!isConnected) return;
		
		try {
			// Send the WebSocket message - state will be updated when backend confirms
			if (sendCustomMessage) {
				sendCustomMessage("start_meeting_mode", {
					title: `Meeting Notes - ${format(new Date(), "yyyy-MM-dd HH:mm")}`
				});
			} else {
				// Fallback to regular message that triggers the tool
				await sendMessage("start taking notes", { 
					source: "ui_button",
					metadata: {
						command_type: "meeting_mode",
						title: `Meeting Notes - ${format(new Date(), "yyyy-MM-dd HH:mm")}`
					}
				});
			}
			
			// Don't set state optimistically - wait for backend confirmation
			// setIsMeetingMode(true);
			// setMeetingStartTime(Date.now());
		} catch (err) {
			console.error("Failed to start meeting mode:", err);
		}
	};

	const handleStopMeetingMode = async () => {
		if (!isConnected) return;
		
		try {
			// Send the WebSocket message - state will be updated when backend confirms
			if (sendCustomMessage) {
				sendCustomMessage("stop_meeting_mode", {});
			} else {
				// Fallback to regular message
				await sendMessage("stop taking notes", { 
					source: "ui_button",
					metadata: {
						command_type: "meeting_mode"
					}
				});
			}
			
			// Don't set state optimistically - wait for backend confirmation
			// setIsMeetingMode(false);
			// setMeetingStartTime(null);
		} catch (err) {
			console.error("Failed to stop meeting mode:", err);
		}
	};

	// Calculate meeting duration
	const getMeetingDuration = () => {
		if (!meetingStartTime) return "";
		const duration = Math.floor((Date.now() - meetingStartTime) / 1000);
		const minutes = Math.floor(duration / 60);
		const seconds = duration % 60;
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	const getStatusColor = () => {
		if (!isConnected) return "bg-red-500";
		if (isConnecting) return "bg-yellow-500";
		if (status?.health?.status === "degraded") return "bg-orange-500";
		return "bg-green-500";
	};

	const getStatusText = () => {
		if (isConnecting) return "Connecting...";
		if (!isConnected) return "Offline";
		if (status?.health?.status === "healthy") return "Online";
		if (status?.health?.status === "degraded") return "Limited";
		return "Connected";
	};

	const hasActiveStreams = activeStreams.size > 0;
	const isProcessing = isTyping || hasActiveStreams;

	return (
		<JarvisErrorBoundary>
			<Card className={clsx("flex flex-col h-full", className)}>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							<div className={clsx("w-3 h-3 rounded-full", isConnected ? "animate-pulse" : "", getStatusColor())} />
							<h3 className="font-semibold text-lg">JARVIS Assistant</h3>
							{enableStreaming && (
								<Badge variant="outline" className="text-xs">
									Streaming
								</Badge>
							)}
							{isMeetingMode && (
								<Badge variant="destructive" className="text-xs animate-pulse">
									<NotebookPen className="h-3 w-3 mr-1 inline" />
									Taking Notes {getMeetingDuration()}
								</Badge>
							)}
						</div>

						{showStatus && (
							<div className="flex items-center gap-2">
								<Badge variant={isConnected ? "default" : "secondary"}>{getStatusText()}</Badge>

								{/* Confidence indicator */}
								{showConfidence && confidence > 0 && <JarvisConfidence confidence={confidence} variant="inline" size="sm" />}

								{/* MCP enhancement indicator */}
								{mcpEnhanced && (
									<Badge variant="outline" className="text-xs bg-brand-50 text-brand-700">
										<Zap className="h-3 w-3 inline mr-1" />Enhanced
									</Badge>
								)}
							</div>
						)}
					</div>

					<div className="flex items-center gap-2">
						{/* Audio levels */}
						{audioLevels && <JarvisAudioLevelsCompact levels={audioLevels} className="hidden sm:flex" />}

						{/* Voice activation indicator */}
						{enableVoice && lastVoiceActivation?.wake_word_detected && (
							<Badge variant="outline" className="text-xs animate-pulse">
								<Mic className="h-3 w-3 inline mr-1" />Listening
							</Badge>
						)}

						{/* Meeting Mode Toggle */}
						{isConnected && (
							<Button
								variant={isMeetingMode ? "destructive" : "outline"}
								size="sm"
								onClick={isMeetingMode ? handleStopMeetingMode : handleStartMeetingMode}
								title={isMeetingMode ? "Stop taking notes" : "Start taking meeting notes"}
							>
								{isMeetingMode ? (
									<Square className="h-4 w-4" />
								) : (
									<NotebookPen className="h-4 w-4" />
								)}
							</Button>
						)}

						{/* Settings toggle */}
						<Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
							<Settings className="h-4 w-4" />
						</Button>

						{/* Refresh status */}
						<Button variant="ghost" size="sm" onClick={refreshStatus} disabled={isConnecting}>
							{isConnecting ? <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" /> : <RotateCcw className="h-4 w-4" />}
						</Button>

						{/* Clear messages */}
						<Button variant="ghost" size="sm" onClick={clearMessages} disabled={messages.length === 0}>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Settings Panel */}
				{showSettings && (
					<div className="p-4 border-b bg-gray-50 dark:bg-gray-800 space-y-3">
						<h4 className="text-sm font-medium">Settings</h4>
						<div className="grid grid-cols-2 gap-4">
							<div className="flex items-center justify-between">
								<span className="text-sm">Show Confidence</span>
								<Switch
									checked={showConfidence}
									onCheckedChange={() => {
										/* Would update via props */
									}}
									disabled
								/>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Show Sources</span>
								<Switch
									checked={showSources}
									onCheckedChange={() => {
										/* Would update via props */
									}}
									disabled
								/>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Enable Voice</span>
								<Switch
									checked={enableVoice}
									onCheckedChange={() => {
										/* Would update via props */
									}}
									disabled
								/>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Streaming</span>
								<Switch
									checked={enableStreaming}
									onCheckedChange={() => {
										/* Would update via props */
									}}
									disabled
								/>
							</div>
						</div>

						{/* Capabilities display */}
						{capabilities && (
							<div className="mt-3">
								<h5 className="text-xs font-medium text-gray-600 mb-2">Available Capabilities</h5>
								<div className="flex flex-wrap gap-1">
									{Object.entries(capabilities).map(([key, enabled]) => (
										<Badge key={key} variant={enabled ? "default" : "secondary"} className="text-xs">
											{key.replace(/_/g, " ")}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Error Message */}
				{error && (
					<div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
						<div className="flex">
							<div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
							<div className="ml-3">
								<p className="text-sm text-red-700">{error}</p>
								<Button size="sm" variant="outline" className="mt-2" onClick={refreshStatus}>
									Retry Connection
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Processing indicator */}
				{isProcessing && (
					<div className="px-4 py-2 bg-blue-50 border-b">
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
							<span className="text-sm text-blue-700">{hasActiveStreams ? "JARVIS is responding..." : "Processing..."}</span>
						</div>
					</div>
				)}

				{/* Messages */}
				<div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight }} ref={scrollAreaRef}>
					{messages.length === 0 ? (
						<div className="text-center text-gray-500 py-8">
							{isConnected ? (
								<div className="space-y-4">
									<div>
										<p className="text-lg mb-2"><Hand className="h-5 w-5 inline mr-2" />Hello! I&apos;m JARVIS.</p>
										<p className="text-sm">I&apos;m your AI assistant with enhanced search capabilities and confidence scoring.</p>
									</div>

									{showSources && (
										<div className="text-xs text-gray-400">
											<p>I can search through:</p>
											<div className="flex justify-center gap-2 mt-1">
												<Badge variant="outline" className="text-xs">
													<FileText className="h-3 w-3 inline mr-1" />Documents
												</Badge>
												<Badge variant="outline" className="text-xs">
													<Globe className="h-3 w-3 inline mr-1" />Web Pages
												</Badge>
												<Badge variant="outline" className="text-xs">
													<Search className="h-3 w-3 inline mr-1" />Web Search
												</Badge>
											</div>
										</div>
									)}
								</div>
							) : (
								<div>
									<p className="text-lg mb-2"><Plug className="h-5 w-5 inline mr-2" />JARVIS is offline</p>
									<p className="text-sm">Please ensure the JARVIS service is running.</p>
									<Button size="sm" variant="outline" className="mt-3" onClick={refreshStatus}>
										Try to Connect
									</Button>
								</div>
							)}
						</div>
					) : (
						<JarvisMessageList
							messages={messages}
							showMetadata={true}
							showConfidence={showConfidence}
							showSources={showSources}
							onRetry={handleRetryMessage}
						/>
					)}
				</div>

				{/* Source attribution bar */}
				{showSources && searchSources.length > 0 && (
					<div className="px-4 py-2 bg-gray-50 border-t">
						<div className="flex items-center gap-2 text-xs text-gray-600">
							<span>Sources:</span>
							<div className="flex gap-1">
								{searchSources.map((source, index) => (
									<Badge key={`${source}-${index}`} variant="outline" className="text-xs">
										{source === "documents" && <><FileText className="h-3 w-3 inline mr-1" />Documents</>}
										{source === "crawled_pages" && <><Globe className="h-3 w-3 inline mr-1" />Pages</>}
										{source === "web_search" && <><Search className="h-3 w-3 inline mr-1" />Web</>}
										{source === "memory" && <><Brain className="h-3 w-3 inline mr-1" />Memory</>}
										{source === "tools" && <><Wrench className="h-3 w-3 inline mr-1" />Tools</>}
									</Badge>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Input Form */}
				<form onSubmit={handleSubmit} className="p-4 border-t bg-white dark:bg-gray-900">
					<div className="flex gap-2">
						<Input
							ref={inputRef}
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={isConnected ? "Ask JARVIS anything..." : "JARVIS is offline"}
							disabled={!isConnected || isProcessing}
							className="flex-1"
							autoFocus
						/>
						<Button type="submit" disabled={!isConnected || isProcessing || !input.trim()}>
							{isProcessing ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
									Sending...
								</>
							) : (
								"Send"
							)}
						</Button>
					</div>

					{/* Quick Actions */}
					{isConnected && !isProcessing && (
						<div className="flex gap-2 mt-2 overflow-x-auto">
							<Button type="button" variant="brand-primary" size="sm" onClick={() => setInput("What's the current status of the system?")}>
								<BarChart3 className="h-4 w-4 inline mr-1" />System Status
							</Button>
							<Button type="button" variant="brand-secondary" size="sm" onClick={() => setInput("Search for recent documents about project updates")}>
								<FileText className="h-4 w-4 inline mr-1" />Search Docs
							</Button>
							<Button type="button" variant="outline" size="sm" onClick={() => setInput("What time is it?")}>
								<Clock className="h-4 w-4 inline mr-1" />Time
							</Button>
							<Button type="button" variant="outline" size="sm" onClick={() => setInput("Tell me about the latest news")}>
								<Newspaper className="h-4 w-4 inline mr-1" />News
							</Button>
						</div>
					)}
				</form>

				{/* Footer with connection info */}
				<div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t">
					<div className="flex justify-between items-center text-xs text-gray-500">
						<div className="flex items-center gap-2">
							<span>{messages.length} messages</span>
							{activeStreams.size > 0 && <span>• {activeStreams.size} streaming</span>}
						</div>
						<div className="flex items-center gap-2">
							{status?.metadata?.version && <span>v{status.metadata.version}</span>}
							<span>•</span>
							<span>WebSocket</span>
							{connectionState !== undefined && (
								<div className={clsx("w-2 h-2 rounded-full", connectionState === 1 ? "bg-green-500" : "bg-red-500")} />
							)}
						</div>
					</div>
				</div>
			</Card>
		</JarvisErrorBoundary>
	);
}

// Minimal version for embedding in other pages
export function JarvisChatMinimal({ className }: { className?: string }) {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { isConnected, sendMessage, messages } = useJarvis();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim() || !isConnected || isLoading) return;

		const message = input.trim();
		setInput("");
		setIsLoading(true);

		try {
			await sendMessage(message);
		} catch (err) {
			console.error("Failed to send message:", err);
			setInput(message);
		} finally {
			setIsLoading(false);
		}
	};

	const lastUserMessage = messages.filter((m) => m.type === "user").pop();
	const lastAssistantMessage = messages.filter((m) => m.type === "assistant").pop();

	return (
		<div className={clsx("space-y-2", className)}>
			{lastUserMessage && lastAssistantMessage && (
				<div className="p-3 bg-gray-50 rounded-lg">
					<p className="text-sm text-gray-600">You: {lastUserMessage.content}</p>
					<p className="text-sm mt-1">
						JARVIS:{" "}
						{lastAssistantMessage.isStreaming
							? `${lastAssistantMessage.content}${lastAssistantMessage.content ? "..." : "thinking..."}`
							: lastAssistantMessage.content}
					</p>
					{lastAssistantMessage.metadata?.confidence && (
						<div className="mt-1">
							<JarvisConfidence confidence={lastAssistantMessage.metadata.confidence} variant="inline" size="sm" />
						</div>
					)}
				</div>
			)}

			<form onSubmit={handleSubmit} className="flex gap-2">
				<Input
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Ask JARVIS..."
					disabled={!isConnected || isLoading}
					className="flex-1"
				/>
				<Button type="submit" disabled={!isConnected || isLoading}>
					{isLoading ? <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" /> : "Ask"}
				</Button>
			</form>
		</div>
	);
}

export default JarvisChat;
