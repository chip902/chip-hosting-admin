"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useJarvisFloating } from "@/hooks/use-jarvis-floating";
import { useJarvis } from "@/app/hooks/useJarvis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { JarvisChat, JarvisChatMinimal } from "@/components/JarvisChat";
import { JarvisAudioLevels as JarvisAudioRefresh } from "./JarvisAudioLevels";
import { JarvisCapabilityDashboard } from "@/components/JarvisCapabilityDashboard";
import { JarvisListeningIndicator } from "@/components/JarvisListeningIndicator";
import { JarvisWelcomeTutorial } from "@/components/JarvisWelcomeTutorial";
import { X, Minus, Square, Settings, MessageCircle, HelpCircle, GraduationCap, Move, Maximize2, Minimize2, RotateCcw, Expand, Bot } from "lucide-react";
import clsx from "clsx";

type ChatState = "closed" | "minimized" | "expanded";
type ChatSize = "small" | "medium" | "large" | "fullscreen";

interface Position {
	x: number;
	y: number;
}

interface Size {
	width: number;
	height: number;
}

// Define size presets without window reference (will calculate fullscreen dynamically)
const SIZE_PRESETS: Record<ChatSize, Size> = {
	small: { width: 400, height: 500 },
	medium: { width: 500, height: 700 },
	large: { width: 600, height: 800 },
	fullscreen: { width: 900, height: 700 }, // Default fallback, will be calculated dynamically
};

// Helper function to get fullscreen size
const getFullscreenSize = (): Size => {
	if (typeof window === "undefined") {
		return SIZE_PRESETS.fullscreen;
	}
	return { 
		width: window.innerWidth - 100, 
		height: window.innerHeight - 100 
	};
};

export function JarvisFloatingChatAdvanced() {
	const { chatState, setChatState, toggleChat, closeChat, minimizeChat, expandChat } = useJarvisFloating();
	const [showSettings, setShowSettings] = useState(false);
	const [showCapabilities, setShowCapabilities] = useState(false);
	const [showTutorial, setShowTutorial] = useState(false);
	const { isConnected, sendMessage } = useJarvis();

	// Position and size states
	const [position, setPosition] = useState<Position>({ x: 30, y: 30 });
	const [size, setSize] = useState<Size>(SIZE_PRESETS.medium);
	const [currentSizePreset, setCurrentSizePreset] = useState<ChatSize>("medium");
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
	const [resizeStart, setResizeStart] = useState<{ width: number; height: number; x: number; y: number }>({
		width: 0,
		height: 0,
		x: 0,
		y: 0,
	});

	const panelRef = useRef<HTMLDivElement>(null);

	// Check if user is first time (only on client after mount)
	const [isFirstTime, setIsFirstTime] = useState(false);

	// Load saved position and size, and check first-time status
	useEffect(() => {
		if (typeof window !== "undefined") {
			// Check if first time user
			const tutorialCompleted = localStorage.getItem("jarvis-tutorial-completed");
			setIsFirstTime(tutorialCompleted !== "true");

			// Load saved position
			const savedPosition = localStorage.getItem("jarvis-position");
			const savedSize = localStorage.getItem("jarvis-size");

			if (savedPosition) {
				try {
					setPosition(JSON.parse(savedPosition));
				} catch (e) {}
			}

			if (savedSize) {
				try {
					setSize(JSON.parse(savedSize));
				} catch (e) {}
			}
		}
	}, []);

	// Save position and size
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("jarvis-position", JSON.stringify(position));
			localStorage.setItem("jarvis-size", JSON.stringify(size));
		}
	}, [position, size]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const isInInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true";

			if ((e.metaKey || e.ctrlKey) && e.key === "k" && !isInInput) {
				e.preventDefault();
				toggleChat();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [toggleChat]);

	// Drag handling
	const handleDragStart = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			setIsDragging(true);
			// Store the offset from where the mouse clicked to maintain relative position
			setDragStart({
				x: window.innerWidth - e.clientX - position.x,
				y: window.innerHeight - e.clientY - position.y,
			});
		},
		[position]
	);

	const handleDragMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			// Calculate new position from right and bottom edges
			const newX = Math.max(30, Math.min(window.innerWidth - size.width - 30, window.innerWidth - e.clientX - dragStart.x));
			const newY = Math.max(30, Math.min(window.innerHeight - size.height - 30, window.innerHeight - e.clientY - dragStart.y));

			setPosition({ x: newX, y: newY });
		},
		[isDragging, dragStart, size]
	);

	const handleDragEnd = useCallback(() => {
		setIsDragging(false);
	}, []);

	// Resize handling
	const handleResizeStart = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsResizing(true);
			setResizeStart({
				width: size.width,
				height: size.height,
				x: e.clientX,
				y: e.clientY,
			});
			setCurrentSizePreset("medium"); // Reset to custom when manually resizing
		},
		[size]
	);

	const handleResizeMove = useCallback(
		(e: MouseEvent) => {
			if (!isResizing) return;

			// For top-left corner resize handle, movement direction is inverted:
			// - Moving left (negative delta) should increase width
			// - Moving up (negative delta) should increase height
			const deltaX = e.clientX - resizeStart.x;
			const deltaY = e.clientY - resizeStart.y;
			
			const newWidth = Math.max(350, Math.min(window.innerWidth - position.x - 30, resizeStart.width - deltaX));
			const newHeight = Math.max(400, Math.min(window.innerHeight - position.y - 30, resizeStart.height - deltaY));

			setSize({ width: newWidth, height: newHeight });
		},
		[isResizing, resizeStart, position]
	);

	const handleResizeEnd = useCallback(() => {
		setIsResizing(false);
	}, []);

	// Global mouse event listeners for drag and resize
	useEffect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", handleDragMove);
			document.addEventListener("mouseup", handleDragEnd);
			document.body.style.cursor = "move";

			return () => {
				document.removeEventListener("mousemove", handleDragMove);
				document.removeEventListener("mouseup", handleDragEnd);
				document.body.style.cursor = "";
			};
		}
	}, [isDragging, handleDragMove, handleDragEnd]);

	useEffect(() => {
		if (isResizing) {
			document.addEventListener("mousemove", handleResizeMove);
			document.addEventListener("mouseup", handleResizeEnd);
			document.body.style.cursor = "nwse-resize";

			return () => {
				document.removeEventListener("mousemove", handleResizeMove);
				document.removeEventListener("mouseup", handleResizeEnd);
				document.body.style.cursor = "";
			};
		}
	}, [isResizing, handleResizeMove, handleResizeEnd]);

	const handleToggleChat = () => {
		toggleChat();
	};

	const handleCloseChat = () => {
		closeChat();
		setShowSettings(false);
		setShowCapabilities(false);
		setShowTutorial(false);
	};

	const handleMinimizeChat = () => {
		minimizeChat();
		setShowSettings(false);
		setShowCapabilities(false);
		setShowTutorial(false);
	};

	const handleMaximizeChat = () => {
		expandChat();
	};

	const handleSizePreset = (preset: ChatSize) => {
		setCurrentSizePreset(preset);
		if (preset === "fullscreen") {
			const fullscreenSize = getFullscreenSize();
			setSize(fullscreenSize);
			setPosition({ x: 50, y: 50 });
		} else {
			setSize(SIZE_PRESETS[preset]);
		}
	};

	const handleResetPosition = () => {
		setPosition({ x: 30, y: 30 });
		setSize(SIZE_PRESETS.medium);
		setCurrentSizePreset("medium");
	};

	return (
		<>
			{/* Floating Chat Button - Always Visible */}
			{chatState === "closed" && (
				<div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
					{/* Tutorial Button for First-time Users */}
					{isFirstTime && (
						<Button
							onClick={() => {
								setShowTutorial(true);
								expandChat();
							}}
							size="sm"
							className="rounded-full bg-gradient-to-r from-brand-400 to-brand-500 hover:from-brand-500 hover:to-brand-600 shadow-lg animate-pulse">
							<GraduationCap className="h-4 w-4 text-white mr-1" />
							<span className="text-xs text-white">Tutorial</span>
						</Button>
					)}

					<Button
						onClick={handleToggleChat}
						size="lg"
						className="h-14 w-14 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-lg hover:shadow-xl transition-all duration-200 relative group">
						{/* Connection Status Indicator */}
						<div
							className={clsx("absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white", isConnected ? "bg-green-400" : "bg-red-400")}
						/>

						<MessageCircle className="h-6 w-6 text-white" />

						{/* Tooltip */}
						<div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
							Ask JARVIS (⌘K)
						</div>
					</Button>
				</div>
			)}

			{/* Minimized Chat Bar */}
			{chatState === "minimized" && (
				<div
					className="fixed z-50"
					style={{
						bottom: `${position.y}px`,
						right: `${position.x}px`,
					}}>
					<Card className="w-80 sm:w-80 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-800 shadow-lg border-0 ring-1 ring-gray-200 dark:ring-gray-700">
						<div
							className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-950/20 dark:to-brand-900/20 rounded-t-lg cursor-move"
							onMouseDown={handleDragStart}>
							<div className="flex items-center gap-3">
								<div className="p-2 bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg text-white">
									<Bot className="h-4 w-4" />
								</div>
								<span className="font-medium text-sm">JARVIS</span>
								<JarvisListeningIndicator variant="compact" className="ml-2" />
							</div>

							<div className="flex items-center gap-1">
								<Button variant="ghost" size="sm" onClick={handleMaximizeChat} className="h-6 w-6 p-0">
									<Square className="h-3 w-3" />
								</Button>
								<Button variant="ghost" size="sm" onClick={handleCloseChat} className="h-6 w-6 p-0">
									<X className="h-3 w-3" />
								</Button>
							</div>
						</div>

						<div className="p-4">
							<JarvisChatMinimal />
						</div>
					</Card>
				</div>
			)}

			{/* Expanded Chat Panel */}
			{chatState === "expanded" && (
				<div
					ref={panelRef}
					className="fixed z-50"
					style={{
						bottom: `${position.y}px`,
						right: `${position.x}px`,
						width: `${size.width}px`,
						height: `${size.height}px`,
						maxWidth: "calc(100vw - 60px)",
						maxHeight: "calc(100vh - 60px)",
					}}>
					<Card className="w-full h-full bg-white dark:bg-gray-800 shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-700 flex flex-col relative">
						{/* Resize Handle */}
						<div
							className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-10 hover:bg-brand-500/20 rounded-br-lg"
							onMouseDown={handleResizeStart}>
							<div className="absolute top-0.5 left-0.5 w-2 h-2 border-t-2 border-l-2 border-gray-400" />
						</div>

						{/* Header */}
						<div
							className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-950/20 dark:to-brand-900/20 rounded-t-lg border-b cursor-move select-none"
							onMouseDown={handleDragStart}>
							<div className="flex items-center gap-2">
								<div className="p-2 bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg text-white">
									<Bot className="h-4 w-4" />
								</div>
								<div>
									<h3 className="font-semibold text-sm bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
										JARVIS Assistant
									</h3>
									<p className="text-xs text-gray-500">AI Assistant • Press ⌘K to toggle</p>
								</div>
							</div>

							<div className="flex items-center gap-1">
								<JarvisListeningIndicator variant="compact" />

								{/* Size Presets */}
								<div className="flex items-center gap-1 mx-2 border-l pl-2">
									<Button
										variant={currentSizePreset === "small" ? "default" : "ghost"}
										size="sm"
										onClick={() => handleSizePreset("small")}
										className="h-6 px-2 text-xs">
										S
									</Button>
									<Button
										variant={currentSizePreset === "medium" ? "default" : "ghost"}
										size="sm"
										onClick={() => handleSizePreset("medium")}
										className="h-6 px-2 text-xs">
										M
									</Button>
									<Button
										variant={currentSizePreset === "large" ? "default" : "ghost"}
										size="sm"
										onClick={() => handleSizePreset("large")}
										className="h-6 px-2 text-xs">
										L
									</Button>
									<Button variant="ghost" size="sm" onClick={() => handleSizePreset("fullscreen")} className="h-6 w-6 p-0" title="Fullscreen">
										<Expand className="h-3 w-3" />
									</Button>
								</div>

								{/* Control Buttons */}
								<div className="flex items-center gap-1 border-l pl-2">
									<Button variant="ghost" size="sm" onClick={handleResetPosition} className="h-6 w-6 p-0" title="Reset position">
										<RotateCcw className="h-3 w-3" />
									</Button>
									<Button variant="ghost" size="sm" onClick={() => setShowTutorial(!showTutorial)} className="h-6 w-6 p-0" title="Tutorial">
										<GraduationCap className="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowCapabilities(!showCapabilities)}
										className="h-6 w-6 p-0"
										title="Show capabilities">
										<HelpCircle className="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setShowSettings(!showSettings)}
										className="h-6 w-6 p-0"
										title="Audio settings">
										<Settings className="h-3 w-3" />
									</Button>
									<Button variant="ghost" size="sm" onClick={handleMinimizeChat} className="h-6 w-6 p-0">
										<Minus className="h-3 w-3" />
									</Button>
									<Button variant="ghost" size="sm" onClick={handleCloseChat} className="h-6 w-6 p-0">
										<X className="h-3 w-3" />
									</Button>
								</div>
							</div>
						</div>

						{/* Tutorial Panel */}
						{showTutorial && (
							<div className="border-b bg-gray-50 dark:bg-gray-800 p-4 overflow-y-auto max-h-96">
								<JarvisWelcomeTutorial
									onComplete={() => {
										localStorage.setItem("jarvis-tutorial-completed", "true");
										setShowTutorial(false);
									}}
									onSkip={() => setShowTutorial(false)}
									onTryFeature={async (prompt) => {
										await sendMessage(prompt);
										setShowTutorial(false);
									}}
								/>
							</div>
						)}

						{/* Capabilities Panel */}
						{showCapabilities && (
							<div className="border-b bg-gray-50 dark:bg-gray-800 overflow-y-auto max-h-96">
								<JarvisCapabilityDashboard
									onPromptSelect={async (prompt) => {
										await sendMessage(prompt);
										setShowCapabilities(false);
									}}
									onClose={() => setShowCapabilities(false)}
								/>
							</div>
						)}

						{/* Settings Panel */}
						{showSettings && (
							<div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
								<div className="flex items-center gap-2 mb-3">
									<span className="text-sm font-medium">Audio Device Management</span>
									<Badge variant="outline" className="text-xs">
										JARVIS Integration
									</Badge>
								</div>
								<JarvisAudioRefresh className="w-full" />
							</div>
						)}

						{/* Chat Content */}
						<div className="flex-1 min-h-0 overflow-hidden">
							<JarvisChat
								className="h-full border-none rounded-none rounded-b-lg"
								showStatus={false} // Hide status since we show it in header
								enableVoice={true}
								enableStreaming={true}
								showConfidence={true}
								showSources={true}
								maxHeight="none"
								theme="auto"
							/>
						</div>
					</Card>
				</div>
			)}
		</>
	);
}
